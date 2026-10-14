import type { Range } from "@/content/pricing";

/** Money and range formatting for the solution plan (GBP unless stated). */

export const gbp = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

export const gbpRange = ([a, b]: Range) => (a === b ? gbp(a) : `${gbp(a)}–${gbp(b)}`);

export const perMonth = (r: Range) => (r[1] === 0 ? "£0" : `${gbpRange(r)}/month`);

export const money = (n: number, currency: string, locale: string) =>
  new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

export const moneyRange = ([a, b]: Range, currency: string, locale: string) => `${money(a, currency, locale)}–${money(b, currency, locale)}`;

export const weeks = ([a, b]: Range) => (a === b ? `${a} week${a === 1 ? "" : "s"}` : `${a}–${b} weeks`);

export const ratingLabel = (r: number) => ["None", "Low", "Medium", "High"][r] ?? "";
