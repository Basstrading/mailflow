import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, unauthorized } from "@/lib/api-auth";

export async function GET(
  _req: NextRequest,
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

  const contacts = await prisma.contact.findMany({
    where: { contactListId: id },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json(contacts);
}
