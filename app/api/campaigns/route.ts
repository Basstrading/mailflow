import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, unauthorized } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const campaignSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  textContent: z.string().optional(),
  entityId: z.string().min(1),
  contactListId: z.string().min(1),
});

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const campaigns = await prisma.campaign.findMany({
    where: { entity: { userId } },
    orderBy: { createdAt: "desc" },
    include: {
      entity: true,
      contactList: { include: { _count: { select: { contacts: true } } } },
      _count: { select: { emailEvents: true } },
    },
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const limited = applyRateLimit(req, "api");
  if (limited) return limited;

  const body = await req.json();
  const parsed = campaignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Verify entity belongs to user
  const entity = await prisma.entity.findFirst({
    where: { id: parsed.data.entityId, userId },
  });
  if (!entity) return unauthorized();

  const campaign = await prisma.campaign.create({
    data: {
      ...parsed.data,
      textContent: parsed.data.textContent || null,
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const limited = applyRateLimit(req, "api");
  if (limited) return limited;

  const body = await req.json();
  const { id, ...data } = body;

  // Verify campaign belongs to user via entity
  const campaign = await prisma.campaign.findFirst({
    where: { id, entity: { userId } },
  });
  if (!campaign) return unauthorized();

  const updated = await prisma.campaign.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}
