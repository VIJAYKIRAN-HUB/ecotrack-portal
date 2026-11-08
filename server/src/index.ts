import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { config } from './config.js';
import { initDatabase } from './database/db.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import workerRoutes from './routes/workerRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import mapRoutes from './routes/mapRoutes.js';
import { connectMongo, isMongoConnected, checkMongoHealth } from './database/mongo.js';
import { FlaskService } from './services/flaskService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Initialize database schema (SQLite) & optional MongoDB
initDatabase();
if (
  process.env.MONGODB_URI &&
  !process.env.MONGODB_URI.includes('127.0.0.1') &&
  !process.env.MONGODB_URI.includes('localhost')
) {
  connectMongo().catch(() => {});
} else if (process.env.NODE_ENV !== 'production' && config.mongoUri && !config.mongoUri.includes('127.0.0.1')) {
  connectMongo().catch(() => {});
} else {
  console.log('🍃 Database: Using local SQLite database (ecotrack.db).');
}

// CORS configuration for local development and cloud deployments (Render, Vercel, etc.)
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Reflect caller origin so credentials/cookies work across any Vercel preview or production domain
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Api-Key'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Immediate pre-flight OPTIONS responder
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, X-Api-Key');
    }
    return res.sendStatus(204);
  }
  next();
});

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploaded photos
app.use('/uploads', express.static(config.uploadDir));
app.use('/api/uploads', express.static(config.uploadDir));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    app: 'EcoTrack Smart Waste Management Portal API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Dedicated MongoDB Connection Health Check
app.get('/api/health/mongo', async (_req, res) => {
  const health = await checkMongoHealth();
  if (health.status === 'connected') {
    res.status(200).json({
      ...health,
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      ...health,
      timestamp: new Date().toISOString(),
    });
  }
});

// Integrations Status (MongoDB & Flask)
app.get('/api/integrations/status', async (_req, res) => {
  const flaskStatus = await FlaskService.checkStatus();
  res.status(200).json({
    success: true,
    mongodb: {
      configuredUri: config.mongoUri,
      dbName: config.mongoDbName,
      connected: isMongoConnected(),
    },
    flask: {
      configuredUrl: config.flaskApiUrl,
      ...flaskStatus,
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/map', mapRoutes);

// Error handling middleware
app.use(errorHandler);

// Static frontend serving in production (unified deployment on Render/Railway/Fly)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.resolve(clientDistPath, 'index.html'));
  });
}

// Start server if not imported by test runner
if (process.env.NODE_ENV !== 'test') {
  const host = '0.0.0.0';
  const port = Number(process.env.PORT) || config.port || 3000;
  app.listen(port, host, () => {
    console.log(`\n======================================================`);
    console.log(`🌿 EcoTrack Backend Server running at http://${host}:${port}`);
    console.log(`   Health Check: http://${host}:${port}/api/health`);
    console.log(`   Uploads:      ${config.uploadDir}`);
    console.log(`======================================================\n`);
  });
}

export default app;
