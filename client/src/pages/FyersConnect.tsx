import React, { useState } from 'react';
import { Workflow, ShieldAlert, KeyRound, Loader2, LogOut, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export const FyersConnect: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleFyersConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/auth/fyers/url');
      if (response.data?.url) {
        // Redirect the user to FYERS OAuth Login page
        window.location.href = response.data.url;
      } else {
        throw new Error('Fyers redirect URL was not returned by server');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to initiate broker login. Verify backend credentials are set.');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#050609] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-25%] right-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[130px]" />

      <div className="w-full max-w-xl relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-glow mb-3">
            <Workflow className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Link Your Broker
          </h1>
          <p className="text-muted-foreground text-sm mt-1 text-center max-w-sm">
            Connect your FYERS API account to stream live Indian stock market quotes and charts.
          </p>
        </div>

        {/* Card Frame */}
        <div className="glass-panel rounded-2xl border border-[#1a2033] shadow-glow overflow-hidden">
          <div className="p-8">
            <h2 className="text-lg font-semibold text-white mb-4">
              Authorize Market Data Feed
            </h2>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              TradeFinder operates as an independent analysis platform and does not maintain direct trading capabilities. Linking your broker permits our indicators, scanners, and real-time calculation engines to stream current quotes.
            </p>

            {error && (
              <div className="p-3.5 rounded-xl bg-bearish/10 border border-bearish/25 text-bearish text-xs font-semibold mb-6">
                {error}
              </div>
            )}

            {/* Platform Assurances List */}
            <div className="space-y-3.5 mb-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-bullish shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Read-Only Access
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    We only read tickers, indices, volume, and order-book snapshots. We cannot place or edit trades.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-bullish shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Secured Encryption
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your session keys are encrypted symmetrically with AES-256-CBC prior to database storage.
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleFyersConnect}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/95 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-glow disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Redirecting to Fyers...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Link Fyers Account
                  </>
                )}
              </button>

              <button
                onClick={handleLogout}
                className="py-3 px-6 rounded-xl border border-[#20273d] bg-transparent hover:bg-[#111421] text-muted-foreground hover:text-white font-medium text-sm flex items-center justify-center gap-2 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Secure disclaimer bar */}
          <div className="px-8 py-3.5 bg-[#0a0d16] border-t border-[#161a29] flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-primary" />
            <span className="text-[11px] text-muted-foreground">
              Connections expire daily at midnight in accordance with standard FYERS API rules.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FyersConnect;
