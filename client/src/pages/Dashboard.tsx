import React, { useEffect } from 'react';
import useMarketStore from '../store/marketStore';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Award,
  Zap,
  BarChart3,
  CalendarDays,
  Clock,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { dashboardData, loading, fetchInitialData } = useMarketStore();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  if (loading || !dashboardData) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[#1e263d] rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-[#151a2d] border border-[#1e263d] rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 h-64 bg-[#151a2d] border border-[#1e263d] rounded-2xl" />
          <div className="lg:col-span-2 h-64 bg-[#151a2d] border border-[#1e263d] rounded-2xl" />
        </div>
      </div>
    );
  }

  const { marketStatus, indices, breadth, gainers, losers, mostActive, volumeLeaders } = dashboardData;

  // Format date helper
  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  // Compute color based on return
  const getReturnColorClass = (ret: number) => {
    if (ret > 0) return 'text-bullish';
    if (ret < 0) return 'text-bearish';
    return 'text-muted-foreground';
  };

  const getReturnBgClass = (ret: number) => {
    if (ret > 0) return 'bg-bullish/10 border-bullish/20 text-bullish';
    if (ret < 0) return 'bg-bearish/10 border-bearish/20 text-bearish';
    return 'bg-[#151926] border-[#222a3f] text-muted-foreground';
  };

  // Estimate total stocks count for breadth
  const totalBreadth = breadth.advances + breadth.declines + breadth.unchanged || 1;
  const advancePct = (breadth.advances / totalBreadth) * 100;
  const declinePct = (breadth.declines / totalBreadth) * 100;

  return (
    <div className="p-8 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Market Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Live technical health, indices metrics, and opportunity highlights.
          </p>
        </div>

        {/* Live Clock & Market status */}
        <div className="flex items-center gap-3 bg-[#0c0e17] border border-[#1e2538] px-4 py-2.5 rounded-xl">
          <Clock className="w-4 h-4 text-primary" />
          <div className="text-xs">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${marketStatus.status === 'OPEN' ? 'bg-bullish' : 'bg-amber-500'}`} />
              <span className="font-bold text-white uppercase">{marketStatus.session.replace('_', ' ')}</span>
            </div>
            <p className="text-muted-foreground text-[10px] tracking-wide mt-0.5">
              IST Time: {formatDate(marketStatus.time)}
            </p>
          </div>
        </div>
      </div>

      {/* INDEX CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.values(indices).map((idx: any) => {
          const isUp = idx.changePercent >= 0;
          return (
            <div
              key={idx.symbol}
              className="glass-panel border border-[#171b29] hover:border-primary/20 p-5 rounded-2xl transition-all duration-300 relative group overflow-hidden"
            >
              {/* Highlight background lines */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full group-hover:bg-primary/10 transition-colors" />

              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest block">
                    {idx.displayName}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 tracking-wider">
                    {idx.symbol.split(':')[1]}
                  </span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${getReturnBgClass(idx.changePercent)}`}>
                  {isUp ? '+' : ''}
                  {idx.changePercent.toFixed(2)}%
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white tracking-tight">
                  {idx.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className={getReturnColorClass(idx.changePercent)}>
                  {isUp ? '▲' : '▼'} {Math.abs(idx.change).toFixed(2)}
                </span>
                <span className="text-muted-foreground/50">
                  Prev Close: {idx.prevClose.toFixed(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* BREADTH & HEATMAP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Advance/Decline Breadth */}
        <div className="glass-panel border border-[#171b29] p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Market Breadth
              </h3>
            </div>

            <div className="text-center py-6">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest block">
                A/D Ratio
              </span>
              <span className="text-4xl font-extrabold text-white tracking-tighter">
                {breadth.ratio}x
              </span>
              <p className="text-[11px] text-muted-foreground/80 mt-1">
                {breadth.advances} Advances vs {breadth.declines} Declines
              </p>
            </div>
          </div>

          {/* Progress bar ratio */}
          <div className="space-y-3">
            <div className="h-2 w-full bg-[#1a1f33] rounded-full overflow-hidden flex">
              <div
                style={{ width: `${advancePct}%` }}
                className="bg-bullish h-full transition-all duration-500"
              />
              <div
                style={{ width: `${100 - advancePct - declinePct}%` }}
                className="bg-muted h-full"
              />
              <div
                style={{ width: `${declinePct}%` }}
                className="bg-bearish h-full transition-all duration-500"
              />
            </div>

            <div className="flex justify-between text-[10px] font-semibold">
              <span className="text-bullish flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-bullish" />
                ADVANCES: {breadth.advances} ({advancePct.toFixed(0)}%)
              </span>
              <span className="text-bearish flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-bearish" />
                DECLINES: {breadth.declines} ({declinePct.toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Top Sectors Heatmap */}
        <div className="lg:col-span-2 glass-panel border border-[#171b29] p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Sector Map Highlights
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">
              Sorted by daily change
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* We will fetch and render some sectors directly from stock metrics */}
            {['NIFTY_BANK', 'NIFTY_IT', 'NIFTY_AUTO', 'NIFTY_METAL', 'NIFTY_PHARMA', 'NIFTY_FMCG'].map((name) => {
              // Standard names mapped to display
              const disp = name.replace('NIFTY_', 'Nifty ');
              // Compute mock values if sectorsList is not ready
              const listSec = useMarketStore.getState().sectorsList.find(s => s.name === name);
              const ret = listSec ? listSec.dailyReturn : 0.0;
              const rank = listSec ? listSec.rank : '-';

              return (
                <div
                  key={name}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] ${
                    ret > 0.3
                      ? 'bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400'
                      : ret < -0.3
                      ? 'bg-rose-950/20 border-rose-500/20 hover:border-rose-500/40 text-rose-400'
                      : 'bg-[#0f111c] border-[#1e2439] hover:border-white/10 text-muted-foreground'
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-xs font-bold text-white truncate block">
                      {disp}
                    </span>
                    <span className="text-[9px] bg-white/5 border border-white/10 px-1 rounded text-muted-foreground font-mono">
                      #{rank}
                    </span>
                  </div>

                  <div className="mt-4 flex justify-between items-baseline">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                      Return
                    </span>
                    <span className="text-sm font-extrabold font-mono">
                      {ret > 0 ? '+' : ''}
                      {ret.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MARKET MOVERS PANEL LISTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* TOP GAINERS */}
        <div className="glass-panel border border-[#171b29] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#171b29]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-bullish" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Top Gainers
              </h4>
            </div>
            <span className="text-[10px] text-bullish font-bold">1D</span>
          </div>

          <div className="space-y-2.5">
            {gainers.map((item) => (
              <div key={item.symbol} className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-white block">{item.symbol.split(':')[1]}</span>
                  <span className="text-[10px] text-muted-foreground block truncate max-w-[100px]">
                    {item.companyName}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <p className="font-semibold text-white">{item.close.toFixed(2)}</p>
                  <p className="text-[10px] text-bullish font-bold">+{item.changePercent}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOP LOSERS */}
        <div className="glass-panel border border-[#171b29] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#171b29]">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-bearish" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Top Losers
              </h4>
            </div>
            <span className="text-[10px] text-bearish font-bold">1D</span>
          </div>

          <div className="space-y-2.5">
            {losers.map((item) => (
              <div key={item.symbol} className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-white block">{item.symbol.split(':')[1]}</span>
                  <span className="text-[10px] text-muted-foreground block truncate max-w-[100px]">
                    {item.companyName}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <p className="font-semibold text-white">{item.close.toFixed(2)}</p>
                  <p className="text-[10px] text-bearish font-bold">{item.changePercent}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VOLUME LEADERS */}
        <div className="glass-panel border border-[#171b29] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#171b29]">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Volume Leaders
              </h4>
            </div>
            <span className="text-[10px] text-muted-foreground uppercase">Ratio</span>
          </div>

          <div className="space-y-2.5">
            {mostActive.map((item) => (
              <div key={item.symbol} className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-white block">{item.symbol.split(':')[1]}</span>
                  <span className="text-[10px] text-muted-foreground block truncate max-w-[100px]">
                    {item.companyName}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <p className="font-semibold text-white">{item.close.toFixed(2)}</p>
                  <p className="text-[10px] text-amber-500 font-bold">{item.volumeRatio}x Vol</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HIGH OPPORTUNITY SCORERS */}
        <div className="glass-panel border border-[#171b29] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#171b29]">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Highest Opportunity
              </h4>
            </div>
            <span className="text-[10px] text-primary font-bold">Score</span>
          </div>

          <div className="space-y-2.5">
            {volumeLeaders.map((item) => (
              <div key={item.symbol} className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-white block">{item.symbol.split(':')[1]}</span>
                  <span className="text-[10px] text-muted-foreground block truncate max-w-[100px]">
                    {item.companyName}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold text-white">Score: {item.scores.opportunityScore}</p>
                  <span
                    className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      item.scores.direction === 'BULLISH'
                        ? 'bg-bullish/10 text-bullish'
                        : 'bg-bearish/10 text-bearish'
                    }`}
                  >
                    {item.scores.direction}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
