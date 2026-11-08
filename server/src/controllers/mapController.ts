import { Request, Response } from 'express';
import { queryAll } from '../database/db.js';
import { collections, isMongoConnected } from '../database/mongo.js';

export class MapController {
  static async getMapPoints(req: Request, res: Response): Promise<void> {
    try {
      const { category, status, priority } = req.query;

      if (isMongoConnected()) {
        const filter: any = {
          latitude: { $ne: null },
          longitude: { $ne: null },
          deleted_at: null,
          is_duplicate: 0,
        };

        if (category) filter.category = category;
        if (status) filter.status = status;
        if (priority) filter.priority = priority;

        const complaints = await collections()
          .complaints.find(filter)
          .sort({ created_at: -1 })
          .limit(200)
          .toArray();

        const points: any[] = [];
        for (const c of complaints) {
          const beforeImg = await collections().complaintImages.findOne({
            complaint_id: c.id,
            image_type: 'before',
          });

          points.push({
            id: c.id,
            public_complaint_id: c.public_complaint_id,
            title: c.title,
            category: c.category,
            status: c.status,
            priority: c.priority,
            address: c.address,
            locality: c.locality,
            latitude: c.latitude,
            longitude: c.longitude,
            created_at: c.created_at,
            before_image_url: beforeImg ? beforeImg.image_url : (c.images?.[0]?.image_url || null),
          });
        }

        res.status(200).json({
          success: true,
          count: points.length,
          points,
        });
        return;
      }

      // Fallback SQLite
      const conditions: string[] = [
        'latitude IS NOT NULL',
        'longitude IS NOT NULL',
        'deleted_at IS NULL',
        'is_duplicate = 0',
      ];
      const params: any[] = [];

      if (category) {
        conditions.push('category = ?');
        params.push(category);
      }

      if (status) {
        conditions.push('status = ?');
        params.push(status);
      }

      if (priority) {
        conditions.push('priority = ?');
        params.push(priority);
      }

      const whereSql = conditions.join(' AND ');

      const points = queryAll(
        `SELECT 
           c.id,
           c.public_complaint_id,
           c.title,
           c.category,
           c.status,
           c.priority,
           c.address,
           c.locality,
           c.latitude,
           c.longitude,
           c.created_at,
           (SELECT image_url FROM complaint_images WHERE complaint_id = c.id AND image_type = 'before' LIMIT 1) as before_image_url
         FROM complaints c
         WHERE ${whereSql}
         ORDER BY c.created_at DESC
         LIMIT 200`,
        params
      );

      res.status(200).json({
        success: true,
        count: points.length,
        points,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
