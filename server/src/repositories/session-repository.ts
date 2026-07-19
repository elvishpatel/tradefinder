import supabase from '../config/supabase';
import { FyersSession } from '../types';
import { encrypt, decrypt } from '../utils/crypto';


export class SessionRepository {
  async findByUserId(userId: string): Promise<FyersSession | null> {
    const { data, error } = await supabase
      .from('fyers_sessions')
      .select('user_id, access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    let accessToken = '';
    let refreshToken = '';

    try {
      accessToken = decrypt(data.access_token);
      refreshToken = data.refresh_token ? decrypt(data.refresh_token) : '';
    } catch (decryptErr: any) {
      console.error('Failed to decrypt session tokens:', decryptErr.message);
      return null;
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

  async upsert(userId: string, accessToken: string, refreshToken: string | null, expiresAt: Date): Promise<FyersSession> {
    const encryptedAccess = encrypt(accessToken);
    const encryptedRefresh = refreshToken ? encrypt(refreshToken) : null;

    const { data, error } = await supabase
      .from('fyers_sessions')
      .upsert({
        user_id: userId,
        access_token: encryptedAccess,
        refresh_token: encryptedRefresh,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select('user_id, expires_at')
      .single();

    if (error) throw new Error(error.message);

    return {
      userId: data.user_id,
      accessToken,
      expiresAt: data.expires_at,
      isValid: new Date(data.expires_at).getTime() > Date.now(),
    };
  }

  async delete(userId: string): Promise<void> {
    const { error } = await supabase
      .from('fyers_sessions')
      .delete()
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  }
}

export default new SessionRepository();
