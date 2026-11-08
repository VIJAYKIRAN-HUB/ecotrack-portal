import { Response } from 'express';
import { StatsService } from '../services/statsService.js';
import { DuplicateService } from '../services/duplicateService.js';
import { AuthService } from '../services/authService.js';
import { queryAll, queryOne, execute } from '../database/db.js';
import { collections, isMongoConnected } from '../database/mongo.js';
import { generateCsv } from '../utils/csv.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ActivityLog } from '../types/index.js';

export class AdminController {
  /**
   * Comprehensive metrics for admin dashboard
   */
  static async getOverview(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const metrics = await StatsService.getOverviewMetrics();
      const statusDist = await StatsService.getStatusDistribution();
      const categoryDist = await StatsService.getCategoryDistribution();
      const priorityDist = await StatsService.getPriorityDistribution();
      const localityDist = await StatsService.getLocalityDistribution();
      const trends = await StatsService.getDailyTrends(14);
      const workerStats = await StatsService.getWorkerWorkloadStats();

      res.status(200).json({
        success: true,
        metrics,
        statusDistribution: statusDist,
        categoryDistribution: categoryDist,
        priorityDistribution: priorityDist,
        localityDistribution: localityDist,
        trends,
        workers: workerStats,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Analytics page data with configurable trend duration
   */
  static async getAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const metrics = await StatsService.getOverviewMetrics();
      const trends = await StatsService.getDailyTrends(days);
      const categoryDist = await StatsService.getCategoryDistribution();
      const priorityDist = await StatsService.getPriorityDistribution();
      const localityDist = await StatsService.getLocalityDistribution();
      const workers = await StatsService.getWorkerWorkloadStats();

      res.status(200).json({
        success: true,
        metrics,
        trends,
        categoryDistribution: categoryDist,
        priorityDistribution: priorityDist,
        localityDistribution: localityDist,
        workers,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Export complaints as CSV
   */
  static async exportCsv(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (isMongoConnected()) {
        const complaints = await collections()
          .complaints.find({ deleted_at: null })
          .sort({ created_at: -1 })
          .toArray();

        const rows: any[] = [];
        for (const c of complaints) {
          let citizenName = 'Unknown';
          let citizenEmail = '';
          let workerName = '';

          if (c.citizen_id) {
            const citizen = await collections().users.findOne({ id: c.citizen_id });
            if (citizen) {
              citizenName = citizen.name;
              citizenEmail = citizen.email;
            }
          }

          if (c.assigned_worker_id) {
            const worker = await collections().users.findOne({ id: c.assigned_worker_id });
            if (worker) {
              workerName = worker.name;
            }
          }

          rows.push({
            'Complaint ID': c.public_complaint_id,
            'Title': c.title,
            'Category': c.category,
            'Priority': c.priority,
            'Status': c.status,
            'Locality': c.locality,
            'Address': c.address,
            'Latitude': c.latitude ?? '',
            'Longitude': c.longitude ?? '',
            'Citizen Name': citizenName,
            'Citizen Email': citizenEmail,
            'Assigned Worker': workerName,
            'Submitted At': c.created_at,
            'Resolved At': c.resolved_at || '',
            'Resolution Note': c.resolution_note || '',
          });
        }

        const csvContent = generateCsv(rows);
        const filename = `ecotrack-complaints-${new Date().toISOString().slice(0, 10)}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(csvContent);
        return;
      }

      // Fallback SQLite
      const rows = queryAll(
        `SELECT 
           c.public_complaint_id as "Complaint ID",
           c.title as "Title",
           c.category as "Category",
           c.priority as "Priority",
           c.status as "Status",
           c.locality as "Locality",
           c.address as "Address",
           c.latitude as "Latitude",
           c.longitude as "Longitude",
           u.name as "Citizen Name",
           u.email as "Citizen Email",
           w.name as "Assigned Worker",
           c.created_at as "Submitted At",
           c.resolved_at as "Resolved At",
           c.resolution_note as "Resolution Note"
         FROM complaints c
         JOIN users u ON c.citizen_id = u.id
         LEFT JOIN users w ON c.assigned_worker_id = w.id
         WHERE c.deleted_at IS NULL
         ORDER BY c.created_at DESC`
      );

      const csvContent = generateCsv(rows);
      const filename = `ecotrack-complaints-${new Date().toISOString().slice(0, 10)}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvContent);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Sanitation workers directory & workload
   */
  static async getWorkers(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const workers = await StatsService.getWorkerWorkloadStats();
      res.status(200).json({ success: true, workers });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Create a new sanitation worker account
   */
  static async createWorker(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, email, password, phone } = req.body;
      if (!name || !email || !password) {
        res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
        return;
      }

      const adminId = req.user!.id;
      const worker = await AuthService.createWorker({ name, email, password, phone }, adminId);

      res.status(201).json({
        success: true,
        message: 'Sanitation worker account created successfully.',
        worker,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * Toggle worker active/inactive status
   */
  static async updateWorkerStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { active } = req.body;
      const workerId = parseInt(id, 10);

      if (isMongoConnected()) {
        await collections().users.updateOne(
          { id: workerId, role: 'worker' },
          { $set: { active: active ? 1 : 0, updated_at: new Date().toISOString() } }
        );

        res.status(200).json({
          success: true,
          message: `Worker account ${active ? 'activated' : 'deactivated'}.`,
        });
        return;
      }

      execute(`UPDATE users SET active = ? WHERE id = ? AND role = 'worker'`, [
        active ? 1 : 0,
        workerId,
      ]);

      res.status(200).json({
        success: true,
        message: `Worker account ${active ? 'activated' : 'deactivated'}.`,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * Get duplicate detection reports
   */
  static async getDuplicates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const statusFilter = (req.query.status as string) || 'suspected';
      const duplicates = await DuplicateService.getDuplicateList(statusFilter);

      res.status(200).json({
        success: true,
        duplicates: duplicates.map((d: any) => ({
          ...d,
          match_reasons: typeof d.match_reasons === 'string' ? JSON.parse(d.match_reasons || '[]') : (d.match_reasons || []),
        })),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Confirm suspected duplicate
   */
  static async confirmDuplicate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { duplicateId, primaryId } = req.body;
      if (!duplicateId || !primaryId) {
        res.status(400).json({ success: false, message: 'duplicateId and primaryId are required.' });
        return;
      }

      await DuplicateService.confirmDuplicate(
        parseInt(duplicateId, 10),
        parseInt(primaryId, 10),
        req.user!.id
      );

      res.status(200).json({
        success: true,
        message: 'Complaint marked as duplicate.',
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * Reject suspected duplicate (not a duplicate)
   */
  static async rejectDuplicate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { duplicateId, primaryId } = req.body;
      if (!duplicateId || !primaryId) {
        res.status(400).json({ success: false, message: 'duplicateId and primaryId are required.' });
        return;
      }

      await DuplicateService.rejectDuplicate(
        parseInt(duplicateId, 10),
        parseInt(primaryId, 10),
        req.user!.id
      );

      res.status(200).json({
        success: true,
        message: 'Duplicate flag dismissed.',
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * Recent activity and audit logs
   */
  static async getActivityLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = (page - 1) * limit;

      if (isMongoConnected()) {
        const total = await collections().activityLogs.countDocuments();
        const rawLogs = await collections().activityLogs
          .find()
          .sort({ created_at: -1 })
          .skip(offset)
          .limit(limit)
          .toArray();

        const logs = [];
        for (const l of rawLogs) {
          let userName = (l as any).user_name;
          let userRole = (l as any).user_role;
          if (!userName && (l as any).user_id) {
            const u = await collections().users.findOne({ id: (l as any).user_id });
            if (u) {
              userName = u.name;
              userRole = u.role;
            }
          }
          logs.push({
            ...l,
            user_name: userName || 'System',
            user_role: userRole || 'admin',
          });
        }

        res.status(200).json({
          success: true,
          logs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
          },
        });
        return;
      }

      // Fallback SQLite
      const totalRow = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM activity_logs`);
      const total = totalRow?.count || 0;

      const logs = queryAll<ActivityLog>(
        `SELECT 
           a.*,
           u.name as user_name,
           u.role as user_role
         FROM activity_logs a
         LEFT JOIN users u ON a.user_id = u.id
         ORDER BY a.created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      res.status(200).json({
        success: true,
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
