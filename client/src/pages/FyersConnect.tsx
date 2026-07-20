import React, { useState } from 'react';
import { Workflow, ShieldAlert, KeyRound, Loader2, LogOut, CheckCircle2, Zap, ExternalLink, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export const FyersConnect: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [clientIdInput, setClientIdInput] = useState('');
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { saveDirectFyersToken, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleOpenFyersLogin = async () => {
    setError(null);
    try {
      const response = await api.get('/auth/fyers/url');
      if (response.data?.url) {
        window.open(response.data.url, '_blank');
      } else {
        throw new Error('Fyers OAuth URL was not returned');
      }
    } catch (err: any) {
      // If server env is missing, open sample redirect URI directly
      const sampleUrl = 'https://api-t1.fyers.in/api/v3/generate-authcode?client_id=SAMPLE_APP_ID&redirect_uri=https://tradefinder-zvp0.onrender.com/api/v1/auth/fyers/callback&response_type=code';
      window.open(sampleUrl, '_blank');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput || tokenInput.trim().length < 5) {
      setError('Please paste your Fyers Auth Code or Access Token');
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
      const msg = err.response?.data?.error?.message || err.message || 'Token validation failed. Please check your code.';
      setError(msg);
    } finally {
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

      <div className="w-full max-w-lg relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-glow mb-3">
            <Workflow className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Connect Fyers Market Feed
          </h1>
          <p className="text-muted-foreground text-sm mt-1 text-center max-w-sm">
            Stream live Indian stock market quotes, sector rotation, and scanner signals.
          </p>
        </div>

        {/* Card Frame */}
        <div className="glass-panel rounded-2xl border border-[#1a2033] shadow-glow overflow-hidden p-8">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* STEP 1 BUTTON */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider block">
                Step 1: Get Your Code
              </label>
              <button
                type="button"
                onClick={handleOpenFyersLogin}
                className="w-full py-3 px-4 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-glow"
              >
                <KeyRound className="w-4 h-4" />
                Click Here to Log In to Fyers
                <ExternalLink className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-muted-foreground text-center">
                Opens Fyers login in a new tab. After logging in, copy your code.
              </p>
            </div>

            {/* STEP 2 INPUT */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider block">
                Step 2: Paste Code Here
              </label>
              <textarea
                rows={3}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste the code or full redirect URL copied from Fyers here..."
                className="w-full p-3.5 rounded-xl bg-[#0c0f1b] border border-[#1e263d] text-white text-xs font-mono placeholder-muted-foreground focus:outline-none focus:border-primary transition-all resize-none"
                required
              />
            </div>

            {/* Optional Advanced Settings Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[11px] font-semibold text-muted-foreground hover:text-white flex items-center gap-1 py-1 focus:outline-none transition-colors"
              >
                {showAdvanced ? <ChevronUp className="w-3.5 h-3.5 text-primary" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>{showAdvanced ? 'Hide Custom App Credentials' : 'Custom Fyers App ID / Secret Key (Optional)'}</span>
              </button>

              {showAdvanced && (
                <div className="mt-3 p-4 rounded-xl bg-[#0a0d18] border border-[#1b2238] grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                      App ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={clientIdInput}
                      onChange={(e) => setClientIdInput(e.target.value)}
                      placeholder="e.g. XY12345-100"
                      className="w-full px-3 py-2 rounded-lg bg-[#05070e] border border-[#1e263d] text-white text-xs font-mono placeholder-muted-foreground focus:outline-none focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                      Secret Key (Optional)
                    </label>
                    <input
                      type="password"
                      value={secretKeyInput}
                      onChange={(e) => setSecretKeyInput(e.target.value)}
                      placeholder="e.g. A1B2C3D4"
                      className="w-full px-3 py-2 rounded-lg bg-[#05070e] border border-[#1e263d] text-white text-xs font-mono placeholder-muted-foreground focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SUBMIT BUTTONS */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-glow disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting Feed...
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
                className="py-3.5 px-5 rounded-xl border border-[#20273d] bg-transparent hover:bg-[#111421] text-muted-foreground hover:text-white font-medium text-sm flex items-center justify-center gap-2 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </form>

          {/* Secure disclaimer bar */}
          <div className="mt-8 pt-4 border-t border-[#161a29] flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-primary shrink-0" />
            <span className="text-[11px] text-muted-foreground">
              Connections expire daily at midnight IST in accordance with exchange guidelines.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FyersConnect;
