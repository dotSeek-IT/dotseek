/**
 * DotSeek internal pricing engine data: the single source for every figure in
 * the AI-generated indicative estimate (development effort, infrastructure,
 * running costs, market comparison and provider comparison).
 *
 * - The AI never invents prices. It only explains and recommends; all numbers
 *   are calculated from this file by `lib/plan`.
 * - Effort is in person-days. Monthly costs are GBP ranges from DotSeek's own
 *   reviewed pricing table, not live provider quotes.
 * - Review every figure (and `pricingMeta.reviewed`) before relying on it, and
 *   whenever provider pricing changes.
 */

export type TierId = "starter" | "standard" | "advanced" | "enterprise";
export type Range = [number, number];
/** 0 none, 1 low, 2 medium, 3 high. */
export type Rating = 0 | 1 | 2 | 3;

export type ItemGroup =
  | "product"
  | "ai"
  | "integrations"
  | "communication"
  | "performance"
  | "data"
  | "storage"
  | "background"
  | "security"
  | "devops";

export type DiagramLayer = "client" | "edge" | "service" | "data" | "external";

export type PlanItem = {
  id: string;
  label: string;
  group: ItemGroup;
  summary: string;
  /** Effort in person-days (used for the timeline only). */
  days: number;
  /** Price range in GBP at Basic scope, before the complexity factor (from the DotSeek price catalogue). */
  price: Range;
  /** Monthly running cost (GBP), flat or by architecture tier. */
  monthly?: Range | Partial<Record<TierId, Range>>;
  /** Monthly cost depends on usage (AI, messaging). */
  usage?: boolean;
  /** Effect on the running system: performance, reliability, scalability, complexity. */
  impact?: [Rating, Rating, Rating, Rating];
  /** Node shown in the architecture diagram when selected. */
  diagram?: { layer: DiagramLayer; node: string };
  /** Only offered for these solutions (unless already selected). */
  onlyFor?: string[];
  /** Label in the running-costs list, when different from the build label. */
  monthlyLabel?: string;
};

export const pricingMeta = {
  reviewed: "October 2026",
  label: "AI-Generated Indicative Estimate",
  /** Where the recommended estimate sits between each item's minimum and maximum (0 to 1). */
  recommendedPoint: 0.4,
  /** Testing and project management are added once the build is above this size; small sites include them. */
  overheadFrom: 1500,
  testingShare: 0.08,
  managementShare: 0.04,
  /** Delivery capacity in person-days per week by project size (bigger projects get a bigger team). */
  teamCapacity: [
    { upToDays: 20, daysPerWeek: 5 },
    { upToDays: 80, daysPerWeek: 8 },
    { upToDays: Infinity, daysPerWeek: 12 },
  ],
  maintenance: { minMonthly: 15, shareOfBuildPerMonth: 0.02 },
  disclaimer:
    "This is an AI-generated indicative estimate based on your answers and DotSeek's price catalogue. It is not a quotation or an offer. The final commercial quotation is confirmed by the DotSeek team after reviewing your complete requirements.",
  marketDisclaimer:
    "Indicative Market Estimate: typical freelancer and agency price ranges for similar scope, region and complexity, from DotSeek's configurable market data. They are not quotes from other providers, and actual prices vary.",
  infraDisclaimer:
    "Infrastructure figures come from DotSeek's internal pricing table (reviewed October 2026), not live provider quotes. They exclude VAT, domains and third-party licences, and are confirmed against current provider pricing before quoting.",
};

const T = (starter: Range, standard: Range, advanced: Range, enterprise: Range) => ({ starter, standard, advanced, enterprise });

export const planItems: PlanItem[] = [
  // ---------- Product ----------
  { id: "discovery", label: "Discovery & solution design", group: "product", days: 2, price: [0, 100], summary: "Workshops, requirements and the agreed solution design." },
  { id: "landing", label: "Landing page website", group: "product", days: 1.5, price: [100, 250], summary: "A single responsive page with your business information, contact details, WhatsApp button and enquiry form.", diagram: { layer: "client", node: "Website" } },
  { id: "seo", label: "Basic SEO setup", group: "product", days: 1, price: [40, 150], summary: "Page titles, descriptions, sitemap and Google Search Console." },
  { id: "uxui", label: "UI/UX design", group: "product", days: 5, price: [80, 250], summary: "Wireframes, visual design and a clickable prototype." },
  { id: "frontend", label: "Website / web app frontend", group: "product", days: 8, price: [150, 500], summary: "Responsive React / Next.js interface for every screen size.", diagram: { layer: "client", node: "Web app" } },
  { id: "cms", label: "Content management (CMS)", group: "product", days: 3, price: [80, 250], summary: "Edit pages, posts and media yourselves.", diagram: { layer: "service", node: "CMS" } },
  { id: "backend", label: "Backend / API", group: "product", days: 10, price: [200, 600], summary: "Business logic and secure API (Node.js or ASP.NET Core).", diagram: { layer: "service", node: "Backend API" } },
  { id: "auth", label: "Authentication & user accounts", group: "product", days: 3, price: [80, 250], summary: "Sign up, sign in, password reset and profiles." },
  { id: "admin", label: "Admin portal", group: "product", days: 10, price: [250, 800], summary: "Manage customers, content, orders and settings.", diagram: { layer: "client", node: "Admin portal" } },
  { id: "ecommerce", label: "E-commerce (catalogue, cart, checkout)", group: "product", days: 12, price: [500, 1500], summary: "Products, basket, checkout and order management." },
  { id: "bookings", label: "Bookings & scheduling", group: "product", days: 6, price: [150, 450], summary: "Availability, appointments, reminders and changes." },
  { id: "payments", label: "Payment gateway", group: "product", days: 3, price: [80, 250], summary: "Stripe or PayPal payments, refunds and receipts (transaction fees extra).", diagram: { layer: "external", node: "Payments" } },
  { id: "multilang", label: "Multi-language", group: "product", days: 3, price: [100, 400], summary: "Translated content and language switching." },
  { id: "analytics", label: "Advanced analytics & dashboards", group: "product", days: 8, price: [300, 1000], monthly: [0, 30], summary: "Dashboards and reports on the data that matters." },
  { id: "mobile_app", label: "Mobile app (iOS & Android)", group: "product", days: 24, price: [1200, 3500], monthly: [8, 10], summary: "Native-quality iOS and Android app built cross-platform with Flutter or React Native; store accounts in running costs.", monthlyLabel: "App store developer accounts", diagram: { layer: "client", node: "Mobile app" } },
  { id: "managed_backend", label: "Managed backend (Firebase or Supabase)", group: "product", days: 4, price: [200, 600], monthly: [0, 25], summary: "Hosted sign-in, database, storage and push notifications on Firebase or Supabase: no custom server to build or run.", diagram: { layer: "service", node: "Firebase / Supabase" } },
  { id: "data_pipeline", label: "Data pipeline & warehouse", group: "product", days: 10, price: [500, 2000], monthly: T([10, 40], [40, 150], [150, 500], [500, 1500]), summary: "Collects and models data from your systems for reporting.", onlyFor: ["data", "software"], diagram: { layer: "data", node: "Data warehouse" } },

  // ---------- AI ----------
  { id: "ai_chatbot", label: "AI chatbot", group: "ai", days: 6, price: [300, 1200], monthly: [20, 150], usage: true, summary: "Answers, qualifies and hands over to your team.", diagram: { layer: "service", node: "AI service" } },
  { id: "ai_agent", label: "AI agent", group: "ai", days: 12, price: [800, 3000], monthly: [50, 300], usage: true, summary: "Carries out tasks in your systems with human approval.", diagram: { layer: "service", node: "AI service" } },
  { id: "rag", label: "Knowledge search (RAG)", group: "ai", days: 4, price: [200, 800], monthly: [10, 60], usage: true, summary: "AI answers grounded in your own documents." },
  { id: "document_ai", label: "Document AI", group: "ai", days: 6, price: [300, 1200], monthly: [20, 150], usage: true, summary: "Reads and extracts data from PDFs, invoices and forms." },
  { id: "voice_ai", label: "Speech / voice AI", group: "ai", days: 8, price: [500, 2000], monthly: [30, 200], usage: true, summary: "Voice input, transcription or spoken responses." },
  { id: "ai_insights", label: "AI insights & forecasting", group: "ai", days: 6, price: [300, 1200], monthly: [20, 120], usage: true, summary: "Trends, forecasts and recommendations from your data.", onlyFor: ["data", "software", "ai_agent", "automation"] },
  { id: "automation", label: "Workflow automation", group: "ai", days: 8, price: [300, 1200], monthly: [20, 80], summary: "Rule-driven workflows with approvals and notifications.", diagram: { layer: "service", node: "Automation engine" } },

  // ---------- Integrations ----------
  { id: "int_crm", label: "CRM integration", group: "integrations", days: 4, price: [150, 500], summary: "Salesforce, HubSpot or your CRM.", diagram: { layer: "external", node: "CRM" } },
  { id: "int_erp", label: "ERP integration", group: "integrations", days: 7, price: [400, 1500], summary: "Orders, stock and finance in your ERP.", diagram: { layer: "external", node: "ERP" } },
  { id: "int_accounting", label: "Accounting integration", group: "integrations", days: 3, price: [150, 450], summary: "Xero or your accounting system.", diagram: { layer: "external", node: "Accounting" } },
  { id: "int_workspace", label: "Microsoft 365 / Google Workspace", group: "integrations", days: 2, price: [100, 300], summary: "Email, calendar, files and Teams.", diagram: { layer: "external", node: "Microsoft 365 / Google" } },
  { id: "int_ecom", label: "E-commerce platform integration", group: "integrations", days: 3, price: [150, 450], summary: "Shopify or your online store.", diagram: { layer: "external", node: "Shop platform" } },
  { id: "int_spreadsheet", label: "Spreadsheet import & sync", group: "integrations", days: 1.5, price: [50, 200], summary: "Move spreadsheet data into the new system." },
  { id: "int_calendar", label: "Calendar & booking sync", group: "integrations", days: 2, price: [100, 300], summary: "Two-way calendar and booking sync." },
  { id: "int_marketing", label: "Email marketing integration", group: "integrations", days: 1.5, price: [50, 200], summary: "Mailchimp or your marketing tool." },
  { id: "int_other", label: "Other system integration", group: "integrations", days: 3, price: [150, 600], summary: "A further system you named.", diagram: { layer: "external", node: "Other systems" } },

  // ---------- Communication ----------
  { id: "email_service", label: "Transactional email", group: "communication", days: 0.5, price: [0, 50], monthly: [0, 10], summary: "Confirmations, receipts and alerts by email." },
  { id: "sms", label: "SMS notifications", group: "communication", days: 1, price: [50, 150], monthly: [10, 60], usage: true, summary: "Text message reminders and alerts." },
  { id: "whatsapp", label: "WhatsApp integration", group: "communication", days: 3, price: [50, 250], monthly: [10, 80], usage: true, summary: "Conversations and notifications on WhatsApp.", diagram: { layer: "external", node: "WhatsApp" } },
  { id: "push", label: "Push notifications", group: "communication", days: 1.5, price: [100, 300], monthly: [0, 20], summary: "Mobile push messages." },
  { id: "inapp", label: "In-app notifications", group: "communication", days: 2, price: [100, 300], summary: "Notification centre inside the app." },

  // ---------- Performance ----------
  { id: "cdn", label: "CDN (e.g. Cloudflare)", group: "performance", days: 0.5, price: [0, 30], monthly: T([0, 20], [0, 20], [20, 150], [150, 600]), impact: [3, 2, 2, 1], summary: "Serves pages and files from locations close to your users.", diagram: { layer: "edge", node: "CDN" } },
  { id: "redis", label: "Redis cache", group: "performance", days: 1, price: [30, 100], monthly: T([15, 50], [15, 50], [50, 200], [200, 600]), impact: [3, 1, 2, 1], summary: "Keeps frequently read data in memory.", diagram: { layer: "data", node: "Redis" } },
  { id: "load_balancer", label: "Load balancer", group: "performance", days: 1, price: [80, 250], monthly: T([15, 40], [15, 40], [20, 60], [60, 200]), impact: [2, 3, 3, 2], summary: "Spreads traffic across several backend instances.", diagram: { layer: "edge", node: "Load balancer" } },
  { id: "autoscaling", label: "Auto scaling (multiple instances)", group: "performance", days: 1.5, price: [150, 500], monthly: T([60, 300], [60, 300], [100, 400], [300, 1200]), impact: [2, 3, 3, 2], summary: "Adds and removes backend instances as traffic changes." },
  { id: "api_gateway", label: "API gateway", group: "performance", days: 1.5, price: [80, 300], monthly: T([10, 60], [10, 60], [20, 100], [100, 400]), impact: [1, 2, 2, 2], summary: "One secure entry point for web, mobile and partner apps.", diagram: { layer: "edge", node: "API gateway" } },

  // ---------- Data ----------
  { id: "sql_db", label: "SQL database (PostgreSQL / SQL Server)", group: "data", days: 3, price: [60, 200], monthly: T([0, 25], [25, 80], [100, 400], [400, 1500]), impact: [1, 2, 1, 1], summary: "Managed relational database for your core records.", diagram: { layer: "data", node: "Database" } },
  { id: "nosql", label: "NoSQL database", group: "data", days: 2, price: [150, 500], monthly: [20, 150], impact: [2, 1, 3, 2], summary: "Flexible store for events, logs or very large volumes.", diagram: { layer: "data", node: "NoSQL" } },
  { id: "vector_db", label: "Vector database", group: "data", days: 1, price: [50, 200], monthly: T([0, 30], [0, 70], [70, 250], [250, 800]), impact: [2, 1, 2, 1], summary: "Stores embeddings so AI can search your knowledge.", diagram: { layer: "data", node: "Vector DB" } },
  { id: "search", label: "Search engine", group: "data", days: 3, price: [150, 500], monthly: [20, 150], impact: [3, 1, 2, 2], summary: "Fast, typo-tolerant search across products or records.", diagram: { layer: "data", node: "Search" } },

  // ---------- Storage ----------
  { id: "file_storage", label: "File & document storage", group: "storage", days: 0.5, price: [0, 30], monthly: T([1, 15], [1, 15], [10, 60], [60, 250]), impact: [1, 2, 2, 1], summary: "Secure object storage (Azure Blob, S3 or R2).", diagram: { layer: "data", node: "Object storage" } },
  { id: "image_storage", label: "Image storage & optimisation", group: "storage", days: 1, price: [20, 80], monthly: [5, 40], impact: [2, 1, 2, 1], summary: "Resized, compressed images delivered fast.", diagram: { layer: "data", node: "Object storage" } },
  { id: "video_storage", label: "Video storage & streaming", group: "storage", days: 3, price: [300, 1000], monthly: [30, 300], usage: true, impact: [2, 1, 2, 2], summary: "Upload, transcoding and streaming of video.", diagram: { layer: "data", node: "Video storage" } },

  // ---------- Background processing ----------
  { id: "queue", label: "Message queue", group: "background", days: 1.5, price: [50, 200], monthly: T([0, 30], [0, 30], [30, 150], [150, 500]), impact: [2, 3, 3, 2], summary: "Holds work to be done so nothing is lost under load.", diagram: { layer: "data", node: "Queue" } },
  { id: "worker", label: "Background worker", group: "background", days: 2, price: [50, 200], monthly: T([10, 40], [10, 40], [40, 200], [200, 600]), impact: [2, 2, 2, 1], summary: "Runs emails, documents and AI tasks without making users wait.", diagram: { layer: "service", node: "Worker" } },
  { id: "scheduled", label: "Scheduled jobs", group: "background", days: 1, price: [50, 150], monthly: [0, 10], impact: [0, 1, 0, 1], summary: "Nightly imports, reminders and clean-up tasks." },
  { id: "events", label: "Event processing", group: "background", days: 3, price: [200, 600], monthly: [20, 100], impact: [2, 2, 3, 2], summary: "Reacts to events from your systems as they happen." },
  { id: "realtime", label: "Real-time updates (WebSockets)", group: "background", days: 3, price: [200, 800], monthly: [10, 60], impact: [2, 1, 2, 2], summary: "Live chat, tracking and dashboards without refreshing." },

  // ---------- Security ----------
  { id: "waf", label: "Web application firewall (WAF)", group: "security", days: 1, price: [50, 200], monthly: [20, 200], impact: [0, 3, 1, 1], summary: "Blocks common attacks and abusive traffic.", diagram: { layer: "edge", node: "WAF" } },
  { id: "mfa", label: "Two-step login (MFA)", group: "security", days: 1.5, price: [100, 300], monthly: [0, 30], impact: [0, 2, 0, 1], summary: "A second check when people sign in." },
  { id: "sso", label: "Single sign-on (SSO)", group: "security", days: 3, price: [200, 800], monthly: [0, 100], impact: [0, 1, 0, 2], summary: "Staff sign in with Microsoft or Google accounts." },
  { id: "rbac", label: "Role-based permissions", group: "security", days: 2, price: [100, 400], impact: [0, 2, 0, 1], summary: "Each role sees and does only what it should." },
  { id: "encryption", label: "Encryption at rest & in transit", group: "security", days: 0, price: [0, 0], impact: [0, 2, 0, 0], summary: "HTTPS everywhere and encrypted storage." },
  { id: "audit", label: "Audit logs", group: "security", days: 2, price: [100, 400], monthly: [5, 40], impact: [0, 2, 0, 1], summary: "A record of who changed what, and when." },
  { id: "backup", label: "Automated backups", group: "security", days: 0.5, price: [0, 30], monthly: T([5, 15], [10, 30], [30, 120], [120, 400]), impact: [0, 3, 0, 0], summary: "Daily backups with tested restore." },
  { id: "dr", label: "Disaster recovery", group: "security", days: 4, price: [500, 2000], monthly: [100, 800], impact: [0, 3, 1, 2], summary: "A standby environment and recovery plan for major outages." },
  { id: "secrets", label: "Secrets management", group: "security", days: 0.5, price: [50, 150], monthly: [0, 20], impact: [0, 2, 0, 1], summary: "Keys and passwords kept in a secure vault." },

  // ---------- DevOps ----------
  { id: "hosting", label: "Application hosting", group: "devops", days: 0.5, price: [0, 40], monthly: T([5, 20], [30, 120], [150, 600], [600, 2500]), impact: [1, 1, 1, 1], summary: "Managed hosting for the frontend and API." },
  { id: "cicd", label: "CI/CD pipeline", group: "devops", days: 1.5, price: [30, 120], monthly: [0, 20], impact: [0, 2, 1, 1], summary: "Automatic testing and safe, repeatable releases." },
  { id: "docker", label: "Docker containers", group: "devops", days: 1, price: [30, 120], impact: [0, 2, 2, 1], summary: "The same packaged app in every environment." },
  { id: "kubernetes", label: "Kubernetes (AKS / EKS)", group: "devops", days: 8, price: [1000, 3000], monthly: T([150, 500], [150, 500], [150, 500], [400, 1500]), impact: [2, 3, 3, 3], summary: "Container orchestration for large, multi-service systems." },
  { id: "monitoring", label: "Monitoring & alerts", group: "devops", days: 0.5, price: [0, 60], monthly: T([0, 30], [0, 30], [30, 150], [150, 500]), impact: [0, 3, 1, 1], summary: "Uptime, errors and performance with alerts to the team." },
  { id: "logging", label: "Centralised logging", group: "devops", days: 1, price: [100, 300], monthly: T([10, 60], [10, 60], [60, 300], [300, 1000]), impact: [0, 2, 1, 1], summary: "Searchable logs from every service in one place." },
  { id: "staging", label: "Staging environment", group: "devops", days: 1, price: [30, 120], monthly: T([10, 60], [10, 60], [60, 250], [250, 1000]), impact: [0, 2, 0, 1], summary: "A safe copy of production for testing changes." },
  { id: "multi_region", label: "Multi-region deployment", group: "devops", days: 8, price: [1500, 5000], monthly: [500, 3000], impact: [2, 3, 3, 3], summary: "Runs in more than one region for resilience and global speed." },
];

export const itemById = (id: string) => planItems.find((i) => i.id === id);
export const ITEM_IDS = planItems.map((i) => i.id);

export const groupLabels: Record<ItemGroup, string> = {
  product: "Website & apps",
  ai: "AI & automation",
  integrations: "Integrations",
  communication: "Communication",
  performance: "Performance",
  data: "Data",
  storage: "Storage",
  background: "Background processing",
  security: "Security",
  devops: "DevOps & hosting",
};

/** Groups shown as "infrastructure services" in the architecture builder. */
export const INFRA_GROUPS: ItemGroup[] = ["performance", "data", "storage", "background", "security", "devops"];

// ---------- Architecture tiers ----------

export type Tier = {
  id: TierId;
  level: 1 | 2 | 3 | 4;
  name: string;
  tagline: string;
  bestFor: string[];
  /** Infrastructure included at this tier (filtered by relevance to the project). */
  infra: string[];
};

const starterInfra = ["hosting", "sql_db", "file_storage", "backup", "encryption"];
const standardInfra = [...starterInfra, "cdn", "redis", "worker", "email_service", "monitoring", "staging", "cicd", "docker"];
const advancedInfra = [...standardInfra, "load_balancer", "autoscaling", "api_gateway", "queue", "logging", "waf"];
const enterpriseInfra = [...advancedInfra, "kubernetes", "multi_region", "dr", "secrets"];

export const tiers: Tier[] = [
  {
    id: "starter",
    level: 1,
    name: "Essential hosting",
    tagline: "Best for early-stage or low-traffic use.",
    bestFor: ["Business websites", "Small portals", "Simple booking systems", "Small internal apps", "MVPs"],
    infra: starterInfra,
  },
  {
    id: "standard",
    level: 2,
    name: "Standard",
    tagline: "Best balance of performance, reliability and cost.",
    bestFor: ["Customer portals", "Booking platforms", "CRM systems", "Business management software", "E-commerce", "Multi-user systems"],
    infra: standardInfra,
  },
  {
    id: "advanced",
    level: 3,
    name: "High Scale",
    tagline: "Designed for growth and higher availability.",
    bestFor: ["High-traffic apps", "Complex business software", "AI-enabled systems", "Marketplaces", "Multi-tenant SaaS", "Real-time apps"],
    infra: advancedInfra,
  },
  {
    id: "enterprise",
    level: 4,
    name: "Enterprise",
    tagline: "For high availability, multi-region or complex enterprise systems.",
    bestFor: ["Enterprise software", "Large SaaS platforms", "Multi-region systems", "Large AI platforms", "Complex automation"],
    infra: enterpriseInfra,
  },
];

export const tierById = (id: string) => tiers.find((t) => t.id === id);

// ---------- Cloud providers ----------

export type Provider = {
  id: string;
  name: string;
  /** Relative monthly cost against the baseline in planItems (1 = AWS/Azure list pricing). */
  factor: number;
  /** Architecture levels this provider suits. */
  levels: [number, number];
  scalability: Rating;
  reliability: Rating;
  management: "Low" | "Medium" | "High";
  suits: string;
  pros: string[];
  limits: string[];
};

export const providers: Provider[] = [
  {
    id: "azure",
    name: "Microsoft Azure",
    factor: 1,
    levels: [1, 4],
    scalability: 3,
    reliability: 3,
    management: "Medium",
    suits: "Microsoft-centric businesses, from small apps to enterprise",
    pros: ["Strong Microsoft 365 and Entra ID (SSO) integration", "UK regions", "Managed SQL, App Service and AKS"],
    limits: ["Pricing can be complex", "Costs rise without cost governance"],
  },
  {
    id: "aws",
    name: "Amazon Web Services",
    factor: 1,
    levels: [1, 4],
    scalability: 3,
    reliability: 3,
    management: "Medium",
    suits: "Any size, especially high scale and complex workloads",
    pros: ["Widest range of managed services", "UK region (London)", "Mature scaling and security tooling"],
    limits: ["Steeper learning curve", "Many small charges to track"],
  },
  {
    id: "gcp",
    name: "Google Cloud",
    factor: 0.95,
    levels: [1, 4],
    scalability: 3,
    reliability: 3,
    management: "Medium",
    suits: "Data, analytics and AI-heavy projects",
    pros: ["Strong data and AI services", "Simple managed containers (Cloud Run)", "UK region"],
    limits: ["Smaller UK partner ecosystem", "Fewer business-app integrations"],
  },
  {
    id: "digitalocean",
    name: "DigitalOcean",
    factor: 0.6,
    levels: [1, 3],
    scalability: 2,
    reliability: 2,
    management: "Low",
    suits: "Small to mid-size apps that want simple, predictable costs",
    pros: ["Simple, predictable pricing", "Managed databases and Kubernetes", "London data centre"],
    limits: ["Fewer advanced managed services", "Limited multi-region and compliance options"],
  },
  {
    id: "hetzner",
    name: "Hetzner",
    factor: 0.35,
    levels: [1, 2],
    scalability: 1,
    reliability: 2,
    management: "High",
    suits: "Cost-optimised servers for technical teams",
    pros: ["Very low cost servers", "EU data centres (GDPR)"],
    limits: ["No UK region", "Few managed services, more hands-on DevOps"],
  },
  {
    id: "hostinger",
    name: "Hostinger VPS",
    factor: 0.3,
    levels: [1, 1],
    scalability: 1,
    reliability: 1,
    management: "High",
    suits: "Small websites and MVPs on a tight budget",
    pros: ["Lowest cost for small sites", "Simple setup"],
    limits: ["Single server, limited scaling", "Basic managed services and support"],
  },
  {
    id: "vercel",
    name: "Vercel + Supabase",
    factor: 0.85,
    levels: [1, 2],
    scalability: 2,
    reliability: 2,
    management: "Low",
    suits: "Next.js websites, portals and MVPs",
    pros: ["Fast Next.js hosting with a built-in CDN", "Managed Postgres, auth and storage", "Very little DevOps"],
    limits: ["Usage-based costs grow with traffic", "Less control for heavy background work"],
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    factor: 0.5,
    levels: [1, 2],
    scalability: 3,
    reliability: 2,
    management: "Low",
    suits: "Global sites and lightweight APIs at the edge",
    pros: ["Global network with CDN and WAF included", "Low-cost storage (R2) and serverless workers"],
    limits: ["Edge runtime limits for heavy backend work", "Smaller managed database options"],
  },
];

export const providerById = (id: string) => providers.find((p) => p.id === id);

// ---------- Market comparison ----------

export type Market = {
  id: string;
  name: string;
  currency: string;
  locale: string;
  /** Units of local currency per £1 (see marketMeta.ratesReviewed). */
  perGbp: number;
  /** Typical price for the same scope as a multiple of DotSeek's recommended estimate. */
  freelancer: Range;
  agency: Range;
};

/** Configurable market data: review the multipliers and exchange rates regularly. */
export const marketMeta = { reviewed: "October 2026", ratesReviewed: "October 2026" };

export const markets: Market[] = [
  { id: "uk", name: "United Kingdom", currency: "GBP", locale: "en-GB", perGbp: 1, freelancer: [1.3, 2.2], agency: [2, 4] },
  { id: "us", name: "United States", currency: "USD", locale: "en-US", perGbp: 1.27, freelancer: [1.5, 2.6], agency: [2.4, 5] },
  { id: "eu", name: "Europe", currency: "EUR", locale: "en-IE", perGbp: 1.17, freelancer: [1.2, 2.1], agency: [1.9, 3.8] },
  { id: "ae", name: "UAE", currency: "AED", locale: "en-GB", perGbp: 4.65, freelancer: [1.1, 2], agency: [1.8, 3.6] },
  { id: "sa", name: "Saudi Arabia", currency: "SAR", locale: "en-GB", perGbp: 4.75, freelancer: [1.1, 2], agency: [1.8, 3.6] },
  { id: "kw", name: "Kuwait", currency: "KWD", locale: "en-GB", perGbp: 0.39, freelancer: [1.1, 2], agency: [1.8, 3.4] },
  { id: "in", name: "India", currency: "INR", locale: "en-IN", perGbp: 106, freelancer: [0.5, 0.9], agency: [0.8, 1.6] },
];

// ---------- Business stages ----------

export type StageId = "basic" | "starter" | "growth" | "advanced" | "enterprise";

export type Stage = { id: StageId; name: string; priceLabel: string; upTo: number; summary: string; includes: string[] };

/** Published stages: "From £100" for a very basic website, up to a custom quote. Starting ranges only. */
export const stages: Stage[] = [
  {
    id: "basic",
    name: "Basic",
    priceLabel: "From £100",
    upTo: 300,
    summary: "A very simple digital presence. £100 is the starting price for a very basic website.",
    includes: ["Single landing page or very small static site", "Responsive design", "Business information and contact details", "WhatsApp or contact button", "Basic enquiry form", "Limited revisions, no complex backend or admin portal"],
  },
  {
    id: "starter",
    name: "Starter",
    priceLabel: "£300–£1,000+",
    upTo: 1000,
    summary: "Small business websites with better design and simple content management.",
    includes: ["Multi-page website", "Better UI/UX", "Contact and enquiry forms", "Basic SEO", "CMS or simple content management", "Basic backend where required"],
  },
  {
    id: "growth",
    name: "Growth",
    priceLabel: "£1,000–£3,000+",
    upTo: 3000,
    summary: "Business web applications that run part of your operations.",
    includes: ["Backend, API and database", "Authentication", "Admin and customer portals", "Bookings and payments", "Business automation", "Third-party integrations"],
  },
  {
    id: "advanced",
    name: "Advanced",
    priceLabel: "£3,000–£10,000+",
    upTo: 10000,
    summary: "Custom business software, mobile apps and AI.",
    includes: ["Custom business software", "Mobile apps", "AI chatbots and agents", "CRM and ERP integrations", "Complex workflow automation", "Advanced reporting"],
  },
  {
    id: "enterprise",
    name: "Scale / Enterprise",
    priceLabel: "Custom quote",
    upTo: Infinity,
    summary: "High-traffic, high-availability and enterprise systems, quoted after discovery.",
    includes: ["High-traffic systems", "Multi-tenant SaaS", "Microservices, containers and Kubernetes", "High availability and multi-region", "Multiple AI services", "Advanced security"],
  },
];

export const stageById = (id: string) => stages.find((x) => x.id === id);

// ---------- Packages ----------

export type PackageFamily = "product" | "agent" | "assistant" | "automation" | "integration" | "data";

export type PackageDef = {
  id: string;
  /** "{web}" becomes "Website" or "Web app". */
  name: string;
  summary: string;
  include: string[];
  exclude: string[];
  /** Keep only the first N selected integrations. */
  maxIntegrations?: number;
  tier: TierId;
};

const AI_ALL = ["ai_chatbot", "ai_agent", "rag", "document_ai", "voice_ai", "ai_insights", "automation"];

export const packages: Record<PackageFamily, PackageDef[]> = {
  product: [
    { id: "p1", name: "{web} only", summary: "Design and build, with simple content management.", include: ["uxui", "frontend", "cms"], exclude: ["backend", "admin", "auth", "mobile_app", "ecommerce", ...AI_ALL], maxIntegrations: 1, tier: "starter" },
    { id: "p2", name: "{web} + backend + admin", summary: "Adds the backend, database and an admin portal.", include: ["uxui", "frontend", "backend", "sql_db", "auth", "admin"], exclude: ["mobile_app", ...AI_ALL], tier: "standard" },
    { id: "p3", name: "{web} + backend + mobile app", summary: "Adds iOS and Android apps on the same backend.", include: ["uxui", "frontend", "backend", "sql_db", "auth", "admin", "mobile_app", "push"], exclude: AI_ALL, tier: "standard" },
    { id: "p4", name: "Complete digital solution + AI automation", summary: "Everything above plus an AI chatbot, workflow automation and dashboards.", include: ["uxui", "frontend", "backend", "sql_db", "auth", "admin", "mobile_app", "push", "ai_chatbot", "automation", "analytics"], exclude: [], tier: "standard" },
  ],
  agent: [
    { id: "a1", name: "AI agent pilot", summary: "One task, one system, with human approval.", include: ["ai_agent"], exclude: ["rag", "automation", "admin", "analytics", "mobile_app"], maxIntegrations: 1, tier: "starter" },
    { id: "a2", name: "AI agent + integrations", summary: "The agent working across all the systems you named.", include: ["ai_agent"], exclude: ["automation", "admin", "analytics", "mobile_app"], tier: "standard" },
    { id: "a3", name: "AI agent + knowledge + automation", summary: "Adds knowledge search over your documents and automated workflows.", include: ["ai_agent", "rag", "vector_db", "automation"], exclude: ["mobile_app"], tier: "standard" },
    { id: "a4", name: "Complete digital solution + AI automation", summary: "Adds an admin portal, dashboards and a customer-facing chatbot.", include: ["ai_agent", "rag", "vector_db", "automation", "admin", "analytics", "ai_chatbot"], exclude: [], tier: "standard" },
  ],
  assistant: [
    { id: "c1", name: "Website chatbot", summary: "An AI assistant on your website.", include: ["ai_chatbot"], exclude: ["whatsapp", "rag", "ai_agent", "automation"], maxIntegrations: 0, tier: "starter" },
    { id: "c2", name: "Chatbot + knowledge base", summary: "Answers grounded in your own documents (RAG).", include: ["ai_chatbot", "rag", "vector_db"], exclude: ["whatsapp", "ai_agent", "automation"], tier: "standard" },
    { id: "c3", name: "Multi-channel assistant", summary: "Website and WhatsApp, connected to your systems.", include: ["ai_chatbot", "rag", "vector_db", "whatsapp"], exclude: ["ai_agent", "automation"], tier: "standard" },
    { id: "c4", name: "Complete digital solution + AI automation", summary: "Adds an AI agent and workflow automation behind the assistant.", include: ["ai_chatbot", "rag", "vector_db", "whatsapp", "ai_agent", "automation", "analytics"], exclude: [], tier: "standard" },
  ],
  automation: [
    { id: "w1", name: "Pilot: one automated workflow", summary: "Automate one process end to end.", include: ["automation"], exclude: ["ai_agent", "ai_chatbot", "admin", "analytics"], maxIntegrations: 2, tier: "starter" },
    { id: "w2", name: "Automation + system integrations", summary: "The workflow connected to every system you named.", include: ["automation"], exclude: ["ai_agent", "ai_chatbot", "admin"], tier: "standard" },
    { id: "w3", name: "Automation + AI agent", summary: "Adds an AI agent for the judgement steps.", include: ["automation", "ai_agent"], exclude: ["ai_chatbot"], tier: "standard" },
    { id: "w4", name: "Complete digital solution + AI automation", summary: "Adds an admin portal, dashboards and an AI chatbot.", include: ["automation", "ai_agent", "admin", "analytics", "ai_chatbot"], exclude: [], tier: "standard" },
  ],
  integration: [
    { id: "i1", name: "Connect two systems", summary: "One reliable integration between two systems.", include: [], exclude: ["automation", "ai_agent", "analytics"], maxIntegrations: 2, tier: "starter" },
    { id: "i2", name: "Connect all selected systems", summary: "Every system you named, with monitoring.", include: [], exclude: ["automation", "ai_agent", "analytics"], tier: "standard" },
    { id: "i3", name: "Integration + automation", summary: "Adds automated workflows on top of the data flow.", include: ["automation"], exclude: ["ai_agent"], tier: "standard" },
    { id: "i4", name: "Complete digital solution + AI automation", summary: "Adds an AI agent and dashboards.", include: ["automation", "ai_agent", "analytics"], exclude: [], tier: "standard" },
  ],
  data: [
    { id: "d1", name: "Reporting starter", summary: "Dashboards from your main data source.", include: ["analytics"], exclude: ["data_pipeline", "ai_insights", "automation", "ai_agent"], maxIntegrations: 1, tier: "starter" },
    { id: "d2", name: "Data pipeline + dashboards", summary: "All your sources in one model, with dashboards.", include: ["data_pipeline", "analytics"], exclude: ["ai_insights", "automation", "ai_agent"], tier: "standard" },
    { id: "d3", name: "Dashboards + AI insights", summary: "Adds AI trends, forecasts and recommendations.", include: ["data_pipeline", "analytics", "ai_insights"], exclude: ["automation", "ai_agent"], tier: "standard" },
    { id: "d4", name: "Complete data + AI automation", summary: "Adds automation and an AI agent that act on the insights.", include: ["data_pipeline", "analytics", "ai_insights", "automation", "ai_agent"], exclude: [], tier: "standard" },
  ],
};

// ---------- Service scope (Basic / Advanced / Custom) ----------

export type ScopeId = "basic" | "advanced" | "custom";

/** Effort and running-cost multipliers for each scope level. */
export const scopeLevels: Record<ScopeId, { label: string; days: number; monthly: number }> = {
  basic: { label: "Basic", days: 1, monthly: 1 },
  advanced: { label: "Advanced", days: 1.8, monthly: 1.5 },
  custom: { label: "Custom", days: 2.6, monthly: 2 },
};

export const SCOPE_IDS = Object.keys(scopeLevels) as ScopeId[];

const integrationScopes: Record<ScopeId, string> = {
  basic: "Standard connector: one-way sync of the core records.",
  advanced: "Two-way sync, custom fields, webhooks, retries and monitoring.",
  custom: "Bespoke API work, complex mappings and data migration, confirmed in discovery.",
};

/** What each scope includes, for every API, integration and AI service that offers a choice. */
export const itemScopes: Record<string, Record<ScopeId, string>> = {
  backend: {
    basic: "Standard REST API for your records and forms.",
    advanced: "Complex business rules, roles and a documented API for partners.",
    custom: "Bespoke services, a public API with versioning and agreed service levels.",
  },
  api_gateway: {
    basic: "One secure entry point with keys and rate limits.",
    advanced: "Per-client policies, request validation, analytics and versioning.",
    custom: "Partner or public API programme with a developer portal.",
  },
  payments: {
    basic: "Card payments through a hosted checkout, with receipts.",
    advanced: "Subscriptions, refunds, invoices and payment webhooks.",
    custom: "Split or marketplace payments, or several payment gateways.",
  },
  whatsapp: {
    basic: "Notifications and simple replies.",
    advanced: "Two-way conversations with templates and human handover.",
    custom: "Campaigns, catalogues and bespoke conversation flows.",
  },
  sms: {
    basic: "Reminders and alerts from templates.",
    advanced: "Two-way SMS with replies routed to your team.",
    custom: "Bespoke messaging flows across several numbers or countries.",
  },
  ai_chatbot: {
    basic: "FAQ answers and lead capture from your content.",
    advanced: "Knowledge base answers, system lookups and human handover.",
    custom: "Multi-language, multi-channel assistant with bespoke actions.",
  },
  ai_agent: {
    basic: "One task in one system, with human approval.",
    advanced: "Several tasks across systems, with tools, memory and approvals.",
    custom: "Multi-agent workflows and bespoke tools, scoped in discovery.",
  },
  rag: {
    basic: "Answers from a single document set or your website.",
    advanced: "Several sources, automatic re-indexing and source citations.",
    custom: "Permission-aware search across many systems.",
  },
  document_ai: {
    basic: "One document type (for example invoices) with standard fields.",
    advanced: "Several document types, validation rules and exception handling.",
    custom: "Bespoke extraction models and complex layouts.",
  },
  voice_ai: {
    basic: "Transcription or voice input.",
    advanced: "Voice conversations with your knowledge and systems.",
    custom: "Bespoke voice agents and telephony integration.",
  },
  automation: {
    basic: "One workflow with standard triggers and notifications.",
    advanced: "Several workflows with approvals, exceptions and reporting.",
    custom: "Organisation-wide orchestration across departments.",
  },
  ...Object.fromEntries(
    ["int_crm", "int_erp", "int_accounting", "int_workspace", "int_ecom", "int_spreadsheet", "int_calendar", "int_marketing", "int_other"].map((id) => [
      id,
      integrationScopes,
    ]),
  ),
};

/** Default scope descriptions for items without their own (every item can be customised). */
const groupScopes: Record<ItemGroup, Record<ScopeId, string>> = {
  product: {
    basic: "Essential version with standard screens and flows.",
    advanced: "Richer features, more screens and business rules.",
    custom: "Fully bespoke design and behaviour, scoped in discovery.",
  },
  ai: {
    basic: "One focused use case with human review.",
    advanced: "Several use cases connected to your systems.",
    custom: "Bespoke AI capability, scoped in discovery.",
  },
  integrations: integrationScopes,
  communication: {
    basic: "Standard templates and notifications.",
    advanced: "Two-way messaging, personalisation and delivery tracking.",
    custom: "Bespoke flows across several channels.",
  },
  performance: {
    basic: "Managed service with standard settings.",
    advanced: "Tuned for higher load, with redundancy and alerts.",
    custom: "Bespoke configuration to your policies, scoped with the team.",
  },
  data: {
    basic: "Managed service with standard settings and daily backups.",
    advanced: "Higher capacity, read replicas and point-in-time recovery.",
    custom: "Bespoke data design, retention and residency rules.",
  },
  storage: {
    basic: "Standard object storage with secure access.",
    advanced: "Image or file processing, lifecycle rules and a CDN.",
    custom: "Bespoke retention, residency and processing pipelines.",
  },
  background: {
    basic: "Standard background jobs with retries.",
    advanced: "Higher throughput, priorities and dead-letter handling.",
    custom: "Bespoke event-driven processing, scoped with the team.",
  },
  security: {
    basic: "Standard, recommended configuration.",
    advanced: "Stricter policies, alerts and regular reviews.",
    custom: "Configured to your compliance requirements and audits.",
  },
  devops: {
    basic: "Standard managed setup.",
    advanced: "Automated environments, alerts and release checks.",
    custom: "Bespoke pipelines and environments to your policies.",
  },
};

/** Scope options for an item: its own descriptions, or its group's. Items with no build effort have none. */
export const scopesFor = (item: PlanItem): Record<ScopeId, string> | null =>
  item.days > 0 ? (itemScopes[item.id] ?? groupScopes[item.group]) : null;

/** Homepage "pocket money" band: a short, eye-catching starting point (stages stay in the estimate). */
export const pocketBand = {
  kicker: "Start small",
  heading: "Big plans. Pocket-money start.",
  body: "Get your business online with a basic website, then grow the same solution into a booking portal, an app or AI automation when you're ready.",
  path: ["Basic website", "Business portal", "Mobile app", "AI automation"],
  primary: "Get my estimate",
  secondary: "Have a reference site?",
};

/** Notice printed on every AI-generated quotation (quotation modal and quotation emails). */
export const quotationNotice = {
  status: "AI-generated draft, awaiting DotSeek review",
  sections: [
    {
      heading: "Quotation notice",
      body: [
        "This quotation has been generated by the DotSeek AI Business Consultant based on the requirements, budget, features and information provided by the customer.",
        "DotSeek aims to design and deliver a solution that works within the customer's requested budget wherever reasonably possible. The proposed scope may be adjusted, simplified or delivered in phases to achieve the best balance between budget, functionality, quality and future scalability.",
      ],
    },
    {
      heading: "Important",
      body: [
        "This document is an AI-generated indicative quotation and is not a final commercial agreement.",
        "Final pricing, scope, delivery timeline, architecture and terms will only be confirmed after the DotSeek team reviews the complete project requirements and issues an approved final quotation or agreement.",
      ],
    },
    {
      heading: "Customer-specific quotation",
      body: ["This quotation has been prepared specifically around the customer's submitted requirements and budget. The pricing may include:"],
      list: [
        "Custom scope adjustments",
        "Budget-based recommendations",
        "Introductory offers",
        "Phased development options",
        "DotSeek-specific pricing",
        "Architecture optimisation",
        "AI-assisted cost optimisation",
      ],
      after: "Therefore, the quotation should not automatically be considered a standard market price for the same project with another provider.",
    },
    {
      heading: "Third-party and agency warning",
      body: [
        "Customers should be cautious if another agency, freelancer or intermediary takes this quotation and offers to deliver the project using DotSeek's scope, architecture, pricing or recommendations.",
        "A lower price from another provider does not necessarily mean that the same items will be included:",
      ],
      list: ["Functionality", "Architecture", "Security", "Scalability", "Support", "Integrations", "Infrastructure", "Testing", "Maintenance"],
      after: "Always request a detailed scope comparison before selecting a provider.",
    },
    {
      heading: "Verify your DotSeek quote",
      body: ["A valid DotSeek quotation should include:"],
      list: [
        "Unique quotation or reference number",
        "Customer requirement summary",
        "Selected services",
        "Architecture recommendation",
        "Price range",
        "Assumptions",
        "Date generated",
        "Quotation status",
      ],
      after: "Where available, customers should be able to verify the quotation directly through the official DotSeek website.",
    },
    {
      heading: "AI and automation notice",
      body: [
        "DotSeek uses AI and automation to help businesses identify suitable digital solutions, estimate project requirements and reduce unnecessary development costs.",
        "These tools are designed to support the business relationship, not bypass it.",
        "AI-generated recommendations should therefore be reviewed by the DotSeek team before they are treated as a final technical or commercial commitment.",
      ],
    },
    {
      heading: "Final confirmation",
      steps: ["System generated estimate", "DotSeek review", "Customer discussion", "Final scope", "Approved quotation", "Project agreement"],
      body: [
        "Do not make payment or commit to development based solely on an automatically generated estimate.",
        "For confirmation, changes, negotiations or questions regarding this quotation, contact DotSeek directly through the official website.",
      ],
    },
  ] as { heading: string; body: string[]; list?: string[]; after?: string; steps?: string[] }[],
};
