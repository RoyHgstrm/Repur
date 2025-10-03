"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { format } from "date-fns";
import { fi } from "date-fns/locale";

interface SalesChartProps {
  dailyData: Array<{ day: string; count: number; revenue: number }>;
}

export function SalesChart({ dailyData }: SalesChartProps) {
  // Format data for Recharts
  const formattedData = dailyData.map(d => ({
    name: format(new Date(d.day), 'dd.MM', { locale: fi }),
    Myynti: d.revenue,
    Ostot: d.count,
  }));

  return (
    <Card className="bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-neutral)]">
      <CardHeader>
        <CardTitle className="text-2xl-fluid font-semibold flex items-center gap-2">
          Päivittäinen myynti (7pv)
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={formattedData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="name" stroke="var(--color-text-tertiary)" />
            <YAxis stroke="var(--color-text-tertiary)" />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-surface-3)', border: '1px solid var(--color-border)' }}
              itemStyle={{ color: 'var(--color-text-primary)' }}
            />
            <Line type="monotone" dataKey="Myynti" stroke="var(--color-primary)" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="Ostot" stroke="var(--color-accent)" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
