import { prisma } from "@/lib/prisma";
import { processSendJob, isJobActive } from "@/lib/queue";

export async function processScheduledCampaigns() {
  const now = new Date();

  const campaigns = await prisma.campaign.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: now },
    },
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

  for (const campaign of campaigns) {
    if (isJobActive(campaign.id)) continue;

    const contacts = campaign.contactList.contacts;
    if (contacts.length === 0) continue;

    // Mark as sending
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "SENDING", totalSent: 0 },
    });

    // Start sending in background
    processSendJob({
      campaignId: campaign.id,
      entityId: campaign.entity.id,
      contacts,
      subject: campaign.subject,
      htmlContent: campaign.htmlContent,
      textContent: campaign.textContent,
      fromEmail: campaign.entity.fromEmail,
      fromName: campaign.entity.fromName,
      replyTo: campaign.entity.replyTo,
    });
  }

  return campaigns.length;
}
