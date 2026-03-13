import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processSendJob, isJobActive } from "@/lib/queue";
import { applyRateLimit } from "@/lib/rate-limit";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = applyRateLimit(_req, "send");
  if (limited) return limited;

  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      entity: true,
      contactList: {
        include: {
          contacts: {
            where: { status: "SUBSCRIBED" },
            select: { id: true, email: true },
          },
        },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
  }

  if (campaign.status !== "DRAFT" && campaign.status !== "PAUSED") {
    return NextResponse.json(
      { error: "La campagne ne peut pas être envoyée dans son état actuel" },
      { status: 400 }
    );
  }

  if (isJobActive(campaign.id)) {
    return NextResponse.json(
      { error: "L'envoi est déjà en cours" },
      { status: 409 }
    );
  }

  const contacts = campaign.contactList.contacts;

  if (contacts.length === 0) {
    return NextResponse.json(
      { error: "Aucun contact abonné dans la liste" },
      { status: 400 }
    );
  }

  // Mark as sending
  await prisma.campaign.update({
    where: { id },
    data: { status: "SENDING", totalSent: 0 },
  });

  // Start sending in background (don't await)
  processSendJob({
    campaignId: campaign.id,
    contacts,
    subject: campaign.subject,
    htmlContent: campaign.htmlContent,
    textContent: campaign.textContent,
    fromEmail: campaign.entity.fromEmail,
    fromName: campaign.entity.fromName,
    replyTo: campaign.entity.replyTo,
  });

  return NextResponse.json({
    message: "Envoi démarré",
    total: contacts.length,
  });
}
