import { IndicatorEngine } from '../indicator-engine';

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class ScannerEngine {
  /**
   * Check if the latest RSI is above a threshold
   */
  static checkRSIOverbought(candles: Candle[], threshold = 70): boolean {
    const closes = candles.map(c => c.close);
    const rsiValues = IndicatorEngine.getRSI(14, closes);
    if (rsiValues.length === 0) return false;
    
    return rsiValues[rsiValues.length - 1] > threshold;
  }

  /**
   * Check if stock had a volume breakout (volume > N * average volume)
   */
  static checkVolumeBreakout(candles: Candle[], multiplier = 2.5, period = 20): boolean {
    if (candles.length < period) return false;
    
    const recentCandle = candles[candles.length - 1];
    const previousCandles = candles.slice(candles.length - period - 1, candles.length - 1);
    
    const avgVolume = previousCandles.reduce((sum, c) => sum + c.volume, 0) / period;
    
    return recentCandle.volume > (avgVolume * multiplier);
  }

  /**
   * Check if close is above EMA 20 and EMA 50
   */
  static checkUptrend(candles: Candle[]): boolean {
    const closes = candles.map(c => c.close);
    const ema20 = IndicatorEngine.getEMA(20, closes);
    const ema50 = IndicatorEngine.getEMA(50, closes);
    
    if (ema20.length === 0 || ema50.length === 0) return false;
    
    const latestClose = closes[closes.length - 1];
    const latestEma20 = ema20[ema20.length - 1];
    const latestEma50 = ema50[ema50.length - 1];
    
    return latestClose > latestEma20 && latestEma20 > latestEma50;
  }

  /**
   * Swing Scanner: Runs multiple conditions to find a setup
   */
  static runSwingScanner(symbol: string, dailyCandles: Candle[]) {
    return {
      symbol,
      isUptrend: this.checkUptrend(dailyCandles),
      isVolumeBreakout: this.checkVolumeBreakout(dailyCandles),
      isOverbought: this.checkRSIOverbought(dailyCandles),
      // We can add a combined score
      score: this.calculateMomentumScore(dailyCandles)
    };
  }

  static calculateMomentumScore(candles: Candle[]): number {
    let score = 0;
    if (this.checkUptrend(candles)) score += 40;
    if (this.checkVolumeBreakout(candles)) score += 30;
    
    const closes = candles.map(c => c.close);
    const rsi = IndicatorEngine.getRSI(14, closes);
    if (rsi.length > 0) {
      const latestRsi = rsi[rsi.length - 1];
      if (latestRsi > 50 && latestRsi < 75) score += 30; // Healthy momentum
    }
    
    return score;
  }
}
