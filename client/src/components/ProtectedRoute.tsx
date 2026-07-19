import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireFyers?: boolean;
}

export const ProtectedRoute = ({
  children,
  requireFyers = true,
}: ProtectedRouteProps) => {

  const { token, user, fyersConnected, loading, checkAuth, checkFyersSession } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    const initAuth = async () => {
      const isAuthed = await checkAuth();
      if (isAuthed && requireFyers) {
        await checkFyersSession();
      }
    };
    initAuth();
  }, [token, requireFyers, checkAuth, checkFyersSession]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4">
        {/* Sleek loading animation */}
        <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-muted-foreground text-sm font-medium tracking-wide animate-pulse">
          Securing session and checking broker logs...
        </p>
      </div>
    );
  }

  // 1. Check JWT login
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check Fyers connectivity if required
  if (requireFyers && !fyersConnected) {
    if (location.pathname !== '/connect-fyers') {
      return <Navigate to="/connect-fyers" replace />;
    }
  }

  // 3. If Fyers is already connected, don't allow accessing /connect-fyers
  if (fyersConnected && location.pathname === '/connect-fyers') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
