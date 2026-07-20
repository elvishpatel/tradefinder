import { Server } from 'socket.io';
import marketEngine from '../engines/market-engine';
import logger from '../utils/logger';
import sessionRepository from '../repositories/session-repository';
import fyersClient from '../services/fyers-client';
import supabase from '../config/supabase';

export class MarketStream {
  private io: Server;
  private isStreaming = false;
  private timer: NodeJS.Timeout | null = null;
  private pollInterval = 2500; // Poll live quotes every 2.5 seconds
  private lastFyersFetchSuccess = false;

  constructor(io: Server) {
    this.io = io;
  }

  async start() {
    if (this.isStreaming) return;
    this.isStreaming = true;

    logger.info('Starting Market Live Stream Engine...');

    // 1. Bootstrap MarketEngine data cache
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .maybeSingle();

    const userId = user?.id || '';
    await marketEngine.initialize(userId);

    // 2. Start polling real market feed
    this.startStreamingFeed();
  }

  private async fetchActiveFyersToken(): Promise<string | null> {
    try {
      // 1. Check in-memory sessions cache first
      const memSessions = (sessionRepository as any).inMemorySessions;
      if (memSessions && memSessions.size > 0) {
        for (const [userId, s] of memSessions.entries()) {
          if (s && s.accessToken && new Date(s.expiresAt).getTime() > Date.now()) {
            return s.accessToken;
          }
        }
      }

      // 2. Query demo user or any active user in DB
      const demoSession = await sessionRepository.findByUserId('00000000-0000-0000-0000-000000000000');
      if (demoSession && demoSession.isValid && demoSession.accessToken) {
        return demoSession.accessToken;
      }

      // 3. Fallback database query
      const { data, error } = await supabase
        .from('fyers_sessions')
        .select('user_id, access_token, expires_at')
        .gt('expires_at', new Date().toISOString())
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const session = await sessionRepository.findByUserId(data.user_id);
        if (session && session.isValid && session.accessToken) {
          return session.accessToken;
        }
      }

      return null;
    } catch (err: any) {
      logger.error(`Error querying active Fyers token: ${err.message}`);
      return null;
    }
  }


  private startStreamingFeed() {
    logger.info('Initiating Real-time Fyers Market Polling Loop...');

    this.timer = setInterval(async () => {
      const activeToken = await this.fetchActiveFyersToken();

      if (!activeToken) {
        if (this.lastFyersFetchSuccess) {
          logger.warn('[MARKET STREAM] Fyers session disconnected or expired. Waiting for token connection...');
          this.lastFyersFetchSuccess = false;
        }

        // Notify connected clients that Fyers token is required
        this.io.emit('feed-status', {
          connected: false,
          message: 'Fyers API Access Token Required for Live Data',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Collect all symbols to poll
      const stockSymbols = Array.from((marketEngine as any).stocksCache.keys());
      const indexSymbols = Object.keys((marketEngine as any).liveIndices || {});
      const allSymbols = Array.from(new Set([...indexSymbols, ...stockSymbols])) as string[];


      if (allSymbols.length === 0) return;

      try {
        // Fetch REAL quotes from Fyers API
        const realQuotes = await fyersClient.getQuotesWithToken(allSymbols, activeToken);
        const quoteCount = Object.keys(realQuotes).length;

        if (quoteCount > 0) {
          if (!this.lastFyersFetchSuccess) {
            logger.info(`[LIVE FYERS FEED] Successfully established live quotes stream (${quoteCount} symbols synced)`);
            this.lastFyersFetchSuccess = true;
          }

          // Update MarketEngine with REAL Fyers price ticks
          Object.values(realQuotes).forEach((q) => {
            if (q.symbol.endsWith('-INDEX')) {
              marketEngine.updateIndex(q.symbol, q.price, q.change, q.changePercent);
            } else {
              marketEngine.updateTick(q.symbol, q.price, q.change, q.changePercent, q.volume);
            }
          });

          // Broadcast updated REAL market metrics to clients
          this.io.emit('feed-status', {
            connected: true,
            message: 'Live Fyers Data Stream Active',
            timestamp: new Date().toISOString(),
          });
          this.io.emit('dashboard-update', marketEngine.getDashboardData());
          this.io.emit('sectors-update', marketEngine.getSectorAnalysisList());
          this.io.emit('scanner-update-long', marketEngine.getScannerResults('LONG'));
          this.io.emit('scanner-update-short', marketEngine.getScannerResults('SHORT'));
        } else {
          logger.warn('[MARKET STREAM] Fyers API returned empty quotes object. Token may be invalid.');
        }
      } catch (err: any) {
        logger.error(`[MARKET STREAM ERROR] Failed to fetch quotes from Fyers: ${err.message}`);
      }
    }, this.pollInterval);
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
