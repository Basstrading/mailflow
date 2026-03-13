import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const entitySchema = z.object({
  name: z.string().min(1),
  fromEmail: z.string().email(),
  fromName: z.string().min(1),
  replyTo: z.string().email().optional().or(z.literal("")),
});

export async function GET() {
  const entities = await prisma.entity.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { campaigns: true, contactLists: true } },
    },
  });
  return NextResponse.json(entities);
}

export async function POST(req: NextRequest) {
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
    },
  });

  return NextResponse.json(entity, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;

  const parsed = entitySchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entity = await prisma.entity.update({
    where: { id },
    data: {
      ...parsed.data,
      replyTo: parsed.data.replyTo || null,
    },
  });

  return NextResponse.json(entity);
}

export async function DELETE(req: NextRequest) {
  const limited = applyRateLimit(req, "api");
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  await prisma.entity.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
