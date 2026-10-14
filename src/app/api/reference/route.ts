import { aiConfigured, clientIp, createRateLimiter, logAiError, sameOrigin } from "@/lib/assistant/http";
import { analyseReferenceWithAI } from "@/lib/assistant/consultant";
import type { ReferenceAnalysis } from "@/lib/plan/reference";
import { readReference } from "@/lib/reference/analyse";
import { normaliseUrl, ReferenceFetchError } from "@/lib/reference/fetch";

/**
 * POST /api/reference  { url } -> { analysis }
 * Reads a public reference website or app and estimates the likely scope of a
 * similar (original) solution. The AI refines the rule-based reading when
 * configured; otherwise the rules are used.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const rateLimited = createRateLimiter(60 * 60 * 1000, 10);

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden." }, { status: 403 });
  const body = (await request.json().catch(() => null)) as { url?: unknown } | null;
  if (typeof body?.url !== "string" || body.url.length > 500) return Response.json({ error: "Please paste a web address." }, { status: 400 });
  // Check the address before counting it, so typos don't use up the hourly limit.
  try {
    normaliseUrl(body.url);
  } catch (error) {
    return Response.json({ error: error instanceof ReferenceFetchError ? error.message : "Please paste a web address." }, { status: 422 });
  }
  if (rateLimited(clientIp(request))) return Response.json({ error: "Too many analyses. Please try again later." }, { status: 429 });

  let signals;
  try {
    signals = await readReference(body.url);
  } catch (error) {
    const message = error instanceof ReferenceFetchError ? error.message : "We couldn't read that website.";
    return Response.json({ error: message }, { status: 422 });
  }

  const { text: _text, platform: _platform, ...base } = signals;
  void _text;
  void _platform;
  let analysis: ReferenceAnalysis = {
    ...base,
    summary: `${signals.title} looks like ${
      { website: "a website", ecommerce: "an online shop", webapp: "a web application", saas: "a SaaS product", mobile: "a mobile app" }[signals.kind]
    } with about ${signals.pages} ${signals.kind === "mobile" ? "screens" : signals.pages === 1 ? "page" : "pages"}${
      signals.evidence.length > 1 ? `, including ${signals.evidence.slice(1, 5).map((e) => e.toLowerCase()).join(", ")}` : ""
    }. DotSeek uses references to understand layout style, features and complexity, and builds an original solution with your own branding and content.`,
    source: "rules",
  };
  if (aiConfigured()) {
    try {
      const ai = await analyseReferenceWithAI(signals);
      if (ai) analysis = { ...analysis, ...ai, pages: Math.max(1, Math.min(200, Math.round(ai.pages))), source: "ai" };
    } catch (error) {
      logAiError("reference", error);
    }
  }
  return Response.json({ analysis });
}
