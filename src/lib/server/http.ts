import { NextResponse } from "next/server";
import type { z } from "zod";
import { AiError } from "@/lib/ai/claude";
import { MemoryRateLimiter, type RateLimiter } from "./limits";

const HOUR = 60 * 60 * 1000;

const globalForLimits = globalThis as unknown as { aiLimiter?: RateLimiter };
export const aiLimiter: RateLimiter =
  globalForLimits.aiLimiter ?? (globalForLimits.aiLimiter = new MemoryRateLimiter(Number(process.env.AI_RATE_LIMIT_PER_HOUR) || 30, HOUR));

export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || req.headers.get("x-real-ip") || "local";
}

export function fail(status: number, code: string, message: string, headers?: HeadersInit) {
  return NextResponse.json({ error: { code, message } }, { status, headers });
}

const STATUS: Record<AiError["code"], number> = {
  not_configured: 503,
  busy: 503,
  refused: 422,
  bad_output: 502,
  unavailable: 502,
};

export function aiFailure(err: unknown) {
  if (err instanceof AiError) return fail(STATUS[err.code], err.code, err.message);
  console.error("Unhandled AI route error", err);
  return fail(500, "unavailable", "Something went wrong. Try again.");
}

export async function readBody<S extends z.ZodType>(
  req: Request,
  schema: S,
): Promise<{ ok: true; data: z.infer<S> } | { ok: false; res: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, res: fail(400, "bad_request", "Request body must be JSON.") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, res: fail(400, "bad_request", parsed.error.issues[0]?.message ?? "Invalid request.") };
  }
  return { ok: true, data: parsed.data };
}

export async function limit(req: Request): Promise<NextResponse | null> {
  const r = await aiLimiter.take(clientKey(req));
  if (r.ok) return null;
  return fail(429, "rate_limited", `You've hit the hourly limit for AI features. Try again in ${Math.ceil(r.retryAfterSec / 60)} min.`, {
    "Retry-After": String(r.retryAfterSec),
  });
}
