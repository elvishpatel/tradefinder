import { logger } from '../utils/logger';
import { io } from '../server';
import { ScannerEngine, Candle } from '../scanner-engine';

export interface AlertConfig {
  userId: string;
  symbol: string;
  condition: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'VOLUME_BREAKOUT' | 'RSI_OVERBOUGHT';
  value?: number;
}

export class NotificationEngine {
  static processAlerts(alerts: AlertConfig[], currentCandles: Record<string, Candle[]>) {
    alerts.forEach(alert => {
      const candles = currentCandles[alert.symbol];
      if (!candles || candles.length === 0) return;
      
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
          if (ScannerEngine.checkVolumeBreakout(candles)) {
            triggered = true;
            message = `${alert.symbol} had a volume breakout!`;
          }
          break;
        case 'RSI_OVERBOUGHT':
          if (ScannerEngine.checkRSIOverbought(candles)) {
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

  static dispatchAlert(userId: string, message: string) {
    logger.info(`Dispatching alert to User ${userId}: ${message}`);
    // Emit to a specific user's socket room
    io.to(`user_${userId}`).emit('notification', { message, timestamp: Date.now() });
    
    // In a real app, we might also push to an Email/SMS queue here.
  }
}
