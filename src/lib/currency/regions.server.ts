import "server-only";
import { defaultRegions, type Region } from "@/content/regions";
import { getSetting, putSetting } from "@/lib/enquiries/store";

/**
 * Effective pricing regions: the defaults in content/regions.ts with the
 * admin's overrides (stored as the "regions" setting) on top.
 */

const KEY = "regions";
type Overrides = Record<string, Partial<Region>>;

export async function getRegions(): Promise<Region[]> {
  const overrides = (await getSetting<Overrides>(KEY).catch(() => null)) ?? {};
  return defaultRegions.map((r) => ({ ...r, ...(overrides[r.id] ?? {}), id: r.id, countries: overrides[r.id]?.countries ?? r.countries }));
}

export async function saveRegion(id: string, patch: Partial<Region>): Promise<boolean> {
  const overrides = (await getSetting<Overrides>(KEY).catch(() => null)) ?? {};
  overrides[id] = { ...(overrides[id] ?? {}), ...patch };
  return putSetting(KEY, overrides);
}

/**
 * Refresh exchange rates: USD, EUR and INR from the European Central Bank's
 * published rates (via the free Frankfurter API); AED and SAR from their fixed
 * US dollar pegs; KWD and anything marked "manual" keep their stored rate.
 */
export async function refreshRates(): Promise<{ ok: boolean; message: string }> {
  try {
    const response = await fetch("https://api.frankfurter.app/latest?from=GBP&to=USD,EUR,INR", { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) return { ok: false, message: `The rate provider answered ${response.status}.` };
    const data = (await response.json()) as { date?: string; rates?: Record<string, number> };
    const usd = data.rates?.USD;
    if (!usd || !data.rates?.EUR || !data.rates?.INR) return { ok: false, message: "The rate provider didn't return every currency." };
    const checked = new Date().toISOString();
    const pegs: Record<string, number> = { AED: 3.6725, SAR: 3.75 };
    const regions = await getRegions();
    for (const r of regions) {
      if (r.rateSource === "ecb" && data.rates[r.currency]) await saveRegion(r.id, { perGbp: Number(data.rates[r.currency]!.toFixed(4)), rateCheckedAt: checked });
      if (r.rateSource === "usd-peg" && pegs[r.currency]) await saveRegion(r.id, { perGbp: Number((usd * pegs[r.currency]!).toFixed(4)), rateCheckedAt: checked });
    }
    return { ok: true, message: `Rates updated from the European Central Bank (${data.date ?? "latest"}); AED and SAR from their US dollar pegs.` };
  } catch {
    return { ok: false, message: "Couldn't reach the rate provider. The stored rates are unchanged." };
  }
}
