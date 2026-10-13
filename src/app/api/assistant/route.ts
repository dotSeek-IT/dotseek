import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/assistant/systemPrompt";

/**
 * POST /api/assistant
 * Body: { messages: { role: "user" | "assistant"; content: string }[] }
 * Streams the assistant's reply as plain text. The API key never leaves the
 * server. Returns 503 when the assistant isn't configured so the client can
 * fall back to its built-in answers.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-opus-5-5";
const MAX_TURNS = 20;
const MAX_CHARS = 1000;
const RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 20 };

const REFUSAL_TEXT =
  "Sorry, I can't help with that one. I'm here to answer questions about DotSeek and AI automation for your business. You can also reach the team at /contact.";

// Best-effort in-memory rate limit per IP. On serverless hosts each instance
// keeps its own counter, so put a shared limiter (e.g. Redis) in front for
// stricter guarantees.
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT.max;
}

type ChatTurn = { role: "user" | "assistant"; content: string };

function parseMessages(body: unknown): Anthropic.Beta.BetaMessageParam[] | null {
  if (!body || typeof body !== "object" || !Array.isArray((body as { messages?: unknown }).messages)) return null;
  const raw = (body as { messages: unknown[] }).messages.slice(-MAX_TURNS);
  const turns: ChatTurn[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as Partial<ChatTurn>;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const text = content.trim().slice(0, MAX_CHARS);
    if (text) turns.push({ role, content: text });
  }
  // Conversation must start and end with the visitor.
  while (turns.length && turns[0].role !== "user") turns.shift();
  if (!turns.length || turns[turns.length - 1].role !== "user") return null;
  return turns;
}

function logError(error: unknown, request: Request) {
  if (error instanceof Anthropic.RateLimitError) {
    console.error("[assistant] rate limited by Anthropic API");
  } else if (error instanceof Anthropic.AuthenticationError) {
    console.error("[assistant] invalid ANTHROPIC_API_KEY");
  } else if (error instanceof Anthropic.APIError) {
    console.error(`[assistant] API error ${error.status}: ${error.message}`);
  } else if (!request.signal.aborted) {
    console.error("[assistant] unexpected error", error);
  }
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "Assistant is not configured." }, { status: 503 });
  }

  // Only accept calls from this site's own pages.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return Response.json({ error: "Too many messages. Please try again in a few minutes." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const messages = parseMessages(body);
  if (!messages) return Response.json({ error: "Invalid request." }, { status: 400 });

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const claude = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 2048,
    // Chat answers: low effort keeps replies fast and inexpensive.
    output_config: { effort: "low" },
    // Re-run a safety-classifier decline on Anthropic's recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages,
  });
  request.signal.addEventListener("abort", () => claude.abort());

  // Wait for the first event so auth, rate-limit and other API errors become a
  // clean JSON error response instead of a dropped stream.
  const events = claude[Symbol.asyncIterator]();
  let first: IteratorResult<Anthropic.Beta.BetaRawMessageStreamEvent>;
  try {
    first = await events.next();
  } catch (error) {
    logError(error, request);
    const status = error instanceof Anthropic.RateLimitError ? 429 : 502;
    return Response.json({ error: "The assistant is unavailable right now." }, { status });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let wrote = false;
      const emit = (event: Anthropic.Beta.BetaRawMessageStreamEvent) => {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          wrote = true;
          controller.enqueue(encoder.encode(event.delta.text));
        }
      };
      try {
        if (!first.done) emit(first.value);
        for (let next = await events.next(); !next.done; next = await events.next()) emit(next.value);

        const final = await claude.finalMessage();
        if (final.stop_reason === "refusal") {
          // A mid-stream decline may leave partial text; tell the client to replace it.
          controller.enqueue(encoder.encode(`${wrote ? "\u0000" : ""}${REFUSAL_TEXT}`));
        }
        controller.close();
      } catch (error) {
        logError(error, request);
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
