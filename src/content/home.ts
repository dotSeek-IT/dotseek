/**
 * Homepage copy and data. Every section component reads from here.
 * Rule: no invented customer names, logos-as-endorsement, or fabricated
 * statistics. Integrations are systems DotSeek *can connect*, not clients.
 */

export const hero = {
  eyebrow: "AI business automation and digital solutions",
  titleLead: "Build a Smarter Business With",
  titleHighlight: "AI Automation",
  body: "DotSeek designs AI automation, AI agents, websites, web and mobile apps and connected business systems that remove repetitive work and help your teams operate faster. Bring us the problem; we'll shape the solution.",
  primary: { label: "Explore AI Automation", href: "#capabilities" },
  secondary: { label: "Talk to Our Team", href: "/contact" },
};

export const activity = [
  { label: "Lead qualified", detail: "ACME Ltd · Sales Agent", time: "1.2s" },
  { label: "Invoice processed", detail: "INV-20931 · matched to PO", time: "0.8s" },
  { label: "Ticket resolved", detail: "WhatsApp · delivery change", time: "4s" },
  { label: "CRM updated", detail: "HubSpot · 3 fields", time: "0.3s" },
  { label: "Approval requested", detail: "Teams · quote £12.4k", time: "0.5s" },
  { label: "Report generated", detail: "Weekly ops summary", time: "2.1s" },
  { label: "Document classified", detail: "Contract · routed to Legal", time: "1.6s" },
];

export const manifesto = {
  eyebrow: "Why DotSeek",
  text: "Most businesses don't need more software. They need the systems they already have to work together intelligently. DotSeek connects your data, people and tools, then lets AI handle the repetitive work in between.",
};

export type FlowStep = { label: string; system: string; status: "done" | "active" | "queued" };

export const heroFlow: FlowStep[] = [
  { label: "Lead received", system: "Website form", status: "done" },
  { label: "AI qualification", system: "Sales agent", status: "done" },
  { label: "CRM record updated", system: "HubSpot", status: "done" },
  { label: "Quotation generated", system: "Quote engine", status: "done" },
  { label: "Manager approval", system: "Teams", status: "active" },
  { label: "Invoice issued", system: "Xero", status: "queued" },
  { label: "Customer follow-up", system: "Email + WhatsApp", status: "queued" },
];

export const integrations = {
  heading: "Connect the tools your business already uses",
  items: [
    "Microsoft 365",
    "Google Workspace",
    "Salesforce",
    "HubSpot",
    "Slack",
    "Microsoft Teams",
    "Shopify",
    "Stripe",
    "WhatsApp",
    "Azure",
    "AWS",
    "OpenAI",
    "REST APIs",
    "SQL databases",
    "Xero",
    "Custom ERP",
  ],
};

export const capabilities = {
  eyebrow: "Capabilities",
  heading: "Everything you need to automate real business work",
  body: "From a single repetitive task to organisation-wide orchestration, DotSeek combines AI, integration and software engineering in one delivery team.",
  items: {
    agents: {
      title: "AI Agents",
      body: "Agents that handle business tasks, retrieve information from your systems and trigger workflows, all inside the guardrails you define.",
    },
    workflow: {
      title: "Workflow Automation",
      body: "Automate repetitive processes across departments, from hand-offs and approvals to notifications and data entry.",
    },
    documents: {
      title: "Intelligent Documents",
      body: "Extract, classify, validate and route invoices, contracts, forms and emails automatically.",
    },
    customer: {
      title: "Customer Automation",
      body: "Answer enquiries, qualify leads and follow up instantly, around the clock.",
    },
    integration: {
      title: "System Integration",
      body: "Connect CRM, ERP, websites, APIs and internal applications into one flow of data.",
    },
    insights: {
      title: "AI Insights",
      body: "Turn operational data into dashboards, forecasts and clear next actions.",
    },
  },
};

export type WorkflowStage = {
  number: string;
  tag: string;
  title: string;
  body: string;
  points: string[];
  visual: "capture" | "understand" | "decide" | "automate" | "measure";
};

export const workflow = {
  eyebrow: "How automation flows",
  heading: "From incoming request to completed outcome, automatically",
  stages: [
    {
      number: "01",
      tag: "Capture",
      title: "Capture every request, document and event",
      body: "Enquiries, emails, forms, files and system events flow into one automation layer the moment they arrive.",
      points: ["Email & web forms", "Uploaded documents", "System webhooks"],
      visual: "capture",
    },
    {
      number: "02",
      tag: "Understand",
      title: "AI understands context and intent",
      body: "Language models read the request, extract the data that matters and match it to the right customer, order or record.",
      points: ["Intent detection", "Data extraction", "Record matching"],
      visual: "understand",
    },
    {
      number: "03",
      tag: "Decide",
      title: "Business rules and AI choose the next step",
      body: "Your policies stay in charge. Rules, thresholds and approvals decide what happens, with people in the loop where it matters.",
      points: ["Rule engine", "Confidence thresholds", "Human approval"],
      visual: "decide",
    },
    {
      number: "04",
      tag: "Automate",
      title: "Systems update and actions run",
      body: "DotSeek connects your applications and performs the work: records, documents, messages and tasks, all done for you.",
      points: ["CRM & ERP updates", "Documents generated", "Notifications sent"],
      visual: "automate",
    },
    {
      number: "05",
      tag: "Measure",
      title: "Track outcomes and time saved",
      body: "Every run is logged. See throughput, exceptions and the manual effort you no longer spend.",
      points: ["Live run history", "Exception queue", "Savings reporting"],
      visual: "measure",
    },
  ] satisfies WorkflowStage[],
};

export type Agent = {
  name: string;
  role: string;
  tasks: string[];
  systems: string[];
  icon: "sales" | "support" | "ops" | "finance" | "hr" | "knowledge";
};

export const agents = {
  eyebrow: "AI Agents",
  heading: "AI agents that work across your business",
  body: "Each DotSeek agent operates inside a controlled workflow, connected to the systems it needs and nothing more. Every action is permissioned, logged and reviewable.",
  guardrails: ["Role-based permissions", "Human approval steps", "Full audit trail", "Your data stays yours"],
  items: [
    {
      name: "Sales Agent",
      role: "Qualifies leads and prepares quotes",
      tasks: ["Score inbound leads", "Draft tailored quotes", "Book follow-ups"],
      systems: ["CRM", "Email", "Calendar"],
      icon: "sales",
    },
    {
      name: "Customer Support Agent",
      role: "Resolves enquiries and routes tickets",
      tasks: ["Answer from your knowledge base", "Triage and route tickets", "Escalate with context"],
      systems: ["Helpdesk", "Chat", "WhatsApp"],
      icon: "support",
    },
    {
      name: "Operations Agent",
      role: "Orchestrates tasks and approvals",
      tasks: ["Assign and chase tasks", "Run approval chains", "Flag delays"],
      systems: ["ERP", "Teams", "Project tools"],
      icon: "ops",
    },
    {
      name: "Finance Agent",
      role: "Processes invoices and payments",
      tasks: ["Extract invoice data", "Match to purchase orders", "Prepare reconciliations"],
      systems: ["Accounting", "Banking", "Stripe"],
      icon: "finance",
    },
    {
      name: "HR Agent",
      role: "Supports people operations",
      tasks: ["Onboarding checklists", "Policy questions", "Leave requests"],
      systems: ["HRIS", "Microsoft 365", "Slack"],
      icon: "hr",
    },
    {
      name: "Knowledge Agent",
      role: "Answers from company knowledge",
      tasks: ["Search documents securely", "Summarise policies", "Cite its sources"],
      systems: ["SharePoint", "Drive", "Wiki"],
      icon: "knowledge",
    },
  ] satisfies Agent[],
};

export type Solution = { title: string; summary: string; items: string[] };

export const solutions = {
  eyebrow: "Business solutions",
  heading: "Automation for every department",
  body: "Start where the repetitive work hurts most, then extend across the organisation on the same foundation.",
  items: [
    {
      title: "Sales Automation",
      summary: "Move leads to revenue without manual admin.",
      items: ["Lead capture", "Lead qualification", "CRM updates", "Follow-ups", "Quotation generation"],
    },
    {
      title: "Customer Service",
      summary: "Faster answers, fewer handoffs.",
      items: ["AI chat", "Ticket routing", "Knowledge assistance", "Automated responses", "Escalation"],
    },
    {
      title: "Operations",
      summary: "Processes that run themselves.",
      items: ["Workflow orchestration", "Approval processes", "Scheduling", "Task automation", "Notifications"],
    },
    {
      title: "Finance",
      summary: "Accurate, auditable back-office flow.",
      items: ["Invoice generation", "Document processing", "Payment workflows", "Reconciliation assistance", "Reporting"],
    },
    {
      title: "Management",
      summary: "See the whole business clearly.",
      items: ["Dashboards", "AI insights", "Reporting", "Operational intelligence"],
    },
  ] satisfies Solution[],
  industries: ["Professional Services", "Retail & eCommerce", "Healthcare", "Education", "Property", "Finance"],
};

export const systems = {
  eyebrow: "AI + your existing systems",
  heading: "AI that works with your business, not against it",
  body: "You don't need to replace the systems your teams rely on. DotSeek connects your existing applications, databases, APIs and processes into intelligent, automated workflows. We build custom software only where it adds real value.",
  points: [
    { title: "Keep your stack", body: "We integrate with what you already run, on-premise or in the cloud." },
    { title: "Secure by design", body: "Least-privilege access, encrypted connections and full logging." },
    { title: "Built to extend", body: "Each new workflow reuses the same connectors and data layer." },
  ],
  nodes: ["CRM", "ERP", "Email", "Database", "Website", "Accounting", "Helpdesk", "Documents"],
};

export const process = {
  eyebrow: "How DotSeek works",
  heading: "From first conversation to automation in production",
  body: "A consultancy-led delivery model: we understand the process before we automate it.",
  steps: [
    { number: "01", title: "Discover", body: "Workshops with your team to map processes, systems and the repetitive work that slows you down." },
    { number: "02", title: "Analyse", body: "We quantify effort, data quality and risk to prioritise the automations with the clearest return." },
    { number: "03", title: "Design", body: "Solution architecture, agent behaviour, integrations and approval rules, all agreed before build." },
    { number: "04", title: "Automate", body: "We build, test and launch in iterations, with your team involved at every release." },
    { number: "05", title: "Optimise", body: "Monitoring, reporting and continuous improvement as your business and volumes grow." },
  ],
};

export const results = {
  eyebrow: "Outcomes",
  heading: "What automation changes for your business",
  body: "Every engagement is measured against a baseline we agree with you up front, so results are your numbers, not marketing claims.",
  items: [
    { title: "Hours of manual work reduced", body: "Data entry, copy-paste and chasing replaced by automated flow.", metric: "Hours back", icon: "clock" },
    { title: "Faster response times", body: "Enquiries acknowledged and actioned in moments, not days.", metric: "Response time", icon: "bolt" },
    { title: "Fewer repetitive tasks", body: "Teams focus on judgement, relationships and growth.", metric: "Tasks automated", icon: "stack" },
    { title: "Operational visibility", body: "Live dashboards across every automated process.", metric: "Real-time view", icon: "chart" },
    { title: "Connected systems", body: "One source of truth instead of disconnected tools.", metric: "Single data flow", icon: "link" },
    { title: "Scalable automation", body: "Handle growth in volume without growing headcount at the same rate.", metric: "Capacity", icon: "scale" },
  ],
} as const;

/**
 * Illustrative engagement: a representative example of the kind of
 * project DotSeek delivers. Not a named customer and contains no
 * fabricated statistics. Replace with a real, approved case study.
 */
export const caseStudy = {
  eyebrow: "Example engagement",
  heading: "What a DotSeek automation project looks like",
  label: "Illustrative example",
  context: "Professional services firm · Quote-to-invoice workflow",
  problem:
    "Enquiries arrived by email and web form. Staff re-typed details into the CRM, built quotes in spreadsheets and chased approvals manually, which slowed responses and created errors.",
  automation:
    "A sales agent qualifies each enquiry, creates the CRM record and drafts a quote from approved pricing. Managers approve in Teams, then invoices and follow-ups are generated automatically.",
  outcome:
    "One connected flow from enquiry to invoice, with every step logged. The team spends its time on client conversations instead of admin.",
};

export const cta = {
  heading: "Your business already has the data.",
  highlight: "Now make it work intelligently.",
  body: "Build AI-powered workflows, connected systems and intelligent business operations with DotSeek.",
  primary: { label: "Start Your Automation Journey", href: "mailto:seekingsupport@dotseek.co.uk?subject=Automation%20enquiry" },
  secondary: { label: "Talk to DotSeek", href: "/contact" },
};

export const faqs = {
  heading: "Questions about AI automation",
  body: "Straight answers to what organisations usually ask before starting.",
  items: [
    {
      q: "Do we need to replace our existing systems?",
      a: "No. DotSeek integrates with the CRM, ERP, finance, collaboration and database systems you already use. We only build custom software where an off-the-shelf tool can't do the job.",
    },
    {
      q: "Is AI automation safe for business-critical work?",
      a: "Agents run inside controlled workflows with role-based permissions, approval steps for sensitive actions and a full audit log. You decide what is automated end-to-end and where a person signs off.",
    },
    {
      q: "Where is our data processed?",
      a: "We design around your data-residency and security requirements, including UK/EU hosting, private cloud deployments and model providers that do not train on your data.",
    },
    {
      q: "How long does a first automation take?",
      a: "It depends on scope and integrations. Most engagements begin with a short discovery phase, after which we agree a delivery plan and timeline for the first workflow before any build starts.",
    },
    {
      q: "How is a project priced?",
      a: "Pricing follows your business stage, from a basic website through business web applications and custom software to AI and enterprise systems. Ask the AI consultant for an indicative estimate with a minimum, recommended and maximum price for your exact requirement, within your budget; the final quotation is confirmed by our team.",
    },
  ],
};
