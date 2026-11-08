import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ComplaintService } from '../services/complaintService.js';
import { queryAll } from '../database/db.js';
import { collections, isMongoConnected } from '../database/mongo.js';

export class WorkerController {
  /**
   * Get active tasks assigned to logged-in worker
   */
  static async getMyTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const workerId = req.user!.id;

      if (isMongoConnected()) {
        const complaints = await collections()
          .complaints.find({
            assigned_worker_id: workerId,
            deleted_at: null,
            status: { $in: ['Assigned', 'In Progress'] },
          })
          .toArray();

        // Priority order weighting
        const priorityRank: Record<string, number> = {
          urgent: 1,
          high: 2,
          medium: 3,
          low: 4,
        };

        complaints.sort((a: any, b: any) => {
          const rankA = priorityRank[a.priority] || 5;
          const rankB = priorityRank[b.priority] || 5;
          if (rankA !== rankB) return rankA - rankB;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        const tasks: any[] = [];
        for (const c of complaints) {
          let citizenName = 'Citizen';
          if (c.citizen_id) {
            const citizen = await collections().users.findOne({ id: c.citizen_id });
            if (citizen) citizenName = citizen.name;
          }

          const beforeImgDoc = await collections().complaintImages.findOne({
            complaint_id: c.id,
            image_type: 'before',
          });

          tasks.push({
            ...c,
            citizen_name: citizenName,
            before_image_url: beforeImgDoc ? beforeImgDoc.image_url : (c.images?.[0]?.image_url || null),
          });
        }

        res.status(200).json({ success: true, tasks });
        return;
      }

      // Fallback SQLite
      const tasks = queryAll(
        `SELECT 
           c.*,
           (SELECT image_url FROM complaint_images WHERE complaint_id = c.id AND image_type = 'before' LIMIT 1) as before_image_url,
           u.name as citizen_name
         FROM complaints c
         JOIN users u ON c.citizen_id = u.id
         WHERE c.assigned_worker_id = ? 
           AND c.deleted_at IS NULL
           AND c.status IN ('Assigned', 'In Progress')
         ORDER BY 
           CASE c.priority 
             WHEN 'urgent' THEN 1 
             WHEN 'high' THEN 2 
             WHEN 'medium' THEN 3 
             ELSE 4 
           END,
           c.created_at ASC`,
        [workerId]
      );

      res.status(200).json({ success: true, tasks });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get completed resolution history for logged-in worker
   */
  static async getTaskHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const workerId = req.user!.id;

      if (isMongoConnected()) {
        const complaints = await collections()
          .complaints.find({
            assigned_worker_id: workerId,
            deleted_at: null,
            status: 'Resolved',
          })
          .sort({ resolved_at: -1 })
          .toArray();

        const history: any[] = [];
        for (const c of complaints) {
          const beforeImgDoc = await collections().complaintImages.findOne({
            complaint_id: c.id,
            image_type: 'before',
          });

          const afterImgDoc = await collections().complaintImages.findOne({
            complaint_id: c.id,
            image_type: 'after',
          });

          history.push({
            ...c,
            before_image_url: beforeImgDoc ? beforeImgDoc.image_url : null,
            after_image_url: afterImgDoc ? afterImgDoc.image_url : null,
          });
        }

        res.status(200).json({ success: true, history });
        return;
      }

      // Fallback SQLite
      const history = queryAll(
        `SELECT 
           c.*,
           (SELECT image_url FROM complaint_images WHERE complaint_id = c.id AND image_type = 'before' LIMIT 1) as before_image_url,
           (SELECT image_url FROM complaint_images WHERE complaint_id = c.id AND image_type = 'after' LIMIT 1) as after_image_url
         FROM complaints c
         WHERE c.assigned_worker_id = ? 
           AND c.deleted_at IS NULL
           AND c.status = 'Resolved'
         ORDER BY c.resolved_at DESC`,
        [workerId]
      );

      res.status(200).json({ success: true, history });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Worker updates task state to 'In Progress'
   */
  static async markInProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const complaintId = parseInt(id, 10);
      const workerId = req.user!.id;
      const { note } = req.body;

      const updated = await ComplaintService.updateStatus(
        complaintId,
        'In Progress',
        workerId,
        'worker',
        note || 'Sanitation worker is on-site and cleaning has begun.'
      );

      res.status(200).json({
        success: true,
        message: 'Task marked as In Progress.',
        complaint: updated,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * Worker completes cleanup and marks task as Resolved
   */
  static async resolveTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const complaintId = parseInt(id, 10);
      const workerId = req.user!.id;
      const { resolutionNote } = req.body;

      let afterImageUrl: string | undefined = req.body.afterImageUrl;
      if (req.file) {
        afterImageUrl = `/uploads/${req.file.filename}`;
      }

      if (!resolutionNote) {
        res.status(400).json({
          success: false,
          message: 'A resolution note describing the cleanup is required.',
        });
        return;
      }

      const updated = await ComplaintService.resolveComplaint(
        complaintId,
        workerId,
        'worker',
        resolutionNote,
        afterImageUrl
      );

      res.status(200).json({
        success: true,
        message: 'Task resolved successfully with after-cleaning photo and notes.',
        complaint: updated,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
