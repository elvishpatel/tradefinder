import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bell, Plus, Trash2 } from 'lucide-react';

export default function AlertsPage() {
  const activeAlerts = [
    { id: 1, symbol: 'RELIANCE', condition: 'Crosses Above', value: '3000', status: 'Active' },
    { id: 2, symbol: 'NIFTY IT', condition: 'Sector Score >', value: '80', status: 'Triggered' },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
            <p className="text-muted-foreground">Manage price, indicator, and scanner alerts.</p>
          </div>
          <Button><Plus className="mr-2 h-4 w-4" /> Create Alert</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Create Quick Alert</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Symbol</label>
                <Input placeholder="e.g. RELIANCE" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Condition</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option>Price Crosses Above</option>
                  <option>Price Crosses Below</option>
                  <option>Volume Breakout</option>
                  <option>RSI > 70</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Value</label>
                <Input type="number" placeholder="Enter value" />
              </div>
              <Button className="w-full">Save Alert</Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${alert.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-green-500/10 text-green-500'}`}>
                        <Bell className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{alert.symbol}</h4>
                        <p className="text-sm text-muted-foreground">{alert.condition} {alert.value}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={alert.status === 'Active' ? 'default' : 'secondary'}>{alert.status}</Badge>
                      <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
