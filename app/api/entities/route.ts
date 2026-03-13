import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, unauthorized } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const entitySchema = z.object({
  name: z.string().min(1),
  fromEmail: z.string().email(),
  fromName: z.string().min(1),
  replyTo: z.string().email().optional().or(z.literal("")),
});

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const entities = await prisma.entity.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { campaigns: true, contactLists: true } },
    },
  });
  return NextResponse.json(entities);
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const limited = applyRateLimit(req, "api");
  if (limited) return limited;

  const body = await req.json();
  const parsed = entitySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entity = await prisma.entity.create({
    data: {
      ...parsed.data,
      replyTo: parsed.data.replyTo || null,
      userId,
    },
  });

  return NextResponse.json(entity, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const body = await req.json();
  const { id, ...data } = body;

  const parsed = entitySchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entity = await prisma.entity.updateMany({
    where: { id, userId },
    data: {
      ...parsed.data,
      replyTo: parsed.data.replyTo || null,
    },
  });

  if (entity.count === 0) return unauthorized();

  const updated = await prisma.entity.findUnique({ where: { id } });
  return NextResponse.json(updated);
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

  const deleted = await prisma.entity.deleteMany({ where: { id, userId } });
  if (deleted.count === 0) return unauthorized();

  return NextResponse.json({ success: true });
}
