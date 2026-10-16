/**
 * Default pricing regions (the admin "Pricing regions" page can override any
 * field; overrides are stored with the enquiry data). The pricing engine works
 * in GBP: a customer price is GBP base x regional factor x exchange rate,
 * rounded for the market. Currency conversion and regional pricing are
 * separate: the rate converts value, the factor changes the commercial price.
 */

export type BudgetBracket = { label: string; min: number; max: number | null };

export type Region = {
  id: string;
  name: string;
  /** ISO 3166-1 alpha-2 countries that use this region; "*" marks the fallback. */
  countries: string[];
  currency: string;
  symbol: string;
  /** Number formatting locale; the euro region formats per visitor country (see localeFor). */
  locale: string;
  /** Local currency units per GBP 1. */
  perGbp: number;
  rateSource: "fixed" | "ecb" | "usd-peg" | "manual";
  /** ISO date-time the rate was last checked. */
  rateCheckedAt: string;
  /** Commercial price factor for this market (1 = same price as the UK). */
  priceFactor: number;
  /** Smallest project total shown, in local currency (0 = none). */
  minProject: number;
  /** Round shown amounts to this many local units. */
  roundTo: number;
  /** Decimal places when formatting (e.g. 2 for "€2.700,00"). */
  decimals: number;
  /** Budget question options, in local currency (max null = open-ended). */
  budgets: BudgetBracket[];
  taxNote: string;
  /** Currency DotSeek invoices in for this market. */
  invoiceCurrency: string;
};

const CHECKED = "2026-10-16T00:00:00.000Z";
const EURO = ["AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES"];

export const defaultRegions: Region[] = [
  {
    id: "uk", name: "United Kingdom", countries: ["GB"], currency: "GBP", symbol: "£", locale: "en-GB",
    perGbp: 1, rateSource: "fixed", rateCheckedAt: CHECKED, priceFactor: 1, minProject: 0, roundTo: 1, decimals: 0,
    budgets: [
      { label: "Under £300", min: 0, max: 300 },
      { label: "£300 to £1,000", min: 300, max: 1000 },
      { label: "£1,000 to £3,000", min: 1000, max: 3000 },
      { label: "£3,000 to £10,000", min: 3000, max: 10000 },
      { label: "Over £10,000", min: 10000, max: null },
    ],
    taxNote: "Prices exclude VAT where applicable.",
    invoiceCurrency: "GBP",
  },
  {
    id: "in", name: "India", countries: ["IN"], currency: "INR", symbol: "₹", locale: "en-IN",
    perGbp: 106.25, rateSource: "ecb", rateCheckedAt: CHECKED, priceFactor: 1, minProject: 0, roundTo: 500, decimals: 0,
    budgets: [
      { label: "Under ₹25,000", min: 0, max: 25000 },
      { label: "₹25,000 to ₹50,000", min: 25000, max: 50000 },
      { label: "₹50,000 to ₹1 lakh", min: 50000, max: 100000 },
      { label: "₹1 lakh to ₹3 lakh", min: 100000, max: 300000 },
      { label: "₹3 lakh to ₹5 lakh", min: 300000, max: 500000 },
      { label: "Over ₹5 lakh", min: 500000, max: null },
    ],
    taxNote: "Applicable taxes, including GST where required, will be confirmed on the final invoice.",
    invoiceCurrency: "GBP",
  },
  {
    id: "ae", name: "United Arab Emirates", countries: ["AE"], currency: "AED", symbol: "AED", locale: "en-AE",
    perGbp: 4.66, rateSource: "usd-peg", rateCheckedAt: CHECKED, priceFactor: 1, minProject: 0, roundTo: 50, decimals: 0,
    budgets: [
      { label: "Under AED 1,500", min: 0, max: 1500 },
      { label: "AED 1,500 to AED 5,000", min: 1500, max: 5000 },
      { label: "AED 5,000 to AED 15,000", min: 5000, max: 15000 },
      { label: "AED 15,000 to AED 50,000", min: 15000, max: 50000 },
      { label: "Over AED 50,000", min: 50000, max: null },
    ],
    taxNote: "VAT may apply where applicable.",
    invoiceCurrency: "GBP",
  },
  {
    id: "sa", name: "Saudi Arabia", countries: ["SA"], currency: "SAR", symbol: "SAR", locale: "en-SA",
    perGbp: 4.76, rateSource: "usd-peg", rateCheckedAt: CHECKED, priceFactor: 1, minProject: 0, roundTo: 50, decimals: 0,
    budgets: [
      { label: "Under SAR 1,500", min: 0, max: 1500 },
      { label: "SAR 1,500 to SAR 5,000", min: 1500, max: 5000 },
      { label: "SAR 5,000 to SAR 15,000", min: 5000, max: 15000 },
      { label: "SAR 15,000 to SAR 50,000", min: 15000, max: 50000 },
      { label: "Over SAR 50,000", min: 50000, max: null },
    ],
    taxNote: "Applicable taxes, if any, will be confirmed before invoicing.",
    invoiceCurrency: "GBP",
  },
  {
    id: "kw", name: "Kuwait", countries: ["KW"], currency: "KWD", symbol: "KWD", locale: "en-KW",
    perGbp: 0.39, rateSource: "manual", rateCheckedAt: CHECKED, priceFactor: 1, minProject: 0, roundTo: 5, decimals: 0,
    budgets: [
      { label: "Under KWD 100", min: 0, max: 100 },
      { label: "KWD 100 to KWD 400", min: 100, max: 400 },
      { label: "KWD 400 to KWD 1,200", min: 400, max: 1200 },
      { label: "KWD 1,200 to KWD 4,000", min: 1200, max: 4000 },
      { label: "Over KWD 4,000", min: 4000, max: null },
    ],
    taxNote: "Applicable taxes, if any, will be confirmed before invoicing.",
    invoiceCurrency: "GBP",
  },
  {
    id: "us", name: "United States", countries: ["US"], currency: "USD", symbol: "$", locale: "en-US",
    perGbp: 1.27, rateSource: "ecb", rateCheckedAt: CHECKED, priceFactor: 1, minProject: 0, roundTo: 10, decimals: 0,
    budgets: [
      { label: "Under $500", min: 0, max: 500 },
      { label: "$500 to $1,500", min: 500, max: 1500 },
      { label: "$1,500 to $5,000", min: 1500, max: 5000 },
      { label: "$5,000 to $15,000", min: 5000, max: 15000 },
      { label: "Over $15,000", min: 15000, max: null },
    ],
    taxNote: "Applicable taxes, if any, will be confirmed before invoicing.",
    invoiceCurrency: "GBP",
  },
  {
    id: "eu", name: "Euro area", countries: EURO, currency: "EUR", symbol: "€", locale: "en-IE",
    perGbp: 1.17, rateSource: "ecb", rateCheckedAt: CHECKED, priceFactor: 1, minProject: 0, roundTo: 10, decimals: 2,
    budgets: [
      { label: "Under €400", min: 0, max: 400 },
      { label: "€400 to €1,200", min: 400, max: 1200 },
      { label: "€1,200 to €3,500", min: 1200, max: 3500 },
      { label: "€3,500 to €12,000", min: 3500, max: 12000 },
      { label: "Over €12,000", min: 12000, max: null },
    ],
    taxNote: "Applicable taxes, if any, will be confirmed before invoicing.",
    invoiceCurrency: "GBP",
  },
  {
    id: "intl", name: "International (other countries)", countries: ["*"], currency: "GBP", symbol: "£", locale: "en-GB",
    perGbp: 1, rateSource: "fixed", rateCheckedAt: CHECKED, priceFactor: 1, minProject: 0, roundTo: 1, decimals: 0,
    budgets: [
      { label: "Under £300", min: 0, max: 300 },
      { label: "£300 to £1,000", min: 300, max: 1000 },
      { label: "£1,000 to £3,000", min: 1000, max: 3000 },
      { label: "£3,000 to £10,000", min: 3000, max: 10000 },
      { label: "Over £10,000", min: 10000, max: null },
    ],
    taxNote: "Applicable taxes, if any, will be confirmed before invoicing.",
    invoiceCurrency: "GBP",
  },
];
