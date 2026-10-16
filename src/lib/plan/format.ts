import type { Range } from "@/content/pricing";

/**
 * Money and range formatting for the solution plan. Amounts are GBP from the
 * pricing engine; in the browser they are shown in the visitor's market
 * currency (regional factor x exchange rate) once `setDisplayMoney` is called
 * by the currency selector. On the server (emails, portal pages) this stays
 * GBP: server code formats explicitly with the quotation's own Money.
 */

type DisplayMoney = { fmt: (gbp: number) => string; range: (r: Range) => string; perMonth: (r: Range) => string };
let display: DisplayMoney | null = null;

/** Browser only: show every plan amount in this currency (null = GBP). */
export const setDisplayMoney = (money: DisplayMoney | null) => {
  display = money;
};

const gbpText = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

export const gbp = (n: number) => (display ? display.fmt(n) : gbpText(n));

export const gbpRange = ([a, b]: Range) => (display ? display.range([a, b]) : a === b ? gbpText(a) : `${gbpText(a)}–${gbpText(b)}`);

export const perMonth = (r: Range) => (display ? display.perMonth(r) : r[1] === 0 ? "£0" : `${gbpRange(r)}/month`);

export const money = (n: number, currency: string, locale: string) =>
  new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

export const moneyRange = ([a, b]: Range, currency: string, locale: string) => `${money(a, currency, locale)}–${money(b, currency, locale)}`;

export const weeks = ([a, b]: Range) => (a === b ? `${a} week${a === 1 ? "" : "s"}` : `${a}–${b} weeks`);

export const ratingLabel = (r: number) => ["None", "Low", "Medium", "High"][r] ?? "";
