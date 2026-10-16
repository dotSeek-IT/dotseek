import { APP_MANAGED, includes, solutionOf, type Answers } from "@/content/enquiryFlows";
import type { SolutionId } from "@/content/solutions";
import type { PackageFamily } from "@/content/pricing";

/**
 * Requirement signals: what the answers say about scale, data, security and
 * growth, in a form the architecture rules can use. Pure and shared by the
 * browser (live plan) and the server (validated plan on submit).
 */

export type Signals = {
  solution: SolutionId;
  family: PackageFamily;
  /** 0: under 500, 1: 500 to 5k, 2: 5k to 50k, 3: over 50k monthly users. */
  usersTier: number;
  /** 0: 1 to 5, 1: 6 to 25, 2: 26 to 100, 3: over 100 team users. */
  staffTier: number;
  regions: "uk" | "europe" | "middle_east" | "worldwide";
  files: { documents: boolean; images: boolean; video: boolean; bulk: boolean };
  realtime: boolean;
  /** 0: outages acceptable, 1: business hours, 2: 24/7 critical. */
  availability: number;
  security: { personal: boolean; payments: boolean; sensitive: boolean; sso: boolean; mfa: boolean; audit: boolean };
  /** 0: same, 1: steady, 2: fast. */
  growth: number;
  /** Customers or the public use the system (not only staff). */
  publicUsers: boolean;
  /** Budget range from the answers, in GBP (a typed amount becomes [0, amount]). */
  budget?: [number, number];
  /** 0: new business or idea, 1: established, 2: growing and scaling. */
  bizStage: number;
  /** 0: just me ... 4: over 250 people. */
  bizSize: number;
  /** The product is a mobile app only (no web app): the app is the core. */
  mobileOnly: boolean;
  /** A mobile-only app on Firebase / Supabase instead of a custom backend (Basic app version). */
  managedBackend: boolean;
};

const BUDGETS: Record<string, [number, number]> = {
  "Under £300": [0, 300],
  "£300 to £1,000": [300, 1000],
  "£1,000 to £3,000": [1000, 3000],
  "£3,000 to £10,000": [3000, 10000],
  "Over £10,000": [10000, Infinity],
};

/** The budget mapped to GBP by the chat ("min-max" or "min-inf", from the visitor's local brackets). */
export function parseBudgetGbp(value?: string): [number, number] | undefined {
  const m = value?.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?|inf)$/);
  if (!m) return undefined;
  return [Number(m[1]), m[2] === "inf" ? Infinity : Number(m[2])];
}

/** Budget from a range option or a typed amount such as "£1,500" or "1500". */
export function parseBudget(answer?: string): [number, number] | undefined {
  if (!answer) return undefined;
  if (answer in BUDGETS) return BUDGETS[answer];
  const match = answer.replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s*(k)?/i);
  if (!match) return undefined;
  const amount = Number(match[1]) * (match[2] ? 1000 : 1);
  return amount > 0 ? [0, amount] : undefined;
}

const pick = <T,>(value: string | undefined, map: Record<string, T>, fallback: T): T =>
  value !== undefined && value in map ? map[value] : fallback;

export const familyOf = (solution: SolutionId): PackageFamily =>
  (
    {
      website: "product",
      software: "product",
      ai_agent: "agent",
      ai_chatbot: "assistant",
      automation: "automation",
      integration: "integration",
      data: "data",
    } as const
  )[solution];

export function readSignals(answers: Answers): Signals {
  const solution = solutionOf(answers) ?? "website";
  const sec = answers.ops_security;
  const files = answers.ops_files;

  const publicUsers =
    solution === "website" ||
    solution === "ai_chatbot" ||
    includes(answers.sw_user_types, "Customers") ||
    answers.sw_users === "Customers (public)" ||
    includes(answers.data_audience, "Clients");

  const bizSize = pick(answers.biz_size, { "Just me": 0, "2 to 10": 1, "11 to 50": 2, "51 to 250": 3, "Over 250": 4 }, 1);
  return {
    solution,
    family: familyOf(solution),
    bizStage: pick(answers.biz_stage, { "New business or idea": 0, "Established business": 1, "Growing and scaling": 2 }, 1),
    bizSize,
    mobileOnly: solution === "software" && (answers.sw_type === "A mobile app (iOS / Android)" || answers.sw_platform === "Mobile (iOS / Android)"),
    managedBackend: answers.app_backend === APP_MANAGED,
    usersTier: pick(answers.ops_users, { "Under 500": 0, "500 to 5,000": 1, "5,000 to 50,000": 2, "Over 50,000": 3 }, answers.ops_users ? 1 : 0),
    staffTier: pick(answers.ops_staff, { "1 to 5": 0, "6 to 25": 1, "26 to 100": 2, "Over 100": 3 }, Math.max(0, bizSize - 1)),
    regions: pick(
      answers.ops_regions,
      { "Mainly the UK": "uk", "UK and Europe": "europe", "Middle East": "middle_east", Worldwide: "worldwide" } as const,
      "uk",
    ),
    files: {
      documents: includes(files, "Documents & PDFs"),
      images: includes(files, "Images"),
      video: includes(files, "Video"),
      bulk: includes(files, "Large data exports or backups"),
    },
    realtime: answers.ops_realtime === "Yes" || answers.data_refresh === "Real time",
    availability: pick(
      answers.ops_availability,
      { "We can live with short outages": 0, "Important during business hours": 1, "Critical, it must run 24/7": 2 },
      answers.ops_availability ? 1 : 0,
    ),
    security: {
      personal: includes(sec, "Personal or customer data (UK GDPR)"),
      payments: includes(sec, "Payments or financial data"),
      sensitive: includes(sec, "Health or other sensitive data"),
      sso: includes(sec, "Staff sign in with Microsoft or Google (SSO)"),
      mfa: includes(sec, "Two step login (MFA)"),
      audit: includes(sec, "Full audit trail of changes"),
    },
    growth: pick(answers.ops_growth, { "About the same": 0, "Steady growth": 1, "Fast growth, we're scaling up": 2 }, answers.biz_stage === "Growing and scaling" ? 2 : 1),
    publicUsers,
    budget: parseBudgetGbp(answers.budget_gbp) ?? parseBudget(answers.budget),
  };
}

export const regionLabel: Record<Signals["regions"], string> = {
  uk: "mainly the UK",
  europe: "the UK and Europe",
  middle_east: "the Middle East",
  worldwide: "several countries",
};
