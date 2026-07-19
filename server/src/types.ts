export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface FyersSession {
  userId: string;
  accessToken: string;
  expiresAt: string;
  isValid: boolean;
}

export interface Sector {
  id: string;
  name: string;
  displayName: string;
  indexSymbol: string | null;
  weightage: number;
}

export interface Stock {
  id: string;
  symbol: string;
  companyName: string;
  sectorId: string | null;
  isActive: boolean;
}

export interface HistoricalMetrics {
  id: string;
  stockId: string;
  symbol: string;
  date: string;
  close: number;
  volume: number;
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;
  rsi14: number | null;
  macdLine: number | null;
  macdSignal: number | null;
  macdHist: number | null;
  adx14: number | null;
  atr14: number | null;
  hhHl: boolean;
  lhLl: boolean;
  rFactor: number | null;
}

export type MarketDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface ScoreCard {
  momentumScore: number;       // 0 - 100
  trendScore: number;          // 0 - 100
  breakoutScore: number;       // 0 - 100
  rFactorScore: number;        // R-Factor mapped to 0-100 or relative value
  sectorStrengthScore: number; // 0 - 100
  opportunityScore: number;    // Weighted combination: 0 - 100
  direction: MarketDirection;
  reasoning: string[];
}

export interface StockScannedOpportunity extends Stock {
  close: number;
  changePercent: number;
  volumeRatio: number;
  scores: ScoreCard;
  scannerTags: string[];
}

export interface SectorAnalysis {
  id: string;
  name: string;
  displayName: string;
  indexSymbol: string | null;
  currentReturn: number;
  dailyReturn: number;

  weeklyReturn: number;
  monthlyReturn: number;
  rank: number;
  trend: MarketDirection;
  moneyFlow: 'INFLOW' | 'OUTFLOW' | 'FLAT';
  momentumScore: number;
  strengthScore: number;
  relativeStrengthVsNifty: number;
  averageReturn: number;
  marketBreadth: {
    advance: number;
    decline: number;
    total: number;
  };
  breadthEMAs: {
    aboveEMA20: number; // percentage
    aboveEMA50: number;
    aboveEMA200: number;
  };
  averageRSI: number;
  averageVolumeRatio: number;
  highestGainer: {
    symbol: string;
    changePercent: number;
  } | null;
  highestLoser: {
    symbol: string;
    changePercent: number;
  } | null;
  scannersSummary: {
    breakoutCount: number;
    breakdownCount: number;
    momentumCount: number;
    swingCount: number;
    highVolumeCount: number;
  };
}

export interface LiveMarketStatus {
  status: 'OPEN' | 'CLOSED';
  session: 'PRE_MARKET' | 'REGULAR' | 'POST_MARKET' | 'OFF_HOURS';
  time: string;
}

export interface LiveIndexData {
  symbol: string;
  displayName: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  prevClose: number;
}

export interface LiveBreadth {
  advances: number;
  declines: number;
  unchanged: number;
  ratio: number;
}

export interface DashboardData {
  marketStatus: LiveMarketStatus;
  indices: {
    nifty: LiveIndexData;
    bankNifty: LiveIndexData;
    sensex: LiveIndexData;
    vix: LiveIndexData;
  };
  breadth: LiveBreadth;
  gainers: StockScannedOpportunity[];
  losers: StockScannedOpportunity[];
  mostActive: StockScannedOpportunity[];
  volumeLeaders: StockScannedOpportunity[];
}

export interface LiveTick {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}
