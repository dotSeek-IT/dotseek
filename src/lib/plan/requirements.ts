import { includes, isSimpleSite, type Answers } from "@/content/enquiryFlows";
import type { ScopeId } from "@/content/pricing";
import type { Signals } from "./signals";

/**
 * Turns enquiry answers into the features and services the project needs
 * (before the architecture tier adds its infrastructure). Also returns effort
 * adjustments and the AI/messaging usage factor.
 */

export type Requirements = {
  items: Set<string>;
  /** Extra (or fewer) person-days per item, e.g. a single-platform mobile app. */
  dayAdjust: Record<string, number>;
  /** Multiplier for usage-based monthly costs (conversation volume). */
  usageFactor: number;
  /** Work that should run in the background (for reasons and the queue/worker). */
  backgroundTasks: string[];
  /** Starting scope per item when the answers point beyond Basic (customer can change it). */
  defaultScopes: Record<string, ScopeId>;
  /** Line labels that depend on the answers (e.g. a single-platform app). */
  labels: Record<string, string>;
};

const SYSTEM_ITEMS: Record<string, string | null> = {
  "Microsoft 365": "int_workspace",
  "Google Workspace": "int_workspace",
  Salesforce: "int_crm",
  HubSpot: "int_crm",
  "Xero / accounting": "int_accounting",
  "Shopify / e-commerce": "int_ecom",
  ERP: "int_erp",
  Spreadsheets: "int_spreadsheet",
  "SQL database": null,
  None: null,
  "None, it only advises": null,
};

/** Comma-separated multi answer -> parts. Unknown parts are free text from "Other". */
const parts = (answer?: string) => (answer ? answer.split(", ").map((p) => p.trim()).filter(Boolean) : []);

/** True when a multi answer contains free text beyond the known options (options may contain commas). */
const hasOther = (answer: string | undefined, known: string[]) => {
  let rest = answer ?? "";
  for (const option of [...known].sort((a, b) => b.length - a.length)) rest = rest.split(option).join("");
  return rest.replace(/[,\s]/g, "").length > 0;
};

function addSystems(items: Set<string>, answer?: string) {
  for (const part of parts(answer)) {
    if (part in SYSTEM_ITEMS) {
      const id = SYSTEM_ITEMS[part];
      if (id) items.add(id);
    } else items.add("int_other");
  }
}

export function readRequirements(answers: Answers, s: Signals): Requirements {
  const simple = isSimpleSite(answers);
  // A very simple site needs no discovery workshop.
  const items = new Set<string>(simple ? ["hosting", "encryption"] : ["discovery", "hosting", "encryption"]);
  const dayAdjust: Record<string, number> = {};
  const background: string[] = [];
  let usageFactor = 1;
  const add = (...ids: string[]) => ids.forEach((id) => items.add(id));

  switch (s.solution) {
    case "website": {
      const need = answers.web_need;
      if (simple) {
        // Basic stage: one responsive page with contact details, WhatsApp button and enquiry form.
        add("landing", "email_service");
      } else {
        add("uxui", "frontend", "seo");
        if (answers.web_design === "We have a design or brand guide") dayAdjust.uxui = -3;
        // Effort (and so price) grows with the size of the site.
        const pages = { "Medium site (6 to 15 pages)": [6, 2.5], "Large site (16 or more pages)": [16, 5] }[answers.web_pages ?? ""] as [number, number] | undefined;
        if (pages) {
          dayAdjust.frontend = pages[0];
          dayAdjust.uxui = (dayAdjust.uxui ?? 0) + pages[1];
        }
      }
      if (includes(need, "Backend / API for an existing website")) add("backend");
      if (includes(need, "Admin portal or business management system")) add("backend", "admin", "auth");
      if (includes(need, "E-commerce or payments")) add("backend", "ecommerce", "payments");
      if (includes(need, "AI features or chatbot")) add("ai_chatbot");
      if (includes(need, "A mobile app to go with it")) add("backend", "auth", "mobile_app");
      const frontendOnly = includes(need, "Frontend development only") && parts(need).length === 1;
      switch (answers.web_backend) {
        case "Custom backend or API":
          add("backend");
          break;
        case "Admin portal to run the business":
          add("backend", "admin", "auth");
          break;
        case "Nothing beyond the website":
          break;
        default:
          if (!frontendOnly) add("cms");
      }
      const f = answers.web_features;
      if (includes(f, "Blog or insights")) add("cms");
      if (includes(f, "Contact & enquiry forms")) add("email_service");
      if (includes(f, "Bookings or appointments")) add("backend", "bookings", "email_service");
      if (includes(f, "Customer login area")) add("backend", "auth");
      if (includes(f, "Online shop")) add("backend", "ecommerce", "payments");
      if (includes(f, "Multiple languages")) add("multilang");
      if (includes(f, "Search") && items.has("ecommerce")) add("search");
      const i = answers.web_integrations;
      if (includes(i, "CRM")) add("int_crm");
      if (includes(i, "Payments (Stripe, PayPal)")) add("payments");
      if (includes(i, "Email marketing")) add("int_marketing");
      if (includes(i, "Accounting")) add("int_accounting");
      if (includes(i, "Booking or calendar")) add("int_calendar");
      if (includes(i, "AI chatbot")) add("ai_chatbot");
      if (hasOther(i, ["CRM", "Payments (Stripe, PayPal)", "Email marketing", "Accounting", "Booking or calendar", "Analytics", "AI chatbot", "None"])) add("int_other");
      // Frontend effort grows with the pages and features asked for.
      if (!simple) dayAdjust.frontend = (dayAdjust.frontend ?? 0) + Math.max(0, Math.min(6, parts(answers.web_features).length) - 2);
      break;
    }
    case "software": {
      add("uxui", "backend", "auth");
      const type = answers.sw_type ?? "";
      const platform = answers.sw_platform ?? "";
      const mobile = /mobile app|Both a web app/i.test(type) || /Mobile|Both/.test(platform);
      const mobileOnly = type === "A mobile app (iOS / Android)" || platform === "Mobile (iOS / Android)";
      if (!mobileOnly) add("frontend");
      dayAdjust.frontend = 4; // web apps have more screens and states than a website
      if (mobile) add("mobile_app");
      if (includes(answers.sw_user_types, "Managers / admins")) add("admin", "rbac");
      if (includes(answers.sw_user_types, "Suppliers or partners")) add("rbac");
      if (answers.sw_existing === "Spreadsheets and email") add("int_spreadsheet");
      addSystems(items, answers.sw_integrations);
      if (answers.sw_automation === "Yes") add("automation");
      dayAdjust.backend = ({ "51 to 200": 3, "200+": 6, "Customers (public)": 4 } as Record<string, number>)[answers.sw_users ?? ""] ?? 0;
      break;
    }
    case "ai_agent": {
      add("ai_agent", "backend");
      dayAdjust.backend = -4; // orchestration API, not a full application backend
      if (answers.agent_approval && answers.agent_approval !== "No, fully automatic") add("admin", "audit");
      if (includes(answers.agent_data, "Documents & PDFs")) add("document_ai");
      if (includes(answers.agent_data, "Website or knowledge base")) add("rag", "vector_db");
      if (includes(answers.agent_data, "CRM records")) add("int_crm");
      if (includes(answers.agent_data, "Spreadsheets")) add("int_spreadsheet");
      if (includes(answers.agent_data, "Emails")) add("int_workspace");
      addSystems(items, answers.agent_tools);
      addSystems(items, answers.agent_integrations);
      background.push("AI agent tasks");
      break;
    }
    case "ai_chatbot": {
      add("ai_chatbot");
      const ch = answers.bot_channels;
      if (includes(ch, "Website")) add("frontend");
      if (includes(ch, "WhatsApp")) add("whatsapp");
      if (includes(ch, "Microsoft Teams")) add("int_workspace");
      if (includes(ch, "Slack")) add("int_other");
      const k = answers.bot_knowledge;
      if (["Our website", "Documents & policies", "Help centre / FAQs"].some((o) => includes(k, o))) add("rag", "vector_db");
      if (includes(k, "CRM or order system")) add("backend", "int_crm");
      if (includes(answers.bot_purpose, "Bookings")) add("backend", "bookings");
      if (answers.bot_handoff === "Hand over to live chat") add("realtime");
      if (answers.bot_handoff === "Create a ticket") add("int_other");
      if (answers.bot_handoff === "Collect details and email the team") add("email_service");
      dayAdjust.frontend = -6.5; // the chat widget only, not a full website
      usageFactor = ({ "Under 500": 0.5, "500 to 5,000": 1, "Over 5,000": 2.5 } as Record<string, number>)[answers.bot_volume ?? ""] ?? 1;
      break;
    }
    case "automation": {
      add("automation", "backend");
      dayAdjust.backend = -4;
      addSystems(items, answers.auto_systems);
      if (answers.auto_approvals !== "No") add("inapp", "audit");
      if (answers.auto_frequency === "Many times a day") background.push("frequent workflow runs");
      else add("scheduled");
      background.push("automated workflow steps");
      break;
    }
    case "integration": {
      add("backend");
      dayAdjust.backend = -4;
      addSystems(items, answers.int_systems);
      if (answers.int_timing === "Instantly") add("events");
      else add("scheduled");
      background.push("data synchronisation");
      break;
    }
    case "data": {
      add("data_pipeline", "analytics");
      addSystems(items, answers.data_sources);
      if (answers.data_ai === "Yes") add("ai_insights");
      if (includes(answers.data_audience, "Clients")) add("frontend", "auth", "rbac");
      if (answers.data_refresh === "Real time") add("events");
      else add("scheduled");
      background.push("data imports and refreshes");
      break;
    }
  }

  // Mobile app details (software flow, or website + companion app).
  if (items.has("mobile_app")) {
    if (["iPhone (iOS) only", "Android only"].includes(answers.app_os ?? "")) dayAdjust.mobile_app = -6;
    const f = answers.app_features;
    if (includes(f, "User accounts and login")) add("auth", "backend");
    if (includes(f, "Push notifications")) add("push");
    if (includes(f, "In-app payments or subscriptions")) add("payments");
    if (includes(f, "Bookings or orders")) add("bookings");
    if (includes(f, "Camera, photos or scanning")) add("image_storage", "file_storage");
    if (includes(f, "Chat or messaging")) add("realtime", "inapp");
    const extra = (includes(f, "Maps and location") ? 3 : 0) + (includes(f, "Works offline") ? 5 : 0) + (includes(f, "Chat or messaging") ? 4 : 0);
    dayAdjust.mobile_app = (dayAdjust.mobile_app ?? 0) + extra;
    if (!items.has("frontend") && !items.has("admin")) add("backend");
  }

  // Scale & operations answers.
  if (s.files.documents || s.files.bulk) add("file_storage");
  if (s.files.images) add("file_storage", "image_storage");
  if (s.files.video) add("file_storage", "video_storage");
  if (s.realtime) add("realtime");
  if (s.security.sso) add("sso");
  if (s.security.mfa || s.security.sensitive) add("mfa");
  if (s.security.audit || s.security.sensitive || s.security.payments) add("audit");
  if (s.staffTier >= 1 && items.has("admin")) add("rbac");

  // Anything with a backend keeps data in a database, with backups and email.
  const needsData = ["backend", "auth", "admin", "ecommerce", "bookings", "ai_agent", "automation", "data_pipeline", "mobile_app"].some((id) =>
    items.has(id),
  );
  if (needsData) add("sql_db", "backup", "email_service");
  if (items.has("ecommerce") || items.has("bookings") || items.has("auth")) add("email_service");

  if (items.has("document_ai")) background.push("document processing");
  if (items.has("video_storage")) background.push("video processing");
  if (items.has("ai_chatbot") && items.has("rag")) background.push("knowledge base indexing");
  if (items.has("email_service") && needsData) background.push("email sending");
  if (["ai_agent", "document_ai", "video_storage", "automation"].some((id) => items.has(id))) add("worker");
  if (["ai_agent", "document_ai", "video_storage"].some((id) => items.has(id))) add("queue");

  // Starting scopes: Basic unless the answers clearly need more.
  const defaultScopes: Record<string, ScopeId> = {};
  const advanced = (...ids: string[]) => ids.forEach((id) => (defaultScopes[id] = "advanced"));
  if (answers.int_timing === "Instantly") advanced(...[...items].filter((id) => id.startsWith("int_")));
  if (s.usersTier >= 2 || answers.sw_users === "200+") advanced("backend");
  if (parts(answers.agent_behaviour).length >= 3 || parts(answers.agent_integrations).length >= 3) advanced("ai_agent");
  if (includes(answers.bot_knowledge, "CRM or order system") || answers.bot_handoff === "Hand over to live chat") advanced("ai_chatbot");
  if (answers.auto_approvals === "Yes" && answers.auto_frequency === "Many times a day") advanced("automation");
  if (includes(answers.app_features, "In-app payments or subscriptions") || items.has("ecommerce")) advanced("payments");
  if (s.solution === "ai_chatbot" && items.has("whatsapp")) advanced("whatsapp");
  if (parts(answers.web_features).length >= 5) advanced("frontend");

  const labels: Record<string, string> = {};
  if (answers.app_os === "iPhone (iOS) only") labels.mobile_app = "Mobile app (iPhone first)";
  if (answers.app_os === "Android only") labels.mobile_app = "Mobile app (Android first)";

  return { items, dayAdjust, usageFactor, backgroundTasks: [...new Set(background)], defaultScopes, labels };
}
