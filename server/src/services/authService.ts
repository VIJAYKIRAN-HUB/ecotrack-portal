import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { collections, isMongoConnected, getNextSequence } from '../database/mongo.js';
import { queryOne, execute } from '../database/db.js';
import { config } from '../config.js';
import { AuthTokenPayload, User, UserRole } from '../types/index.js';

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export class AuthService {
  static async registerCitizen(dto: RegisterDTO): Promise<{ user: User; token: string }> {
    const cleanEmail = dto.email.toLowerCase().trim();

    // Check existing in MongoDB
    if (isMongoConnected()) {
      const col = collections().users;
      const existing = await col.findOne({ email: cleanEmail });
      if (existing) {
        throw new Error('An account with this email address already exists.');
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(dto.password, salt);
      const id = await getNextSequence('user_id');
      const now = new Date().toISOString();

      const userDoc = {
        id,
        name: dto.name.trim(),
        email: cleanEmail,
        password_hash: passwordHash,
        role: 'citizen' as UserRole,
        phone: dto.phone?.trim() || null,
        active: 1,
        created_at: now,
        updated_at: now,
      };

      await col.insertOne(userDoc);

      // Log activity
      await collections().activityLogs.insertOne({
        id: await getNextSequence('activity_id'),
        user_id: id,
        user_name: dto.name.trim(),
        user_role: 'citizen',
        action: 'REGISTER',
        details: `Citizen registered: ${cleanEmail}`,
        created_at: now,
      });

      const { password_hash, _id, ...safeUser } = userDoc as any;
      const token = this.generateToken(safeUser as User);

      return { user: safeUser as User, token };
    }

    // Fallback SQLite
    const existing = queryOne<User>(`SELECT id FROM users WHERE email = ?`, [cleanEmail]);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const result = execute(
      `INSERT INTO users (name, email, password_hash, role, phone, active)
       VALUES (?, ?, ?, 'citizen', ?, 1)`,
      [dto.name.trim(), cleanEmail, passwordHash, dto.phone?.trim() || null]
    );

    const newUser = queryOne<User>(
      `SELECT id, name, email, role, phone, active, created_at, updated_at FROM users WHERE id = ?`,
      [result.lastInsertRowid]
    )!;

    const token = this.generateToken(newUser);
    return { user: newUser, token };
  }

  static async login(dto: LoginDTO): Promise<{ user: User; token: string }> {
    const cleanEmail = dto.email.toLowerCase().trim();

    if (isMongoConnected()) {
      const col = collections().users;
      const user = await col.findOne({ email: cleanEmail });

      if (!user) {
        throw new Error('Invalid email or password.');
      }

      if (!user.active) {
        throw new Error('Your account has been deactivated. Please contact municipal administration.');
      }

      const isMatch = await bcrypt.compare(dto.password, user.password_hash);
      if (!isMatch) {
        throw new Error('Invalid email or password.');
      }

      // Safe user (never expose password_hash or mongodb internal _id in response)
      const { password_hash, _id, ...safeUser } = user as any;
      const token = this.generateToken(safeUser as User);

      // Log activity
      await collections().activityLogs.insertOne({
        id: await getNextSequence('activity_id'),
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        action: 'LOGIN',
        details: `User logged in: ${user.email} (${user.role})`,
        created_at: new Date().toISOString(),
      });

      return { user: safeUser as User, token };
    }

    // Fallback SQLite
    const user = queryOne<User & { password_hash: string }>(
      `SELECT * FROM users WHERE email = ?`,
      [cleanEmail]
    );

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    if (!user.active) {
      throw new Error('Your account has been deactivated. Please contact municipal administration.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    const { password_hash, ...safeUser } = user;
    const token = this.generateToken(safeUser as User);
    return { user: safeUser as User, token };
  }

  static generateToken(user: User): string {
    const payload: AuthTokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
  }

  static async createWorker(
    dto: RegisterDTO & { role?: UserRole },
    createdById: number
  ): Promise<User> {
    const cleanEmail = dto.email.toLowerCase().trim();
    const role = dto.role || 'worker';

    if (isMongoConnected()) {
      const col = collections().users;
      const existing = await col.findOne({ email: cleanEmail });
      if (existing) {
        throw new Error('User with this email already exists.');
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(dto.password, salt);
      const id = await getNextSequence('user_id');
      const now = new Date().toISOString();

      const workerDoc = {
        id,
        name: dto.name.trim(),
        email: cleanEmail,
        password_hash: passwordHash,
        role,
        phone: dto.phone?.trim() || null,
        active: 1,
        created_at: now,
        updated_at: now,
      };

      await col.insertOne(workerDoc);

      await collections().activityLogs.insertOne({
        id: await getNextSequence('activity_id'),
        user_id: createdById,
        action: 'CREATE_WORKER',
        details: `Created ${role} account: ${cleanEmail}`,
        created_at: now,
      });

      const { password_hash, _id, ...safeUser } = workerDoc as any;
      return safeUser as User;
    }

    // Fallback SQLite
    const existing = queryOne<User>(`SELECT id FROM users WHERE email = ?`, [cleanEmail]);
    if (existing) {
      throw new Error('User with this email already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const result = execute(
      `INSERT INTO users (name, email, password_hash, role, phone, active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [dto.name.trim(), cleanEmail, passwordHash, role, dto.phone?.trim() || null]
    );

    const created = queryOne<User>(
      `SELECT id, name, email, role, phone, active, created_at, updated_at FROM users WHERE id = ?`,
      [result.lastInsertRowid]
    )!;

    return created;
  }

  static async getUserById(id: number): Promise<User | null> {
    if (isMongoConnected()) {
      const user = await collections().users.findOne({ id });
      if (!user) return null;
      const { password_hash, _id, ...safeUser } = user as any;
      return safeUser as User;
    }

    const user = queryOne<User>(
      `SELECT id, name, email, role, phone, active, created_at, updated_at FROM users WHERE id = ?`,
      [id]
    );
    return user || null;
  }
}

