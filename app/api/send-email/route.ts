import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/ses";
import { getAuthUserId, unauthorized } from "@/lib/api-auth";

function replaceVariables(
  text: string,
  vars: { firstName?: string; lastName?: string; email?: string }
): string {
  return text
    .replace(/\{\{prenom\}\}/gi, vars.firstName || "")
    .replace(/\{\{nom\}\}/gi, vars.lastName || "")
    .replace(/\{\{email\}\}/gi, vars.email || "");
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const { entityId, to, firstName, lastName, subject, html, text } =
    await req.json();

  if (!entityId || !to || !subject || !html) {
    return NextResponse.json(
      { error: "Champs requis : entityId, to, subject, html" },
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

  const vars = { firstName, lastName, email: to };
  const finalSubject = replaceVariables(subject, vars);
  const finalHtml = replaceVariables(html, vars);
  const finalText = text ? replaceVariables(text, vars) : undefined;

  try {
    await sendEmail({
      from: `${entity.fromName} <${entity.fromEmail}>`,
      to,
      subject: finalSubject,
      html: finalHtml,
      text: finalText,
      replyTo: entity.replyTo || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur envoi email:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'email" },
      { status: 500 }
    );
  }
}
