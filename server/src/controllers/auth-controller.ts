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
          error: { message: 'Fyers Client ID is not configured on server env. Please paste your Fyers Auth Code below.' }
        });
      }

      const fyersAuthUrl = `https://api-t1.fyers.in/api/v3/generate-authcode?client_id=${clientID}&redirect_uri=${redirectURI}&response_type=code&state=${state}`;

      return res.json({ url: fyersAuthUrl });
    } catch (err: any) {
      logger.error(`Fyers URL retrieval error: ${err.message}`);
      return res.status(500).json({ error: { message: 'Internal server error' } });
    }
  }

  /**
   * Public Callback URL called when Fyers redirects after login
   */
  async fyersCallback(req: Request, res: Response) {
    const { code, auth_code } = req.query;
    const finalCode = (code || auth_code || '') as string;

    if (!finalCode) {
      return res.status(400).send('Authorization code was not returned by Fyers.');
    }

    // Return a clean HTML page displaying the code with a Copy Code button
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fyers Authorization Code - TradeFinder</title>
        <style>
          body {
            background-color: #07080d;
            color: #e2e8f0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-h: 100vh;
            height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
          }
          .card {
            background-color: #0e111a;
            border: 1px solid #1e263d;
            border-radius: 20px;
            padding: 32px;
            max-width: 480px;
            width: 100%;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          }
          .icon-badge {
            width: 48px;
            height: 48px;
            background: #4f46e5;
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
          }
          h2 { margin: 0 0 8px 0; color: #fff; font-size: 20px; }
          p { color: #94a3b8; font-size: 13px; margin: 0 0 20px 0; line-height: 1.5; }
          .code-box {
            background: #05070e;
            border: 1px solid #28324e;
            color: #818cf8;
            font-family: monospace;
            font-size: 13px;
            padding: 12px;
            border-radius: 12px;
            width: 100%;
            box-sizing: border-box;
            word-break: break-all;
            margin-bottom: 20px;
            text-align: center;
          }
          .btn {
            background: #4f46e5;
            color: #fff;
            border: none;
            padding: 12px 24px;
            font-weight: 600;
            font-size: 14px;
            border-radius: 12px;
            cursor: pointer;
            width: 100%;
            transition: background 0.2s;
          }
          .btn:hover { background: #4338ca; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon-badge">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <h2>Fyers Auth Code Generated!</h2>
          <p>Click the button below to copy your code, then return to TradeFinder and paste it into the box.</p>
          <div class="code-box" id="codeText">${finalCode}</div>
          <button class="btn" onclick="navigator.clipboard.writeText('${finalCode}'); this.innerText='Copied to Clipboard! ✓';">Copy Auth Code</button>
        </div>
      </body>
      </html>
    `;

    return res.setHeader('Content-Type', 'text/html').send(html);
  }

  /**
   * Save a directly entered Fyers Access Token or Auth Code
   */
  async saveDirectFyersToken(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Not authenticated' } });
      }

      const { token, clientId, secretKey } = req.body;
      if (!token || typeof token !== 'string' || token.trim().length < 5) {
        return res.status(400).json({ error: { message: 'Please paste your Fyers Auth Code or Access Token' } });
      }

      let trimmedInput = token.trim();

      // Extract code if user pasted a full redirect URL
      if (trimmedInput.includes('code=')) {
        const match = trimmedInput.match(/code=([^&]+)/);
        if (match && match[1]) {
          trimmedInput = decodeURIComponent(match[1]);
        }
      }

      let extractedClientId = clientId?.trim() || config.FYERS.CLIENT_ID;
      let rawAccessToken = trimmedInput;

      if (trimmedInput.includes(':')) {
        const parts = trimmedInput.split(':');
        extractedClientId = parts[0].trim();
        rawAccessToken = parts.slice(1).join(':').trim();
      }

      const activeSecretKey = secretKey?.trim() || config.FYERS.SECRET_KEY;

      // If clientId wasn't provided, use default or format
      if (!extractedClientId) {
        extractedClientId = 'TF_CLIENT';
      }

      const combinedToken = `${extractedClientId}:${rawAccessToken}`;

      logger.info(`Processing Fyers code/token for user ${req.user.id}...`);

      // 1. Try validating as a direct Access Token
      let validation = await fyersClient.validateAccessToken(combinedToken, extractedClientId);

      // 2. If direct check failed, try converting rawAccessToken as an Auth Code
      if (!validation.valid && activeSecretKey && extractedClientId !== 'TF_CLIENT') {
        logger.info(`Direct token check failed. Attempting Auth Code conversion for user ${req.user.id}...`);
        const exchangeResult = await fyersClient.exchangeAuthCode(rawAccessToken, extractedClientId, activeSecretKey);

        if (exchangeResult.success && exchangeResult.accessToken) {
          const newCombinedToken = exchangeResult.accessToken;
          validation = await fyersClient.validateAccessToken(newCombinedToken, extractedClientId);
          if (validation.valid) {
            await sessionRepository.upsert(req.user.id, newCombinedToken, null, new Date(Date.now() + 24 * 60 * 60 * 1000));
            return res.json({
              success: true,
              connected: true,
              message: 'Fyers Auth Code converted & feed connected successfully!',
            });
          }
        } else if (exchangeResult.message) {
          validation = { valid: false, message: exchangeResult.message };
        }
      }

      if (!validation.valid) {
        let msg = validation.message || 'Token validation failed.';
        return res.status(400).json({
          error: { message: msg },
        });
      }

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await sessionRepository.upsert(req.user.id, combinedToken, null, expiresAt);

      logger.info(`Successfully validated and stored Fyers token for user ${req.user.id}`);
      return res.json({
        success: true,
        connected: true,
        message: 'Fyers Live Market Session connected successfully!',
      });
    } catch (err: any) {
      logger.error(`Save direct Fyers token error: ${err.message}`);
      return res.status(500).json({ error: { message: err.message || 'Internal server error while saving Fyers token' } });
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
