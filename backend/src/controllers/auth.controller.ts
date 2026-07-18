import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AuthService } from '../services/auth.service';
import { logger } from '../utils/logger';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const { user, token } = await AuthService.registerUser(req.body);
      res.status(201).json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        token,
      });
    } catch (error: any) {
      if (error.message === 'User already exists') {
        res.status(400).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const { email, password } = req.body;
      const { user, token } = await AuthService.loginUser(email, password);
      
      res.status(200).json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        token,
      });
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        res.status(401).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // req.user is set by authMiddleware
      const user = (req as any).user;
      res.status(200).json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          preferences: user.preferences
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
