import type { IconName } from "@/components/common/Icon";

/**
 * DotSeek solution catalogue: the single list of what DotSeek delivers.
 * Used by the homepage Solutions section, the AI consultant's knowledge, the
 * consultant's `start_enquiry` tool and the enquiry router.
 * AI automation stays the core; the catalogue shows the full platform.
 */

export type SolutionId =
  | "website"
  | "software"
  | "ai_agent"
  | "ai_chatbot"
  | "automation"
  | "integration"
  | "data";

export type Solution = {
  id: SolutionId;
  title: string;
  /** Short label for chips and the enquiry router. */
  label: string;
  summary: string;
  examples: string[];
  icon: IconName;
};

export const solutionCatalogue: Solution[] = [
  {
    id: "automation",
    title: "Workflow Automation",
    label: "Workflow automation",
    summary: "Remove repetitive work across departments with automated workflows driven by your rules.",
    examples: ["Approvals", "Quote to invoice", "Notifications", "Data entry"],
    icon: "workflow",
  },
  {
    id: "ai_agent",
    title: "AI Agents",
    label: "AI agent",
    summary: "Agents that carry out business tasks inside your systems, with your guardrails.",
    examples: ["Sales", "Operations", "Finance", "Knowledge"],
    icon: "agent",
  },
  {
    id: "ai_chatbot",
    title: "AI Chatbots & Assistants",
    label: "AI chatbot",
    summary: "Customer and staff assistants that answer, qualify, book and hand over to people.",
    examples: ["Website chat", "WhatsApp", "Teams", "Internal knowledge"],
    icon: "chat",
  },
  {
    id: "website",
    title: "Websites & Web Platforms",
    label: "Website",
    summary: "New websites, redesigns, online stores, portals and the backend that powers them.",
    examples: ["New website", "Redesign", "Online store", "Admin portal"],
    icon: "globe",
  },
  {
    id: "software",
    title: "Software, Web & Mobile Apps",
    label: "App or software",
    summary: "Web apps, iOS and Android apps, or both on one shared system, plus CRM, ERP and internal software.",
    examples: ["Web app", "iOS & Android", "Web + mobile", "CRM / ERP"],
    icon: "mobile",
  },
  {
    id: "integration",
    title: "System & API Integration",
    label: "System integration",
    summary: "Connect CRM, ERP, finance, online store and internal tools into one flow of data.",
    examples: ["CRM ↔ ERP", "Payments", "APIs", "Data sync"],
    icon: "plug",
  },
  {
    id: "data",
    title: "Data, Reporting & AI Insights",
    label: "Data & reporting",
    summary: "Dashboards, reporting and AI insights that turn operational data into decisions.",
    examples: ["Dashboards", "KPI reports", "Forecasts", "AI insights"],
    icon: "chart",
  },
];

export const solutionById = (id: string) => solutionCatalogue.find((s) => s.id === id);

export const solutionsSection = {
  eyebrow: "One partner, every solution",
  heading: "Digital and AI Solutions for Any Business",
  body: "AI automation is at the heart of what we do, and we build everything around it: websites, web and mobile apps, custom software, integrations and data. Bring us a business problem, and we'll shape the right solution.",
  consult: {
    title: "Not sure what you need?",
    body: "Describe the problem in your own words. Our AI consultant will ask the right questions, suggest the best approach and turn it into a clear project brief for the team.",
    action: "Ask the AI consultant",
  },
};
