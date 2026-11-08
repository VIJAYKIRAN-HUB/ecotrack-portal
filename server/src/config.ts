import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: Number(process.env.PORT) || 3000,
  host: '0.0.0.0',
  jwtSecret: process.env.JWT_SECRET || 'ecotrack-sih2025-secure-local-secret-key-9823412',
  jwtExpiresIn: '7d',
  cookieName: 'ecotrack_token',
  uploadDir: path.resolve(__dirname, '../uploads'),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173',
  duplicateSimilarityThreshold: Number(process.env.DUPLICATE_THRESHOLD) || 60,

  // MongoDB Database Configuration
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecotrack',
  mongoDbName: process.env.MONGODB_DB_NAME || 'ecotrack',

  // Flask Backend / AI Microservice Configuration
  flaskApiUrl: process.env.FLASK_API_URL || 'http://127.0.0.1:5000',
  flaskApiKey: process.env.FLASK_API_KEY || '',
};
