import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, unauthorized } from "@/lib/api-auth";
import { getWarmupProgress } from "@/lib/warmup";

async function getSentToday(entityId: string): Promise<number> {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

  return prisma.emailEvent.count({
    where: {
      campaign: { entityId },
      type: "SENT",
      timestamp: { gte: dayStart },
    },
  });
}

export async function GET(
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

  let warmupConfig = await prisma.warmupConfig.findUnique({
    where: { entityId: id },
  });

  if (!warmupConfig) {
    warmupConfig = await prisma.warmupConfig.create({
      data: { entityId: id },
    });
  }

  const sentToday = await getSentToday(id);
  const progress = getWarmupProgress(warmupConfig, sentToday);

  return NextResponse.json({ ...warmupConfig, progress });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const { id } = await params;

  const entity = await prisma.entity.findFirst({ where: { id, userId } });
  if (!entity) {
    return NextResponse.json({ error: "Entité introuvable" }, { status: 404 });
  }

  const body = await req.json();
  const { enabled, targetVolume, dailyLimit, duplicationDays, maxWarmupDays } = body;

  const data = {
    ...(enabled !== undefined && { enabled }),
    ...(targetVolume && { targetVolume }),
    ...(dailyLimit && { dailyLimit }),
    ...(duplicationDays && { duplicationDays }),
    ...(maxWarmupDays && { maxWarmupDays }),
  };

  let warmupConfig = await prisma.warmupConfig.findUnique({
    where: { entityId: id },
  });

  if (!warmupConfig) {
    warmupConfig = await prisma.warmupConfig.create({
      data: { entityId: id, ...data },
    });
  } else {
    warmupConfig = await prisma.warmupConfig.update({
      where: { entityId: id },
      data,
    });
  }

  const sentToday = await getSentToday(id);
  const progress = getWarmupProgress(warmupConfig, sentToday);

  return NextResponse.json({ ...warmupConfig, progress });
}
