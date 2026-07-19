"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionRepository = void 0;
const supabase_1 = __importDefault(require("../config/supabase"));
const crypto_1 = require("../utils/crypto");
class SessionRepository {
    async findByUserId(userId) {
        const { data, error } = await supabase_1.default
            .from('fyers_sessions')
            .select('user_id, access_token, refresh_token, expires_at')
            .eq('user_id', userId)
            .maybeSingle();
        if (error)
            throw new Error(error.message);
        if (!data)
            return null;
        let accessToken = '';
        let refreshToken = '';
        try {
            accessToken = (0, crypto_1.decrypt)(data.access_token);
            refreshToken = data.refresh_token ? (0, crypto_1.decrypt)(data.refresh_token) : '';
        }
        catch (decryptErr) {
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
    async upsert(userId, accessToken, refreshToken, expiresAt) {
        const encryptedAccess = (0, crypto_1.encrypt)(accessToken);
        const encryptedRefresh = refreshToken ? (0, crypto_1.encrypt)(refreshToken) : null;
        const { data, error } = await supabase_1.default
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
        if (error)
            throw new Error(error.message);
        return {
            userId: data.user_id,
            accessToken,
            expiresAt: data.expires_at,
            isValid: new Date(data.expires_at).getTime() > Date.now(),
        };
    }
    async delete(userId) {
        const { error } = await supabase_1.default
            .from('fyers_sessions')
            .delete()
            .eq('user_id', userId);
        if (error)
            throw new Error(error.message);
    }
}
exports.SessionRepository = SessionRepository;
exports.default = new SessionRepository();
