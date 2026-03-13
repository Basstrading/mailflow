"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  stats: {
    sent: number;
    uniqueOpens: number;
    uniqueClicks: number;
    bounced: number;
    complained: number;
    unsubscribed: number;
  };
}

const COLORS = ["#3b82f6", "#22c55e", "#a855f7", "#ef4444", "#f97316", "#6b7280"];

export function CampaignChart({ stats }: Props) {
  const data = [
    { name: "Envoyés (non ouverts)", value: Math.max(0, stats.sent - stats.uniqueOpens - stats.bounced) },
    { name: "Ouverts", value: stats.uniqueOpens },
    { name: "Cliqués", value: stats.uniqueClicks },
    { name: "Rebonds", value: stats.bounced },
    { name: "Plaintes", value: stats.complained },
    { name: "Désabonnés", value: stats.unsubscribed },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
