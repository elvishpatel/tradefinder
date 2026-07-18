import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { io } from '../server';
import { config } from '../config/env';

class FyersSocketService {
  private ws: WebSocket | null = null;
  private isConnected = false;
  
  // Dummy endpoint for Fyers WS (replace with actual Fyers Data WS endpoint)
  private endpoint = 'wss://api.fyers.in/socket/v3/data';

  connect() {
    if (this.isConnected) return;

    // Fyers WS requires an access token
    const token = `${config.fyers.appId}:${config.fyers.authToken}`;
    
    this.ws = new WebSocket(`${this.endpoint}?access_token=${token}`);

    this.ws.on('open', () => {
      this.isConnected = true;
      logger.info('Connected to Fyers WebSocket');
      this.subscribeToSymbols(['NSE:NIFTY50-INDEX', 'NSE:NIFTYBANK-INDEX', 'NSE:RELIANCE-EQ']);
    });

    this.ws.on('message', (data: Buffer) => {
      this.handleMessage(data);
    });

    this.ws.on('close', () => {
      this.isConnected = false;
      logger.warn('Fyers WebSocket Disconnected. Reconnecting in 5s...');
      setTimeout(() => this.connect(), 5000);
    });

    this.ws.on('error', (err) => {
      logger.error(`Fyers WS Error: ${err.message}`);
    });
  }

  private handleMessage(data: Buffer) {
    try {
      // In Fyers v3, data can be binary. We assume it's parsed or text for this boilerplate
      const parsed = JSON.parse(data.toString());
      
      // Broadcast live data to all connected clients via Socket.io
      // For a real app, only broadcast to clients subscribed to specific rooms
      io.emit('market_data', parsed);
      
      // We would also push this to Redis (Upstash) or a pub/sub queue here for the Scanner Engine
    } catch (e) {
      // Handle parse error
    }
  }

  subscribeToSymbols(symbols: string[]) {
    if (!this.isConnected || !this.ws) return;
    
    const payload = {
      T: 'SUB_L2',
      L2LIST: symbols
    };
    
    this.ws.send(JSON.stringify(payload));
    logger.info(`Subscribed to: ${symbols.join(', ')}`);
  }
}

export const fyersSocketService = new FyersSocketService();
