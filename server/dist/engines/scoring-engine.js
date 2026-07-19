"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDirection = calculateDirection;
exports.computeMomentumScore = computeMomentumScore;
exports.computeTrendScore = computeTrendScore;
exports.computeBreakoutScore = computeBreakoutScore;
exports.computeRFactorScore = computeRFactorScore;
exports.calculateOpportunityScore = calculateOpportunityScore;
exports.computeScoreCard = computeScoreCard;
/**
 * Technical Scoring Engine
 */
function calculateDirection(close, ema20, ema50, ema200, rsi) {
    if (!ema20 || !ema50 || !ema200)
        return 'NEUTRAL';
    // Bullish alignment: Price above EMAs and short term EMA > long term EMA
    const isBullishAlign = close > ema20 && ema20 > ema50 && ema50 > ema200;
    // Bearish alignment: Price below EMAs and short term EMA < long term EMA
    const isBearishAlign = close < ema20 && ema20 < ema50 && ema50 < ema200;
    if (isBullishAlign || (rsi && rsi > 55 && close > ema20)) {
        return 'BULLISH';
    }
    else if (isBearishAlign || (rsi && rsi < 45 && close < ema20)) {
        return 'BEARISH';
    }
    return 'NEUTRAL';
}
/**
 * 1. Momentum Score (0 - 100)
 */
function computeMomentumScore(direction, rsi, macdHist, macdPrevHist, volumeRatio) {
    let score = 50;
    const reasoning = [];
    if (rsi === null)
        return { score, reasoning };
    // Evaluate RSI
    if (direction === 'BULLISH') {
        if (rsi >= 50 && rsi <= 70) {
            score += 15;
            reasoning.push(`RSI at ${rsi.toFixed(1)} confirms strong bullish momentum range.`);
        }
        else if (rsi > 70) {
            score += 25;
            reasoning.push(`RSI at ${rsi.toFixed(1)} is overbought (ultra-strong momentum).`);
        }
        else {
            score -= 10;
            reasoning.push(`RSI at ${rsi.toFixed(1)} shows weak momentum for a bullish structure.`);
        }
    }
    else { // BEARISH or NEUTRAL
        if (rsi <= 50 && rsi >= 30) {
            score += 15;
            reasoning.push(`RSI at ${rsi.toFixed(1)} confirms strong bearish momentum range.`);
        }
        else if (rsi < 30) {
            score += 25;
            reasoning.push(`RSI at ${rsi.toFixed(1)} is oversold (strong selling velocity).`);
        }
        else {
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
        }
        else if (direction === 'BEARISH' && !isSlopePositive) {
            score += 15;
            reasoning.push('MACD histogram is falling, confirming downward momentum.');
        }
        else {
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
function computeTrendScore(direction, close, ema20, ema50, ema200, adx, hhHl, lhLl) {
    let score = 50;
    const reasoning = [];
    if (!ema20 || !ema50 || !ema200)
        return { score, reasoning };
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
    }
    else if (direction === 'BEARISH') {
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
        }
        else {
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
function computeBreakoutScore(direction, close, recentHigh, // 20-day high
recentLow, // 20-day low
volumeRatio, atr) {
    let score = 40;
    const reasoning = [];
    const pctFromHigh = ((recentHigh - close) / recentHigh) * 100;
    const pctFromLow = ((close - recentLow) / recentLow) * 100;
    if (direction === 'BULLISH') {
        if (close >= recentHigh) {
            score += 30;
            reasoning.push('Price has broken out above the 20-day resistance level.');
        }
        else if (pctFromHigh < 2) {
            score += 15;
            reasoning.push(`Price is within ${pctFromHigh.toFixed(1)}% of breaking 20-day resistance.`);
        }
        if (volumeRatio > 1.5) {
            score += 20;
            reasoning.push('Breakout backed by expansion in traded volume.');
        }
    }
    else { // BEARISH or NEUTRAL
        if (close <= recentLow) {
            score += 30;
            reasoning.push('Price has broken down below the 20-day support level.');
        }
        else if (pctFromLow < 2) {
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
function computeRFactorScore(rFactor) {
    // Map R-Factor (range approx -10 to +10) into a clean 0-100 rating scale
    let score = 50 + rFactor * 5;
    score = Math.max(0, Math.min(100, score));
    const reasoning = [];
    if (rFactor > 2) {
        reasoning.push(`Strong positive R-Factor (${rFactor.toFixed(1)}) indicates stock is outperforming its sector index.`);
    }
    else if (rFactor < -2) {
        reasoning.push(`Negative R-Factor (${rFactor.toFixed(1)}) highlights sector underperformance.`);
    }
    else {
        reasoning.push(`Neutral R-Factor (${rFactor.toFixed(1)}) suggests stock performance mirrors its sector.`);
    }
    return { score, reasoning };
}
/**
 * 5. Aggregated Opportunity Score (0 - 100)
 */
function calculateOpportunityScore(trend, momentum, breakout, rFactor, sectorStrength) {
    const score = trend * 0.25 +
        momentum * 0.25 +
        breakout * 0.20 +
        rFactor * 0.15 +
        sectorStrength * 0.15;
    return Math.round(score);
}
/**
 * Compiles the complete technical scorecard for a stock
 */
function computeScoreCard(close, ema20, ema50, ema200, rsi, macdHist, macdPrevHist, volumeRatio, adx, atr, recentHigh, recentLow, rFactor, sectorStrength, hhHl, lhLl) {
    const direction = calculateDirection(close, ema20, ema50, ema200, rsi);
    const momentum = computeMomentumScore(direction, rsi, macdHist, macdPrevHist, volumeRatio);
    const trend = computeTrendScore(direction, close, ema20, ema50, ema200, adx, hhHl, lhLl);
    const breakout = computeBreakoutScore(direction, close, recentHigh, recentLow, volumeRatio, atr);
    const rFactorRes = computeRFactorScore(rFactor);
    const opportunityScore = calculateOpportunityScore(trend.score, momentum.score, breakout.score, rFactorRes.score, sectorStrength);
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
