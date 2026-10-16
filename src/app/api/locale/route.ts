import { getRegions } from "@/lib/currency/regions.server";

/**
 * GET /api/locale -> { country, regions }
 * The visitor's country (from Vercel's x-vercel-ip-country header) and the
 * current pricing regions, so the chat can show prices in the right currency.
 * Its own small route, so the site's pages stay static.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const country = request.headers.get("x-vercel-ip-country");
  const regions = await getRegions();
  return Response.json(
    { country: country && /^[A-Z]{2}$/.test(country) ? country : null, regions },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
