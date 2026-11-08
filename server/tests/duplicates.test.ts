import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import { seedDatabase } from '../src/database/seed.js';

describe('Duplicate Detection & Resolution Statistics', () => {
  let adminToken: string;

  beforeAll(async () => {
    await seedDatabase(true);

    const admRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@ecotrack.gov', password: 'Admin@123' });
    adminToken = admRes.body.token;
  });

  it('admin views detected duplicate candidates', async () => {
    const res = await request(app)
      .get('/api/admin/duplicates?status=suspected')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.duplicates.length).toBeGreaterThanOrEqual(1);
    expect(res.body.duplicates[0].similarity_score).toBeGreaterThan(50);
  });

  it('admin confirms duplicate complaint', async () => {
    const res = await request(app)
      .post('/api/admin/duplicates/confirm')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        duplicateId: 9,
        primaryId: 1,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('admin views verified operational analytics', async () => {
    const res = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.metrics.totalComplaints).toBeGreaterThan(0);
    expect(res.body.metrics.resolutionRate).toBeGreaterThanOrEqual(0);
    expect(res.body.statusDistribution).toBeDefined();
    expect(res.body.categoryDistribution).toBeDefined();
    expect(res.body.workers.length).toBeGreaterThan(0);
  });

  it('admin downloads CSV export of complaints', async () => {
    const res = await request(app)
      .get('/api/admin/export-csv')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.header['content-type']).toContain('text/csv');
    expect(res.text).toContain('Complaint ID');
    expect(res.text).toContain('ECO-2026-');
  });
});
