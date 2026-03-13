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
    select: {
      status: true,
      totalSent: true,
      contactList: {
        select: {
          _count: {
            select: {
              contacts: {
                where: { status: "SUBSCRIBED" },
              },
            },
          },
        },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
  }

  const total = campaign.contactList._count.contacts;
  const sent = campaign.totalSent;
  const progress = total > 0 ? Math.round((sent / total) * 100) : 0;

  return NextResponse.json({
    status: campaign.status,
    sent,
    total,
    progress,
  });
}
