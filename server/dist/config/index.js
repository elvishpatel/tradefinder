"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env from root of server
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
exports.config = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    JWT_SECRET: process.env.JWT_SECRET || 'tradefinder-super-secret-jwt-key',
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_KEY: process.env.SUPABASE_KEY || '',
    FYERS: {
        CLIENT_ID: process.env.FYERS_CLIENT_ID || '',
        SECRET_KEY: process.env.FYERS_SECRET_KEY || '',
        REDIRECT_URI: process.env.FYERS_REDIRECT_URI || 'http://localhost:5000/api/v1/auth/fyers/callback',
    },
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'f0923a1a9e884e8b39c00b21a8cd28d1', // 32 chars hex key for AES-256-GCM or AES-256-CBC
};
// Quick validation on startup
const missingVars = [];
if (!exports.config.SUPABASE_URL)
    missingVars.push('SUPABASE_URL');
if (!exports.config.SUPABASE_KEY)
    missingVars.push('SUPABASE_KEY');
if (!exports.config.FYERS.CLIENT_ID)
    missingVars.push('FYERS_CLIENT_ID');
if (!exports.config.FYERS.SECRET_KEY)
    missingVars.push('FYERS_SECRET_KEY');
if (missingVars.length > 0) {
    console.warn(`[WARNING]: Missing critical environment variables: ${missingVars.join(', ')}. Please setup server/.env file.`);
}
exports.default = exports.config;
