import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, unauthorized } from "@/lib/api-auth";
import { verifyDomain } from "@/lib/ses";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const { id } = await params;

  const entity = await prisma.entity.findFirst({ where: { id, userId } });
  if (!entity) {
    return NextResponse.json({ error: "Entité introuvable" }, { status: 404 });
  }

  // Extract domain from email
  const domain = entity.fromEmail.split("@")[1];
  if (!domain) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  try {
    // Register domain in SES and get DKIM tokens
    const dkimTokens = await verifyDomain(domain);

    // Build CNAME records for display
    const dkimRecords = dkimTokens.map((token) => ({
      name: `${token}._domainkey.${domain}`,
      type: "CNAME",
      value: `${token}.dkim.amazonses.com`,
    }));

    // Save to database
    await prisma.entity.update({
      where: { id },
      data: {
        domain,
        dkimTokens: dkimRecords,
        verificationStatus: "PENDING",
      },
    });

    return NextResponse.json({
      domain,
      dkimRecords,
      message: "Domaine enregistré dans SES. Ajoutez les enregistrements CNAME dans votre DNS.",
    });
  } catch (error) {
    console.error("SES verify error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement du domaine dans SES" },
      { status: 500 }
    );
  }
}
