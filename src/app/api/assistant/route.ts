import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { SYSTEM_PROMPT } from "@/lib/assistant/systemPrompt";
import {
  anthropicClient,
  FALLBACK,
  MODEL,
  aiConfigured,
  clientIp,
  createRateLimiter,
  logAiError,
  parseTurns,
  sameOrigin,
} from "@/lib/assistant/http";
import { solutionCatalogue } from "@/content/solutions";

/**
 * POST /api/assistant: the AI business consultant.
 * Body: { messages: { role: "user" | "assistant"; content: string }[] }
 * Streams plain text. Two in-band control characters:
 *   \u0000  replace everything streamed so far (mid-stream refusal)
 *   \u0001  followed by JSON {"type":"start_enquiry","solution":id,"reason":text}
 *           when the consultant decides the visitor is ready for a tailored enquiry.
 * Returns 503 when ANTHROPIC_API_KEY is unset so the chat falls back to built-in answers.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rateLimited = createRateLimiter(10 * 60 * 1000, 20);

const REFUSAL_TEXT =
  "Sorry, I can't help with that one. I'm here to help with your business needs and how DotSeek can solve them. You can also reach the team at /contact.";

const SOLUTION_IDS = solutionCatalogue.map((s) => s.id) as [string, ...string[]];

const StartEnquiryInput = z.object({
  solution: z.enum(SOLUTION_IDS),
  reason: z.string().min(1).max(600),
});

const startEnquiryTool: Anthropic.Beta.BetaTool = {
  name: "start_enquiry",
  description:
    "Start the guided enquiry for the DotSeek solution that best fits the visitor. The website then asks tailored follow-up questions, shows a summary they can review and edit, and sends it to the DotSeek team. Call it when the visitor wants to move forward or their need is clear enough to brief the team.",
  // Stream tool input as generated; we validate it ourselves after the turn.
  eager_input_streaming: true,
  input_schema: {
    type: "object",
    properties: {
      solution: {
        type: "string",
        enum: SOLUTION_IDS,
        description: solutionCatalogue.map((s) => `${s.id}: ${s.title}`).join("; "),
      },
      reason: {
        type: "string",
        description: "One or two sentences, addressed to the visitor, on why this solution fits their need.",
      },
    },
    required: ["solution", "reason"],
  },
};

export async function POST(request: Request) {
  if (!aiConfigured()) return Response.json({ error: "Assistant is not configured." }, { status: 503 });
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden." }, { status: 403 });
  if (rateLimited(clientIp(request))) {
    return Response.json({ error: "Too many messages. Please try again in a few minutes." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const messages = parseTurns((body as { messages?: unknown })?.messages, 20, 1000);
  if (!messages || !messages.length || messages[messages.length - 1].role !== "user") {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const client = anthropicClient();
  const encoder = new TextEncoder();

  const claude = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 4096,
    // Conversational turns: low effort keeps replies fast and inexpensive.
    output_config: { effort: "low" },
    ...FALLBACK,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    tools: [startEnquiryTool],
    tool_choice: { type: "auto" },
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
    logAiError("assistant", error, request.signal.aborted);
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
          // A decline may leave partial text or a cut-off tool call: replace, never act on it.
          controller.enqueue(encoder.encode(`${wrote ? "\u0000" : ""}${REFUSAL_TEXT}`));
        } else if (final.stop_reason === "tool_use") {
          const call = final.content.find(
            (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use" && b.name === "start_enquiry",
          );
          const parsed = StartEnquiryInput.safeParse(call?.input);
          if (parsed.success) {
            controller.enqueue(encoder.encode(`\u0001${JSON.stringify({ type: "start_enquiry", ...parsed.data })}`));
          } else if (!wrote) {
            controller.enqueue(encoder.encode("I'd be glad to help you put a project brief together. What would you like help with?"));
          }
        }
        controller.close();
      } catch (error) {
        logAiError("assistant", error, request.signal.aborted);
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
