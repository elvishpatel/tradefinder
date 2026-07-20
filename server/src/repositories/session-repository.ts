import supabase from '../config/supabase';
import { FyersSession } from '../types';
import { encrypt, decrypt } from '../utils/crypto';
import logger from '../utils/logger';

export class SessionRepository {
  private inMemorySessions = new Map<string, { accessToken: string; refreshToken: string | null; expiresAt: string }>();

  async findByUserId(userId: string): Promise<FyersSession | null> {
    try {
      const { data, error } = await supabase
        .from('fyers_sessions')
        .select('user_id, access_token, refresh_token, expires_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        let accessToken = '';
        let refreshToken = '';
        try {
          accessToken = decrypt(data.access_token);
          refreshToken = data.refresh_token ? decrypt(data.refresh_token) : '';
        } catch {
          accessToken = data.access_token;
        }

        const expiresAtDate = new Date(data.expires_at);
        const isValid = expiresAtDate.getTime() > Date.now();

        return {
          userId: data.user_id,
          accessToken,
          expiresAt: data.expires_at,
          isValid,
        };
      }
    } catch (err: any) {
      logger.warn(`Supabase session fetch warning: ${err.message}`);
    }

    // Fallback to in-memory session cache if Supabase RLS is active
    const memSession = this.inMemorySessions.get(userId);
    if (memSession) {
      const expiresAtDate = new Date(memSession.expiresAt);
      const isValid = expiresAtDate.getTime() > Date.now();

      return {
        userId,
        accessToken: memSession.accessToken,
        expiresAt: memSession.expiresAt,
        isValid,
      };
    }

    return null;
  }

  async upsert(userId: string, accessToken: string, refreshToken: string | null, expiresAt: Date): Promise<FyersSession> {
    const expiresAtIso = expiresAt.toISOString();

    // 1. Always update in-memory session map first (guarantees zero downtime even under strict RLS)
    this.inMemorySessions.set(userId, {
      accessToken,
      refreshToken,
      expiresAt: expiresAtIso,
    });

    // 2. Attempt database persistence
    try {
      const encryptedAccess = encrypt(accessToken);
      const encryptedRefresh = refreshToken ? encrypt(refreshToken) : null;

      const { error } = await supabase
        .from('fyers_sessions')
        .upsert(
          {
            user_id: userId,
            access_token: encryptedAccess,
            refresh_token: encryptedRefresh,
            expires_at: expiresAtIso,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        logger.warn(`Supabase RLS notice for fyers_sessions: ${error.message}. Session cached in server memory.`);
      }
    } catch (dbErr: any) {
      logger.warn(`Database session persistence notice: ${dbErr.message}. Session cached in server memory.`);
    }

    return {
      userId,
      accessToken,
      expiresAt: expiresAtIso,
      isValid: new Date(expiresAtIso).getTime() > Date.now(),
    };
  }

  async delete(userId: string): Promise<void> {
    this.inMemorySessions.delete(userId);
    try {
      await supabase
        .from('fyers_sessions')
        .delete()
        .eq('user_id', userId);
    } catch (err: any) {
      logger.warn(`Supabase delete session notice: ${err.message}`);
    }
  }
}

export default new SessionRepository();
