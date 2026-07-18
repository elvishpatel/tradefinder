'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Activity, Layers, Bell, Settings, PieChart, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Scanners', href: '/scanners', icon: Activity },
  { name: 'Sectors', href: '/sectors', icon: Layers },
  { name: 'Analytics', href: '/analytics', icon: PieChart },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar (Desktop) */}
      <aside className="hidden w-64 border-r bg-card md:block">
        <div className="flex h-16 items-center px-6 border-b">
          <span className="text-xl font-bold tracking-tight text-primary">TradeFinder</span>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href}>
              <span
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm font-medium',
                  pathname === item.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4 md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-bold">TradeFinder</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            {/* Additional header items (Search, Profile) go here */}
            <Button variant="outline" size="sm">Connect Fyers</Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-muted/20">
          {children}
        </div>
      </main>
    </div>
  );
}
