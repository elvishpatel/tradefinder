"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndicatorEngine = void 0;
const technicalindicators_1 = require("technicalindicators");
class IndicatorEngine {
    /**
     * Calculate Simple Moving Average
     */
    static getSMA(period, values) {
        return technicalindicators_1.SMA.calculate({ period, values });
    }
    /**
     * Calculate Exponential Moving Average
     */
    static getEMA(period, values) {
        return technicalindicators_1.EMA.calculate({ period, values });
    }
    /**
     * Calculate Relative Strength Index
     */
    static getRSI(period, values) {
        return technicalindicators_1.RSI.calculate({ period, values });
    }
    /**
     * Calculate MACD
     */
    static getMACD(values, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        return technicalindicators_1.MACD.calculate({
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
    static getATR(period, high, low, close) {
        return technicalindicators_1.ATR.calculate({ period, high, low, close });
    }
    /**
     * Calculate Bollinger Bands
     */
    static getBollingerBands(period, stdDev, values) {
        return technicalindicators_1.BollingerBands.calculate({ period, stdDev, values });
    }
}
exports.IndicatorEngine = IndicatorEngine;
