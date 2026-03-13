import { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";
import { applyRateLimit } from "@/lib/rate-limit";

const { GET: authGET, POST: authPOST } = handlers;

export const GET = authGET;

export async function POST(req: NextRequest) {
  const limited = applyRateLimit(req, "auth");
  if (limited) return limited;
  return authPOST(req);
}
