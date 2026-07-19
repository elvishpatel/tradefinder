import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import FyersConnect from './pages/FyersConnect';
import Dashboard from './pages/Dashboard';
import SectorAnalysis from './pages/SectorAnalysis';
import Scanner from './pages/Scanner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<Login />} />

          {/* Fyers OAuth connection page (Authenticated but Fyers not required yet) */}
          <Route
            path="/connect-fyers"
            element={
              <ProtectedRoute requireFyers={false}>
                <FyersConnect />
              </ProtectedRoute>
            }
          />

          {/* Secure Application Layout Routes (Authenticated AND Fyers connected) */}
          <Route
            element={
              <ProtectedRoute requireFyers={true}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sectors" element={<SectorAnalysis />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;

