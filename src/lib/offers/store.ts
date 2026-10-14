import "server-only";
import { getSetting, putSetting } from "@/lib/enquiries/store";
import type { Offer } from "@/lib/plan/offer";

/** The new-customer offer, stored with the enquiry data (Redis in production). */

const KEY = "offer";

export const defaultOffer: Offer = { active: false, label: "New customer offer", eligibleSolutions: [] };

export async function getOffer(): Promise<Offer> {
  return { ...defaultOffer, ...((await getSetting<Offer>(KEY)) ?? {}) };
}

export async function saveOffer(offer: Offer): Promise<boolean> {
  return putSetting(KEY, offer);
}
