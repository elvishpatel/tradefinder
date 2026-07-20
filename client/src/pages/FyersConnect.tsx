import React, { useState } from 'react';
import { Workflow, ShieldAlert, KeyRound, Loader2, LogOut, CheckCircle2, Zap, Link2, ExternalLink } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export const FyersConnect: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DIRECT' | 'OAUTH'>('DIRECT');
  const [tokenInput, setTokenInput] = useState('');
  const [clientIdInput, setClientIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { saveDirectFyersToken, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleDirectTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput || tokenInput.trim().length < 10) {
      setError('Please paste a valid Fyers Access Token');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await saveDirectFyersToken(tokenInput.trim(), clientIdInput.trim());
      setSuccessMsg('Fyers Live Market Session validated and connected successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Token validation failed. Please check your token.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFyersOAuthConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/auth/fyers/url');
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('Fyers OAuth redirect URL was not returned by server');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to initiate Fyers OAuth. Please use Direct Access Token input.';
      setError(msg);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#050609] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-25%] right-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[130px]" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#4f46e5]/10 rounded-full blur-[130px]" />

      <div className="w-full max-w-xl relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-glow mb-3">
            <Workflow className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Connect Fyers API Feed
          </h1>
          <p className="text-muted-foreground text-sm mt-1 text-center max-w-sm">
            Required to stream live Indian stock market quotes, sector rotation, and scanner signals.
          </p>
        </div>

        {/* Card Frame */}
        <div className="glass-panel rounded-2xl border border-[#1a2033] shadow-glow overflow-hidden">
          {/* Method Navigation Tabs */}
          <div className="flex border-b border-[#171b29] bg-[#090b13]">
            <button
              onClick={() => { setActiveTab('DIRECT'); setError(null); }}
              className={`flex-1 py-3.5 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === 'DIRECT'
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              Direct Access Token (Instant)
            </button>
            <button
              onClick={() => { setActiveTab('OAUTH'); setError(null); }}
              className={`flex-1 py-3.5 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === 'OAUTH'
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-white'
              }`}
            >
              <Link2 className="w-4 h-4" />
              Fyers OAuth Login Redirect
            </button>
          </div>

          <div className="p-8">
            {error && (
              <div className="p-4 rounded-xl bg-bearish/10 border border-bearish/25 text-bearish text-xs font-semibold mb-6 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-4 rounded-xl bg-bullish/10 border border-bullish/25 text-bullish text-xs font-semibold mb-6 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {activeTab === 'DIRECT' ? (
              <form onSubmit={handleDirectTokenSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white uppercase tracking-wider flex justify-between">
                    <span>Fyers Access Token *</span>
                    <a
                      href="https://api-t1.fyers.in/api/v3/generate-authcode"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-[10px] lowercase"
                    >
                      get token from Fyers <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>
                  <textarea
                    rows={3}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Paste your daily Fyers Access Token here (e.g. eyJhbGciOiJIUzI1NiIsInR5cCI6... or XY12345-100:eyJhbGci...)"
                    className="w-full p-3 rounded-xl bg-[#0c0f1b] border border-[#1e263d] text-white text-xs font-mono placeholder-muted-foreground focus:outline-none focus:border-primary transition-all resize-none"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Fyers daily tokens are valid for 24 hours. Paste your token above to connect live quote feeds.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Fyers App ID / Client ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="e.g. XY12345-100 (Leave blank if already included in token or server config)"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0c0f1b] border border-[#1e263d] text-white text-xs font-mono placeholder-muted-foreground focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/95 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-glow disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Validating Fyers Token...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Validate & Connect Live Feed
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="py-3 px-5 rounded-xl border border-[#20273d] bg-transparent hover:bg-[#111421] text-muted-foreground hover:text-white font-medium text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  If your server administrator has configured <code className="text-primary font-mono text-xs">FYERS_CLIENT_ID</code> and <code className="text-primary font-mono text-xs">FYERS_SECRET_KEY</code> in environment variables, click below to authorize via the official FYERS OAuth portal.
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-bullish shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Official OAuth 2.0 Login
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Redirects directly to fyers.in login and returns authorization code back to TradeFinder.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleFyersOAuthConnect}
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
                        Authorize via Fyers OAuth
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleLogout}
                    className="py-3 px-5 rounded-xl border border-[#20273d] bg-transparent hover:bg-[#111421] text-muted-foreground hover:text-white font-medium text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Secure disclaimer bar */}
          <div className="px-8 py-3.5 bg-[#0a0d16] border-t border-[#161a29] flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-primary" />
            <span className="text-[11px] text-muted-foreground">
              Fyers API sessions expire daily at midnight IST in accordance with exchange guidelines.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FyersConnect;
