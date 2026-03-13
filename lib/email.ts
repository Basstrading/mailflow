import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/ses";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function injectTrackingPixel(
  html: string,
  campaignId: string,
  contactId: string
): string {
  const pixelUrl = `${APP_URL}/api/track/open?cid=${campaignId}&rid=${contactId}`;
  const pixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`;
  return html.replace("</body>", `${pixel}</body>`);
}

export function rewriteLinks(
  html: string,
  campaignId: string,
  contactId: string
): string {
  return html.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (_match, url) => {
      const trackUrl = `${APP_URL}/api/track/click?cid=${campaignId}&rid=${contactId}&url=${encodeURIComponent(url)}`;
      return `href="${trackUrl}"`;
    }
  );
}

export function injectUnsubscribeLink(
  html: string,
  unsubToken: string
): string {
  const unsubUrl = `${APP_URL}/unsubscribe?token=${unsubToken}`;
  return html.replace(
    /\{\{unsubscribe_url\}\}/g,
    unsubUrl
  );
}

export async function sendCampaignEmail(
  campaignId: string,
  contactId: string,
  email: string,
  subject: string,
  htmlContent: string,
  textContent: string | null,
  fromEmail: string,
  fromName: string,
  replyTo: string | null
) {
  // Create unsub token
  const unsubToken = await prisma.unsubscribeToken.create({
    data: { contactId },
  });

  // Process HTML
  let html = htmlContent;
  html = injectTrackingPixel(html, campaignId, contactId);
  html = rewriteLinks(html, campaignId, contactId);
  html = injectUnsubscribeLink(html, unsubToken.token);

  // Send
  await sendEmail({
    from: `${fromName} <${fromEmail}>`,
    to: email,
    subject,
    html,
    text: textContent || undefined,
    replyTo: replyTo || undefined,
  });

  // Record event
  await prisma.emailEvent.create({
    data: {
      campaignId,
      contactId,
      type: "SENT",
    },
  });
}
