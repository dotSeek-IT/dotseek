import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { answerRows, type Answers } from "@/content/enquiryFlows";
import { solutionById, solutionCatalogue, type SolutionId } from "@/content/solutions";
import { ITEM_IDS, itemById, tierById } from "@/content/pricing";
import type { Plan } from "@/lib/plan/build";
import { REFERENCE_FEATURE_IDS, type ReferenceAnalysis, type ReferenceFeature } from "@/lib/plan/reference";
import type { ReferenceSignals } from "@/lib/reference/analyse";
import { anthropicClient, FALLBACK, MODEL } from "./http";
import { SYSTEM_PROMPT } from "./systemPrompt";

/**
 * Structured AI steps of the enquiry, both grounded in the same system prompt
 * (and its prompt cache) as the chat:
 * - recommend: picks the best DotSeek solution for a described problem.
 * - summarise: turns answers into a structured project brief with suggestions.
 * Both return null on any failure so callers can fall back gracefully.
 */

const SOLUTION_IDS = solutionCatalogue.map((s) => s.id) as [SolutionId, ...SolutionId[]];

const Recommendation = z.object({
  solution: z.enum(SOLUTION_IDS),
  reason: z.string(),
  suggestions: z.array(z.string()),
});
export type Recommendation = z.infer<typeof Recommendation>;

const Summary = z.object({
  title: z.string(),
  recommendedSolution: z.string(),
  overview: z.string(),
  suggestedFeatures: z.array(z.string()),
  suggestedTechnology: z.array(z.string()),
  openQuestions: z.array(z.string()),
  architecture: z.string(),
  advice: z.array(
    z.object({
      item: z.enum(ITEM_IDS as [string, ...string[]]).nullable(),
      action: z.enum(["add", "remove", "info"]),
      message: z.string(),
    }),
  ),
});
export type Summary = z.infer<typeof Summary>;

const system: Anthropic.Beta.BetaTextBlockParam[] = [
  { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
];

export async function recommendSolution(problem: string): Promise<Recommendation | null> {
  const client = anthropicClient();
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    output_config: { effort: "low", format: betaZodOutputFormat(Recommendation) },
    ...FALLBACK,
    system,
    messages: [
      {
        role: "user",
        content: `A website visitor described this business problem:\n<problem>\n${problem}\n</problem>\n\nChoose the single DotSeek solution that fits best. Write "reason" as one or two sentences addressed to the visitor explaining why. Give 2 to 4 short "suggestions": concrete features or approaches DotSeek could propose (each under 12 words). Do not invent prices or timelines.`,
      },
    ],
  });
  if (response.stop_reason === "refusal") return null;
  return response.parsed_output ?? null;
}

/** Plain-text view of the calculated plan, so the AI explains real figures and never invents them. */
function planContext(plan: Plan): string {
  const selected = plan.services.filter((s) => s.selected).map((s) => s.label);
  const notNeeded = plan.services.filter((s) => s.status === "not_needed" && s.group !== "product").map((s) => `${s.label}: ${s.reason}`);
  return [
    `Recommended architecture level: ${plan.level} (${tierById(plan.recommendedTier)!.name}). Customer's current choice: ${tierById(plan.tier)!.name}.`,
    `Selected features and services: ${selected.join(", ")}.`,
    `Not recommended at this stage: ${notNeeded.slice(0, 8).join(" | ")}`,
    `Business stage: ${plan.stage}. Indicative development estimate: minimum £${plan.estimate.min.toLocaleString("en-GB")}, recommended £${plan.build.toLocaleString("en-GB")}, maximum £${plan.estimate.max.toLocaleString("en-GB")}, over ${plan.weeks[0]} to ${plan.weeks[1]} weeks. Phases: ${plan.phases.map((p) => `${p.name} £${p.cost}`).join(", ")}. Running costs £${plan.monthly.running[0]} to £${plan.monthly.running[1]} a month, maintenance £${plan.monthly.maintenance[0]} to £${plan.monthly.maintenance[1]} a month.`,
    `Background work: ${plan.backgroundTasks.join(", ") || "none"}. Budget fit: ${plan.budgetFit ?? "no budget given"}.`,
    `Rule-based advice already shown: ${plan.advice.map((a) => a.message).join(" | ") || "none"}.`,
    `Item ids you may reference in advice: ${plan.services.map((s) => `${s.id} (${s.label})`).join(", ")}.`,
  ].join("\n");
}

export async function summariseEnquiry(
  answers: Answers,
  transcript: { role: string; content: string }[] = [],
  plan?: Plan,
): Promise<Summary | null> {
  const solution = solutionById(answers.solution_id ?? "") ?? solutionCatalogue.find((s) => s.label === answers.solution);
  const rows = answerRows(answers)
    .filter((r) => !["name", "email", "phone", "company"].includes(r.id))
    .map((r) => `- ${r.label}: ${r.value}`)
    .join("\n");
  const chat = transcript.length
    ? `\n\nEarlier chat with the visitor:\n${transcript.map((t) => `${t.role}: ${t.content}`).join("\n")}`
    : "";

  const client = anthropicClient();
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 6000,
    output_config: { effort: "medium", format: betaZodOutputFormat(Summary) },
    ...FALLBACK,
    system,
    messages: [
      {
        role: "user",
        content: `Turn this website enquiry into a short project brief and architecture recommendation for the DotSeek team and the customer.\n\nChosen solution: ${solution?.title ?? "Not specified"}\nAnswers:\n${rows}${chat}${plan ? `\n\nDotSeek's pricing engine calculated this plan:\n${planContext(plan)}` : ""}\n\nFields:\n- title: a 4 to 8 word project title.\n- recommendedSolution: the DotSeek solution(s) that fit, in a few words.\n- overview: 2 or 3 plain sentences describing what the customer needs and why.\n- suggestedFeatures: 3 to 6 concrete features DotSeek could propose (each under 14 words).\n- suggestedTechnology: 2 to 5 sensible technology or integration choices, phrased as suggestions to confirm.\n- openQuestions: 2 to 4 questions the team should clarify on the discovery call.\n- architecture: 2 to 4 plain sentences addressed to the customer explaining why this architecture level fits, which services matter most for them and why, and what they do not need yet (for example why Kubernetes or several regions would be more than they need). Recommend the right architecture, not the most expensive one.\n- advice: 1 to 4 consultant recommendations addressed to the customer. Be honest about things they may not need yet (for example "you may not need a mobile app in Phase 1, and a responsive web app could reduce the initial cost"), cheaper ways to start, or something important that is missing. Set item to the catalogue id the advice is about and action to "remove" or "add" when the customer could act on it with one click, otherwise item null and action "info". Do not repeat the rule-based advice.\nBase everything on the answers and the calculated plan. Never state prices or figures other than those given above, and never promise timelines or results. British English, no em dashes, no semicolons and no hyphens joining words.`,
      },
    ],
  });
  if (response.stop_reason === "refusal") return null;
  const out = response.parsed_output;
  if (!out) return null;
  // Drop advice that points at items that make no sense to toggle.
  out.advice = out.advice.filter((a) => a.item === null || Boolean(itemById(a.item))).slice(0, 4);
  return out;
}

// ---------- Reference URL analysis ----------

const ReferenceOut = z.object({
  kind: z.enum(["website", "webapp", "saas", "ecommerce", "mobile"]),
  pages: z.number(),
  design: z.enum(["simple", "moderate", "rich"]),
  animations: z.enum(["none", "some", "heavy"]),
  features: z.object(Object.fromEntries(REFERENCE_FEATURE_IDS.map((f) => [f, z.boolean()])) as Record<ReferenceFeature, z.ZodBoolean>),
  summary: z.string(),
  costDrivers: z.string(),
});

/**
 * Refines the rule-based reading of a reference page into a likely scope.
 * The AI sees only extracted public signals and visible text, and must never
 * suggest copying the reference.
 */
export async function analyseReferenceWithAI(signals: ReferenceSignals): Promise<Omit<ReferenceAnalysis, "url" | "host" | "title" | "services" | "evidence" | "responsive" | "source"> | null> {
  const client = anthropicClient();
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    output_config: { effort: "low", format: betaZodOutputFormat(ReferenceOut) },
    ...FALLBACK,
    system,
    messages: [
      {
        role: "user",
        content: `A visitor shared a reference website or app so DotSeek can understand the scope they have in mind. Estimate the likely scope of a solution with similar functionality and complexity.

Reference: ${signals.url} (${signals.title})
Rule-based reading: kind ${signals.kind}; about ${signals.pages} pages; design ${signals.design}; animations ${signals.animations}; platform ${signals.platform ?? "unknown"}; services ${signals.services.join(", ") || "none seen"}.
Evidence: ${signals.evidence.join("; ")}.
Detected features: ${Object.entries(signals.features).filter(([, v]) => v).map(([k]) => k).join(", ") || "none"}.
Visible text (truncated):
<text>
${signals.text}
</text>

Fields:
- kind, pages (distinct pages or screens a similar solution needs, 1 to 200), design, animations.
- features: true only when the reference clearly needs it (feature ids: ${REFERENCE_FEATURE_IDS.join(", ")}).
- summary: 2 or 3 sentences for the visitor describing what the reference does and the likely scope of a similar solution. Say that DotSeek uses references to understand layout style, features and complexity, and builds an original solution with the visitor's own branding and content. Never suggest copying the reference.
- costDrivers: 2 or 3 sentences naming what would drive most of the cost (for example dashboard, custom animation, user accounts, integrations) and how a first phase could cost less while keeping a similar professional design direction.
Do not state prices. British English, no em dashes, no semicolons and no hyphens joining words.`,
      },
    ],
  });
  if (response.stop_reason === "refusal") return null;
  return response.parsed_output ?? null;
}
