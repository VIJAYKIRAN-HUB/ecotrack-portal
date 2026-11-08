import { Response } from 'express';
import { AuthService } from '../services/authService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { queryOne } from '../database/db.js';
import { config } from '../config.js';
import { User } from '../types/index.js';

export class AuthController {
  static async register(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, email, password, phone } = req.body;
      if (!name || !email || !password) {
        res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        return;
      }

      const { user, token } = await AuthService.registerCitizen({ name, email, password, phone });

      res.cookie(config.cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful.',
        user,
        token,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Registration failed.' });
    }
  }

  static async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email and password are required.' });
        return;
      }

      const { user, token } = await AuthService.login({ email, password });

      res.cookie(config.cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        user,
        token,
      });
    } catch (err: any) {
      res.status(401).json({ success: false, message: err.message || 'Invalid credentials.' });
    }
  }

  static logout(_req: AuthenticatedRequest, res: Response): void {
    res.clearCookie(config.cookieName);
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  }

  static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    try {
      const user = await AuthService.getUserById(req.user.id);

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
