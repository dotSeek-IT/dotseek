import type { SolutionId } from "@/content/solutions";

/**
 * Fallback for "Not sure yet" when the AI isn't available: picks the closest
 * solution from the words in the described problem. Returns null when nothing
 * matches, so the visitor chooses from the list instead.
 */
const SIGNALS: Record<SolutionId, { words: string[]; reason: string; suggestions: string[] }> = {
  website: {
    words: ["website", "web site", "online ordering", "order online", "online orders", "online shop", "ecommerce", "e-commerce", "sell online", "landing page", "booking page", "book online", "online booking", "web presence", "seo"],
    reason: "You want customers to find you and act online, so a website (with online ordering, bookings or a shop where needed) is the natural starting point.",
    suggestions: ["Online ordering or bookings on the website", "An admin view so staff see every order in one place", "Automatic confirmation emails"],
  },
  software: {
    words: ["mobile app", "app", "ios", "android", "portal", "crm", "platform", "software", "system for", "staff system", "one place", "internal tool", "dashboard for staff"],
    reason: "This sounds like a custom application your team and customers use every day, built around how you work.",
    suggestions: ["Shared accounts and data for staff and customers", "A mobile app if people work on the move", "Room to add automation later"],
  },
  automation: {
    words: ["automate", "automatic", "manual", "manually", "spreadsheet", "copy and paste", "data entry", "repetitive", "approval", "invoice", "workflow", "follow up", "follow-up", "lose track"],
    reason: "Much of the work is repetitive and manual, which is exactly what workflow automation removes.",
    suggestions: ["Capture requests automatically", "Route approvals to the right person", "Keep every system updated without copying data"],
  },
  ai_agent: {
    words: ["agent", "autonomous", "triage", "research", "decide", "do the work", "on its own", "act on"],
    reason: "You need something that can carry out tasks across your systems, with a person approving key steps: an AI agent.",
    suggestions: ["Handle a defined task end to end", "Human approval before anything is sent", "A log of every action taken"],
  },
  ai_chatbot: {
    words: ["chatbot", "chat bot", "chat", "faq", "questions", "customer support", "whatsapp", "answer customers", "answering", "24/7", "live chat", "calls", "phone", "receptionist", "appointment", "appointments", "booking calls", "enquiries from customers"],
    reason: "Customers keep contacting you with the same questions and requests, so an AI assistant can answer them instantly, take bookings and hand over to your team when needed.",
    suggestions: ["Answers from your own content", "Hand over to a person when it can't help", "Capture leads and bookings in the chat"],
  },
  integration: {
    words: ["integrate", "integration", "connect", "sync", "api", "between systems", "xero", "quickbooks", "hubspot", "salesforce", "shopify", "two systems"],
    reason: "The main gap is between your existing systems, so connecting them through their APIs keeps data in step without retyping.",
    suggestions: ["Sync in both directions between the key systems", "Alerts when something fails", "A single source of truth for records"],
  },
  data: {
    words: ["report", "reporting", "dashboard", "analytics", "insight", "kpi", "forecast", "metrics", "business intelligence", "numbers"],
    reason: "You need clear, current numbers, so data reporting and dashboards (with AI insights if useful) fit best.",
    suggestions: ["One dashboard across your data sources", "Scheduled reports by email", "Trends and forecasts highlighted by AI"],
  },
};

export function keywordRecommendation(problem: string): { solution: SolutionId; reason: string; suggestions: string[] } | null {
  const text = ` ${problem.toLowerCase()} `;
  let best: { id: SolutionId; score: number } | null = null;
  for (const [id, signal] of Object.entries(SIGNALS) as [SolutionId, (typeof SIGNALS)[SolutionId]][]) {
    // Longer phrases are stronger evidence than single words.
    const score = signal.words.reduce((sum, w) => sum + (text.includes(w) ? (w.includes(" ") ? 2 : 1) : 0), 0);
    if (score > 0 && (!best || score > best.score)) best = { id, score };
  }
  if (!best) return null;
  const { reason, suggestions } = SIGNALS[best.id];
  return { solution: best.id, reason: `${reason} (Suggested from your description. The team will confirm.)`, suggestions };
}
