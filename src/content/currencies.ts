/**
 * Display currencies and stored exchange rates (units per £1). One source for
 * the market comparison and the "≈ local amount" shown next to GBP prices.
 * Quotes, emails and invoices are always in GBP; these are a guide only.
 * Review the rates regularly and update `ratesReviewed`.
 */

export type DisplayCurrencyId = "us" | "eu" | "ae" | "sa" | "kw" | "in";

export type DisplayCurrency = {
  id: DisplayCurrencyId;
  name: string;
  currency: string;
  locale: string;
  perGbp: number;
  /** ISO 3166-1 alpha-2 countries that default to this currency. */
  countries: string[];
};

export const ratesReviewed = "October 2026";

export const displayCurrencies: DisplayCurrency[] = [
  { id: "us", name: "US dollar", currency: "USD", locale: "en-US", perGbp: 1.27, countries: ["US"] },
  {
    id: "eu",
    name: "Euro",
    currency: "EUR",
    locale: "en-IE",
    perGbp: 1.17,
    // Euro area members.
    countries: ["AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES"],
  },
  { id: "ae", name: "UAE dirham", currency: "AED", locale: "en-AE", perGbp: 4.65, countries: ["AE"] },
  { id: "sa", name: "Saudi riyal", currency: "SAR", locale: "en-SA", perGbp: 4.75, countries: ["SA"] },
  { id: "kw", name: "Kuwaiti dinar", currency: "KWD", locale: "en-KW", perGbp: 0.39, countries: ["KW"] },
  { id: "in", name: "Indian rupee", currency: "INR", locale: "en-IN", perGbp: 106, countries: ["IN"] },
];

export const currencyById = (id?: string | null) => displayCurrencies.find((c) => c.id === id) ?? null;

/** The display currency for a visitor's country, or null for the UK and anywhere else (GBP only). */
export const currencyForCountry = (country?: string | null) =>
  country ? (displayCurrencies.find((c) => c.countries.includes(country.toUpperCase())) ?? null) : null;

/** A GBP amount in the display currency, rounded to three significant figures (it's a guide, not a price). */
export function localValue(gbp: number, currency: DisplayCurrency): number {
  const value = gbp * currency.perGbp;
  if (value <= 0) return 0;
  const step = 10 ** Math.max(0, Math.floor(Math.log10(value)) - 2);
  return Math.round(value / step) * step;
}

export function formatLocal(gbp: number, currency: DisplayCurrency): string {
  return new Intl.NumberFormat(currency.locale, { style: "currency", currency: currency.currency, maximumFractionDigits: 0 }).format(localValue(gbp, currency));
}

/** One line for documents: the quote is in GBP, here's the approximate local amount and the rate used. */
export const localNote = (gbp: number, currency: DisplayCurrency) =>
  `Approx. ${formatLocal(gbp, currency)} at ${currency.perGbp} ${currency.currency} per GBP (stored rate, reviewed ${ratesReviewed}). The quotation is in GBP.`;
