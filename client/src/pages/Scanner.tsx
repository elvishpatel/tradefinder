import React, { useEffect, useState } from 'react';
import useMarketStore from '../store/marketStore';
import {
  TrendingUp,
  TrendingDown,
  Radar,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';
import { StockScannedOpportunity } from '../types';


export const Scanner: React.FC = () => {
  const { longScannerResults, shortScannerResults, fetchInitialData, loading } = useMarketStore();
  const [scanType, setScanType] = useState<'LONG' | 'SHORT'>('LONG');
  const [expandedStockSym, setExpandedStockSym] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const toggleStockExpand = (symbol: string) => {
    setExpandedStockSym(expandedStockSym === symbol ? null : symbol);
  };

  const getActiveResults = () => {
    return scanType === 'LONG' ? longScannerResults : shortScannerResults;
  };

  const getReturnBgClass = (ret: number) => {
    if (ret > 0) return 'bg-bullish/10 border-bullish/20 text-bullish';
    if (ret < 0) return 'bg-bearish/10 border-bearish/20 text-bearish';
    return 'bg-[#151926] border-[#222a3f] text-muted-foreground';
  };

  const activeResults = getProcessedScannerResults(getActiveResults());

  function getProcessedScannerResults(results: StockScannedOpportunity[]) {
    // Sort by Opportunity Score descending
    return [...results].sort((a, b) => b.scores.opportunityScore - a.scores.opportunityScore);
  }

  return (
    <div className="p-8 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Radar className="w-8 h-8 text-primary animate-pulse" />
          Technical Scanner Engine
        </h1>
        <p className="text-muted-foreground text-sm">
          Scans the stock universe in real time for premium intraday and swing candidates.
        </p>
      </div>

      {/* SCAN TABS */}
      <div className="flex border-b border-[#171b29] gap-4">
        <button
          onClick={() => {
            setScanType('LONG');
            setExpandedStockSym(null);
          }}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-2 transition-all ${
            scanType === 'LONG'
              ? 'border-bullish text-bullish font-black'
              : 'border-transparent text-muted-foreground hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Long Scanner (Bullish Setups)
        </button>

        <button
          onClick={() => {
            setScanType('SHORT');
            setExpandedStockSym(null);
          }}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-2 transition-all ${
            scanType === 'SHORT'
              ? 'border-bearish text-bearish font-black'
              : 'border-transparent text-muted-foreground hover:text-white'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          Short Scanner (Bearish Setups)
        </button>
      </div>

      {/* STRATEGY SUMMARY CARD */}
      <div className="p-5 rounded-2xl border border-[#1e2538] bg-[#0c0e17] text-xs leading-relaxed space-y-3">
        <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-[11px]">
          <Info className="w-4 h-4 text-primary" />
          Active Scan Parameters
        </div>
        {scanType === 'LONG' ? (
          <p className="text-muted-foreground">
            Filtering for stocks with **Bullish Alignment** ($EMA_{20} &gt; EMA_{50} &gt; EMA_{200}$), high-volume daily/weekly breakouts...
          </p>
        ) : (
          <p className="text-muted-foreground">
            Filtering for stocks with **Bearish Alignment** ($EMA_{20} &lt; EMA_{50} &lt; EMA_{200}$), high-volume breakdowns...
          </p>
        )}
      </div>

      {/* SCAN RESULTS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 bg-[#151a2d] border border-[#1e263d] rounded-2xl" />
          ))}
        </div>
      ) : activeResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeResults.map((item) => {
            const isExpanded = expandedStockSym === item.symbol;
            const isUp = item.changePercent >= 0;

            return (
              <div
                key={item.symbol}
                className={`glass-panel border rounded-2xl overflow-hidden transition-all duration-300 ${
                  isExpanded ? 'border-primary/45 shadow-glow' : 'border-[#171b29] hover:border-[#222a3d]'
                }`}
              >
                {/* Summary Card Header */}
                <div
                  onClick={() => toggleStockExpand(item.symbol)}
                  className="p-5 flex justify-between items-center cursor-pointer select-none bg-[#0c0f1a]/40"
                >
                  <div className="flex items-center gap-3">
                    {scanType === 'LONG' ? (
                      <div className="w-9 h-9 rounded-xl bg-bullish/10 flex items-center justify-center text-bullish border border-bullish/10 shadow-sm">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-bearish/10 flex items-center justify-center text-bearish border border-bearish/10 shadow-sm">
                        <ArrowDownRight className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-bold text-white block">
                        {item.symbol.split(':')[1]}
                      </span>
                      <span className="text-[10px] text-muted-foreground block truncate max-w-[150px]">
                        {item.companyName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-white block">
                        {item.close.toFixed(2)}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getReturnBgClass(item.changePercent)}`}>
                        {isUp ? '+' : ''}
                        {item.changePercent.toFixed(2)}%
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center bg-[#07080e] border border-[#1b2033] px-3 py-1.5 rounded-xl font-mono">
                      <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider leading-none">
                        Opp Score
                      </span>
                      <span className="text-sm font-black text-primary leading-none mt-1">
                        {item.scores.opportunityScore}
                      </span>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Subtag lists */}
                <div className="px-5 pb-4 flex flex-wrap gap-1">
                  {item.scannerTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] px-2 py-0.5 rounded bg-[#1e2538] border border-[#2d3752] font-semibold text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Expanded scorecard detail panel */}
                {isExpanded && (
                  <div className="border-t border-[#171b29] bg-[#08090f] p-5 space-y-4">
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-primary" />
                      Platform Technical Scorecard
                    </h4>

                    {/* Score grid */}
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { label: 'Momentum', val: item.scores.momentumScore },
                        { label: 'Trend', val: item.scores.trendScore },
                        { label: 'Breakout', val: item.scores.breakoutScore },
                        { label: 'R-Factor', val: item.scores.rFactorScore },
                        { label: 'Sector Strength', val: item.scores.sectorStrengthScore },
                        { label: 'Direction', val: item.scores.direction, stringVal: true },
                      ].map((sc) => (
                        <div key={sc.label} className="bg-[#0f111e] border border-[#1b2034] p-2.5 rounded-xl text-center">
                          <span className="text-[9px] text-muted-foreground uppercase block font-semibold">
                            {sc.label}
                          </span>
                          <span
                            className={`text-xs font-black font-mono mt-0.5 block ${
                              sc.stringVal
                                ? sc.val === 'BULLISH'
                                  ? 'text-bullish'
                                  : 'text-bearish'
                                : 'text-white'
                            }`}
                          >
                            {sc.stringVal ? sc.val : `${sc.val}/100`}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Reasoning list */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest block">
                        Engine Logic Reasoning
                      </span>
                      <div className="space-y-1.5">
                        {item.scores.reasoning.map((rs: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] bg-[#0c0d15] border border-[#141824] p-2 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            <span className="text-muted-foreground leading-normal">{rs}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed border-[#1e263d] rounded-2xl p-12 text-center text-muted-foreground text-sm bg-[#0c0e17]/50">
          No stock candidates currently match the technical criteria for a {scanType.toLowerCase()} scan.
        </div>
      )}
    </div>
  );
};

export default Scanner;
