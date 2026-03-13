"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsChartsProps {
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
}

export function StatsCharts({ sent, opened, clicked, bounced }: StatsChartsProps) {
  const data = [
    { name: "Envoyés", value: sent },
    { name: "Ouverts", value: opened },
    { name: "Cliqués", value: clicked },
    { name: "Rebonds", value: bounced },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vue d&apos;ensemble</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
