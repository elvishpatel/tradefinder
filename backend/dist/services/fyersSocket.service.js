"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fyersSocketService = void 0;
const ws_1 = __importDefault(require("ws"));
const logger_1 = require("../utils/logger");
const server_1 = require("../server");
const env_1 = require("../config/env");
class FyersSocketService {
    ws = null;
    isConnected = false;
    // Dummy endpoint for Fyers WS (replace with actual Fyers Data WS endpoint)
    endpoint = 'wss://api.fyers.in/socket/v3/data';
    connect() {
        if (this.isConnected)
            return;
        // Fyers WS requires an access token
        const token = `${env_1.config.fyers.appId}:${env_1.config.fyers.authToken}`;
        this.ws = new ws_1.default(`${this.endpoint}?access_token=${token}`);
        this.ws.on('open', () => {
            this.isConnected = true;
            logger_1.logger.info('Connected to Fyers WebSocket');
            this.subscribeToSymbols(['NSE:NIFTY50-INDEX', 'NSE:NIFTYBANK-INDEX', 'NSE:RELIANCE-EQ']);
        });
        this.ws.on('message', (data) => {
            this.handleMessage(data);
        });
        this.ws.on('close', () => {
            this.isConnected = false;
            logger_1.logger.warn('Fyers WebSocket Disconnected. Reconnecting in 5s...');
            setTimeout(() => this.connect(), 5000);
        });
        this.ws.on('error', (err) => {
            logger_1.logger.error(`Fyers WS Error: ${err.message}`);
        });
    }
    handleMessage(data) {
        try {
            // In Fyers v3, data can be binary. We assume it's parsed or text for this boilerplate
            const parsed = JSON.parse(data.toString());
            // Broadcast live data to all connected clients via Socket.io
            // For a real app, only broadcast to clients subscribed to specific rooms
            server_1.io.emit('market_data', parsed);
            // We would also push this to Redis (Upstash) or a pub/sub queue here for the Scanner Engine
        }
        catch (e) {
            // Handle parse error
        }
    }
    subscribeToSymbols(symbols) {
        if (!this.isConnected || !this.ws)
            return;
        const payload = {
            T: 'SUB_L2',
            L2LIST: symbols
        };
        this.ws.send(JSON.stringify(payload));
        logger_1.logger.info(`Subscribed to: ${symbols.join(', ')}`);
    }
}
exports.fyersSocketService = new FyersSocketService();
