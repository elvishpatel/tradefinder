import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Radar,
  LogOut,
  Workflow,
  KeyRound,
  Unlink,
  Menu,
  X,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useSocket from '../hooks/useSocket';

export const DashboardLayout: React.FC = () => {
  const { user, fyersConnected, logout, disconnectFyers } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Establish and maintain live WebSocket feeds
  useSocket();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDisconnectFyers = async () => {
    await disconnectFyers();
    navigate('/connect-fyers');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/sectors', label: 'Sector Analysis', icon: Layers },
    { to: '/scanner', label: 'Scanner Engine', icon: Radar },
  ];

  // Helper for Sidebar content rendering
  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col justify-between h-full bg-[#0c0e17]">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-[#1a1f2e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-glow">
              <Workflow className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-wide text-white">
                Trade<span className="text-primary">Finder</span>
              </h1>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                Market Intelligence
              </span>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded-lg border border-[#1a1f2e] hover:bg-[#1a2035] text-muted-foreground hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => isMobile && setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-glow'
                      : 'text-muted-foreground hover:text-foreground hover:bg-[#151926] border border-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* BOTTOM METRICS & SESSION WIDGET */}
      <div className="p-4 border-t border-[#1a1f2e] space-y-4 bg-[#090b12]">
        {/* Fyers Session Health */}
        <div className="p-3 rounded-xl border border-[#1e2538] bg-[#0e111a] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
              Broker Feed
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  fyersConnected
                    ? 'bg-bullish animate-pulse'
                    : 'bg-bearish'
                }`}
              />
              <span
                className={`text-[11px] font-semibold ${
                  fyersConnected ? 'text-bullish' : 'text-bearish'
                }`}
              >
                {fyersConnected ? 'LIVE' : 'DISCONNECTED'}
              </span>
            </div>
          </div>

          {fyersConnected ? (
            <button
              onClick={() => {
                handleDisconnectFyers();
                if (isMobile) setMobileMenuOpen(false);
              }}
              className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-xs font-medium transition-all"
            >
              <Unlink className="w-3 h-3" />
              Unlink Fyers
            </button>
          ) : (
            <Link
              to="/connect-fyers"
              onClick={() => isMobile && setMobileMenuOpen(false)}
              className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-medium transition-all shadow-glow"
            >
              <KeyRound className="w-3 h-3" />
              Connect Fyers
            </Link>
          )}
        </div>

        {/* User Account / Profile */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#1a2035] border border-[#2d3748] flex items-center justify-center text-sm font-bold text-primary-foreground">
              {user?.email[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">
                {user?.email}
              </p>
              <span className="text-[10px] text-muted-foreground truncate block">
                Subscribed Plan
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              handleLogout();
              if (isMobile) setMobileMenuOpen(false);
            }}
            title="Logout"
            className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-[#1a2035] transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#07080d] text-[#e2e8f0] overflow-hidden relative">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#1a1f2e] bg-[#0c0e17] h-full shrink-0">
        {renderSidebarContent(false)}
      </aside>

      {/* MOBILE SIDEBAR DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* MOBILE SIDEBAR DRAWER CABINET */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-[#0c0e17] border-r border-[#1a1f2e] z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderSidebarContent(true)}
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#07080d] h-full">
        {/* MOBILE HEADER BAR */}
        <header className="flex md:hidden items-center justify-between px-6 py-4 border-b border-[#1a1f2e] bg-[#0c0e17] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-glow">
              <Workflow className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-base leading-tight tracking-wide text-white">
              Trade<span className="text-primary">Finder</span>
            </h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg border border-[#1a1f2e] text-muted-foreground hover:text-white bg-[#07080d]"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* PAGE OUTLET */}
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
