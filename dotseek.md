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
| **Contact** | seekingsupport@dotseek.co.uk · +44 20 4625 3317 |
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
| `/` | `src/app/page.tsx` + `src/content/home.ts` | Live |
| `/contact` | `src/app/contact/page.tsx` + `src/content/contact.ts` | Published: email, phone, location, enquiry email template, "What happens next" |
| `/about` | `src/content/pages.ts` | Published |
| `/careers` | `src/content/pages.ts` | Published |
| `/insights` | `src/content/pages.ts` | Draft placeholder, `noindex` (blog to come) |
| `/privacy` | `src/content/pages.ts` | Published (UK GDPR privacy policy) |
| `/cookies` | `src/content/pages.ts` | Published (PECR cookie policy: no cookies set) |
| `/terms` | `src/content/pages.ts` | Published (website terms of use, law of England and Wales) |
| `/sitemap.xml`, `/robots.txt` | `src/app/sitemap.ts`, `src/app/robots.ts` | Generated at build. Only published pages are listed. |

The site runs on Next.js in server mode (`next start`; deploy to Vercel or any Node host). Pages are pre-rendered; the server only runs `/api/assistant` (AI chat) and `/api/enquiry` (chat enquiries by email). It sets no cookies.

**Contact routing:** every "talk to us" CTA (header, mobile menu, hero secondary, FAQ, footer "Contact") goes to `/contact`. The homepage's final CTA section keeps the `#contact` anchor.

**DotSeek Assistant:** a floating AI chat (bottom-right on every page), labelled "powered by DotSeek".
- **AI answers:** questions go to `/api/assistant`, which streams replies from Claude (`claude-opus-5-5`, low effort, server-side refusal fallback). The system prompt is built from the website's own content and tells the assistant never to invent prices, timelines, clients or results.
- **Offline fallback:** if the API isn't configured or fails, the chat answers from `src/content/assistant.ts` by keyword, and the label switches to "Automated answers".
- **Guided enquiry:** "Start an enquiry" (chat chip, or "Start in chat" on `/contact`) asks step by step: area, systems (multi-select), organisation size, timeline, details, name, company, email and phone. Option questions show buttons, "Other" opens a text field in the chat, and optional questions can be skipped. There's a review step with consent before sending. Answers are emailed to the team through `/api/enquiry` (Reply-To: the visitor) and are never sent to the AI. If email fails, the visitor can send the same summary from their email app.
- **Safeguards:** input limits, a same-origin check and per-IP rate limits (20 chat messages per 10 minutes, 5 enquiries per hour).
- **Data:** no conversation storage, cookies or local storage. The Privacy and Cookie policies describe the AI provider (Anthropic) and the enquiry emails.

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
| 04 | Capabilities (`AutomationCapabilities`) | `#capabilities` | Bento of 6 different cards: AI Agents, Workflow Automation, Intelligent Documents, Customer Automation, System Integration, AI Insights |
| 05 | Automation workflow (`WorkflowSection`) | `#workflow` | 01 Capture · 02 Understand · 03 Decide · 04 Automate · 05 Measure, as tabs with a stage-specific UI each |
| 06 | AI Agents (`AIAgentsSection`) | `#agents` | Sales, Customer Support, Operations, Finance, HR and Knowledge agents, plus guardrails (permissions, approvals, audit, data ownership) |
| 07 | Business solutions (`BusinessSolutions`) | `#solutions`, `#industries` | Sales, Customer Service, Operations, Finance and Management capability lists, plus industries |
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

## 10. Before launch (open items)

- [ ] Confirm the LinkedIn URL (`src/content/site.ts`; it is currently an assumed URL).
- [ ] Have a solicitor review the Privacy policy, Cookie policy and Terms of use (`src/content/pages.ts`).
- [ ] Confirm the production domain (`site.url` in `src/content/site.ts`, now https://www.dotseek.co.uk).
- [ ] Verify the site in Google Search Console: build with `GOOGLE_SITE_VERIFICATION=<token>` and submit `/sitemap.xml`.
- [ ] Replace the illustrative case study with a real one when approved.
- [ ] Decide on a contact form/backend. CTAs currently use `mailto:` / `tel:` via `/contact`.
- [ ] Set `ANTHROPIC_API_KEY` in production (without it the chat uses offline answers), and set a spend limit in the Anthropic Console.
- [ ] Set SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, optional `ENQUIRY_TO`/`ENQUIRY_FROM`) so chat enquiries are emailed.
- [x] Hosting: Vercel project `dotseek` in the `dotseek` team (https://dotseek-mu.vercel.app). Static-only hosting such as GitHub Pages no longer works.
- [ ] Verify `www.dotseek.co.uk` and `dotseek.co.uk` in Vercel (TXT records at `_vercel` in GoDaddy DNS), then remove them from the old Vercel account.
- [ ] Install the Vercel GitHub app on the `dotSeek-IT` organisation so pushes to `main` deploy automatically.
- [ ] For high traffic, replace the in-memory rate limiter with a shared store.

## 11. Future expansion rules

- **New service pages:** add a route under `src/app/services/[slug]` driven by a `content/services.ts` list. Reuse `SectionHeading`, `AutomationCard`, `IconCard`, `WorkflowDiagram` and `CTASection`.
- **Industry pages:** reuse the hero composition with an industry-specific `DashboardMockup` dataset. Don't fork the component; parameterise it.
- **Insights/blog:** add MDX or a CMS later, keeping the article layout on `Container size="narrow"` and the type tokens.
- **Real testimonials/logos:** add a `Testimonials` component following the reference's card wall, fed from content data that records consent.
- Every new page or section must update §5–§6 here, and `DESIGN.md` if it introduces a new pattern.
