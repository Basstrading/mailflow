import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
  }

  if (campaign.status !== "SENDING") {
    return NextResponse.json(
      { error: "Seule une campagne en cours d'envoi peut être mise en pause" },
      { status: 400 }
    );
  }

  await prisma.campaign.update({
    where: { id },
    data: { status: "PAUSED" },
  });

  return NextResponse.json({ message: "Campagne mise en pause" });
}
