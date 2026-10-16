import { defaultRegions, type Region } from "@/content/regions";

/** [low, high] in GBP (same shape as the pricing engine's Range). */
type Range = [number, number];

/** Euro-area visitors see their own country's number style (e.g. "2.700,00 €" in Germany). */
const EURO_LOCALES: Record<string, string> = {
  AT: "de-AT", BE: "nl-BE", HR: "hr-HR", CY: "el-CY", EE: "et-EE", FI: "fi-FI", FR: "fr-FR", DE: "de-DE", GR: "el-GR", IE: "en-IE",
  IT: "it-IT", LV: "lv-LV", LT: "lt-LT", LU: "fr-LU", MT: "en-MT", NL: "nl-NL", PT: "pt-PT", SK: "sk-SK", SI: "sl-SI", ES: "es-ES",
};

export const localeFor = (region: Region, country?: string | null) =>
  region.currency === "EUR" && country && EURO_LOCALES[country] ? EURO_LOCALES[country] : region.locale;

/** The region for a country (the "*" fallback when it isn't configured). */
export function regionForCountry(country: string | null | undefined, regions: Region[] = defaultRegions): Region {
  const code = country?.toUpperCase();
  return (code && regions.find((r) => r.countries.includes(code))) || regions.find((r) => r.countries.includes("*")) || regions[0]!;
}

export type Money = {
  region: Region;
  /** True when the customer currency is GBP (no reference value needed). */
  isGbp: boolean;
  /** GBP base -> customer amount (factor x rate, rounded). */
  toLocal: (gbp: number) => number;
  /** Customer amount -> GBP base (e.g. a typed budget). */
  toGbp: (local: number) => number;
  fmt: (gbp: number) => string;
  /** Project totals: like fmt, but never below the region's minimum project price. */
  total: (gbp: number) => string;
  range: (r: Range) => string;
  perMonth: (r: Range) => string;
  /** Format an amount already in the customer currency. */
  fmtLocal: (local: number) => string;
  /** "≈ £640" reference (the commercial value in GBP), or null when the currency is GBP. */
  ref: (gbp: number) => string | null;
};

const gbpText = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

export function makeMoney(region: Region, country?: string | null): Money {
  const locale = localeFor(region, country);
  const factorRate = region.priceFactor * region.perGbp;
  const round = (v: number) => (v <= 0 ? 0 : Math.max(region.roundTo, Math.round(v / region.roundTo) * region.roundTo));
  const nf = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: region.currency,
    currencyDisplay: region.symbol === region.currency ? "code" : "narrowSymbol",
    minimumFractionDigits: region.decimals,
    maximumFractionDigits: region.decimals,
  });
  const fmtLocal = (local: number) => (local === 0 ? nf.format(0) : nf.format(local));
  const toLocal = (gbp: number) => (gbp <= 0 ? 0 : round(gbp * factorRate));
  const fmt = (gbp: number) => fmtLocal(toLocal(gbp));
  const range = ([a, b]: Range) => (a === b ? fmt(a) : `${fmt(a)}–${fmt(b)}`);
  const isGbp = region.currency === "GBP";
  return {
    region,
    isGbp,
    toLocal,
    toGbp: (local: number) => (factorRate > 0 ? local / factorRate : local),
    fmt,
    total: (gbp: number) => fmtLocal(Math.max(region.minProject, toLocal(gbp))),
    range,
    perMonth: (r: Range) => (r[1] === 0 ? fmt(0) : `${range(r)}/month`),
    fmtLocal,
    ref: (gbp: number) => (isGbp ? null : `≈ ${gbpText(gbp * region.priceFactor)}`),
  };
}

/** Everything stored with a quotation so it can always be shown exactly as the customer saw it. */
export type CurrencySnapshot = {
  baseCurrency: "GBP";
  /** Recommended estimate from the GBP pricing engine (before the regional factor). */
  baseGbp: number;
  regionId: string;
  regionalFactor: number;
  customerCurrency: string;
  /** Customer currency units per GBP 1, as used for this quotation. */
  exchangeRate: number;
  /** Recommended estimate as shown to the customer, in their currency. */
  convertedAmount: number;
  rateCheckedAt: string;
  rateSource: Region["rateSource"];
  detectedCountry: string | null;
  selection: "auto" | "manual";
  invoiceCurrency: string;
  /** The region settings at the time (formatting, rounding, tax wording), so later admin edits don't change it. */
  region: Region;
};

export function snapshotFor(region: Region, baseGbp: number, detectedCountry: string | null, selection: "auto" | "manual"): CurrencySnapshot {
  const money = makeMoney(region, detectedCountry);
  return {
    baseCurrency: "GBP",
    baseGbp: Math.round(baseGbp),
    regionId: region.id,
    regionalFactor: region.priceFactor,
    customerCurrency: region.currency,
    exchangeRate: region.perGbp,
    convertedAmount: Math.max(region.minProject, money.toLocal(baseGbp)),
    rateCheckedAt: region.rateCheckedAt,
    rateSource: region.rateSource,
    detectedCountry,
    selection,
    invoiceCurrency: region.invoiceCurrency,
    region,
  };
}

/** Money for a stored quotation (its own region settings), or GBP for older enquiries. */
export const moneyForSnapshot = (snapshot?: CurrencySnapshot | null) =>
  makeMoney(snapshot?.region ?? defaultRegions[0]!, snapshot?.detectedCountry);

/** The contract line for a quote shown in another currency than it is invoiced in. */
export function invoiceNote(region: Region): string | null {
  if (region.currency === region.invoiceCurrency) return null;
  return `Prices are displayed in ${region.currency} for convenience. The final contractual and invoiced amount will be confirmed in ${region.invoiceCurrency} unless otherwise agreed.`;
}

export const formatRateDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });

/** "1 GBP = ₹106.25" */
export const rateText = (region: Region) =>
  `1 GBP = ${new Intl.NumberFormat(region.locale, { style: "currency", currency: region.currency, currencyDisplay: region.symbol === region.currency ? "code" : "narrowSymbol", maximumFractionDigits: 4 }).format(region.perGbp)}`;

/**
 * "Typical agency" comparison for the visitor's own market when it has market data (in its local
 * currency, no regional factor: these are other providers' prices), else the UK.
 */
export function agencyComparison(
  markets: { id: string; name: string; agency: Range; agencyGbp: Range }[],
  money: Money,
): { label: string; value: string } {
  const local = money.region.currency !== "GBP" ? markets.find((m) => m.id === money.region.id) : undefined;
  if (!local) {
    const uk = markets.find((m) => m.id === "uk") ?? markets[0]!;
    return { label: "Typical UK agency", value: money.range(uk.agencyGbp) };
  }
  const step = money.region.roundTo;
  const r = (v: number) => money.fmtLocal(Math.round(v / step) * step);
  return { label: `Typical agency (${local.name})`, value: `${r(local.agency[0])}–${r(local.agency[1])}` };
}
