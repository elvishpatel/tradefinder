"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketEngine = void 0;
const supabase_1 = __importDefault(require("../config/supabase"));
const logger_1 = __importDefault(require("../utils/logger"));
const indicator_engine_1 = require("./indicator-engine");
const scoring_engine_1 = require("./scoring-engine");
class MarketEngine {
    stocksCache = new Map(); // symbol -> CachedStock
    sectorsCache = new Map(); // sectorName -> SectorAnalysis
    sectorIndexSymbols = new Map();
    isInitialized = false;
    // Live indices mock/cache
    liveIndices = {
        'NSE:NIFTY50-INDEX': { symbol: 'NSE:NIFTY50-INDEX', displayName: 'Nifty 50', price: 24350.25, change: 120.45, changePercent: 0.50, high: 24400.0, low: 24200.0, prevClose: 24229.8 },
        'NSE:NIFTYBANK-INDEX': { symbol: 'NSE:NIFTYBANK-INDEX', displayName: 'Bank Nifty', price: 52480.10, change: -180.20, changePercent: -0.34, high: 52700.0, low: 52350.0, prevClose: 52660.3 },
        'NSE:SENSEX-INDEX': { symbol: 'NSE:SENSEX-INDEX', displayName: 'Sensex', price: 80120.40, change: 395.10, changePercent: 0.50, high: 80300.0, low: 79650.0, prevClose: 79725.3 },
        'NSE:INDIAVIX-INDEX': { symbol: 'NSE:INDIAVIX-INDEX', displayName: 'India VIX', price: 13.85, change: -0.42, changePercent: -2.94, high: 14.30, low: 13.50, prevClose: 14.27 }
    };
    async initialize(userId) {
        if (this.isInitialized)
            return;
        logger_1.default.info('Initializing Market Engine...');
        try {
            // 1. Fetch sectors and stocks from Supabase
            const { data: sectorsDb, error: secErr } = await supabase_1.default.from('sectors').select('*');
            const { data: stocksDb, error: stkErr } = await supabase_1.default.from('stocks').select('*').eq('is_active', true);
            let sectors = sectorsDb || [];
            let stocks = stocksDb || [];
            if (sectors.length === 0) {
                logger_1.default.info('Supabase sectors table is empty. Loading default sector registry in-memory...');
                sectors = [
                    { id: '11111111-1111-1111-1111-111111111101', name: 'NIFTY_BANK', display_name: 'Nifty Bank', index_symbol: 'NSE:NIFTYBANK-INDEX' },
                    { id: '11111111-1111-1111-1111-111111111102', name: 'NIFTY_IT', display_name: 'Nifty IT', index_symbol: 'NSE:NIFTYIT-INDEX' },
                    { id: '11111111-1111-1111-1111-111111111103', name: 'NIFTY_AUTO', display_name: 'Nifty Auto', index_symbol: 'NSE:NIFTYAUTO-INDEX' },
                    { id: '11111111-1111-1111-1111-111111111104', name: 'NIFTY_METAL', display_name: 'Nifty Metal', index_symbol: 'NSE:NIFTYMETAL-INDEX' },
                    { id: '11111111-1111-1111-1111-111111111105', name: 'NIFTY_PHARMA', display_name: 'Nifty Pharma', index_symbol: 'NSE:NIFTYPHARMA-INDEX' },
                    { id: '11111111-1111-1111-1111-111111111106', name: 'NIFTY_FMCG', display_name: 'Nifty FMCG', index_symbol: 'NSE:NIFTYFMCG-INDEX' },
                    { id: '11111111-1111-1111-1111-111111111107', name: 'NIFTY_ENERGY', display_name: 'Nifty Energy', index_symbol: 'NSE:NIFTYENERGY-INDEX' },
                    { id: '11111111-1111-1111-1111-111111111108', name: 'NIFTY_INFRA', display_name: 'Nifty Infra', index_symbol: 'NSE:NIFTYINFRA-INDEX' },
                    { id: '11111111-1111-1111-1111-111111111109', name: 'NIFTY_REALTY', display_name: 'Nifty Realty', index_symbol: 'NSE:NIFTYREALTY-INDEX' }
                ];
            }
            if (stocks.length === 0) {
                logger_1.default.info('Supabase stocks table is empty. Loading default stocks universe in-memory...');
                stocks = [
                    // Bank
                    { id: '22222222-2222-2222-2222-222222222201', symbol: 'NSE:HDFCBANK-EQ', company_name: 'HDFC Bank Ltd.', sector_id: '11111111-1111-1111-1111-111111111101' },
                    { id: '22222222-2222-2222-2222-222222222202', symbol: 'NSE:ICICIBANK-EQ', company_name: 'ICICI Bank Ltd.', sector_id: '11111111-1111-1111-1111-111111111101' },
                    { id: '22222222-2222-2222-2222-222222222203', symbol: 'NSE:SBIN-EQ', company_name: 'State Bank of India', sector_id: '11111111-1111-1111-1111-111111111101' },
                    { id: '22222222-2222-2222-2222-222222222204', symbol: 'NSE:AXISBANK-EQ', company_name: 'Axis Bank Ltd.', sector_id: '11111111-1111-1111-1111-111111111101' },
                    // IT
                    { id: '22222222-2222-2222-2222-222222222205', symbol: 'NSE:TCS-EQ', company_name: 'Tata Consultancy Services Ltd.', sector_id: '11111111-1111-1111-1111-111111111102' },
                    { id: '22222222-2222-2222-2222-222222222206', symbol: 'NSE:INFY-EQ', company_name: 'Infosys Ltd.', sector_id: '11111111-1111-1111-1111-111111111102' },
                    { id: '22222222-2222-2222-2222-222222222207', symbol: 'NSE:HCLTECH-EQ', company_name: 'HCL Technologies Ltd.', sector_id: '11111111-1111-1111-1111-111111111102' },
                    // Auto
                    { id: '22222222-2222-2222-2222-222222222208', symbol: 'NSE:TATAMOTORS-EQ', company_name: 'Tata Motors Ltd.', sector_id: '11111111-1111-1111-1111-111111111103' },
                    { id: '22222222-2222-2222-2222-222222222209', symbol: 'NSE:M&M-EQ', company_name: 'Mahindra & Mahindra Ltd.', sector_id: '11111111-1111-1111-1111-111111111103' },
                    { id: '22222222-2222-2222-2222-222222222210', symbol: 'NSE:MARUTI-EQ', company_name: 'Maruti Suzuki India Ltd.', sector_id: '11111111-1111-1111-1111-111111111103' },
                    // Metal
                    { id: '22222222-2222-2222-2222-222222222211', symbol: 'NSE:TATASTEEL-EQ', company_name: 'Tata Steel Ltd.', sector_id: '11111111-1111-1111-1111-111111111104' },
                    { id: '22222222-2222-2222-2222-222222222212', symbol: 'NSE:JSWSTEEL-EQ', company_name: 'JSW Steel Ltd.', sector_id: '11111111-1111-1111-1111-111111111104' },
                    // Pharma
                    { id: '22222222-2222-2222-2222-222222222213', symbol: 'NSE:SUNPHARMA-EQ', company_name: 'Sun Pharma Industries Ltd.', sector_id: '11111111-1111-1111-1111-111111111105' },
                    { id: '22222222-2222-2222-2222-222222222214', symbol: 'NSE:CIPLA-EQ', company_name: 'Cipla Ltd.', sector_id: '11111111-1111-1111-1111-111111111105' },
                    // FMCG
                    { id: '22222222-2222-2222-2222-222222222215', symbol: 'NSE:ITC-EQ', company_name: 'ITC Ltd.', sector_id: '11111111-1111-1111-1111-111111111106' },
                    { id: '22222222-2222-2222-2222-222222222216', symbol: 'NSE:HINDUNILVR-EQ', company_name: 'Hindustan Unilever Ltd.', sector_id: '11111111-1111-1111-1111-111111111106' },
                    // Energy
                    { id: '22222222-2222-2222-2222-222222222217', symbol: 'NSE:RELIANCE-EQ', company_name: 'Reliance Industries Ltd.', sector_id: '11111111-1111-1111-1111-111111111107' },
                    { id: '22222222-2222-2222-2222-222222222218', symbol: 'NSE:ONGC-EQ', company_name: 'Oil & Natural Gas Corp Ltd.', sector_id: '11111111-1111-1111-1111-111111111107' },
                    // Infra
                    { id: '22222222-2222-2222-2222-222222222219', symbol: 'NSE:LT-EQ', company_name: 'Larsen & Toubro Ltd.', sector_id: '11111111-1111-1111-1111-111111111108' },
                    // Realty
                    { id: '22222222-2222-2222-2222-222222222220', symbol: 'NSE:DLF-EQ', company_name: 'DLF Ltd.', sector_id: '11111111-1111-1111-1111-111111111109' }
                ];
            }
            logger_1.default.info(`Loaded ${sectors.length} sectors and ${stocks.length} active stocks into Market Engine cache.`);
            // Build sector mapping helper
            const sectorIdToInfo = new Map();
            sectors.forEach(s => {
                sectorIdToInfo.set(s.id, { name: s.name, displayName: s.display_name });
                this.sectorIndexSymbols.set(s.name, s.index_symbol);
            });
            // 2. Fetch or Generate historical metrics
            for (const stk of stocks) {
                const sectorInfo = sectorIdToInfo.get(stk.sector_id) || { name: 'OTHER', displayName: 'Other' };
                let { data: histData, error: histErr } = await supabase_1.default
                    .from('historical_metrics')
                    .select('*')
                    .eq('stock_id', stk.id)
                    .order('date', { ascending: true });
                if (histErr) {
                    logger_1.default.error(`Error querying history for ${stk.symbol}: ${histErr.message}`);
                    histData = [];
                }
                // Bootstrap data if database does not contain historical candles
                if (!histData || histData.length < 50) {
                    logger_1.default.info(`Insufficient history for ${stk.symbol}. Generating mock historical daily candles...`);
                    histData = await this.bootstrapHistoricalData(stk.id, stk.symbol);
                }
                // 3. Process indicators for each stock
                const closes = histData.map(h => Number(h.close));
                const highs = histData.map(h => Number(h.close * 1.015)); // Mock high
                const lows = histData.map(h => Number(h.close * 0.985)); // Mock low
                const volumes = histData.map(h => Number(h.volume));
                const dates = histData.map(h => h.date);
                const ema20 = (0, indicator_engine_1.calculateEMA)(closes, 20);
                const ema50 = (0, indicator_engine_1.calculateEMA)(closes, 50);
                const ema200 = (0, indicator_engine_1.calculateEMA)(closes, 200);
                const rsi = (0, indicator_engine_1.calculateRSI)(closes, 14);
                const macd = (0, indicator_engine_1.calculateMACD)(closes, 12, 26, 9);
                const atr = (0, indicator_engine_1.calculateATR)(highs, lows, closes, 14);
                const adx = (0, indicator_engine_1.calculateADX)(highs, lows, closes, 14);
                const lastIdx = closes.length - 1;
                const currentClose = closes[lastIdx] || 100.0;
                const prevClose = closes[lastIdx - 1] || currentClose;
                const currentChangePercent = ((currentClose - prevClose) / prevClose) * 100;
                const currentVolume = volumes[lastIdx] || 10000;
                // Calculate average historical volume over 20 periods
                let avgVolSum = 0;
                const volPeriod = Math.min(20, volumes.length);
                for (let i = volumes.length - volPeriod; i < volumes.length; i++) {
                    avgVolSum += volumes[i] || 0;
                }
                const avgVolume = avgVolSum / volPeriod || 10000;
                const volumeRatio = currentVolume / avgVolume || 1.0;
                // Find recent 20-day high and low
                let recentHigh = currentClose;
                let recentLow = currentClose;
                const lookback = Math.min(20, closes.length);
                for (let i = closes.length - lookback; i < closes.length; i++) {
                    if (closes[i] > recentHigh)
                        recentHigh = closes[i];
                    if (closes[i] < recentLow)
                        recentLow = closes[i];
                }
                // Structure cached item
                const cachedItem = {
                    id: stk.id,
                    symbol: stk.symbol,
                    companyName: stk.company_name,
                    sectorId: stk.sector_id,
                    sectorName: sectorInfo.name,
                    close: currentClose,
                    open: currentClose * 0.995,
                    high: currentClose * 1.01,
                    low: currentClose * 0.99,
                    prevClose,
                    volume: currentVolume,
                    changePercent: currentChangePercent,
                    volumeRatio,
                    recentHigh,
                    recentLow,
                    avgVolume,
                    historyCloses: closes,
                    historyHighs: highs,
                    historyLows: lows,
                    historyVolumes: volumes,
                    historyDates: dates,
                    indicatorCache: {
                        ema20: ema20[lastIdx] || null,
                        ema50: ema50[lastIdx] || null,
                        ema200: ema200[lastIdx] || null,
                        rsi: rsi[lastIdx] || null,
                        macdLine: macd.macdLine[lastIdx] || null,
                        macdSignal: macd.signalLine[lastIdx] || null,
                        macdHist: macd.histogram[lastIdx] || null,
                        macdPrevHist: macd.histogram[lastIdx - 1] || null,
                        adx: adx[lastIdx] || null,
                        atr: atr[lastIdx] || null,
                        hhHl: false,
                        lhLl: false,
                    },
                    scores: null,
                    scannerTags: [],
                };
                // Determine simple HH-HL patterns from historical ticks
                if (closes.length >= 5) {
                    const c = closes;
                    cachedItem.indicatorCache.hhHl = c[lastIdx] > c[lastIdx - 2] && c[lastIdx - 1] > c[lastIdx - 3];
                    cachedItem.indicatorCache.lhLl = c[lastIdx] < c[lastIdx - 2] && c[lastIdx - 1] < c[lastIdx - 3];
                }
                this.stocksCache.set(stk.symbol, cachedItem);
            }
            // 4. Precompute R-Factor, Sector Strength, and Opportunity Scores
            this.recalculateAllMetrics();
            this.isInitialized = true;
            logger_1.default.info('Market Engine fully initialized and cached.');
        }
        catch (err) {
            logger_1.default.error(`Market Engine initialization failed: ${err.message}`);
        }
    }
    /**
     * Generates 250 daily bars using standard random walks and saves them to the DB.
     */
    async bootstrapHistoricalData(stockId, symbol) {
        const candles = [];
        let price = this.getBasePrice(symbol);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 365); // Go back 1 year
        for (let i = 0; i < 250; i++) {
            // 1. Simulating price fluctuation (-2% to +2.3% with slight positive drift)
            const change = (Math.random() * 4.3 - 2.0) / 100;
            price = price * (1 + change);
            const date = new Date(startDate.getTime());
            date.setDate(date.getDate() + i);
            // Skip weekends
            if (date.getDay() === 0 || date.getDay() === 6) {
                continue;
            }
            candles.push({
                stock_id: stockId,
                date: date.toISOString().split('T')[0],
                close: Number(price.toFixed(2)),
                volume: Math.floor(Math.random() * 200000 + 10000),
            });
        }
        // Bulk insert in blocks of 50 to optimize Supabase query limits
        for (let i = 0; i < candles.length; i += 50) {
            const batch = candles.slice(i, i + 50);
            const { error } = await supabase_1.default.from('historical_metrics').insert(batch);
            if (error) {
                logger_1.default.error(`Error seeding historical candles for ${symbol}: ${error.message}`);
            }
        }
        return candles;
    }
    getBasePrice(symbol) {
        const bases = {
            'NSE:RELIANCE-EQ': 2450.0,
            'NSE:TCS-EQ': 3820.0,
            'NSE:INFY-EQ': 1480.0,
            'NSE:HDFCBANK-EQ': 1610.0,
            'NSE:ICICIBANK-EQ': 1120.0,
            'NSE:SBIN-EQ': 780.0,
            'NSE:TATAMOTORS-EQ': 980.0,
            'NSE:M&M-EQ': 2100.0,
            'NSE:LT-EQ': 3400.0,
            'NSE:ITC-EQ': 430.0,
            'NSE:DLF-EQ': 850.0,
        };
        return bases[symbol] || 500.0;
    }
    /**
     * Recalculates Relative Strength, Sector Strength, and Opportunity Scores for the entire cache
     */
    recalculateAllMetrics() {
        // 1. Calculate Sector returns by averaging stock returns in each sector
        const sectorReturns = new Map();
        const sectorStocks = new Map();
        this.stocksCache.forEach(stk => {
            if (!sectorReturns.has(stk.sectorName)) {
                sectorReturns.set(stk.sectorName, []);
                sectorStocks.set(stk.sectorName, []);
            }
            sectorReturns.get(stk.sectorName).push(stk.changePercent);
            sectorStocks.get(stk.sectorName).push(stk);
        });
        const sectorStrengthMap = new Map();
        // Estimate Sector Strengths based on breadth and average return
        sectorReturns.forEach((returns, name) => {
            const stocks = sectorStocks.get(name) || [];
            const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
            // Calculate breadth: percentage of stocks above EMA 50
            let above50Count = 0;
            stocks.forEach(s => {
                if (s.indicatorCache.ema50 && s.close > s.indicatorCache.ema50) {
                    above50Count++;
                }
            });
            const breadth = (above50Count / stocks.length) * 100;
            // Map sector strength to a score 0-100
            let strengthScore = 50 + avgReturn * 10 + (breadth - 50) * 0.4;
            strengthScore = Math.max(0, Math.min(100, strengthScore));
            sectorStrengthMap.set(name, strengthScore);
            // Cache Sector Analysis profile
            this.sectorsCache.set(name, {
                id: stocks[0]?.sectorId || '',
                name,
                displayName: name.replace('NIFTY_', 'Nifty '),
                indexSymbol: this.sectorIndexSymbols.get(name) || null,
                currentReturn: avgReturn,
                dailyReturn: avgReturn,
                weeklyReturn: avgReturn * 3.5, // Mock weekly / monthly aggregates
                monthlyReturn: avgReturn * 8.2,
                rank: 0, // Assigned later
                trend: avgReturn > 0.1 ? 'BULLISH' : (avgReturn < -0.1 ? 'BEARISH' : 'NEUTRAL'),
                moneyFlow: avgReturn > 0.3 ? 'INFLOW' : (avgReturn < -0.3 ? 'OUTFLOW' : 'FLAT'),
                momentumScore: strengthScore,
                strengthScore,
                relativeStrengthVsNifty: avgReturn - 0.2, // relative to Nifty return (mocked at 0.2%)
                averageReturn: avgReturn,
                marketBreadth: {
                    advance: returns.filter(r => r > 0).length,
                    decline: returns.filter(r => r < 0).length,
                    total: returns.length,
                },
                breadthEMAs: {
                    aboveEMA20: (stocks.filter(s => s.indicatorCache.ema20 && s.close > s.indicatorCache.ema20).length / stocks.length) * 100,
                    aboveEMA50: breadth,
                    aboveEMA200: (stocks.filter(s => s.indicatorCache.ema200 && s.close > s.indicatorCache.ema200).length / stocks.length) * 100,
                },
                averageRSI: stocks.reduce((sum, s) => sum + (s.indicatorCache.rsi || 50), 0) / stocks.length,
                averageVolumeRatio: stocks.reduce((sum, s) => sum + s.volumeRatio, 0) / stocks.length,
                highestGainer: null,
                highestLoser: null,
                scannersSummary: {
                    breakoutCount: 0,
                    breakdownCount: 0,
                    momentumCount: 0,
                    swingCount: 0,
                    highVolumeCount: 0,
                }
            });
        });
        // 2. Rank Sectors by Daily Return
        const sortedSectors = Array.from(this.sectorsCache.values()).sort((a, b) => b.dailyReturn - a.dailyReturn);
        sortedSectors.forEach((sec, idx) => {
            const cachedSec = this.sectorsCache.get(sec.name);
            cachedSec.rank = idx + 1;
            // Load highest gainer and loser in sector
            const stocks = sectorStocks.get(sec.name) || [];
            if (stocks.length > 0) {
                const sortedStocks = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
                cachedSec.highestGainer = { symbol: sortedStocks[0].symbol, changePercent: sortedStocks[0].changePercent };
                cachedSec.highestLoser = { symbol: sortedStocks[sortedStocks.length - 1].symbol, changePercent: sortedStocks[sortedStocks.length - 1].changePercent };
            }
        });
        // 3. Compute R-Factor and Opportunity Score for each Stock
        this.stocksCache.forEach(stk => {
            const sectorSec = this.sectorsCache.get(stk.sectorName);
            const sectorReturn = sectorSec ? sectorSec.dailyReturn : 0.0;
            const sectorStrength = sectorStrengthMap.get(stk.sectorName) || 50;
            // R-Factor = Stock Return - Sector Return (relative outperformance)
            const rFactor = stk.changePercent - sectorReturn;
            // Compute full Technical Scorecard
            const scoreCard = (0, scoring_engine_1.computeScoreCard)(stk.close, stk.indicatorCache.ema20, stk.indicatorCache.ema50, stk.indicatorCache.ema200, stk.indicatorCache.rsi, stk.indicatorCache.macdHist, stk.indicatorCache.macdPrevHist, stk.volumeRatio, stk.indicatorCache.adx, stk.indicatorCache.atr, stk.recentHigh, stk.recentLow, rFactor, sectorStrength, stk.indicatorCache.hhHl, stk.indicatorCache.lhLl);
            stk.scores = scoreCard;
            // 4. Evaluate Scanner Tags
            const tags = [];
            const c = stk.close;
            if (scoreCard.direction === 'BULLISH') {
                if (c >= stk.recentHigh && stk.volumeRatio > 1.4)
                    tags.push('Breakout');
                if (stk.indicatorCache.ema20 && Math.abs(c - stk.indicatorCache.ema20) / c < 0.005)
                    tags.push('EMA Pullback');
                if (stk.indicatorCache.ema20 && stk.indicatorCache.ema50 && stk.indicatorCache.ema20 > stk.indicatorCache.ema50) {
                    tags.push('Golden Cross');
                }
                if (stk.indicatorCache.hhHl)
                    tags.push('HH-HL');
                if (stk.volumeRatio > 1.8)
                    tags.push('High Volume');
                if (scoreCard.opportunityScore > 75)
                    tags.push('Strong Momentum');
            }
            else if (scoreCard.direction === 'BEARISH') {
                if (c <= stk.recentLow && stk.volumeRatio > 1.4)
                    tags.push('Breakdown');
                if (stk.indicatorCache.ema20 && Math.abs(c - stk.indicatorCache.ema20) / c < 0.005)
                    tags.push('EMA Rejection');
                if (stk.indicatorCache.ema20 && stk.indicatorCache.ema50 && stk.indicatorCache.ema20 < stk.indicatorCache.ema50) {
                    tags.push('Death Cross');
                }
                if (stk.indicatorCache.lhLl)
                    tags.push('LH-LL');
                if (stk.volumeRatio > 1.8)
                    tags.push('Heavy Selling');
            }
            stk.scannerTags = tags;
            // Update sector count summaries
            if (sectorSec) {
                if (tags.includes('Breakout'))
                    sectorSec.scannersSummary.breakoutCount++;
                if (tags.includes('Breakdown'))
                    sectorSec.scannersSummary.breakdownCount++;
                if (tags.includes('Strong Momentum'))
                    sectorSec.scannersSummary.momentumCount++;
                if (tags.includes('EMA Pullback') || tags.includes('HH-HL'))
                    sectorSec.scannersSummary.swingCount++;
                if (tags.includes('High Volume') || tags.includes('Heavy Selling'))
                    sectorSec.scannersSummary.highVolumeCount++;
            }
        });
    }
    /**
     * Updates cached stock metrics upon receiving a live ticker quote
     */
    updateTick(symbol, lastPrice, change, changePercent, volume) {
        const stk = this.stocksCache.get(symbol);
        if (!stk)
            return;
        // Update quote details
        stk.close = lastPrice;
        stk.changePercent = changePercent;
        stk.volume = volume;
        stk.volumeRatio = volume / stk.avgVolume || 1.0;
        // Update high / low boundaries if breached
        if (lastPrice > stk.recentHigh)
            stk.recentHigh = lastPrice;
        if (lastPrice < stk.recentLow)
            stk.recentLow = lastPrice;
        // Trigger full metrics updates
        this.recalculateAllMetrics();
    }
    updateIndex(symbol, price, change, changePercent) {
        const idx = this.liveIndices[symbol];
        if (idx) {
            idx.price = price;
            idx.change = change;
            idx.changePercent = changePercent;
        }
    }
    // Getters for frontend endpoints
    getDashboardData() {
        const stocks = Array.from(this.stocksCache.values());
        const opportunities = stocks.map(s => this.mapToOpportunity(s));
        // Sort opportunities for Dashboard panels
        const gainers = [...opportunities].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
        const losers = [...opportunities].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
        const mostActive = [...stocks].sort((a, b) => b.volume - a.volume).slice(0, 5).map(s => this.mapToOpportunity(s));
        const volumeLeaders = [...opportunities].sort((a, b) => b.scores.opportunityScore - a.scores.opportunityScore).slice(0, 5);
        // Compute advance/decline ratio
        let advances = 0;
        let declines = 0;
        let unchanged = 0;
        opportunities.forEach(o => {
            if (o.changePercent > 0)
                advances++;
            else if (o.changePercent < 0)
                declines++;
            else
                unchanged++;
        });
        return {
            marketStatus: this.getMarketStatus(),
            indices: this.liveIndices,
            breadth: {
                advances,
                declines,
                unchanged,
                ratio: declines === 0 ? advances : Number((advances / declines).toFixed(2)),
            },
            gainers,
            losers,
            mostActive,
            volumeLeaders,
        };
    }
    getSectorAnalysisList() {
        return Array.from(this.sectorsCache.values()).sort((a, b) => a.rank - b.rank);
    }
    getSectorDetails(sectorName) {
        const sector = this.sectorsCache.get(sectorName);
        if (!sector)
            return null;
        // Get stocks belonging to this sector
        const stocks = Array.from(this.stocksCache.values())
            .filter(s => s.sectorName === sectorName)
            .map(s => this.mapToOpportunity(s));
        return {
            sector,
            stocks,
        };
    }
    getScannerResults(type) {
        const stocks = Array.from(this.stocksCache.values());
        const opportunities = stocks.map(s => this.mapToOpportunity(s));
        if (type === 'LONG') {
            return opportunities
                .filter(o => o.scores.direction === 'BULLISH' && o.scores.opportunityScore > 50)
                .sort((a, b) => b.scores.opportunityScore - a.scores.opportunityScore);
        }
        else {
            return opportunities
                .filter(o => o.scores.direction === 'BEARISH' && o.scores.opportunityScore > 50)
                .sort((a, b) => b.scores.opportunityScore - a.scores.opportunityScore);
        }
    }
    getMarketStatus() {
        const now = new Date();
        // Convert to IST (UTC+5.5)
        const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
        const day = istTime.getUTCDay(); // 0 is Sun, 6 is Sat
        const hours = istTime.getUTCHours();
        const minutes = istTime.getUTCMinutes();
        const totalMinutes = hours * 60 + minutes;
        const isWeekend = day === 0 || day === 6;
        const marketOpenMinutes = 9 * 60 + 15; // 09:15 AM IST
        const marketCloseMinutes = 15 * 60 + 30; // 03:30 PM IST
        let status = 'CLOSED';
        let session = 'OFF_HOURS';
        if (!isWeekend) {
            if (totalMinutes >= 9 * 60 && totalMinutes < 9 * 60 + 15) {
                status = 'CLOSED';
                session = 'PRE_MARKET';
            }
            else if (totalMinutes >= marketOpenMinutes && totalMinutes < marketCloseMinutes) {
                status = 'OPEN';
                session = 'REGULAR';
            }
            else if (totalMinutes >= marketCloseMinutes && totalMinutes < 16 * 60) {
                status = 'CLOSED';
                session = 'POST_MARKET';
            }
        }
        return {
            status,
            session,
            time: istTime.toISOString(),
        };
    }
    mapToOpportunity(s) {
        return {
            id: s.id,
            symbol: s.symbol,
            companyName: s.companyName,
            sectorId: s.sectorId,
            isActive: true,
            close: Number(s.close.toFixed(2)),
            changePercent: Number(s.changePercent.toFixed(2)),
            volumeRatio: Number(s.volumeRatio.toFixed(2)),
            scores: s.scores,
            scannerTags: s.scannerTags,
        };
    }
}
exports.MarketEngine = MarketEngine;
exports.default = new MarketEngine();
