import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const contacts = await prisma.contact.findMany({
    where: { contactListId: id },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json(contacts);
}
