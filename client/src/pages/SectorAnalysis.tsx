import React, { useEffect, useState } from 'react';
import useMarketStore from '../store/marketStore';
import {
  ChevronLeft,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  Activity,
  Flame,
} from 'lucide-react';
import { StockScannedOpportunity } from '../types';

export const SectorAnalysis: React.FC = () => {
  const { sectorsList, selectedSectorDetails, fetchInitialData, fetchSectorDetails, clearSectorDetails } = useMarketStore();
  const [activeSector, setActiveSector] = useState<string | null>(null);

  // Table state
  const [filterType, setFilterType] = useState<string>('ALL'); // ALL, GAINERS, LOSERS, HIGH_VOLUME, SWING, BREAKOUT, BREAKDOWN, BULLISH, BEARISH
  const [sortField, setSortField] = useState<keyof StockScannedOpportunity | 'opportunityScore' | 'rFactorScore'>('changePercent');
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

  // Heatmap styling based on return magnitude
  const getHeatmapTileClass = (ret: number) => {
    if (ret >= 1.2) {
      return 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:border-emerald-400';
    } else if (ret >= 0.2) {
      return 'bg-emerald-950/35 border-emerald-500/30 text-emerald-400 hover:border-emerald-500/50';
    } else if (ret <= -1.2) {
      return 'bg-rose-950/70 border-rose-500/50 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.15)] hover:border-rose-400';
    } else if (ret <= -0.2) {
      return 'bg-rose-950/35 border-rose-500/30 text-rose-400 hover:border-rose-500/50';
    }
    return 'bg-[#0e111a] border-[#1e2538] text-muted-foreground hover:border-[#2e3752]';
  };

  const getReturnBadgeClass = (ret: number) => {
    if (ret > 0) return 'bg-bullish/10 border-bullish/20 text-bullish';
    if (ret < 0) return 'bg-bearish/10 border-bearish/20 text-bearish';
    return 'bg-[#151926] border-[#222a3f] text-muted-foreground';
  };

  // FILTER & SORT STOCKS inside selected sector
  const getProcessedStocks = () => {
    if (!selectedSectorDetails) return [];
    let stocks = [...selectedSectorDetails.stocks];

    // Filter
    if (filterType === 'GAINERS') {
      const gainers = stocks.filter(s => s.changePercent > 0);
      stocks = gainers.length > 0 ? gainers : stocks;
    } else if (filterType === 'LOSERS') {
      const losers = stocks.filter(s => s.changePercent < 0);
      stocks = losers.length > 0 ? losers : stocks;
    } else if (filterType === 'HIGH_VOLUME') {
      const vol = stocks.filter(s => s.volumeRatio > 1.1 || s.scannerTags.includes('High Volume') || s.scannerTags.includes('Heavy Selling'));
      stocks = vol.length > 0 ? vol : stocks;
    } else if (filterType === 'SWING') {
      const swing = stocks.filter(s => s.scannerTags.includes('EMA Pullback') || s.scannerTags.includes('HH-HL') || s.scores.opportunityScore > 50);
      stocks = swing.length > 0 ? swing : stocks;
    } else if (filterType === 'BREAKOUT') {
      const breakouts = stocks.filter(s => s.scannerTags.includes('Breakout') || s.changePercent > 0.8);
      stocks = breakouts.length > 0 ? breakouts : stocks;
    } else if (filterType === 'BREAKDOWN') {
      const breakdowns = stocks.filter(s => s.scannerTags.includes('Breakdown') || s.changePercent < -0.8);
      stocks = breakdowns.length > 0 ? breakdowns : stocks;
    } else if (filterType === 'BULLISH') {
      const bull = stocks.filter(s => s.scores.direction === 'BULLISH');
      stocks = bull.length > 0 ? bull : stocks;
    } else if (filterType === 'BEARISH') {
      const bear = stocks.filter(s => s.scores.direction === 'BEARISH');
      stocks = bear.length > 0 ? bear : stocks;
    }

    // Default direction for Gainers / Losers tabs
    let activeAsc = sortAsc;
    if (filterType === 'GAINERS' && sortField === 'changePercent') activeAsc = false;
    if (filterType === 'LOSERS' && sortField === 'changePercent') activeAsc = true;

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
        return activeAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return activeAsc ? valA - valB : valB - valA;
    });

    return stocks;
  };

  // 1. SECTOR DETAILS VIEW
  if (activeSector && selectedSectorDetails) {
    const { sector } = selectedSectorDetails;
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
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getReturnBadgeClass(sector.dailyReturn)}`}>
                Rank #{sector.rank}
              </span>
            </div>
            <p className="text-muted-foreground text-xs">
              Sector Tracker • {sector.displayName} constituents list & technical analytics.
            </p>
          </div>
        </div>

        {/* METRICS & GAUGES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats list */}
          <div className="glass-panel border border-[#171b29] p-5 rounded-2xl space-y-3.5 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] pb-1.5 border-b border-[#171b29]">
              Sector Performance Summary
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
              <span className="text-muted-foreground">Money Flow</span>
              <span className={`font-bold flex items-center gap-1 ${sector.moneyFlow === 'INFLOW' ? 'text-bullish' : 'text-bearish'}`}>
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
                Filter Constituent Stocks ({processedStocks.length})
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'ALL', label: 'All Stocks' },
                { id: 'GAINERS', label: 'Top Gainers' },
                { id: 'LOSERS', label: 'Top Losers' },
                { id: 'HIGH_VOLUME', label: 'High Volume' },
                { id: 'SWING', label: 'Swing / Pullbacks' },
                { id: 'BREAKOUT', label: 'Breakouts' },
                { id: 'BREAKDOWN', label: 'Breakdowns' },
                { id: 'BULLISH', label: 'Bullish' },
                { id: 'BEARISH', label: 'Bearish' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    filterType === tab.id
                      ? 'bg-primary border-primary/20 text-white shadow-glow'
                      : 'border-[#1b2033] text-muted-foreground hover:text-white hover:bg-[#151926]'
                  }`}
                >
                  {tab.label}
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
                          ₹{stk.close.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 font-mono">
                          <span className={`px-2 py-0.5 rounded-md border font-bold text-[10px] ${getReturnBadgeClass(stk.changePercent)}`}>
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

  // 2. SECTOR PERFORMANCE HEATMAP VIEW (ALL 9 SECTORS ALIGNED & RANKED BY MOVEMENT)
  const sortedSectors = [...sectorsList].sort((a, b) => b.dailyReturn - a.dailyReturn);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-500" />
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Sector Performance Heatmap</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            All 9 Nifty sectors ranked by daily movement. Click any sector tile to view constituent stocks.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-muted-foreground uppercase text-[10px] tracking-wider">Heatmap Scale:</span>
          <span className="px-2 py-1 rounded bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-[10px]">+1.5%+</span>
          <span className="px-2 py-1 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[10px]">+0.2%</span>
          <span className="px-2 py-1 rounded bg-[#0e111a] border border-[#1e2538] text-muted-foreground text-[10px]">Flat</span>
          <span className="px-2 py-1 rounded bg-rose-950/40 border border-rose-500/30 text-rose-400 text-[10px]">-0.2%</span>
          <span className="px-2 py-1 rounded bg-rose-950/70 border border-rose-500/50 text-rose-300 text-[10px]">-1.5%+</span>
        </div>
      </div>

      {/* VISUAL HEATMAP GRID (ALL 9 SECTORS ALIGNED) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {sortedSectors.map((sec, idx) => {
          const isUp = sec.dailyReturn >= 0;
          const heatClass = getHeatmapTileClass(sec.dailyReturn);

          return (
            <div
              key={sec.name}
              onClick={() => handleSectorClick(sec.name)}
              className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 relative group overflow-hidden border ${heatClass}`}
            >
              {/* Top Bar: Sector Display Name & Rank */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-lg text-white tracking-wide">{sec.displayName}</h3>
                  <span className="text-[10px] text-muted-foreground/80 font-mono tracking-wider">
                    {sec.indexSymbol || 'NSE:' + sec.name}
                  </span>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-black/40 border border-white/10 text-white font-mono shadow-sm">
                  #{idx + 1}
                </span>
              </div>

              {/* Big Return % Display */}
              <div className="mt-6 flex justify-between items-baseline">
                <div>
                  <span className="text-3xl font-black font-mono tracking-tight text-white">
                    {isUp ? '+' : ''}{sec.dailyReturn.toFixed(2)}%
                  </span>
                  <p className="text-[10px] uppercase mt-1 tracking-widest font-bold opacity-80">
                    Daily Movement
                  </p>
                </div>

                {/* Arrow Icon */}
                <div className="w-10 h-10 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center">
                  {isUp ? (
                    <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-rose-400" />
                  )}
                </div>
              </div>

              {/* Bottom Breadth Metrics */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-bold">
                <span className="flex items-center gap-1.5 opacity-90">
                  <Activity className="w-3.5 h-3.5" />
                  RSI: {sec.averageRSI.toFixed(0)}
                </span>
                <span className="opacity-90">
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
