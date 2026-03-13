import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, unauthorized } from "@/lib/api-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const { id } = await params;

  const campaign = await prisma.campaign.findFirst({
    where: { id, entity: { userId } },
    include: { entity: true, contactList: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [sent, opened, clicked, bounced, complained, unsubscribed] = await Promise.all([
    prisma.emailEvent.count({ where: { campaignId: id, type: "SENT" } }),
    prisma.emailEvent.count({ where: { campaignId: id, type: "OPENED" } }),
    prisma.emailEvent.count({ where: { campaignId: id, type: "CLICKED" } }),
    prisma.emailEvent.count({ where: { campaignId: id, type: "BOUNCED" } }),
    prisma.emailEvent.count({ where: { campaignId: id, type: "COMPLAINED" } }),
    prisma.emailEvent.count({ where: { campaignId: id, type: "UNSUBSCRIBED" } }),
  ]);

  // Unique opens / clicks
  const uniqueOpens = await prisma.emailEvent.groupBy({
    by: ["contactId"],
    where: { campaignId: id, type: "OPENED" },
  });

  const uniqueClicks = await prisma.emailEvent.groupBy({
    by: ["contactId"],
    where: { campaignId: id, type: "CLICKED" },
  });

  // Recent events
  const recentEvents = await prisma.emailEvent.findMany({
    where: { campaignId: id },
    orderBy: { timestamp: "desc" },
    take: 50,
    include: { contact: { select: { email: true, firstName: true, lastName: true } } },
  });

  return NextResponse.json({
    campaign,
    stats: {
      sent,
      opened,
      clicked,
      bounced,
      complained,
      unsubscribed,
      uniqueOpens: uniqueOpens.length,
      uniqueClicks: uniqueClicks.length,
    },
    recentEvents,
  });
}
