import axios from 'axios';
import config from '../config';
import sessionRepository from '../repositories/session-repository';
import logger from '../utils/logger';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class FyersClient {
  private async getAuthHeader(userId: string): Promise<string> {
    const session = await sessionRepository.findByUserId(userId);
    if (!session || !session.isValid) {
      throw new Error(`Fyers session invalid or expired for user: ${userId}`);
    }
    return `${config.FYERS.CLIENT_ID}:${session.accessToken}`;
  }

  /**
   * Fetch current quotes for a batch of symbols (limit: 50 symbols per request)
   */
  async getQuotes(symbols: string[], userId: string): Promise<any> {
    if (symbols.length === 0) return {};

    try {
      const authHeader = await this.getAuthHeader(userId);
      const symbolString = symbols.join(',');
      
      const response = await axios.get('https://api-t1.fyers.in/data/quotes', {
        params: { symbols: symbolString },
        headers: { Authorization: authHeader },
      });

      if (response.data.s !== 'ok') {
        throw new Error(response.data.errmsg || 'Failed to fetch quotes');
      }

      return response.data.d || {};
    } catch (err: any) {
      logger.error(`Fyers getQuotes error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Fetch historical candles for a specific symbol.
   * resolution: 'D' for Daily, '1', '5', '15' for Intraday minutes
   */
  async getHistory(
    symbol: string,
    resolution: string,
    rangeFrom: string, // YYYY-MM-DD
    rangeTo: string,   // YYYY-MM-DD
    userId: string
  ): Promise<any[]> {
    try {
      // Throttle API: sleep 150ms before historical requests to prevent rate limit blocks
      await sleep(150);

      const authHeader = await this.getAuthHeader(userId);

      const response = await axios.get('https://api-t1.fyers.in/data/history', {
        params: {
          symbol,
          resolution,
          date_format: '1',
          range_from: rangeFrom,
          range_to: rangeTo,
        },
        headers: { Authorization: authHeader },
      });

      if (response.data.s !== 'ok') {
        // If symbol does not exist or historical data is missing
        logger.warn(`Fyers history API warning for ${symbol}: ${response.data.errmsg || 'No data'}`);
        return [];
      }

      // Fyers returns history as an array of candles: [timestamp, open, high, low, close, volume]
      return response.data.candles || [];
    } catch (err: any) {
      logger.error(`Fyers getHistory error for ${symbol}: ${err.message}`);
      return [];
    }
  }
}

export default new FyersClient();
