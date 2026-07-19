/**
 * Core Technical Analysis Indicators - Pure TypeScript Implementation
 */

export function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = new Array(prices.length).fill(0);
  if (prices.length < period) return ema;

  // Simple Moving Average for the first value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  const sma = sum / period;
  ema[period - 1] = sma;

  const multiplier = 2 / (period + 1);
  for (let i = period; i < prices.length; i++) {
    ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
  }

  return ema;
}

export function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = new Array(prices.length).fill(50); // Default neutral value
  if (prices.length <= period) return rsi;

  let gains = 0;
  let losses = 0;

  // First RSI value using standard SMA
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) {
      gains += diff;
    } else {
      losses -= diff;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  // Subsequent values using Wilder's smoothing technique
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    let gain = 0;
    let loss = 0;
    if (diff > 0) {
      gain = diff;
    } else {
      loss = -diff;
    }

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return rsi;
}

export interface MACDResult {
  macdLine: number[];
  signalLine: number[];
  histogram: number[];
}

export function calculateMACD(
  prices: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MACDResult {
  const length = prices.length;
  const macdLine = new Array(length).fill(0);
  const signalLine = new Array(length).fill(0);
  const histogram = new Array(length).fill(0);

  if (length < slowPeriod) {
    return { macdLine, signalLine, histogram };
  }

  const emaFast = calculateEMA(prices, fastPeriod);
  const emaSlow = calculateEMA(prices, slowPeriod);

  for (let i = slowPeriod - 1; i < length; i++) {
    macdLine[i] = emaFast[i] - emaSlow[i];
  }

  // Calculate EMA of the MACD Line for the Signal Line
  const multiplier = 2 / (signalPeriod + 1);
  
  // Find first non-zero MACD index
  const startIdx = slowPeriod - 1;
  let sum = 0;
  for (let i = startIdx; i < startIdx + signalPeriod && i < length; i++) {
    sum += macdLine[i];
  }
  const initialSignal = sum / Math.min(signalPeriod, length - startIdx);
  
  const signalStartIdx = startIdx + signalPeriod - 1;
  if (signalStartIdx < length) {
    signalLine[signalStartIdx] = initialSignal;
    histogram[signalStartIdx] = macdLine[signalStartIdx] - signalLine[signalStartIdx];

    for (let i = signalStartIdx + 1; i < length; i++) {
      signalLine[i] = (macdLine[i] - signalLine[i - 1]) * multiplier + signalLine[i - 1];
      histogram[i] = macdLine[i] - signalLine[i];
    }
  }

  return { macdLine, signalLine, histogram };
}

export function calculateATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): number[] {
  const atr: number[] = new Array(closes.length).fill(0);
  if (closes.length < period) return atr;

  const tr: number[] = new Array(closes.length).fill(0);
  tr[0] = highs[0] - lows[0];

  for (let i = 1; i < closes.length; i++) {
    const hL = highs[i] - lows[i];
    const hC = Math.abs(highs[i] - closes[i - 1]);
    const lC = Math.abs(lows[i] - closes[i - 1]);
    tr[i] = Math.max(hL, hC, lC);
  }

  // Simple Average of TR for first ATR value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += tr[i];
  }
  atr[period - 1] = sum / period;

  // Wilder's smoothing for subsequent ATR values
  for (let i = period; i < closes.length; i++) {
    atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period;
  }

  return atr;
}

export function calculateADX(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): number[] {
  const adx: number[] = new Array(closes.length).fill(0);
  if (closes.length < period * 2) return adx;

  const length = closes.length;
  const plusDM = new Array(length).fill(0);
  const minusDM = new Array(length).fill(0);
  const tr = new Array(length).fill(0);

  // Compute DM and TR
  for (let i = 1; i < length; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];

    if (upMove > downMove && upMove > 0) {
      plusDM[i] = upMove;
    } else {
      plusDM[i] = 0;
    }

    if (downMove > upMove && downMove > 0) {
      minusDM[i] = downMove;
    } else {
      minusDM[i] = 0;
    }

    const hL = highs[i] - lows[i];
    const hC = Math.abs(highs[i] - closes[i - 1]);
    const lC = Math.abs(lows[i] - closes[i - 1]);
    tr[i] = Math.max(hL, hC, lC);
  }

  // Smooth DM and TR
  const smoothedPlusDM = new Array(length).fill(0);
  const smoothedMinusDM = new Array(length).fill(0);
  const smoothedTR = new Array(length).fill(0);

  let sumPlus = 0;
  let sumMinus = 0;
  let sumTR = 0;

  for (let i = 1; i <= period; i++) {
    sumPlus += plusDM[i];
    sumMinus += minusDM[i];
    sumTR += tr[i];
  }

  smoothedPlusDM[period] = sumPlus;
  smoothedMinusDM[period] = sumMinus;
  smoothedTR[period] = sumTR;

  for (let i = period + 1; i < length; i++) {
    smoothedPlusDM[i] = smoothedPlusDM[i - 1] - (smoothedPlusDM[i - 1] / period) + plusDM[i];
    smoothedMinusDM[i] = smoothedMinusDM[i - 1] - (smoothedMinusDM[i - 1] / period) + minusDM[i];
    smoothedTR[i] = smoothedTR[i - 1] - (smoothedTR[i - 1] / period) + tr[i];
  }

  // Calculate DI and DX
  const dx = new Array(length).fill(0);

  for (let i = period; i < length; i++) {
    const trVal = smoothedTR[i];
    const plusDI = trVal === 0 ? 0 : 100 * (smoothedPlusDM[i] / trVal);
    const minusDI = trVal === 0 ? 0 : 100 * (smoothedMinusDM[i] / trVal);

    const diff = Math.abs(plusDI - minusDI);
    const sum = plusDI + minusDI;

    dx[i] = sum === 0 ? 0 : 100 * (diff / sum);
  }

  // Calculate ADX
  let dxSum = 0;
  for (let i = period; i < period * 2; i++) {
    dxSum += dx[i];
  }
  adx[period * 2 - 1] = dxSum / period;

  for (let i = period * 2; i < length; i++) {
    adx[i] = (adx[i - 1] * (period - 1) + dx[i]) / period;
  }

  return adx;
}
