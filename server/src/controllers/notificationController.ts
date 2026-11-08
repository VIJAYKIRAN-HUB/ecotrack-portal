import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { NotificationService } from '../services/notificationService.js';

export class NotificationController {
  static async getMyNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const unreadOnly = req.query.unread === 'true';
      const notifications = await NotificationService.getUserNotifications(userId, unreadOnly);
      const unreadCount = await NotificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        notifications,
        unreadCount,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const success = await NotificationService.markAsRead(parseInt(id, 10), userId);

      res.status(200).json({ success, message: 'Notification marked as read.' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const count = await NotificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: `Marked ${count} notifications as read.`,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
