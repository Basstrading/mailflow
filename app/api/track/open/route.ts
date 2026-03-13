import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(req: NextRequest) {
  const limited = applyRateLimit(req, "track");
  if (limited) return limited;
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("cid");
  const contactId = searchParams.get("rid");

  if (campaignId && contactId) {
    try {
      await prisma.emailEvent.create({
        data: {
          campaignId,
          contactId,
          type: "OPENED",
        },
      });
    } catch {
      // Ignore errors silently
    }
  }

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
