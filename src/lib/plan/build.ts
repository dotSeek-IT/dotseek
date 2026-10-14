import { isSimpleSite, type Answers } from "@/content/enquiryFlows";
import {
  INFRA_GROUPS,
  itemById,
  markets,
  packages,
  planItems,
  pricingMeta,
  providerById,
  providers,
  scopeLevels,
  scopesFor,
  SCOPE_IDS,
  stages,
  tierById,
  tiers,
  type DiagramLayer,
  type PackageDef,
  type PlanItem,
  type Range,
  type Rating,
  type ScopeId,
  type StageId,
  type TierId,
} from "@/content/pricing";
import { regionLabel, readSignals, type Signals } from "./signals";
import { readRequirements, type Requirements } from "./requirements";

/**
 * DotSeek solution plan engine: requirement -> architecture -> services ->
 * infrastructure -> cost -> alternatives -> scale-up path.
 * Every figure comes from content/pricing.ts. Pure: the chat recalculates it
 * live as the customer toggles options, and /api/enquiry recalculates it from
 * the submitted answers and choices (client figures are never trusted).
 */

export type PlanChoices = {
  tier?: TierId;
  provider?: string;
  on?: string[];
  off?: string[];
  /** Basic / Advanced / Custom per item (default from the answers, otherwise Basic). */
  scopes?: Record<string, ScopeId>;
  /** The customer's chosen price target (GBP) from the price slider. */
  target?: number;
  /** Items deferred with "Add later": not in this estimate, listed as later upgrades. */
  later?: string[];
};

export type ItemStatus = "included" | "recommended" | "optional" | "not_needed";

export type ServiceView = {
  id: string;
  label: string;
  group: PlanItem["group"];
  summary: string;
  selected: boolean;
  locked: boolean;
  status: ItemStatus;
  reason: string;
  setupCost: number;
  monthly: Range | null;
  usage: boolean;
  scope?: ScopeId;
  scopeOptions?: { id: ScopeId; label: string; detail: string; setupCost: number }[];
  impact?: [Rating, Rating, Rating, Rating];
};

/** `cost` is the recommended estimate; `min` and `max` bound it. */
export type Line = { id: string; label: string; days: number; cost: number; min: number; max: number };
/** `choices` offers a one-click plan change (for example "Start with Phase 1"). */
export type Advice = { id: string; item?: string; action: "remove" | "add" | "info"; message: string; choices?: PlanChoices; choicesLabel?: string };
export type DiagramNode = { id: string; label: string; note?: string };
export type Diagram = { layers: { id: DiagramLayer | "users"; label: string; nodes: DiagramNode[] }[] };

export type Plan = {
  label: string;
  pricingReviewed: string;
  solution: Signals["solution"];
  level: 1 | 2 | 3 | 4;
  recommendedTier: TierId;
  tier: TierId;
  provider: string;
  profile: { label: string; value: string }[];
  selected: string[];
  services: ServiceView[];
  lines: Line[];
  days: number;
  /** Recommended development estimate (same as estimate.recommended). */
  build: number;
  estimate: { min: number; recommended: number; max: number };
  stage: StageId;
  /** Stage name and published price label, so light UI (the chat card) needn't load the catalogue. */
  stageInfo: { name: string; priceLabel: string };
  weeks: Range;
  monthly: { infrastructure: Range; usage: Range; maintenance: Range; running: Range; items: { label: string; range: Range; usage: boolean }[] };
  firstYear: Range;
  markets: { id: string; name: string; currency: string; locale: string; freelancer: Range; agency: Range; freelancerGbp: Range; agencyGbp: Range }[];
  /** Saving against the typical UK agency range. */
  savings: { amount: Range; percent: Range } | null;
  tiers: { id: TierId; name: string; level: number; tagline: string; bestFor: string[]; monthly: Range; build: number; services: string[]; recommended: boolean; current: boolean }[];
  providers: { id: string; name: string; monthly: Range; suitable: boolean; scalability: Rating; reliability: Rating; management: string; suits: string; pros: string[]; limits: string[]; option?: "A" | "B" | "C"; current: boolean }[];
  packages: { id: string; name: string; summary: string; build: number; monthly: Range; weeks: Range; items: string[]; choices: PlanChoices; current: boolean }[];
  phases: { name: string; summary: string; items: string[]; cost: number; min: number; max: number; withinBudget?: boolean }[];
  upgradePath: { tier: string; adds: string[]; monthly: Range }[];
  diagram: Diagram;
  advice: Advice[];
  /** "Add later" items with their indicative costs (not included in the estimate). */
  later: Line[];
  /** The customer's budget from the answers, if given. */
  budget?: Range;
  backgroundTasks: string[];
  budgetFit: "within" | "above" | null;
  /** Lowest viable and premium development prices for this requirement (price slider range). */
  priceRange: Range;
  /** Development price of the recommended configuration (no customer changes). */
  recommendedPrice: number;
  target?: number;
};

// ---------- Helpers ----------

const tierLevel = (t: TierId) => tierById(t)!.level;
const roundMoney = (n: number) => (n >= 1000 ? Math.round(n / 50) * 50 : Math.round(n / 10) * 10);
const addRange = (a: Range, b: Range): Range => [a[0] + b[0], a[1] + b[1]];
const scaleRange = (r: Range, f: number): Range => [r[0] * f, r[1] * f];
const roundRange = (r: Range): Range => [roundMoney(r[0]), roundMoney(r[1])];
const ZERO: Range = [0, 0];

function monthlyFor(item: PlanItem, tier: TierId): Range | null {
  if (!item.monthly) return null;
  if (Array.isArray(item.monthly)) return item.monthly;
  const order: TierId[] = ["starter", "standard", "advanced", "enterprise"];
  for (let i = order.indexOf(tier); i >= 0; i--) {
    const r = item.monthly[order[i]];
    if (r) return r;
  }
  return null;
}

const isInfra = (item: PlanItem) => INFRA_GROUPS.includes(item.group) || item.id === "data_pipeline";

/** Items the customer cannot switch off: every project needs discovery, hosting and encryption. */
const LOCKED = new Set(["discovery", "hosting", "encryption"]);

/** The main item of each solution: optional, but always planned in Phase 1. */
function coreFor(s: Signals): Set<string> {
  const anchor: Record<Signals["solution"], string[]> = {
    website: ["frontend"],
    software: s.managedBackend ? [] : ["backend"],
    ai_agent: ["ai_agent"],
    ai_chatbot: ["ai_chatbot"],
    automation: ["automation"],
    integration: [],
    data: ["analytics"],
  };
  return new Set([...anchor[s.solution], ...(s.mobileOnly ? ["mobile_app"] : [])]);
}

/** True for the main item(s) of this requirement (kept in every cheaper version except Basic). */
export function isCoreItem(answers: Answers, id: string): boolean {
  return coreFor(readSignals(answers)).has(id);
}

/** Scope chosen for an item, if it offers scopes. */
export function scopeOf(id: string, choices: PlanChoices, req: Pick<Requirements, "defaultScopes">): ScopeId {
  return choices.scopes?.[id] ?? req.defaultScopes[id] ?? "basic";
}

// ---------- Prices ----------

function complexityOf(s: Signals) {
  return Math.min(
    1.3,
    1 + 0.05 * s.usersTier + (s.staffTier >= 2 ? 0.05 : 0) + (s.growth === 2 ? 0.05 : 0) + (s.security.sensitive ? 0.05 : 0),
  );
}

/** Size factor from the requirement (pages, single platform, widget only...): adjusted effort over base effort. */
function sizeFactor(item: PlanItem, req: Requirements) {
  if (item.days <= 0) return 1;
  return Math.min(3, Math.max(0.25, (item.days + (req.dayAdjust[item.id] ?? 0)) / item.days));
}

/** [minimum, recommended, maximum] price for one item at a scope, from the price catalogue. */
function itemPrice(item: PlanItem, scope: ScopeId, s: Signals, req: Requirements): [number, number, number] {
  const f = scopeLevels[scope].days * sizeFactor(item, req) * (isInfra(item) ? 1 : complexityOf(s));
  const lo = item.price[0] * f;
  const hi = item.price[1] * f;
  return [lo, lo + pricingMeta.recommendedPoint * (hi - lo), hi];
}

// ---------- Architecture level ----------

export function recommendLevel(s: Signals, req: Requirements): 1 | 2 | 3 | 4 {
  const has = (id: string) => req.items.has(id);
  let score = s.usersTier;
  if (s.staffTier >= 2) score += 1;
  score += { uk: 0, europe: 1, middle_east: 1, worldwide: 2 }[s.regions];
  if (s.realtime) score += 1;
  score += s.availability * 1.5;
  score += s.growth;
  if (has("ai_agent") || has("document_ai")) score += 1;
  if ([...req.items].filter((i) => i.startsWith("int_")).length >= 4) score += 1;
  if (s.files.video) score += 1;
  if (s.security.sensitive) score += 1;
  if (has("ecommerce") || (s.publicUsers && has("auth"))) score += 1;

  let level: 1 | 2 | 3 | 4 = score <= 3 ? 1 : score <= 7 ? 2 : score <= 11 ? 3 : 4;
  // Enterprise only for genuinely large or critical, multi-region or fast-scaling systems.
  if (level === 4 && !((s.usersTier >= 3 || s.availability === 2) && (s.regions === "worldwide" || s.growth === 2 || s.staffTier === 3))) {
    level = 3;
  }
  // Customer accounts, payments or orders need at least the standard setup.
  if (level === 1 && (has("ecommerce") || (s.publicUsers && has("auth")) || s.security.payments)) level = 2;
  return level;
}

/** Tier infrastructure that is relevant to this project. */
function tierInfra(tier: TierId, s: Signals, req: Requirements): string[] {
  const level = tierLevel(tier);
  const data = req.items.has("sql_db");
  const backend = data || req.items.has("backend");
  return tierById(tier)!.infra.filter((id) => {
    switch (id) {
      case "sql_db":
      case "backup":
      case "redis":
      case "email_service":
        return data;
      case "file_storage":
        return req.items.has("file_storage");
      case "worker":
        return req.backgroundTasks.length > 0 || req.items.has("worker");
      case "queue":
        return req.backgroundTasks.length > 0;
      case "load_balancer":
      case "autoscaling":
      case "api_gateway":
      case "kubernetes":
        return backend;
      case "multi_region":
        return s.regions !== "uk" || s.availability === 2;
      default:
        return level >= 1;
    }
  });
}

function withDependencies(set: Set<string>, s: Signals) {
  // A managed backend (Firebase / Supabase) covers sign-in, data and push for a simple app.
  const managed = s.managedBackend && set.has("managed_backend");
  const needsBackend = (managed ? ["admin", "ecommerce", "bookings"] : ["auth", "admin", "ecommerce", "bookings", "mobile_app"]).some((id) => set.has(id));
  if (needsBackend && (s.solution === "website" || s.solution === "software")) set.add("backend");
  if ((managed ? ["backend", "admin", "ecommerce", "bookings", "ai_agent", "automation", "data_pipeline"] : ["backend", "auth", "admin", "ecommerce", "bookings", "ai_agent", "automation", "data_pipeline"]).some((id) => set.has(id))) {
    set.add("sql_db");
    set.add("backup");
  }
  if (set.has("rag")) set.add("vector_db");
  if (set.has("queue")) set.add("worker");
  if (set.has("autoscaling")) set.add("load_balancer");
  if (set.has("kubernetes")) set.add("docker");
  if (set.has("ecommerce")) set.add("payments");
  if (set.has("mobile_app") && !managed && set.has("inapp") === false && set.has("push") === false) set.add("push");
  // Push notifications belong to the mobile app; they go (and come back) with it.
  if (!set.has("mobile_app")) set.delete("push");
}

// ---------- Core calculation ----------

type Calc = {
  selected: Set<string>;
  lines: Line[];
  days: number;
  build: number;
  buildMin: number;
  buildMax: number;
  weeks: Range;
  infra: Range;
  usage: Range;
  maintenance: Range;
  items: { label: string; range: Range; usage: boolean }[];
};

function calculate(s: Signals, req: Requirements, tier: TierId, providerFactor: number, choices: PlanChoices): Calc {
  const selected = new Set([...req.items, ...tierInfra(tier, s, req)]);
  for (const id of choices.on ?? []) if (itemById(id)) selected.add(id);
  for (const id of choices.off ?? []) if (!LOCKED.has(id)) selected.delete(id);
  for (const id of choices.later ?? []) if (!LOCKED.has(id)) selected.delete(id);
  const scopeFactor = (item: PlanItem) => (scopesFor(item) ? scopeLevels[scopeOf(item.id, choices, req)] : scopeLevels.basic);
  withDependencies(selected, s);

  const level = tierLevel(tier);
  const lines: Line[] = [];
  const infraLine = { days: 0, lo: 0, rec: 0, hi: 0 };
  for (const item of planItems) {
    if (!selected.has(item.id) || (item.days <= 0 && item.price[1] <= 0)) continue;
    const scope = scopesFor(item) ? scopeOf(item.id, choices, req) : "basic";
    const [lo, rec, hi] = itemPrice(item, scope, s, req);
    const days = item.days * sizeFactor(item, req) * scopeLevels[scope].days;
    if (isInfra(item) && item.id !== "sql_db" && item.id !== "data_pipeline") {
      infraLine.days += days;
      infraLine.lo += lo;
      infraLine.rec += rec;
      infraLine.hi += hi;
      continue;
    }
    const base =
      req.labels[item.id] ?? (item.id === "sql_db" ? "Database" : item.id === "frontend" && s.solution === "ai_chatbot" ? "Chat widget for your website" : item.label);
    const label = scope === "basic" ? base : `${base} (${scopeLevels[scope].label})`;
    lines.push({ id: item.id, label, days, cost: rec, min: lo, max: hi });
  }
  if (infraLine.hi > 0) {
    lines.push({ id: "infra_setup", label: "Cloud infrastructure & DevOps setup", days: infraLine.days, cost: infraLine.rec, min: infraLine.lo, max: infraLine.hi });
  }
  const sum = (key: "cost" | "min" | "max" | "days") => lines.reduce((t, l) => t + l[key], 0);
  // Small sites include testing and launch; bigger builds list them.
  if (sum("cost") > pricingMeta.overheadFrom) {
    const t = pricingMeta.testingShare;
    const m = pricingMeta.managementShare;
    const base = { days: sum("days"), cost: sum("cost"), min: sum("min"), max: sum("max") };
    lines.push({ id: "testing", label: "Testing & QA", days: base.days * t, cost: base.cost * t, min: base.min * t, max: base.max * t });
    // Launch effort grows with app store releases and larger architectures.
    let deploy: Range = [50, 150];
    if (selected.has("mobile_app")) deploy = addRange(deploy, [100, 300]);
    if (level >= 3) deploy = addRange(deploy, [200, 600]);
    if (level === 4) deploy = addRange(deploy, [500, 1500]);
    lines.push({
      id: "deployment",
      label: "Deployment & launch",
      days: 1 + (selected.has("mobile_app") ? 2 : 0) + (level >= 3 ? 2 : 0),
      cost: deploy[0] + pricingMeta.recommendedPoint * (deploy[1] - deploy[0]),
      min: deploy[0],
      max: deploy[1],
    });
    lines.push({ id: "management", label: "Project management", days: base.days * m, cost: base.cost * m, min: base.min * m, max: base.max * m });
  }
  for (const line of lines) {
    line.cost = roundMoney(line.cost);
    line.min = roundMoney(line.min);
    line.max = roundMoney(line.max);
  }
  const days = sum("days");
  const build = sum("cost");
  const capacity = pricingMeta.teamCapacity.find((c) => days <= c.upToDays)!.daysPerWeek;
  const mid = days / capacity;
  const weeks: Range = [Math.max(1, Math.round(mid * 0.85)), Math.max(1, Math.round(mid * 1.2))];

  let infra = ZERO;
  let usage = ZERO;
  const items: Calc["items"] = [];
  for (const item of planItems) {
    if (!selected.has(item.id)) continue;
    const base = monthlyFor(item, tier);
    if (!base) continue;
    const r = scaleRange(base, scopeFactor(item).monthly);
    if (item.usage) {
      const v = scaleRange(r, req.usageFactor);
      usage = addRange(usage, v);
      items.push({ label: item.monthlyLabel ?? item.label, range: roundRange(v), usage: true });
    } else {
      const v = isInfra(item) ? scaleRange(r, providerFactor) : r;
      infra = addRange(infra, v);
      items.push({ label: item.monthlyLabel ?? item.label, range: roundRange(v), usage: false });
    }
  }
  const m = Math.max(pricingMeta.maintenance.minMonthly, build * pricingMeta.maintenance.shareOfBuildPerMonth) * [1, 1.15, 1.4, 1.8][level - 1];
  return {
    selected,
    lines,
    days,
    build,
    buildMin: sum("min"),
    buildMax: sum("max"),
    weeks,
    infra: roundRange(infra),
    usage: roundRange(usage),
    maintenance: roundRange([m, m * 1.5]),
    items,
  };
}

// ---------- Reasons ----------

function reasonFor(id: string, s: Signals, req: Requirements, level: number): { rec: "yes" | "optional" | "no"; why: string } {
  const tasks = req.backgroundTasks;
  const where = regionLabel[s.regions];
  const required = req.items.has(id);
  switch (id) {
    case "cdn":
      if (s.regions !== "uk") return { rec: "yes", why: `Your users are in ${where}, so a CDN will deliver pages and files faster from locations close to them.` };
      if (s.publicUsers) return { rec: level >= 2 ? "yes" : "optional", why: "Public pages and images load faster and the server does less work. A free CDN tier is often enough to start." };
      return { rec: "optional", why: "Mostly internal users in the UK, so a CDN is a nice-to-have rather than essential." };
    case "redis":
      if (s.usersTier >= 1 || s.staffTier >= 2)
        return { rec: "yes", why: "Several people use the system at the same time and read the same data often. Redis reduces database load and improves response time." };
      return { rec: "optional", why: "At your expected usage the database alone is fast enough. Redis can be added later when traffic grows." };
    case "queue":
    case "worker":
      if (tasks.length)
        return {
          rec: "yes",
          why: `Your system includes ${tasks.join(", ")}. These should run in the background so users do not have to wait${id === "queue" ? ", and a queue makes sure no task is lost under load" : ""}.`,
        };
      return { rec: "no", why: "Nothing in your requirement needs long-running background work yet." };
    case "load_balancer":
    case "autoscaling":
      if (s.usersTier >= 2 || s.availability === 2)
        return { rec: "yes", why: "Your traffic and availability needs call for more than one backend instance. A load balancer spreads the load and keeps the service up if one instance fails." };
      return { rec: "no", why: "Not required at your expected traffic: one well-sized instance is enough, and it can be scaled up later." };
    case "api_gateway":
      if (req.items.has("mobile_app") && req.items.has("frontend")) return { rec: level >= 2 ? "yes" : "optional", why: "Your web and mobile apps can share one secure entry point to the backend." };
      if (level >= 3) return { rec: "yes", why: "With several services and integrations, a gateway gives one secure, monitored entry point." };
      return { rec: "no", why: "Not required: the apps can call the backend API directly at this size." };
    case "kubernetes":
      if (level >= 4)
        return { rec: "yes", why: "Several services must scale independently with high availability. Kubernetes (AKS or EKS) gives controlled scaling and zero-downtime releases." };
      return {
        rec: "no",
        why: "For the expected traffic and current scope, Kubernetes would add unnecessary infrastructure cost and operational complexity. A managed application service or Docker deployment is more suitable.",
      };
    case "multi_region":
      if (s.regions === "worldwide" && s.availability === 2)
        return { rec: "yes", why: "Worldwide users and 24/7 needs: a second region improves speed and protects against a regional outage." };
      return { rec: "no", why: "Not required: a single region with automated backups meets your availability needs." };
    case "dr":
      if (s.availability === 2) return { rec: "yes", why: "The system must run 24/7, so a recovery plan and standby environment limit downtime after a major failure." };
      return { rec: "no", why: "Automated backups with tested restore are enough for your availability needs." };
    case "waf":
      if (s.security.payments || s.security.sensitive) return { rec: "yes", why: "You handle payment or sensitive data, so a firewall in front of the system blocks common attacks." };
      if (level >= 3) return { rec: "yes", why: "A high-traffic public system is a target for automated attacks; a WAF filters them out." };
      return { rec: "optional", why: "Standard security and CDN protection are enough to start." };
    case "monitoring":
      return level >= 2
        ? { rec: "yes", why: "Alerts tell the team about errors or downtime before customers notice." }
        : { rec: "optional", why: "Basic uptime checks come with managed hosting; full monitoring is optional at this size." };
    case "logging":
      return level >= 3
        ? { rec: "yes", why: "With several services, central logs make problems quick to trace." }
        : { rec: "no", why: "Not needed yet: the hosting platform's logs are enough at this size." };
    case "staging":
      return level >= 2
        ? { rec: "yes", why: "Changes are tested on a safe copy before they reach customers." }
        : { rec: "optional", why: "Useful once several people rely on the system; optional for a first release." };
    case "cicd":
      return { rec: level >= 2 ? "yes" : "optional", why: "Automatic tests and repeatable releases reduce the risk of each update." };
    case "docker":
      return { rec: level >= 2 ? "yes" : "optional", why: "Packages the app the same way everywhere and keeps your hosting portable between providers." };
    case "backup":
      return { rec: "yes", why: "Daily backups with tested restore protect your data." };
    case "sql_db":
      return { rec: "yes", why: "Stores your core records reliably in a managed PostgreSQL or SQL Server database." };
    case "vector_db":
    case "rag":
      if (required) return { rec: "yes", why: "Your AI needs to answer from your own content, so knowledge search keeps answers grounded and up to date." };
      return { rec: "optional", why: "Only needed if the AI must answer from your own documents or website." };
    case "search":
      if (required) return { rec: "yes", why: "Customers need fast, typo-tolerant search across many products or records." };
      return { rec: "optional", why: "Database search is enough at this size." };
    case "nosql":
      return { rec: "no", why: "Not needed: a SQL database fits your data. Useful later for very large event or log volumes." };
    case "realtime":
      return required
        ? { rec: "yes", why: "You need live updates on screen, so real-time connections push changes instantly." }
        : { rec: "no", why: "Not needed: normal page refresh is fine for your use." };
    case "file_storage":
    case "image_storage":
    case "video_storage":
      return required
        ? { rec: "yes", why: "You will store files or media. Object storage is low cost, durable and scales automatically." }
        : { rec: "no", why: "You haven't mentioned storing files of this kind." };
    case "mfa":
      return required || s.security.personal
        ? { rec: "yes", why: "Protects accounts that can see personal or sensitive data." }
        : { rec: "optional", why: "Recommended for admin users; optional for everyone else." };
    case "sso":
      return required ? { rec: "yes", why: "Your staff can sign in with their existing Microsoft or Google accounts." } : { rec: "optional", why: "Useful if staff already use Microsoft 365 or Google Workspace." };
    case "audit":
      return required ? { rec: "yes", why: "You need a record of who changed what, and when." } : { rec: "optional", why: "Useful for compliance; not required by your answers." };
    case "secrets":
      return level >= 3 ? { rec: "yes", why: "Several services need keys; a vault keeps them out of code and rotates them safely." } : { rec: "optional", why: "Platform environment settings are enough at this size." };
    case "hosting":
      return { rec: "yes", why: "Managed hosting for the frontend and API, sized to your architecture level." };
    case "encryption":
      return { rec: "yes", why: "HTTPS everywhere and encrypted storage are standard on every DotSeek build." };
    default: {
      const item = itemById(id);
      return required ? { rec: "yes", why: `Included for your requirement: ${item?.summary.toLowerCase() ?? ""}` } : { rec: "optional", why: item?.summary ?? "" };
    }
  }
}

// ---------- Diagram ----------

function buildDiagram(sel: Set<string>, s: Signals): Diagram {
  const layers: Diagram["layers"] = [{ id: "users", label: "Users", nodes: [{ id: "users", label: "Users", note: regionLabel[s.regions] }] }];
  const push = (layer: DiagramLayer, node: DiagramNode) => {
    let l = layers.find((x) => x.id === layer);
    if (!l) {
      l = { id: layer, label: { client: "Apps", edge: "Edge", service: "Services", data: "Data", external: "External" }[layer], nodes: [] };
      layers.push(l);
    }
    if (!l.nodes.some((n) => n.label === node.label)) l.nodes.push(node);
  };
  const order: DiagramLayer[] = ["client", "edge", "service", "data", "external"];
  for (const layer of order) {
    for (const item of planItems) {
      if (!sel.has(item.id) || item.diagram?.layer !== layer) continue;
      let label = item.diagram.node;
      let note: string | undefined;
      if (item.id === "frontend") label = s.solution === "website" ? "Website" : s.solution === "ai_chatbot" ? "Website chat" : "Web app";
      if (item.id === "backend") {
        if (sel.has("autoscaling")) label = "Backend instances";
        note = sel.has("kubernetes") ? "Kubernetes" : sel.has("docker") ? "Docker" : "Managed hosting";
      }
      if (item.id === "worker" && sel.has("queue")) note = "from queue";
      push(layer, { id: item.id, label, note });
    }
    if (layer === "service" && ["ai_chatbot", "ai_agent", "rag", "document_ai", "voice_ai", "ai_insights"].some((id) => sel.has(id))) {
      push("external", { id: "llm", label: "LLM", note: "AI model API" });
    }
  }
  // Keep the layer order users -> client -> edge -> service -> data -> external.
  const rank = (id: string) => ["users", ...order].indexOf(id);
  layers.sort((a, b) => rank(a.id) - rank(b.id));
  return { layers };
}

// ---------- Phases ----------

/** 1 Launch, 2 Run the business, 3 Mobile, 4 AI and scale. The solution's main item is always Phase 1. */
function phaseOfItem(id: string, s: Signals): number {
  if (coreFor(s).has(id)) return 1;
  if (["admin", "automation", "analytics", "rbac", "multilang", "inapp", "audit", "data_pipeline"].includes(id)) return 2;
  if (id.startsWith("int_") && s.solution !== "integration") return 2;
  if (["mobile_app", "push"].includes(id)) return 3;
  if (["ai_chatbot", "ai_agent", "rag", "vector_db", "document_ai", "voice_ai", "ai_insights"].includes(id)) return 4;
  return 1;
}

/** The leanest Phase 1: launch scope only, on essential hosting (later phases switched off). */
export function leanPhaseOneChoices(answers: Answers, choices: PlanChoices = {}): PlanChoices {
  const s = readSignals(answers);
  const req = readRequirements(answers, s);
  const tier = choices.tier ?? tiers[recommendLevel(s, req) - 1].id;
  const calc = calculate(s, req, tier, 1, choices);
  const laterIds = [...calc.selected].filter((id) => phaseOfItem(id, s) > 1);
  // Leanest means Basic levels too (no upgrades carried over from the slider or manual changes).
  return { ...chooseTier(choices, "starter"), scopes: {}, target: undefined, off: [...new Set([...(choices.off ?? []), ...laterIds])] };
}

// ---------- Plan ----------

const PHASE_LATER = ["mobile_app", "ai_agent", "ai_chatbot", "ai_insights", "analytics", "multilang", "voice_ai", "int_erp", "automation"];

function defaultProvider(level: number, s: Signals) {
  if (level <= 2 && s.solution === "website") return "vercel";
  return "azure";
}

function packageChoices(pkg: PackageDef, s: Signals, req: Requirements, recommended: TierId): PlanChoices {
  const tier: TierId = pkg.tier === "starter" ? "starter" : tierLevel(recommended) >= 2 ? recommended : "standard";
  const off = [...pkg.exclude];
  if (pkg.maxIntegrations !== undefined) {
    const ints = [...req.items].filter((id) => id.startsWith("int_"));
    off.push(...ints.slice(pkg.maxIntegrations));
  }
  const on = pkg.include.filter((id) => !(s.solution === "software" && id === "cms"));
  return { tier, on, off };
}

export function buildPlan(answers: Answers, choices: PlanChoices = {}): Plan {
  const s = readSignals(answers);
  const req = readRequirements(answers, s);
  const level = recommendLevel(s, req);
  const recommendedTier = tiers[level - 1].id;
  const tier = choices.tier && tierById(choices.tier) ? choices.tier : recommendedTier;
  const providerId = choices.provider && providerById(choices.provider) ? choices.provider : defaultProvider(level, s);
  const provider = providerById(providerId)!;
  const calc = calculate(s, req, tier, provider.factor, choices);
  const sel = calc.selected;
  const currentLevel = tierLevel(tier);

  // Services (every catalogue item, for the builder).
  const offered = planItems.filter((item) => !item.onlyFor || item.onlyFor.includes(s.solution) || sel.has(item.id));
  const services: ServiceView[] = offered.map((item) => {
    const selected = sel.has(item.id);
    const r = reasonFor(item.id, s, req, currentLevel);
    const status: ItemStatus = selected ? "included" : r.rec === "yes" ? "recommended" : r.rec === "optional" ? "optional" : "not_needed";
    const scopes = scopesFor(item);
    const scope = scopes ? scopeOf(item.id, choices, req) : undefined;
    const baseMonthly = monthlyFor(item, tier);
    const monthly = baseMonthly ? scaleRange(baseMonthly, scopeLevels[scope ?? "basic"].monthly) : null;
    const setup = (id: ScopeId) => roundMoney(itemPrice(item, id, s, req)[1]);
    return {
      id: item.id,
      label: req.labels[item.id] ?? item.label,
      group: item.group,
      summary: req.summaries[item.id] ?? item.summary,
      selected,
      locked: LOCKED.has(item.id),
      status,
      reason: r.why,
      setupCost: setup(scope ?? "basic"),
      monthly: monthly ? roundRange(item.usage ? scaleRange(monthly, req.usageFactor) : isInfra(item) ? scaleRange(monthly, provider.factor) : monthly) : null,
      usage: Boolean(item.usage),
      impact: item.impact,
      scope,
      scopeOptions: scopes ? SCOPE_IDS.map((id) => ({ id, label: scopeLevels[id].label, detail: scopes[id], setupCost: setup(id) })) : undefined,
    };
  });

  const running = addRange(calc.infra, calc.usage);
  const firstYear = roundRange(addRange([calc.build, calc.build], scaleRange(addRange(running, calc.maintenance), 12)));

  // Markets: typical freelancer and agency prices for the same scope (configurable multipliers and exchange rates).
  const local = (n: number) => (n >= 10000 ? Math.round(n / 100) * 100 : n >= 1000 ? Math.round(n / 50) * 50 : Math.round(n / 10) * 10);
  const marketRows = markets.map((m) => {
    const freelancerGbp = roundRange(scaleRange(m.freelancer, calc.build));
    const agencyGbp = roundRange(scaleRange(m.agency, calc.build));
    return {
      id: m.id,
      name: m.name,
      currency: m.currency,
      locale: m.locale,
      freelancer: [local(freelancerGbp[0] * m.perGbp), local(freelancerGbp[1] * m.perGbp)] as Range,
      agency: [local(agencyGbp[0] * m.perGbp), local(agencyGbp[1] * m.perGbp)] as Range,
      freelancerGbp,
      agencyGbp,
    };
  });
  const uk = marketRows.find((m) => m.id === "uk")!.agencyGbp;
  const savings =
    uk[1] > calc.build
      ? {
          amount: [Math.max(0, roundMoney(uk[0] - calc.build)), roundMoney(uk[1] - calc.build)] as Range,
          percent: [Math.max(0, Math.round(((uk[0] - calc.build) / uk[0]) * 100)), Math.round(((uk[1] - calc.build) / uk[1]) * 100)] as Range,
        }
      : null;

  // Architecture tiers (same requirement, different infrastructure).
  const infraOverrides = (c: PlanChoices): PlanChoices => ({
    scopes: c.scopes,
    on: (c.on ?? []).filter((id) => !INFRA_GROUPS.includes(itemById(id)!.group)),
    off: (c.off ?? []).filter((id) => !INFRA_GROUPS.includes(itemById(id)!.group)),
  });
  const tierRows = tiers.map((t) => {
    const c = t.id === tier ? calc : calculate(s, req, t.id, provider.factor, infraOverrides(choices));
    return {
      id: t.id,
      name: t.name,
      level: t.level,
      tagline: t.tagline,
      bestFor: t.bestFor,
      monthly: addRange(c.infra, c.usage),
      build: c.build,
      services: tierInfra(t.id, s, req).map((id) => itemById(id)!.label),
      recommended: t.id === recommendedTier,
      current: t.id === tier,
    };
  });

  // Providers for the current architecture.
  const base = calculate(s, req, tier, 1, choices).infra;
  const providerRows = providers
    .map((p) => ({
      id: p.id,
      name: p.name,
      monthly: roundRange(addRange(scaleRange(base, p.factor), calc.usage)),
      suitable: currentLevel >= p.levels[0] && currentLevel <= p.levels[1],
      scalability: p.scalability,
      reliability: p.reliability,
      management: p.management,
      suits: p.suits,
      pros: p.pros,
      limits: p.limits,
      option: undefined as "A" | "B" | "C" | undefined,
      current: p.id === providerId,
    }))
    .sort((a, b) => Number(b.suitable) - Number(a.suitable));
  const optA = providerRows.find((p) => p.id === "azure");
  const optB = providerRows.find((p) => p.id === "aws");
  // Option C: the lowest-cost suitable provider that doesn't need heavy hands-on DevOps.
  const optC =
    providerRows
      .filter((p) => p.suitable && !["azure", "aws", "gcp"].includes(p.id) && p.reliability >= 2 && p.management !== "High")
      .sort((a, b) => a.monthly[0] - b.monthly[0])[0] ?? providerRows.find((p) => p.id === "gcp");
  if (optA) optA.option = "A";
  if (optB) optB.option = "B";
  if (optC) optC.option = "C";

  // Packages.
  const packageRows = packages[s.family].map((pkg) => {
    const c = { ...packageChoices(pkg, s, req, recommendedTier), scopes: choices.scopes, provider: choices.provider };
    const r = calculate(s, req, c.tier!, provider.factor, c);
    const web = s.solution === "software" ? "Web app" : "Website";
    return {
      id: pkg.id,
      name: pkg.name.replace("{web}", web),
      summary: pkg.summary,
      build: r.build,
      monthly: addRange(r.infra, r.usage),
      weeks: r.weeks,
      items: planItems.filter((i) => r.selected.has(i.id) && !INFRA_GROUPS.includes(i.group) && i.id !== "discovery").map((i) => i.label),
      choices: c,
      current: false,
    };
  });
  const currentKey = [...sel].sort().join();
  for (const p of packageRows) {
    const c = calculate(s, req, p.choices.tier!, provider.factor, p.choices);
    p.current = [...c.selected].sort().join() === currentKey && p.choices.tier === tier;
  }

  // Phases: launch within budget, then run the business, mobile, then AI and scale.
  const phaseOf = (id: string) => phaseOfItem(id, s);
  const OVERHEAD = ["testing", "deployment", "management"];
  const work = calc.lines.filter((l) => !OVERHEAD.includes(l.id));
  const workTotal = work.reduce((t, l) => t + l.cost, 0) || 1;
  const overhead = calc.lines.filter((l) => OVERHEAD.includes(l.id));
  const phaseDefs = [
    { name: "Launch", summary: "The core solution, live and in use, with the architecture ready to grow." },
    { name: "Run the business", summary: "Admin tools, automation and further integrations once the core is in use." },
    { name: "Mobile", summary: "iOS and Android apps on the same backend." },
    { name: "AI and scale", summary: "AI features and the next architecture level as usage grows." },
  ];
  let cumulative = 0;
  const phases: Plan["phases"] = [];
  phaseDefs.forEach((def, i) => {
    const lines = work.filter((l) => phaseOf(l.id) === i + 1);
    const nextTier = i === 3 && !isSimpleSite(answers) ? tiers.find((t) => t.level === currentLevel + 1) : undefined;
    const scaleItems = nextTier ? tierInfra(nextTier.id, s, req).filter((id) => !sel.has(id)).map((id) => itemById(id)!.label) : [];
    if (!lines.length && !scaleItems.length) return;
    const share = lines.reduce((t, l) => t + l.cost, 0) / workTotal;
    const add = (k: "cost" | "min" | "max") => lines.reduce((t, l) => t + l[k], 0) + overhead.reduce((t, l) => t + l[k], 0) * share;
    const cost = roundMoney(add("cost"));
    cumulative += cost;
    const name = i === 3 && !lines.length ? "Scale" : def.name;
    phases.push({
      name: `Phase ${phases.length + 1}: ${name}`,
      summary: scaleItems.length && !lines.length ? `When usage grows, move to the ${nextTier!.name} architecture.` : def.summary,
      items: [...lines.map((l) => l.label), ...scaleItems.map((x) => `${x} (when needed)`)],
      cost,
      min: roundMoney(add("min")),
      max: roundMoney(add("max")),
      withinBudget: s.budget ? cumulative <= s.budget[1] : undefined,
    });
  });

  // "Add later" items: indicative costs, not part of this estimate.
  const laterLines: Line[] = (choices.later ?? [])
    .map((id) => itemById(id))
    .filter((item): item is PlanItem => Boolean(item) && !LOCKED.has(item!.id))
    .map((item) => {
      const [lo, rec, hi] = itemPrice(item, scopesFor(item) ? scopeOf(item.id, choices, req) : "basic", s, req);
      return { id: item.id, label: item.label, days: item.days, cost: roundMoney(rec), min: roundMoney(lo), max: roundMoney(hi) };
    });
  if (laterLines.length) {
    phases.push({
      name: "Later upgrades",
      summary: "Added after launch, when you're ready. Not included in this estimate.",
      items: laterLines.map((l) => l.label),
      cost: laterLines.reduce((t, l) => t + l.cost, 0),
      min: laterLines.reduce((t, l) => t + l.min, 0),
      max: laterLines.reduce((t, l) => t + l.max, 0),
    });
  }

  // Upgrade path from the current tier.
  const upgradePath = tierRows
    .filter((t) => t.level > currentLevel)
    .map((t, i, arr) => {
      const prev = i === 0 ? [...sel] : tierInfra(arr[i - 1].id, s, req);
      const adds = tierInfra(t.id, s, req).filter((id) => !prev.includes(id)).map((id) => itemById(id)!.label);
      return { tier: t.name, adds, monthly: t.monthly };
    })
    .filter((u) => u.adds.length);

  // Consultant advice (deterministic, always available; the AI adds more).
  const advice: Advice[] = [];
  const mobileOnly = s.solution === "software" && !sel.has("frontend");
  if (sel.has("mobile_app") && !mobileOnly && (!s.publicUsers || s.usersTier === 0)) {
    const saving = calc.lines.find((l) => l.id === "mobile_app")?.cost ?? 0;
    advice.push({
      id: "mobile-phase",
      item: "mobile_app",
      action: "remove",
      message: `Based on your current requirement, you may not need a mobile application in Phase 1. Starting with a responsive web application could reduce the initial development cost by about £${saving.toLocaleString("en-GB")}.`,
    });
  }
  if (sel.has("kubernetes") && currentLevel < 4) {
    advice.push({ id: "k8s", item: "kubernetes", action: "remove", message: reasonFor("kubernetes", s, req, currentLevel).why });
  }
  if (sel.has("multi_region") && s.regions === "uk" && s.availability < 2) {
    advice.push({ id: "multi-region", item: "multi_region", action: "remove", message: reasonFor("multi_region", s, req, currentLevel).why });
  }
  if (tierLevel(tier) > level) {
    advice.push({
      id: "tier-high",
      action: "info",
      message: `You've chosen a bigger architecture than your requirement needs. The ${tiers[level - 1].name} setup would cost less each month and can be upgraded later without a rebuild.`,
    });
  } else if (tierLevel(tier) < level) {
    advice.push({
      id: "tier-low",
      action: "info",
      message: `The ${tierById(tier)!.name} setup keeps costs down, but for your traffic and availability needs we recommend ${tiers[level - 1].name}. Plan the upgrade before usage grows.`,
    });
  }
  if (answers.agent_approval === "No, fully automatic") {
    advice.push({ id: "approval", action: "info", message: "We recommend starting with human approval for important actions, then automating fully once the agent's results are proven." });
  }
  let budgetFit: Plan["budgetFit"] = null;
  if (s.budget) {
    budgetFit = calc.build <= s.budget[1] ? "within" : "above";
    if (budgetFit === "above") {
      const budget = `£${s.budget[1].toLocaleString("en-GB")}`;
      const full = `about £${roundMoney(calc.buildMin).toLocaleString("en-GB")}–£${roundMoney(calc.buildMax).toLocaleString("en-GB")}`;
      // Lean Phase 1: the launch scope only, on essential hosting.
      const leanChoices = leanPhaseOneChoices(answers, choices);
      const lean = calculate(s, req, "starter", provider.factor, leanChoices);
      const later = phases.slice(1).map((p) => p.name).join(", ");
      advice.push(
        lean.build <= s.budget[1]
          ? {
              id: "budget",
              action: "info",
              message: `Your full requirement (${full}) is above your current budget of ${budget}, but we can start with a Phase 1 solution within your budget (about £${lean.build.toLocaleString("en-GB")} on essential hosting) and keep the architecture ready for future expansion.${later ? ` Then: ${later}.` : ""}`,
              choices: leanChoices,
              choicesLabel: "Start with Phase 1",
            }
          : {
              id: "budget",
              action: "info",
              message: `Your full requirement (${full}) is above your current budget of ${budget}. The leanest Phase 1 is about £${lean.build.toLocaleString("en-GB")}. Tell us your budget and the team will suggest how to adjust or phase the project.`,
              choices: leanChoices,
              choicesLabel: "See the leanest Phase 1",
            },
      );
    }
  }

  // Stages are "from" bands, so place the project by the middle of its minimum and recommended estimates.
  const stageRow = tier === "enterprise" ? stages[stages.length - 1] : stages.find((st) => (calc.buildMin + calc.build) / 2 < st.upTo)!;

  const profile = [
    { label: "Business", value: [answers.biz_stage, answers.biz_size ? `${answers.biz_size} people` : ""].filter(Boolean).join(", ") || "Not given" },
    { label: "Monthly users", value: answers.ops_users ?? "Not given" },
    { label: "User locations", value: answers.ops_regions ?? "Not given" },
    { label: "Availability", value: answers.ops_availability ?? "Not given" },
    { label: "Growth", value: answers.ops_growth ?? "Not given" },
    ...(req.backgroundTasks.length ? [{ label: "Background work", value: req.backgroundTasks.join(", ") }] : []),
  ].filter((row) => row.value !== "Not given");

  return {
    label: pricingMeta.label,
    pricingReviewed: pricingMeta.reviewed,
    solution: s.solution,
    level,
    recommendedTier,
    tier,
    provider: providerId,
    profile,
    selected: [...sel],
    services,
    lines: calc.lines,
    days: Math.round(calc.days),
    build: calc.build,
    estimate: { min: roundMoney(calc.buildMin), recommended: calc.build, max: roundMoney(calc.buildMax) },
    stage: stageRow.id,
    stageInfo: { name: stageRow.name, priceLabel: stageRow.priceLabel },
    weeks: calc.weeks,
    monthly: { infrastructure: calc.infra, usage: calc.usage, maintenance: calc.maintenance, running, items: calc.items },
    firstYear,
    markets: marketRows,
    savings,
    tiers: tierRows,
    providers: providerRows,
    packages: packageRows,
    phases,
    upgradePath,
    diagram: buildDiagram(sel, s),
    advice,
    later: laterLines,
    budget: s.budget,
    backgroundTasks: req.backgroundTasks,
    budgetFit,
    // The slider always spans the current estimate, even after the customer's own changes.
    priceRange: [Math.min(fit({ s, req }, {}, 0).cost, calc.build), Math.max(fit({ s, req }, {}, Infinity).cost, calc.build)],
    recommendedPrice: costOf({ s, req }, { provider: choices.provider }).build,
    target: choices.target,
  };
}

// ---------- Price slider: fit the quote to a target price ----------

type Ctx = { s: Signals; req: Requirements };
/** `change` merges repeated steps on one thing (e.g. Basic → Advanced → Custom) into one line. */
type Move = { label: string; rank: number; choices: PlanChoices; change?: { key: string; from: string; to: string } };

const STEP_DOWN: Record<ScopeId, ScopeId | null> = { custom: "advanced", advanced: "basic", basic: null };
const STEP_UP: Record<ScopeId, ScopeId | null> = { basic: "advanced", advanced: "custom", custom: null };
const TIER_ORDER: TierId[] = ["starter", "standard", "advanced", "enterprise"];

function costOf({ s, req }: Ctx, c: PlanChoices) {
  const tier = c.tier ?? tiers[recommendLevel(s, req) - 1].id;
  return calculate(s, req, tier, 1, c);
}

/** Ways to make the quote cheaper, most acceptable first (lower rank). */
function cheaperMoves(ctx: Ctx, c: PlanChoices): Move[] {
  const { s, req } = ctx;
  const calc = costOf(ctx, c);
  const core = coreFor(s);
  const moves: Move[] = [];
  for (const id of calc.selected) {
    const item = itemById(id)!;
    if (!scopesFor(item)) continue;
    const from = scopeOf(id, c, req);
    const to = STEP_DOWN[from];
    if (to) moves.push({ rank: core.has(id) ? 1.5 : 1, label: item.label, choices: setScope(c, id, to), change: { key: id, from: scopeLevels[from].label, to: scopeLevels[to].label } });
  }
  for (const id of calc.selected) {
    if (LOCKED.has(id) || core.has(id)) continue;
    const item = itemById(id)!;
    const userAdded = (c.on ?? []).includes(id) && !req.items.has(id);
    if (PHASE_LATER.includes(id) || userAdded) {
      moves.push({ rank: 2, label: `${item.label} moved to a later phase`, choices: toggleChoice(c, id, false) });
    }
  }
  const tier = c.tier ?? tiers[recommendLevel(s, req) - 1].id;
  const lower = TIER_ORDER[TIER_ORDER.indexOf(tier) - 1];
  if (lower) {
    moves.push({ rank: 3, label: "Architecture", choices: chooseTier(c, lower), change: { key: "tier", from: tierById(tier)!.name, to: tierById(lower)!.name } });
  }
  const ints = [...calc.selected].filter((id) => id.startsWith("int_"));
  for (const id of ints.slice(1)) {
    moves.push({ rank: 4, label: `${itemById(id)!.label} moved to a later phase`, choices: toggleChoice(c, id, false) });
  }
  return moves;
}

/** Ways to add value within a bigger budget: the recommended architecture, recommended services, then higher levels. */
function richerMoves(ctx: Ctx, c: PlanChoices): Move[] {
  const { s, req } = ctx;
  const calc = costOf(ctx, c);
  const core = coreFor(s);
  const level = recommendLevel(s, req);
  const tier = c.tier ?? tiers[level - 1].id;
  const moves: Move[] = [];
  const higher = TIER_ORDER[TIER_ORDER.indexOf(tier) + 1];
  if (higher && tierLevel(higher) <= level) {
    moves.push({ rank: 0, label: "Architecture", choices: chooseTier(c, higher), change: { key: "tier", from: tierById(tier)!.name, to: tierById(higher)!.name } });
  }
  for (const item of planItems) {
    if (calc.selected.has(item.id) || (c.off ?? []).includes(item.id)) continue;
    if (reasonFor(item.id, s, req, tierLevel(tier)).rec !== "yes") continue;
    // A shared web + mobile entry point only matters while the mobile app is in the plan.
    if (item.id === "api_gateway" && !calc.selected.has("mobile_app") && tierLevel(tier) < 3) continue;
    if (item.onlyFor && !item.onlyFor.includes(s.solution)) continue;
    // Firebase / Supabase already provide the database, backups, sign-in and push.
    if (calc.selected.has("managed_backend") && ["sql_db", "backup", "auth", "push", "backend"].includes(item.id)) continue;
    moves.push({ rank: 1, label: `Added ${item.label} (recommended)`, choices: toggleChoice(c, item.id, true) });
  }
  for (const id of calc.selected) {
    const item = itemById(id)!;
    if (!scopesFor(item)) continue;
    const from = scopeOf(id, c, req);
    const to = STEP_UP[from];
    if (!to) continue;
    const infra = INFRA_GROUPS.includes(item.group) || item.group === "communication" || id === "discovery";
    // Infrastructure is never pushed to Custom by the slider (that is a compliance-led, manual choice).
    if (infra && to === "custom") continue;
    const rank = to === "advanced" ? (infra ? 3 : core.has(id) ? 2 : 2.2) : core.has(id) ? 4 : 4.2;
    moves.push({ rank, label: item.label, choices: setScope(c, id, to), change: { key: id, from: scopeLevels[from].label, to: scopeLevels[to].label } });
  }
  return moves;
}

function fit({ s, req }: Ctx, start: PlanChoices, target: number): { choices: PlanChoices; cost: number; changes: string[] } {
  const ctx = { s, req };
  let c = start;
  let cost = costOf(ctx, c).build;
  const removed: string[] = [];
  const merged = new Map<string, { label: string; from: string; to: string }>();
  const record = (m: Move) => {
    if (!m.change) return removed.push(m.label);
    const prev = merged.get(m.change.key);
    merged.set(m.change.key, { label: m.label, from: prev?.from ?? m.change.from, to: m.change.to });
  };

  // 1. Cheaper until the price fits: gentlest change that reaches the target, else the biggest saving at the most acceptable rank.
  for (let i = 0; i < 160 && cost > target; i++) {
    const options = cheaperMoves(ctx, c)
      .map((m) => ({ ...m, cost: costOf(ctx, m.choices).build }))
      .filter((m) => m.cost < cost);
    if (!options.length) break;
    const rank = Math.min(...options.map((m) => m.rank));
    const sameRank = options.filter((m) => m.rank === rank);
    const pick = sameRank.filter((m) => m.cost <= target).sort((a, b) => b.cost - a.cost)[0] ?? sameRank.sort((a, b) => a.cost - b.cost)[0];
    c = pick.choices;
    cost = pick.cost;
    record(pick);
  }
  // 2. Then use what's left: the most valuable upgrade that still fits, at the most important rank.
  //    Things just made cheaper are not reversed.
  const cut = new Set(merged.keys());
  for (let i = 0; i < 160; i++) {
    const options = richerMoves(ctx, c)
      .filter((m) => !(m.change && cut.has(m.change.key)))
      .map((m) => ({ ...m, cost: costOf(ctx, m.choices).build }))
      .filter((m) => m.cost > cost && m.cost <= target);
    if (!options.length) break;
    const rank = Math.min(...options.map((m) => m.rank));
    const pick = options.filter((m) => m.rank === rank).sort((a, b) => b.cost - a.cost)[0];
    c = pick.choices;
    cost = pick.cost;
    record(pick);
  }
  const changes = [
    ...removed,
    ...[...merged.values()].filter((m) => m.from !== m.to).map((m) => `${m.label}: ${m.from} → ${m.to}`),
  ];
  return { choices: c, cost, changes };
}

/**
 * Adjusts the customer's choices to fit a target development price: cheaper by
 * lowering levels, moving extras to a later phase and simplifying the
 * architecture; richer by moving to the recommended architecture, adding
 * recommended services and raising levels. Never adds unrelated features.
 */
export function fitToBudget(answers: Answers, choices: PlanChoices, target: number): { choices: PlanChoices; changes: string[]; cost: number } {
  const s = readSignals(answers);
  const req = readRequirements(answers, s);
  const result = fit({ s, req }, choices, target);
  return { ...result, choices: { ...result.choices, target: Math.round(target) } };
}

/** Validates choices from the browser against the catalogue. */
export function sanitizeChoices(input: unknown): PlanChoices {
  if (!input || typeof input !== "object") return {};
  const raw = input as Record<string, unknown>;
  const ids = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && Boolean(itemById(x))).slice(0, 80) : []);
  return {
    tier: typeof raw.tier === "string" && tierById(raw.tier) ? (raw.tier as TierId) : undefined,
    provider: typeof raw.provider === "string" && providerById(raw.provider) ? raw.provider : undefined,
    on: ids(raw.on),
    off: ids(raw.off),
    target: typeof raw.target === "number" && raw.target > 0 && raw.target < 10_000_000 ? Math.round(raw.target) : undefined,
    later: Array.isArray(raw.later)
      ? raw.later.filter((x): x is string => typeof x === "string" && (x === "__animation" || Boolean(itemById(x)))).slice(0, 40)
      : undefined,
    scopes:
      raw.scopes && typeof raw.scopes === "object"
        ? Object.fromEntries(
            Object.entries(raw.scopes as Record<string, unknown>)
              .filter(([id, v]) => Boolean(itemById(id)) && SCOPE_IDS.includes(v as ScopeId))
              .slice(0, 80),
          ) as Record<string, ScopeId>
        : undefined,
  };
}

/** Set Basic / Advanced / Custom for one item. */
export function setScope(choices: PlanChoices, id: string, scope: ScopeId): PlanChoices {
  return { ...choices, scopes: { ...choices.scopes, [id]: scope } };
}

/** Toggle one item, keeping on/off lists minimal. */
export function toggleChoice(choices: PlanChoices, id: string, on: boolean): PlanChoices {
  const onList = (choices.on ?? []).filter((x) => x !== id);
  const offList = (choices.off ?? []).filter((x) => x !== id);
  return { ...choices, on: on ? [...onList, id] : onList, off: on ? offList : [...offList, id] };
}

/** Switch architecture tier: infrastructure overrides reset to the tier's defaults. */
export function chooseTier(choices: PlanChoices, tier: TierId): PlanChoices {
  const keep = (list?: string[]) => (list ?? []).filter((id) => !INFRA_GROUPS.includes(itemById(id)!.group));
  return { ...choices, tier, on: keep(choices.on), off: keep(choices.off) };
}
