import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SectorsPage() {
  const sectors = [
    { name: 'NIFTY IT', trend: 'Strong Uptrend', breadth: 85, score: 92 },
    { name: 'NIFTY AUTO', trend: 'Improving', breadth: 60, score: 75 },
    { name: 'NIFTY BANK', trend: 'Consolidating', breadth: 50, score: 55 },
    { name: 'NIFTY PHARMA', trend: 'Weakening', breadth: 30, score: 35 },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sector Rotation</h1>
          <p className="text-muted-foreground">Analyze which sectors are leading or lagging the broader market.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {sectors.map((sector) => (
            <Card key={sector.name} className="overflow-hidden">
              <div className={`h-2 w-full ${sector.score > 80 ? 'bg-green-500' : sector.score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} />
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{sector.name}</CardTitle>
                <span className="text-sm text-muted-foreground">{sector.trend}</span>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Breadth</span>
                    <span className="font-bold">{sector.breadth}%</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-muted-foreground">Score</span>
                    <span className="font-bold">{sector.score}/100</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sector Breadth Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] flex items-center justify-center border-dashed border-2 rounded-lg bg-muted/10">
              <span className="text-muted-foreground">Matrix Chart Placeholder</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
