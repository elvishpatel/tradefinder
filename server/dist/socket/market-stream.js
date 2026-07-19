"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketStream = void 0;
const market_engine_1 = __importDefault(require("../engines/market-engine"));
const logger_1 = __importDefault(require("../utils/logger"));
class MarketStream {
    io;
    isStreaming = false;
    timer = null;
    simulatedInterval = 1000; // Broadcast every 1s
    constructor(io) {
        this.io = io;
    }
    async start() {
        if (this.isStreaming)
            return;
        this.isStreaming = true;
        logger_1.default.info('Starting Market Live Streams...');
        // 1. Bootstrap MarketEngine data cache (passing a mock user ID if needed to read db)
        // We can fetch the first user from the DB to bootstrap, or skip user credentials for initial seed
        const { data: user } = await require('../config/supabase').default
            .from('users')
            .select('id')
            .limit(1)
            .maybeSingle();
        const userId = user?.id || '';
        await market_engine_1.default.initialize(userId);
        // 2. Start streaming updates
        // In production, we connect to Fyers WebSocket using standard 'ws' package.
        // If connection fails, or no user has connected Fyers yet, we fall back to simulated tick streams.
        this.startStreamingFeed();
    }
    startStreamingFeed() {
        logger_1.default.info('Initiating Real-time Broadcast Loops (Simulated Market Data Fallback active)');
        this.timer = setInterval(() => {
            // Simulate minor price fluctuations (market ticking) for all stocks in the universe
            const stocksData = market_engine_1.default.stocksCache;
            stocksData.forEach((stk) => {
                // Fluctuates price by -0.15% to +0.17% to simulate active bid-ask spreads
                const drift = (Math.random() * 0.32 - 0.15) / 100;
                const newClose = stk.close * (1 + drift);
                const change = newClose - stk.prevClose;
                const changePercent = (change / stk.prevClose) * 100;
                const tickVolume = stk.volume + Math.floor(Math.random() * 5000 + 100);
                market_engine_1.default.updateTick(stk.symbol, newClose, change, changePercent, tickVolume);
            });
            // Fluctuate indices too
            const indices = market_engine_1.default.liveIndices;
            Object.keys(indices).forEach((sym) => {
                const idx = indices[sym];
                const drift = (Math.random() * 0.1 - 0.05) / 100;
                const newPrice = idx.price * (1 + drift);
                const change = newPrice - idx.prevClose;
                const changePercent = (change / idx.prevClose) * 100;
                market_engine_1.default.updateIndex(sym, newPrice, change, changePercent);
            });
            // Broadcast latest data to all Socket.IO clients
            this.io.emit('dashboard-update', market_engine_1.default.getDashboardData());
            this.io.emit('sectors-update', market_engine_1.default.getSectorAnalysisList());
            this.io.emit('scanner-update-long', market_engine_1.default.getScannerResults('LONG'));
            this.io.emit('scanner-update-short', market_engine_1.default.getScannerResults('SHORT'));
        }, this.simulatedInterval);
    }
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.isStreaming = false;
        logger_1.default.info('Market Live Streams stopped.');
    }
}
exports.MarketStream = MarketStream;
exports.default = MarketStream;
