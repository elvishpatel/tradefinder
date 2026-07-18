import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ScannersPage() {
  const dummyScans = [
    { symbol: 'RELIANCE', score: 91, reason: 'Volume Breakout + RSI > 60', price: 2950.45, change: '+2.4%' },
    { symbol: 'TCS', score: 85, reason: 'EMA 20 Crosses EMA 50', price: 3910.10, change: '+1.2%' },
    { symbol: 'HDFCBANK', score: 82, reason: 'Support Bounce', price: 1530.00, change: '+0.8%' },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Scanners</h1>
          <p className="text-muted-foreground">Discover opportunities using quant models and technical indicators.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Active Scans</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="default" className="w-full justify-start cursor-pointer">Momentum Breakout</Badge>
              <Badge variant="secondary" className="w-full justify-start cursor-pointer">Golden Cross</Badge>
              <Badge variant="secondary" className="w-full justify-start cursor-pointer">Oversold Bounce</Badge>
              <Badge variant="secondary" className="w-full justify-start cursor-pointer">Volume Spikes</Badge>
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Scan Results: Momentum Breakout</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>LTP</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Trigger Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dummyScans.map((scan) => (
                    <TableRow key={scan.symbol}>
                      <TableCell className="font-medium">{scan.symbol}</TableCell>
                      <TableCell>{scan.price}</TableCell>
                      <TableCell className="text-green-500">{scan.change}</TableCell>
                      <TableCell>
                        <Badge variant="default">{scan.score}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{scan.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
