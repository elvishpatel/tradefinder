import { MarketDirection, ScoreCard } from '../types';


/**
 * Technical Scoring Engine
 */

export function calculateDirection(
  close: number,
  ema20: number | null,
  ema50: number | null,
  ema200: number | null,
  rsi: number | null
): MarketDirection {
  if (!ema20 || !ema50 || !ema200) return 'NEUTRAL';

  // Bullish alignment: Price above EMAs and short term EMA > long term EMA
  const isBullishAlign = close > ema20 && ema20 > ema50 && ema50 > ema200;
  // Bearish alignment: Price below EMAs and short term EMA < long term EMA
  const isBearishAlign = close < ema20 && ema20 < ema50 && ema50 < ema200;

  if (isBullishAlign || (rsi && rsi > 55 && close > ema20)) {
    return 'BULLISH';
  } else if (isBearishAlign || (rsi && rsi < 45 && close < ema20)) {
    return 'BEARISH';
  }

  return 'NEUTRAL';
}

/**
 * 1. Momentum Score (0 - 100)
 */
export function computeMomentumScore(
  direction: MarketDirection,
  rsi: number | null,
  macdHist: number | null,
  macdPrevHist: number | null,
  volumeRatio: number
): { score: number; reasoning: string[] } {
  let score = 50;
  const reasoning: string[] = [];

  if (rsi === null) return { score, reasoning };

  // Evaluate RSI
  if (direction === 'BULLISH') {
    if (rsi >= 50 && rsi <= 70) {
      score += 15;
      reasoning.push(`RSI at ${rsi.toFixed(1)} confirms strong bullish momentum range.`);
    } else if (rsi > 70) {
      score += 25;
      reasoning.push(`RSI at ${rsi.toFixed(1)} is overbought (ultra-strong momentum).`);
    } else {
      score -= 10;
      reasoning.push(`RSI at ${rsi.toFixed(1)} shows weak momentum for a bullish structure.`);
    }
  } else { // BEARISH or NEUTRAL
    if (rsi <= 50 && rsi >= 30) {
      score += 15;
      reasoning.push(`RSI at ${rsi.toFixed(1)} confirms strong bearish momentum range.`);
    } else if (rsi < 30) {
      score += 25;
      reasoning.push(`RSI at ${rsi.toFixed(1)} is oversold (strong selling velocity).`);
    } else {
      score -= 10;
      reasoning.push(`RSI at ${rsi.toFixed(1)} shows fading momentum for a bearish structure.`);
    }
  }

  // Evaluate MACD Histogram slope
  if (macdHist !== null && macdPrevHist !== null) {
    const isSlopePositive = macdHist > macdPrevHist;
    if (direction === 'BULLISH' && isSlopePositive) {
      score += 15;
      reasoning.push('MACD histogram is rising, reinforcing upward momentum.');
    } else if (direction === 'BEARISH' && !isSlopePositive) {
      score += 15;
      reasoning.push('MACD histogram is falling, confirming downward momentum.');
    } else {
      score -= 10;
      reasoning.push('MACD histogram slope diverges from price action trend.');
    }
  }

  // Volume Confirmation
  if (volumeRatio > 1.8) {
    score += 10;
    reasoning.push(`High volume ratio (${volumeRatio.toFixed(1)}x) validates momentum.`);
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasoning
  };
}

/**
 * 2. Trend Score (0 - 100)
 */
export function computeTrendScore(
  direction: MarketDirection,
  close: number,
  ema20: number | null,
  ema50: number | null,
  ema200: number | null,
  adx: number | null,
  hhHl: boolean,
  lhLl: boolean
): { score: number; reasoning: string[] } {
  let score = 50;
  const reasoning: string[] = [];

  if (!ema20 || !ema50 || !ema200) return { score, reasoning };

  if (direction === 'BULLISH') {
    // Check EMA stacking
    if (ema20 > ema50 && ema50 > ema200) {
      score += 20;
      reasoning.push('EMAs are stacked in perfect bullish order (20 > 50 > 200).');
    }
    // High-High Low-Low structure
    if (hhHl) {
      score += 15;
      reasoning.push('Price action exhibits a series of Higher Highs and Higher Lows.');
    }
  } else if (direction === 'BEARISH') {
    if (ema20 < ema50 && ema50 < ema200) {
      score += 20;
      reasoning.push('EMAs are stacked in perfect bearish order (20 < 50 < 200).');
    }
    if (lhLl) {
      score += 15;
      reasoning.push('Price action exhibits a series of Lower Highs and Lower Lows.');
    }
  }

  // ADX strength weighting (ADX > 25 indicates strong trend)
  if (adx !== null) {
    if (adx > 25) {
      score += 15;
      reasoning.push(`ADX at ${adx.toFixed(1)} indicates a high-strength trending regime.`);
    } else {
      score -= 10;
      reasoning.push(`ADX at ${adx.toFixed(1)} indicates a weak or range-bound market.`);
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasoning
  };
}

/**
 * 3. Breakout Score (0 - 100)
 */
export function computeBreakoutScore(
  direction: MarketDirection,
  close: number,
  recentHigh: number, // 20-day high
  recentLow: number,  // 20-day low
  volumeRatio: number,
  atr: number | null
): { score: number; reasoning: string[] } {
  let score = 40;
  const reasoning: string[] = [];

  const pctFromHigh = ((recentHigh - close) / recentHigh) * 100;
  const pctFromLow = ((close - recentLow) / recentLow) * 100;

  if (direction === 'BULLISH') {
    if (close >= recentHigh) {
      score += 30;
      reasoning.push('Price has broken out above the 20-day resistance level.');
    } else if (pctFromHigh < 2) {
      score += 15;
      reasoning.push(`Price is within ${pctFromHigh.toFixed(1)}% of breaking 20-day resistance.`);
    }

    if (volumeRatio > 1.5) {
      score += 20;
      reasoning.push('Breakout backed by expansion in traded volume.');
    }
  } else { // BEARISH or NEUTRAL
    if (close <= recentLow) {
      score += 30;
      reasoning.push('Price has broken down below the 20-day support level.');
    } else if (pctFromLow < 2) {
      score += 15;
      reasoning.push(`Price is within ${pctFromLow.toFixed(1)}% of breaking 20-day support.`);
    }

    if (volumeRatio > 1.5) {
      score += 20;
      reasoning.push('Breakdown backed by expansion in selling volume.');
    }
  }

  // ATR volatility check
  if (atr !== null && atr > (close * 0.01)) {
    score += 10;
    reasoning.push('ATR expansion confirms active price volatility.');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasoning
  };
}

/**
 * 4. Relative Strength (R-Factor) Score (0 - 100)
 */
export function computeRFactorScore(rFactor: number): { score: number; reasoning: string[] } {
  // Map R-Factor (range approx -10 to +10) into a clean 0-100 rating scale
  let score = 50 + rFactor * 5;
  score = Math.max(0, Math.min(100, score));

  const reasoning: string[] = [];
  if (rFactor > 2) {
    reasoning.push(`Strong positive R-Factor (${rFactor.toFixed(1)}) indicates stock is outperforming its sector index.`);
  } else if (rFactor < -2) {
    reasoning.push(`Negative R-Factor (${rFactor.toFixed(1)}) highlights sector underperformance.`);
  } else {
    reasoning.push(`Neutral R-Factor (${rFactor.toFixed(1)}) suggests stock performance mirrors its sector.`);
  }

  return { score, reasoning };
}

/**
 * 5. Aggregated Opportunity Score (0 - 100)
 */
export function calculateOpportunityScore(
  trend: number,
  momentum: number,
  breakout: number,
  rFactor: number,
  sectorStrength: number
): number {
  const score =
    trend * 0.25 +
    momentum * 0.25 +
    breakout * 0.20 +
    rFactor * 0.15 +
    sectorStrength * 0.15;

  return Math.round(score);
}

/**
 * Compiles the complete technical scorecard for a stock
 */
export function computeScoreCard(
  close: number,
  ema20: number | null,
  ema50: number | null,
  ema200: number | null,
  rsi: number | null,
  macdHist: number | null,
  macdPrevHist: number | null,
  volumeRatio: number,
  adx: number | null,
  atr: number | null,
  recentHigh: number,
  recentLow: number,
  rFactor: number,
  sectorStrength: number,
  hhHl: boolean,
  lhLl: boolean
): ScoreCard {
  const direction = calculateDirection(close, ema20, ema50, ema200, rsi);

  const momentum = computeMomentumScore(direction, rsi, macdHist, macdPrevHist, volumeRatio);
  const trend = computeTrendScore(direction, close, ema20, ema50, ema200, adx, hhHl, lhLl);
  const breakout = computeBreakoutScore(direction, close, recentHigh, recentLow, volumeRatio, atr);
  const rFactorRes = computeRFactorScore(rFactor);

  const opportunityScore = calculateOpportunityScore(
    trend.score,
    momentum.score,
    breakout.score,
    rFactorRes.score,
    sectorStrength
  );

  // Combine reasoning points
  const reasoning = [
    ...trend.reasoning.slice(0, 2),
    ...momentum.reasoning.slice(0, 2),
    ...breakout.reasoning.slice(0, 1),
    ...rFactorRes.reasoning.slice(0, 1),
  ];

  return {
    momentumScore: momentum.score,
    trendScore: trend.score,
    breakoutScore: breakout.score,
    rFactorScore: rFactorRes.score,
    sectorStrengthScore: sectorStrength,
    opportunityScore,
    direction,
    reasoning,
  };
}
