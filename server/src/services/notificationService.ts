import { collections, isMongoConnected, getNextSequence } from '../database/mongo.js';
import { queryAll, queryOne, execute } from '../database/db.js';
import { Notification } from '../types/index.js';

export class NotificationService {
  static async createNotification(
    userId: number,
    title: string,
    message: string,
    relatedComplaintId?: number | null,
    relatedPublicId?: string | null
  ): Promise<number> {
    if (isMongoConnected()) {
      try {
        const id = await getNextSequence('notification_id');
        const doc = {
          id,
          user_id: userId,
          title,
          message,
          related_complaint_id: relatedComplaintId || null,
          related_public_id: relatedPublicId || null,
          is_read: 0,
          created_at: new Date().toISOString(),
        };

        await collections().notifications.insertOne(doc);
        return id;
      } catch (err) {
        console.warn('MongoDB notification create fallback to SQLite:', err);
      }
    }

    // Fallback SQLite
    const res = execute(
      `INSERT INTO notifications (user_id, title, message, related_complaint_id)
       VALUES (?, ?, ?, ?)`,
      [userId, title, message, relatedComplaintId || null]
    );
    return res.lastInsertRowid;
  }

  static async getUserNotifications(userId: number, unreadOnly: boolean = false): Promise<Notification[]> {
    if (isMongoConnected()) {
      try {
        const filter: any = { user_id: userId };
        if (unreadOnly) {
          filter.is_read = 0;
        }

        const items = await collections()
          .notifications.find(filter)
          .sort({ created_at: -1 })
          .limit(50)
          .toArray();

        return items.map((doc: any) => ({
          id: doc.id,
          user_id: doc.user_id,
          title: doc.title,
          message: doc.message,
          related_complaint_id: doc.related_complaint_id,
          related_public_id: doc.related_public_id,
          is_read: doc.is_read,
          created_at: doc.created_at,
        }));
      } catch (err) {
        console.warn('MongoDB notification fetch fallback to SQLite:', err);
      }
    }

    // Fallback SQLite
    let sql = `
      SELECT n.*, c.public_complaint_id as related_public_id
      FROM notifications n
      LEFT JOIN complaints c ON n.related_complaint_id = c.id
      WHERE n.user_id = ?
    `;
    const params: any[] = [userId];

    if (unreadOnly) {
      sql += ' AND n.is_read = 0';
    }

    sql += ' ORDER BY n.created_at DESC LIMIT 50';

    return queryAll<Notification>(sql, params);
  }

  static async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    if (isMongoConnected()) {
      try {
        const res = await collections().notifications.updateOne(
          { id: notificationId, user_id: userId },
          { $set: { is_read: 1 } }
        );
        return res.modifiedCount > 0;
      } catch (err) {
        console.warn('MongoDB markAsRead fallback to SQLite:', err);
      }
    }

    const res = execute(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );
    return res.changes > 0;
  }

  static async markAllAsRead(userId: number): Promise<number> {
    if (isMongoConnected()) {
      try {
        const res = await collections().notifications.updateMany(
          { user_id: userId, is_read: 0 },
          { $set: { is_read: 1 } }
        );
        return res.modifiedCount;
      } catch (err) {
        console.warn('MongoDB markAllAsRead fallback to SQLite:', err);
      }
    }

    const res = execute(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    return res.changes;
  }

  static async getUnreadCount(userId: number): Promise<number> {
    if (isMongoConnected()) {
      try {
        return await collections().notifications.countDocuments({
          user_id: userId,
          is_read: 0,
        });
      } catch (err) {
        console.warn('MongoDB unreadCount fallback to SQLite:', err);
      }
    }

    const row = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    return row ? row.count : 0;
  }
}
