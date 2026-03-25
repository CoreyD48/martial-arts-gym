// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// In-memory rate limiter for login attempts.
// Keyed by IP address. Resets after WINDOW_MS.
// NOTE: This is per-process — for multi-instance deployments, replace with
// a shared store (e.g. Redis via @upstash/ratelimit).
// ---------------------------------------------------------------------------
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface RateLimitRecord {
  count: number;
  windowStart: number;
}

const loginAttempts = new Map<string, RateLimitRecord>();

// Periodically purge expired entries to prevent unbounded memory growth.
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttempts) {
    if (now - record.windowStart >= WINDOW_MS) {
      loginAttempts.delete(ip);
    }
  }
}, WINDOW_MS);

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSecs: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now - record.windowStart >= WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSecs: 0 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfterSecs = Math.ceil((WINDOW_MS - (now - record.windowStart)) / 1000);
    return { allowed: false, retryAfterSecs };
  }

  record.count += 1;
  return { allowed: true, retryAfterSecs: 0 };
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate-limit POST requests to the NextAuth credentials callback.
  if (
    request.method === "POST" &&
    pathname === "/api/auth/callback/credentials"
  ) {
    const ip = getClientIp(request);
    const { allowed, retryAfterSecs } = checkRateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSecs),
            "X-RateLimit-Limit": String(MAX_ATTEMPTS),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  const isDashboard = pathname.startsWith("/dashboard");
  const isPortal = pathname.startsWith("/portal");

  if (!isDashboard && !isPortal) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Students should only access /portal, not /dashboard
  if (isDashboard && token.role === "STUDENT") {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  // Non-students should not access /portal (redirect to dashboard)
  if (isPortal && token.role !== "STUDENT") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/portal/:path*",
    "/api/auth/callback/credentials",
  ],
};
