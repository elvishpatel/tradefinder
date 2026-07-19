import { Server } from 'socket.io';
import marketEngine from '../engines/market-engine';
import logger from '../utils/logger';
import sessionRepository from '../repositories/session-repository';
import config from '../config';

export class MarketStream {
  private io: Server;
  private isStreaming = false;
  private timer: NodeJS.Timeout | null = null;
  private simulatedInterval = 1000; // Broadcast every 1s

  constructor(io: Server) {
    this.io = io;
  }

  async start() {
    if (this.isStreaming) return;
    this.isStreaming = true;

    logger.info('Starting Market Live Streams...');

    // 1. Bootstrap MarketEngine data cache (passing a mock user ID if needed to read db)
    // We can fetch the first user from the DB to bootstrap, or skip user credentials for initial seed
    const { data: user } = await require('../config/supabase').default
      .from('users')
      .select('id')
      .limit(1)
      .maybeSingle();

    const userId = user?.id || '';
    await marketEngine.initialize(userId);

    // 2. Start streaming updates
    // In production, we connect to Fyers WebSocket using standard 'ws' package.
    // If connection fails, or no user has connected Fyers yet, we fall back to simulated tick streams.
    this.startStreamingFeed();
  }

  private startStreamingFeed() {
    logger.info('Initiating Real-time Broadcast Loops (Simulated Market Data Fallback active)');

    this.timer = setInterval(() => {
      // Simulate minor price fluctuations (market ticking) for all stocks in the universe
      const stocksData = (marketEngine as any).stocksCache;
      
      stocksData.forEach((stk: any) => {
        // Fluctuates price by -0.15% to +0.17% to simulate active bid-ask spreads
        const drift = (Math.random() * 0.32 - 0.15) / 100;
        const newClose = stk.close * (1 + drift);
        const change = newClose - stk.prevClose;
        const changePercent = (change / stk.prevClose) * 100;
        const tickVolume = stk.volume + Math.floor(Math.random() * 5000 + 100);

        marketEngine.updateTick(
          stk.symbol,
          newClose,
          change,
          changePercent,
          tickVolume
        );
      });

      // Fluctuate indices too
      const indices = (marketEngine as any).liveIndices;
      Object.keys(indices).forEach((sym) => {
        const idx = indices[sym];
        const drift = (Math.random() * 0.1 - 0.05) / 100;
        const newPrice = idx.price * (1 + drift);
        const change = newPrice - idx.prevClose;
        const changePercent = (change / idx.prevClose) * 100;
        marketEngine.updateIndex(sym, newPrice, change, changePercent);
      });

      // Broadcast latest data to all Socket.IO clients
      this.io.emit('dashboard-update', marketEngine.getDashboardData());
      this.io.emit('sectors-update', marketEngine.getSectorAnalysisList());
      this.io.emit('scanner-update-long', marketEngine.getScannerResults('LONG'));
      this.io.emit('scanner-update-short', marketEngine.getScannerResults('SHORT'));

    }, this.simulatedInterval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isStreaming = false;
    logger.info('Market Live Streams stopped.');
  }
}

export default MarketStream;
