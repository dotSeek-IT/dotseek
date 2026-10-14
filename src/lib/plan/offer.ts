/**
 * New-customer offer, configured by the DotSeek admin (never hard-coded).
 * Pure, so the chat can show it and the server can re-check it on submit.
 */

export type Offer = {
  active: boolean;
  /** Shown to customers, e.g. "New customer offer". */
  label: string;
  /** Percentage off the recommended estimate (0 to 90). */
  discountPercent?: number;
  /** Fixed promotional price ("From £999"); used instead of the percentage when set. */
  fixedPrice?: number;
  /** ISO date (inclusive); no date means no expiry. */
  expires?: string;
  /** Solution ids the offer applies to; empty means every solution. */
  eligibleSolutions: string[];
};

export type OfferQuote = { label: string; price: number; standard: number; expires?: string };

/** The offer for this estimate, or null when it doesn't apply or wouldn't lower the price. */
export function offerFor(offer: Offer | null | undefined, solution: string, recommended: number, now = new Date()): OfferQuote | null {
  if (!offer?.active) return null;
  if (offer.expires && new Date(`${offer.expires}T23:59:59`) < now) return null;
  if (offer.eligibleSolutions.length && !offer.eligibleSolutions.includes(solution)) return null;
  const price =
    offer.fixedPrice && offer.fixedPrice > 0
      ? offer.fixedPrice
      : offer.discountPercent && offer.discountPercent > 0
        ? Math.round((recommended * (1 - Math.min(90, offer.discountPercent) / 100)) / 10) * 10
        : null;
  if (price === null || price >= recommended) return null;
  return { label: offer.label || "New customer offer", price, standard: recommended, expires: offer.expires };
}
