import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const limited = applyRateLimit(req, "track");
  if (limited) return limited;
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("cid");
  const contactId = searchParams.get("rid");
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing URL" }, { status: 400 });
  }

  if (campaignId && contactId) {
    try {
      await prisma.emailEvent.create({
        data: {
          campaignId,
          contactId,
          type: "CLICKED",
          metadata: { url },
        },
      });
    } catch {
      // Ignore errors silently
    }
  }

  return NextResponse.redirect(url);
}
