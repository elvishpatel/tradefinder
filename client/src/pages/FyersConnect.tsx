import React, { useState } from 'react';
import { Workflow, ShieldAlert, KeyRound, Loader2, LogOut, CheckCircle2, Zap, Link2, ExternalLink, ArrowRight } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const getDefaultRedirectUri = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000/api/v1/auth/fyers/callback';
    }
  }
  return 'https://tradefinder-zvp0.onrender.com/api/v1/auth/fyers/callback';
};

export const FyersConnect: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DIRECT' | 'OAUTH'>('DIRECT');
  const [clientIdInput, setClientIdInput] = useState('');
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [redirectUriInput, setRedirectUriInput] = useState(getDefaultRedirectUri());
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { saveDirectFyersToken, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleDirectTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput || tokenInput.trim().length < 5) {
      setError('Please paste your Fyers Access Token, Auth Code, or Redirect URL');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await saveDirectFyersToken(tokenInput.trim(), clientIdInput.trim(), secretKeyInput.trim());
      setSuccessMsg('Fyers Live Market Feed connected successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Token validation failed. Please verify your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFyersLogin = () => {
    const appId = clientIdInput.trim();
    if (!appId) {
      setError('Please enter your Fyers App ID (e.g. XY12345-100) first to generate the login link.');
      return;
    }
    setError(null);

    const chosenRedirect = redirectUriInput.trim() || getDefaultRedirectUri();
    const encodedRedirect = encodeURIComponent(chosenRedirect);
    const authUrl = `https://api-t1.fyers.in/api/v3/generate-authcode?client_id=${appId}&redirect_uri=${encodedRedirect}&response_type=code`;
    window.open(authUrl, '_blank');
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
      const msg = err.response?.data?.error?.message || 'Failed to initiate Fyers OAuth. Use the step-by-step token setup below.';
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
            Connect Fyers Broker Feed
          </h1>
          <p className="text-muted-foreground text-sm mt-1 text-center max-w-sm">
            Stream live Indian stock market quotes, sector rotation, and scanner signals.
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
              Easy Step-by-Step Connection
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
              Server OAuth Redirect
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
              <form onSubmit={handleDirectTokenSubmit} className="space-y-5">
                {/* STEP 1: App ID & Secret Key */}
                <div className="space-y-3 p-4 rounded-xl bg-[#090c17] border border-[#161d33]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[11px]">1</span>
                      Your Fyers App Credentials
                    </span>
                    <a
                      href="https://api.fyers.in"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-[10px] lowercase"
                    >
                      open api.fyers.in <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                        Fyers App ID *
                      </label>
                      <input
                        type="text"
                        value={clientIdInput}
                        onChange={(e) => setClientIdInput(e.target.value)}
                        placeholder="e.g. XY12345-100"
                        className="w-full px-3.5 py-2 rounded-lg bg-[#05070e] border border-[#1e263d] text-white text-xs font-mono placeholder-muted-foreground focus:outline-none focus:border-primary transition-all"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                        Fyers Secret Key *
                      </label>
                      <input
                        type="password"
                        value={secretKeyInput}
                        onChange={(e) => setSecretKeyInput(e.target.value)}
                        placeholder="e.g. A1B2C3D4"
                        className="w-full px-3.5 py-2 rounded-lg bg-[#05070e] border border-[#1e263d] text-white text-xs font-mono placeholder-muted-foreground focus:outline-none focus:border-primary transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase flex justify-between">
                      <span>Redirect URI in Fyers App Settings</span>
                      <span className="text-[10px] text-amber-400 font-normal">must match Fyers app settings</span>
                    </label>
                    <input
                      type="text"
                      value={redirectUriInput}
                      onChange={(e) => setRedirectUriInput(e.target.value)}
                      placeholder="e.g. https://tradefinder-zvp0.onrender.com/api/v1/auth/fyers/callback"
                      className="w-full px-3.5 py-2 rounded-lg bg-[#05070e] border border-[#1e263d] text-white text-xs font-mono placeholder-muted-foreground focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* STEP 2: Generate Auth Code Helper */}
                <div className="p-4 rounded-xl bg-[#090c17] border border-[#161d33] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[11px]">2</span>
                      Get Code From Fyers
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Click below to open Fyers login. Once logged in, copy the code or full redirect URL from your browser address bar.
                  </p>

                  <button
                    type="button"
                    onClick={handleOpenFyersLogin}
                    className="w-full py-2.5 px-4 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Fyers Login Page in New Tab
                  </button>
                </div>

                {/* STEP 3: Paste Code or Token */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[11px]">3</span>
                    Paste Code, Access Token, or Redirect URL *
                  </label>
                  <textarea
                    rows={3}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Paste the code, access token, or full redirect URL copied from Fyers here..."
                    className="w-full p-3 rounded-xl bg-[#0c0f1b] border border-[#1e263d] text-white text-xs font-mono placeholder-muted-foreground focus:outline-none focus:border-primary transition-all resize-none"
                    required
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/95 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-glow disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Validating & Connecting Feed...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Connect Live Market Feed
                        <ArrowRight className="w-4 h-4" />
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
                  If your server administrator has configured <code className="text-primary font-mono text-xs">FYERS_CLIENT_ID</code> and <code className="text-primary font-mono text-xs">FYERS_SECRET_KEY</code> in Render environment variables, click below to authenticate via standard OAuth.
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-bullish shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Official OAuth 2.0 Flow
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Redirects directly to fyers.in login and exchanges code on the server automatically.
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
                        Authorize via Server OAuth
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
