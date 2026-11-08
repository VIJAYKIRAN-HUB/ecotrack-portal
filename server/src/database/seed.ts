import bcrypt from 'bcryptjs';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { getDatabase, initDatabase, execute, queryOne, execScript } from './db.js';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to create sample SVG test photos
function createSamplePhotos() {
  const uploadsDir = config.uploadDir;
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const beforeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="#fef2f2"/>
    <rect x="180" y="140" width="240" height="180" rx="10" fill="#991b1b" opacity="0.8"/>
    <path d="M160 140 L440 140 L410 120 L190 120 Z" fill="#7f1d1d"/>
    <circle cx="240" cy="240" r="30" fill="#f87171"/>
    <circle cx="340" cy="220" r="40" fill="#ea580c"/>
    <rect x="270" y="270" width="80" height="50" rx="5" fill="#ca8a04"/>
    <text x="300" y="70" font-family="sans-serif" font-size="22" font-weight="bold" fill="#991b1b" text-anchor="middle">REPORT PHOTO: GARBAGE ACCUMULATION</text>
    <text x="300" y="360" font-family="sans-serif" font-size="14" fill="#7f1d1d" text-anchor="middle">EcoTrack Evidence Photo - Before Cleanup</text>
  </svg>`;

  const afterSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="#f0fdf4"/>
    <rect x="180" y="140" width="240" height="180" rx="10" fill="#166534" opacity="0.8"/>
    <path d="M160 140 L440 140 L410 120 L190 120 Z" fill="#14532d"/>
    <circle cx="300" cy="220" r="30" fill="#22c55e"/>
    <path d="M285 220 L295 230 L315 210" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <text x="300" y="70" font-family="sans-serif" font-size="22" font-weight="bold" fill="#166534" text-anchor="middle">RESOLUTION PHOTO: SITE CLEANED</text>
    <text x="300" y="360" font-family="sans-serif" font-size="14" fill="#14532d" text-anchor="middle">EcoTrack Resolution Evidence - Verified Clean Area</text>
  </svg>`;

  const binBeforeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="#fffbeb"/>
    <rect x="220" y="160" width="160" height="180" rx="8" fill="#b45309"/>
    <circle cx="280" cy="140" r="35" fill="#f59e0b"/>
    <circle cx="330" cy="130" r="25" fill="#ef4444"/>
    <text x="300" y="70" font-family="sans-serif" font-size="22" font-weight="bold" fill="#b45309" text-anchor="middle">OVERFLOWING DUSTBIN EVIDENCE</text>
    <text x="300" y="370" font-family="sans-serif" font-size="14" fill="#78350f" text-anchor="middle">EcoTrack Evidence Photo - Before Clearance</text>
  </svg>`;

  fs.writeFileSync(path.join(uploadsDir, 'evidence-dumping-before.svg'), beforeSvg);
  fs.writeFileSync(path.join(uploadsDir, 'evidence-dumping-after.svg'), afterSvg);
  fs.writeFileSync(path.join(uploadsDir, 'evidence-bin-overflow.svg'), binBeforeSvg);
}

export async function seedDatabase(isReset: boolean = false) {
  console.log(`\n🌱 Starting EcoTrack Database Seeding (Reset: ${isReset})...`);

  createSamplePhotos();

  if (isReset) {
    const db = getDatabase();
    db.exec(`
      DROP TABLE IF EXISTS activity_logs;
      DROP TABLE IF EXISTS duplicate_relationships;
      DROP TABLE IF EXISTS notifications;
      DROP TABLE IF EXISTS worker_assignments;
      DROP TABLE IF EXISTS complaint_status_history;
      DROP TABLE IF EXISTS complaint_images;
      DROP TABLE IF EXISTS complaints;
      DROP TABLE IF EXISTS users;
    `);
    console.log('✓ Cleaned existing tables');
  }

  initDatabase();
  console.log('✓ Initialized schema');

  // Check if users already exist
  const existingUser = queryOne(`SELECT id FROM users LIMIT 1`);
  if (existingUser && !isReset) {
    console.log('⚠️ Database already contains records. Skipping seed. (Use --reset to force re-seed)');
    return;
  }

  // Common salt & password hash for demo accounts
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('Admin@123', salt);
  const citizenHash = await bcrypt.hash('Citizen@123', salt);
  const workerHash = await bcrypt.hash('Worker@123', salt);

  // 1. Seed Users
  // Admin
  execute(
    `INSERT INTO users (name, email, password_hash, role, phone, active)
     VALUES (?, ?, ?, 'admin', ?, 1)`,
    ['Rajesh Sharma (Municipal Admin)', 'admin@ecotrack.gov', adminHash, '+91 98450 11001']
  );
  const adminId = 1;

  // Citizens
  execute(
    `INSERT INTO users (name, email, password_hash, role, phone, active)
     VALUES (?, ?, ?, 'citizen', ?, 1)`,
    ['Aarav Patel', 'citizen@example.com', citizenHash, '+91 98765 43210']
  );
  const citizen1Id = 2;

  execute(
    `INSERT INTO users (name, email, password_hash, role, phone, active)
     VALUES (?, ?, ?, 'citizen', ?, 1)`,
    ['Priya Sharma', 'priya.sharma@example.com', citizenHash, '+91 98123 45678']
  );
  const citizen2Id = 3;

  execute(
    `INSERT INTO users (name, email, password_hash, role, phone, active)
     VALUES (?, ?, ?, 'citizen', ?, 1)`,
    ['Rahul Verma', 'rahul.verma@example.com', citizenHash, '+91 97234 56789']
  );
  const citizen3Id = 4;

  // Sanitation Workers
  execute(
    `INSERT INTO users (name, email, password_hash, role, phone, active)
     VALUES (?, ?, ?, 'worker', ?, 1)`,
    ['Ramesh Kumar', 'worker@ecotrack.gov', workerHash, '+91 94481 22334']
  );
  const worker1Id = 5;

  execute(
    `INSERT INTO users (name, email, password_hash, role, phone, active)
     VALUES (?, ?, ?, 'worker', ?, 1)`,
    ['Suresh Gowda', 'suresh.kumar@ecotrack.gov', workerHash, '+91 94481 33445']
  );
  const worker2Id = 6;

  execute(
    `INSERT INTO users (name, email, password_hash, role, phone, active)
     VALUES (?, ?, ?, 'worker', ?, 1)`,
    ['Anita Devi', 'anita.devi@ecotrack.gov', workerHash, '+91 94481 44556']
  );
  const worker3Id = 7;

  console.log('✓ Seeded Users (1 Admin, 3 Citizens, 3 Sanitation Workers)');

  // 2. Seed Realistic Complaints
  const sampleComplaints = [
    {
      publicId: 'ECO-2026-00001',
      citizenId: citizen1Id,
      title: 'Massive garbage pile near metro station entrance',
      description: 'Severe accumulation of rotting food, cardboard boxes, and unsegregated household waste blocking pedestrian sidewalk right outside Indiranagar Metro Gate B.',
      category: 'Garbage Accumulation',
      priority: 'urgent',
      status: 'Resolved',
      address: '100 Feet Rd, near Metro Gate B, Indiranagar',
      locality: 'Indiranagar',
      lat: 12.9784,
      lng: 77.6408,
      workerId: worker1Id,
      resolutionNote: 'Special sanitation truck deployed. 1.2 metric tons of accumulated waste cleared and transported to wet-waste composting unit. Disinfected pavement with lime powder.',
      daysAgo: 4,
      resolvedDaysAgo: 2,
      beforeImg: '/uploads/evidence-dumping-before.svg',
      afterImg: '/uploads/evidence-dumping-after.svg',
    },
    {
      publicId: 'ECO-2026-00002',
      citizenId: citizen2Id,
      title: 'Overflowing commercial dustbins outside 4th Block market',
      description: 'Three large green municipal bins have been spilling onto the main road since yesterday evening. Stray dogs and cattle scattering plastic food packets.',
      category: 'Overflowing Dustbin',
      priority: 'high',
      status: 'In Progress',
      address: '80 Feet Road, 4th Block, Koramangala',
      locality: 'Koramangala',
      lat: 12.9352,
      lng: 77.6245,
      workerId: worker1Id,
      resolutionNote: null,
      daysAgo: 1,
      resolvedDaysAgo: null,
      beforeImg: '/uploads/evidence-bin-overflow.svg',
      afterImg: null,
    },
    {
      publicId: 'ECO-2026-00003',
      citizenId: citizen1Id,
      title: 'Missed door-to-door morning waste pickup for 3 consecutive days',
      description: 'Sanitation truck has missed 9th Cross residential lane continuously from Monday to Wednesday. Residents left garbage bags on footpath.',
      category: 'Missed Waste Collection',
      priority: 'medium',
      status: 'Assigned',
      address: '9th Cross, 2nd Stage, Jayanagar',
      locality: 'Jayanagar',
      lat: 12.9250,
      lng: 77.5938,
      workerId: worker2Id,
      resolutionNote: null,
      daysAgo: 2,
      resolvedDaysAgo: null,
      beforeImg: '/uploads/evidence-dumping-before.svg',
      afterImg: null,
    },
    {
      publicId: 'ECO-2026-00004',
      citizenId: citizen3Id,
      title: 'Illegal midnight dumping of demolition concrete debris',
      description: 'Unidentified commercial tipper truck dumped approx 2 loads of broken bricks, tiles, and plaster blocks on the lake perimeter road.',
      category: 'Construction Waste',
      priority: 'high',
      status: 'Verified',
      address: 'Varthur Lake Outer Road, Whitefield',
      locality: 'Whitefield',
      lat: 12.9698,
      lng: 77.7499,
      workerId: null,
      resolutionNote: null,
      daysAgo: 3,
      resolvedDaysAgo: null,
      beforeImg: '/uploads/evidence-dumping-before.svg',
      afterImg: null,
    },
    {
      publicId: 'ECO-2026-00005',
      citizenId: citizen2Id,
      title: 'Plastic packaging & thermocol waste dumped in storm drain',
      description: 'Local wholesale electronics shops dumping styrofoam sheets and single-use plastic sheets into the open rainwater drain, creating flood risk.',
      category: 'Plastic Waste',
      priority: 'urgent',
      status: 'In Progress',
      address: 'Sampige Road, 7th Cross, Malleshwaram',
      locality: 'Malleshwaram',
      lat: 13.0031,
      lng: 77.5643,
      workerId: worker3Id,
      resolutionNote: null,
      daysAgo: 1,
      resolvedDaysAgo: null,
      beforeImg: '/uploads/evidence-dumping-before.svg',
      afterImg: null,
    },
    {
      publicId: 'ECO-2026-00006',
      citizenId: citizen1Id,
      title: 'Vegetable market organic waste decomposing by bus stand',
      description: 'Rotten vegetables and fruit peels piled up behind the public bus shelter, generating pungent odor and swarm of flies.',
      category: 'Organic Waste',
      priority: 'high',
      status: 'Resolved',
      address: 'HSR 27th Main, Sector 1, HSR Layout',
      locality: 'HSR Layout',
      lat: 12.9121,
      lng: 77.6446,
      workerId: worker2Id,
      resolutionNote: 'Cleared 800kg of wet waste and dispatched to biomass digestor. Sanitized area with floral bio-cleanser.',
      daysAgo: 5,
      resolvedDaysAgo: 4,
      beforeImg: '/uploads/evidence-dumping-before.svg',
      afterImg: '/uploads/evidence-dumping-after.svg',
    },
    {
      publicId: 'ECO-2026-00007',
      citizenId: citizen3Id,
      title: 'Hazardous discarded computer monitors and battery components',
      description: 'Old CRT monitors, broken batteries, and circuit boards dumped in empty plot behind tech park back gate.',
      category: 'Electronic Waste',
      priority: 'urgent',
      status: 'Verified',
      address: 'Outer Ring Road, Kadubeesanahalli',
      locality: 'Outer Ring Road',
      lat: 12.9366,
      lng: 77.6974,
      workerId: null,
      resolutionNote: null,
      daysAgo: 1,
      resolvedDaysAgo: null,
      beforeImg: '/uploads/evidence-dumping-before.svg',
      afterImg: null,
    },
    {
      publicId: 'ECO-2026-00008',
      citizenId: citizen1Id,
      title: 'Overflowing dustbin next to public playground',
      description: 'Single municipal dustbin completely overflowing with ice cream cups, plastic bottles, and juice cartons.',
      category: 'Overflowing Dustbin',
      priority: 'low',
      status: 'Submitted',
      address: 'Defence Colony Park, 12th Main, Indiranagar',
      locality: 'Indiranagar',
      lat: 12.9734,
      lng: 77.6391,
      workerId: null,
      resolutionNote: null,
      daysAgo: 0,
      resolvedDaysAgo: null,
      beforeImg: '/uploads/evidence-bin-overflow.svg',
      afterImg: null,
    },
    {
      publicId: 'ECO-2026-00009',
      citizenId: citizen2Id,
      title: 'Suspected duplicate: Metro gate B garbage collection issue',
      description: 'Garbage pile near metro station entrance gate B in Indiranagar needs clearing.',
      category: 'Garbage Accumulation',
      priority: 'medium',
      status: 'Submitted',
      address: '100 Feet Rd, near Metro Gate B, Indiranagar',
      locality: 'Indiranagar',
      lat: 12.9785,
      lng: 77.6409,
      workerId: null,
      resolutionNote: null,
      daysAgo: 3,
      resolvedDaysAgo: null,
      beforeImg: '/uploads/evidence-dumping-before.svg',
      afterImg: null,
    },
  ];

  for (const c of sampleComplaints) {
    const createdDate = `datetime('now', '-${c.daysAgo} days')`;
    const resolvedDate = c.resolvedDaysAgo !== null ? `datetime('now', '-${c.resolvedDaysAgo} days')` : 'NULL';

    const insertResult = execute(
      `INSERT INTO complaints 
       (public_complaint_id, citizen_id, title, description, category, priority, status, address, locality, latitude, longitude, assigned_worker_id, resolution_note, created_at, updated_at, resolved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${createdDate}, ${createdDate}, ${resolvedDate})`,
      [
        c.publicId,
        c.citizenId,
        c.title,
        c.description,
        c.category,
        c.priority,
        c.status,
        c.address,
        c.locality,
        c.lat,
        c.lng,
        c.workerId,
        c.resolutionNote,
      ]
    );

    const compId = insertResult.lastInsertRowid;

    // Before photo
    if (c.beforeImg) {
      execute(
        `INSERT INTO complaint_images (complaint_id, image_url, image_type, uploaded_by_id, created_at)
         VALUES (?, ?, 'before', ?, ${createdDate})`,
        [compId, c.beforeImg, c.citizenId]
      );
    }

    // After photo
    if (c.afterImg && c.workerId) {
      execute(
        `INSERT INTO complaint_images (complaint_id, image_url, image_type, uploaded_by_id, created_at)
         VALUES (?, ?, 'after', ?, ${resolvedDate})`,
        [compId, c.afterImg, c.workerId]
      );
    }

    // Status History
    execute(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by_id, note, created_at)
       VALUES (?, NULL, 'Submitted', ?, 'Report submitted by citizen', ${createdDate})`,
      [compId, c.citizenId]
    );

    if (['Verified', 'Assigned', 'In Progress', 'Resolved'].includes(c.status)) {
      execute(
        `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by_id, note, created_at)
         VALUES (?, 'Submitted', 'Verified', ?, 'Municipal admin verified validity and location', datetime(${createdDate}, '+2 hours'))`,
        [compId, adminId]
      );
    }

    if (c.workerId && ['Assigned', 'In Progress', 'Resolved'].includes(c.status)) {
      execute(
        `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by_id, note, created_at)
         VALUES (?, 'Verified', 'Assigned', ?, 'Task dispatched to sanitation officer', datetime(${createdDate}, '+4 hours'))`,
        [compId, adminId]
      );

      execute(
        `INSERT INTO worker_assignments (complaint_id, worker_id, assigned_by_id, status, assigned_at)
         VALUES (?, ?, ?, 'assigned', datetime(${createdDate}, '+4 hours'))`,
        [compId, c.workerId, adminId]
      );
    }

    if (['In Progress', 'Resolved'].includes(c.status) && c.workerId) {
      execute(
        `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by_id, note, created_at)
         VALUES (?, 'Assigned', 'In Progress', ?, 'Worker arrived on site with equipment', datetime(${createdDate}, '+6 hours'))`,
        [compId, c.workerId]
      );
    }

    if (c.status === 'Resolved' && c.workerId) {
      execute(
        `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by_id, note, created_at)
         VALUES (?, 'In Progress', 'Resolved', ?, ?, ${resolvedDate})`,
        [compId, c.workerId, c.resolutionNote]
      );
    }
  }

  console.log(`✓ Seeded ${sampleComplaints.length} Realistic Waste Complaints with Timeline History`);

  // 3. Seed Duplicate Relationship (Complaint 9 is duplicate of Complaint 1)
  const reasons = JSON.stringify([
    'Matching category: "Garbage Accumulation" (+25%)',
    'Very close location: ~12m away (+35%)',
    'High title text similarity: 78% (+23%)',
  ]);

  execute(
    `INSERT INTO duplicate_relationships (primary_complaint_id, duplicate_complaint_id, similarity_score, match_reasons, status)
     VALUES (1, 9, 83, ?, 'suspected')`,
    [reasons]
  );
  console.log('✓ Seeded Duplicate Detection Relationship (ECO-2026-00001 & ECO-2026-00009)');

  // 4. Seed Notifications
  const notifications = [
    {
      userId: citizen1Id,
      title: 'Issue Resolved 🎉',
      message: 'Your complaint ECO-2026-00001 has been cleaned and verified. Check resolution photos.',
      complaintId: 1,
      read: 1,
    },
    {
      userId: citizen2Id,
      title: 'Worker Dispatched',
      message: 'Sanitation worker Ramesh Kumar is actively addressing your report ECO-2026-00002.',
      complaintId: 2,
      read: 0,
    },
    {
      userId: worker1Id,
      title: 'New Priority Task',
      message: 'You have been assigned urgent task ECO-2026-00002 at Koramangala 80 Feet Road.',
      complaintId: 2,
      read: 0,
    },
    {
      userId: adminId,
      title: 'Potential Duplicate Flagged',
      message: 'High similarity (83%) detected between ECO-2026-00001 and ECO-2026-00009.',
      complaintId: 9,
      read: 0,
    },
  ];

  for (const n of notifications) {
    execute(
      `INSERT INTO notifications (user_id, title, message, related_complaint_id, is_read)
       VALUES (?, ?, ?, ?, ?)`,
      [n.userId, n.title, n.message, n.complaintId, n.read]
    );
  }
  console.log('✓ Seeded User Notifications');

  console.log('\n======================================================');
  console.log('🎉 EcoTrack Database Seeding Completed Successfully!');
  console.log('======================================================');
  console.log('DEMO ACCOUNTS (Documented in README.md):');
  console.log('  1. Municipal Admin:   admin@ecotrack.gov      / Admin@123');
  console.log('  2. Citizen Account:   citizen@example.com    / Citizen@123');
  console.log('  3. Sanitation Worker: worker@ecotrack.gov     / Worker@123');
  console.log('======================================================\n');
}

// Run directly from CLI
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  const isReset = process.argv.includes('--reset');
  seedDatabase(isReset)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed Error:', err);
      process.exit(1);
    });
}
