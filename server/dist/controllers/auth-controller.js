"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
const user_repository_1 = __importDefault(require("../repositories/user-repository"));
const session_repository_1 = __importDefault(require("../repositories/session-repository"));
class AuthController {
    async register(req, res) {
        const { email, password } = req.body;
        try {
            const existingUser = await user_repository_1.default.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ error: { message: 'Email already registered' } });
            }
            const passwordHash = await bcrypt_1.default.hash(password, 10);
            const user = await user_repository_1.default.create(email, passwordHash);
            logger_1.default.info(`User registered: ${email}`);
            return res.status(201).json({ success: true, user });
        }
        catch (err) {
            logger_1.default.error(`Registration error: ${err.message}`);
            return res.status(500).json({ error: { message: 'Internal server error' } });
        }
    }
    async login(req, res) {
        const { email, password } = req.body;
        try {
            // Local demo profile bypass for standalone preview
            if (email === 'demo@tradefinder.com' && password === 'password123') {
                const token = jsonwebtoken_1.default.sign({ id: '00000000-0000-0000-0000-000000000000', email }, config_1.default.JWT_SECRET, { expiresIn: '7d' });
                logger_1.default.info(`Demo user logged in: ${email}`);
                return res.json({
                    token,
                    user: {
                        id: '00000000-0000-0000-0000-000000000000',
                        email,
                        createdAt: new Date().toISOString(),
                    },
                });
            }
            const userWithPw = await user_repository_1.default.findByEmailWithPassword(email);
            if (!userWithPw) {
                return res.status(401).json({ error: { message: 'Invalid email or password' } });
            }
            const match = await bcrypt_1.default.compare(password, userWithPw.passwordHash);
            if (!match) {
                return res.status(401).json({ error: { message: 'Invalid email or password' } });
            }
            const token = jsonwebtoken_1.default.sign({ id: userWithPw.id, email: userWithPw.email }, config_1.default.JWT_SECRET, { expiresIn: '7d' });
            logger_1.default.info(`User logged in: ${email}`);
            return res.json({
                token,
                user: {
                    id: userWithPw.id,
                    email: userWithPw.email,
                    createdAt: userWithPw.createdAt,
                },
            });
        }
        catch (err) {
            logger_1.default.error(`Login error: ${err.message}`);
            return res.status(500).json({ error: { message: 'Internal server error' } });
        }
    }
    async me(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: { message: 'Not authenticated' } });
            }
            if (req.user.email === 'demo@tradefinder.com') {
                return res.json({
                    user: {
                        id: '00000000-0000-0000-0000-000000000000',
                        email: 'demo@tradefinder.com',
                        createdAt: new Date().toISOString()
                    }
                });
            }
            const user = await user_repository_1.default.findById(req.user.id);
            return res.json({ user });
        }
        catch (err) {
            logger_1.default.error(`Me error: ${err.message}`);
            return res.status(500).json({ error: { message: 'Internal server error' } });
        }
    }
    async getFyersUrl(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: { message: 'Not authenticated' } });
            }
            const clientID = config_1.default.FYERS.CLIENT_ID;
            const redirectURI = encodeURIComponent(config_1.default.FYERS.REDIRECT_URI);
            const state = req.user.id; // User ID carries over to verify the session association
            // Standard Fyers OAuth 2.0 Auth Link
            const fyersAuthUrl = `https://api-t1.fyers.in/api/v3/generate-authcode?client_id=${clientID}&redirect_uri=${redirectURI}&response_type=code&state=${state}`;
            return res.json({ url: fyersAuthUrl });
        }
        catch (err) {
            logger_1.default.error(`Fyers URL retrieval error: ${err.message}`);
            return res.status(500).json({ error: { message: 'Internal server error' } });
        }
    }
    async fyersCallback(req, res) {
        const { code, state: userId } = req.query;
        if (!code || !userId) {
            logger_1.default.warn('Fyers OAuth callback missing code or state parameters');
            return res.status(400).send('Authentication code and user session state are required');
        }
        try {
            logger_1.default.info(`Received Fyers Auth Code for user: ${userId}. Exchanging for access token...`);
            // Build AppIdHash: SHA256 of appId + ":" + secretKey
            const rawString = `${config_1.default.FYERS.CLIENT_ID}:${config_1.default.FYERS.SECRET_KEY}`;
            const appIdHash = crypto_1.default.createHash('sha256').update(rawString).digest('hex');
            // Swap auth_code for access_token
            const response = await axios_1.default.post('https://api-t1.fyers.in/api/v3/validate-authcode', {
                grant_type: 'authorization_code',
                appIdHash: appIdHash,
                code: code,
            });
            if (response.data.s !== 'ok') {
                logger_1.default.error(`Fyers validate-authcode error: ${response.data.message || JSON.stringify(response.data)}`);
                return res.status(400).send(`FYERS login failed: ${response.data.message || 'Token exchange failed'}`);
            }
            const { access_token, refresh_token } = response.data;
            // Access tokens are valid for 24h. We set expiration to 24h from now.
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            // Save encrypted session tokens
            await session_repository_1.default.upsert(userId, access_token, refresh_token || null, expiresAt);
            logger_1.default.info(`Fyers Access Token successfully established and stored for user: ${userId}`);
            // Redirect back to frontend dashboard
            return res.redirect(`${config_1.default.FRONTEND_URL}/dashboard?fyers=connected`);
        }
        catch (err) {
            logger_1.default.error(`Fyers Callback Error: ${err.message}`);
            if (err.response) {
                logger_1.default.error(`Fyers Callback Error API Response: ${JSON.stringify(err.response.data)}`);
            }
            return res.status(500).send('Internal server error during FYERS token exchange');
        }
    }
    async getFyersSession(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: { message: 'Not authenticated' } });
            }
            if (req.user.email === 'demo@tradefinder.com') {
                return res.json({
                    connected: true,
                    session: {
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                        isValid: true,
                    },
                });
            }
            const session = await session_repository_1.default.findByUserId(req.user.id);
            if (!session) {
                return res.json({ connected: false });
            }
            return res.json({
                connected: session.isValid,
                session: {
                    expiresAt: session.expiresAt,
                    isValid: session.isValid,
                },
            });
        }
        catch (err) {
            logger_1.default.error(`Get Fyers Session error: ${err.message}`);
            return res.status(500).json({ error: { message: 'Internal server error' } });
        }
    }
    async disconnectFyers(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: { message: 'Not authenticated' } });
            }
            await session_repository_1.default.delete(req.user.id);
            logger_1.default.info(`Disconnected Fyers for user: ${req.user.id}`);
            return res.json({ success: true });
        }
        catch (err) {
            logger_1.default.error(`Disconnect Fyers error: ${err.message}`);
            return res.status(500).json({ error: { message: 'Internal server error' } });
        }
    }
}
exports.AuthController = AuthController;
exports.default = new AuthController();
