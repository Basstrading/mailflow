import { prisma } from "@/lib/prisma";
import { sendCampaignEmail } from "@/lib/email";
import { getRemainingQuotaToday } from "@/lib/warmup";

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000; // 1s between batches to respect SES rate limits

interface SendJob {
  campaignId: string;
  entityId: string;
  contacts: {
    id: string;
    email: string;
  }[];
  subject: string;
  htmlContent: string;
  textContent: string | null;
  fromEmail: string;
  fromName: string;
  replyTo: string | null;
}

// Track active jobs to prevent duplicate sends
const activeJobs = new Set<string>();

export function isJobActive(campaignId: string): boolean {
  return activeJobs.has(campaignId);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getWarmupQuota(entityId: string): Promise<number> {
  const warmupConfig = await prisma.warmupConfig.findUnique({
    where: { entityId },
  });

  if (!warmupConfig || !warmupConfig.enabled) return Infinity;

  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

  const sentToday = await prisma.emailEvent.count({
    where: {
      campaign: { entityId },
      type: "SENT",
      timestamp: { gte: dayStart },
    },
  });

  return getRemainingQuotaToday(warmupConfig, sentToday, now);
}

export async function processSendJob(job: SendJob) {
  if (activeJobs.has(job.campaignId)) {
    throw new Error("Campaign is already being sent");
  }

  activeJobs.add(job.campaignId);

  let sentCount = 0;
  let failedCount = 0;

  try {
    // Check warmup quota
    const remainingQuota = await getWarmupQuota(job.entityId);

    if (remainingQuota <= 0) {
      await prisma.campaign.update({
        where: { id: job.campaignId },
        data: { status: "PAUSED", totalSent: 0 },
      });
      console.log(`Campaign ${job.campaignId} paused: daily warmup limit reached`);
      return;
    }

    // Limit contacts to warmup quota
    const contactsToProcess = remainingQuota === Infinity
      ? job.contacts
      : job.contacts.slice(0, remainingQuota);

    const skippedCount = job.contacts.length - contactsToProcess.length;
    if (skippedCount > 0) {
      console.log(`Campaign ${job.campaignId}: ${skippedCount} contacts skipped (warmup limit)`);
    }

    // Process contacts in batches
    for (let i = 0; i < contactsToProcess.length; i += BATCH_SIZE) {
      // Check if campaign was paused
      const campaign = await prisma.campaign.findUnique({
        where: { id: job.campaignId },
        select: { status: true },
      });

      if (campaign?.status === "PAUSED") {
        await prisma.campaign.update({
          where: { id: job.campaignId },
          data: { totalSent: sentCount },
        });
        return;
      }

      const batch = contactsToProcess.slice(i, i + BATCH_SIZE);

      // Send batch concurrently
      const results = await Promise.allSettled(
        batch.map((contact) =>
          sendCampaignEmail(
            job.campaignId,
            contact.id,
            contact.email,
            job.subject,
            job.htmlContent,
            job.textContent,
            job.fromEmail,
            job.fromName,
            job.replyTo
          )
        )
      );

      // Count results
      for (const result of results) {
        if (result.status === "fulfilled") {
          sentCount++;
        } else {
          failedCount++;
          console.error("Failed to send email:", result.reason);
        }
      }

      // Update progress in DB
      await prisma.campaign.update({
        where: { id: job.campaignId },
        data: { totalSent: sentCount },
      });

      // Delay between batches to respect rate limits
      if (i + BATCH_SIZE < contactsToProcess.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    // Update warmup totalSent
    if (sentCount > 0) {
      await prisma.warmupConfig.updateMany({
        where: { entityId: job.entityId, enabled: true },
        data: { totalSent: { increment: sentCount } },
      });
    }

    // Mark campaign status
    if (skippedCount > 0) {
      // Not all contacts sent - pause for next day
      await prisma.campaign.update({
        where: { id: job.campaignId },
        data: { status: "PAUSED", totalSent: sentCount },
      });
    } else {
      await prisma.campaign.update({
        where: { id: job.campaignId },
        data: { status: "SENT", sentAt: new Date(), totalSent: sentCount },
      });
    }
  } catch (error) {
    console.error(`Campaign ${job.campaignId} failed:`, error);

    await prisma.campaign.update({
      where: { id: job.campaignId },
      data: { status: "PAUSED", totalSent: sentCount },
    });
  } finally {
    activeJobs.delete(job.campaignId);
  }
}
