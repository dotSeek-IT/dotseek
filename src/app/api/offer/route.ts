import { getOffer } from "@/lib/offers/store";

/** GET /api/offer -> { offer } when a new-customer offer is active and not expired, otherwise { offer: null }. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const offer = await getOffer().catch(() => null);
  const live = offer?.active && (!offer.expires || new Date(`${offer.expires}T23:59:59`) >= new Date());
  return Response.json({ offer: live ? offer : null }, { headers: { "Cache-Control": "no-store" } });
}
