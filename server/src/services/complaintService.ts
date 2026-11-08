import { collections, isMongoConnected, getNextSequence } from '../database/mongo.js';
import { generatePublicComplaintId } from '../utils/idGenerator.js';
import { DuplicateService } from './duplicateService.js';
import { NotificationService } from './notificationService.js';
import { queryAll, queryOne, execute } from '../database/db.js';
import {
  Complaint,
  ComplaintImage,
  ComplaintPriority,
  ComplaintStatus,
  ComplaintStatusHistory,
  UserRole,
  WasteCategory,
} from '../types/index.js';

export interface CreateComplaintDTO {
  citizenId: number;
  title: string;
  description: string;
  category: WasteCategory;
  priority?: ComplaintPriority;
  address: string;
  locality: string;
  latitude?: number | null;
  longitude?: number | null;
  imageUrls?: string[];
}

export interface ComplaintFilterQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  priority?: string;
  locality?: string;
  assignedWorkerId?: number;
  citizenId?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  excludeDuplicates?: boolean;
}

export class ComplaintService {
  /**
   * Submits a new complaint with public ID, image associations, initial history, and duplicate checks.
   */
  static async createComplaint(dto: CreateComplaintDTO): Promise<Complaint> {
    const publicId = await generatePublicComplaintId();
    const priority = dto.priority || 'medium';
    const now = new Date().toISOString();

    if (isMongoConnected()) {
      const col = collections().complaints;
      const id = await getNextSequence('complaint_id');

      // Get citizen details
      const citizen = await collections().users.findOne({ id: dto.citizenId });
      const citizenName = citizen ? citizen.name : 'Citizen';
      const citizenEmail = citizen ? citizen.email : '';

      // Prepare images
      const images: ComplaintImage[] = [];
      if (dto.imageUrls && dto.imageUrls.length > 0) {
        for (const url of dto.imageUrls) {
          const imgId = await getNextSequence('image_id');
          const imgDoc: ComplaintImage = {
            id: imgId,
            complaint_id: id,
            image_url: url,
            image_type: 'before',
            uploaded_by_id: dto.citizenId,
            created_at: now,
          };
          images.push(imgDoc);
          await collections().complaintImages.insertOne(imgDoc);
        }
      }

      // Prepare initial status history
      const histId = await getNextSequence('history_id');
      const initialHistory: ComplaintStatusHistory = {
        id: histId,
        complaint_id: id,
        previous_status: null,
        new_status: 'Submitted',
        changed_by_id: dto.citizenId,
        changed_by_name: citizenName,
        changed_by_role: 'citizen',
        note: 'Complaint filed by citizen',
        created_at: now,
      };
      await collections().complaintStatusHistory.insertOne(initialHistory);

      const complaintDoc: any = {
        id,
        public_complaint_id: publicId,
        citizen_id: dto.citizenId,
        citizen_name: citizenName,
        citizen_email: citizenEmail,
        title: dto.title.trim(),
        description: dto.description.trim(),
        category: dto.category,
        priority,
        status: 'Submitted' as ComplaintStatus,
        address: dto.address.trim(),
        locality: dto.locality.trim(),
        latitude: dto.latitude || null,
        longitude: dto.longitude || null,
        assigned_worker_id: null,
        assigned_worker_name: null,
        resolution_note: null,
        duplicate_of_id: null,
        is_duplicate: 0,
        created_at: now,
        updated_at: now,
        resolved_at: null,
        deleted_at: null,
        images,
        status_history: [initialHistory],
      };

      await col.insertOne(complaintDoc);

      // Record activity log
      await collections().activityLogs.insertOne({
        id: await getNextSequence('activity_id'),
        user_id: dto.citizenId,
        user_name: citizenName,
        user_role: 'citizen',
        action: 'CREATE_COMPLAINT',
        details: `Submitted complaint ${publicId} ("${dto.title}")`,
        created_at: now,
      });

      // Notify citizen
      await NotificationService.createNotification(
        dto.citizenId,
        'Complaint Submitted',
        `Your complaint (${publicId}) has been successfully submitted and is awaiting municipal verification.`,
        id,
        publicId
      );

      // Run duplicate detection
      const suspected = await DuplicateService.findPotentialDuplicates({
        id,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        latitude: dto.latitude,
        longitude: dto.longitude,
      });

      if (suspected.length > 0) {
        const topMatch = suspected[0];
        await DuplicateService.recordSuspectedDuplicate(
          topMatch.primaryComplaintId,
          id,
          topMatch.similarityScore,
          topMatch.matchReasons
        );
      }

      return (await this.getComplaintById(id))!;
    }

    // Fallback SQLite
    const insertResult = execute(
      `INSERT INTO complaints 
       (public_complaint_id, citizen_id, title, description, category, priority, status, address, locality, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, 'Submitted', ?, ?, ?, ?)`,
      [
        publicId,
        dto.citizenId,
        dto.title.trim(),
        dto.description.trim(),
        dto.category,
        priority,
        dto.address.trim(),
        dto.locality.trim(),
        dto.latitude || null,
        dto.longitude || null,
      ]
    );

    const complaintId = insertResult.lastInsertRowid;

    if (dto.imageUrls && dto.imageUrls.length > 0) {
      for (const url of dto.imageUrls) {
        execute(
          `INSERT INTO complaint_images (complaint_id, image_url, image_type, uploaded_by_id)
           VALUES (?, ?, 'before', ?)`,
          [complaintId, url, dto.citizenId]
        );
      }
    }

    execute(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by_id, note)
       VALUES (?, NULL, 'Submitted', ?, 'Complaint filed by citizen')`,
      [complaintId, dto.citizenId]
    );

    execute(
      `INSERT INTO activity_logs (user_id, action, details)
       VALUES (?, 'CREATE_COMPLAINT', ?)`,
      [dto.citizenId, `Submitted complaint ${publicId} ("${dto.title}")`]
    );

    NotificationService.createNotification(
      dto.citizenId,
      'Complaint Submitted',
      `Your complaint (${publicId}) has been successfully submitted.`,
      complaintId,
      publicId
    );

    return (await this.getComplaintById(complaintId))!;
  }

  /**
   * Retrieve complaint by numeric ID or public ID with images and status history.
   */
  static async getComplaintById(idOrPublicId: number | string): Promise<Complaint | null> {
    const isNumeric = typeof idOrPublicId === 'number' || /^\d+$/.test(String(idOrPublicId));

    if (isMongoConnected()) {
      const col = collections().complaints;
      const query = isNumeric ? { id: Number(idOrPublicId) } : { public_complaint_id: idOrPublicId };

      const complaint = await col.findOne(query);
      if (!complaint || complaint.deleted_at) return null;

      // Ensure images and status history are populated
      if (!complaint.images || complaint.images.length === 0) {
        complaint.images = await collections()
          .complaintImages.find({ complaint_id: complaint.id })
          .toArray();
      }

      if (!complaint.status_history || complaint.status_history.length === 0) {
        complaint.status_history = await collections()
          .complaintStatusHistory.find({ complaint_id: complaint.id })
          .sort({ created_at: 1 })
          .toArray();
      }

      const { _id, ...cleanComplaint } = complaint as any;
      return cleanComplaint as Complaint;
    }

    // Fallback SQLite
    const whereClause = isNumeric ? 'c.id = ?' : 'c.public_complaint_id = ?';
    const complaint = queryOne<Complaint>(
      `SELECT 
         c.*,
         u.name as citizen_name,
         u.email as citizen_email,
         w.name as assigned_worker_name,
         parent.public_complaint_id as duplicate_of_public_id
       FROM complaints c
       JOIN users u ON c.citizen_id = u.id
       LEFT JOIN users w ON c.assigned_worker_id = w.id
       LEFT JOIN complaints parent ON c.duplicate_of_id = parent.id
       WHERE ${whereClause} AND c.deleted_at IS NULL`,
      [idOrPublicId]
    );

    if (!complaint) return null;

    complaint.images = queryAll<ComplaintImage>(
      `SELECT * FROM complaint_images WHERE complaint_id = ? ORDER BY id ASC`,
      [complaint.id]
    );

    complaint.status_history = queryAll<ComplaintStatusHistory>(
      `SELECT 
         h.*,
         u.name as changed_by_name,
         u.role as changed_by_role
       FROM complaint_status_history h
       JOIN users u ON h.changed_by_id = u.id
       WHERE h.complaint_id = ?
       ORDER BY h.created_at ASC`,
      [complaint.id]
    );

    return complaint;
  }

  /**
   * Paginated and filterable complaint listing from MongoDB.
   */
  static async listComplaints(filters: ComplaintFilterQuery) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 10));
    const offset = (page - 1) * limit;

    if (isMongoConnected()) {
      const col = collections().complaints;
      const query: any = { deleted_at: null };

      if (filters.excludeDuplicates) {
        query.is_duplicate = 0;
      }
      if (filters.citizenId) {
        query.citizen_id = filters.citizenId;
      }
      if (filters.assignedWorkerId) {
        query.assigned_worker_id = filters.assignedWorkerId;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.category) {
        query.category = filters.category;
      }
      if (filters.priority) {
        query.priority = filters.priority;
      }
      if (filters.locality) {
        query.locality = { $regex: filters.locality, $options: 'i' };
      }
      if (filters.startDate) {
        query.created_at = { ...(query.created_at || {}), $gte: filters.startDate };
      }
      if (filters.endDate) {
        query.created_at = { ...(query.created_at || {}), $lte: filters.endDate };
      }
      if (filters.search) {
        const term = filters.search.trim();
        query.$or = [
          { public_complaint_id: { $regex: term, $options: 'i' } },
          { title: { $regex: term, $options: 'i' } },
          { address: { $regex: term, $options: 'i' } },
          { locality: { $regex: term, $options: 'i' } },
          { citizen_name: { $regex: term, $options: 'i' } },
        ];
      }

      const total = await col.countDocuments(query);
      const sortField = filters.sortBy || 'created_at';
      const sortDirection = filters.sortOrder === 'ASC' ? 1 : -1;

      const rawComplaints = await col
        .find(query)
        .sort({ [sortField]: sortDirection })
        .skip(offset)
        .limit(limit)
        .toArray();

      const data = rawComplaints.map((c: any) => {
        const { _id, ...clean } = c;
        const beforeImg = clean.images?.find((img: any) => img.image_type === 'before');
        const afterImg = clean.images?.find((img: any) => img.image_type === 'after');
        return {
          ...clean,
          before_image_url: beforeImg ? beforeImg.image_url : undefined,
          after_image_url: afterImg ? afterImg.image_url : undefined,
        };
      });

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    // Fallback SQLite
    const conditions: string[] = ['c.deleted_at IS NULL'];
    const params: any[] = [];

    if (filters.excludeDuplicates) conditions.push('c.is_duplicate = 0');
    if (filters.citizenId) {
      conditions.push('c.citizen_id = ?');
      params.push(filters.citizenId);
    }
    if (filters.assignedWorkerId) {
      conditions.push('c.assigned_worker_id = ?');
      params.push(filters.assignedWorkerId);
    }
    if (filters.status) {
      conditions.push('c.status = ?');
      params.push(filters.status);
    }
    if (filters.category) {
      conditions.push('c.category = ?');
      params.push(filters.category);
    }
    if (filters.priority) {
      conditions.push('c.priority = ?');
      params.push(filters.priority);
    }
    if (filters.locality) {
      conditions.push('c.locality = ?');
      params.push(filters.locality);
    }

    if (filters.search) {
      const term = `%${filters.search.trim()}%`;
      conditions.push(
        '(c.public_complaint_id LIKE ? OR c.title LIKE ? OR c.address LIKE ? OR c.locality LIKE ? OR u.name LIKE ?)'
      );
      params.push(term, term, term, term, term);
    }

    const whereSql = conditions.join(' AND ');
    const countRow = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM complaints c JOIN users u ON c.citizen_id = u.id WHERE ${whereSql}`,
      params
    );
    const total = countRow?.count || 0;

    const complaints = queryAll<Complaint>(
      `SELECT 
         c.*,
         u.name as citizen_name,
         u.email as citizen_email,
         w.name as assigned_worker_name,
         (SELECT image_url FROM complaint_images WHERE complaint_id = c.id AND image_type = 'before' LIMIT 1) as before_image_url,
         (SELECT image_url FROM complaint_images WHERE complaint_id = c.id AND image_type = 'after' LIMIT 1) as after_image_url
       FROM complaints c
       JOIN users u ON c.citizen_id = u.id
       LEFT JOIN users w ON c.assigned_worker_id = w.id
       WHERE ${whereSql}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      data: complaints,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Citizen edits their submitted complaint in MongoDB
   */
  static async editComplaint(
    complaintId: number,
    userId: number,
    userRole: UserRole,
    updates: Partial<{
      title: string;
      description: string;
      category: WasteCategory;
      priority: ComplaintPriority;
      address: string;
      locality: string;
      latitude: number | null;
      longitude: number | null;
    }>
  ): Promise<Complaint> {
    const complaint = await this.getComplaintById(complaintId);
    if (!complaint) throw new Error('Complaint not found.');

    if (userRole === 'citizen') {
      if (complaint.citizen_id !== userId) {
        throw new Error('Unauthorized to edit this complaint.');
      }
      if (complaint.status !== 'Submitted') {
        throw new Error('Only complaints in "Submitted" status can be modified by citizens.');
      }
    }

    const updateFields: any = { updated_at: new Date().toISOString() };
    if (updates.title) updateFields.title = updates.title.trim();
    if (updates.description) updateFields.description = updates.description.trim();
    if (updates.category) updateFields.category = updates.category;
    if (updates.priority && userRole === 'admin') updateFields.priority = updates.priority;
    if (updates.address) updateFields.address = updates.address.trim();
    if (updates.locality) updateFields.locality = updates.locality.trim();
    if (updates.latitude !== undefined) updateFields.latitude = updates.latitude;
    if (updates.longitude !== undefined) updateFields.longitude = updates.longitude;

    if (isMongoConnected()) {
      await collections().complaints.updateOne({ id: complaintId }, { $set: updateFields });
      await collections().activityLogs.insertOne({
        id: await getNextSequence('activity_id'),
        user_id: userId,
        action: 'UPDATE_COMPLAINT',
        details: `Updated complaint ${complaint.public_complaint_id}`,
        created_at: new Date().toISOString(),
      });
      return (await this.getComplaintById(complaintId))!;
    }

    // SQLite Fallback
    execute(
      `UPDATE complaints SET title = COALESCE(?, title), description = COALESCE(?, description), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [updates.title, updates.description, complaintId]
    );
    return (await this.getComplaintById(complaintId))!;
  }

  /**
   * Enforces status workflow transitions and updates history in MongoDB.
   */
  static async updateStatus(
    complaintId: number,
    newStatus: ComplaintStatus,
    actingUserId: number,
    actingRole: UserRole,
    note?: string
  ): Promise<Complaint> {
    const complaint = await this.getComplaintById(complaintId);
    if (!complaint) throw new Error('Complaint not found.');

    const oldStatus = complaint.status;
    if (oldStatus === newStatus) return complaint;

    // Role permissions check
    if (newStatus === 'Withdrawn') {
      if (actingRole === 'citizen' && complaint.citizen_id !== actingUserId) {
        throw new Error('You can only withdraw your own complaints.');
      }
    } else if (newStatus === 'Reopened') {
      if (actingRole === 'citizen' && complaint.citizen_id !== actingUserId) {
        throw new Error('Only the complaint owner or an admin can reopen this issue.');
      }
    } else if (['Verified', 'Rejected'].includes(newStatus)) {
      if (actingRole !== 'admin') {
        throw new Error('Only municipal administrators can verify or reject complaints.');
      }
    } else if (newStatus === 'In Progress') {
      if (actingRole === 'worker' && complaint.assigned_worker_id !== actingUserId) {
        throw new Error('You can only set tasks assigned to you to in-progress.');
      }
    }

    const now = new Date().toISOString();

    if (isMongoConnected()) {
      const user = await collections().users.findOne({ id: actingUserId });
      const userName = user ? user.name : 'System';

      const histId = await getNextSequence('history_id');
      const histEntry: ComplaintStatusHistory = {
        id: histId,
        complaint_id: complaintId,
        previous_status: oldStatus,
        new_status: newStatus,
        changed_by_id: actingUserId,
        changed_by_name: userName,
        changed_by_role: actingRole,
        note: note || `Status updated to ${newStatus}`,
        created_at: now,
      };

      await collections().complaintStatusHistory.insertOne(histEntry);

      const updateData: any = {
        status: newStatus,
        updated_at: now,
      };
      if (newStatus === 'Resolved') {
        updateData.resolved_at = now;
      }

      await collections().complaints.updateOne(
        { id: complaintId },
        {
          $set: updateData,
          $push: { status_history: histEntry } as any,
        }
      );

      // Activity log
      await collections().activityLogs.insertOne({
        id: await getNextSequence('activity_id'),
        user_id: actingUserId,
        user_name: userName,
        user_role: actingRole,
        action: 'STATUS_CHANGE',
        details: `Status of ${complaint.public_complaint_id} changed from ${oldStatus} to ${newStatus}`,
        created_at: now,
      });

      // Notification to citizen
      await NotificationService.createNotification(
        complaint.citizen_id,
        `Complaint Status: ${newStatus}`,
        `Your complaint (${complaint.public_complaint_id}) status is now "${newStatus}".`,
        complaintId,
        complaint.public_complaint_id
      );

      return (await this.getComplaintById(complaintId))!;
    }

    // Fallback SQLite
    execute(
      `UPDATE complaints SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [newStatus, complaintId]
    );
    return (await this.getComplaintById(complaintId))!;
  }

  /**
   * Assigns sanitation worker to complaint in MongoDB.
   */
  static async assignWorker(
    complaintId: number,
    workerId: number,
    adminId: number,
    notes?: string
  ): Promise<Complaint> {
    const complaint = await this.getComplaintById(complaintId);
    if (!complaint) throw new Error('Complaint not found.');

    let worker: any = null;
    if (isMongoConnected()) {
      worker = await collections().users.findOne({ id: workerId, role: 'worker', active: 1 });
    } else {
      worker = queryOne(`SELECT id, name, role, active FROM users WHERE id = ?`, [workerId]);
    }

    if (!worker) {
      throw new Error('Target worker not found or is currently inactive.');
    }

    const now = new Date().toISOString();

    if (isMongoConnected()) {
      const admin = await collections().users.findOne({ id: adminId });
      const adminName = admin ? admin.name : 'Administrator';

      const assignmentDoc = {
        id: await getNextSequence('assignment_id'),
        complaint_id: complaintId,
        worker_id: workerId,
        worker_name: worker.name,
        assigned_by_id: adminId,
        status: 'assigned',
        notes: notes || null,
        assigned_at: now,
      };
      await collections().workerAssignments.insertOne(assignmentDoc);

      const histId = await getNextSequence('history_id');
      const histEntry: ComplaintStatusHistory = {
        id: histId,
        complaint_id: complaintId,
        previous_status: complaint.status,
        new_status: 'Assigned',
        changed_by_id: adminId,
        changed_by_name: adminName,
        changed_by_role: 'admin',
        note: `Assigned to worker ${worker.name}${notes ? `. Notes: ${notes}` : ''}`,
        created_at: now,
      };
      await collections().complaintStatusHistory.insertOne(histEntry);

      await collections().complaints.updateOne(
        { id: complaintId },
        {
          $set: {
            assigned_worker_id: workerId,
            assigned_worker_name: worker.name,
            status: 'Assigned',
            updated_at: now,
          },
          $push: { status_history: histEntry } as any,
        }
      );

      await NotificationService.createNotification(
        workerId,
        'New Task Assigned',
        `You have been assigned to complaint ${complaint.public_complaint_id} (${complaint.category}) at ${complaint.locality}.`,
        complaintId,
        complaint.public_complaint_id
      );

      await NotificationService.createNotification(
        complaint.citizen_id,
        'Worker Assigned',
        `Sanitation worker ${worker.name} has been assigned to address your report (${complaint.public_complaint_id}).`,
        complaintId,
        complaint.public_complaint_id
      );

      return (await this.getComplaintById(complaintId))!;
    }

    // Fallback SQLite
    execute(
      `UPDATE complaints SET assigned_worker_id = ?, status = 'Assigned', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [workerId, complaintId]
    );
    return (await this.getComplaintById(complaintId))!;
  }

  /**
   * Complete resolution with after-cleaning photo and notes in MongoDB.
   */
  static async resolveComplaint(
    complaintId: number,
    actingUserId: number,
    actingRole: UserRole,
    resolutionNote: string,
    afterImageUrl?: string
  ): Promise<Complaint> {
    const complaint = await this.getComplaintById(complaintId);
    if (!complaint) throw new Error('Complaint not found.');

    if (actingRole === 'worker' && complaint.assigned_worker_id !== actingUserId) {
      throw new Error('Only the assigned worker or an administrator can resolve this complaint.');
    }

    if (!resolutionNote || resolutionNote.trim().length === 0) {
      throw new Error('A detailed resolution note is required.');
    }

    const now = new Date().toISOString();

    if (isMongoConnected()) {
      const user = await collections().users.findOne({ id: actingUserId });
      const userName = user ? user.name : 'Officer';

      let afterImgDoc: ComplaintImage | null = null;
      if (afterImageUrl) {
        afterImgDoc = {
          id: await getNextSequence('image_id'),
          complaint_id: complaintId,
          image_url: afterImageUrl,
          image_type: 'after',
          uploaded_by_id: actingUserId,
          created_at: now,
        };
        await collections().complaintImages.insertOne(afterImgDoc);
      }

      const histId = await getNextSequence('history_id');
      const histEntry: ComplaintStatusHistory = {
        id: histId,
        complaint_id: complaintId,
        previous_status: complaint.status,
        new_status: 'Resolved',
        changed_by_id: actingUserId,
        changed_by_name: userName,
        changed_by_role: actingRole,
        note: `Cleaned and resolved: ${resolutionNote}`,
        created_at: now,
      };
      await collections().complaintStatusHistory.insertOne(histEntry);

      const updateOp: any = {
        $set: {
          status: 'Resolved',
          resolution_note: resolutionNote.trim(),
          resolved_at: now,
          updated_at: now,
        },
        $push: {
          status_history: histEntry,
          ...(afterImgDoc ? { images: afterImgDoc } : {}),
        } as any,
      };

      await collections().complaints.updateOne({ id: complaintId }, updateOp);

      await collections().workerAssignments.updateOne(
        { complaint_id: complaintId, worker_id: actingUserId },
        { $set: { status: 'completed', completed_at: now } }
      );

      await NotificationService.createNotification(
        complaint.citizen_id,
        'Issue Resolved 🎉',
        `Your complaint (${complaint.public_complaint_id}) has been cleaned and resolved! Check resolution photos and notes.`,
        complaintId,
        complaint.public_complaint_id
      );

      return (await this.getComplaintById(complaintId))!;
    }

    // Fallback SQLite
    execute(
      `UPDATE complaints SET status = 'Resolved', resolution_note = ?, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [resolutionNote.trim(), complaintId]
    );
    return (await this.getComplaintById(complaintId))!;
  }

  /**
   * Withdraw or soft delete complaint in MongoDB.
   */
  static async deleteOrWithdrawComplaint(
    complaintId: number,
    userId: number,
    userRole: UserRole,
    reason?: string
  ): Promise<boolean> {
    const complaint = await this.getComplaintById(complaintId);
    if (!complaint) throw new Error('Complaint not found.');

    if (userRole === 'citizen') {
      if (complaint.citizen_id !== userId) {
        throw new Error('Unauthorized.');
      }
      if (complaint.status !== 'Submitted') {
        await this.updateStatus(complaintId, 'Withdrawn', userId, userRole, reason || 'Withdrawn by citizen');
        return true;
      }
    }

    const now = new Date().toISOString();

    if (isMongoConnected()) {
      await collections().complaints.updateOne(
        { id: complaintId },
        { $set: { deleted_at: now, updated_at: now } }
      );
      await collections().activityLogs.insertOne({
        id: await getNextSequence('activity_id'),
        user_id: userId,
        action: 'DELETE_COMPLAINT',
        details: `Deleted complaint ${complaint.public_complaint_id}`,
        created_at: now,
      });
      return true;
    }

    // SQLite Fallback
    execute(`UPDATE complaints SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`, [complaintId]);
    return true;
  }
}
