import { SMA, EMA, RSI, MACD, ATR, BollingerBands } from 'technicalindicators';

export class IndicatorEngine {
  /**
   * Calculate Simple Moving Average
   */
  static getSMA(period: number, values: number[]): number[] {
    return SMA.calculate({ period, values });
  }

  /**
   * Calculate Exponential Moving Average
   */
  static getEMA(period: number, values: number[]): number[] {
    return EMA.calculate({ period, values });
  }

  /**
   * Calculate Relative Strength Index
   */
  static getRSI(period: number, values: number[]): number[] {
    return RSI.calculate({ period, values });
  }

  /**
   * Calculate MACD
   */
  static getMACD(
    values: number[],
    fastPeriod = 12,
    slowPeriod = 26,
    signalPeriod = 9
  ) {
    return MACD.calculate({
      values,
      fastPeriod,
      slowPeriod,
      signalPeriod,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });
  }

  /**
   * Calculate Average True Range (ATR)
   */
  static getATR(
    period: number,
    high: number[],
    low: number[],
    close: number[]
  ): number[] {
    return ATR.calculate({ period, high, low, close });
  }

  /**
   * Calculate Bollinger Bands
   */
  static getBollingerBands(period: number, stdDev: number, values: number[]) {
    return BollingerBands.calculate({ period, stdDev, values });
  }
}
