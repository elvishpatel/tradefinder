import { logger } from '../utils/logger';
import { io } from '../server';
import { config } from '../config/env';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fyersModel = require('fyers-api-v3');

class FyersSocketService {
  private fyersDataSocket: any = null;
  private isConnected = false;

  connect() {
    if (this.isConnected) return;

    const accessToken = `${config.fyers.appId}:${config.fyers.authToken}`;

    try {
      this.fyersDataSocket = new fyersModel.fyersDataSocket(accessToken, './', false);

      this.fyersDataSocket.on('connect', () => {
        this.isConnected = true;
        logger.info('Connected to Official Fyers Market Data Socket');
        this.subscribeToSymbols(['NSE:NIFTY50-INDEX', 'NSE:NIFTYBANK-INDEX', 'NSE:RELIANCE-EQ']);
      });

      this.fyersDataSocket.on('message', (msg: any) => {
        this.handleMessage(msg);
      });

      this.fyersDataSocket.on('error', (err: any) => {
        logger.error(`Fyers Official WS Error: ${JSON.stringify(err)}`);
      });

      this.fyersDataSocket.on('close', () => {
        this.isConnected = false;
        logger.warn('Fyers Official WS Disconnected');
      });

      this.fyersDataSocket.autoreconnect(6);
      this.fyersDataSocket.connect();
    } catch (error) {
      logger.error('Failed to initialize Fyers Data Socket: ' + error);
    }
  }

  private handleMessage(data: any) {
    try {
      // Broadcast live data to all connected clients via Socket.io
      io.emit('market_data', data);
    } catch (e) {
      logger.error('Error handling Fyers message: ' + e);
    }
  }

  subscribeToSymbols(symbols: string[]) {
    if (!this.isConnected || !this.fyersDataSocket) return;
    
    try {
      // 'symbolUpdate' for OHLCV, 'lite' for LTP
      this.fyersDataSocket.subscribe(symbols, 'symbolUpdate');
      logger.info(`Subscribed to: ${symbols.join(', ')}`);
    } catch (e) {
      logger.error('Error subscribing to symbols: ' + e);
    }
  }
}

export const fyersSocketService = new FyersSocketService();
