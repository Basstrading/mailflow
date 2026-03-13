import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCharts } from "./stats-charts";

async function getStats() {
  const [
    totalEntities,
    totalContacts,
    totalCampaigns,
    totalSent,
    totalOpened,
    totalClicked,
    totalBounced,
    recentCampaigns,
  ] = await Promise.all([
    prisma.entity.count(),
    prisma.contact.count({ where: { status: "SUBSCRIBED" } }),
    prisma.campaign.count(),
    prisma.emailEvent.count({ where: { type: "SENT" } }),
    prisma.emailEvent.count({ where: { type: "OPENED" } }),
    prisma.emailEvent.count({ where: { type: "CLICKED" } }),
    prisma.emailEvent.count({ where: { type: "BOUNCED" } }),
    prisma.campaign.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        entity: true,
        contactList: true,
        _count: { select: { emailEvents: true } },
      },
    }),
  ]);

  return {
    totalEntities,
    totalContacts,
    totalCampaigns,
    totalSent,
    totalOpened,
    totalClicked,
    totalBounced,
    recentCampaigns,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const openRate = stats.totalSent > 0 ? ((stats.totalOpened / stats.totalSent) * 100).toFixed(1) : "0";
  const clickRate = stats.totalSent > 0 ? ((stats.totalClicked / stats.totalSent) * 100).toFixed(1) : "0";
  const bounceRate = stats.totalSent > 0 ? ((stats.totalBounced / stats.totalSent) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Entités" value={stats.totalEntities} />
        <StatCard title="Contacts actifs" value={stats.totalContacts} />
        <StatCard title="Campagnes" value={stats.totalCampaigns} />
        <StatCard title="Emails envoyés" value={stats.totalSent} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Taux d'ouverture" value={`${openRate}%`} />
        <StatCard title="Taux de clics" value={`${clickRate}%`} />
        <StatCard title="Taux de rebond" value={`${bounceRate}%`} />
      </div>

      <StatsCharts
        sent={stats.totalSent}
        opened={stats.totalOpened}
        clicked={stats.totalClicked}
        bounced={stats.totalBounced}
      />

      <div>
        <h2 className="mb-4 text-xl font-semibold">Campagnes récentes</h2>
        <div className="rounded-lg border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="p-4">Nom</th>
                <th className="p-4">Entité</th>
                <th className="p-4">Liste</th>
                <th className="p-4">Statut</th>
                <th className="p-4">Envoyés</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentCampaigns.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="p-4 font-medium">{c.name}</td>
                  <td className="p-4 text-muted-foreground">{c.entity.name}</td>
                  <td className="p-4 text-muted-foreground">{c.contactList.name}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      c.status === "SENT" ? "bg-green-100 text-green-700" :
                      c.status === "SENDING" ? "bg-blue-100 text-blue-700" :
                      c.status === "DRAFT" ? "bg-gray-100 text-gray-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4">{c.totalSent}</td>
                </tr>
              ))}
              {stats.recentCampaigns.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Aucune campagne pour le moment
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
