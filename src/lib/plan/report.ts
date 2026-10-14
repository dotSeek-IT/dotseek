import { pricingMeta, stageById, tierById } from "@/content/pricing";
import type { Plan } from "./build";
import type { ReferenceAnalysis } from "./referenceFeatures";
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
export function planReportText({ plan, solutionTitle }: Pick<ReportInput, "plan" | "solutionTitle">): string {
  const uk = plan.markets.find((m) => m.id === "uk")!;
  return [
    `${pricingMeta.label}: ${solutionTitle}`,
    `Recommended architecture: ${tierById(plan.recommendedTier)!.name}${plan.tier !== plan.recommendedTier ? ` (selected: ${tierById(plan.tier)!.name})` : ""}`,
    ...plan.lines.map((l) => `- ${l.label}: ${gbp(l.cost)}`),
    `Estimate: minimum ${gbp(plan.estimate.min)}, recommended ${gbp(plan.estimate.recommended)}, maximum ${gbp(plan.estimate.max)} (${weeks(plan.weeks)})`,
    `Recommended stage: ${stageById(plan.stage)!.name}`,
    `Running costs: ${perMonth(plan.monthly.running)}; maintenance: ${perMonth(plan.monthly.maintenance)}`,
    `Typical UK agency range: ${gbpRange(uk.agencyGbp)}`,
    pricingMeta.disclaimer,
  ].join("\n");
}

