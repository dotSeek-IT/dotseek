import { summariseEnquiry } from "@/lib/assistant/consultant";
import { aiConfigured, clientIp, createRateLimiter, logAiError, parseTurns, sameOrigin } from "@/lib/assistant/http";
import { solutionOf, type Answers } from "@/content/enquiryFlows";
import { buildPlan, sanitizeChoices } from "@/lib/plan/build";

/**
 * POST /api/enquiry/summary  { answers, choices?, transcript? } -> { summary }
 * AI project brief + architecture explanation + consultant advice. The plan is
 * recalculated here from the answers, so the AI only explains real figures.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rateLimited = createRateLimiter(10 * 60 * 1000, 10);

export async function POST(request: Request) {
  if (!aiConfigured()) return Response.json({ error: "Not configured." }, { status: 503 });
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden." }, { status: 403 });
  if (rateLimited(clientIp(request))) return Response.json({ error: "Too many requests." }, { status: 429 });

  const body = (await request.json().catch(() => null)) as { answers?: unknown; choices?: unknown; transcript?: unknown } | null;
  const raw = body?.answers;
  if (!raw || typeof raw !== "object") return Response.json({ error: "Invalid request." }, { status: 400 });
  // Lenient here (the brief is advisory); strict validation happens on submit.
  const answers: Answers = Object.fromEntries(
    Object.entries(raw as Record<string, unknown>)
      .filter(([, v]) => typeof v === "string")
      .map(([k, v]) => [k.slice(0, 40), (v as string).slice(0, 1500)]),
  );
  if (!solutionOf(answers)) return Response.json({ error: "Invalid request." }, { status: 400 });

  try {
    const plan = buildPlan(answers, sanitizeChoices(body?.choices));
    const summary = await summariseEnquiry(answers, parseTurns(body?.transcript, 16, 800) ?? [], plan);
    if (!summary) return Response.json({ error: "No summary." }, { status: 502 });
    return Response.json({ summary });
  } catch (error) {
    logAiError("summary", error);
    return Response.json({ error: "Unavailable." }, { status: 502 });
  }
}
