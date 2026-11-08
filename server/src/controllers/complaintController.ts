import { Response } from 'express';
import { ComplaintService } from '../services/complaintService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { DuplicateService } from '../services/duplicateService.js';

export class ComplaintController {
  /**
   * Submit new waste complaint with optional photo attachments
   */
  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const citizenId = req.user!.id;
      const {
        title,
        description,
        category,
        priority,
        address,
        locality,
        latitude,
        longitude,
      } = req.body;

      if (!title || !description || !category || !address || !locality) {
        res.status(400).json({
          success: false,
          message: 'Title, description, category, address, and locality are required.',
        });
        return;
      }

      // Collect image URLs from multer files or body
      const imageUrls: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          imageUrls.push(`/uploads/${file.filename}`);
        }
      } else if (req.file) {
        imageUrls.push(`/uploads/${req.file.filename}`);
      } else if (req.body.imageUrls && Array.isArray(req.body.imageUrls)) {
        imageUrls.push(...req.body.imageUrls);
      }

      const complaint = await ComplaintService.createComplaint({
        citizenId,
        title,
        description,
        category,
        priority,
        address,
        locality,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        imageUrls,
      });

      res.status(201).json({
        success: true,
        message: 'Complaint submitted successfully.',
        complaint,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to submit complaint.' });
    }
  }

  /**
   * List complaints with filtering, search, and pagination
   */
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const query = req.query as any;
      const user = req.user;

      const filters: any = {
        page: query.page ? parseInt(query.page, 10) : 1,
        limit: query.limit ? parseInt(query.limit, 10) : 10,
        search: query.search,
        category: query.category,
        status: query.status,
        priority: query.priority,
        locality: query.locality,
        startDate: query.startDate,
        endDate: query.endDate,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      };

      // Citizen view scoping:
      // If citizen requests complaints without `scope=all`, only return their complaints
      if (user?.role === 'citizen') {
        if (query.scope !== 'public') {
          filters.citizenId = user.id;
        } else {
          // Public scope: exclude withdrawn/rejected
          filters.excludeDuplicates = true;
        }
      } else if (user?.role === 'worker' && query.scope === 'assigned') {
        filters.assignedWorkerId = user.id;
      }

      const result = await ComplaintService.listComplaints(filters);

      // Mask sensitive citizen details if public view
      if (query.scope === 'public') {
        result.data = result.data.map((c: any) => ({
          ...c,
          citizen_email: undefined,
          citizen_phone: undefined,
        }));
      }

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to fetch complaints.' });
    }
  }

  /**
   * Check for potential duplicates before or during submission
   */
  static async checkDuplicates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, description, category, latitude, longitude } = req.body;
      if (!title || !description || !category) {
        res.status(400).json({ success: false, message: 'Title, description and category are required.' });
        return;
      }

      const matches = await DuplicateService.findPotentialDuplicates({
        title,
        description,
        category,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      });

      res.status(200).json({
        success: true,
        matches,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get single complaint by ID or public ID
   */
  static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const complaint = await ComplaintService.getComplaintById(id);

      if (!complaint) {
        res.status(404).json({ success: false, message: 'Complaint not found.' });
        return;
      }

      // If user is a citizen and not their complaint, mask private contact info
      if (req.user?.role === 'citizen' && complaint.citizen_id !== req.user.id) {
        complaint.citizen_email = undefined;
      }

      res.status(200).json({
        success: true,
        complaint,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Edit complaint details
   */
  static async edit(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const complaintId = parseInt(id, 10);
      const user = req.user!;

      const updated = await ComplaintService.editComplaint(
        complaintId,
        user.id,
        user.role,
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Complaint updated successfully.',
        complaint: updated,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * Update complaint status
   */
  static async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const complaintId = parseInt(id, 10);
      const { status, note } = req.body;
      const user = req.user!;

      if (!status) {
        res.status(400).json({ success: false, message: 'New status is required.' });
        return;
      }

      const updated = await ComplaintService.updateStatus(
        complaintId,
        status,
        user.id,
        user.role,
        note
      );

      res.status(200).json({
        success: true,
        message: `Status updated to ${status}.`,
        complaint: updated,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * Assign worker to complaint
   */
  static async assign(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const complaintId = parseInt(id, 10);
      const { workerId, notes } = req.body;
      const adminId = req.user!.id;

      if (!workerId) {
        res.status(400).json({ success: false, message: 'workerId is required.' });
        return;
      }

      const updated = await ComplaintService.assignWorker(
        complaintId,
        parseInt(workerId, 10),
        adminId,
        notes
      );

      res.status(200).json({
        success: true,
        message: 'Sanitation worker assigned successfully.',
        complaint: updated,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * Resolve complaint with note and resolution photo
   */
  static async resolve(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const complaintId = parseInt(id, 10);
      const { resolutionNote } = req.body;
      const user = req.user!;

      let afterImageUrl: string | undefined = req.body.afterImageUrl;
      if (req.file) {
        afterImageUrl = `/uploads/${req.file.filename}`;
      }

      const updated = await ComplaintService.resolveComplaint(
        complaintId,
        user.id,
        user.role,
        resolutionNote,
        afterImageUrl
      );

      res.status(200).json({
        success: true,
        message: 'Complaint resolved successfully.',
        complaint: updated,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * Citizen or admin reopen resolved complaint
   */
  static async reopen(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const complaintId = parseInt(id, 10);
      const { note } = req.body;
      const user = req.user!;

      const updated = await ComplaintService.updateStatus(
        complaintId,
        'Reopened',
        user.id,
        user.role,
        note || 'Reopened by citizen'
      );

      res.status(200).json({
        success: true,
        message: 'Complaint reopened.',
        complaint: updated,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * Delete or withdraw complaint
   */
  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const complaintId = parseInt(id, 10);
      const { reason } = req.body;
      const user = req.user!;

      await ComplaintService.deleteOrWithdrawComplaint(
        complaintId,
        user.id,
        user.role,
        reason
      );

      res.status(200).json({
        success: true,
        message: 'Complaint withdrawn or deleted successfully.',
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * Upload image endpoint
   */
  static uploadImage(req: AuthenticatedRequest, res: Response): void {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image file provided.' });
      return;
    }

    res.status(200).json({
      success: true,
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
    });
  }
}
