import { site } from "./site";

/** Contact page copy. Contact details themselves come from `site`. */

const enquiryBody = [
  "Hi DotSeek team,",
  "",
  "Company:",
  "Your role:",
  "",
  "The process we'd like to automate:",
  "",
  "Systems we use today (e.g. CRM, ERP, email, spreadsheets):",
  "",
  "Roughly how often this happens / how much time it takes:",
  "",
  "Best way and time to reach me:",
].join("\n");

export const contact = {
  eyebrow: "Contact",
  title: "Let's Talk About What You Want to Automate",
  seoTitle: "Contact DotSeek, AI Business Automation Experts",
  description:
    "Contact DotSeek about AI agents, workflow automation and system integration. Email seekingsupport@dotseek.co.uk or call +44 20 4625 3317. Based in Swansea, UK.",
  intro:
    "Tell us about the repetitive work slowing your team down. We'll reply with how DotSeek would approach it and the best next step, with no obligation.",
  methods: [
    {
      icon: "mail",
      label: "Email",
      value: site.email,
      detail: "Best for new enquiries and project details.",
      href: `mailto:${site.email}`,
      action: "Send an email",
    },
    {
      icon: "phone",
      label: "Phone",
      value: site.phone,
      detail: "Speak to the team about your project.",
      href: `tel:${site.phone.replace(/\s/g, "")}`,
      action: "Call us",
    },
    {
      icon: "location",
      label: "Location",
      value: site.location,
      detail: "Where the DotSeek team is based.",
      href: undefined,
      action: undefined,
    },
  ] as const,
  enquiry: {
    heading: "Start your enquiry",
    body: "Including a few details helps us give you a useful first reply. Start in chat and the DotSeek Assistant will guide you through them, or use our email template.",
    checklist: [
      "Your company and role",
      "The process you want to automate",
      "The systems you use today",
      "How often it happens and how long it takes",
    ],
    action: "Use email instead",
    href: `mailto:${site.email}?subject=${encodeURIComponent("Automation enquiry")}&body=${encodeURIComponent(enquiryBody)}`,
  },
  next: {
    heading: "What happens next",
    steps: [
      { number: "01", title: "We reply", body: "A member of the team reads your enquiry and replies personally, with any questions we have." },
      { number: "02", title: "Discovery call", body: "A short call to understand your process, systems and goals, and whether automation is the right fit." },
      { number: "03", title: "Your proposal", body: "If it is, we outline a recommended approach, scope and next steps for your first automation." },
    ],
  },
};
