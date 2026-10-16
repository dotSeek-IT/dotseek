# DotSeek: Business & Website Specification

> This is the business, product and content specification for the DotSeek website.
> `DESIGN.md` defines the visual system and `SKILL.md` defines implementation rules.
> All three describe the same implementation.

## 1. Brand

| | |
|---|---|
| **Name** | DotSeek |
| **Category** | AI Business Automation Solutions Company |
| **Location** | Swansea, United Kingdom |
| **Contact** | seekingsupport@dotseek.co.uk (email and the DotSeek Assistant enquiry; no public phone number) |
| **Domain** | www.dotseek.co.uk (apex redirects to www) |

**Core message:** DotSeek uses AI, intelligent automation and custom software to
simplify business operations, reduce repetitive work and connect people, data
and systems.

**Hero headline:** *Build a Smarter Business With **AI Automation***
**Supporting line:** DotSeek designs intelligent automation systems, AI agents and connected business applications that remove repetitive work and help your teams operate faster.
**Positioning lines in use:** "AI that works with your business, not against it" · "From incoming request to completed outcome" · "Your business already has the data. Now make it work intelligently."

**What the site must communicate immediately:**

1. DotSeek understands AI.
2. DotSeek understands business processes.
3. DotSeek can connect systems.
4. DotSeek can automate real business work.

DotSeek is **not** a chatbot company. It is a full AI automation and digital
transformation partner, covering consultancy through to delivery and support.

## 2. Services

AI Business Automation · Intelligent Workflow Automation · AI Agents · Business
Process Automation · CRM & ERP Automation · AI Chatbots & Virtual Assistants ·
Document & Data Automation · API & System Integration · Sales & Marketing
Automation · Customer Service Automation · Finance & Administrative Automation ·
AI-powered Web Applications · Custom Software Development · Data Analytics & AI
Insights · Cloud Integration · Enterprise AI Solutions · Custom AI Models & LLM
Integration.

**Solutions catalogue (the platform view).** AI automation stays the core offer;
everything else is built around it. The catalogue lives in
`src/content/solutions.ts` and drives the homepage Solutions section, the chat
consultant and the enquiry flows:

| Id | Solution | Covers |
|---|---|---|
| `automation` | Workflow Automation (core) | Approvals, quote to invoice, notifications, data entry |
| `ai_agent` | AI Agents | Sales, operations, finance, knowledge agents |
| `ai_chatbot` | AI Chatbots & Assistants | Website chat, WhatsApp, Teams, internal knowledge |
| `website` | Websites & Web Platforms | New sites, redesigns, e-commerce, portals, admin backends |
| `software` | Software, Web & Mobile Apps | Web apps, iOS and Android apps, web and mobile together on one shared system, CRM/ERP, internal tools |
| `integration` | System & API Integration | CRM to ERP, payments, APIs, data sync |
| `data` | Data, Reporting & AI Insights | Dashboards, KPIs, forecasts, AI insights |

**Differentiator:** DotSeek integrates AI into the systems a business already runs
and builds custom software only where it adds real value, so clients don't have to
rip and replace.

## 3. Audience

SMEs, mid-market and enterprise organisations. Typical buyers are owners and
directors, operations, finance, sales and customer-service leaders, and IT/digital
leads. Industries shown: Professional Services, Retail & eCommerce, Healthcare,
Education, Property, Finance.

## 4. Voice

Confident, clear and practical. Business outcomes come first, technology second. British
English. No hype words ("revolutionary", "magic"), no unverifiable claims and no
fake urgency. Headings use Title Case and body copy uses sentence case.
**Never use the em dash (—) anywhere in site content**, including copy, mockup text,
metadata and titles. Use a comma, colon, full stop or "|" (in page titles) instead.

## 5. Website architecture

| Route | Source | Status |
|---|---|---|
| `/` | `src/app/(site)/page.tsx` + `src/content/home.ts` | Live |
| `/contact` | `src/app/(site)/contact/page.tsx` + `src/content/contact.ts` | Published: email, phone, location, enquiry email template, "What happens next" |
| `/about` | `src/content/pages.ts` | Published |
| `/careers` | `src/content/pages.ts` | Published |
| `/insights` | `src/content/pages.ts` | Draft placeholder, `noindex` (blog to come) |
| `/privacy` | `src/content/pages.ts` | Published (UK GDPR privacy policy) |
| `/cookies` | `src/content/pages.ts` | Published (PECR cookie policy: no cookies set) |
| `/terms` | `src/content/pages.ts` | Published (website terms of use, law of England and Wales) |
| `/sitemap.xml`, `/robots.txt` | `src/app/sitemap.ts`, `src/app/robots.ts` | Generated at build. Only published pages are listed. `robots.txt` disallows `/admin`, `/enquiry` and `/api`. |
| `/enquiry/[token]` | `src/app/(portal)/enquiry/[token]/page.tsx` | Private customer page for one enquiry (`noindex`) |
| `/admin`, `/admin/login`, `/admin/enquiries/[id]`, `/admin/offers` | `src/app/(portal)/admin/…` | DotSeek team inbox (password protected, `noindex`) |

Marketing pages live in the `(site)` route group, which wraps them in `SiteChrome` (header, footer, cookie notice, assistant). The private pages live in `(portal)`, which has a minimal top bar and no assistant.

The site runs on Next.js in server mode (`next start`; deployed to Vercel). Marketing pages are pre-rendered. The server runs the API routes (`/api/assistant`, `/api/enquiry`, `/api/enquiry/recommend`, `/api/enquiry/summary`) and the portal pages. Visitors get no cookies; only a signed-in team member gets the `ds_admin` session cookie.

**Contact routing:** every "talk to us" CTA (header, mobile menu, hero secondary, FAQ, footer "Contact") goes to `/contact`. The homepage's final CTA section keeps the `#contact` anchor.

**DotSeek Assistant (AI business consultant):** a floating AI chat (bottom-right on every marketing page), labelled "powered by DotSeek".
- **Consultant behaviour:** `/api/assistant` streams replies from Claude (`claude-opus-5-5`, low effort, server-side refusal fallback). The system prompt (`src/lib/assistant/systemPrompt.ts`) is built from the site's own content and the solutions catalogue. The assistant listens to the business problem, asks one or two clarifying questions, suggests the right solution with practical feature ideas, and never invents prices, timelines, clients or results.
- **Handing over to an enquiry:** when the visitor is ready, the model calls the `start_enquiry` tool (`solution` id + `reason`). The server validates the input and sends it to the browser as a control frame, which renders a "Start my website enquiry" style card in the chat.
- **Dynamic enquiry flows** (`src/content/enquiryFlows.ts`): the first question routes by solution (or "Not sure yet", which asks for the problem and gets an AI recommendation from `/api/enquiry/recommend`). Each solution then asks only its relevant questions, with conditions. For example, a website enquiry asks whether it is an existing site, a new site, frontend only, backend/API, admin portal, e-commerce, AI features or a mobile app to go with it, and follows up on each. An app enquiry asks whether to build a web app, a mobile app or both; mobile projects then ask about iPhone/Android, app features, App Store or private release, and (for web plus mobile) whether both share one system. The same mobile questions appear in the website flow when a companion app is chosen. Every flow ends with a shared tail: budget, timeline, notes, name, company, email, phone. Option questions show buttons, "Other" opens a text field, multi-select questions show a Continue button. Optional questions (notes, company, phone and two follow-up details) say "(Optional: answer below, or skip this question.)", show "Optional" in the field and a "Skip this question" button; required ones (such as name and email) have no skip.
- **Scale and operations questions:** after the solution questions, the chat asks in business language (never technology names) about monthly users, team users, where users are, files and media, live updates, availability, security and compliance, and expected growth. These drive the architecture recommendation.
- **Solution plan (estimate + architecture):** before contact details, the chat shows an "AI-Generated Indicative Estimate" card that opens the full plan (see "Core customer journey" below). The customer can turn features and infrastructure on or off, change the architecture level, pick a package or cloud provider, download the quotation, modify requirements, request a consultation, or continue.
- **Review and edit:** after contact details, the chat shows every answer with an Edit button (with "Keep current answer" to back out), the AI project brief and the estimate card. The customer can tick "Email me a copy of my estimate" (on by default) and "I'd like a free consultation call".
- **Submit:** `/api/enquiry` re-validates every answer on the server, recalculates the plan from the answers and the customer's choices (figures from the browser are never trusted), saves the enquiry with the plan (reference `DS-XXXXXX`), emails the team (with a link to the admin page and the full report) and emails the visitor a confirmation with their private link and, if chosen, a copy of the estimate. If sending fails, the visitor can send the same summary from their email app.
- **After sending:** "View your enquiry" opens the customer's private enquiry page in a modal over the chat (estimate, answers and the conversation with the team, with reply), so the chat stays in place; the same private link is emailed. Pages can only be framed by this site (`X-Frame-Options: SAMEORIGIN`, `frame-ancestors 'self'` in `next.config.ts`). Privacy links in the chat open in a new tab.
- **Team continuation:** the team signs in at `/admin`, sees the inbox by status (New, In progress, Awaiting customer, Closed), reads the brief, answers and transcript, replies and changes the status. Each team reply emails the customer the private link. Customer replies on `/enquiry/[token]` email the team.
- **Offline fallback:** if the AI isn't configured or fails, the chat answers from `src/content/assistant.ts` by keyword, the label switches to "Automated answers", and the enquiry still works without the recommendation and brief.
- **Safeguards:** input limits, a same-origin check, server-side validation of every answer and per-IP rate limits (20 chat messages per 10 minutes, 5 enquiries per hour).
- **Data:** general chat is not stored. Sent enquiries are stored in Upstash Redis (Vercel KV) in production, or `.data/enquiries.json` in local development. The Privacy and Cookie policies describe this.

### Core customer journey

**Business problem → AI consultation → requirement collection → business stage → recommended solution → architecture → service selection → budget → dynamic price range → market comparison → new customer offer → optional negotiation → phased recommendation → final enquiry → DotSeek team review.**

DotSeek suits customers at every level, from a basic website to enterprise systems: a customer can start small, stay within budget and scale the same solution as the business grows.

### Reference URL → cost analysis → budget match → make it cheaper → phased build → quotation

"Have a reference website or app?" (chat chip, the homepage band, or `START_ENQUIRY_EVENT` with `solution: "reference"`) asks for a link: a website, web app, SaaS product, online shop, competitor, design reference, or an App Store / Google Play listing. A link pasted straight into the normal chat (with or without https://, e.g. "something like canva.com") starts the same analysis automatically; email addresses are not treated as links.
- **Analysis** (`/api/reference`): the server fetches the public page safely (http(s) only, public IP addresses only, redirects re-checked, 8 second and 1.5 MB limits; `src/lib/reference/fetch.ts`) and reads evidence from what visitors can actually do (links, buttons, inputs, the page's own scripts and embeds; never words in the copy, so a marketing page that mentions "dashboards" or lists "Shopify" isn't mistaken for having them) for pages, design and animation, forms, login, dashboard, backend, admin, search, e-commerce, payments, booking, chat, AI, integrations, languages, customer portal, roles, reporting, real time and app store links (`src/lib/reference/analyse.ts`). App Store and Google Play listings are read from the app's own description (accounts, live stats, rewards, clubs, payments, health and music integrations and so on) and treated as a mobile app. The AI refines this into a likely scope and explains what drives the cost; without the AI the rules are used.
- **Reference card** in the chat: reference complexity (stage), estimated build range, timeline, likely required services (frontend, backend, database, admin, integrations, AI, infrastructure), features spotted and the originality note.
- **Then** the chat asks business stage, size and "What is your preferred budget?", and opens the estimate on the "Reference & cheaper options" tab.
- **Options** (`costOptions` in `src/lib/plan/reference.ts`): Full reference-level build; Cost-optimised (similar visual direction and core functionality, fewer custom pages, basic levels, CMS instead of a custom dashboard, no advanced AI, real time, extra integrations or high-scale infrastructure; app features trimmed); MVP (main business functions on a small site, launch scope on essential hosting; for apps, one platform first with essential features); Basic (a small responsive website with a similar direction, or for app ideas a website that presents the app and collects sign-ups). Each shows its range, timeline, what it keeps and simplifies, and "Use this version". Indicative ranges only.
- **Budget match:** if the full scope is above the budget: "Building every feature from the reference within £X would not be realistic. However, we can create a simplified Phase 1 version that keeps the most important design and business functionality", with the best version within budget, what's included and the later upgrades.
- **What drives the cost:** each feature (custom UI/UX, animation, backend, accounts, admin, e-commerce, payments, bookings, search, chatbot, agent, mobile app, integrations, real time, reporting, languages) with its impact (Low, Medium, High) and Keep / Remove / Add later. "Add later" items leave the estimate and appear under "Later upgrades" with their own costs.
- **Make this cheaper** (summary sidebar, for every estimate): switches to the next cheaper version. It never reduces basic security, accessibility, responsive behaviour, data protection or essential reliability.
- **Originality:** references are used only to understand layout style, features, interaction patterns and approximate complexity. DotSeek never claims it can copy or clone a third-party site; the solution uses original implementation, branding, content and assets unless the customer owns them or has permission to reuse them. The reference is stored with the enquiry and shown in the report, emails and admin.

**Business stages** (starting ranges, `stages` in `src/content/pricing.ts`, shown inside the AI estimate only; the homepage never shows price amounts):

| Stage | Price | Typical scope |
|---|---|---|
| Basic | From £100 | Single landing page or very small static site, responsive, business information, contact details, WhatsApp/contact button, basic enquiry form, limited revisions, no complex backend or admin portal. £100 is only the starting price for a very basic website. |
| Starter | About £300–£1,000+ | Multi-page small business website, better UI/UX, enquiry forms, basic SEO, CMS, basic backend where required |
| Growth | About £1,000–£3,000+ | Business web applications: backend/API, database, authentication, admin and customer portals, bookings, payments, automation, integrations |
| Advanced | About £3,000–£10,000+ | Custom software, mobile apps, AI chatbots and agents, CRM/ERP integrations, complex automation, advanced reporting |
| Scale / Enterprise | Custom quote | High traffic, enterprise, multi-tenant SaaS, microservices, Kubernetes, high availability, multiple AI services, multi-region |

A project's stage comes from the middle of its minimum and recommended estimates (Enterprise when the Enterprise architecture is needed).

DotSeek first understands the business problem, then recommends the right technology, from minimum viable infrastructure to enterprise scale, and explains the differences and costs. It recommends the right architecture, never simply the most expensive one, and says when something isn't needed yet (for example a mobile app in Phase 1, or Kubernetes for a small system).

**Pricing engine (`src/content/pricing.ts` + `src/lib/plan`).** Every figure is calculated from DotSeek's price catalogue; the AI never invents prices.
- **Price catalogue:** every feature and service has a £ minimum–maximum price at Basic scope (for example a landing page £100–£250, a backend £200–£600, a mobile app £1,200–£3,500). The price is scaled by the item's level (Basic, Advanced about 1.8×, Custom about 2.6×), by size from the answers (pages, single or both phone platforms, chat widget only and so on) and, for features, by a complexity factor (users, team size, growth, sensitive data). Each line shows a range and a recommended figure (40% of the way from minimum to maximum).
- **Minimum, Recommended and Maximum estimates** are the totals of the lines. Testing (8%), project management (4%) and a deployment range are added once the build is above £1,500; small sites include them. Timelines come from separate effort days and a team capacity that grows with project size.
- **Questions that drive the price:** solution and features (with page count for websites), business stage and size, then (except for very simple sites) users, team, regions, files, live updates, availability, security and growth, then the budget (ranges matched to the stages, or a typed amount through "Other").
- **Running costs:** monthly GBP ranges per service, by architecture tier, adjusted by the chosen cloud provider; AI and messaging costs are usage-based. Maintenance is 2% of the build per month (minimum £15) by tier.
- **Market comparison ("Indicative Market Estimate"):** configurable data per market (UK, US, Europe, UAE, Saudi Arabia, Kuwait, India): freelancer and agency multipliers against DotSeek's recommended estimate and an exchange rate, each with a review date (`markets`, `marketMeta`). Shown in local currency with a GBP equivalent; the saving compares with the UK agency range only.
- **New customer offer:** configured by the admin at `/admin/offers` (active, label, discount % or fixed "From £" price, expiry date, eligible services) and stored with the enquiry data. Shown on estimates for eligible services when it lowers the price; on submit the server re-checks it and marks it eligible only if the email has not enquired before. Never hard-coded.
- **Negotiation:** "Request a better price", "Tell us your budget" and "Discuss this quote". A preferred budget and note are saved with the enquiry and shown to the team; the customer sees "Your preferred budget has been added to the enquiry. DotSeek can review the scope and suggest whether the project can be adjusted or delivered in phases." Nothing is promised.
- **Budget-based phasing:** when the estimate is above the budget, the plan explains the gap and offers a lean Phase 1 (launch scope on essential hosting) within budget with one click ("Start with Phase 1"), then Phase 2 Run the business (admin, automation, integrations), Phase 3 Mobile, Phase 4 AI and scale. Each phase shows its range and whether it fits the budget.
- The catalogue carries a review date; every view shows the "AI-Generated Indicative Estimate" label and the disclaimers. Final commercial quotations are confirmed only by the DotSeek team.

**Architecture levels.** The engine scores the requirement (users, team size, regions, live updates, availability, growth, AI agents and document AI, integrations, video, sensitive data, customer accounts and payments) and recommends a level:

| Level | Name | Typical use | Infrastructure added |
|---|---|---|---|
| 1 | Basic / Starter | Business websites, small portals, simple booking, MVPs | Managed hosting, database, storage, backups |
| 2 | Standard Business | Customer portals, booking platforms, CRM, e-commerce | + CDN, Redis, worker, email, monitoring, staging, CI/CD, Docker |
| 3 | Advanced / High Scale | High traffic, complex or AI-enabled software, SaaS, real time | + load balancer, auto scaling, API gateway, queue, logging, WAF |
| 4 | Enterprise | Large, multi-region, high-availability systems | + Kubernetes, multi-region, disaster recovery, secrets management |

Enterprise is only recommended for genuinely large or critical systems with multi-region or fast-growth needs, and customer accounts, payments or orders always get at least Level 2. Requirement-driven services (vector database and RAG for AI knowledge, queue and worker for background work, real-time updates, MFA, SSO, audit logs, file, image and video storage) are added at any level.

**The solution plan view** (full-screen, three tabs, with a live summary):
- **Fully customisable:** apart from discovery, hosting and encryption, every item can be switched on or off, including the main item of the solution (for example the AI agent on an AI agent enquiry); it stays in Phase 1 while selected. Every item with build effort also offers **Basic, Advanced or Custom**, each with a description of what is included and its setup cost (Advanced is about 1.8× the effort and 1.5× the running cost, Custom about 2.6× and 2×). Starting scopes come from the answers (for example "sync instantly" makes integrations Advanced); otherwise Basic. Scope changes appear in the line items (for example "CRM integration (Custom)"), the report, emails and portal.
- **Chat continuity and routing:** the conversation (its latest 60 messages), enquiry and quote are kept for the browser tab (sessionStorage, restored before the first paint), so a refresh or a page opened from a chat link keeps them; nothing is kept after the tab closes. Links in replies to pages and homepage sections navigate (and scroll) and close the chat, which keeps the conversation. Page buttons that start an enquiry (solution cards, the pocket-money band, the contact page, the footer) start one, or reopen the one in progress; when a page asks for a different solution, a reference quote, or (from the email's `/?quote=new`) a fresh quote while an enquiry is in progress, the chat asks "start … instead?" with "Switch" and "Keep my current enquiry". After sending, the quote workspace shows "Quote sent" with "View your enquiry" and "Start another enquiry".
- **Not sure without AI:** when the AI isn't available, `/api/enquiry/recommend` suggests the closest solution from the words in the description (`lib/assistant/keywordRecommend.ts`), marked as a suggestion the team will confirm; with no match the visitor picks from the list.
- **Phone numbers:** must be 7 to 15 digits (with +, spaces, brackets or dashes); the chat says so, and the server drops an unusable number rather than rejecting the enquiry.
- **Versions:** each cheaper version must cost less than the one above it (a version that doesn't is left out); without a reference the first is "Full build". Quote titles use customer-facing names ("Website", "Landing page website", "E-commerce website", "Web application"), never the catalogue's line labels.
- **Expanded chat with a live quote:** the chat can expand to full screen, with the conversation on the left and the quote on the right, like an AI canvas (`components/plan/QuoteWorkspace.tsx`, loaded only when the chat expands). While the customer answers, it shows "Your quote is being prepared" with their requirement so far over a document skeleton. When the quote is ready it is generated step by step (reading the requirement, choosing the architecture, pricing each item, comparing market rates, preparing the quotation) and then shown as the same quotation document as the quotation modal (`components/plan/QuotationDocument.tsx`), which updates live with every change (answers, versions, the price slider, stages) with a short "Updating" state. On desktop the first quote opens the workspace automatically; on phones it is a Chat / Quote switch. "Adjust services and price" opens the estimate; "Continue to send enquiry" goes on to the contact steps.
- **Business stage (selectable):** the five stages are buttons. Choosing one fits the quote to that stage's price ceiling the same way as the slider (a leaner version when needed); stages the requirement cannot reach (e.g. Basic or Starter for a mobile app) are disabled, and a link opens "Reference & cheaper options" to compare versions.
- **Choose your price:** a slider from the lowest viable version of the project to the premium version, with the recommended price marked. The customer picks a target and the options adjust to fit. Below the current price, levels are lowered first (Custom → Advanced → Basic), then extras move to a later phase (mobile app, AI add-ons, analytics, extra integrations), then the architecture is simplified. Above it, the plan moves to the recommended architecture, adds recommended services and raises levels (features before infrastructure; infrastructure is never pushed to Custom). The range covers every version of the requirement (Full, Cost-optimised, MVP and Basic), so it is the same for apps as for websites: when a target is below what trimming the current build can reach, the slider switches to the richest cheaper version that fits (for an app, the MVP or the Basic app on one platform with a managed backend) and uses any budget left over; moving back up restores the full build. It never adds unrelated features to use up a budget, and it fills back up after cutting so the quote lands close to the target. The changes are listed, everything stays editable, "Reset to our recommendation" restores the default, and the target travels with the enquiry and appears in the report.
- **Quotation:** requirement profile, consultant recommendations (rule-based advice plus AI advice, each with a one-click "Remove it" or "Add it"), development line items and total, feature toggles with cost impact, hosting and running costs, and recommended implementation phases (Launch, Extend, Scale).
- **Architecture:** the four levels with monthly ranges, a layered architecture diagram that updates as options change (users, apps, edge, services, data, external), the AI's explanation, every infrastructure service with its status (Included, Recommended, Optional, Not needed yet), the reason, setup cost, monthly cost and impact on performance, reliability, scalability and complexity, and the future upgrade path.
- **Compare:** four package options (for example Website only; + backend and admin; + mobile app; complete digital solution + AI automation), a cloud provider comparison (Azure, AWS, Google Cloud, DigitalOcean, Hetzner, Hostinger VPS, Vercel + Supabase, Cloudflare) with Options A, B and C, and the global market comparison.
- **Summary:** DotSeek estimate, timeline, infrastructure and usage per month, maintenance per month, typical UK market, potential saving, first-year total and budget fit, with View quotation, Make this cheaper, Continue, Request a consultation and Modify requirements.
- **View quotation** (no download): the customer enters their email (name optional) to view the quotation; both join the enquiry, so they are not asked again. The quotation opens in a modal as a professional document: DotSeek letterhead, "AI-Generated Indicative Estimate" label, QUOTATION title, draft reference, date, valid until (30 days), prepared for / by, solution and stage, scope summary (and reference), itemised development costs with ranges, minimum and maximum, new customer offer, recommended estimate, running costs, budget fit, implementation plan, notes and terms. It shows the quotation status ("AI-generated draft, awaiting DotSeek review") and ends with the **Quotation Notice** (`quotationNotice` in `src/content/pricing.ts`, also in the quotation emails): quotation notice, important (not a final agreement), customer-specific quotation, third-party and agency warning, how to verify a DotSeek quote, AI and automation notice, and final confirmation (System generated estimate → DotSeek review → Customer discussion → Final scope → Approved quotation → Project agreement; no payment based on an automatic estimate). Actions: "Send to DotSeek for confirmation" and "Request a consultation". There is no download or print option (the quotation is hidden when printing). The quotation's Solution box and title name what was asked for (`lib/plan/headline.ts`), e.g. "Hybrid mobile app (iPhone first)" with "Firebase or Supabase backend", not the broad category. Every app line also has Basic, Advanced and Custom levels with app-specific descriptions (mobile app and managed backend). Mobile apps state their technology: for both platforms the chat asks **hybrid** (one Flutter or React Native codebase) or **native** (Swift and SwiftUI for iPhone, Kotlin and Jetpack Compose for Android; two apps, about two thirds more work); a single platform is native unless it is the first release of a hybrid app. For an app reference, every cheaper version stays an app: MVP is one platform first with the essential features, and **Basic** is the smallest real app (hybrid, iPhone first, sign-up and one core feature, customers only) on a **managed backend** (Firebase or Supabase, `managed_backend` in the price catalogue) instead of a custom server. The emails carry the same quotation document (`lib/plan/quotationEmail.ts`): the customer copy has a greeting above it and, below it, a "Your enquiry, and changing your quote" panel: "View or adjust my quote" (their private enquiry page, where they ask the team for a revised quotation) and "Start a fresh quote" (`/?quote=new`, which opens the DotSeek Assistant on a new enquiry). There is no customer login: the private link is their access; the team copy adds the admin link above and the brief, answers and chat below. The DotSeek mark is embedded as an inline image (`lib/emailLogo.ts`), so it shows even when email apps block remote images. Locally, `ENQUIRY_DRY_RUN=1` saves each email as HTML in `.data/outbox/` for previewing instead of sending.

**Header navigation:** Solutions (`/#solutions`) · AI Automation (`/#capabilities`) ·
AI Agents (`/#agents`) · Industries (`/#industries`) · Services (`/#process`) ·
About (`/about`) · Insights (`/insights`). **Header CTA:** "Start Automating". The mobile
menu CTA is "Talk to an AI Automation Expert".

**Footer:** a contact strip ("Have a process that should run itself?" with email and
phone), brand summary and contact details, then the columns *Solutions* (AI
Automation, AI Agents, Workflow Automation, System Integration, Custom Software),
*Company* (About, Contact, Careers, Insights), *Industries* (six) and *Legal*
(Privacy, Cookies, Terms). It ends with social links (LinkedIn, GitHub) and the copyright.

## 6. Homepage structure

| # | Section (component) | Anchor | Content |
|---|---|---|---|
| 01 | Header (`Header`) | - | Logo, 7 links, CTA, mobile menu |
| 02 | Hero (`Hero`, `HeroBackdrop`, `ActivityTicker`, `HeroAutomationVisual`) | - | Animated beam-grid banner, word-by-word headline, supporting line, CTAs "Explore AI Automation" / "Talk to Our Team", and a live automation activity ticker. The **Automation Monitor** mockup runs Lead received → AI qualification → CRM → Quote → Approval → Invoice → Follow-up next to the Operations Agent panel. |
| 03 | Integrations strip (`TrustedCompanies`) | `#integrations` | "Connect the tools your business already uses" marquee of 16 systems |
| 03b | Manifesto (`ManifestoSection`) | - | "Most businesses don't need more software. They need the systems they already have to work together intelligently…" Words light up on scroll. |
| 03a | Pocket-money band (`PocketMoneyBand`) | `#start` | After the integrations strip: "Big plans. Pocket-money start." with a growth path (Basic website → Business portal → Mobile app → AI automation) and two actions: "Get my estimate" and "Have a reference site?". No price amounts on the homepage. |
| 03c | Solutions catalogue (`SolutionsCatalogue`) | `#solutions` | "One partner, every solution": seven solution cards with Workflow Automation featured as "Our core", each with a "Start enquiry" button that opens the matching chat flow, plus an "Ask the AI consultant" card |
| 04 | Capabilities (`AutomationCapabilities`) | `#capabilities` | Bento of 6 different cards: AI Agents, Workflow Automation, Intelligent Documents, Customer Automation, System Integration, AI Insights |
| 05 | Automation workflow (`WorkflowSection`) | `#workflow` | 01 Capture · 02 Understand · 03 Decide · 04 Automate · 05 Measure, as tabs with a stage-specific UI each |
| 06 | AI Agents (`AIAgentsSection`) | `#agents` | Sales, Customer Support, Operations, Finance, HR and Knowledge agents, plus guardrails (permissions, approvals, audit, data ownership) |
| 07 | Business solutions (`BusinessSolutions`) | `#departments`, `#industries` | Sales, Customer Service, Operations, Finance and Management capability lists, plus industries |
| 08 | AI + existing systems (`IntegrationSection`) | `#systems` | "AI That Works With Your Business, Not Against It". Two system rows meet at the DotSeek automation layer, plus three principles. |
| 09 | How DotSeek works (`ProcessSection`) | `#process` | 01 Discover · 02 Analyse · 03 Design · 04 Automate · 05 Optimise |
| 10 | Outcomes (`ResultsSection`) | `#results` | Six outcome categories. **No percentages.** Results are measured against an agreed baseline. |
| 11 | Example engagement (`CaseStudy`) | `#case-study` | Problem → Automation → Outcome, labelled **"Illustrative example"** |
| 12 | FAQ (`FAQSection`) | `#faq` | Five real buyer questions (systems, safety, data, timeline, pricing) |
| 13 | Final CTA (`CTASection`) | `#contact` | "Your business already has the data. Now make it work intelligently." CTAs: "Start Your Automation Journey" (email) / "Talk to DotSeek" (phone) |
| - | Footer (`Footer`) | - | See §5 |

A scroll-scrubbed **flow line** starts on the hero grid and runs the full height of the homepage, lighting a node at each section. It visualises DotSeek's "connected flow" idea, and scrolling back up reverses it.

The FAQ and Manifesto sections are additions to the original 12-section brief. It mirrors the
reference's rhythm and answers common objections honestly.

## 7. Design direction (summary)

Premium AI-SaaS benchmarked on the CodeGen Webflow template's design language: a
graphite-black canvas with a faint grid, hairline-bordered surfaces, regular-weight
gradient headings with **signal-yellow (#ECF15E)** key phrases, genuine
product-UI mockups with a yellow corner glow and generous spacing. DotSeek adds its own
modern motion layer on top: an animated beam grid with a cursor spotlight,
word-by-word reveals, a scroll-lit manifesto, spotlight cards, scroll-linked
mockups and timelines, and an oversized footer wordmark. The site is intentionally not
a clone of the reference. See `DESIGN.md` for the full system.

## 8. Search (SEO) and privacy

**Homepage search listing**
- Title: *DotSeek | AI Business Automation Solutions UK* (45 characters)
- Description: *DotSeek builds AI agents, workflow automation and system integrations that cut repetitive work and connect your CRM, ERP and data. Talk to our UK team.* (151 characters)

**Rules**
- Every page needs its own `seoTitle` (about 50 to 60 characters, brand is appended as "| DotSeek") and `description` (about 140 to 160 characters). These live in `src/content/site.ts` for the homepage and `src/content/pages.ts` for other pages.
- Every page sets a canonical URL. Draft pages are `noindex` and stay out of the sitemap.
- Structured data: Organization and WebSite (sitewide) and FAQPage (homepage FAQ).
- The social share image is `public/og-image.png` (1200 × 630).
- **Cookies:** the site sets no cookies and uses no analytics. A cookie notice says so and stores its dismissal in local storage (`ds-cookie-notice`). If analytics are ever added, the notice must become a consent prompt that blocks those scripts until accepted, and the Cookie and Privacy policies must be updated in the same change.

## 9. Content integrity rules

- No Aizai or CodeGen wording, logos, screenshots or product concepts (content generation, SEO, code generation).
- **No fabricated customers, testimonials or statistics.** Numbers inside mockups are UI illustration only.
- The integration list shows systems DotSeek *can connect*. It is never presented as "trusted by" or a client list.
- The case study stays labelled "Illustrative example" until a real, client-approved case study is available. Testimonials may be added only with written consent and real attribution.
- Legal pages must stay factual about how the site behaves, and get professional legal review before launch.
- **Estimates are never quotes.** Every estimate is labelled "AI-Generated Indicative Estimate" with its disclaimers. Market figures are an "Indicative Market Estimate" from configurable data (scope, region, freelancer or agency), never presented as competitors' prices or guaranteed savings. The AI may share the published stage ranges but explains specific figures only from the pricing engine, and never promises discounts, prices, timelines or guarantees. Offers come only from the admin settings.

## 10. Before launch (open items)

- [ ] Confirm the LinkedIn URL (`src/content/site.ts`; it is currently an assumed URL).
- [ ] Have a solicitor review the Privacy policy, Cookie policy and Terms of use (`src/content/pages.ts`).
- [ ] Confirm the production domain (`site.url` in `src/content/site.ts`, now https://www.dotseek.co.uk).
- [ ] Verify the site in Google Search Console: build with `GOOGLE_SITE_VERIFICATION=<token>` and submit `/sitemap.xml`.
- [ ] Replace the illustrative case study with a real one when approved.
- [x] Contact backend: enquiries run through the chat, are stored and continue in the admin portal.
- [ ] Connect Upstash Redis (Vercel Marketplace, "Upstash for Redis") to the `dotseek` project so `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set. Without it, production enquiries are emailed but not saved, and private links are not issued.
- [ ] Set `ADMIN_PASSWORD` (and optionally `ADMIN_SECRET`) in Vercel to enable the `/admin` inbox.
- [ ] **Confirm the price catalogue before launch** (`src/content/pricing.ts`): item price ranges, scope multipliers, overhead shares, infrastructure monthly ranges, maintenance, market multipliers and exchange rates, and provider cost factors are DotSeek's starting assumptions. Update `pricingMeta.reviewed` and `marketMeta` whenever they change.
- [ ] Decide whether to run a new customer offer (`/admin/offers`; off by default).
- [ ] Set `ANTHROPIC_API_KEY` in production (without it the chat uses offline answers; use a workspace key, or also set `ANTHROPIC_WORKSPACE_ID`), and set a spend limit in the Anthropic Console.
- [ ] Set SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, optional `ENQUIRY_TO`/`ENQUIRY_FROM`) so chat enquiries are emailed.
- [x] Hosting: Vercel project `dotseek` in the `dotseek` team (https://dotseek-mu.vercel.app). Static-only hosting such as GitHub Pages no longer works.
- [ ] Verify `www.dotseek.co.uk` and `dotseek.co.uk` in Vercel (TXT records at `_vercel` in GoDaddy DNS), then remove them from the old Vercel account.
- [ ] Install the Vercel GitHub app on the `dotSeek-IT` organisation so pushes to `main` deploy automatically.
- [ ] For high traffic, replace the in-memory rate limiter with a shared store (the Redis connection above can be reused).

## 11. Future expansion rules

- **New service pages:** add a route under `src/app/services/[slug]` driven by a `content/services.ts` list. Reuse `SectionHeading`, `AutomationCard`, `IconCard`, `WorkflowDiagram` and `CTASection`.
- **Industry pages:** reuse the hero composition with an industry-specific `DashboardMockup` dataset. Don't fork the component; parameterise it.
- **Insights/blog:** add MDX or a CMS later, keeping the article layout on `Container size="narrow"` and the type tokens.
- **Real testimonials/logos:** add a `Testimonials` component following the reference's card wall, fed from content data that records consent.
- Every new page or section must update §5–§6 here, and `DESIGN.md` if it introduces a new pattern.
