import { NextRequest, NextResponse } from "next/server";
import { processScheduledCampaigns } from "@/lib/scheduler";

// This endpoint can be called by:
// - An external cron job (e.g., every minute)
// - Vercel Cron Jobs
// - Any scheduler service
// Protected by a secret token to prevent unauthorized access

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const expectedToken = process.env.SCHEDULER_SECRET;

  if (expectedToken && token !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const processed = await processScheduledCampaigns();

  return NextResponse.json({
    processed,
    checkedAt: new Date().toISOString(),
  });
}
