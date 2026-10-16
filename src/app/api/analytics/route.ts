import { clientIp, createRateLimiter, sameOrigin } from "@/lib/assistant/http";
import { CLIENT_EVENTS, type ClientEvent } from "@/lib/analytics/events";
import { isBot, recordStep, recordView } from "@/lib/analytics/store";
import { solutionById } from "@/content/solutions";

/**
 * POST /api/analytics
 *   { t: "view", path, ref?, utm?, quote? }                     a page view
 *   { t: "step", name, service?, currency?, estimateGbp? }      a journey step
 * Anonymous (no cookies, no stored IPs). Always answers 204 so the site never waits.
 * "quote_sent" is recorded by /api/enquiry itself, so it can't be faked from here.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rateLimited = createRateLimiter(10 * 60 * 1000, 300);
const PRIVATE = /^\/(admin|enquiry|api)(\/|$)/;

type Body = { t?: unknown; path?: unknown; ref?: unknown; utm?: unknown; quote?: unknown; name?: unknown; service?: unknown; currency?: unknown; estimateGbp?: unknown };

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : null);

export async function POST(request: Request) {
  const done = new Response(null, { status: 204 });
  const ua = request.headers.get("user-agent") ?? "";
  const ip = clientIp(request);
  if (!sameOrigin(request) || isBot(ua) || rateLimited(ip)) return done;

  const body = (await request.json().catch(() => null)) as Body | null;
  const visit = { ip, ua, country: request.headers.get("x-vercel-ip-country"), ownHost: request.headers.get("host") ?? "" };
  try {
    if (body?.t === "view") {
      const path = str(body.path, 200)?.split(/[?#]/)[0];
      if (path?.startsWith("/") && !PRIVATE.test(path)) {
        await recordView({ ...visit, path, referrer: str(body.ref, 300), utm: str(body.utm, 40), quoteLink: body.quote === true });
      }
    } else if (body?.t === "step" && CLIENT_EVENTS.includes(body.name as ClientEvent)) {
      const service = str(body.service, 40);
      await recordStep(visit, body.name as ClientEvent, {
        service: service && (solutionById(service) || service === "reference") ? service : undefined,
        currency: str(body.currency, 3) ?? undefined,
        estimateGbp: typeof body.estimateGbp === "number" ? Math.min(body.estimateGbp, 10_000_000) : undefined,
      });
    }
  } catch (error) {
    console.error("[analytics]", error instanceof Error ? error.message : error);
  }
  return done;
}
