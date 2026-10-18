/**
 * Secondary pages. Each page carries its own search metadata (`seoTitle`,
 * `description`). `status: "draft"` pages render a "being prepared" notice.
 * Legal pages describe how this site actually behaves (no tracking cookies, no
 * third party analytics, anonymous visit statistics counted on our own server).
 * Update them whenever that changes.
 */
export type PageBlock = { heading: string; body?: string[]; list?: string[] };

export type SimplePage = {
  slug: string;
  eyebrow: string;
  title: string;
  /** <title> for search results (≈50–60 characters, brand appended by the layout). */
  seoTitle: string;
  /** Meta description for search results (≈140–160 characters). */
  description: string;
  intro: string;
  updated?: string;
  sections?: PageBlock[];
  status: "published" | "draft";
};

const LAST_UPDATED = "16 October 2026";

export const pages: SimplePage[] = [
  {
    slug: "about",
    eyebrow: "About DotSeek",
    title: "We build the automation layer for modern businesses",
    seoTitle: "About Us, AI Automation Company in Swansea",
    description:
      "DotSeek is an AI business automation company in Swansea building AI agents, websites, web and mobile apps and system integrations for businesses worldwide.",
    intro:
      "DotSeek is an AI Business Automation Solutions company based in the UK. We combine consultancy, AI engineering, system integration and custom software development to remove repetitive work and connect the systems organisations already rely on.",
    sections: [
      {
        heading: "What we do",
        body: [
          "We design and deliver AI agents, intelligent workflow automation, document and data automation, CRM and ERP integrations, and business applications powered by AI, from discovery through to production support.",
        ],
      },
      {
        heading: "How we work",
        body: [
          "Every engagement starts with understanding the process, not the technology. We map how work actually flows, prioritise the automations with the clearest value, and deliver in iterations with your team involved throughout.",
        ],
      },
      {
        heading: "What we believe",
        body: [
          "AI should work with your business, not against it. That means integrating with your existing stack, keeping people in control of important decisions, and treating security and auditability as requirements rather than extras.",
        ],
      },
    ],
    status: "published",
  },
  {
    slug: "insights",
    eyebrow: "Insights",
    title: "Ideas on AI, automation and operations",
    seoTitle: "Insights on AI Automation and Business Operations",
    description:
      "Practical articles and guides from DotSeek on AI agents, workflow automation, system integration and running more efficient business operations.",
    intro: "Articles, guides and practical notes from the DotSeek team are coming soon.",
    status: "draft",
  },
  {
    slug: "careers",
    eyebrow: "Careers",
    title: "Build the future of business automation",
    seoTitle: "Careers in AI Automation and Software Development",
    description:
      "Join DotSeek and help businesses worldwide work smarter with AI agents, automation, websites and apps. We welcome engineers, consultants and designers.",
    intro:
      "We're always keen to hear from engineers, consultants and designers who care about solving real operational problems. Send your CV and a note about what you'd like to work on.",
    status: "published",
  },
  {
    slug: "privacy",
    eyebrow: "Legal",
    title: "Privacy policy",
    seoTitle: "Privacy Policy",
    description:
      "How DotSeek collects, uses and protects personal information under UK GDPR, including your rights and how to contact us about your data.",
    updated: LAST_UPDATED,
    intro:
      "This policy explains how DotSeek (\"we\", \"us\") collects and uses personal information when you visit dotseek.co.uk or contact us, and the rights you have under the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.",
    sections: [
      {
        heading: "Who we are",
        body: [
          "DotSeek is an AI business automation company based in Swansea, United Kingdom. We are the data controller for the personal information described in this policy.",
          "For any privacy question or request, email seekingsupport@dotseek.co.uk.",
        ],
      },
      {
        heading: "Information we collect",
        body: ["We only collect personal information you choose to give us, plus limited technical data needed to run the website securely."],
        list: [
          "Contact details you send us by email, phone or the enquiry in the DotSeek Assistant, such as your name, email address, phone number, company and job title.",
          "The content of your enquiry and any documents you share with us.",
          "Business contact and project information if you become a client.",
          "Technical data recorded automatically by our hosting provider, such as IP address, browser type and the date and time of requests, kept in server logs for security and reliability.",
          "Anonymous visit records: pages viewed, time of visit, country, device and browser type, the referring website and how far the visit went in the DotSeek Assistant (including estimate amounts). They contain no names, contact details or IP addresses (see our Cookie policy for how this works).",
        ],
      },
      {
        heading: "What we don't collect",
        body: [
          "This website does not use third party analytics or advertising tools and does not set tracking cookies. Visits are counted anonymously on our own server. Our fonts are served from our own website, so your visit is not shared with font providers. See our Cookie policy for details.",
          "We do not keep a record of conversations with the DotSeek Assistant (see below).",
        ],
      },
      {
        heading: "How and why we use your information",
        list: [
          "To reply to your enquiry and discuss a potential project (legitimate interests, or steps taken at your request before entering a contract).",
          "To deliver and support services we have agreed with you (performance of a contract).",
          "To keep business, accounting and tax records (legal obligation).",
          "To protect the security and integrity of our website and systems (legitimate interests).",
          "To answer questions you ask the DotSeek Assistant (legitimate interests).",
          "To understand how the website is used and how many visitors request quotes, from anonymous totals only (legitimate interests).",
        ],
      },
      {
        heading: "DotSeek Assistant (AI chat)",
        body: [
          "The DotSeek Assistant is an AI chat built and run by DotSeek. When you send a message, the conversation so far is sent from our server to our AI service provider to generate a reply. We don't save general chat conversations on our servers. Your browser keeps the conversation for the open tab, so a page refresh doesn't lose it, and it is deleted when you close the tab.",
          "Our AI service provider processes these messages on our behalf under its commercial terms and does not use them to train its models. Like any web service, our hosting provider may record technical request data, such as your IP address, for security and to prevent misuse.",
          "If you start an enquiry in the chat, your project answers are sent to our AI service provider so the assistant can suggest a suitable solution and prepare a project brief for you to review. You can edit any answer before sending.",
          "When you send an enquiry, your answers, the project brief and, if you tick the box, a copy of the chat are saved securely in our enquiry system and emailed to our team. We email you a private link where you can follow the conversation with our team and reply. Anyone with that link can view the enquiry, so please keep it private.",
          "Please don't share sensitive personal information, passwords or confidential business documents in the chat. AI answers can contain mistakes, so confirm anything important with our team.",
        ],
      },
      {
        heading: "Sharing your information",
        body: [
          "We never sell your personal information. We share it only with trusted providers who help us run our business, such as email, hosting, database and IT service providers, and our AI service provider for the DotSeek Assistant, and with professional advisers or authorities where the law requires it. These providers may only use your information on our instructions.",
          "If information is transferred outside the UK, we make sure appropriate safeguards are in place, such as UK adequacy regulations or the International Data Transfer Agreement.",
        ],
      },
      {
        heading: "How long we keep it",
        list: [
          "Enquiries that don't lead to a project: up to 24 months after our last contact.",
          "Client and contract records: up to 6 years after the engagement ends, to meet legal and accounting requirements.",
          "Server logs: kept by our hosting provider for a short period for security purposes.",
        ],
      },
      {
        heading: "Your rights",
        body: ["You have the right to:"],
        list: [
          "Access the personal information we hold about you.",
          "Ask us to correct information that is inaccurate or incomplete.",
          "Ask us to delete your information.",
          "Ask us to restrict or object to how we use your information.",
          "Receive your information in a portable format.",
          "Withdraw consent at any time, where we rely on consent.",
        ],
      },
      {
        heading: "Making a request or complaint",
        body: [
          "To use any of these rights, email seekingsupport@dotseek.co.uk. We will respond within one month.",
          "If you are unhappy with how we have handled your information, you can complain to the Information Commissioner's Office (ICO) at ico.org.uk or on 0303 123 1113. We would appreciate the chance to resolve your concern first.",
        ],
      },
      {
        heading: "Security",
        body: [
          "We use appropriate technical and organisational measures to protect personal information, including encrypted connections, access controls and minimal access rights to client systems.",
        ],
      },
      {
        heading: "Changes to this policy",
        body: ["We may update this policy from time to time. The date at the top of this page shows when it was last changed."],
      },
    ],
    status: "published",
  },
  {
    slug: "cookies",
    eyebrow: "Legal",
    title: "Cookie policy",
    seoTitle: "Cookie Policy",
    description:
      "DotSeek's website does not use tracking or advertising cookies. Learn what is stored in your browser and how to manage cookies.",
    updated: LAST_UPDATED,
    intro:
      "This policy explains how dotseek.co.uk uses cookies and similar technologies, in line with the UK Privacy and Electronic Communications Regulations (PECR) and UK GDPR.",
    sections: [
      {
        heading: "What cookies are",
        body: [
          "Cookies are small text files a website stores on your device. Similar technologies, such as local storage, work in a comparable way. They can be essential for a site to work, or used for things like analytics and advertising.",
        ],
      },
      {
        heading: "Cookies we use",
        body: [
          "This website does not set any cookies for visitors, and we do not use third party analytics, advertising or social media tracking.",
          "Our private team area (for DotSeek staff only) sets one strictly necessary cookie, ds_admin, when a team member signs in. It keeps them signed in for up to 12 hours and is never set for visitors.",
        ],
      },
      {
        heading: "Information stored in your browser",
        body: ["We store a few strictly necessary items in your browser. None of them are cookies, none contain tracking information, and none are shared with other websites:"],
        list: [
          "ds-cookie-notice (local storage): remembers that you have dismissed our cookie notice, so it isn't shown on every page. It contains no personal information and stays until you clear your browser data.",
          "dotseek-chat (session storage): keeps your DotSeek Assistant conversation and estimate while the tab is open, so a page refresh doesn't lose them. It holds the latest 60 messages at most and is deleted when you close the tab.",
          "dotseek-locale (session storage): your country, worked out from your connection and never your exact location, and our currency settings, so prices show in your currency straight away. It is deleted when you close the tab.",
          "dotseek-region (local storage): set only if you choose a currency yourself, so the choice is remembered on your next visit. It stays until you clear your browser data.",
        ],
      },
      {
        heading: "Anonymous visit statistics",
        body: [
          "To see how people find us and how many request quotes, our own server keeps an anonymous record of each visit: when it happened, the pages viewed, the country (worked out from your connection, never your exact location), the type of device and browser, the website or campaign that linked to us, and how far the visit went in the DotSeek Assistant (for example opening the chat, choosing a service, seeing an estimate or sending a quote, with the estimate amount and currency). No cookies are used and nothing is stored on your device for this. Your IP address is never stored: it is combined with the date and your browser type into a one way code, used only to link the steps of one visit for 30 minutes and to count unique visitors for the day, and deleted within two days. Visit records contain no names, email addresses or IP addresses and are kept for up to 400 days. If your browser sends a Global Privacy Control or Do Not Track signal, your visit is not counted.",
        ],
      },
      {
        heading: "Third party services",
        body: [
          "The DotSeek Assistant chat does not use cookies. Messages you send are passed to our AI provider to generate replies, and the conversation is only saved by DotSeek if you choose to include it with an enquiry. See our Privacy policy for details.",
          "Our fonts are hosted on our own website, so no requests go to other services when the page loads. If you follow a link to another website, such as LinkedIn or GitHub, that website's own cookie policy applies.",
        ],
      },
      {
        heading: "If this changes",
        body: [
          "If we introduce third party analytics or any other optional cookies in future, we will ask for your consent before setting them and update this policy.",
        ],
      },
      {
        heading: "Managing cookies",
        body: [
          "You can view, block or delete cookies and local storage through your browser settings. Guidance is available at ico.org.uk and in your browser's help pages.",
          "Questions about this policy? Email seekingsupport@dotseek.co.uk.",
        ],
      },
    ],
    status: "published",
  },
  {
    slug: "terms",
    eyebrow: "Legal",
    title: "Terms of use",
    seoTitle: "Terms of Use",
    description:
      "The terms that apply when you use the DotSeek website, including acceptable use, intellectual property, liability and the law that governs these terms.",
    updated: LAST_UPDATED,
    intro:
      "These terms explain the rules for using dotseek.co.uk (the \"website\"). By using the website you accept these terms. If you don't agree with them, please don't use the website.",
    sections: [
      {
        heading: "Who we are",
        body: [
          "The website is operated by DotSeek, an AI business automation company based in Swansea, United Kingdom. You can contact us at seekingsupport@dotseek.co.uk.",
        ],
      },
      {
        heading: "Other terms that apply",
        body: ["These terms work alongside our Privacy policy and Cookie policy, which explain how we handle personal information and what is stored in your browser."],
        list: [
          "These terms cover use of the website only.",
          "Any services we provide to you are governed by a separate written agreement, which takes priority over these terms if there is any conflict.",
        ],
      },
      {
        heading: "Using the website",
        body: ["You may use the website for lawful purposes only. You must not:"],
        list: [
          "Use the website in a way that breaks any law or regulation, or is fraudulent or harmful.",
          "Try to gain unauthorised access to the website, the server it runs on, or any connected system.",
          "Introduce viruses, malware or any other harmful material, or attack the website through a denial of service attack.",
          "Copy, scrape or harvest content from the website in bulk, including for training AI models, without our written permission.",
          "Present the website, or any part of it, in a way that suggests an association with us that does not exist.",
        ],
      },
      {
        heading: "Information on the website",
        body: [
          "The content on the website is for general information about DotSeek and our services. It is not professional advice, and you should not rely on it when making business decisions without speaking to us first.",
          "Product screens, workflows, figures and the example engagement shown on the website are illustrations of the kind of work we do. They are not records of a specific client project or a promise of particular results.",
          "We work to keep the website accurate and up to date, but we don't guarantee that it is complete, free of errors or always available. We may change or remove content at any time without notice.",
        ],
      },
      {
        heading: "Intellectual property",
        body: [
          "We own, or are licensed to use, all intellectual property in the website and its content, including text, graphics, interface designs, logos and code. You may view the website and print or download extracts for your own reference, but you may not otherwise copy, adapt or reuse any part of it for commercial purposes without our written permission.",
          "DotSeek and the DotSeek logo are our trade marks. Names of other companies' products and services, such as those listed as systems we integrate with, belong to their respective owners. Their mention does not imply any partnership or endorsement.",
        ],
      },
      {
        heading: "Links to other websites",
        body: [
          "The website links to other websites, such as LinkedIn and GitHub. We have no control over those websites and are not responsible for their content, availability or privacy practices.",
        ],
      },
      {
        heading: "Our liability",
        body: [
          "Nothing in these terms limits or excludes our liability for death or personal injury caused by our negligence, for fraud or fraudulent misrepresentation, or for any other liability that cannot be limited or excluded under English law.",
          "Subject to that, we are not liable for any loss or damage arising from your use of, or inability to use, the website or from relying on its content. This includes loss of profit, revenue, business, data or goodwill, and any indirect or consequential loss.",
          "We are not responsible for any virus or other harmful material that may affect your equipment or data as a result of using the website. Please use your own virus protection.",
        ],
      },
      {
        heading: "Changes to these terms",
        body: [
          "We may update these terms from time to time. The date at the top of this page shows when they were last changed. Please check this page whenever you use the website.",
        ],
      },
      {
        heading: "Governing law",
        body: [
          "These terms, and any dispute or claim arising from them or from use of the website, are governed by the law of England and Wales. The courts of England and Wales have exclusive jurisdiction.",
          "Questions about these terms? Email seekingsupport@dotseek.co.uk.",
        ],
      },
    ],
    status: "published",
  },
];
