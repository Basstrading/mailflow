import { prisma } from "@/lib/prisma";
import { sendCampaignEmail } from "@/lib/email";

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000; // 1s between batches to respect SES rate limits

interface SendJob {
  campaignId: string;
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

export async function processSendJob(job: SendJob) {
  if (activeJobs.has(job.campaignId)) {
    throw new Error("Campaign is already being sent");
  }

  activeJobs.add(job.campaignId);

  const { contacts } = job;
  let sentCount = 0;
  let failedCount = 0;

  try {
    // Process contacts in batches
    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
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

      const batch = contacts.slice(i, i + BATCH_SIZE);

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
      if (i + BATCH_SIZE < contacts.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    // Mark as sent
    await prisma.campaign.update({
      where: { id: job.campaignId },
      data: {
        status: "SENT",
        sentAt: new Date(),
        totalSent: sentCount,
      },
    });
  } catch (error) {
    console.error(`Campaign ${job.campaignId} failed:`, error);

    // Mark as paused on unexpected error so it can be retried
    await prisma.campaign.update({
      where: { id: job.campaignId },
      data: {
        status: "PAUSED",
        totalSent: sentCount,
      },
    });
  } finally {
    activeJobs.delete(job.campaignId);
  }
}
