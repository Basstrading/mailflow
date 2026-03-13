import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/ses";
import { getAuthUserId, unauthorized } from "@/lib/api-auth";

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000;

function replaceVariables(
  text: string,
  vars: { firstName?: string; lastName?: string; email?: string }
): string {
  return text
    .replace(/\{\{prenom\}\}/gi, vars.firstName || "")
    .replace(/\{\{nom\}\}/gi, vars.lastName || "")
    .replace(/\{\{email\}\}/gi, vars.email || "");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface Recipient {
  email: string;
  firstName?: string;
  lastName?: string;
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const { entityId, emails, contactListId, subject, html } = await req.json();

  if (!entityId || !subject || !html) {
    return NextResponse.json(
      { error: "Champs requis : entityId, subject, html" },
      { status: 400 }
    );
  }

  // Verify entity belongs to user
  const entity = await prisma.entity.findFirst({
    where: { id: entityId, userId },
  });

  if (!entity) {
    return NextResponse.json({ error: "Entité non trouvée" }, { status: 404 });
  }

  if (!entity.isVerified) {
    return NextResponse.json(
      { error: "L'entité n'est pas vérifiée. Configurez d'abord le domaine." },
      { status: 400 }
    );
  }

  // Build recipient list
  let recipients: Recipient[] = [];

  if (contactListId) {
    // Verify list belongs to user's entity
    const list = await prisma.contactList.findFirst({
      where: { id: contactListId, entity: { userId } },
      include: {
        contacts: {
          where: { status: "SUBSCRIBED" },
          select: { email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!list) {
      return NextResponse.json({ error: "Liste non trouvée" }, { status: 404 });
    }

    recipients = list.contacts.map((c) => ({
      email: c.email,
      firstName: c.firstName || undefined,
      lastName: c.lastName || undefined,
    }));
  } else if (emails && Array.isArray(emails)) {
    recipients = emails.map((email: string) => ({ email: email.trim() }));
  } else {
    return NextResponse.json(
      { error: "Veuillez fournir des emails ou une liste de contacts" },
      { status: 400 }
    );
  }

  if (recipients.length === 0) {
    return NextResponse.json(
      { error: "Aucun destinataire" },
      { status: 400 }
    );
  }

  // Send emails in batches
  const from = `${entity.fromName} <${entity.fromEmail}>`;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((recipient) => {
        const vars = {
          firstName: recipient.firstName,
          lastName: recipient.lastName,
          email: recipient.email,
        };
        const finalSubject = replaceVariables(subject, vars);
        const finalHtml = replaceVariables(html, vars);

        return sendEmail({
          from,
          to: recipient.email,
          subject: finalSubject,
          html: finalHtml,
          replyTo: entity.replyTo || undefined,
        });
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        sent++;
      } else {
        failed++;
        console.error("Erreur envoi:", result.reason);
      }
    }

    // Rate limiting between batches
    if (i + BATCH_SIZE < recipients.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  return NextResponse.json({ sent, failed, total: recipients.length });
}
