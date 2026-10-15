/**
 * Site-wide content: navigation, footer, company details.
 * Copy lives here (not in components) so pages stay presentational.
 */

export const site = {
  name: "DotSeek",
  /** Production origin. Used for canonical URLs, sitemap and structured data. */
  url: "https://www.dotseek.co.uk",
  /** Search-result title and description for the homepage (and site default). */
  seoTitle: "DotSeek | AI Business Automation Solutions UK",
  seoDescription:
    "DotSeek builds AI automation, AI agents, websites, web and mobile apps and system integrations for UK businesses. Describe your problem and get a tailored plan.",
  category: "AI Business Automation & Digital Solutions",
  tagline: "AI automation built around your business.",
  description:
    "DotSeek designs AI automation, AI agents, websites, web and mobile apps, custom software and system integrations that reduce repetitive work and connect people, data and systems.",
  email: "seekingsupport@dotseek.co.uk",
  location: "Swansea, United Kingdom",
  primaryCta: { label: "Start Automating", href: "/contact" },
  talkCta: { label: "Talk to an AI Automation Expert", href: "/contact" },
};

export type NavItem = { label: string; href: string };

export const mainNav: NavItem[] = [
  { label: "Solutions", href: "/#solutions" },
  { label: "AI Automation", href: "/#capabilities" },
  { label: "AI Agents", href: "/#agents" },
  { label: "Industries", href: "/#industries" },
  { label: "Services", href: "/#process" },
  { label: "About", href: "/about" },
  { label: "Insights", href: "/insights" },
];

export const footerColumns: { title: string; links: NavItem[] }[] = [
  {
    title: "Solutions",
    links: [
      { label: "AI Automation", href: "/#capabilities" },
      { label: "AI Agents", href: "/#agents" },
      { label: "Workflow Automation", href: "/#workflow" },
      { label: "Websites & Web Platforms", href: "/#solutions" },
      { label: "Web & Mobile Apps", href: "/#solutions" },
      { label: "System Integration", href: "/#integrations" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Careers", href: "/careers" },
      { label: "Insights", href: "/insights" },
    ],
  },
  {
    title: "Industries",
    links: [
      { label: "Professional Services", href: "/#industries" },
      { label: "Retail", href: "/#industries" },
      { label: "Healthcare", href: "/#industries" },
      { label: "Education", href: "/#industries" },
      { label: "Property", href: "/#industries" },
      { label: "Finance", href: "/#industries" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Cookies", href: "/cookies" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

// LinkedIn URL is assumed: confirm before launch.
export const socialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/dotseek", icon: "linkedin" },
  // Temporarily without a destination: the icon stays, the link goes nowhere ("#").
  { label: "GitHub", href: "#", icon: "github" },
] as const;
