import { solutionCatalogue, type SolutionId } from "./solutions";

/**
 * Dynamic enquiry flows. Every enquiry starts with the router step
 * ("What do you need help with?"), then follows the flow for the chosen
 * solution, then the shared tail (budget, timeline, contact).
 * Steps can depend on earlier answers via `when`, so each enquiry only asks
 * what is relevant. Shared by the chat UI (client) and /api/enquiry (server
 * validation), so keep it free of browser- or server-only code.
 */

export type Answers = Record<string, string>;

export type EnquiryStep = {
  id: string;
  /** Short label used in the summary, emails and admin. */
  label: string;
  question: string;
  kind: "choice" | "multi" | "text" | "longtext" | "email" | "tel";
  options?: string[];
  /** Adds "Other" which opens a text field in the chat. */
  other?: boolean;
  optional?: boolean;
  placeholder?: string;
  maxLength?: number;
  /** Only ask when this returns true for the answers so far. */
  when?: (answers: Answers) => boolean;
};

/** Multi-select answers are stored comma-separated (options themselves may contain commas). */
export const includes = (answer: string | undefined, option: string) => `, ${answer ?? ""}, `.includes(`, ${option}, `);

const parts = (answer?: string) => (answer ? answer.split(", ").filter(Boolean) : []);

/**
 * A very simple website (single landing page, nothing behind it): skips the
 * scale questions, which only matter for systems with a backend.
 */
export const isSimpleSite = (a: Answers) =>
  solutionOf(a) === "website" &&
  a.web_pages === "Single landing page" &&
  !["Admin portal or business management system", "E-commerce or payments", "Backend / API for an existing website", "A mobile app to go with it"].some(
    (o) => includes(a.web_need, o),
  ) &&
  (a.web_backend === undefined || a.web_backend === "Nothing beyond the website" || a.web_backend === "Simple content management (edit pages ourselves)");

export const NOT_SURE = "Not sure yet, I'll describe the problem";

const SYSTEMS = [
  "Microsoft 365",
  "Google Workspace",
  "Salesforce",
  "HubSpot",
  "Xero / accounting",
  "Shopify / e-commerce",
  "ERP",
  "Spreadsheets",
];

// ---------- Router ----------

export const routerStep: EnquiryStep = {
  id: "solution",
  label: "Solution",
  question: "What would you like help with?",
  kind: "choice",
  options: [...solutionCatalogue.map((s) => s.label), NOT_SURE],
};

/** Used when the visitor isn't sure: the AI consultant recommends a solution from this. */
export const problemStep: EnquiryStep = {
  id: "problem",
  label: "Business problem",
  question: "No problem. Describe the business problem or goal in your own words, and I'll recommend the best approach.",
  kind: "longtext",
  placeholder: "e.g. We lose track of customer enquiries and spend hours copying data between systems",
  maxLength: 1500,
};

export const solutionFromLabel = (label: string): SolutionId | undefined =>
  solutionCatalogue.find((s) => s.label === label)?.id;

// ---------- Solution flows ----------

const WEBSITE_WITH_APP = "A mobile app to go with it";
const BUILD_WEB = "A web app (works in the browser)";
const BUILD_MOBILE = "A mobile app (iOS / Android)";
const BUILD_BOTH = "Both a web app and a mobile app";
const PLATFORM_MOBILE = "Mobile (iOS / Android)";
const PLATFORM_BOTH = "Both web and mobile";

/** True when the project includes a mobile app (software flow or website + app). */
const wantsMobile = (a: Answers) =>
  a.sw_type === BUILD_MOBILE ||
  a.sw_type === BUILD_BOTH ||
  a.sw_platform === PLATFORM_MOBILE ||
  a.sw_platform === PLATFORM_BOTH ||
  includes(a.web_need, WEBSITE_WITH_APP);

/** True when web and mobile are built together, so they may share accounts and data. */
const webAndMobile = (a: Answers) =>
  a.sw_type === BUILD_BOTH || a.sw_platform === PLATFORM_BOTH || includes(a.web_need, WEBSITE_WITH_APP);

export const APP_HYBRID = "Hybrid: one app for both (Flutter or React Native)";
export const APP_NATIVE = "Native: Swift for iPhone and Kotlin for Android";
/** Set by the Basic app version: hosted sign-in, database and push instead of a custom backend. */
export const APP_MANAGED = "Managed backend (Firebase or Supabase)";
const bothPlatforms = (a: Answers) => ["iPhone and Android", "Not sure, please advise"].includes(a.app_os ?? "");

/** Mobile app questions, shared by the software and website flows. */
const mobileSteps: EnquiryStep[] = [
  {
    id: "app_os",
    label: "Mobile platforms",
    question: "Which phones should the app run on?",
    kind: "choice",
    options: ["iPhone and Android", "iPhone (iOS) only", "Android only", "Not sure, please advise"],
    when: wantsMobile,
  },
  {
    id: "app_build",
    label: "App technology",
    question: "How should the app be built? Hybrid is one shared codebase; native means a separate app for each platform.",
    kind: "choice",
    options: [APP_HYBRID, APP_NATIVE, "Not sure, please advise"],
    when: (a) => wantsMobile(a) && bothPlatforms(a),
  },
  {
    id: "app_features",
    label: "App features",
    question: "Which app features do you need? Choose all that apply.",
    kind: "multi",
    options: [
      "User accounts and login",
      "Push notifications",
      "In-app payments or subscriptions",
      "Bookings or orders",
      "Maps and location",
      "Camera, photos or scanning",
      "Works offline",
      "Chat or messaging",
    ],
    other: true,
    when: wantsMobile,
  },
  {
    id: "app_release",
    label: "App distribution",
    question: "How will people get the app?",
    kind: "choice",
    options: ["Public on the App Store and Google Play", "Private, for our staff only", "Not sure yet"],
    when: wantsMobile,
  },
  {
    id: "app_shared",
    label: "Web and mobile together",
    question: "Should the web and mobile sides share the same accounts and data?",
    kind: "choice",
    options: ["Yes, one shared system", "No, they can be separate", "Not sure, please advise"],
    when: webAndMobile,
  },
];

const websiteNeeds = [
  "Improve my existing website",
  "A completely new website",
  "Frontend development only",
  "Backend / API for an existing website",
  "Admin portal or business management system",
  "E-commerce or payments",
  "AI features or chatbot",
  WEBSITE_WITH_APP,
];

const flows: Record<SolutionId, EnquiryStep[]> = {
  website: [
    {
      id: "web_need",
      label: "Website requirement",
      question: "Which of these describes what you need? Choose all that apply.",
      kind: "multi",
      options: websiteNeeds,
      other: true,
    },
    {
      id: "web_pages",
      label: "Website size",
      question: "How big should the website be?",
      kind: "choice",
      options: ["Single landing page", "Small site (2 to 5 pages)", "Medium site (6 to 15 pages)", "Large site (16 or more pages)"],
      when: (a) => !includes(a.web_need, "Backend / API for an existing website") || parts(a.web_need).length > 1,
    },
    {
      id: "web_current_url",
      label: "Current website",
      question: "What's the address of your current website?",
      kind: "text",
      placeholder: "https://",
      optional: true,
      when: (a) =>
        ["Improve my existing website", "Backend / API for an existing website"].some((o) => includes(a.web_need, o)),
    },
    {
      id: "web_improvements",
      label: "Improvements needed",
      question: "What isn't working well today, or what would you like to improve?",
      kind: "longtext",
      when: (a) => includes(a.web_need, "Improve my existing website"),
    },
    {
      id: "web_business_type",
      label: "Business type",
      question: "What type of business is the website for?",
      kind: "choice",
      options: ["Professional services", "Retail & e-commerce", "Hospitality & leisure", "Healthcare", "Education", "Property", "Finance"],
      other: true,
    },
    {
      id: "web_features",
      label: "Pages & features",
      question: "Which pages or features do you need? Choose all that apply.",
      kind: "multi",
      options: [
        "Core pages (home, about, services)",
        "Blog or insights",
        "Contact & enquiry forms",
        "Bookings or appointments",
        "Customer login area",
        "Online shop",
        "Search",
        "Multiple languages",
      ],
      other: true,
    },
    {
      id: "web_design",
      label: "Design",
      question: "Where are you with the design?",
      kind: "choice",
      options: ["We have a design or brand guide", "We need a new design", "Refresh our existing design", "Not sure yet"],
    },
    {
      id: "web_backend",
      label: "Backend",
      question: "What should power the website behind the scenes?",
      kind: "choice",
      options: [
        "Simple content management (edit pages ourselves)",
        "Custom backend or API",
        "Admin portal to run the business",
        "Nothing beyond the website",
        "Not sure, please advise",
      ],
      when: (a) => !includes(a.web_need, "Frontend development only"),
    },
    {
      id: "web_integrations",
      label: "Integrations",
      question: "Should it connect to any other tools? Choose all that apply.",
      kind: "multi",
      options: ["CRM", "Payments (Stripe, PayPal)", "Email marketing", "Accounting", "Booking or calendar", "Analytics", "AI chatbot", "None"],
      other: true,
    },
    ...mobileSteps,
  ],

  software: [
    {
      id: "sw_type",
      label: "What to build",
      question: "What would you like to build?",
      kind: "choice",
      options: [
        BUILD_WEB,
        BUILD_MOBILE,
        BUILD_BOTH,
        "Custom business software, CRM or ERP",
        "Improve an existing system or app",
      ],
      other: true,
    },
    {
      id: "sw_problem",
      label: "Business problem",
      question: "What business problem should it solve?",
      kind: "longtext",
      when: (a) => !a.problem,
    },
    {
      id: "sw_existing",
      label: "Existing system",
      question: "What do you use for this today?",
      kind: "choice",
      options: ["Nothing yet", "Spreadsheets and email", "An off-the-shelf tool", "Our own custom system"],
      other: true,
    },
    {
      id: "sw_existing_detail",
      label: "Existing system details",
      question: "Tell me a little about the current system and what should change.",
      kind: "longtext",
      optional: true,
      when: (a) => !!a.sw_existing && a.sw_existing !== "Nothing yet",
    },
    {
      id: "sw_users",
      label: "Users",
      question: "Roughly how many people will use it?",
      kind: "choice",
      options: ["1 to 10", "11 to 50", "51 to 200", "200+", "Customers (public)"],
    },
    {
      id: "sw_user_types",
      label: "User types",
      question: "Who will use it? Choose all that apply.",
      kind: "multi",
      options: ["Staff", "Managers / admins", "Customers", "Suppliers or partners"],
    },
    {
      id: "sw_features",
      label: "Core features",
      question: "What are the most important features it must have?",
      kind: "longtext",
      placeholder: "e.g. job scheduling, customer records, quotes, reporting",
    },
    {
      id: "sw_platform",
      label: "Platform",
      question: "Where should it run?",
      kind: "choice",
      options: ["Web (browser)", PLATFORM_MOBILE, PLATFORM_BOTH, "Not sure, please advise"],
      when: (a) => ![BUILD_WEB, BUILD_MOBILE, BUILD_BOTH].includes(a.sw_type),
    },
    ...mobileSteps,
    {
      id: "sw_integrations",
      label: "Integrations",
      question: "Which systems should it connect to? Choose all that apply.",
      kind: "multi",
      options: [...SYSTEMS, "None"],
      other: true,
    },
    {
      id: "sw_automation",
      label: "Automation & AI",
      question: "Would you like automation or AI built in (for example automatic follow-ups or an AI assistant)?",
      kind: "choice",
      options: ["Yes", "Maybe, please advise", "No"],
    },
  ],

  ai_agent: [
    {
      id: "agent_process",
      label: "Business process",
      question: "Which business process should the AI agent work on?",
      kind: "longtext",
      placeholder: "e.g. handling supplier invoices from email through to approval",
      when: (a) => !a.problem,
    },
    {
      id: "agent_tasks",
      label: "Tasks to automate",
      question: "Which tasks should the agent take on?",
      kind: "longtext",
    },
    {
      id: "agent_tools",
      label: "Current tools",
      question: "Which tools or systems are involved today? Choose all that apply.",
      kind: "multi",
      options: SYSTEMS,
      other: true,
    },
    {
      id: "agent_data",
      label: "Data sources",
      question: "Where does the information it needs come from? Choose all that apply.",
      kind: "multi",
      options: ["Emails", "Documents & PDFs", "Database", "CRM records", "Spreadsheets", "Website or knowledge base"],
      other: true,
    },
    {
      id: "agent_behaviour",
      label: "AI behaviour",
      question: "What should the agent be able to do? Choose all that apply.",
      kind: "multi",
      options: [
        "Answer questions",
        "Read and extract information",
        "Classify and route work",
        "Draft documents or replies",
        "Update records in our systems",
        "Make recommendations",
      ],
    },
    {
      id: "agent_approval",
      label: "Human approval",
      question: "Should a person approve the agent's actions?",
      kind: "choice",
      options: ["Always, before every action", "Only for important or high-value actions", "No, fully automatic", "Not sure, please advise"],
    },
    {
      id: "agent_integrations",
      label: "Integrations",
      question: "Which systems should the agent update or trigger? Choose all that apply.",
      kind: "multi",
      options: [...SYSTEMS, "None, it only advises"],
      other: true,
    },
    {
      id: "agent_outcome",
      label: "Expected outcome",
      question: "What would success look like?",
      kind: "longtext",
      placeholder: "e.g. invoices processed same day with no manual typing",
    },
  ],

  ai_chatbot: [
    {
      id: "bot_purpose",
      label: "Purpose",
      question: "What should the chatbot help with? Choose all that apply.",
      kind: "multi",
      options: ["Customer support", "Sales & lead qualification", "Bookings", "Internal staff knowledge", "Order or account queries"],
      other: true,
    },
    {
      id: "bot_channels",
      label: "Channels",
      question: "Where should it be available? Choose all that apply.",
      kind: "multi",
      options: ["Website", "WhatsApp", "Microsoft Teams", "Slack", "Mobile app"],
      other: true,
    },
    {
      id: "bot_knowledge",
      label: "Knowledge sources",
      question: "Where should it get its answers from? Choose all that apply.",
      kind: "multi",
      options: ["Our website", "Documents & policies", "Help centre / FAQs", "CRM or order system", "Not sure yet"],
      other: true,
    },
    {
      id: "bot_handoff",
      label: "Human handover",
      question: "When it can't help, what should happen?",
      kind: "choice",
      options: ["Hand over to live chat", "Create a ticket", "Collect details and email the team", "Not sure, please advise"],
    },
    {
      id: "bot_volume",
      label: "Volume",
      question: "Roughly how many conversations a month do you expect?",
      kind: "choice",
      options: ["Under 500", "500 to 5,000", "Over 5,000", "Not sure"],
    },
  ],

  automation: [
    {
      id: "auto_process",
      label: "Process",
      question: "Which process would you like to automate?",
      kind: "longtext",
      placeholder: "e.g. turning website enquiries into quotes and invoices",
      when: (a) => !a.problem,
    },
    {
      id: "auto_frequency",
      label: "Frequency",
      question: "How often does it happen?",
      kind: "choice",
      options: ["Many times a day", "Daily", "Weekly", "Monthly"],
    },
    {
      id: "auto_current",
      label: "Current method",
      question: "How is it done today?",
      kind: "choice",
      options: ["Manually", "With spreadsheets and email", "Partly automated already"],
    },
    {
      id: "auto_systems",
      label: "Systems involved",
      question: "Which systems are involved? Choose all that apply.",
      kind: "multi",
      options: SYSTEMS,
      other: true,
    },
    {
      id: "auto_approvals",
      label: "Approvals",
      question: "Does the process include approvals or decisions by people?",
      kind: "choice",
      options: ["Yes", "Sometimes", "No"],
    },
    {
      id: "auto_outcome",
      label: "Expected outcome",
      question: "What would you like to achieve?",
      kind: "choice",
      options: ["Save staff time", "Faster response to customers", "Fewer errors", "Better visibility", "All of these"],
      other: true,
    },
  ],

  integration: [
    {
      id: "int_systems",
      label: "Systems to connect",
      question: "Which systems should be connected? Choose all that apply.",
      kind: "multi",
      options: SYSTEMS,
      other: true,
    },
    {
      id: "int_goal",
      label: "Integration goal",
      question: "What information should move between them, and why?",
      kind: "longtext",
      placeholder: "e.g. new Shopify orders should create invoices in Xero",
    },
    {
      id: "int_timing",
      label: "Sync timing",
      question: "How quickly should data move?",
      kind: "choice",
      options: ["Instantly", "Every few minutes or hourly", "Daily", "Not sure"],
    },
    {
      id: "int_apis",
      label: "APIs available",
      question: "Do these systems have APIs or integration options?",
      kind: "choice",
      options: ["Yes", "Some of them", "Not sure"],
    },
  ],

  data: [
    {
      id: "data_sources",
      label: "Data sources",
      question: "Where does your data live today? Choose all that apply.",
      kind: "multi",
      options: [...SYSTEMS, "SQL database"],
      other: true,
    },
    {
      id: "data_reports",
      label: "Reports needed",
      question: "Which reports, dashboards or insights do you need?",
      kind: "longtext",
    },
    {
      id: "data_audience",
      label: "Audience",
      question: "Who will use them? Choose all that apply.",
      kind: "multi",
      options: ["Leadership", "Operations", "Finance", "Sales", "Clients"],
    },
    {
      id: "data_refresh",
      label: "Refresh",
      question: "How up to date should they be?",
      kind: "choice",
      options: ["Real time", "Daily", "Weekly", "Monthly"],
    },
    {
      id: "data_ai",
      label: "AI insights",
      question: "Would you like AI to highlight trends, forecasts or recommendations?",
      kind: "choice",
      options: ["Yes", "Maybe, please advise", "No"],
    },
  ],
};

// ---------- Shared tail ----------

// ---------- Scale & operations (drives the architecture recommendation) ----------
// Business-language questions only: the customer is never asked to pick technologies.

const productLike = (a: Answers) => ["website", "software", "ai_agent", "data"].includes(solutionOf(a) ?? "");

export const OPS_INTRO_STEP = "biz_stage";

const notSimple = (a: Answers) => !isSimpleSite(a);

const opsSteps: EnquiryStep[] = [
  {
    id: "biz_stage",
    label: "Business stage",
    question: "Where is your business today?",
    kind: "choice",
    options: ["New business or idea", "Established business", "Growing and scaling"],
  },
  {
    id: "biz_size",
    label: "Business size",
    question: "How many people work in the business?",
    kind: "choice",
    options: ["Just me", "2 to 10", "11 to 50", "51 to 250", "Over 250"],
  },
  {
    id: "ops_users",
    label: "Monthly users",
    question: "Roughly how many people will use it in a typical month, including customers and staff?",
    kind: "choice",
    options: ["Under 500", "500 to 5,000", "5,000 to 50,000", "Over 50,000", "Not sure yet"],
    when: notSimple,
  },
  {
    id: "ops_staff",
    label: "Team users",
    question: "How many of your team will manage it or use the admin side?",
    kind: "choice",
    options: ["1 to 5", "6 to 25", "26 to 100", "Over 100"],
    when: (a) => productLike(a) && notSimple(a),
  },
  {
    id: "ops_regions",
    label: "User locations",
    question: "Where will most of the users be?",
    kind: "choice",
    options: ["Mainly the UK", "UK and Europe", "Middle East", "Worldwide"],
    when: notSimple,
  },
  {
    id: "ops_files",
    label: "Files & media",
    question: "Will it store files or media? Choose all that apply.",
    kind: "multi",
    options: ["No files", "Documents & PDFs", "Images", "Video", "Large data exports or backups"],
    when: (a) => productLike(a) && notSimple(a),
  },
  {
    id: "ops_realtime",
    label: "Live updates",
    question: "Does anything need to update live on screen, like chat, tracking or live dashboards?",
    kind: "choice",
    options: ["Yes", "No, that's not needed", "Not sure"],
    when: (a) => ["website", "software", "data"].includes(solutionOf(a) ?? "") && notSimple(a),
  },
  {
    id: "ops_availability",
    label: "Availability",
    question: "How critical is it if the system is unavailable for a short time?",
    kind: "choice",
    options: ["We can live with short outages", "Important during business hours", "Critical, it must run 24/7"],
    when: notSimple,
  },
  {
    id: "ops_security",
    label: "Security needs",
    question: "Any security or compliance needs? Choose all that apply.",
    kind: "multi",
    options: [
      "Standard security is fine",
      "Personal or customer data (UK GDPR)",
      "Payments or financial data",
      "Health or other sensitive data",
      "Staff sign in with Microsoft or Google (SSO)",
      "Two-step login (MFA)",
      "Full audit trail of changes",
    ],
    when: notSimple,
  },
  {
    id: "ops_growth",
    label: "Expected growth",
    question: "How do you expect usage to grow over the next two years?",
    kind: "choice",
    options: ["About the same", "Steady growth", "Fast growth, we're scaling up"],
    when: notSimple,
  },
];

const tail: EnquiryStep[] = [
  {
    id: "budget",
    label: "Budget",
    question: "What is your preferred budget for this project? Choose a range, or use Other to type an amount.",
    kind: "choice",
    options: ["Under £300", "£300 to £1,000", "£1,000 to £3,000", "£3,000 to £10,000", "Over £10,000", "Not sure yet"],
    other: true,
  },
  {
    id: "timeline",
    label: "Timeline",
    question: "When would you like to start?",
    kind: "choice",
    options: ["As soon as possible", "Within 3 months", "In 3 to 6 months", "Just exploring for now"],
  },
  {
    id: "notes",
    label: "Anything else",
    question: "Anything else we should know?",
    kind: "longtext",
    optional: true,
  },
  { id: "name", label: "Name", question: "What's your name?", kind: "text", placeholder: "Your full name", maxLength: 100 },
  { id: "company", label: "Company", question: "Which company are you with?", kind: "text", optional: true, maxLength: 120 },
  {
    id: "email",
    label: "Email",
    question: "What's the best email address for our reply?",
    kind: "email",
    placeholder: "you@company.com",
    maxLength: 160,
  },
  {
    id: "phone",
    label: "Phone",
    question: "And a phone number, if you'd like a call back?",
    kind: "tel",
    optional: true,
    maxLength: 40,
  },
];

// ---------- Engine ----------

/** The solution chosen so far (router label or AI recommendation). */
export const solutionOf = (answers: Answers): SolutionId | undefined =>
  (answers.solution_id as SolutionId | undefined) ?? solutionFromLabel(answers.solution ?? "");

/** Every step that applies to these answers, in order. */
export function stepsFor(answers: Answers): EnquiryStep[] {
  const steps: EnquiryStep[] = [routerStep];
  if (answers.solution === NOT_SURE) steps.push(problemStep);
  const solution = solutionOf(answers);
  if (!solution) return steps;
  return [...steps, ...flows[solution], ...opsSteps, ...tail].filter((s) => !s.when || s.when(answers));
}

/** The next unanswered step, or undefined when the enquiry is complete. */
export function nextStep(answers: Answers): EnquiryStep | undefined {
  return stepsFor(answers).find((s) => !(s.id in answers));
}

/** Drops answers for steps that no longer apply (e.g. after editing a branching answer). */
export function pruneAnswers(answers: Answers): Answers {
  const keep = new Set([...stepsFor(answers).map((s) => s.id), "solution_id", "recommendation"]);
  return Object.fromEntries(Object.entries(answers).filter(([k]) => keep.has(k)));
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Server-side validation: known steps only, required ones present, trimmed and length-limited. */
export function validateAnswers(input: unknown): Answers | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const answers: Answers = {};
  if (typeof raw.solution_id === "string" && solutionCatalogue.some((s) => s.id === raw.solution_id)) {
    answers.solution_id = raw.solution_id;
  }
  if (typeof raw.recommendation === "string") answers.recommendation = raw.recommendation.trim().slice(0, 600);
  // Resolve steps progressively, since later steps depend on earlier answers.
  for (let guard = 0; guard < 60; guard++) {
    const step = nextStep(answers);
    if (!step) break;
    const value = typeof raw[step.id] === "string" ? (raw[step.id] as string).trim() : "";
    if (!value && !step.optional) return null;
    answers[step.id] = value.slice(0, step.maxLength ?? (step.kind === "longtext" ? 1500 : 400));
  }
  // Choices made in the estimate (not chat questions): the app's technology and the Basic app's managed backend.
  if (answers.app_os) {
    if (typeof raw.app_build === "string" && [APP_HYBRID, APP_NATIVE].includes(raw.app_build)) answers.app_build = raw.app_build;
    if (raw.app_backend === APP_MANAGED) answers.app_backend = APP_MANAGED;
  }
  if (!answers.email || !EMAIL.test(answers.email)) return null;
  if (!solutionOf(answers)) return null;
  return answers;
}

/** Label/value rows for summaries, emails and the admin view. */
export function answerRows(answers: Answers): { id: string; label: string; value: string }[] {
  const asked = stepsFor(answers);
  const extra = [
    ...(answers.app_build && !asked.some((s) => s.id === "app_build") ? [{ id: "app_build", label: "App technology", value: answers.app_build }] : []),
    ...(answers.app_backend ? [{ id: "app_backend", label: "App backend", value: answers.app_backend }] : []),
  ];
  return [...rowsFor(asked, answers), ...extra];
}

function rowsFor(steps: EnquiryStep[], answers: Answers): { id: string; label: string; value: string }[] {
  return steps
    .filter((s) => answers[s.id])
    .map((s) => {
      if (s.id !== "solution") return { id: s.id, label: s.label, value: answers[s.id] };
      const chosen = solutionCatalogue.find((c) => c.id === solutionOf(answers));
      const recommended = answers.solution === NOT_SURE && chosen;
      return { id: s.id, label: s.label, value: chosen ? `${chosen.title}${recommended ? " (recommended)" : ""}` : answers[s.id] };
    });
}

/** Shared answers kept when the visitor switches to a different solution. */
export const SHARED_STEP_IDS = [
  ...opsSteps.map((step) => step.id),
  "budget",
  "timeline",
  "notes",
  "name",
  "company",
  "email",
  "phone",
];

/** Contact steps come after the solution plan (estimate + architecture) is shown. */
export const CONTACT_STEP_IDS = ["name", "company", "email", "phone"];
