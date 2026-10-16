import { site } from "./site";

/**
 * DotSeek Assistant: UI copy plus the OFFLINE fallback knowledge base.
 * Live answers come from Claude via /api/assistant (prompt built in
 * src/lib/assistant/systemPrompt.ts from the site content). These intents are
 * used for the quick-reply chips and whenever the API is unavailable.
 * Answers must only state what the rest of the site says.
 */

export type AssistantLink = { label: string; href: string };

export type Intent = {
  id: string;
  /** Lower-case words or phrases; each match adds to the intent's score. */
  keywords: string[];
  answer: string[];
  links?: AssistantLink[];
  /** Quick replies offered after this answer (intent ids). */
  next?: string[];
};

export const assistantMeta = {
  name: "DotSeek Assistant",
  status: "AI assistant · powered by DotSeek",
  offlineStatus: "Automated answers",
  offlineDisclaimer: "Automated answers based on this website. Your messages aren't stored or sent anywhere.",
  greeting: [
    "Hi, I'm the DotSeek AI consultant. Tell me about your business problem or goal, and I'll suggest the right solution: AI automation, AI agents, a website, a web or mobile app, custom software, integrations or reporting.",
    "Not sure what you need? That's fine. Describe the problem in your own words, or start an enquiry and I'll guide you.",
  ],
  starters: ["enquiry", "reference", "services", "website", "software"],
  inputPlaceholder: "Ask about automation, agents, pricing…",
  disclaimer:
    "AI answers can be wrong, so please confirm details with the team. Messages are processed by our AI provider to generate replies. Please don't share sensitive information.",
};

export const intents: Intent[] = [
  {
    id: "greeting",
    keywords: ["hi", "hello", "hey", "good morning", "good afternoon", "hiya"],
    answer: ["Hello! How can I help? You can ask about our services, AI agents, integrations, pricing or how to get in touch."],
    next: ["services", "agents", "contact"],
  },
  {
    id: "services",
    keywords: ["service", "services", "what do you do", "offer", "help with", "solutions", "capabilities", "dotseek do"],
    answer: [
      "DotSeek is an AI business solutions company. AI automation is our core, and we also build websites, web and mobile apps, custom software, CRM and ERP systems, AI agents and chatbots, integrations and reporting.",
      "That includes AI agents, workflow automation, document and data automation, CRM and ERP integration, customer service automation, AI insights and custom software.",
    ],
    links: [{ label: "See all solutions", href: "/#solutions" }],
    next: ["enquiry", "website", "software", "agents"],
  },
  {
    id: "website",
    keywords: ["website", "web site", "site", "redesign", "ecommerce", "e-commerce", "online shop", "landing page", "frontend", "front end", "portal", "admin portal", "wordpress"],
    answer: [
      "Yes, DotSeek builds websites and web platforms: new sites, redesigns of existing ones, frontend only builds, backends and APIs for existing sites, admin portals, online stores and payments, and AI features such as chatbots.",
      "Start an enquiry and I'll ask a few questions tailored to your website project.",
    ],
    next: ["enquiry", "software", "pricing"],
  },
  {
    id: "software",
    keywords: ["software", "app", "apps", "application", "mobile app", "mobile", "ios", "iphone", "android", "app store", "web app", "crm", "erp", "system", "platform", "internal tool", "database app"],
    answer: [
      "DotSeek builds web apps, iOS and Android apps, or both together on one shared system, as well as custom business software, CRM and ERP solutions and improvements to systems you already have, with automation and AI built in where it helps.",
      "Start an enquiry and I'll ask the right questions about your users, platforms, features and integrations.",
    ],
    next: ["enquiry", "integrations", "pricing"],
  },
  {
    id: "agents",
    keywords: ["agent", "agents", "ai agent", "assistant", "autonomous", "sales agent", "finance agent", "hr agent"],
    answer: [
      "Our AI agents handle business tasks, retrieve information from your systems and trigger workflows, all inside guardrails you define.",
      "Examples include sales, customer support, operations, finance, HR and knowledge agents. Every action is permissioned, logged and can require human approval.",
    ],
    links: [{ label: "Explore AI agents", href: "/#agents" }],
    next: ["security", "integrations", "contact"],
  },
  {
    id: "workflow",
    keywords: ["workflow", "process", "automate", "automation", "repetitive", "manual", "approval", "approvals", "orchestration"],
    answer: [
      "We automate repetitive processes across departments: capturing requests, understanding them with AI, applying your business rules, updating systems and measuring the results.",
      "A typical example is lead to quote to invoice, with approvals and reminders handled automatically.",
    ],
    links: [{ label: "How automation flows", href: "/#workflow" }],
    next: ["process", "integrations", "pricing"],
  },
  {
    id: "documents",
    keywords: ["document", "documents", "invoice", "invoices", "pdf", "contract", "extract", "ocr", "forms", "paperwork"],
    answer: [
      "Intelligent document automation extracts, classifies, validates and routes documents such as invoices, contracts, forms and emails.",
      "For example, supplier invoices can be read, matched to purchase orders and sent to finance automatically.",
    ],
    next: ["integrations", "pricing", "contact"],
  },
  {
    id: "customer",
    keywords: ["customer", "support", "chatbot", "chat", "whatsapp", "enquiries", "tickets", "helpdesk", "customer service"],
    answer: [
      "Customer automation answers enquiries, qualifies leads, routes tickets and follows up instantly, across channels like web chat, email and WhatsApp.",
      "Complex cases are escalated to your team with full context.",
    ],
    next: ["agents", "integrations", "contact"],
  },
  {
    id: "integrations",
    keywords: [
      "integrate", "integration", "integrations", "connect", "crm", "erp", "api", "apis", "hubspot", "salesforce",
      "microsoft", "365", "teams", "slack", "google", "shopify", "stripe", "xero", "sql", "database", "aws", "azure", "systems",
    ],
    answer: [
      "We connect the tools you already use, including Microsoft 365, Google Workspace, Salesforce, HubSpot, Slack, Teams, Shopify, Stripe, WhatsApp, Xero, SQL databases, cloud platforms and custom APIs.",
      "You don't need to replace your existing systems. We build automation on top of them.",
    ],
    links: [{ label: "AI + your systems", href: "/#systems" }],
    next: ["replace", "security", "contact"],
  },
  {
    id: "replace",
    keywords: ["replace", "new system", "rip", "existing", "keep our", "migrate", "switch"],
    answer: [
      "No. DotSeek integrates with the CRM, ERP, finance, collaboration and database systems you already use. We only build custom software where a ready made tool can't do the job.",
    ],
    next: ["integrations", "process"],
  },
  {
    id: "pricing",
    keywords: ["price", "pricing", "cost", "costs", "how much", "budget", "quote", "quotation", "estimate", "fee", "fees", "expensive", "cheap", "architecture", "hosting", "infrastructure"],
    answer: [
      "Pricing follows your business stage: very basic websites start from £100, Starter sites about £300 to £1,000+, Growth web apps about £1,000 to £3,000+, Advanced software, apps and AI about £3,000 to £10,000+, and enterprise systems are custom quoted.",
      "Start an enquiry and I'll prepare an AI generated indicative estimate for your exact requirement, with minimum, recommended and maximum prices, a phased plan for your budget and a market comparison. You can also tell us your preferred budget.",
      "Every final quotation is confirmed by the DotSeek team after reviewing your requirements.",
    ],
    next: ["enquiry", "timeline", "process"],
  },
  {
    id: "timeline",
    keywords: ["how long", "timeline", "time to", "weeks", "months", "quickly", "fast", "start date", "delivery"],
    answer: [
      "It depends on scope and integrations. Most engagements begin with a short discovery phase, after which we agree a delivery plan and timeline for the first workflow before any build starts.",
    ],
    next: ["process", "pricing", "contact"],
  },
  {
    id: "process",
    keywords: ["how do you work", "how does it work", "approach", "methodology", "steps", "discover", "discovery", "get started", "start"],
    answer: [
      "We work in five stages: Discover your processes, Analyse where automation adds the most value, Design the solution, Automate in iterations with your team, then Optimise as you grow.",
    ],
    links: [{ label: "How DotSeek works", href: "/#process" }],
    next: ["timeline", "pricing", "contact"],
  },
  {
    id: "security",
    keywords: ["secure", "security", "safe", "data", "gdpr", "privacy", "audit", "permissions", "compliance", "hosting", "where is", "uk region", "trust"],
    answer: [
      "Agents run inside controlled workflows with permissions by role, approval steps for sensitive actions and a full audit log.",
      "We design around your data residency and security needs, including UK and EU hosting, private cloud deployments and model providers that don't train on your data.",
    ],
    links: [{ label: "Privacy policy", href: "/privacy" }],
    next: ["agents", "contact"],
  },
  {
    id: "industries",
    keywords: ["industry", "industries", "sector", "retail", "healthcare", "education", "property", "finance sector", "professional services", "ecommerce"],
    answer: [
      "We work with organisations in professional services, retail and online stores, healthcare, education, property and finance. The automation foundations are the same, and the workflows are tailored to each sector.",
    ],
    links: [{ label: "Industries", href: "/#industries" }],
    next: ["services", "contact"],
  },
  {
    id: "results",
    keywords: ["result", "results", "roi", "save", "savings", "benefit", "benefits", "outcome", "outcomes", "worth it"],
    answer: [
      "Typical outcomes are fewer manual hours, faster response times, fewer repetitive tasks, better operational visibility and connected systems.",
      "We measure every engagement against a baseline agreed with you up front, so results are your numbers, not marketing claims.",
    ],
    links: [{ label: "Outcomes", href: "/#results" }],
    next: ["pricing", "contact"],
  },
  {
    id: "contact",
    keywords: ["contact", "talk", "speak", "call", "phone", "email", "human", "person", "team", "book", "meeting", "demo", "consultation", "get in touch"],
    answer: [
      `You can email the team at ${site.email}, or start an enquiry right here in the chat and the team will reply by email.`,
      "The contact page has an email template that helps you describe the process you'd like to automate.",
    ],
    links: [
      { label: "Contact page", href: "/contact" },
      { label: "Email us", href: `mailto:${site.email}` },
    ],
    next: ["enquiry", "pricing", "process"],
  },
  {
    id: "location",
    keywords: ["where are you", "located", "location", "based", "office", "address", "swansea", "wales", "uk"],
    answer: [`DotSeek is based in ${site.location}.`],
    links: [{ label: "Contact details", href: "/contact" }],
    next: ["contact"],
  },
  {
    id: "careers",
    keywords: ["job", "jobs", "career", "careers", "hiring", "vacancy", "work for", "join"],
    answer: ["We're always keen to hear from engineers, consultants and designers. Send your CV and a note about what you'd like to work on."],
    links: [{ label: "Careers", href: "/careers" }],
    next: ["contact"],
  },
  {
    id: "thanks",
    keywords: ["thanks", "thank you", "cheers", "great", "perfect", "helpful"],
    answer: ["You're welcome! Anything else I can help with?"],
    next: ["services", "contact"],
  },
];

/** Labels used for quick-reply chips. */
export const intentLabels: Record<string, string> = {
  reference: "Have a reference website or app?",
  services: "What do you do?",
  website: "A website",
  software: "A web or mobile app",
  agents: "AI agents",
  workflow: "Workflow automation",
  documents: "Document automation",
  customer: "Customer service",
  integrations: "Integrations",
  replace: "Replace our systems?",
  pricing: "Pricing",
  timeline: "How long does it take?",
  process: "How you work",
  security: "Security & data",
  industries: "Industries",
  results: "Results",
  contact: "Talk to the team",
  enquiry: "Start an enquiry",
  consult: "I'm not sure what I need",
  location: "Where are you based?",
  careers: "Careers",
};

export const fallback: Intent = {
  id: "fallback",
  keywords: [],
  answer: [
    "I'm not sure I can answer that one, but the DotSeek team can.",
    "You can reach them through the contact page, or choose one of the topics below.",
  ],
  links: [{ label: "Contact the team", href: "/contact" }],
  next: ["services", "pricing", "integrations"],
};
