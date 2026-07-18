import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/tradefinder',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'supersecret_fallback',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  fyers: {
    appId: process.env.FYERS_APP_ID || '',
    secretId: process.env.FYERS_SECRET_ID || '',
    authToken: process.env.FYERS_AUTH_TOKEN || '',
  }
};
