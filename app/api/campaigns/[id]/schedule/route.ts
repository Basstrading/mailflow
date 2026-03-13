import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, unauthorized } from "@/lib/api-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const { id } = await params;
  const { scheduledAt } = await req.json();

  if (!scheduledAt) {
    return NextResponse.json({ error: "Date de planification requise" }, { status: 400 });
  }

  const scheduledDate = new Date(scheduledAt);

  if (scheduledDate <= new Date()) {
    return NextResponse.json(
      { error: "La date de planification doit être dans le futur" },
      { status: 400 }
    );
  }

  const campaign = await prisma.campaign.findFirst({
    where: { id, entity: { userId } },
    select: { status: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
  }

  if (campaign.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Seules les campagnes en brouillon peuvent être planifiées" },
      { status: 400 }
    );
  }

  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      status: "SCHEDULED",
      scheduledAt: scheduledDate,
    },
  });

  return NextResponse.json(updated);
}

// Cancel a scheduled campaign
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const { id } = await params;

  const campaign = await prisma.campaign.findFirst({
    where: { id, entity: { userId } },
    select: { status: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
  }

  if (campaign.status !== "SCHEDULED") {
    return NextResponse.json(
      { error: "Seules les campagnes planifiées peuvent être annulées" },
      { status: 400 }
    );
  }

  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      status: "DRAFT",
      scheduledAt: null,
    },
  });

  return NextResponse.json(updated);
}
