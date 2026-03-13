import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, unauthorized } from "@/lib/api-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const { id } = await params;

  // Verify list belongs to user via entity
  const list = await prisma.contactList.findFirst({
    where: { id, entity: { userId } },
  });
  if (!list) return unauthorized();

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
