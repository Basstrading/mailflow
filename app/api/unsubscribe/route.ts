import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: "Token requis" }, { status: 400 });
  }

  const unsubToken = await prisma.unsubscribeToken.findUnique({
    where: { token },
    include: { contact: true },
  });

  if (!unsubToken) {
    return NextResponse.json({ error: "Token invalide" }, { status: 404 });
  }

  await prisma.contact.update({
    where: { id: unsubToken.contactId },
    data: { status: "UNSUBSCRIBED" },
  });

  // Record unsubscribe event for the most recent campaign
  const lastSent = await prisma.emailEvent.findFirst({
    where: { contactId: unsubToken.contactId, type: "SENT" },
    orderBy: { timestamp: "desc" },
  });

  if (lastSent) {
    await prisma.emailEvent.create({
      data: {
        campaignId: lastSent.campaignId,
        contactId: unsubToken.contactId,
        type: "UNSUBSCRIBED",
      },
    });
  }

  return NextResponse.json({ success: true });
}
