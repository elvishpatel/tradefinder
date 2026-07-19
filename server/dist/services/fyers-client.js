"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FyersClient = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../config"));
const session_repository_1 = __importDefault(require("../repositories/session-repository"));
const logger_1 = __importDefault(require("../utils/logger"));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
class FyersClient {
    async getAuthHeader(userId) {
        const session = await session_repository_1.default.findByUserId(userId);
        if (!session || !session.isValid) {
            throw new Error(`Fyers session invalid or expired for user: ${userId}`);
        }
        return `${config_1.default.FYERS.CLIENT_ID}:${session.accessToken}`;
    }
    /**
     * Fetch current quotes for a batch of symbols (limit: 50 symbols per request)
     */
    async getQuotes(symbols, userId) {
        if (symbols.length === 0)
            return {};
        try {
            const authHeader = await this.getAuthHeader(userId);
            const symbolString = symbols.join(',');
            const response = await axios_1.default.get('https://api-t1.fyers.in/data/quotes', {
                params: { symbols: symbolString },
                headers: { Authorization: authHeader },
            });
            if (response.data.s !== 'ok') {
                throw new Error(response.data.errmsg || 'Failed to fetch quotes');
            }
            return response.data.d || {};
        }
        catch (err) {
            logger_1.default.error(`Fyers getQuotes error: ${err.message}`);
            throw err;
        }
    }
    /**
     * Fetch historical candles for a specific symbol.
     * resolution: 'D' for Daily, '1', '5', '15' for Intraday minutes
     */
    async getHistory(symbol, resolution, rangeFrom, // YYYY-MM-DD
    rangeTo, // YYYY-MM-DD
    userId) {
        try {
            // Throttle API: sleep 150ms before historical requests to prevent rate limit blocks
            await sleep(150);
            const authHeader = await this.getAuthHeader(userId);
            const response = await axios_1.default.get('https://api-t1.fyers.in/data/history', {
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
                logger_1.default.warn(`Fyers history API warning for ${symbol}: ${response.data.errmsg || 'No data'}`);
                return [];
            }
            // Fyers returns history as an array of candles: [timestamp, open, high, low, close, volume]
            return response.data.candles || [];
        }
        catch (err) {
            logger_1.default.error(`Fyers getHistory error for ${symbol}: ${err.message}`);
            return [];
        }
    }
}
exports.FyersClient = FyersClient;
exports.default = new FyersClient();
