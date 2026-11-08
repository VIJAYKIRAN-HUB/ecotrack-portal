import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import { seedDatabase } from '../src/database/seed.js';

describe('Complaints CRUD & Workflow API', () => {
  let citizenToken: string;
  let adminToken: string;
  let workerToken: string;
  let createdComplaintId: number;

  beforeAll(async () => {
    await seedDatabase(true);

    // Login citizen
    const citRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'citizen@example.com', password: 'Citizen@123' });
    citizenToken = citRes.body.token;

    // Login admin
    const admRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@ecotrack.gov', password: 'Admin@123' });
    adminToken = admRes.body.token;

    // Login worker
    const wrkRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'worker@ecotrack.gov', password: 'Worker@123' });
    workerToken = wrkRes.body.token;
  });

  it('citizen submits a new complaint with generated public ID', async () => {
    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title: 'Overflowing bin near hospital gate',
        description: 'Medical and municipal waste overflowing at hospital back entry gate.',
        category: 'Overflowing Dustbin',
        priority: 'urgent',
        address: 'MG Road, near Bowring Hospital',
        locality: 'MG Road',
        latitude: 12.9815,
        longitude: 77.6042,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.complaint.public_complaint_id).toMatch(/^ECO-\d{4}-\d{5}$/);
    expect(res.body.complaint.status).toBe('Submitted');
    createdComplaintId = res.body.complaint.id;
  });

  it('admin verifies the complaint', async () => {
    const res = await request(app)
      .post(`/api/complaints/${createdComplaintId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'Verified',
        note: 'Admin verified location and severity on-site.',
      });

    expect(res.status).toBe(200);
    expect(res.body.complaint.status).toBe('Verified');
  });

  it('admin assigns complaint to sanitation worker', async () => {
    // Worker ID 5 is Ramesh Kumar
    const res = await request(app)
      .post(`/api/complaints/${createdComplaintId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        workerId: 5,
        notes: 'Priority hospital zone cleanup.',
      });

    expect(res.status).toBe(200);
    expect(res.body.complaint.status).toBe('Assigned');
    expect(res.body.complaint.assigned_worker_id).toBe(5);
  });

  it('worker marks task as In Progress', async () => {
    const res = await request(app)
      .post(`/api/worker/tasks/${createdComplaintId}/in-progress`)
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ note: 'Worker dispatched with compactor truck.' });

    expect(res.status).toBe(200);
    expect(res.body.complaint.status).toBe('In Progress');
  });

  it('worker resolves task with resolution note', async () => {
    const res = await request(app)
      .post(`/api/worker/tasks/${createdComplaintId}/resolve`)
      .set('Authorization', `Bearer ${workerToken}`)
      .send({
        resolutionNote: 'Hospital perimeter cleared, bins sanitized with disinfectant spray.',
      });

    expect(res.status).toBe(200);
    expect(res.body.complaint.status).toBe('Resolved');
    expect(res.body.complaint.resolved_at).toBeDefined();
  });

  it('citizen views their resolved complaint and timeline history', async () => {
    const res = await request(app)
      .get(`/api/complaints/${createdComplaintId}`)
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.complaint.status).toBe('Resolved');
    expect(res.body.complaint.status_history.length).toBeGreaterThanOrEqual(4);
  });
});
