import React, { useEffect, useState } from 'react';
import useMarketStore from '../store/marketStore';
import {
  ChevronLeft,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Layers,
  CircleDot,
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { StockScannedOpportunity } from '../types';


export const SectorAnalysis: React.FC = () => {
  const { sectorsList, selectedSectorDetails, fetchInitialData, fetchSectorDetails, clearSectorDetails, sectorLoading } = useMarketStore();
  const [activeSector, setActiveSector] = useState<string | null>(null);
  
  // Table state
  const [filterType, setFilterType] = useState<string>('ALL'); // ALL, BREAKOUT, BREAKDOWN, HIGH_VOLUME, SWING, BULLISH, BEARISH
  const [sortField, setSortField] = useState<keyof StockScannedOpportunity | 'opportunityScore' | 'rFactorScore'>('close');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [expandedStockSym, setExpandedStockSym] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleSectorClick = (sectorName: string) => {
    setActiveSector(sectorName);
    fetchSectorDetails(sectorName);
  };

  const handleBack = () => {
    setActiveSector(null);
    clearSectorDetails();
    setExpandedStockSym(null);
    setFilterType('ALL');
  };

  const toggleSort = (field: any) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const toggleStockExpand = (symbol: string) => {
    setExpandedStockSym(expandedStockSym === symbol ? null : symbol);
  };

  // Helper formatting styles
  const getReturnBgClass = (ret: number) => {
    if (ret > 0) return 'bg-bullish/10 border-bullish/20 text-bullish';
    if (ret < 0) return 'bg-bearish/10 border-bearish/20 text-bearish';
    return 'bg-[#151926] border-[#222a3f] text-muted-foreground';
  };

  // FILTER & SORT STOCKS
  const getProcessedStocks = () => {
    if (!selectedSectorDetails) return [];
    let stocks = [...selectedSectorDetails.stocks];

    // Filter
    if (filterType === 'BREAKOUT') {
      stocks = stocks.filter(s => s.scannerTags.includes('Breakout'));
    } else if (filterType === 'BREAKDOWN') {
      stocks = stocks.filter(s => s.scannerTags.includes('Breakdown'));
    } else if (filterType === 'HIGH_VOLUME') {
      stocks = stocks.filter(s => s.scannerTags.includes('High Volume') || s.scannerTags.includes('Heavy Selling'));
    } else if (filterType === 'SWING') {
      stocks = stocks.filter(s => s.scannerTags.includes('EMA Pullback') || s.scannerTags.includes('HH-HL'));
    } else if (filterType === 'BULLISH') {
      stocks = stocks.filter(s => s.scores.direction === 'BULLISH');
    } else if (filterType === 'BEARISH') {
      stocks = stocks.filter(s => s.scores.direction === 'BEARISH');
    }

    // Sort
    stocks.sort((a: any, b: any) => {
      let valA: any;
      let valB: any;

      if (sortField === 'opportunityScore') {
        valA = a.scores.opportunityScore;
        valB = b.scores.opportunityScore;
      } else if (sortField === 'rFactorScore') {
        valA = a.scores.rFactorScore;
        valB = b.scores.rFactorScore;
      } else {
        valA = a[sortField];
        valB = b[sortField];
      }

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });

    return stocks;
  };

  // 1. SECTOR DETAILS VIEW
  if (activeSector && selectedSectorDetails) {
    const { sector, stocks } = selectedSectorDetails;
    const processedStocks = getProcessedStocks();

    return (
      <div className="p-8 space-y-6">
        {/* HEADER */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg border border-[#1e2538] bg-[#0c0e17] text-muted-foreground hover:text-white transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">{sector.displayName}</h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getReturnBgClass(sector.dailyReturn)}`}>
                Rank #{sector.rank}
              </span>
            </div>
            <p className="text-muted-foreground text-xs">
              Sector Tracker • {sector.displayName} stocks constituents list.
            </p>
          </div>
        </div>

        {/* METRICS & GAUGES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats list */}
          <div className="glass-panel border border-[#171b29] p-5 rounded-2xl space-y-3.5 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] pb-1.5 border-b border-[#171b29]">
              Sector Highlights
            </h3>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Daily Return</span>
              <span className={`font-mono font-bold ${sector.dailyReturn >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                {sector.dailyReturn >= 0 ? '+' : ''}{sector.dailyReturn.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weekly / Monthly</span>
              <span className="text-white font-mono font-bold">
                {sector.weeklyReturn.toFixed(1)}% / {sector.monthlyReturn.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Flow Direction</span>
              <span className={`font-bold flex items-center gap-1 ${sector.moneyFlow === 'INFLOW' ? 'text-bullish' : 'text-muted-foreground'}`}>
                {sector.moneyFlow === 'INFLOW' ? '▲ Net Inflow' : '▼ Net Outflow'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Momentum Score</span>
              <span className="text-primary font-bold">{sector.momentumScore}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rel. Strength vs Nifty</span>
              <span className={`font-bold ${sector.relativeStrengthVsNifty >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                {sector.relativeStrengthVsNifty >= 0 ? '+' : ''}{sector.relativeStrengthVsNifty.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Breadth EMAs */}
          <div className="glass-panel border border-[#171b29] p-5 rounded-2xl space-y-4 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] pb-1.5 border-b border-[#171b29]">
              EMA Breadth (% of stocks above)
            </h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium">
                  <span className="text-muted-foreground">EMA 20 (Short term)</span>
                  <span className="text-white font-bold">{sector.breadthEMAs.aboveEMA20.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#1b2033] rounded-full overflow-hidden">
                  <div style={{ width: `${sector.breadthEMAs.aboveEMA20}%` }} className="bg-primary h-full" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium">
                  <span className="text-muted-foreground">EMA 50 (Medium term)</span>
                  <span className="text-white font-bold">{sector.breadthEMAs.aboveEMA50.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#1b2033] rounded-full overflow-hidden">
                  <div style={{ width: `${sector.breadthEMAs.aboveEMA50}%` }} className="bg-bullish h-full" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium">
                  <span className="text-muted-foreground">EMA 200 (Long term)</span>
                  <span className="text-white font-bold">{sector.breadthEMAs.aboveEMA200.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#1b2033] rounded-full overflow-hidden">
                  <div style={{ width: `${sector.breadthEMAs.aboveEMA200}%` }} className="bg-amber-500 h-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Sector scanner counts */}
          <div className="glass-panel border border-[#171b29] p-5 rounded-2xl space-y-3 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] pb-1.5 border-b border-[#171b29]">
              Scanners Hit Summary
            </h3>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-[#0f121e] border border-[#1c2235] p-2 rounded-xl">
                <span className="text-bullish font-bold block text-base">{sector.scannersSummary.breakoutCount}</span>
                <span className="text-[10px] text-muted-foreground uppercase">Breakouts</span>
              </div>
              <div className="bg-[#0f121e] border border-[#1c2235] p-2 rounded-xl">
                <span className="text-bearish font-bold block text-base">{sector.scannersSummary.breakdownCount}</span>
                <span className="text-[10px] text-muted-foreground uppercase">Breakdowns</span>
              </div>
              <div className="bg-[#0f121e] border border-[#1c2235] p-2 rounded-xl">
                <span className="text-primary font-bold block text-base">{sector.scannersSummary.momentumCount}</span>
                <span className="text-[10px] text-muted-foreground uppercase">Momentum</span>
              </div>
              <div className="bg-[#0f121e] border border-[#1c2235] p-2 rounded-xl">
                <span className="text-amber-500 font-bold block text-base">{sector.scannersSummary.swingCount}</span>
                <span className="text-[10px] text-muted-foreground uppercase">Pullbacks</span>
              </div>
            </div>
          </div>
        </div>

        {/* STOCK TABLE & CONTROLS */}
        <div className="glass-panel border border-[#171b29] rounded-2xl overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-[#171b29] bg-[#0c0e17] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Filter Candidates
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['ALL', 'BULLISH', 'BEARISH', 'BREAKOUT', 'BREAKDOWN', 'HIGH_VOLUME', 'SWING'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                    filterType === type
                      ? 'bg-primary border-primary/20 text-white shadow-glow'
                      : 'border-[#1b2033] text-muted-foreground hover:text-white hover:bg-[#151926]'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0b0c14] border-b border-[#171b29] text-muted-foreground uppercase tracking-widest text-[10px] font-semibold">
                  <th className="p-4 w-6"></th>
                  <th className="p-4 cursor-pointer hover:text-white" onClick={() => toggleSort('symbol')}>Symbol</th>
                  <th className="p-4 cursor-pointer hover:text-white" onClick={() => toggleSort('close')}>Price</th>
                  <th className="p-4 cursor-pointer hover:text-white" onClick={() => toggleSort('changePercent')}>Change %</th>
                  <th className="p-4 cursor-pointer hover:text-white" onClick={() => toggleSort('volumeRatio')}>Vol Ratio</th>
                  <th className="p-4 cursor-pointer hover:text-white" onClick={() => toggleSort('rFactorScore')}>R-Factor</th>
                  <th className="p-4 cursor-pointer hover:text-white" onClick={() => toggleSort('opportunityScore')}>Opp Score</th>
                  <th className="p-4">Signals</th>
                </tr>
              </thead>
              <tbody>
                {processedStocks.map((stk) => {
                  const isExpanded = expandedStockSym === stk.symbol;
                  const isUp = stk.changePercent >= 0;

                  return (
                    <React.Fragment key={stk.symbol}>
                      <tr
                        onClick={() => toggleStockExpand(stk.symbol)}
                        className={`border-b border-[#171b29] hover:bg-[#121626]/50 cursor-pointer transition-colors ${isExpanded ? 'bg-[#121626]/30' : ''}`}
                      >
                        <td className="p-4">
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-white block">{stk.symbol.split(':')[1]}</span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[130px] block">{stk.companyName}</span>
                        </td>
                        <td className="p-4 font-mono font-semibold text-white">
                          {stk.close.toFixed(2)}
                        </td>
                        <td className="p-4 font-mono">
                          <span className={`px-2 py-0.5 rounded-md border font-bold text-[10px] ${getReturnBgClass(stk.changePercent)}`}>
                            {isUp ? '+' : ''}{stk.changePercent.toFixed(2)}%
                          </span>
                        </td>
                        <td className="p-4 font-mono text-muted-foreground font-semibold">
                          {stk.volumeRatio.toFixed(1)}x
                        </td>
                        <td className="p-4 font-mono">
                          <span className={`font-bold ${stk.scores.rFactorScore >= 50 ? 'text-bullish' : 'text-bearish'}`}>
                            {((stk.scores.rFactorScore - 50) / 5).toFixed(1)}
                          </span>
                        </td>
                        <td className="p-4 font-mono">
                          <span className="text-primary font-extrabold text-sm">{stk.scores.opportunityScore}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {stk.scannerTags.slice(0, 2).map((t) => (
                              <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-[#1e2538] border border-[#2d3752] font-semibold text-white">
                                {t}
                              </span>
                            ))}
                            {stk.scannerTags.length > 2 && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1e2538] text-muted-foreground font-semibold">
                                +{stk.scannerTags.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED ROW TECHNICAL DETAILS */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="p-0 bg-[#090a10]">
                            <div className="p-6 border-b border-[#171b29] space-y-4">
                              <h4 className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-primary" />
                                Technical Breakdown for {stk.symbol.split(':')[1]}
                              </h4>

                              {/* Grid Scores */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                {[
                                  { label: 'Momentum', val: stk.scores.momentumScore },
                                  { label: 'Trend', val: stk.scores.trendScore },
                                  { label: 'Breakout', val: stk.scores.breakoutScore },
                                  { label: 'R-Factor', val: stk.scores.rFactorScore },
                                  { label: 'Sector Str', val: stk.scores.sectorStrengthScore },
                                  { label: 'Opportunity', val: stk.scores.opportunityScore, highlight: true }
                                ].map((sc) => (
                                  <div key={sc.label} className="bg-[#0f111e] border border-[#1b2034] p-3 rounded-xl">
                                    <span className="text-[10px] text-muted-foreground uppercase block tracking-wider font-semibold">
                                      {sc.label}
                                    </span>
                                    <span className={`text-base font-black font-mono block mt-1 ${sc.highlight ? 'text-primary' : 'text-white'}`}>
                                      {sc.val}/100
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* Reasoning checklist */}
                              <div className="space-y-1.5">
                                <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                                  Indicator Analysis
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                  {stk.scores.reasoning.map((rs: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2 bg-[#0c0d15] border border-[#141824] p-2.5 rounded-lg">
                                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                      <span className="text-muted-foreground leading-normal">{rs}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {processedStocks.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground text-sm">
                      No stock matches the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // 2. DEFAULT SECTOR HEATMAP VIEW
  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Sector Performance</h1>
        <p className="text-muted-foreground text-sm">
          Overview of sector rotation, money flows, and index health.
        </p>
      </div>

      {/* HEATMAP GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sectorsList.map((sec) => {
          const isUp = sec.dailyReturn >= 0;
          return (
            <div
              key={sec.name}
              onClick={() => handleSectorClick(sec.name)}
              className="glass-panel border border-[#171b29] hover:border-primary/45 p-6 rounded-2xl cursor-pointer transition-all duration-300 relative group overflow-hidden"
            >
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full group-hover:bg-primary/10 transition-colors" />

              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-base text-white tracking-wide">{sec.displayName}</h3>
                  <span className="text-[10px] text-muted-foreground/60 tracking-wider">
                    {sec.indexSymbol || 'Custom Basket'}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getReturnBgClass(sec.dailyReturn)}`}>
                  Rank #{sec.rank}
                </span>
              </div>

              {/* Big return text */}
              <div className="mt-6 flex justify-between items-baseline">
                <div>
                  <span className="text-2xl font-black text-white font-mono">
                    {isUp ? '+' : ''}{sec.dailyReturn.toFixed(2)}%
                  </span>
                  <p className="text-[10px] text-muted-foreground uppercase mt-0.5 tracking-wider">
                    Daily return
                  </p>
                </div>
                
                {/* Money flow arrow indicator */}
                <div className="flex items-center gap-1">
                  {isUp ? (
                    <div className="w-8 h-8 rounded-full bg-bullish/10 flex items-center justify-center text-bullish">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-bearish/10 flex items-center justify-center text-bearish">
                      <ArrowDownRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>

              {/* Breadth details */}
              <div className="mt-6 pt-4 border-t border-[#171b29] flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                <span className="flex items-center gap-1.5">
                  <CircleDot className="w-3.5 h-3.5 text-primary" />
                  RSI: {sec.averageRSI.toFixed(0)}
                </span>
                <span>
                  {sec.marketBreadth.advance} Advances / {sec.marketBreadth.decline} Declines
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SectorAnalysis;
