import { collections, isMongoConnected } from '../database/mongo.js';
import { queryAll, execute } from '../database/db.js';
import { calculateDistanceMeters } from '../utils/geo.js';
import { config } from '../config.js';

interface DuplicateCandidateInput {
  id?: number;
  title: string;
  description: string;
  category: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface DuplicateMatchResult {
  primaryComplaintId: number;
  primaryPublicId: string;
  primaryTitle: string;
  similarityScore: number;
  matchReasons: string[];
}

function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return new Set(words);
}

function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionCount++;
    }
  }
  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

export class DuplicateService {
  /**
   * Evaluates a complaint against recent non-deleted complaints in MongoDB to find potential duplicates.
   */
  static async findPotentialDuplicates(candidate: DuplicateCandidateInput): Promise<DuplicateMatchResult[]> {
    const candidateTitleTokens = tokenize(candidate.title);
    const candidateDescTokens = tokenize(candidate.description);

    let recentComplaints: any[] = [];

    if (isMongoConnected()) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const filter: any = {
        deleted_at: null,
        is_duplicate: 0,
        created_at: { $gte: thirtyDaysAgo },
      };
      if (candidate.id) {
        filter.id = { $ne: candidate.id };
      }

      recentComplaints = await collections()
        .complaints.find(filter)
        .sort({ id: -1 })
        .limit(100)
        .toArray();
    } else {
      // Fallback SQLite
      recentComplaints = queryAll(
        `SELECT id, public_complaint_id, title, description, category, latitude, longitude, created_at
         FROM complaints
         WHERE deleted_at IS NULL AND is_duplicate = 0 ${candidate.id ? 'AND id != ?' : ''}
         ORDER BY id DESC LIMIT 100`,
        candidate.id ? [candidate.id] : []
      );
    }

    const matches: DuplicateMatchResult[] = [];

    for (const item of recentComplaints) {
      let score = 0;
      const reasons: string[] = [];

      // 1. Category agreement
      if (item.category === candidate.category) {
        score += 25;
        reasons.push(`Matching category: "${candidate.category}" (+25%)`);
      }

      // 2. Geographic proximity (if both coordinates are present)
      if (
        candidate.latitude !== null &&
        candidate.latitude !== undefined &&
        candidate.longitude !== null &&
        candidate.longitude !== undefined &&
        item.latitude !== null &&
        item.longitude !== null
      ) {
        const distance = calculateDistanceMeters(
          candidate.latitude,
          candidate.longitude,
          item.latitude,
          item.longitude
        );

        if (distance <= 100) {
          score += 35;
          reasons.push(`Very close location: ~${Math.round(distance)}m away (+35%)`);
        } else if (distance <= 300) {
          score += 25;
          reasons.push(`Nearby location: ~${Math.round(distance)}m away (+25%)`);
        } else if (distance <= 600) {
          score += 15;
          reasons.push(`In immediate vicinity: ~${Math.round(distance)}m away (+15%)`);
        }
      }

      // 3. Title text similarity
      const itemTitleTokens = tokenize(item.title);
      const titleSim = jaccardSimilarity(candidateTitleTokens, itemTitleTokens);
      if (titleSim > 0.3) {
        const pts = Math.min(25, Math.round(titleSim * 30));
        score += pts;
        reasons.push(`High title text similarity: ${Math.round(titleSim * 100)}% (+${pts}%)`);
      }

      // 4. Description text similarity
      const itemDescTokens = tokenize(item.description);
      const descSim = jaccardSimilarity(candidateDescTokens, itemDescTokens);
      if (descSim > 0.3) {
        const pts = Math.min(15, Math.round(descSim * 20));
        score += pts;
        reasons.push(`Description content overlap: ${Math.round(descSim * 100)}% (+${pts}%)`);
      }

      // If score meets configured threshold
      if (score >= config.duplicateSimilarityThreshold) {
        matches.push({
          primaryComplaintId: item.id,
          primaryPublicId: item.public_complaint_id,
          primaryTitle: item.title,
          similarityScore: Math.min(100, score),
          matchReasons: reasons,
        });
      }
    }

    return matches.sort((a, b) => b.similarityScore - a.similarityScore);
  }

  /**
   * Save suspected duplicate relationship if threshold reached in MongoDB
   */
  static async recordSuspectedDuplicate(
    primaryId: number,
    duplicateId: number,
    score: number,
    reasons: string[]
  ): Promise<void> {
    if (primaryId === duplicateId) return;

    if (isMongoConnected()) {
      await collections().duplicateRelationships.updateOne(
        { primary_complaint_id: primaryId, duplicate_complaint_id: duplicateId },
        {
          $set: {
            primary_complaint_id: primaryId,
            duplicate_complaint_id: duplicateId,
            similarity_score: score,
            match_reasons: reasons,
            status: 'suspected',
            created_at: new Date().toISOString(),
          },
        },
        { upsert: true }
      );
      return;
    }

    // Fallback SQLite
    execute(
      `INSERT INTO duplicate_relationships 
       (primary_complaint_id, duplicate_complaint_id, similarity_score, match_reasons, status)
       VALUES (?, ?, ?, ?, 'suspected')
       ON CONFLICT(primary_complaint_id, duplicate_complaint_id) DO UPDATE SET
         similarity_score = excluded.similarity_score,
         match_reasons = excluded.match_reasons`,
      [primaryId, duplicateId, score, JSON.stringify(reasons)]
    );
  }

  /**
   * Administrator confirms duplicate complaint in MongoDB
   */
  static async confirmDuplicate(
    duplicateComplaintId: number,
    primaryComplaintId: number,
    adminUserId: number
  ): Promise<void> {
    const now = new Date().toISOString();

    if (isMongoConnected()) {
      await collections().complaints.updateOne(
        { id: duplicateComplaintId },
        {
          $set: {
            is_duplicate: 1,
            duplicate_of_id: primaryIdOrNum(primaryComplaintId),
            updated_at: now,
          },
        }
      );

      await collections().duplicateRelationships.updateOne(
        { primary_complaint_id: primaryComplaintId, duplicate_complaint_id: duplicateComplaintId },
        {
          $set: {
            status: 'confirmed',
            reviewed_by_id: adminUserId,
            reviewed_at: now,
          },
        }
      );

      await collections().activityLogs.insertOne({
        user_id: adminUserId,
        action: 'CONFIRM_DUPLICATE',
        details: `Admin confirmed complaint #${duplicateComplaintId} is a duplicate of #${primaryComplaintId}`,
        created_at: now,
      });

      return;
    }

    // SQLite Fallback
    execute(
      `UPDATE complaints SET is_duplicate = 1, duplicate_of_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [primaryComplaintId, duplicateComplaintId]
    );
  }

  /**
   * Administrator marks duplicate as false positive
   */
  static async rejectDuplicate(
    duplicateComplaintId: number,
    primaryComplaintId: number,
    adminUserId: number
  ): Promise<void> {
    const now = new Date().toISOString();

    if (isMongoConnected()) {
      await collections().duplicateRelationships.updateOne(
        { primary_complaint_id: primaryComplaintId, duplicate_complaint_id: duplicateComplaintId },
        {
          $set: {
            status: 'rejected',
            reviewed_by_id: adminUserId,
            reviewed_at: now,
          },
        }
      );

      await collections().activityLogs.insertOne({
        user_id: adminUserId,
        action: 'REJECT_DUPLICATE',
        details: `Admin dismissed duplicate flag between #${duplicateComplaintId} and #${primaryComplaintId}`,
        created_at: now,
      });

      return;
    }

    // SQLite Fallback
    execute(
      `UPDATE duplicate_relationships SET status = 'rejected', reviewed_by_id = ?, reviewed_at = CURRENT_TIMESTAMP WHERE primary_complaint_id = ? AND duplicate_complaint_id = ?`,
      [adminUserId, primaryComplaintId, duplicateComplaintId]
    );
  }

  /**
   * Retrieves duplicate records for admin dashboard
   */
  static async getDuplicateList(statusFilter: string = 'suspected') {
    if (isMongoConnected()) {
      const pairs = await collections()
        .duplicateRelationships.find({ status: statusFilter })
        .sort({ similarity_score: -1 })
        .toArray();

      const enriched: any[] = [];
      const complaintsCol = collections().complaints;

      for (const p of pairs) {
        const primary = await complaintsCol.findOne({ id: p.primary_complaint_id });
        const duplicate = await complaintsCol.findOne({ id: p.duplicate_complaint_id });

        if (primary && duplicate) {
          enriched.push({
            id: p.id || p.primary_complaint_id,
            primary_complaint_id: p.primary_complaint_id,
            duplicate_complaint_id: p.duplicate_complaint_id,
            similarity_score: p.similarity_score,
            match_reasons: p.match_reasons,
            status: p.status,
            reviewed_at: p.reviewed_at,
            created_at: p.created_at,
            primary_public_id: primary.public_complaint_id,
            primary_title: primary.title,
            primary_category: primary.category,
            primary_status: primary.status,
            primary_created_at: primary.created_at,
            duplicate_public_id: duplicate.public_complaint_id,
            duplicate_title: duplicate.title,
            duplicate_category: duplicate.category,
            duplicate_status: duplicate.status,
            duplicate_created_at: duplicate.created_at,
          });
        }
      }

      return enriched;
    }

    // SQLite Fallback
    const rows = queryAll(
      `SELECT dr.*, p.public_complaint_id as primary_public_id, p.title as primary_title, p.category as primary_category, p.status as primary_status, p.created_at as primary_created_at, d.public_complaint_id as duplicate_public_id, d.title as duplicate_title, d.category as duplicate_category, d.status as duplicate_status, d.created_at as duplicate_created_at
       FROM duplicate_relationships dr
       JOIN complaints p ON dr.primary_complaint_id = p.id
       JOIN complaints d ON dr.duplicate_complaint_id = d.id
       WHERE dr.status = ?
       ORDER BY dr.similarity_score DESC, dr.created_at DESC`,
      [statusFilter]
    );

    return rows.map((r: any) => ({
      ...r,
      match_reasons: typeof r.match_reasons === 'string' ? JSON.parse(r.match_reasons) : r.match_reasons,
    }));
  }
}

function primaryIdOrNum(id: any): number {
  return Number(id);
}
