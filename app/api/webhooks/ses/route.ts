import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

// ── SNS Types ──

interface SNSMessage {
  Type: string;
  SubscribeURL?: string;
  Message: string;
  MessageId: string;
  TopicArn?: string;
  SignatureVersion?: string;
  Signature?: string;
  SigningCertURL?: string;
}

// ── SES Notification Types ──

interface SESBounce {
  bounceType: "Undetermined" | "Permanent" | "Transient";
  bounceSubType: string;
  bouncedRecipients: {
    emailAddress: string;
    action?: string;
    status?: string;
    diagnosticCode?: string;
  }[];
  timestamp: string;
  feedbackId: string;
}

interface SESComplaint {
  complainedRecipients: {
    emailAddress: string;
  }[];
  complaintSubType?: string;
  complaintFeedbackType?: string;
  timestamp: string;
  feedbackId: string;
}

interface SESDelivery {
  recipients: string[];
  timestamp: string;
  processingTimeMillis: number;
  smtpResponse: string;
}

interface SESNotification {
  notificationType: "Bounce" | "Complaint" | "Delivery";
  bounce?: SESBounce;
  complaint?: SESComplaint;
  delivery?: SESDelivery;
  mail: {
    messageId: string;
    source: string;
    timestamp: string;
    commonHeaders?: {
      to: string[];
      subject: string;
    };
  };
}

// ── Helpers ──

async function findContactsAndCampaign(email: string) {
  const contacts = await prisma.contact.findMany({
    where: { email: email.toLowerCase() },
  });

  const results = [];
  for (const contact of contacts) {
    const sentEvent = await prisma.emailEvent.findFirst({
      where: { contactId: contact.id, type: "SENT" },
      orderBy: { timestamp: "desc" },
    });
    results.push({ contact, campaignId: sentEvent?.campaignId });
  }
  return results;
}

async function createEventIfNotExists(
  campaignId: string,
  contactId: string,
  type: "BOUNCED" | "COMPLAINED",
  metadata: Record<string, string | boolean | null>
) {
  // Idempotency: check if we already have this event type for this contact+campaign
  const existing = await prisma.emailEvent.findFirst({
    where: { campaignId, contactId, type },
  });
  if (existing) return existing;

  return prisma.emailEvent.create({
    data: { campaignId, contactId, type, metadata },
  });
}

// ── Handlers ──

async function handleBounce(bounce: SESBounce, messageId: string) {
  const isPermanent = bounce.bounceType === "Permanent";

  for (const recipient of bounce.bouncedRecipients) {
    const matches = await findContactsAndCampaign(recipient.emailAddress);

    for (const { contact, campaignId } of matches) {
      // Only mark as BOUNCED for permanent bounces
      // Transient bounces are logged but don't change contact status
      if (isPermanent) {
        await prisma.contact.update({
          where: { id: contact.id },
          data: { status: "BOUNCED" },
        });
      }

      if (campaignId) {
        await createEventIfNotExists(campaignId, contact.id, "BOUNCED", {
          emailAddress: recipient.emailAddress,
          bounceType: bounce.bounceType,
          bounceSubType: bounce.bounceSubType,
          diagnosticCode: recipient.diagnosticCode || null,
          action: recipient.action || null,
          status: recipient.status || null,
          isPermanent,
          feedbackId: bounce.feedbackId,
          sesMessageId: messageId,
          timestamp: bounce.timestamp,
        });
      }
    }
  }

  console.log(
    `[Webhook] Bounce (${bounce.bounceType}): ${bounce.bouncedRecipients.map((r) => r.emailAddress).join(", ")}`
  );
}

async function handleComplaint(complaint: SESComplaint, messageId: string) {
  for (const recipient of complaint.complainedRecipients) {
    const matches = await findContactsAndCampaign(recipient.emailAddress);

    for (const { contact, campaignId } of matches) {
      // Always mark as COMPLAINED - these contacts must never receive emails again
      await prisma.contact.update({
        where: { id: contact.id },
        data: { status: "COMPLAINED" },
      });

      if (campaignId) {
        await createEventIfNotExists(campaignId, contact.id, "COMPLAINED", {
          emailAddress: recipient.emailAddress,
          complaintFeedbackType: complaint.complaintFeedbackType || null,
          complaintSubType: complaint.complaintSubType || null,
          feedbackId: complaint.feedbackId,
          sesMessageId: messageId,
          timestamp: complaint.timestamp,
        });
      }
    }
  }

  console.log(
    `[Webhook] Complaint: ${complaint.complainedRecipients.map((r) => r.emailAddress).join(", ")}`
  );
}

async function handleDelivery(delivery: SESDelivery) {
  console.log(
    `[Webhook] Delivered: ${delivery.recipients.join(", ")} (${delivery.processingTimeMillis}ms)`
  );
}

// ── Main Route ──

export async function POST(req: NextRequest) {
  const limited = applyRateLimit(req, "webhook");
  if (limited) return limited;

  let body: SNSMessage;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Handle SNS subscription confirmation
  if (body.Type === "SubscriptionConfirmation" && body.SubscribeURL) {
    console.log("[Webhook] Confirming SNS subscription");
    await fetch(body.SubscribeURL);
    return NextResponse.json({ status: "subscribed" });
  }

  // Handle SNS unsubscribe confirmation
  if (body.Type === "UnsubscribeConfirmation") {
    console.log("[Webhook] SNS unsubscribe confirmation received");
    return NextResponse.json({ status: "unsubscribed" });
  }

  if (body.Type !== "Notification") {
    return NextResponse.json({ status: "ignored" });
  }

  let notification: SESNotification;

  try {
    notification = JSON.parse(body.Message);
  } catch {
    console.error("[Webhook] Failed to parse SES notification message");
    return NextResponse.json({ error: "Invalid notification message" }, { status: 400 });
  }

  try {
    switch (notification.notificationType) {
      case "Bounce":
        if (notification.bounce) {
          await handleBounce(notification.bounce, notification.mail.messageId);
        }
        break;

      case "Complaint":
        if (notification.complaint) {
          await handleComplaint(notification.complaint, notification.mail.messageId);
        }
        break;

      case "Delivery":
        if (notification.delivery) {
          await handleDelivery(notification.delivery);
        }
        break;

      default:
        console.log(`[Webhook] Unknown notification type: ${notification.notificationType}`);
    }
  } catch (error) {
    console.error("[Webhook] Error processing notification:", error);
    return NextResponse.json({ error: "Processing error" }, { status: 500 });
  }

  return NextResponse.json({ status: "processed" });
}
