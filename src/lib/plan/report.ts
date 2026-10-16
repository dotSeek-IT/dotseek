import { pricingMeta, stageById, tierById } from "@/content/pricing";
import type { Plan } from "./build";
import type { ReferenceAnalysis } from "./referenceFeatures";
import type { Money } from "@/lib/currency/money";
import { gbp, gbpRange, perMonth, weeks } from "./format";

/**
 * Report input shared by the enquiry emails, plus the plain-text summary used
 * in their text parts. The HTML quotation lives in quotationEmail.ts.
 */

export type ReportBrief = {
  title?: string;
  overview?: string;
  architecture?: string;
  advice?: { message: string }[];
};

export type ReportInput = {
  plan: Plan;
  offer?: { label: string; price: number; standard: number; eligible?: boolean };
  negotiation?: { preferredBudget?: number; note?: string };
  reference?: ReferenceAnalysis;
  rows: { label: string; value: string }[];
  brief?: ReportBrief;
  solutionTitle: string;
  ref?: string;
  date?: string;
};

/** Short plain-text summary for email text parts. */
export function planReportText({ plan, solutionTitle }: Pick<ReportInput, "plan" | "solutionTitle">, money?: Money): string {
  const uk = plan.markets.find((m) => m.id === "uk")!;
  const fmt = money?.fmt ?? gbp;
  const total = money?.total ?? gbp;
  const month = money?.perMonth ?? perMonth;
  const region = money?.region;
  return [
    `${pricingMeta.label}: ${solutionTitle}`,
    ...(region && !money.isGbp ? [`Currency: ${region.currency} (1 GBP = ${region.perGbp} ${region.currency}, rate checked ${region.rateCheckedAt.slice(0, 10)})`] : []),
    `Recommended architecture: ${tierById(plan.recommendedTier)!.name}${plan.tier !== plan.recommendedTier ? ` (selected: ${tierById(plan.tier)!.name})` : ""}`,
    ...plan.lines.map((l) => `- ${l.label}: ${fmt(l.cost)}`),
    `Estimate: minimum ${total(plan.estimate.min)}, recommended ${total(plan.estimate.recommended)}, maximum ${total(plan.estimate.max)} (${weeks(plan.weeks)})`,
    ...(money && !money.isGbp ? [`Reference value: approximately ${money.ref(plan.estimate.recommended)?.replace("≈ ", "")}`] : []),
    `Recommended stage: ${stageById(plan.stage)!.name}`,
    `Running costs: ${month(plan.monthly.running)}, maintenance: ${month(plan.monthly.maintenance)}`,
    `Typical UK agency range: ${gbpRange(uk.agencyGbp)}`,
    region ? region.taxNote : "",
    pricingMeta.disclaimer,
  ]
    .filter(Boolean)
    .join("\n");
}

