"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationEngine = void 0;
const logger_1 = require("../utils/logger");
const server_1 = require("../server");
const scanner_engine_1 = require("../scanner-engine");
class NotificationEngine {
    static processAlerts(alerts, currentCandles) {
        alerts.forEach(alert => {
            const candles = currentCandles[alert.symbol];
            if (!candles || candles.length === 0)
                return;
            const latest = candles[candles.length - 1];
            let triggered = false;
            let message = '';
            switch (alert.condition) {
                case 'PRICE_ABOVE':
                    if (alert.value && latest.close > alert.value) {
                        triggered = true;
                        message = `${alert.symbol} crossed above ${alert.value}`;
                    }
                    break;
                case 'PRICE_BELOW':
                    if (alert.value && latest.close < alert.value) {
                        triggered = true;
                        message = `${alert.symbol} crossed below ${alert.value}`;
                    }
                    break;
                case 'VOLUME_BREAKOUT':
                    if (scanner_engine_1.ScannerEngine.checkVolumeBreakout(candles)) {
                        triggered = true;
                        message = `${alert.symbol} had a volume breakout!`;
                    }
                    break;
                case 'RSI_OVERBOUGHT':
                    if (scanner_engine_1.ScannerEngine.checkRSIOverbought(candles)) {
                        triggered = true;
                        message = `${alert.symbol} RSI is over 70`;
                    }
                    break;
            }
            if (triggered) {
                this.dispatchAlert(alert.userId, message);
            }
        });
    }
    static dispatchAlert(userId, message) {
        logger_1.logger.info(`Dispatching alert to User ${userId}: ${message}`);
        // Emit to a specific user's socket room
        server_1.io.to(`user_${userId}`).emit('notification', { message, timestamp: Date.now() });
        // In a real app, we might also push to an Email/SMS queue here.
    }
}
exports.NotificationEngine = NotificationEngine;
