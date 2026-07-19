import supabase from '../config/supabase';
import logger from '../utils/logger';
import {
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateATR,
  calculateADX,
} from './indicator-engine';
import { computeScoreCard } from './scoring-engine';
import { StockScannedOpportunity, SectorAnalysis, LiveMarketStatus, LiveIndexData } from '../types';


interface CachedStock {
  id: string;
  symbol: string;
  companyName: string;
  sectorId: string;
  sectorName: string;
  close: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: number;
  changePercent: number;
  volumeRatio: number;
  recentHigh: number;
  recentLow: number;
  avgVolume: number;
  historyCloses: number[];
  historyHighs: number[];
  historyLows: number[];
  historyVolumes: number[];
  historyDates: string[];
  indicatorCache: {
    ema20: number | null;
    ema50: number | null;
    ema200: number | null;
    rsi: number | null;
    macdLine: number | null;
    macdSignal: number | null;
    macdHist: number | null;
    macdPrevHist: number | null;
    adx: number | null;
    atr: number | null;
    hhHl: boolean;
    lhLl: boolean;
  };
  scores: any;
  scannerTags: string[];
}

export class MarketEngine {
  private stocksCache: Map<string, CachedStock> = new Map(); // symbol -> CachedStock
  private sectorsCache: Map<string, SectorAnalysis> = new Map(); // sectorName -> SectorAnalysis
  private sectorIndexSymbols: Map<string, string | null> = new Map();
  private isInitialized = false;

  // Live indices mock/cache
  private liveIndices: Record<string, LiveIndexData> = {
    'NSE:NIFTY50-INDEX': { symbol: 'NSE:NIFTY50-INDEX', displayName: 'Nifty 50', price: 24350.25, change: 120.45, changePercent: 0.50, high: 24400.0, low: 24200.0, prevClose: 24229.8 },
    'NSE:NIFTYBANK-INDEX': { symbol: 'NSE:NIFTYBANK-INDEX', displayName: 'Bank Nifty', price: 52480.10, change: -180.20, changePercent: -0.34, high: 52700.0, low: 52350.0, prevClose: 52660.3 },
    'NSE:SENSEX-INDEX': { symbol: 'NSE:SENSEX-INDEX', displayName: 'Sensex', price: 80120.40, change: 395.10, changePercent: 0.50, high: 80300.0, low: 79650.0, prevClose: 79725.3 },
    'NSE:INDIAVIX-INDEX': { symbol: 'NSE:INDIAVIX-INDEX', displayName: 'India VIX', price: 13.85, change: -0.42, changePercent: -2.94, high: 14.30, low: 13.50, prevClose: 14.27 }
  };

  async initialize(userId: string) {
    if (this.isInitialized) return;
    logger.info('Initializing Market Engine...');

    try {
      // 1. Fetch sectors and stocks from Supabase
      const { data: sectorsDb, error: secErr } = await supabase.from('sectors').select('*');
      const { data: stocksDb, error: stkErr } = await supabase.from('stocks').select('*').eq('is_active', true);

      let sectors = sectorsDb || [];
      let stocks = stocksDb || [];

      if (sectors.length === 0) {
        logger.info('Supabase sectors table is empty. Loading default sector registry in-memory...');
        sectors = [
          { id: 'sec-bank', name: 'NIFTY_BANK', display_name: 'Nifty Bank', index_symbol: 'NSE:NIFTYBANK-INDEX' },
          { id: 'sec-it', name: 'NIFTY_IT', display_name: 'Nifty IT', index_symbol: 'NSE:NIFTYIT-INDEX' },
          { id: 'sec-auto', name: 'NIFTY_AUTO', display_name: 'Nifty Auto', index_symbol: 'NSE:NIFTYAUTO-INDEX' },
          { id: 'sec-metal', name: 'NIFTY_METAL', display_name: 'Nifty Metal', index_symbol: 'NSE:NIFTYMETAL-INDEX' },
          { id: 'sec-pharma', name: 'NIFTY_PHARMA', display_name: 'Nifty Pharma', index_symbol: 'NSE:NIFTYPHARMA-INDEX' },
          { id: 'sec-fmcg', name: 'NIFTY_FMCG', display_name: 'Nifty FMCG', index_symbol: 'NSE:NIFTYFMCG-INDEX' },
          { id: 'sec-energy', name: 'NIFTY_ENERGY', display_name: 'Nifty Energy', index_symbol: 'NSE:NIFTYENERGY-INDEX' },
          { id: 'sec-infra', name: 'NIFTY_INFRA', display_name: 'Nifty Infra', index_symbol: 'NSE:NIFTYINFRA-INDEX' },
          { id: 'sec-realty', name: 'NIFTY_REALTY', display_name: 'Nifty Realty', index_symbol: 'NSE:NIFTYREALTY-INDEX' }
        ];
      }

      if (stocks.length === 0) {
        logger.info('Supabase stocks table is empty. Loading default stocks universe in-memory...');
        stocks = [
          // Bank
          { id: 'stk-hdfc', symbol: 'NSE:HDFCBANK-EQ', company_name: 'HDFC Bank Ltd.', sector_id: 'sec-bank' },
          { id: 'stk-icici', symbol: 'NSE:ICICIBANK-EQ', company_name: 'ICICI Bank Ltd.', sector_id: 'sec-bank' },
          { id: 'stk-sbin', symbol: 'NSE:SBIN-EQ', company_name: 'State Bank of India', sector_id: 'sec-bank' },
          { id: 'stk-axis', symbol: 'NSE:AXISBANK-EQ', company_name: 'Axis Bank Ltd.', sector_id: 'sec-bank' },
          // IT
          { id: 'stk-tcs', symbol: 'NSE:TCS-EQ', company_name: 'Tata Consultancy Services Ltd.', sector_id: 'sec-it' },
          { id: 'stk-infy', symbol: 'NSE:INFY-EQ', company_name: 'Infosys Ltd.', sector_id: 'sec-it' },
          { id: 'stk-hcl', symbol: 'NSE:HCLTECH-EQ', company_name: 'HCL Technologies Ltd.', sector_id: 'sec-it' },
          // Auto
          { id: 'stk-tata', symbol: 'NSE:TATAMOTORS-EQ', company_name: 'Tata Motors Ltd.', sector_id: 'sec-auto' },
          { id: 'stk-mm', symbol: 'NSE:M&M-EQ', company_name: 'Mahindra & Mahindra Ltd.', sector_id: 'sec-auto' },
          { id: 'stk-maruti', symbol: 'NSE:MARUTI-EQ', company_name: 'Maruti Suzuki India Ltd.', sector_id: 'sec-auto' },
          // Metal
          { id: 'stk-tatasteel', symbol: 'NSE:TATASTEEL-EQ', company_name: 'Tata Steel Ltd.', sector_id: 'sec-metal' },
          { id: 'stk-jsw', symbol: 'NSE:JSWSTEEL-EQ', company_name: 'JSW Steel Ltd.', sector_id: 'sec-metal' },
          // Pharma
          { id: 'stk-sun', symbol: 'NSE:SUNPHARMA-EQ', company_name: 'Sun Pharma Industries Ltd.', sector_id: 'sec-pharma' },
          { id: 'stk-cipla', symbol: 'NSE:CIPLA-EQ', company_name: 'Cipla Ltd.', sector_id: 'sec-pharma' },
          // FMCG
          { id: 'stk-itc', symbol: 'NSE:ITC-EQ', company_name: 'ITC Ltd.', sector_id: 'sec-fmcg' },
          { id: 'stk-hul', symbol: 'NSE:HINDUNILVR-EQ', company_name: 'Hindustan Unilever Ltd.', sector_id: 'sec-fmcg' },
          // Energy
          { id: 'stk-reliance', symbol: 'NSE:RELIANCE-EQ', company_name: 'Reliance Industries Ltd.', sector_id: 'sec-energy' },
          { id: 'stk-ongc', symbol: 'NSE:ONGC-EQ', company_name: 'Oil & Natural Gas Corp Ltd.', sector_id: 'sec-energy' },
          // Infra
          { id: 'stk-lt', symbol: 'NSE:LT-EQ', company_name: 'Larsen & Toubro Ltd.', sector_id: 'sec-infra' },
          // Realty
          { id: 'stk-dlf', symbol: 'NSE:DLF-EQ', company_name: 'DLF Ltd.', sector_id: 'sec-realty' }
        ];
      }

      logger.info(`Loaded ${sectors.length} sectors and ${stocks.length} active stocks into Market Engine cache.`);

      // Build sector mapping helper
      const sectorIdToInfo = new Map<string, { name: string; displayName: string }>();
      sectors.forEach(s => {
        sectorIdToInfo.set(s.id, { name: s.name, displayName: s.display_name });
        this.sectorIndexSymbols.set(s.name, s.index_symbol);
      });

      // 2. Fetch or Generate historical metrics
      for (const stk of stocks) {
        const sectorInfo = sectorIdToInfo.get(stk.sector_id) || { name: 'OTHER', displayName: 'Other' };

        
        let { data: histData, error: histErr } = await supabase
          .from('historical_metrics')
          .select('*')
          .eq('stock_id', stk.id)
          .order('date', { ascending: true });

        if (histErr) {
          logger.error(`Error querying history for ${stk.symbol}: ${histErr.message}`);
          histData = [];
        }

        // Bootstrap data if database does not contain historical candles
        if (!histData || histData.length < 50) {
          logger.info(`Insufficient history for ${stk.symbol}. Generating mock historical daily candles...`);
          histData = await this.bootstrapHistoricalData(stk.id, stk.symbol);
        }

        // 3. Process indicators for each stock
        const closes = histData.map(h => Number(h.close));
        const highs = histData.map(h => Number(h.close * 1.015)); // Mock high
        const lows = histData.map(h => Number(h.close * 0.985));  // Mock low
        const volumes = histData.map(h => Number(h.volume));
        const dates = histData.map(h => h.date);

        const ema20 = calculateEMA(closes, 20);
        const ema50 = calculateEMA(closes, 50);
        const ema200 = calculateEMA(closes, 200);
        const rsi = calculateRSI(closes, 14);
        const macd = calculateMACD(closes, 12, 26, 9);
        const atr = calculateATR(highs, lows, closes, 14);
        const adx = calculateADX(highs, lows, closes, 14);

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
          if (closes[i] > recentHigh) recentHigh = closes[i];
          if (closes[i] < recentLow) recentLow = closes[i];
        }

        // Structure cached item
        const cachedItem: CachedStock = {
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
      logger.info('Market Engine fully initialized and cached.');
    } catch (err: any) {
      logger.error(`Market Engine initialization failed: ${err.message}`);
    }
  }

  /**
   * Generates 250 daily bars using standard random walks and saves them to the DB.
   */
  private async bootstrapHistoricalData(stockId: string, symbol: string): Promise<any[]> {
    const candles: any[] = [];
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
      const { error } = await supabase.from('historical_metrics').insert(batch);
      if (error) {
        logger.error(`Error seeding historical candles for ${symbol}: ${error.message}`);
      }
    }

    return candles;
  }

  private getBasePrice(symbol: string): number {
    const bases: Record<string, number> = {
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
  private recalculateAllMetrics() {
    // 1. Calculate Sector returns by averaging stock returns in each sector
    const sectorReturns = new Map<string, number[]>();
    const sectorStocks = new Map<string, CachedStock[]>();

    this.stocksCache.forEach(stk => {
      if (!sectorReturns.has(stk.sectorName)) {
        sectorReturns.set(stk.sectorName, []);
        sectorStocks.set(stk.sectorName, []);
      }
      sectorReturns.get(stk.sectorName)!.push(stk.changePercent);
      sectorStocks.get(stk.sectorName)!.push(stk);
    });

    const sectorStrengthMap = new Map<string, number>();

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
      const cachedSec = this.sectorsCache.get(sec.name)!;
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
      const scoreCard = computeScoreCard(
        stk.close,
        stk.indicatorCache.ema20,
        stk.indicatorCache.ema50,
        stk.indicatorCache.ema200,
        stk.indicatorCache.rsi,
        stk.indicatorCache.macdHist,
        stk.indicatorCache.macdPrevHist,
        stk.volumeRatio,
        stk.indicatorCache.adx,
        stk.indicatorCache.atr,
        stk.recentHigh,
        stk.recentLow,
        rFactor,
        sectorStrength,
        stk.indicatorCache.hhHl,
        stk.indicatorCache.lhLl
      );


      stk.scores = scoreCard;

      // 4. Evaluate Scanner Tags
      const tags: string[] = [];
      const c = stk.close;

      if (scoreCard.direction === 'BULLISH') {
        if (c >= stk.recentHigh && stk.volumeRatio > 1.4) tags.push('Breakout');
        if (stk.indicatorCache.ema20 && Math.abs(c - stk.indicatorCache.ema20) / c < 0.005) tags.push('EMA Pullback');
        if (stk.indicatorCache.ema20 && stk.indicatorCache.ema50 && stk.indicatorCache.ema20 > stk.indicatorCache.ema50) {
          tags.push('Golden Cross');
        }
        if (stk.indicatorCache.hhHl) tags.push('HH-HL');
        if (stk.volumeRatio > 1.8) tags.push('High Volume');
        if (scoreCard.opportunityScore > 75) tags.push('Strong Momentum');
      } else if (scoreCard.direction === 'BEARISH') {
        if (c <= stk.recentLow && stk.volumeRatio > 1.4) tags.push('Breakdown');
        if (stk.indicatorCache.ema20 && Math.abs(c - stk.indicatorCache.ema20) / c < 0.005) tags.push('EMA Rejection');
        if (stk.indicatorCache.ema20 && stk.indicatorCache.ema50 && stk.indicatorCache.ema20 < stk.indicatorCache.ema50) {
          tags.push('Death Cross');
        }
        if (stk.indicatorCache.lhLl) tags.push('LH-LL');
        if (stk.volumeRatio > 1.8) tags.push('Heavy Selling');
      }

      stk.scannerTags = tags;

      // Update sector count summaries
      if (sectorSec) {
        if (tags.includes('Breakout')) sectorSec.scannersSummary.breakoutCount++;
        if (tags.includes('Breakdown')) sectorSec.scannersSummary.breakdownCount++;
        if (tags.includes('Strong Momentum')) sectorSec.scannersSummary.momentumCount++;
        if (tags.includes('EMA Pullback') || tags.includes('HH-HL')) sectorSec.scannersSummary.swingCount++;
        if (tags.includes('High Volume') || tags.includes('Heavy Selling')) sectorSec.scannersSummary.highVolumeCount++;
      }
    });
  }

  /**
   * Updates cached stock metrics upon receiving a live ticker quote
   */
  updateTick(symbol: string, lastPrice: number, change: number, changePercent: number, volume: number) {
    const stk = this.stocksCache.get(symbol);
    if (!stk) return;

    // Update quote details
    stk.close = lastPrice;
    stk.changePercent = changePercent;
    stk.volume = volume;
    stk.volumeRatio = volume / stk.avgVolume || 1.0;

    // Update high / low boundaries if breached
    if (lastPrice > stk.recentHigh) stk.recentHigh = lastPrice;
    if (lastPrice < stk.recentLow) stk.recentLow = lastPrice;

    // Trigger full metrics updates
    this.recalculateAllMetrics();
  }

  updateIndex(symbol: string, price: number, change: number, changePercent: number) {
    const idx = this.liveIndices[symbol];
    if (idx) {
      idx.price = price;
      idx.change = change;
      idx.changePercent = changePercent;
    }
  }

  // Getters for frontend endpoints
  getDashboardData(): any {
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
      if (o.changePercent > 0) advances++;
      else if (o.changePercent < 0) declines++;
      else unchanged++;
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

  getSectorAnalysisList(): SectorAnalysis[] {
    return Array.from(this.sectorsCache.values()).sort((a, b) => a.rank - b.rank);
  }

  getSectorDetails(sectorName: string): any {
    const sector = this.sectorsCache.get(sectorName);
    if (!sector) return null;

    // Get stocks belonging to this sector
    const stocks = Array.from(this.stocksCache.values())
      .filter(s => s.sectorName === sectorName)
      .map(s => this.mapToOpportunity(s));

    return {
      sector,
      stocks,
    };
  }

  getScannerResults(type: 'LONG' | 'SHORT'): StockScannedOpportunity[] {
    const stocks = Array.from(this.stocksCache.values());
    const opportunities = stocks.map(s => this.mapToOpportunity(s));

    if (type === 'LONG') {
      return opportunities
        .filter(o => o.scores.direction === 'BULLISH' && o.scores.opportunityScore > 50)
        .sort((a, b) => b.scores.opportunityScore - a.scores.opportunityScore);
    } else {
      return opportunities
        .filter(o => o.scores.direction === 'BEARISH' && o.scores.opportunityScore > 50)
        .sort((a, b) => b.scores.opportunityScore - a.scores.opportunityScore);
    }
  }

  private getMarketStatus(): LiveMarketStatus {
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

    let status: 'OPEN' | 'CLOSED' = 'CLOSED';
    let session: 'PRE_MARKET' | 'REGULAR' | 'POST_MARKET' | 'OFF_HOURS' = 'OFF_HOURS';

    if (!isWeekend) {
      if (totalMinutes >= 9 * 60 && totalMinutes < 9 * 60 + 15) {
        status = 'CLOSED';
        session = 'PRE_MARKET';
      } else if (totalMinutes >= marketOpenMinutes && totalMinutes < marketCloseMinutes) {
        status = 'OPEN';
        session = 'REGULAR';
      } else if (totalMinutes >= marketCloseMinutes && totalMinutes < 16 * 60) {
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

  private mapToOpportunity(s: CachedStock): StockScannedOpportunity {
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

export default new MarketEngine();
