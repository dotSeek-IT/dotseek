import { APP_HYBRID, APP_MANAGED, APP_NATIVE, type Answers } from "@/content/enquiryFlows";
import { buildPlan, chooseTier, fitToBudget, isCoreItem, leanPhaseOneChoices, toggleChoice, type Plan, type PlanChoices } from "./build";
import { REFERENCE_FEATURES, REFERENCE_FEATURE_IDS, type ReferenceAnalysis, type ReferenceFeature } from "./referenceFeatures";

/**
 * Reference URL analysis: turns what a customer's reference site or app
 * appears to do into enquiry answers, then into Full / Optimised / MVP /
 * Basic options, a feature cost breakdown and budget matching.
 * The reference is used only to understand layout style, features,
 * interaction patterns and approximate complexity. DotSeek never copies a
 * third-party site: the solution uses original design, content and assets
 * unless the customer owns them or has permission to reuse them.
 * Pure and shared by the browser and the server.
 */

export { REFERENCE_FEATURES, REFERENCE_FEATURE_IDS, type ReferenceAnalysis, type ReferenceFeature } from "./referenceFeatures";

const has = (a: ReferenceAnalysis, f: ReferenceFeature) => Boolean(a.features[f]);

/** Enquiry answers that describe a solution with similar scope (never a copy). */
export function referenceAnswers(a: ReferenceAnalysis, keep: Answers = {}): Answers {
  const mobile = a.kind === "mobile";
  const appLike = mobile || ((a.kind === "webapp" || a.kind === "saas") && (has(a, "dashboard") || has(a, "auth")));
  const answers: Answers = {};
  const integrations = [
    has(a, "payments") && "Payments (Stripe, PayPal)",
    a.services.some((s) => /hubspot|salesforce|zoho|pipedrive/i.test(s)) && "CRM",
    a.services.some((s) => /mailchimp|klaviyo|brevo|sendinblue/i.test(s)) && "Email marketing",
    has(a, "booking") && "Booking or calendar",
    has(a, "chatbot") && "AI chatbot",
  ].filter(Boolean) as string[];

  if (appLike) {
    Object.assign(answers, {
      solution: "App or software",
      solution_id: "software",
      sw_type: mobile ? "A mobile app (iOS / Android)" : has(a, "mobileApp") ? "Both a web app and a mobile app" : "A web app (works in the browser)",
      sw_problem: `A solution with similar scope to ${a.host}, built with our own design and content.`,
      sw_existing: "Nothing yet",
      sw_users: "Customers (public)",
      sw_user_types: ["Customers", (has(a, "admin") || has(a, "roles")) && "Managers / admins", "Staff"].filter(Boolean).join(", "),
      sw_features: REFERENCE_FEATURE_IDS.filter((f) => has(a, f)).map((f) => REFERENCE_FEATURES[f]).join(", ") || "Core features similar to the reference",
      sw_integrations: a.services.some((s) => /hubspot|salesforce/i.test(s))
        ? "HubSpot"
        : a.services.filter((s) => !/Push notifications|Social sharing|Maps and location|Analytics|Bot protection|Video embeds/.test(s)).join(", ") || "None",
      sw_automation: "Maybe, please advise",
    });
  } else {
    const need = ["A completely new website"];
    if (has(a, "admin") || has(a, "dashboard")) need.push("Admin portal or business management system");
    if (has(a, "ecommerce")) need.push("E-commerce or payments");
    if (has(a, "chatbot") || has(a, "ai")) need.push("AI features or chatbot");
    if (has(a, "mobileApp")) need.push("A mobile app to go with it");
    const features = ["Core pages (home, about, services)"];
    if (has(a, "blog")) features.push("Blog or insights");
    if (has(a, "forms")) features.push("Contact & enquiry forms");
    if (has(a, "booking")) features.push("Bookings or appointments");
    if (has(a, "auth") || has(a, "customerPortal")) features.push("Customer login area");
    if (has(a, "ecommerce")) features.push("Online shop");
    if (has(a, "search")) features.push("Search");
    if (has(a, "multilang")) features.push("Multiple languages");
    Object.assign(answers, {
      solution: "Website",
      solution_id: "website",
      web_need: need.join(", "),
      web_pages:
        a.pages <= 1 ? "Single landing page" : a.pages <= 5 ? "Small site (2 to 5 pages)" : a.pages <= 15 ? "Medium site (6 to 15 pages)" : "Large site (16 or more pages)",
      web_features: features.join(", "),
      web_design: "We need a new design",
      web_backend:
        has(a, "admin") || has(a, "dashboard")
          ? "Admin portal to run the business"
          : has(a, "backend") || has(a, "auth") || has(a, "booking")
            ? "Custom backend or API"
            : has(a, "blog")
              ? "Simple content management (edit pages ourselves)"
              : "Nothing beyond the website",
      web_integrations: integrations.length ? integrations.join(", ") : "None",
    });
  }
  if (has(a, "mobileApp")) {
    const appFeatures = [
      has(a, "auth") && "User accounts and login",
      a.services.includes("Push notifications") && "Push notifications",
      has(a, "payments") && "In-app payments or subscriptions",
      has(a, "booking") && "Bookings or orders",
      a.services.includes("Maps and location") && "Maps and location",
      (has(a, "roles") || has(a, "chatbot")) && "Chat or messaging",
    ].filter(Boolean) as string[];
    Object.assign(answers, {
      app_os: "iPhone and Android",
      app_features: appFeatures.length ? appFeatures.join(", ") : "Push notifications",
      app_release: "Public on the App Store and Google Play",
      app_shared: "Yes, one shared system",
    });
  }
  // Reasonable operating assumptions, all editable in the review.
  const security = [has(a, "payments") && "Payments or financial data", (has(a, "auth") || has(a, "customerPortal")) && "Personal or customer data (UK GDPR)"].filter(Boolean);
  Object.assign(answers, {
    ops_users: "Not sure yet",
    ops_staff: has(a, "roles") ? "6 to 25" : "1 to 5",
    ops_regions: has(a, "multilang") ? "Worldwide" : "Mainly the UK",
    ops_files: "Images",
    ops_realtime: has(a, "realtime") ? "Yes" : "No, that's not needed",
    ops_availability: has(a, "ecommerce") || has(a, "payments") ? "Important during business hours" : "We can live with short outages",
    ops_security: security.length ? security.join(", ") : "Standard security is fine",
    ops_growth: "Steady growth",
  });
  // Keep anything the customer already told us (business, budget, contact...).
  return { ...answers, ...keep };
}

/** Starting choices for the reference-level build: design effort follows the reference. */
export function referenceChoices(a: ReferenceAnalysis): PlanChoices {
  const scopes: PlanChoices["scopes"] = {};
  if (a.animations === "heavy" || a.design === "rich") scopes.frontend = "advanced";
  if (a.design === "rich") scopes.uxui = "advanced";
  if (a.animations === "heavy" && a.design === "rich") scopes.uxui = "custom";
  return { scopes };
}

// ---------- Options: Full / Optimised / MVP / Basic ----------

export type CostOption = {
  id: "full" | "optimised" | "mvp" | "basic";
  name: string;
  scope: string;
  keep: string[];
  simplify: string[];
  plan: Plan;
  /** Apply: new choices, and new answers for the Basic version (a simpler site). */
  apply: { choices: PlanChoices; answers?: Answers };
};

const OPTIMISE_OFF = [
  "realtime",
  "analytics",
  "admin",
  "ai_chatbot",
  "rag",
  "vector_db",
  "ai_agent",
  "voice_ai",
  "ai_insights",
  "document_ai",
  "events",
  "mobile_app",
  "kubernetes",
  "multi_region",
  "dr",
  "autoscaling",
  "load_balancer",
  "api_gateway",
  "nosql",
  "search",
];

const PAGE_STEPS = ["Single landing page", "Small site (2 to 5 pages)", "Medium site (6 to 15 pages)", "Large site (16 or more pages)"];

/** Fewer custom pages: step the website size down (never below a small site). */
function fewerPages(answers: Answers, toSmall: boolean): Answers {
  const i = PAGE_STEPS.indexOf(answers.web_pages ?? "");
  if (i < 0) return answers;
  const target = toSmall ? Math.min(i, 1) : Math.max(Math.min(i, 1), i - 1);
  const trimmed = toSmall
    ? (answers.web_features ?? "")
        .split(", ")
        .filter((f) => !["Search", "Multiple languages", "Blog or insights"].includes(f))
        .join(", ")
    : answers.web_features;
  return { ...answers, web_pages: PAGE_STEPS[target], ...(trimmed !== undefined ? { web_features: trimmed } : {}) };
}

/** Leaner app scope: fewer app features (optimised), or one platform with essential features only (MVP). */
function leanerApp(answers: Answers, mvp: boolean): Answers {
  if (!answers.app_features) return answers;
  const features = answers.app_features.split(", ");
  const essential = features.filter((f) => ["User accounts and login", "Bookings or orders", "In-app payments or subscriptions"].includes(f));
  const kept = mvp ? essential.slice(0, 2) : features.slice(0, Math.max(2, features.length - 2));
  return {
    ...answers,
    app_features: (kept.length ? kept : features.slice(0, 1)).join(", "),
    // One platform first; a hybrid (or undecided) app stays hybrid so the other platform follows from the same code.
    ...(mvp && answers.app_os === "iPhone and Android"
      ? { app_os: "iPhone (iOS) only", ...(answers.app_build === APP_NATIVE ? {} : { app_build: APP_HYBRID }) }
      : {}),
  };
}

const productLabels = (plan: Plan) =>
  plan.services.filter((s) => s.selected && ["product", "ai", "integrations"].includes(s.group) && s.id !== "discovery").map((s) => s.label);

/** A simple version of the same business: small responsive site, similar direction, contact form, no backend. */
function basicAnswers(answers: Answers): Answers {
  const keep = Object.fromEntries(
    Object.entries(answers).filter(([k]) => ["biz_stage", "biz_size", "budget", "timeline", "notes", "name", "company", "email", "phone", "web_business_type"].includes(k)),
  );
  return {
    ...keep,
    solution: "Website",
    solution_id: "website",
    web_need: "A completely new website",
    web_pages: "Small site (2 to 5 pages)",
    web_business_type: answers.web_business_type ?? "Professional services",
    web_features: "Core pages (home, about, services), Contact & enquiry forms",
    web_design: "We need a new design",
    web_backend: "Nothing beyond the website",
    web_integrations: "None",
  };
}

/** The smallest real app: one platform first, sign-up plus the single most important feature, on a managed backend. */
function basicAppAnswers(answers: Answers): Answers {
  const lean = leanerApp(answers, true);
  const features = (lean.app_features ?? "").split(", ").filter(Boolean);
  return {
    ...lean,
    app_features: (features.includes("User accounts and login") ? ["User accounts and login"] : features.slice(0, 1)).join(", "),
    app_backend: APP_MANAGED,
    // Customers only: no staff portal, integrations, automation or real-time features in the first version.
    sw_user_types: "Customers",
    sw_features: "Login and user accounts, Mobile app",
    sw_integrations: "None",
    sw_automation: "No",
    ops_users: "Under 500",
    ops_staff: "1 to 5",
    ops_files: "No files",
    ops_realtime: "No, that's not needed",
    ops_security: "Standard security is fine",
    ops_growth: "About the same",
    ...(lean.app_os === "iPhone and Android" || lean.app_os === "Not sure, please advise"
      ? { app_os: "iPhone (iOS) only", ...(lean.app_build === APP_NATIVE ? {} : { app_build: APP_HYBRID }) }
      : {}),
  };
}

/**
 * Full reference-level build, cost-optimised, MVP and basic versions of the
 * same requirement. Works for any plan (the "Make this cheaper" ladder), with
 * extra detail when it came from a reference URL.
 */
export function costOptions(answers: Answers, full: PlanChoices): CostOption[] {
  const fullPlan = buildPlan(answers, full);
  const ints = fullPlan.selected.filter((id) => id.startsWith("int_"));

  // Optimised: simpler implementation of the same core (reusable components, managed services, CMS instead of a custom dashboard).
  const optimisedAnswers = leanerApp(fewerPages(answers, false), false);
  let optimised: PlanChoices = { ...full, scopes: {}, later: undefined };
  for (const id of [...OPTIMISE_OFF, ...ints.slice(1)]) {
    if (fullPlan.selected.includes(id) && !isCoreItem(answers, id)) optimised = toggleChoice(optimised, id, false);
  }
  if (fullPlan.selected.includes("admin") && fullPlan.solution === "website") optimised = toggleChoice(optimised, "cms", true);
  if (["advanced", "enterprise"].includes(fullPlan.tier)) optimised = chooseTier(optimised, "standard");
  const optimisedPlan = buildPlan(optimisedAnswers, optimised);

  // MVP: the main business functions on a small site, launch scope only.
  const mvpAnswers = leanerApp(fewerPages(answers, true), true);
  const mvp = leanPhaseOneChoices(mvpAnswers, { scopes: {}, provider: full.provider });
  const mvpPlan = buildPlan(mvpAnswers, mvp);

  const simple = ["website", "software"].includes(fullPlan.solution);
  const appFirst = isCoreItem(answers, "mobile_app");
  // An app reference stays an app: Basic is the smallest real mobile app, never a website instead.
  const basicA = appFirst ? basicAppAnswers(answers) : simple ? basicAnswers(answers) : undefined;
  const basic = appFirst
    ? fitToBudget(basicA!, leanPhaseOneChoices(basicA!, { scopes: {}, provider: full.provider }), 0).choices
    : simple
      ? { provider: full.provider }
      : fitToBudget(answers, mvp, 0).choices;
  const basicPlan = buildPlan(basicA ?? answers, basic);

  const appNotes = (to: Answers, later: boolean) =>
    [
      to.app_os !== answers.app_os && `Android version${later ? " (later)" : ""}`,
      to.app_features !== answers.app_features && `Secondary app features${later ? " (later)" : ""}`,
    ].filter(Boolean) as string[];
  const removed = (from: Plan, to: Plan) =>
    from.services.filter((s) => s.selected && !to.selected.includes(s.id) && ["product", "ai", "integrations", "background"].includes(s.group)).map((s) => s.label);

  return [
    {
      id: "full",
      name: "Full reference-level build",
      scope: "Most comparable functionality and design detail.",
      keep: productLabels(fullPlan),
      simplify: [],
      plan: fullPlan,
      apply: { choices: full },
    },
    {
      id: "optimised",
      name: "Cost-optimised",
      scope: "Similar visual direction and core functionality with a simpler implementation.",
      keep: [
        "Similar overall visual direction",
        ...(appFirst ? ["Core app screens", "Sign-up and sign-in"] : ["Core pages and responsive design", "Contact and enquiry flow"]),
        ...productLabels(optimisedPlan).filter((l) => !/UI\/UX|frontend/i.test(l)),
      ],
      simplify: ["Complex animation and custom design detail", ...appNotes(optimisedAnswers, false), ...removed(fullPlan, optimisedPlan)],
      plan: optimisedPlan,
      apply: { choices: optimised, answers: optimisedAnswers === answers ? undefined : optimisedAnswers },
    },
    {
      id: "mvp",
      name: "MVP",
      scope: "Only the main business functions, ready to grow.",
      keep: productLabels(mvpPlan),
      simplify: [...appNotes(mvpAnswers, true), ...removed(fullPlan, mvpPlan).map((l) => `${l} (later)`)],
      plan: mvpPlan,
      apply: { choices: mvp, answers: mvpAnswers === answers ? undefined : mvpAnswers },
    },
    {
      id: "basic",
      name: "Basic",
      scope: appFirst
        ? "The smallest real version of the app: one platform first, sign-up and the core feature, ready to grow."
        : simple
          ? "A small responsive website with a similar design direction, static content and a contact form."
          : "The smallest useful pilot.",
      keep: appFirst
        ? [basicPlan.services.find((x) => x.id === "mobile_app")?.label ?? "Mobile app", "Similar design direction", "Sign-up and sign-in", "Core app feature"]
        : simple
          ? ["Small responsive website", "Similar design direction", "Static content", "Contact form"]
          : productLabels(basicPlan),
      simplify: appFirst
        ? [
            "Custom backend replaced by Firebase or Supabase",
            ...appNotes(basicA!, true),
            ...removed(fullPlan, basicPlan)
              .filter((l) => !/^Backend|^Authentication/.test(l))
              .map((l) => `${l} (later)`),
          ]
        : simple ? ["No advanced backend, portal or integrations"] : removed(fullPlan, basicPlan),
      plan: basicPlan,
      apply: { choices: basic, answers: basicA },
    },
  ];
}

/** The richest option that fits a budget, or null when even Basic doesn't. */
export function optionForBudget(options: CostOption[], budget: number): CostOption | null {
  return options.find((o) => o.plan.estimate.recommended <= budget) ?? null;
}

// ---------- Feature cost breakdown (Keep / Remove / Add later) ----------

export type CostDriver = {
  id: string;
  label: string;
  items: string[];
  /** Recommended cost of these items in the full build. */
  cost: number;
  impact: "Low" | "Medium" | "High";
  state: "keep" | "remove" | "later";
};

const DRIVERS: { id: string; label: string; items: string[] }[] = [
  { id: "design", label: "Custom UI/UX", items: ["uxui"] },
  { id: "animation", label: "Advanced animation and interaction", items: [] },
  { id: "backend", label: "Backend and API", items: ["backend"] },
  { id: "accounts", label: "User accounts", items: ["auth"] },
  { id: "admin", label: "Admin dashboard", items: ["admin"] },
  { id: "ecommerce", label: "E-commerce", items: ["ecommerce"] },
  { id: "payments", label: "Payments", items: ["payments"] },
  { id: "booking", label: "Bookings", items: ["bookings"] },
  { id: "search", label: "Search", items: ["search"] },
  { id: "chatbot", label: "AI chatbot", items: ["ai_chatbot", "rag", "vector_db"] },
  { id: "agent", label: "AI agent", items: ["ai_agent"] },
  { id: "mobile", label: "Mobile app", items: ["mobile_app", "push"] },
  { id: "integrations", label: "Custom integrations", items: ["int_crm", "int_erp", "int_accounting", "int_workspace", "int_ecom", "int_calendar", "int_marketing", "int_other"] },
  { id: "realtime", label: "Real-time features", items: ["realtime"] },
  { id: "reporting", label: "Advanced reporting", items: ["analytics"] },
  { id: "languages", label: "Multi-language", items: ["multilang"] },
];

/** What drives the cost of this plan, each with Keep / Remove / Add later state. */
export function costDrivers(plan: Plan, choices: PlanChoices): CostDriver[] {
  const total = plan.estimate.recommended || 1;
  const later = new Set(choices.later ?? []);
  const lineCost = (ids: string[]) => plan.lines.filter((l) => ids.includes(l.id)).reduce((t, l) => t + l.cost, 0);
  const laterCost = (ids: string[]) => plan.later.filter((l) => ids.includes(l.id)).reduce((t, l) => t + l.cost, 0);
  const rows: CostDriver[] = [];
  for (const d of DRIVERS) {
    if (d.id === "animation") {
      const scope = choices.scopes?.frontend;
      if (scope && scope !== "basic") {
        const fe = plan.lines.find((l) => l.id === "frontend");
        rows.push({ id: d.id, label: d.label, items: [], cost: fe ? Math.round(fe.cost * 0.45) : 0, impact: "High", state: "keep" });
      } else if (choices.later?.includes("__animation")) {
        rows.push({ id: d.id, label: d.label, items: [], cost: 0, impact: "High", state: "later" });
      }
      continue;
    }
    const selected = d.items.filter((id) => plan.selected.includes(id));
    const deferred = d.items.filter((id) => later.has(id));
    const removedByUser = d.items.filter((id) => (choices.off ?? []).includes(id) && !later.has(id));
    if (!selected.length && !deferred.length && !removedByUser.length) continue;
    const cost = selected.length ? lineCost(selected) : laterCost(deferred);
    const share = cost / total;
    rows.push({
      id: d.id,
      label: d.label,
      items: selected.length ? selected : deferred.length ? deferred : removedByUser,
      cost,
      impact: share >= 0.15 || cost >= 1500 ? "High" : share >= 0.06 ? "Medium" : "Low",
      state: selected.length ? "keep" : deferred.length ? "later" : "remove",
    });
  }
  return rows.sort((x, y) => y.cost - x.cost);
}

/** Apply Keep / Remove / Add later to one cost driver. */
export function setDriverState(choices: PlanChoices, driver: CostDriver, state: CostDriver["state"]): PlanChoices {
  if (driver.id === "animation") {
    const scopes = { ...choices.scopes, frontend: state === "keep" ? ("advanced" as const) : ("basic" as const) };
    const later = (choices.later ?? []).filter((x) => x !== "__animation");
    return { ...choices, scopes, later: state === "later" ? [...later, "__animation"] : later };
  }
  let next = choices;
  for (const id of driver.items) next = toggleChoice(next, id, state === "keep");
  const later = (next.later ?? []).filter((x) => !driver.items.includes(x));
  return { ...next, later: state === "later" ? [...later, ...driver.items] : later };
}

/** Plain-language explanation of what drives the cost (used when the AI isn't available). */
export function costDriverSummary(drivers: CostDriver[], appFirst = false): string {
  const top = drivers.filter((d) => d.state === "keep" && d.impact !== "Low").slice(0, 4).map((d) => d.label.toLowerCase());
  if (!top.length) return "This is already a lean scope; most of the cost is the core website itself.";
  const list = top.length > 1 ? `${top.slice(0, -1).join(", ")} and ${top.at(-1)}` : top[0];
  const start = appFirst ? "launch the core app with its key screens first" : "launch the customer-facing website first";
  return `Most of the cost here comes from ${list}. If those are not required initially, we can reduce the first-phase cost significantly while keeping a similar professional design direction. You do not need to build everything on day one: we can ${start} and add the rest later.`;
}
