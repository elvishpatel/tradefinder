import axios from 'axios';
import crypto from 'crypto';
import config from '../config';
import sessionRepository from '../repositories/session-repository';
import logger from '../utils/logger';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface NormalizedQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  prevClose: number;
}

export class FyersClient {
  /**
   * Formats the Authorization header for Fyers API v3.
   * Format required: "CLIENT_ID:ACCESS_TOKEN"
   */
  public formatAuthHeader(token: string): string {
    if (token.includes(':')) {
      return token;
    }
    const clientId = config.FYERS.CLIENT_ID;
    if (!clientId) {
      return token;
    }
    return `${clientId}:${token}`;
  }

  /**
   * Validate a Fyers Access Token by attempting to fetch Nifty 50 quote
   */
  async validateAccessToken(token: string): Promise<{ valid: boolean; message?: string }> {
    try {
      const authHeader = this.formatAuthHeader(token);
      const response = await axios.get('https://api-t1.fyers.in/data/quotes', {
        params: { symbols: 'NSE:NIFTY50-INDEX' },
        headers: { Authorization: authHeader },
        timeout: 6000,
      });

      if (response.data && (response.data.s === 'ok' || Array.isArray(response.data.d))) {
        return { valid: true };
      }

      const errMsg = response.data?.errmsg || response.data?.message || 'Invalid or expired Fyers Access Token';
      return { valid: false, message: errMsg };
    } catch (err: any) {
      const msg = err.response?.data?.errmsg || err.response?.data?.message || err.message || 'Token validation failed';
      logger.error(`Fyers token validation error: ${msg}`);
      return { valid: false, message: msg };
    }
  }

  /**
   * Exchange an Auth Code for an Access Token
   */
  async exchangeAuthCode(
    authCode: string,
    clientId?: string,
    secretKey?: string
  ): Promise<{ success: boolean; accessToken?: string; message?: string }> {
    try {
      const activeClientId = clientId || config.FYERS.CLIENT_ID;
      const activeSecretKey = secretKey || config.FYERS.SECRET_KEY;

      if (!activeClientId || !activeSecretKey) {
        return {
          success: false,
          message: 'Fyers Client ID and Secret Key are required to convert an Auth Code into an Access Token.',
        };
      }

      const rawString = `${activeClientId}:${activeSecretKey}`;
      const appIdHash = crypto.createHash('sha256').update(rawString).digest('hex');

      const response = await axios.post(
        'https://api-t1.fyers.in/api/v3/validate-authcode',
        {
          grant_type: 'authorization_code',
          appIdHash: appIdHash,
          code: authCode,
        },
        { timeout: 8000 }
      );

      if (response.data && response.data.s === 'ok' && response.data.access_token) {
        const fullToken = `${activeClientId}:${response.data.access_token}`;
        return { success: true, accessToken: fullToken };
      }

      const msg = response.data?.message || response.data?.errmsg || 'Failed to exchange Auth Code for Access Token';
      return { success: false, message: msg };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.errmsg || err.message || 'Auth code exchange failed';
      logger.error(`Fyers auth code exchange error: ${msg}`);
      return { success: false, message: msg };
    }
  }

  /**
   * Fetch live quotes for an array of symbols using a specified Access Token
   */
  async getQuotesWithToken(symbols: string[], token: string): Promise<Record<string, NormalizedQuote>> {
    if (symbols.length === 0) return {};

    const authHeader = this.formatAuthHeader(token);
    const results: Record<string, NormalizedQuote> = {};

    // Batch symbols in chunks of 40 (Fyers supports up to 50 per call)
    const chunkSize = 40;
    for (let i = 0; i < symbols.length; i += chunkSize) {
      const chunk = symbols.slice(i, i + chunkSize);
      const symbolString = chunk.join(',');

      try {
        const response = await axios.get('https://api-t1.fyers.in/data/quotes', {
          params: { symbols: symbolString },
          headers: { Authorization: authHeader },
          timeout: 6000,
        });

        if (response.data && response.data.s === 'ok' && Array.isArray(response.data.d)) {
          for (const item of response.data.d) {
            if (item && item.n && item.v) {
              const sym = item.n;
              const v = item.v;

              results[sym] = {
                symbol: sym,
                price: Number(v.lp || v.cmd?.c || 0),
                change: Number(v.ch || 0),
                changePercent: Number(v.chp || 0),
                volume: Number(v.volume || v.cmd?.v || 0),
                high: Number(v.high_price || v.cmd?.h || 0),
                low: Number(v.low_price || v.cmd?.l || 0),
                prevClose: Number(v.prev_close_price || (v.lp ? v.lp - v.ch : 0)),
              };
            }
          }
        } else if (response.data && response.data.errmsg) {
          logger.warn(`Fyers quotes API batch warning: ${response.data.errmsg}`);
        }
      } catch (err: any) {
        logger.error(`Fyers quotes fetch error: ${err.message}`);
      }
    }

    return results;
  }

  /**
   * Fetch current quotes using a user's stored session
   */
  async getQuotes(symbols: string[], userId: string): Promise<Record<string, NormalizedQuote>> {
    const session = await sessionRepository.findByUserId(userId);
    if (!session || !session.isValid) {
      throw new Error(`Fyers session invalid or expired for user: ${userId}`);
    }
    return this.getQuotesWithToken(symbols, session.accessToken);
  }

  /**
   * Fetch historical daily/intraday candles for a symbol
   */
  async getHistory(
    symbol: string,
    resolution: string,
    rangeFrom: string, // YYYY-MM-DD
    rangeTo: string,   // YYYY-MM-DD
    token: string
  ): Promise<any[]> {
    try {
      await sleep(150);
      const authHeader = this.formatAuthHeader(token);

      const response = await axios.get('https://api-t1.fyers.in/data/history', {
        params: {
          symbol,
          resolution,
          date_format: '1',
          range_from: rangeFrom,
          range_to: rangeTo,
        },
        headers: { Authorization: authHeader },
        timeout: 8000,
      });

      if (response.data && response.data.s === 'ok') {
        return response.data.candles || [];
      } else {
        logger.warn(`Fyers history warning for ${symbol}: ${response.data?.errmsg || 'No data'}`);
        return [];
      }
    } catch (err: any) {
      logger.error(`Fyers getHistory error for ${symbol}: ${err.message}`);
      return [];
    }
  }
}

export default new FyersClient();
