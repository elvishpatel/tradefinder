import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { Workflow, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AuthFormData = z.infer<typeof authSchema>;

export const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: AuthFormData) => {
    setServerError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Register User
        await api.post('/auth/register', data);
        // Automatically switch to sign-in and reset
        setIsSignUp(false);
        reset({ email: data.email, password: '' });
        setServerError('Account created successfully! Please sign in.');
      } else {
        // Login User
        const response = await api.post('/auth/login', data);
        login(response.data.token, response.data.user);
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Something went wrong. Please try again.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setServerError(null);
    reset();
  };

  return (
    <div className="min-h-screen bg-[#050609] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#4f46e5]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#d946ef]/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-glow mb-3">
            <Workflow className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Welcome to Trade<span className="text-primary">Finder</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1 text-center max-w-xs">
            A Premium Intraday and Swing Market Intelligence Platform
          </p>
        </div>

        {/* Card Frame */}
        <div className="glass-panel rounded-2xl border border-[#1a2033] shadow-glow p-8">
          <h2 className="text-lg font-semibold text-white mb-6">
            {isSignUp ? 'Create your platform account' : 'Sign in to your account'}
          </h2>

          {serverError && (
            <div
              className={`p-3 rounded-lg text-xs font-medium mb-6 ${
                serverError.includes('successfully')
                  ? 'bg-bullish/10 text-bullish border border-bullish/20'
                  : 'bg-bearish/10 text-bearish border border-bearish/20'
              }`}
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0c0f1b] border ${
                    errors.email ? 'border-bearish' : 'border-[#1e263d]'
                  } text-white placeholder-muted-foreground text-sm focus:outline-none focus:border-primary transition-all`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] font-semibold text-bearish mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0c0f1b] border ${
                    errors.password ? 'border-bearish' : 'border-[#1e263d]'
                  } text-white placeholder-muted-foreground text-sm focus:outline-none focus:border-primary transition-all`}
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-[11px] font-semibold text-bearish mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 rounded-xl bg-primary hover:bg-primary/95 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Please wait...
                </>
              ) : (
                <>
                  {isSignUp ? 'Create Platform Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle link */}
          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors focus:outline-none"
            >
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
