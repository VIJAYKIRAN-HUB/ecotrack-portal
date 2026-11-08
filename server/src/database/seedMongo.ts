import bcrypt from 'bcryptjs';
import path from 'node:path';
import fs from 'node:fs';
import { connectMongo, collections, getDb } from './mongo.js';
import { config } from '../config.js';

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

export async function seedMongoDatabase(isReset: boolean = false) {
  console.log(`\n🌱 Starting EcoTrack MongoDB Seeding (Reset: ${isReset})...`);

  // Ensure connected
  await connectMongo();
  const cols = collections();

  createSamplePhotos();

  if (isReset) {
    console.log('🍃 Clearing existing collections in MongoDB database...');
    await cols.users.deleteMany({});
    await cols.complaints.deleteMany({});
    await cols.complaintImages.deleteMany({});
    await cols.complaintStatusHistory.deleteMany({});
    await cols.workerAssignments.deleteMany({});
    await cols.notifications.deleteMany({});
    await cols.duplicateRelationships.deleteMany({});
    await cols.activityLogs.deleteMany({});
    await cols.counters.deleteMany({});
    console.log('✓ Cleared MongoDB collections.');
  }

  // Check if users already exist
  const existingCount = await cols.users.countDocuments({});
  if (existingCount > 0 && !isReset) {
    console.log('⚠️ MongoDB already contains user records. Skipping seed. (Use --reset to force re-seed)');
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('Admin@123', salt);
  const citizenHash = await bcrypt.hash('Citizen@123', salt);
  const workerHash = await bcrypt.hash('Worker@123', salt);

  const now = new Date();
  const nowIso = now.toISOString();

  // 1. Seed Users
  const users = [
    {
      id: 1,
      name: 'Rajesh Sharma (Municipal Admin)',
      email: 'admin@ecotrack.gov',
      password_hash: adminHash,
      role: 'admin',
      phone: '+91 98450 11001',
      active: 1,
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 2,
      name: 'Aarav Patel',
      email: 'citizen@example.com',
      password_hash: citizenHash,
      role: 'citizen',
      phone: '+91 98765 43210',
      active: 1,
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 3,
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      password_hash: citizenHash,
      role: 'citizen',
      phone: '+91 98123 45678',
      active: 1,
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 4,
      name: 'Rahul Verma',
      email: 'rahul.verma@example.com',
      password_hash: citizenHash,
      role: 'citizen',
      phone: '+91 97234 56789',
      active: 1,
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 5,
      name: 'Ramesh Kumar',
      email: 'worker@ecotrack.gov',
      password_hash: workerHash,
      role: 'worker',
      phone: '+91 94481 22334',
      active: 1,
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 6,
      name: 'Suresh Gowda',
      email: 'suresh.kumar@ecotrack.gov',
      password_hash: workerHash,
      role: 'worker',
      phone: '+91 94481 33445',
      active: 1,
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 7,
      name: 'Anita Devi',
      email: 'anita.devi@ecotrack.gov',
      password_hash: workerHash,
      role: 'worker',
      phone: '+91 94481 44556',
      active: 1,
      created_at: nowIso,
      updated_at: nowIso,
    },
  ];

  await cols.users.insertMany(users);
  console.log(`✓ Seeded ${users.length} Users into MongoDB (1 Admin, 3 Citizens, 3 Workers)`);

  // 2. Seed Realistic Complaints
  const sampleComplaints = [
    {
      id: 1,
      publicId: 'ECO-2026-00001',
      citizenId: 2,
      citizenName: 'Aarav Patel',
      title: 'Massive garbage pile near metro station entrance',
      description: 'Severe accumulation of rotting food, cardboard boxes, and unsegregated household waste blocking pedestrian sidewalk right outside Indiranagar Metro Gate B.',
      category: 'Garbage Accumulation',
      priority: 'urgent',
      status: 'Resolved',
      address: '100 Feet Rd, near Metro Gate B, Indiranagar',
      locality: 'Indiranagar',
      lat: 12.9784,
      lng: 77.6408,
      workerId: 5,
      workerName: 'Ramesh Kumar',
      resolutionNote: 'Special sanitation truck deployed. 1.2 metric tons of accumulated waste cleared and transported to wet-waste composting unit. Disinfected pavement with lime powder.',
      daysAgo: 4,
      resolvedDaysAgo: 2,
      beforeImg: '/uploads/evidence-dumping-before.svg',
      afterImg: '/uploads/evidence-dumping-after.svg',
    },
    {
      id: 2,
      publicId: 'ECO-2026-00002',
      citizenId: 3,
      citizenName: 'Priya Sharma',
      title: 'Overflowing commercial dustbins outside 4th Block market',
      description: 'Three large green municipal bins have been spilling onto the main road since yesterday evening. Stray dogs and cattle scattering plastic food packets.',
      category: 'Overflowing Dustbin',
      priority: 'high',
      status: 'In Progress',
      address: '80 Feet Road, 4th Block, Koramangala',
      locality: 'Koramangala',
      lat: 12.9352,
      lng: 77.6245,
      workerId: 5,
      workerName: 'Ramesh Kumar',
      resolutionNote: null,
      daysAgo: 1,
      resolvedDaysAgo: null,
      beforeImg: '/uploads/evidence-bin-overflow.svg',
      afterImg: null,
    },
    {
      id: 3,
      publicId: 'ECO-2026-00003',
      citizenId: 2,
      citizenName: 'Aarav Patel',
      title: 'Missed door-to-door morning waste pickup for 3 consecutive days',
      description: 'Sanitation truck has missed 9th Cross residential lane continuously from Monday to Wednesday. Residents left garbage bags on footpath.',
      category: 'Missed Waste Collection',
      priority: 'medium',
      status: 'Assigned',
      address: '9th Cross, 2nd Stage, Jayanagar',
      locality: 'Jayanagar',
      lat: 12.9250,
      lng: 77.5938,
      workerId: 6,
      workerName: 'Suresh Gowda',
      resolutionNote: null,
      daysAgo: 2,
      resolvedDaysAgo: null,
      beforeImg: '/uploads/evidence-dumping-before.svg',
      afterImg: null,
    },
    {
      id: 4,
      publicId: 'ECO-2026-00004',
      citizenId: 4,
      citizenName: 'Rahul Verma',
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
      workerName: null,
      resolutionNote: null,
      daysAgo: 3,
      resolvedDaysAgo: null,
      beforeImg: '/uploads/evidence-dumping-before.svg',
      afterImg: null,
    },
    {
      id: 5,
      publicId: 'ECO-2026-00005',
      citizenId: 3,
      citizenName: 'Priya Sharma',
      title: 'Plastic packaging & thermocol waste dumped in storm drain',
      description: 'Local wholesale electronics shops dumping styrofoam sheets and single-use plastic sheets into the open rainwater drain, creating flood risk.',
      category: 'Plastic Waste',
      priority: 'urgent',
      status: 'In Progress',
      address: 'Sampige Road, 7th Cross, Malleshwaram',
      locality: 'Malleshwaram',
      lat: 13.0031,
      lng: 77.5643,
      workerId: 7,
      workerName: 'Anita Devi',
      resolutionNote: null,
      daysAgo: 1,
      resolvedDaysAgo: null,
      beforeImg: '/uploads/evidence-dumping-before.svg',
      afterImg: null,
    },
    {
      id: 6,
      publicId: 'ECO-2026-00006',
      citizenId: 2,
      citizenName: 'Aarav Patel',
      title: 'Vegetable market organic waste decomposing by bus stand',
      description: 'Rotten vegetables and fruit peels piled up behind the public bus shelter, generating pungent odor and swarm of flies.',
      category: 'Organic Waste',
      priority: 'high',
      status: 'Resolved',
      address: 'HSR 27th Main, Sector 1, HSR Layout',
      locality: 'HSR Layout',
      lat: 12.9121,
      lng: 77.6446,
      workerId: 6,
      workerName: 'Suresh Gowda',
      resolutionNote: 'Cleared 800kg of wet waste and dispatched to biomass digestor. Sanitized area with floral bio-cleanser.',
      daysAgo: 5,
      resolvedDaysAgo: 4,
      beforeImg: '/uploads/evidence-dumping-before.svg',
      afterImg: '/uploads/evidence-dumping-after.svg',
    },
    {
      id: 7,
      publicId: 'ECO-2026-00007',
      citizenId: 4,
      citizenName: 'Rahul Verma',
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
      workerName: null,
      resolutionNote: null,
      daysAgo: 1,
      resolvedDaysAgo: null,
      beforeImg: '/uploads/evidence-dumping-before.svg',
      afterImg: null,
    },
    {
      id: 8,
      publicId: 'ECO-2026-00008',
      citizenId: 2,
      citizenName: 'Aarav Patel',
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
      workerName: null,
      resolutionNote: null,
      daysAgo: 0,
      resolvedDaysAgo: null,
      beforeImg: '/uploads/evidence-bin-overflow.svg',
      afterImg: null,
    },
    {
      id: 9,
      publicId: 'ECO-2026-00009',
      citizenId: 3,
      citizenName: 'Priya Sharma',
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
      workerName: null,
      resolutionNote: null,
      daysAgo: 3,
      resolvedDaysAgo: null,
      beforeImg: '/uploads/evidence-dumping-before.svg',
      afterImg: null,
    },
  ];

  let imgCounter = 1;
  let statusCounter = 1;
  let assignCounter = 1;

  for (const c of sampleComplaints) {
    const createdDate = new Date(Date.now() - c.daysAgo * 24 * 3600 * 1000).toISOString();
    const resolvedDate = c.resolvedDaysAgo !== null ? new Date(Date.now() - c.resolvedDaysAgo * 24 * 3600 * 1000).toISOString() : null;

    const images: any[] = [];
    const statusHistory: any[] = [];

    // Before photo
    if (c.beforeImg) {
      const beforeImgDoc = {
        id: imgCounter++,
        complaint_id: c.id,
        image_url: c.beforeImg,
        image_type: 'before',
        uploaded_by_id: c.citizenId,
        created_at: createdDate,
      };
      await cols.complaintImages.insertOne(beforeImgDoc);
      images.push(beforeImgDoc);
    }

    // After photo
    if (c.afterImg && c.workerId) {
      const afterImgDoc = {
        id: imgCounter++,
        complaint_id: c.id,
        image_url: c.afterImg,
        image_type: 'after',
        uploaded_by_id: c.workerId,
        created_at: resolvedDate,
      };
      await cols.complaintImages.insertOne(afterImgDoc);
      images.push(afterImgDoc);
    }

    // Initial Status History
    const submittedHist = {
      id: statusCounter++,
      complaint_id: c.id,
      previous_status: null,
      new_status: 'Submitted',
      changed_by_id: c.citizenId,
      changed_by_name: c.citizenName,
      changed_by_role: 'citizen',
      note: 'Report submitted by citizen',
      created_at: createdDate,
    };
    await cols.complaintStatusHistory.insertOne(submittedHist);
    statusHistory.push(submittedHist);

    if (['Verified', 'Assigned', 'In Progress', 'Resolved'].includes(c.status)) {
      const verifiedDate = new Date(new Date(createdDate).getTime() + 2 * 3600 * 1000).toISOString();
      const verifiedHist = {
        id: statusCounter++,
        complaint_id: c.id,
        previous_status: 'Submitted',
        new_status: 'Verified',
        changed_by_id: 1,
        changed_by_name: 'Rajesh Sharma (Municipal Admin)',
        changed_by_role: 'admin',
        note: 'Municipal admin verified validity and location',
        created_at: verifiedDate,
      };
      await cols.complaintStatusHistory.insertOne(verifiedHist);
      statusHistory.push(verifiedHist);
    }

    if (c.workerId && ['Assigned', 'In Progress', 'Resolved'].includes(c.status)) {
      const assignedDate = new Date(new Date(createdDate).getTime() + 4 * 3600 * 1000).toISOString();
      const assignedHist = {
        id: statusCounter++,
        complaint_id: c.id,
        previous_status: 'Verified',
        new_status: 'Assigned',
        changed_by_id: 1,
        changed_by_name: 'Rajesh Sharma (Municipal Admin)',
        changed_by_role: 'admin',
        note: `Task dispatched to sanitation officer ${c.workerName}`,
        created_at: assignedDate,
      };
      await cols.complaintStatusHistory.insertOne(assignedHist);
      statusHistory.push(assignedHist);

      await cols.workerAssignments.insertOne({
        id: assignCounter++,
        complaint_id: c.id,
        worker_id: c.workerId,
        assigned_by_id: 1,
        status: 'assigned',
        assigned_at: assignedDate,
      });
    }

    if (['In Progress', 'Resolved'].includes(c.status) && c.workerId) {
      const inProgDate = new Date(new Date(createdDate).getTime() + 6 * 3600 * 1000).toISOString();
      const inProgHist = {
        id: statusCounter++,
        complaint_id: c.id,
        previous_status: 'Assigned',
        new_status: 'In Progress',
        changed_by_id: c.workerId,
        changed_by_name: c.workerName,
        changed_by_role: 'worker',
        note: 'Worker arrived on site with equipment',
        created_at: inProgDate,
      };
      await cols.complaintStatusHistory.insertOne(inProgHist);
      statusHistory.push(inProgHist);
    }

    if (c.status === 'Resolved' && c.workerId && resolvedDate) {
      const resolvedHist = {
        id: statusCounter++,
        complaint_id: c.id,
        previous_status: 'In Progress',
        new_status: 'Resolved',
        changed_by_id: c.workerId,
        changed_by_name: c.workerName,
        changed_by_role: 'worker',
        note: c.resolutionNote,
        created_at: resolvedDate,
      };
      await cols.complaintStatusHistory.insertOne(resolvedHist);
      statusHistory.push(resolvedHist);
    }

    // Insert complaint document
    await cols.complaints.insertOne({
      id: c.id,
      public_complaint_id: c.publicId,
      citizen_id: c.citizenId,
      citizen_name: c.citizenName,
      citizen_email: c.citizenId === 2 ? 'citizen@example.com' : c.citizenId === 3 ? 'priya.sharma@example.com' : 'rahul.verma@example.com',
      citizen_phone: '+91 98765 43210',
      title: c.title,
      description: c.description,
      category: c.category,
      priority: c.priority,
      status: c.status,
      address: c.address,
      locality: c.locality,
      latitude: c.lat,
      longitude: c.lng,
      assigned_worker_id: c.workerId,
      assigned_worker_name: c.workerName,
      resolution_note: c.resolutionNote,
      is_duplicate: 0,
      duplicate_of_id: null,
      images,
      status_history: statusHistory,
      created_at: createdDate,
      updated_at: resolvedDate || createdDate,
      resolved_at: resolvedDate,
      deleted_at: null,
    });
  }

  console.log(`✓ Seeded ${sampleComplaints.length} Realistic Waste Complaints with Timeline History`);

  // 3. Seed Duplicate Relationship (Complaint 9 is duplicate of Complaint 1)
  const duplicateReasons = [
    'Matching category: "Garbage Accumulation" (+25%)',
    'Very close location: ~12m away (+35%)',
    'High title text similarity: 78% (+23%)',
  ];

  await cols.duplicateRelationships.insertOne({
    id: 1,
    primary_complaint_id: 1,
    duplicate_complaint_id: 9,
    similarity_score: 83,
    match_reasons: duplicateReasons,
    status: 'suspected',
    created_at: nowIso,
  });
  console.log('✓ Seeded Duplicate Detection Relationship (ECO-2026-00001 & ECO-2026-00009)');

  // 4. Seed Notifications
  const notifications = [
    {
      id: 1,
      user_id: 2,
      title: 'Issue Resolved 🎉',
      message: 'Your complaint ECO-2026-00001 has been cleaned and verified. Check resolution photos.',
      related_complaint_id: 1,
      related_public_id: 'ECO-2026-00001',
      is_read: 1,
      created_at: nowIso,
    },
    {
      id: 2,
      user_id: 3,
      title: 'Worker Dispatched',
      message: 'Sanitation worker Ramesh Kumar is actively addressing your report ECO-2026-00002.',
      related_complaint_id: 2,
      related_public_id: 'ECO-2026-00002',
      is_read: 0,
      created_at: nowIso,
    },
    {
      id: 3,
      user_id: 5,
      title: 'New Priority Task',
      message: 'You have been assigned urgent task ECO-2026-00002 at Koramangala 80 Feet Road.',
      related_complaint_id: 2,
      related_public_id: 'ECO-2026-00002',
      is_read: 0,
      created_at: nowIso,
    },
    {
      id: 4,
      user_id: 1,
      title: 'Potential Duplicate Flagged',
      message: 'High similarity (83%) detected between ECO-2026-00001 and ECO-2026-00009.',
      related_complaint_id: 9,
      related_public_id: 'ECO-2026-00009',
      is_read: 0,
      created_at: nowIso,
    },
  ];

  await cols.notifications.insertMany(notifications);
  console.log(`✓ Seeded ${notifications.length} User Notifications`);

  // 5. Seed Activity Logs
  const activityLogs = [
    {
      id: 1,
      user_id: 1,
      user_name: 'Rajesh Sharma (Municipal Admin)',
      user_role: 'admin',
      action: 'SYSTEM_INIT',
      details: 'EcoTrack MongoDB database initialized and seeded successfully.',
      created_at: nowIso,
    },
    {
      id: 2,
      user_id: 2,
      user_name: 'Aarav Patel',
      user_role: 'citizen',
      action: 'CREATE_COMPLAINT',
      details: 'Submitted complaint ECO-2026-00001 ("Massive garbage pile near metro station entrance")',
      created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 3,
      user_id: 1,
      user_name: 'Rajesh Sharma (Municipal Admin)',
      user_role: 'admin',
      action: 'ASSIGN_WORKER',
      details: 'Assigned worker Ramesh Kumar to complaint ECO-2026-00001',
      created_at: new Date(Date.now() - 3.8 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 4,
      user_id: 5,
      user_name: 'Ramesh Kumar',
      user_role: 'worker',
      action: 'RESOLVE_COMPLAINT',
      details: 'Resolved complaint ECO-2026-00001 with after-cleaning photo and notes',
      created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    },
  ];

  await cols.activityLogs.insertMany(activityLogs);
  console.log(`✓ Seeded ${activityLogs.length} Audit Activity Logs`);

  // 6. Initialize Atomic Sequence Counters
  await cols.counters.updateOne(
    { _id: 'user_id' as any },
    { $set: { seq: 7 } },
    { upsert: true }
  );
  await cols.counters.updateOne(
    { _id: 'complaint_id' as any },
    { $set: { seq: 9 } },
    { upsert: true }
  );
  await cols.counters.updateOne(
    { _id: 'notification_id' as any },
    { $set: { seq: 4 } },
    { upsert: true }
  );
  await cols.counters.updateOne(
    { _id: 'activity_id' as any },
    { $set: { seq: 4 } },
    { upsert: true }
  );
  await cols.counters.updateOne(
    { _id: 'image_id' as any },
    { $set: { seq: imgCounter } },
    { upsert: true }
  );
  await cols.counters.updateOne(
    { _id: 'status_history_id' as any },
    { $set: { seq: statusCounter } },
    { upsert: true }
  );

  console.log('✓ Initialized Atomic Sequence Counters');

  console.log('\n======================================================');
  console.log('🎉 EcoTrack MongoDB Seeding Completed Successfully!');
  console.log('======================================================');
  console.log('MongoDB URI:      ' + (config.mongoUri || 'mongodb://127.0.0.1:27017/ecotrack'));
  console.log('Database Name:    ' + (config.mongoDbName || 'ecotrack'));
  console.log('DEMO ACCOUNTS:');
  console.log('  1. Municipal Admin:   admin@ecotrack.gov      / Admin@123');
  console.log('  2. Citizen Account:   citizen@example.com    / Citizen@123');
  console.log('  3. Sanitation Worker: worker@ecotrack.gov     / Worker@123');
  console.log('======================================================\n');
}

// Direct CLI execution
if (process.argv[1] && process.argv[1].endsWith('seedMongo.ts')) {
  const isReset = process.argv.includes('--reset');
  seedMongoDatabase(isReset)
    .then(() => {
      console.log('Seed process finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ MongoDB Seed Error:', err);
      process.exit(1);
    });
}
