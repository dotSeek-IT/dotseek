/** Reference analysis types and feature names: tiny, so chat UI can import them without the pricing engine. */

export const REFERENCE_FEATURES = {
  forms: "Contact and enquiry forms",
  auth: "Login and user accounts",
  dashboard: "Dashboard",
  backend: "Backend / API",
  admin: "Admin portal",
  database: "Database",
  search: "Search",
  ecommerce: "Online store",
  payments: "Payment integration",
  booking: "Booking",
  chatbot: "Chatbot",
  ai: "AI features",
  integrations: "Integrations with other systems",
  multilang: "Multiple languages",
  customerPortal: "Customer portal",
  roles: "User roles",
  reporting: "Reporting",
  realtime: "Live features",
  blog: "Blog or news",
  mobileApp: "Mobile app",
} as const;

export type ReferenceFeature = keyof typeof REFERENCE_FEATURES;
export const REFERENCE_FEATURE_IDS = Object.keys(REFERENCE_FEATURES) as ReferenceFeature[];

export type ReferenceAnalysis = {
  url: string;
  host: string;
  title: string;
  kind: "website" | "webapp" | "saas" | "ecommerce" | "mobile";
  /** Estimated number of distinct pages or screens. */
  pages: number;
  design: "simple" | "moderate" | "rich";
  animations: "none" | "some" | "heavy";
  responsive: boolean;
  features: Partial<Record<ReferenceFeature, boolean>>;
  /** Third-party services spotted (for integration estimates). */
  services: string[];
  /** Short evidence lines, e.g. "Checkout and basket links found". */
  evidence: string[];
  summary: string;
  /** AI explanation of what drives the cost, if the AI was available. */
  costDrivers?: string;
  source: "ai" | "rules";
};


/** Validates a reference analysis sent back by the browser before it is stored. */
export function sanitizeReference(input: unknown): ReferenceAnalysis | undefined {
  if (!input || typeof input !== "object") return undefined;
  const r = input as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  if (!str(r.url, 500).startsWith("http")) return undefined;
  const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
  const features = (r.features && typeof r.features === "object" ? r.features : {}) as Record<string, unknown>;
  return {
    url: str(r.url, 500),
    host: str(r.host, 200),
    title: str(r.title, 200),
    kind: pick(r.kind, ["website", "webapp", "saas", "ecommerce", "mobile"] as const, "website"),
    pages: typeof r.pages === "number" ? Math.max(1, Math.min(200, Math.round(r.pages))) : 1,
    design: pick(r.design, ["simple", "moderate", "rich"] as const, "moderate"),
    animations: pick(r.animations, ["none", "some", "heavy"] as const, "none"),
    responsive: r.responsive === true,
    features: Object.fromEntries(REFERENCE_FEATURE_IDS.filter((f) => features[f] === true).map((f) => [f, true])),
    services: Array.isArray(r.services) ? r.services.filter((x): x is string => typeof x === "string").slice(0, 20).map((x) => x.slice(0, 60)) : [],
    evidence: Array.isArray(r.evidence) ? r.evidence.filter((x): x is string => typeof x === "string").slice(0, 16).map((x) => x.slice(0, 160)) : [],
    summary: str(r.summary, 1200),
    costDrivers: str(r.costDrivers, 1200) || undefined,
    source: r.source === "ai" ? "ai" : "rules",
  };
}
