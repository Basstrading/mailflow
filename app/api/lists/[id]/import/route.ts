import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await req.json();
  const { contacts } = body as {
    contacts: { email: string; firstName?: string; lastName?: string }[];
  };

  if (!contacts || !Array.isArray(contacts)) {
    return NextResponse.json({ error: "Contacts array required" }, { status: 400 });
  }

  let imported = 0;
  let skipped = 0;

  for (const contact of contacts) {
    if (!contact.email) {
      skipped++;
      continue;
    }

    try {
      await prisma.contact.upsert({
        where: {
          email_contactListId: {
            email: contact.email.toLowerCase().trim(),
            contactListId: id,
          },
        },
        update: {
          firstName: contact.firstName || undefined,
          lastName: contact.lastName || undefined,
        },
        create: {
          email: contact.email.toLowerCase().trim(),
          firstName: contact.firstName || null,
          lastName: contact.lastName || null,
          contactListId: id,
        },
      });
      imported++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ imported, skipped });
}
