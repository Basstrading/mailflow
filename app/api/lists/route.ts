import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, unauthorized } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const listSchema = z.object({
  name: z.string().min(1),
  entityId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const entityId = searchParams.get("entityId");

  const lists = await prisma.contactList.findMany({
    where: {
      entity: { userId },
      ...(entityId ? { entityId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      entity: true,
      _count: { select: { contacts: true } },
    },
  });

  return NextResponse.json(lists);
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const limited = applyRateLimit(req, "api");
  if (limited) return limited;

  const body = await req.json();
  const parsed = listSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Verify entity belongs to user
  const entity = await prisma.entity.findFirst({
    where: { id: parsed.data.entityId, userId },
  });
  if (!entity) return unauthorized();

  const list = await prisma.contactList.create({
    data: parsed.data,
  });

  return NextResponse.json(list, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const limited = applyRateLimit(req, "api");
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  // Verify list belongs to user via entity
  const list = await prisma.contactList.findFirst({
    where: { id, entity: { userId } },
  });
  if (!list) return unauthorized();

  await prisma.contactList.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
