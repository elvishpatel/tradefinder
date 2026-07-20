import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';
import config from '../config';
import logger from '../utils/logger';
import userRepository from '../repositories/user-repository';
import sessionRepository from '../repositories/session-repository';
import fyersClient from '../services/fyers-client';
import { AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
  async register(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: { message: 'Email already registered' } });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await userRepository.create(email, passwordHash);

      logger.info(`User registered: ${email}`);
      return res.status(201).json({ success: true, user });
    } catch (err: any) {
      logger.error(`Registration error: ${err.message}`);
      return res.status(500).json({ error: { message: err.message || 'Internal server error' } });
    }
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
      // Standalone demo user login bypass (always works regardless of Supabase DB RLS policies)
      if (email === 'demo@tradefinder.com' && password === 'password123') {
        const token = jwt.sign(
          { id: '00000000-0000-0000-0000-000000000000', email },
          config.JWT_SECRET,
          { expiresIn: '7d' }
        );
        logger.info(`Demo user logged in: ${email}`);
        return res.json({
          token,
          user: {
            id: '00000000-0000-0000-0000-000000000000',
            email,
            createdAt: new Date().toISOString(),
          },
        });
      }

      const user = await userRepository.findByEmailWithPassword(email);
      if (!user) {
        return res.status(401).json({ error: { message: 'Invalid email or password' } });
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ error: { message: 'Invalid email or password' } });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        config.JWT_SECRET,
        { expiresIn: '7d' }
      );

      logger.info(`User logged in: ${email}`);
      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (err: any) {
      logger.error(`Login error: ${err.message}`);
      return res.status(500).json({ error: { message: err.message || 'Internal server error' } });
    }
  }

  async me(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Not authenticated' } });
      }

      if (req.user.email === 'demo@tradefinder.com' || req.user.id === '00000000-0000-0000-0000-000000000000') {
        return res.json({
          user: {
            id: '00000000-0000-0000-0000-000000000000',
            email: 'demo@tradefinder.com',
            createdAt: new Date().toISOString(),
          },
        });
      }

      const user = await userRepository.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: { message: 'User not found' } });
      }

      return res.json({ user });
    } catch (err: any) {
      logger.error(`Me error: ${err.message}`);
      return res.status(500).json({ error: { message: 'Internal server error' } });
    }
  }

  async getFyersUrl(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Not authenticated' } });
      }

      const clientID = config.FYERS.CLIENT_ID;
      const redirectURI = encodeURIComponent(config.FYERS.REDIRECT_URI);
      const state = req.user.id;

      if (!clientID) {
        return res.status(400).json({
          error: { message: 'Fyers Client ID is not configured on server. Please use Direct Access Token input below.' }
        });
      }

      const fyersAuthUrl = `https://api-t1.fyers.in/api/v3/generate-authcode?client_id=${clientID}&redirect_uri=${redirectURI}&response_type=code&state=${state}`;

      return res.json({ url: fyersAuthUrl });
    } catch (err: any) {
      logger.error(`Fyers URL retrieval error: ${err.message}`);
      return res.status(500).json({ error: { message: 'Internal server error' } });
    }
  }

  async fyersCallback(req: Request, res: Response) {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      logger.warn('Fyers OAuth callback missing code or state parameters');
      return res.status(400).send('Authentication code and user session state are required');
    }

    try {
      logger.info(`Received Fyers Auth Code for user: ${userId}. Exchanging for access token...`);

      const rawString = `${config.FYERS.CLIENT_ID}:${config.FYERS.SECRET_KEY}`;
      const appIdHash = crypto.createHash('sha256').update(rawString).digest('hex');

      const response = await axios.post('https://api-t1.fyers.in/api/v3/validate-authcode', {
        grant_type: 'authorization_code',
        appIdHash: appIdHash,
        code: code,
      });

      if (response.data.s !== 'ok') {
        logger.error(`Fyers validate-authcode error: ${response.data.message || JSON.stringify(response.data)}`);
        return res.status(400).send(`FYERS login failed: ${response.data.message || 'Token exchange failed'}`);
      }

      const { access_token, refresh_token } = response.data;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await sessionRepository.upsert(userId as string, access_token, refresh_token || null, expiresAt);

      logger.info(`Fyers Access Token successfully established and stored for user: ${userId}`);
      return res.redirect(`${config.FRONTEND_URL}/dashboard?fyers=connected`);
    } catch (err: any) {
      logger.error(`Fyers Callback Error: ${err.message}`);
      return res.status(500).send('Internal server error during FYERS token exchange');
    }
  }

  /**
   * Save a directly entered Fyers Access Token (and optional Client ID)
   */
  async saveDirectFyersToken(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Not authenticated' } });
      }

      const { token, clientId } = req.body;
      if (!token || typeof token !== 'string' || token.trim().length < 10) {
        return res.status(400).json({ error: { message: 'Please enter a valid Fyers Access Token' } });
      }

      const trimmedToken = token.trim();
      let combinedToken = trimmedToken;

      if (!trimmedToken.includes(':') && clientId && clientId.trim()) {
        combinedToken = `${clientId.trim()}:${trimmedToken}`;
      } else if (!trimmedToken.includes(':') && config.FYERS.CLIENT_ID) {
        combinedToken = `${config.FYERS.CLIENT_ID}:${trimmedToken}`;
      }

      logger.info(`Validating direct Fyers Access Token for user ${req.user.id}...`);

      const validation = await fyersClient.validateAccessToken(combinedToken);
      if (!validation.valid) {
        return res.status(400).json({
          error: { message: validation.message || 'Token validation failed. Please verify your Fyers App ID and Access Token.' }
        });
      }

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await sessionRepository.upsert(req.user.id, combinedToken, null, expiresAt);

      logger.info(`Successfully validated and stored direct Fyers token for user ${req.user.id}`);
      return res.json({
        success: true,
        connected: true,
        message: 'Fyers Live Market Session connected successfully!',
      });
    } catch (err: any) {
      logger.error(`Save direct Fyers token error: ${err.message}`);
      return res.status(500).json({ error: { message: 'Internal server error while saving Fyers token' } });
    }
  }

  async getFyersSession(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Not authenticated' } });
      }

      const session = await sessionRepository.findByUserId(req.user.id);
      if (!session || !session.isValid) {
        return res.json({ connected: false });
      }

      return res.json({
        connected: true,
        session: {
          expiresAt: session.expiresAt,
          isValid: session.isValid,
        },
      });
    } catch (err: any) {
      logger.error(`Get Fyers Session error: ${err.message}`);
      return res.status(500).json({ error: { message: 'Internal server error' } });
    }
  }

  async disconnectFyers(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Not authenticated' } });
      }
      await sessionRepository.delete(req.user.id);
      logger.info(`Disconnected Fyers for user: ${req.user.id}`);
      return res.json({ success: true });
    } catch (err: any) {
      logger.error(`Disconnect Fyers error: ${err.message}`);
      return res.status(500).json({ error: { message: 'Internal server error' } });
    }
  }
}

export default new AuthController();
