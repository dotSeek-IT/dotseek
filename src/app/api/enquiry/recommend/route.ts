import { recommendSolution } from "@/lib/assistant/consultant";
import { aiConfigured, clientIp, createRateLimiter, logAiError, sameOrigin } from "@/lib/assistant/http";

/** POST /api/enquiry/recommend  { problem } -> { recommendation } (AI picks the best solution). */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rateLimited = createRateLimiter(10 * 60 * 1000, 10);

export async function POST(request: Request) {
  if (!aiConfigured()) return Response.json({ error: "Not configured." }, { status: 503 });
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden." }, { status: 403 });
  if (rateLimited(clientIp(request))) return Response.json({ error: "Too many requests." }, { status: 429 });

  const body = (await request.json().catch(() => null)) as { problem?: unknown } | null;
  const problem = typeof body?.problem === "string" ? body.problem.trim().slice(0, 1500) : "";
  if (problem.length < 5) return Response.json({ error: "Invalid request." }, { status: 400 });

  try {
    const recommendation = await recommendSolution(problem);
    if (!recommendation) return Response.json({ error: "No recommendation." }, { status: 502 });
    return Response.json({ recommendation });
  } catch (error) {
    logAiError("recommend", error);
    return Response.json({ error: "Unavailable." }, { status: 502 });
  }
}
