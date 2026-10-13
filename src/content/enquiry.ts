/**
 * Guided enquiry flow run inside the DotSeek Assistant.
 * Each step is a question with option buttons (single or multi choice) or a
 * text field. Choosing "Other" reveals a text field in the chat.
 * Answers are emailed to the team via /api/enquiry and are never sent to the AI.
 */

export type EnquiryStep = {
  id: EnquiryField;
  question: string;
  kind: "choice" | "multi" | "text" | "email";
  options?: string[];
  /** Adds an "Other" option that opens a text field. */
  other?: boolean;
  placeholder?: string;
  optional?: boolean;
  maxLength?: number;
};

export type EnquiryField =
  | "area"
  | "systems"
  | "teamSize"
  | "timeline"
  | "details"
  | "name"
  | "company"
  | "email"
  | "phone";

export type EnquiryAnswers = Partial<Record<EnquiryField, string>>;

export const enquiryIntro =
  "Great, let's put your enquiry together. I'll ask a few quick questions and send the answers straight to the DotSeek team. You can cancel at any time.";

export const enquirySteps: EnquiryStep[] = [
  {
    id: "area",
    question: "What would you like to automate?",
    kind: "choice",
    options: [
      "Sales & lead handling",
      "Customer service",
      "Operations & approvals",
      "Finance & invoicing",
      "Documents & data entry",
      "AI agents",
      "System integration",
    ],
    other: true,
    placeholder: "Describe the area you'd like to automate",
  },
  {
    id: "systems",
    question: "Which systems do you use today? Choose all that apply.",
    kind: "multi",
    options: ["Microsoft 365", "Google Workspace", "Salesforce", "HubSpot", "Xero / accounting", "ERP", "Spreadsheets"],
    other: true,
    placeholder: "Which other systems do you use?",
  },
  {
    id: "teamSize",
    question: "How many people work in your organisation?",
    kind: "choice",
    options: ["1 to 10", "11 to 50", "51 to 200", "201 to 1,000", "More than 1,000"],
  },
  {
    id: "timeline",
    question: "When would you like to get started?",
    kind: "choice",
    options: ["As soon as possible", "Within 3 months", "In 3 to 6 months", "Just exploring for now"],
  },
  {
    id: "details",
    question: "Briefly describe the process or problem. What takes up your team's time today?",
    kind: "text",
    placeholder: "e.g. We re-type web enquiries into our CRM and build quotes in spreadsheets",
    optional: true,
    maxLength: 1000,
  },
  { id: "name", question: "What's your name?", kind: "text", placeholder: "Your full name", maxLength: 100 },
  {
    id: "company",
    question: "Which company are you with?",
    kind: "text",
    placeholder: "Company name",
    optional: true,
    maxLength: 120,
  },
  {
    id: "email",
    question: "What's the best email address to reply to?",
    kind: "email",
    placeholder: "you@company.com",
    maxLength: 160,
  },
  {
    id: "phone",
    question: "And a phone number, if you'd like a call back?",
    kind: "text",
    placeholder: "Phone number",
    optional: true,
    maxLength: 40,
  },
];

export const enquiryLabels: Record<EnquiryField, string> = {
  area: "Automation area",
  systems: "Current systems",
  teamSize: "Organisation size",
  timeline: "Timeline",
  details: "Process details",
  name: "Name",
  company: "Company",
  email: "Email",
  phone: "Phone",
};

export const enquiryCopy = {
  start: "Start an enquiry",
  review: "Here's a summary of your enquiry. Ready to send it to the DotSeek team?",
  consent: "By sending, you agree that DotSeek may use these details to reply to your enquiry, as described in our Privacy policy.",
  send: "Send enquiry",
  restart: "Start again",
  cancel: "Cancel enquiry",
  skip: "Skip",
  continue: "Continue",
  other: "Other",
  sending: "Sending your enquiry…",
  sent: "Thank you! Your enquiry has been sent to the DotSeek team. We'll reply by email as soon as we can.",
  cancelled: "No problem, I've cancelled the enquiry. Anything else I can help with?",
  failed:
    "Sorry, I couldn't send your enquiry just now. You can send the same details from your email app instead, and nothing you typed will be lost.",
  emailApp: "Send from my email app",
  invalidEmail: "That email address doesn't look quite right. Could you check it?",
  required: "Please enter an answer, or choose another option.",
};
