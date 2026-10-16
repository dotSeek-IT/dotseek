"use client";

import { useEffect, useMemo, useState } from "react";
import { currentRegion } from "@/components/currency/useRegion";
import {
  CONTACT_STEP_IDS,
  NOT_SURE,
  OPS_INTRO_STEP,
  SHARED_STEP_IDS,
  answerRows,
  nextStep,
  pruneAnswers,
  solutionFromLabel,
  solutionOf,
  stepsFor,
  type Answers,
  type EnquiryStep,
} from "@/content/enquiryFlows";
import { solutionById, solutionCatalogue, type SolutionId } from "@/content/solutions";
import { site } from "@/content/site";
import type { buildPlan, fitToBudget, Plan, PlanChoices } from "@/lib/plan/build";
import type { CostOption, ReferenceAnalysis } from "@/lib/plan/reference";
type ReferenceModule = typeof import("@/lib/plan/reference");
import { gbp } from "@/lib/plan/format";
import type { Offer } from "@/lib/plan/offer";

/**
 * Client state machine for the AI consultation inside the DotSeek Assistant:
 *   asking       -> requirement questions, then scale & operations questions
 *   recommending -> AI is choosing a solution for a described problem
 *   choosing     -> visitor confirms the recommendation or picks a solution
 *   plan         -> AI-generated indicative estimate + architecture builder
 *   asking       -> contact details
 *   review       -> summary with edit buttons, then send
 *   sending / failed
 * The plan is recalculated locally on every change (lib/plan); the AI only
 * explains it. Enquiry messages are tagged kind:"enquiry" by the caller and are
 * never sent to the AI chat endpoint.
 */

export type Recommendation = { solution: SolutionId; reason: string; suggestions: string[] };

export type Brief = {
  title: string;
  recommendedSolution: string;
  overview: string;
  suggestedFeatures: string[];
  suggestedTechnology: string[];
  openQuestions: string[];
  architecture?: string;
  advice?: { item: string | null; action: "add" | "remove" | "info"; message: string }[];
};

export type EnquiryPhase = "reference" | "analysing" | "asking" | "recommending" | "choosing" | "plan" | "review" | "sending" | "failed";

export type EnquiryState = {
  answers: Answers;
  phase: EnquiryPhase;
  /** Step being edited; answering it returns to `returnTo`. */
  editing?: string;
  returnTo?: "plan" | "review";
  recommendation?: Recommendation;
  brief?: Brief;
  briefStatus: "idle" | "loading" | "ready" | "unavailable";
  /** Requirement answers the current brief was written for. */
  briefKey?: string;
  /** Customer's changes to the calculated plan (tier, provider, features on/off). */
  choices: PlanChoices;
  planSeen: boolean;
  consultation: boolean;
  emailCopy: boolean;
  includeTranscript: boolean;
  /** "Request a better price": the customer's preferred budget and note (never promised). */
  negotiation?: { preferredBudget?: number; note?: string };
  /** Reference website or app the customer shared, as analysed. */
  reference?: ReferenceAnalysis;
  /** The full-scope starting point for "cheaper options" (reference-level design effort, or the recommendation). */
  baseChoices: PlanChoices;
  /** The customer's own requirement answers, kept when a cheaper version replaces the working answers. */
  baseAnswers?: Answers;
  error?: string;
};

type BotSay = (text: string, extra?: { links?: { label: string; href: string }[] }) => void;
type UserSay = (text: string) => void;

export const solutionTitle = (id?: string) => solutionById(id ?? "")?.title ?? "project";

/** Short in-sentence name, e.g. "website", "AI agent" (keeps acronyms). */
export const solutionNoun = (id?: string) => {
  const label = solutionById(id ?? "")?.label ?? "project";
  return /^[A-Z]{2}/.test(label) ? label : label.charAt(0).toLowerCase() + label.slice(1);
};

export function enquirySummaryText(answers: Answers, plan?: Plan): string {
  const rows = answerRows(answers).map((r) => `- ${r.label}: ${r.value}`);
  if (plan) rows.push(`- Indicative estimate: ${gbp(plan.build)} (AI-generated, to be confirmed)`);
  return rows.join("\n");
}

export function enquiryMailto(answers: Answers, plan?: Plan): string {
  const subject = `Website enquiry: ${solutionTitle(answers.solution_id ?? solutionFromLabel(answers.solution ?? ""))}`;
  const body = enquirySummaryText(answers, plan).replace(/^- /gm, "");
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Contact answers only. */
const contactOf = (answers: Answers) => Object.fromEntries(Object.entries(answers).filter(([k]) => CONTACT_STEP_IDS.includes(k)));

/** Requirement answers only (contact details don't change the brief). */
const briefKeyOf = (answers: Answers) =>
  JSON.stringify(
    Object.entries(answers)
      .filter(([k]) => !CONTACT_STEP_IDS.includes(k))
      .sort(),
  );

const fresh = (): EnquiryState => ({
  answers: {},
  phase: "asking",
  briefStatus: "idle",
  choices: {},
  baseChoices: {},
  planSeen: false,
  consultation: false,
  emailCopy: true,
  includeTranscript: true,
});

/** The question as said in the chat; optional ones say so, so the Skip button makes sense. */
const ask = (step: EnquiryStep) => (step.optional ? `${step.question} (Optional: answer below, or skip this question.)` : step.question);

/** A budget answer (local bracket label or typed amount, e.g. "₹2 lakh", "80,000") as "min-max" in GBP. */
function budgetToGbp(value: string): string | undefined {
  const { region, money } = currentRegion();
  const g = (local: number) => Math.round(money.toGbp(local));
  const bracket = region.budgets.find((b) => b.label === value);
  if (bracket) return `${g(bracket.min)}-${bracket.max === null ? "inf" : g(bracket.max)}`;
  const m = value.replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s*(k|lakh|lac|crore|cr)?/i);
  if (!m) return undefined;
  const unit = (m[2] ?? "").toLowerCase();
  const amount = Number(m[1]) * (unit === "k" ? 1e3 : unit === "lakh" || unit === "lac" ? 1e5 : unit === "crore" || unit === "cr" ? 1e7 : 1);
  return amount > 0 ? `0-${g(amount)}` : undefined;
}

export function useEnquiry({
  botSay,
  userSay,
  transcript,
  hasTranscript,
}: {
  botSay: BotSay;
  userSay: UserSay;
  /** The AI chat so far (excluding enquiry messages), offered to the team with consent. */
  transcript: () => { role: "user" | "assistant"; content: string }[];
  hasTranscript: boolean;
}) {
  const [state, setState] = useState<EnquiryState | null>(null);

  const currentStep: EnquiryStep | undefined = state
    ? state.editing
      ? stepsFor(state.answers).find((s) => s.id === state.editing)
      : nextStep(state.answers)
    : undefined;

  // The pricing engine is loaded when an enquiry starts, so the chat stays light for everyone else.
  const [engine, setEngine] = useState<{ buildPlan: typeof buildPlan; fitToBudget: typeof fitToBudget; ref: ReferenceModule } | null>(null);
  const started = Boolean(state);
  useEffect(() => {
    if (started && !engine) {
      void Promise.all([import("@/lib/plan/build"), import("@/lib/plan/reference")]).then(([m, ref]) =>
        setEngine({ buildPlan: m.buildPlan, fitToBudget: m.fitToBudget, ref }),
      );
    }
  }, [started, engine]);

  // Admin-configured new-customer offer, fetched once the estimate is shown.
  const [offer, setOffer] = useState<Offer | null>(null);
  const showingPlan = Boolean(state?.planSeen);
  useEffect(() => {
    if (!showingPlan) return;
    let live = true;
    fetch("/api/offer")
      .then((r) => (r.ok ? r.json() : { offer: null }))
      .then((d: { offer: Offer | null }) => live && setOffer(d.offer))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [showingPlan]);

  const answers = state?.answers;
  const choices = state?.choices;
  const showPlan = Boolean(state?.planSeen);
  const plan = useMemo(
    () => (engine && answers && choices && showPlan && solutionOf(answers) ? engine.buildPlan(answers, choices) : undefined),
    [engine, answers, choices, showPlan],
  );

  // Reference card: the full-scope estimate of a similar solution, shown as soon as the analysis is in.
  const reference = state?.reference;
  const baseChoices = state?.baseChoices;
  const fullAnswers = state?.baseAnswers ?? answers;
  const referencePlan = useMemo(
    () => (engine && reference && fullAnswers && baseChoices ? engine.buildPlan(fullAnswers, baseChoices) : undefined),
    [engine, reference, fullAnswers, baseChoices],
  );

  /** Full / Optimised / MVP / Basic versions of the customer's full requirement (computed on demand). */
  const getOptions = (): CostOption[] =>
    engine && state ? engine.ref.costOptions({ ...(state.baseAnswers ?? state.answers), ...contactOf(state.answers) }, state.baseChoices, { fromReference: Boolean(state.reference) }) : [];

  const loadBrief = async (requirement: Answers, planChoices: PlanChoices, key: string) => {
    try {
      const response = await fetch("/api/enquiry/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: requirement, choices: planChoices, transcript: transcript() }),
      });
      if (!response.ok) throw new Error();
      const { summary } = (await response.json()) as { summary: Brief };
      setState((s) => (s && s.briefKey === key ? { ...s, brief: summary, briefStatus: "ready" } : s));
    } catch {
      setState((s) => (s && s.briefKey === key ? { ...s, briefStatus: "unavailable" } : s));
    }
  };

  /** Writes the next state, starting the AI brief when the requirement changed. */
  const commit = (next: EnquiryState) => {
    if (next.phase === "plan" || next.phase === "review") {
      const key = briefKeyOf(next.answers);
      if (next.briefKey !== key) {
        next = { ...next, briefKey: key, brief: undefined, briefStatus: "loading" };
        void loadBrief(next.answers, next.choices, key);
      }
    }
    setState(next);
  };

  /** Moves on from `s` with these answers: next question, recommendation, plan or review. */
  const go = (s: EnquiryState, nextAnswers: Answers) => {
    const pruned = pruneAnswers(nextAnswers);
    const next = nextStep(pruned);
    const wantPlan = !s.planSeen || s.returnTo === "plan";
    const base: EnquiryState = { ...s, answers: pruned, editing: undefined };

    if (next && !(wantPlan && CONTACT_STEP_IDS.includes(next.id))) {
      if (next.id === OPS_INTRO_STEP) {
        botSay("Now a few quick questions about scale and reliability, so I can recommend the right architecture. The closest answer is fine.");
      }
      botSay(ask(next));
      commit({ ...base, phase: "asking" });
      return;
    }
    // "Not sure" with a described problem but no solution yet: get a recommendation.
    if (pruned.solution === NOT_SURE && pruned.problem && !pruned.solution_id) {
      commit({ ...base, phase: "recommending" });
      void recommend(pruned);
      return;
    }
    if (wantPlan) {
      botSay(
        s.planSeen
          ? "I've updated your estimate and architecture."
          : "Thanks. I've prepared an AI-generated indicative estimate with a recommended architecture, package options and a market comparison. Open it to turn features on or off, compare options and see what each choice costs.",
      );
      commit({ ...base, phase: "plan", planSeen: true, returnTo: undefined });
      return;
    }
    botSay("Here's a summary of your enquiry. You can edit any answer before sending it to the DotSeek team.");
    commit({ ...base, phase: "review", returnTo: undefined });
  };

  const recommend = async (requirement: Answers) => {
    try {
      const response = await fetch("/api/enquiry/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem: requirement.problem }),
      });
      if (!response.ok) throw new Error();
      const { recommendation } = (await response.json()) as { recommendation: Recommendation };
      const suggestions = recommendation.suggestions.length
        ? `\n\nIdeas we could explore:\n${recommendation.suggestions.map((s) => `- ${s}`).join("\n")}`
        : "";
      botSay(
        `I'd suggest ${solutionTitle(recommendation.solution)}. ${recommendation.reason}${suggestions}\n\nShall we continue with that, or would you prefer a different solution?`,
      );
      setState((s) => (s ? { ...s, phase: "choosing", recommendation } : s));
    } catch {
      botSay("Thanks. Which of these sounds closest to what you need? If you're unsure, pick the nearest one and the team will advise.");
      setState((s) => (s ? { ...s, phase: "choosing", recommendation: undefined } : s));
    }
  };

  /** "Have a reference website or app?": asks for the link first. */
  const startReference = () => {
    userSay("I have a reference website or app");
    botSay(
      "Great, paste the link below. I'll look at the publicly visible page to understand the layout style, features and likely complexity, then estimate a similar solution and cheaper options. DotSeek builds an original solution with your own branding and content; we never copy another site.",
    );
    setState({ ...fresh(), phase: "reference" });
  };

  /** Analyse the pasted reference, then continue with business and budget questions. */
  const submitReference = async (url: string, from: EnquiryState | null = state, opts: { quiet?: boolean } = {}) => {
    if (!from) return;
    const state = from; // the enquiry being continued (a fresh one when the link came from the normal chat)
    if (!opts.quiet) userSay(url);
    setState({ ...state, phase: "analysing" });
    try {
      const response = await fetch("/api/reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const result = (await response.json().catch(() => ({}))) as { analysis?: ReferenceAnalysis; error?: string };
      if (!response.ok || !result.analysis) throw new Error(result.error || "We couldn't analyse that link.");
      const analysis = result.analysis;
      const ref = engine?.ref ?? (await import("@/lib/plan/reference"));
      const nextAnswers = ref.referenceAnswers(analysis, state.answers);
      const base = ref.referenceChoices(analysis);
      botSay(analysis.summary);
      botSay("A few quick questions about your business and budget, then I'll show the full estimate with cheaper options you can compare.");
      go({ ...state, reference: analysis, baseChoices: base, choices: base }, nextAnswers);
    } catch (error) {
      botSay(`${error instanceof Error ? error.message : "We couldn't analyse that link."} You can try another link, or continue without a reference.`);
      setState({ ...state, phase: "reference" });
    }
  };

  /** A link pasted into the normal chat: treat it as a reference and analyse it straight away. */
  const referenceFromChat = (url: string) => {
    userSay(url);
    botSay(
      "Thanks, I'll use that link as a reference: I'll look at the publicly visible page to understand the layout style, features and likely complexity, then estimate a similar solution and cheaper options. DotSeek builds an original solution with your own branding and content; we never copy another site.",
    );
    void submitReference(url, { ...fresh(), phase: "reference" }, { quiet: true });
  };

  /** Continue the normal consultation without a reference. */
  const skipReference = () => {
    if (!state) return;
    userSay("Continue without a reference");
    go({ ...state, reference: undefined }, {});
  };

  /** Use one of the Full / Optimised / MVP / Basic versions. */
  const applyOption = (option: CostOption) => {
    if (!state) return;
    // A version with its own answers (fewer pages, leaner app, basic site) replaces the working answers;
    // the customer's full requirement stays in baseAnswers so every version can still be compared.
    const base = state.baseAnswers ?? state.answers;
    const working = option.apply.answers ? { ...option.apply.answers, ...contactOf(state.answers) } : base;
    setState({ ...state, baseAnswers: base, answers: working, choices: { ...option.apply.choices, target: undefined } });
  };

  /** "Make this cheaper": the next cheaper version below the current estimate. */
  const makeCheaper = (): string | null => {
    if (!state || !plan) return null;
    const next = getOptions().find((o) => o.id !== "full" && o.plan.estimate.recommended < plan.estimate.recommended * 0.92);
    if (!next) return null;
    applyOption(next);
    return next.name;
  };

  /** Starts an enquiry, optionally pre-routed to a solution (from a page or the AI consultant). */
  const start = (solution?: SolutionId, opts: { announce?: string } = {}) => {
    const initial: Answers = {};
    if (solution) {
      initial.solution = solutionById(solution)?.label ?? "";
      initial.solution_id = solution;
    }
    const noun = solution ? solutionNoun(solution) : "";
    userSay(opts.announce ?? (solution ? `Start ${/^[aeiouAEIOU]/.test(noun) ? "an" : "a"} ${noun} enquiry` : "Start an enquiry"));
    botSay(
      solution
        ? `Great. I'll ask a few questions tailored to your ${noun} project, then prepare an indicative estimate and a recommended architecture you can adjust before anything goes to the team.`
        : "Great, let's shape your project. I'll ask a few questions tailored to what you need, then prepare an indicative estimate and a recommended architecture you can adjust.",
    );
    go(fresh(), initial);
  };

  const answer = (value: string) => {
    if (!state || !currentStep) return;
    const step = currentStep;
    userSay(value || "Skip");
    let nextAnswers: Answers = { ...state.answers, [step.id]: value };
    let nextChoices = state.choices;

    // Budget: answered in the visitor's currency (their market's brackets or a typed amount), mapped to GBP for the engine.
    if (step.id === "budget") {
      const mapped = budgetToGbp(value);
      if (mapped) nextAnswers.budget_gbp = mapped;
      else delete nextAnswers.budget_gbp;
    }

    if (step.id === "solution") {
      // Switching solution: keep shared answers (scale, budget, contact...), drop the old flow and plan choices.
      const shared = Object.fromEntries(Object.entries(state.answers).filter(([k]) => SHARED_STEP_IDS.includes(k)));
      nextAnswers = { ...shared, solution: value };
      const id = solutionFromLabel(value);
      if (id) nextAnswers.solution_id = id;
      if (solutionOf(nextAnswers) !== solutionOf(state.answers)) nextChoices = {};
    }
    const baseAnswers =
      step.id === "solution" ? undefined : CONTACT_STEP_IDS.includes(step.id) || !state.baseAnswers ? state.baseAnswers : { ...state.baseAnswers, [step.id]: value };
    go({ ...state, choices: nextChoices, baseAnswers }, nextAnswers);
  };

  /** Visitor confirms or picks a solution after describing their problem. */
  const choose = (solution: SolutionId) => {
    if (!state) return;
    userSay(solutionTitle(solution));
    const reason = state.recommendation?.solution === solution ? state.recommendation.reason : undefined;
    go(state, { ...state.answers, solution_id: solution, ...(reason ? { recommendation: reason } : {}) });
  };

  const edit = (stepId: string) => {
    if (!state) return;
    const step = stepsFor(state.answers).find((s) => s.id === stepId);
    if (!step) return;
    botSay(`Sure. ${ask(step)}`);
    setState({ ...state, phase: "asking", editing: stepId, returnTo: state.phase === "plan" ? "plan" : "review" });
  };

  /** Leaves an edit without changing the answer. */
  const cancelEdit = () => {
    if (!state?.editing) return;
    userSay("Keep my current answer");
    botSay(state.returnTo === "plan" ? "No problem, nothing changed." : "No problem, nothing changed. Here's your summary again.");
    setState({ ...state, phase: state.returnTo ?? "review", editing: undefined, returnTo: undefined });
  };

  const setChoices = (next: PlanChoices) => setState((s) => (s ? { ...s, choices: next } : s));

  /** Price slider: adjusts options to fit the customer's target price and returns what changed. */
  const fitBudget = (target: number): string[] => {
    if (!state || !engine) return [];
    const contact = contactOf(state.answers);
    const base = state.baseAnswers ?? state.answers;
    // 1. The full requirement, with options and levels adjusted to the target.
    const full = engine.fitToBudget({ ...base, ...contact }, state.baseAnswers ? state.baseChoices : state.choices, target);
    // 2. Below what trimming can reach: the richest cheaper version that fits (e.g. MVP, or a Basic
    //    app on one platform with a managed backend), then any budget left over is used.
    const versions = full.cost > target ? getOptions().filter((o) => o.id !== "full") : [];
    const pick = versions.find((o) => o.plan.build <= target) ?? versions[versions.length - 1];
    if (!pick || pick.plan.build >= full.cost) {
      setState({ ...state, answers: { ...base, ...contact }, choices: full.choices });
      return full.changes;
    }
    const working = { ...(pick.apply.answers ?? base), ...contact };
    const fitted = engine.fitToBudget(working, pick.apply.choices, target);
    setState({ ...state, baseAnswers: base, answers: working, choices: fitted.choices });
    return [`${pick.name} version: ${pick.scope}`, ...fitted.changes];
  };

  /** From the plan: go on to contact details and the final review. */
  const continueToSend = () => {
    if (!state) return;
    userSay("Continue to send my enquiry");
    go({ ...state, returnTo: undefined }, state.answers);
  };

  /** From the plan: same as continue, flagged as a consultation request. */
  const requestConsultation = () => {
    if (!state) return;
    userSay("I'd like a consultation");
    botSay("Great. The team will arrange a free consultation call to go through the estimate and architecture with you.");
    go({ ...state, consultation: true, returnTo: undefined }, state.answers);
  };

  /** Email (and name) given to view the quotation: joins the enquiry, so it isn't asked again. */
  const setContact = (contact: { email: string; name?: string }) =>
    setState((s) => {
      if (!s) return s;
      const add = { email: contact.email, ...(contact.name ? { name: contact.name } : {}) };
      return { ...s, answers: { ...s.answers, ...add }, baseAnswers: s.baseAnswers ? { ...s.baseAnswers, ...add } : undefined };
    });

  const setNegotiation = (negotiation: { preferredBudget?: number; note?: string }) =>
    setState((s) => (s ? { ...s, negotiation } : s));

  const setIncludeTranscript = (value: boolean) => setState((s) => (s ? { ...s, includeTranscript: value } : s));
  const setEmailCopy = (value: boolean) => setState((s) => (s ? { ...s, emailCopy: value } : s));
  const setConsultation = (value: boolean) => setState((s) => (s ? { ...s, consultation: value } : s));

  const send = async (): Promise<void> => {
    if (!state) return;
    setState({ ...state, phase: "sending", error: undefined });
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: state.answers,
          choices: state.choices,
          summary: state.brief,
          consultation: state.consultation,
          emailCopy: state.emailCopy,
          negotiation: state.negotiation,
          reference: state.reference,
          transcript: transcript(),
          includeTranscript: state.includeTranscript && hasTranscript,
          currency: (() => {
            const { region, country, selection } = currentRegion();
            return { regionId: region.id, country, selection };
          })(),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { ref?: string; link?: string; error?: string };
      if (!response.ok) throw new Error(response.status === 429 || response.status === 400 ? result.error : undefined);
      botSay(
        `Thank you! Your enquiry${result.ref ? ` (${result.ref})` : ""} has been sent to the DotSeek team${
          state.consultation ? " with your consultation request" : ""
        }.${
          result.link
            ? ` We've emailed you a private link where you can follow the conversation and reply${state.emailCopy ? ", with a copy of your estimate" : ""}.`
            : " We'll reply by email as soon as we can."
        } Your final quotation is confirmed by the team after reviewing your requirements.`,
        result.link ? { links: [{ label: "View your enquiry", href: result.link }] } : undefined,
      );
      setState(null);
    } catch (error) {
      botSay("Sorry, I couldn't send your enquiry just now. You can send the same details from your email app instead.");
      setState((s) => (s ? { ...s, phase: "failed", error: error instanceof Error ? error.message || undefined : undefined } : s));
    }
  };

  const restart = () => {
    botSay("Let's start again.");
    go(fresh(), {});
  };

  const cancel = () => {
    botSay("No problem, I've cancelled the enquiry. Anything else I can help with?");
    setState(null);
  };

  /** Brings back a saved enquiry after a page refresh; requests that were in flight start again from their step. */
  const restore = (saved: EnquiryState) => {
    const phase: EnquiryPhase =
      saved.phase === "analysing" ? "reference" : saved.phase === "recommending" ? "choosing" : saved.phase === "sending" ? "review" : saved.phase;
    setState({ ...saved, phase, briefStatus: saved.briefStatus === "loading" ? "idle" : saved.briefStatus });
  };

  return {
    state,
    restore,
    plan,
    referencePlan,
    getOptions,
    applyOption,
    makeCheaper,
    startReference,
    submitReference,
    referenceFromChat,
    skipReference,
    offer,
    setContact,
    setNegotiation,
    currentStep,
    solutions: solutionCatalogue,
    start,
    answer,
    choose,
    edit,
    cancelEdit,
    setChoices,
    fitBudget,
    continueToSend,
    requestConsultation,
    send,
    restart,
    cancel,
    setIncludeTranscript,
    setEmailCopy,
    setConsultation,
  };
}
