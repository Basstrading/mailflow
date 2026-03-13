"use client";

import { useEffect, useState, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CampaignChart } from "./chart";

interface StatsData {
  campaign: {
    name: string;
    subject: string;
    status: string;
    sentAt: string | null;
    entity: { name: string };
    contactList: { name: string };
  };
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
    complained: number;
    unsubscribed: number;
    uniqueOpens: number;
    uniqueClicks: number;
  };
  recentEvents: {
    id: string;
    type: string;
    timestamp: string;
    contact: { email: string; firstName: string | null; lastName: string | null };
  }[];
}

const eventColors: Record<string, string> = {
  SENT: "bg-blue-100 text-blue-700",
  OPENED: "bg-green-100 text-green-700",
  CLICKED: "bg-purple-100 text-purple-700",
  BOUNCED: "bg-red-100 text-red-700",
  COMPLAINED: "bg-orange-100 text-orange-700",
  UNSUBSCRIBED: "bg-gray-100 text-gray-700",
};

export default function CampaignStatsPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = use(params);
  const [data, setData] = useState<StatsData | null>(null);

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}/stats`)
      .then((r) => r.json())
      .then(setData);
  }, [campaignId]);

  if (!data) {
    return <div className="flex h-64 items-center justify-center">Chargement...</div>;
  }

  const { campaign, stats, recentEvents } = data;
  const openRate = stats.sent > 0 ? (stats.uniqueOpens / stats.sent) * 100 : 0;
  const clickRate = stats.sent > 0 ? (stats.uniqueClicks / stats.sent) * 100 : 0;
  const bounceRate = stats.sent > 0 ? (stats.bounced / stats.sent) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{campaign.name}</h1>
        <p className="text-sm text-muted-foreground">
          {campaign.entity.name} → {campaign.contactList.name} | Objet : {campaign.subject}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Envoyés" value={stats.sent} />
        <StatCard title="Ouverts (uniques)" value={stats.uniqueOpens} subtitle={`${openRate.toFixed(1)}%`}>
          <Progress value={openRate} className="mt-2" />
        </StatCard>
        <StatCard title="Cliqués (uniques)" value={stats.uniqueClicks} subtitle={`${clickRate.toFixed(1)}%`}>
          <Progress value={clickRate} className="mt-2" />
        </StatCard>
        <StatCard title="Rebonds" value={stats.bounced} subtitle={`${bounceRate.toFixed(1)}%`}>
          <Progress value={bounceRate} className="mt-2" />
        </StatCard>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total ouvertures" value={stats.opened} />
        <StatCard title="Plaintes" value={stats.complained} />
        <StatCard title="Désabonnements" value={stats.unsubscribed} />
      </div>

      <CampaignChart stats={stats} />

      <div>
        <h2 className="mb-4 text-xl font-semibold">Événements récents</h2>
        <div className="rounded-lg border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="p-3">Contact</th>
                <th className="p-3">Événement</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.map((event) => (
                <tr key={event.id} className="border-b last:border-0">
                  <td className="p-3 text-sm">
                    {event.contact.email}
                    {event.contact.firstName && ` (${event.contact.firstName})`}
                  </td>
                  <td className="p-3">
                    <Badge className={eventColors[event.type]}>{event.type}</Badge>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  children,
}: {
  title: string;
  value: number;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
