import { recommendSolution } from "@/lib/assistant/consultant";
import { aiConfigured, clientIp, createRateLimiter, logAiError, sameOrigin } from "@/lib/assistant/http";
import { keywordRecommendation } from "@/lib/assistant/keywordRecommend";

/** POST /api/enquiry/recommend  { problem } -> { recommendation } (AI picks the best solution; keywords when AI is unavailable). */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rateLimited = createRateLimiter(10 * 60 * 1000, 10);

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden." }, { status: 403 });
  if (rateLimited(clientIp(request))) return Response.json({ error: "Too many requests." }, { status: 429 });

  const body = (await request.json().catch(() => null)) as { problem?: unknown } | null;
  const problem = typeof body?.problem === "string" ? body.problem.trim().slice(0, 1500) : "";
  if (problem.length < 5) return Response.json({ error: "Invalid request." }, { status: 400 });

  // Without AI (no key, no credit or an API error), fall back to matching the words in the description.
  const fallback = () => {
    const recommendation = keywordRecommendation(problem);
    return recommendation ? Response.json({ recommendation, source: "keywords" }) : Response.json({ error: "No recommendation." }, { status: 502 });
  };
  if (!aiConfigured()) return fallback();
  try {
    const recommendation = await recommendSolution(problem);
    return recommendation ? Response.json({ recommendation }) : fallback();
  } catch (error) {
    logAiError("recommend", error);
    return fallback();
  }
}
