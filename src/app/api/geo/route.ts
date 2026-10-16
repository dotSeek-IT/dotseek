/**
 * GET /api/geo -> { country } (ISO 3166-1 alpha-2 or null).
 * Vercel adds the visitor's country to each request; it's only used to pick a
 * default display currency (prices stay in GBP). Kept as its own small route
 * so the site's pages stay static.
 */

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const country = request.headers.get("x-vercel-ip-country");
  return Response.json({ country: country && /^[A-Z]{2}$/.test(country) ? country : null }, { headers: { "Cache-Control": "private, no-store" } });
}
