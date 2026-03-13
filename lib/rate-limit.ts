import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  /** Max requests per window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

// In-memory store - works for single-instance deployments
// For multi-instance, use Redis instead
const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL_MS = 60_000;
let cleanupStarted = false;

function startCleanup() {
  if (cleanupStarted) return;
  cleanupStarted = true;
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Check rate limit for a given key.
 * Returns { limited: false, remaining, resetAt } if allowed,
 * or { limited: true, remaining: 0, resetAt } if blocked.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { limited: boolean; remaining: number; resetAt: number } {
  startCleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    // New window
    const resetAt = now + config.windowSeconds * 1000;
    store.set(key, { count: 1, resetAt });
    return { limited: false, remaining: config.limit - 1, resetAt };
  }

  entry.count++;

  if (entry.count > config.limit) {
    return { limited: true, remaining: 0, resetAt: entry.resetAt };
  }

  return {
    limited: false,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

// ── Pre-configured rate limiters ──

const RATE_LIMITS = {
  // Auth: 10 attempts per minute (brute force protection)
  auth: { limit: 10, windowSeconds: 60 },
  // API general: 100 requests per minute
  api: { limit: 100, windowSeconds: 60 },
  // Send campaign: 5 per minute (prevent accidental spam)
  send: { limit: 5, windowSeconds: 60 },
  // Webhooks: 200 per minute (SES can send bursts)
  webhook: { limit: 200, windowSeconds: 60 },
  // Tracking: 500 per minute (high volume expected)
  track: { limit: 500, windowSeconds: 60 },
} as const;

type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Apply rate limiting to an API route.
 * Returns a NextResponse with 429 status if rate limited, or null if allowed.
 */
export function applyRateLimit(
  req: NextRequest,
  type: RateLimitType
): NextResponse | null {
  const ip = getClientIp(req);
  const key = `${type}:${ip}`;
  const config = RATE_LIMITS[type];
  const result = checkRateLimit(key, config);

  if (result.limited) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez plus tard." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(config.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.resetAt),
        },
      }
    );
  }

  return null;
}

/**
 * Add rate limit headers to an existing response.
 */
export function addRateLimitHeaders(
  response: NextResponse,
  req: NextRequest,
  type: RateLimitType
): NextResponse {
  const ip = getClientIp(req);
  const key = `${type}:${ip}`;
  const config = RATE_LIMITS[type];
  const entry = store.get(key);

  if (entry) {
    response.headers.set("X-RateLimit-Limit", String(config.limit));
    response.headers.set(
      "X-RateLimit-Remaining",
      String(Math.max(0, config.limit - entry.count))
    );
    response.headers.set("X-RateLimit-Reset", String(entry.resetAt));
  }

  return response;
}
