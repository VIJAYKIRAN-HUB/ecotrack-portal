import { collections, isMongoConnected } from '../database/mongo.js';
import { queryOne } from '../database/db.js';

export async function generatePublicComplaintId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `ECO-${currentYear}-`;

  if (isMongoConnected()) {
    try {
      const col = collections().complaints;
      const latest = await col
        .find({ public_complaint_id: { $regex: `^${prefix}` } })
        .sort({ public_complaint_id: -1 })
        .limit(1)
        .toArray();

      let nextSeq = 1;
      if (latest.length > 0 && latest[0].public_complaint_id) {
        const parts = latest[0].public_complaint_id.split('-');
        if (parts.length === 3) {
          const lastSeq = parseInt(parts[2], 10);
          if (!isNaN(lastSeq)) {
            nextSeq = lastSeq + 1;
          }
        }
      }

      const paddedSeq = String(nextSeq).padStart(5, '0');
      return `${prefix}${paddedSeq}`;
    } catch {
      // Fallback below
    }
  }

  // Fallback if MongoDB not yet connected
  try {
    const row = queryOne<{ public_complaint_id: string }>(
      `SELECT public_complaint_id FROM complaints 
       WHERE public_complaint_id LIKE ? 
       ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`]
    );

    let nextSeq = 1;
    if (row && row.public_complaint_id) {
      const parts = row.public_complaint_id.split('-');
      if (parts.length === 3) {
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) {
          nextSeq = lastSeq + 1;
        }
      }
    }

    const paddedSeq = String(nextSeq).padStart(5, '0');
    return `${prefix}${paddedSeq}`;
  } catch {
    const random = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}${random}`;
  }
}
