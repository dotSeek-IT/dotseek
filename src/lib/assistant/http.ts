import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/** Shared request guards and helpers for the assistant/enquiry API routes. */

export const MODEL = "claude-opus-5-5";

/** Server-side fallback on safety-classifier declines (beta, "default" routing). */
export const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

export const aiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

/** Rejects cross-site calls: only this site's own pages may use the APIs. */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export const clientIp = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

/**
 * Best-effort in-memory rate limiter per key. On serverless hosts each
 * instance keeps its own counter; put a shared limiter in front for strict limits.
 */
export function createRateLimiter(windowMs: number, max: number) {
  const hits = new Map<string, number[]>();
  return (key: string): boolean => {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) hits.clear();
    return recent.length > max;
  };
}

export function logAiError(scope: string, error: unknown, aborted = false) {
  if (error instanceof Anthropic.RateLimitError) {
    console.error(`[${scope}] rate limited by Anthropic API`);
  } else if (error instanceof Anthropic.AuthenticationError) {
    console.error(`[${scope}] invalid ANTHROPIC_API_KEY`);
  } else if (error instanceof Anthropic.APIError) {
    console.error(`[${scope}] API error ${error.status}: ${error.message}`);
  } else if (!aborted) {
    console.error(`[${scope}] unexpected error`, error);
  }
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

/** Validates a chat history: alternating text turns, trimmed, capped, ending with the visitor. */
export function parseTurns(input: unknown, maxTurns = 24, maxChars = 1500): ChatTurn[] | null {
  if (!Array.isArray(input)) return null;
  const turns: ChatTurn[] = [];
  for (const m of input.slice(-maxTurns)) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as Partial<ChatTurn>;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const text = content.trim().slice(0, maxChars);
    if (text) turns.push({ role, content: text });
  }
  while (turns.length && turns[0].role !== "user") turns.shift();
  return turns;
}
