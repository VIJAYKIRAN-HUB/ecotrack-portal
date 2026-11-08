import { config } from '../config.js';

let client: any = null;
let dbInstance: any = null;
let isConnected = false;

export async function connectMongo(): Promise<any> {
  if (isConnected && dbInstance) {
    return dbInstance;
  }

  const uri = config.mongoUri || 'mongodb://127.0.0.1:27017/ecotrack';
  const dbName = config.mongoDbName || 'ecotrack';

  console.log(`\n🍃 MongoDB: Connecting to ${uri}...`);

  try {
    let MongoClientClass: any;
    try {
      const mongoModule = await import('mongodb');
      MongoClientClass = mongoModule.MongoClient;
    } catch {
      console.warn(`⚠️ "mongodb" package is not yet installed in server/node_modules.`);
      console.warn(`👉 Run in terminal: npm --prefix server install mongodb`);
      isConnected = false;
      return null;
    }

    client = new MongoClientClass(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    await client.connect();
    dbInstance = client.db(dbName);
    isConnected = true;

    console.log(`✓ 🍃 MongoDB: Connected successfully to database "${dbName}"`);

    // Initialize required indexes
    await initMongoIndexes(dbInstance);

    return dbInstance;
  } catch (err: any) {
    isConnected = false;
    console.error(`❌ 🍃 MongoDB Connection Error: ${err.message}`);
    return null;
  }
}

export function getDb(): any {
  if (!dbInstance || !isConnected) {
    throw new Error('MongoDB is not connected. Call connectMongo() first.');
  }
  return dbInstance;
}

export function isMongoConnected(): boolean {
  return isConnected;
}

export async function checkMongoHealth(): Promise<{
  status: 'connected' | 'disconnected' | 'error';
  pingMs?: number;
  database: string;
  collections?: string[];
  error?: string;
}> {
  const dbName = config.mongoDbName || 'ecotrack';

  if (!client || !isConnected || !dbInstance) {
    return {
      status: 'disconnected',
      database: dbName,
      error: 'MongoDB client is not connected.',
    };
  }

  try {
    const start = Date.now();
    await dbInstance.command({ ping: 1 });
    const pingMs = Date.now() - start;

    const collectionsList = await dbInstance.listCollections().toArray();
    const collectionNames = collectionsList.map((c: any) => c.name);

    return {
      status: 'connected',
      pingMs,
      database: dbName,
      collections: collectionNames,
    };
  } catch (err: any) {
    return {
      status: 'error',
      database: dbName,
      error: err.message,
    };
  }
}

// Atomic auto-incrementing integer sequence generator for MongoDB documents
export async function getNextSequence(sequenceName: string): Promise<number> {
  const db = getDb();
  const counters = db.collection('counters');

  const result = await counters.findOneAndUpdate(
    { _id: sequenceName as any },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );

  return result ? (result as any).seq : 1;
}

// Collections helper
export function collections() {
  const db = getDb();
  return {
    users: db.collection('users'),
    complaints: db.collection('complaints'),
    complaintImages: db.collection('complaint_images'),
    complaintStatusHistory: db.collection('complaint_status_history'),
    workerAssignments: db.collection('worker_assignments'),
    notifications: db.collection('notifications'),
    duplicateRelationships: db.collection('duplicate_relationships'),
    activityLogs: db.collection('activity_logs'),
    counters: db.collection('counters'),
  };
}

async function initMongoIndexes(db: any): Promise<void> {
  try {
    // Users indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ id: 1 }, { unique: true });

    // Complaints indexes
    await db.collection('complaints').createIndex({ public_complaint_id: 1 }, { unique: true });
    await db.collection('complaints').createIndex({ id: 1 }, { unique: true });
    await db.collection('complaints').createIndex({ citizen_id: 1 });
    await db.collection('complaints').createIndex({ assigned_worker_id: 1 });
    await db.collection('complaints').createIndex({ status: 1 });
    await db.collection('complaints').createIndex({ category: 1 });
    await db.collection('complaints').createIndex({ priority: 1 });
    await db.collection('complaints').createIndex({ locality: 1 });
    await db.collection('complaints').createIndex({ created_at: -1 });
    await db.collection('complaints').createIndex({ deleted_at: 1 });

    // Notifications indexes
    await db.collection('notifications').createIndex({ user_id: 1, is_read: 1 });
    await db.collection('notifications').createIndex({ created_at: -1 });

    // Duplicate relationships indexes
    await db.collection('duplicate_relationships').createIndex(
      { primary_complaint_id: 1, duplicate_complaint_id: 1 },
      { unique: true }
    );
    await db.collection('duplicate_relationships').createIndex({ status: 1 });

    // Activity logs index
    await db.collection('activity_logs').createIndex({ created_at: -1 });

    console.log('✓ 🍃 MongoDB: Collection indexes verified.');
  } catch (err: any) {
    console.warn(`⚠️ Warning initializing MongoDB indexes: ${err.message}`);
  }
}
