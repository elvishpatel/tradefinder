import { create } from 'zustand';
import api from '../services/api';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  fyersConnected: boolean;
  fyersSession: { expiresAt: string; isValid: boolean } | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  checkFyersSession: () => Promise<boolean>;
  saveDirectFyersToken: (token: string, clientId?: string, secretKey?: string) => Promise<boolean>;
  disconnectFyers: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('tf_token'),
  fyersConnected: false,
  fyersSession: null,
  loading: true,

  login: (token, user) => {
    localStorage.setItem('tf_token', token);
    set({ token, user, loading: false });
  },

  logout: () => {
    localStorage.removeItem('tf_token');
    set({ token: null, user: null, fyersConnected: false, fyersSession: null, loading: false });
  },

  checkAuth: async () => {
    const token = get().token;
    if (!token) {
      set({ user: null, loading: false });
      return false;
    }

    try {
      set({ loading: true });
      const response = await api.get('/auth/me');
      set({ user: response.data.user, loading: false });
      return true;
    } catch (err) {
      localStorage.removeItem('tf_token');
      set({ token: null, user: null, loading: false });
      return false;
    }
  },

  checkFyersSession: async () => {
    if (!get().token) return false;
    try {
      const response = await api.get('/auth/fyers/session');
      if (response.data.connected) {
        set({
          fyersConnected: true,
          fyersSession: response.data.session,
        });
        return true;
      } else {
        set({ fyersConnected: false, fyersSession: null });
        return false;
      }
    } catch (err) {
      set({ fyersConnected: false, fyersSession: null });
      return false;
    }
  },

  saveDirectFyersToken: async (token: string, clientId?: string, secretKey?: string) => {
    try {
      const response = await api.post('/auth/fyers/direct-token', { token, clientId, secretKey });
      if (response.data.connected || response.data.success) {
        set({
          fyersConnected: true,
          fyersSession: {
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            isValid: true,
          },
        });
        return true;
      }
      return false;
    } catch (err) {
      throw err;
    }
  },


  disconnectFyers: async () => {
    try {
      await api.post('/auth/fyers/disconnect');
      set({ fyersConnected: false, fyersSession: null });
    } catch (err) {
      console.error('Failed to disconnect Fyers:', err);
    }
  },
}));

export default useAuthStore;
