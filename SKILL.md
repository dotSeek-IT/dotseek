---
name: dotseek-website
description: >
  Implementation rules for the DotSeek AI Business Automation website (Next.js + CSS Modules).
  Use when adding or changing pages, sections, components, copy or styles in this repository,
  or when reviewing work against the DotSeek design system.
---

# DotSeek Website: Implementation Skill

Every agent or developer working on this repository follows this file.
`dotseek.md` covers *what* we say and *why*. `DESIGN.md` covers *how it looks*.
This file covers *how to build it*.

## Mandatory workflow

1. Read `dotseek.md` for positioning, page structure and content rules.
2. Read `DESIGN.md` for tokens, layout, motion and the component catalogue.
3. Read this file.
4. Inspect existing components in `src/components/{layout,common,visual,home}`.
5. Reuse existing components wherever they fit. Extend with a prop before creating a near-duplicate.
6. Don't duplicate components unnecessarily. If two sections need the same thing, move it into `common/` or `visual/`.
7. Use the design tokens in `src/styles/tokens.css`. Don't put raw colours, radii, shadows or durations in component CSS.
8. Keep the responsive behaviour working at 1440, 1280, 1024, 768, 430, 390 and 375px.
9. Keep accessibility intact (see the checklist below).
10. Before finishing, run `npm run lint` and `npm run build` (the build also type-checks), and preview the change.
11. If you changed the design system, page structure or messaging, update `DESIGN.md`, `dotseek.md` and this file in the same change.

## Stack

- **Next.js 15 App Router in server mode** (`next build` + `next start`; marketing pages are pre-rendered; `/api/*` and the `(portal)` pages run on the server), **React 19**, **TypeScript 5** (strict).
- **Styling:** CSS Modules per component, plus `src/app/globals.css` (reset, utilities, reveal, keyframes) and `src/styles/tokens.css`.
- **Fonts:** `next/font/google` for Ubuntu and Ubuntu Mono, exposed as `--font-ubuntu` / `--font-ubuntu-mono`.
- **No UI or animation libraries.** Icons are inline SVG in `common/Icon.tsx`. Motion is CSS plus IntersectionObserver.
- Scripts: `npm run dev` (port from `.claude/launch.json`: 3100), `npm run build`, `npm run lint`, `npm run typecheck`, `npm start` (`next start`). Copy `.env.example` to `.env.local` for the settings below.
- **Environment:** `ANTHROPIC_API_KEY` (AI chat, recommendation, brief) and optional `ANTHROPIC_WORKSPACE_ID` (only for keys not created inside a workspace); `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `ENQUIRY_TO`, `ENQUIRY_FROM` (email); `KV_REST_API_URL` + `KV_REST_API_TOKEN` or `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (enquiry storage); `ADMIN_PASSWORD` and optional `ADMIN_SECRET` (team inbox); optional `SITE_URL` (origin used in emailed links, e.g. `http://localhost:3100` locally); `ENQUIRY_DRY_RUN=1` (log emails instead of sending). Never commit real values.

## Folder architecture

```
src/
  app/
    layout.tsx          # fonts, metadata, motion flag script (no chrome)
    (site)/             # marketing pages, wrapped in SiteChrome
      layout.tsx        #   Header, Footer, CookieNotice, DotSeekAssistant, skip link
      page.tsx          #   homepage = ordered list of home sections
      [slug]/page.tsx   #   secondary pages from content/pages.ts (SSG)
      contact/page.tsx
    (portal)/           # private pages: minimal top bar, noindex, no assistant
      layout.tsx
      actions.ts        #   server actions: login/logout, team reply, status, customer reply
      admin/            #   inbox, login, enquiries/[id], offers
      enquiry/[token]/  #   customer's private enquiry page
    api/
      assistant/route.ts          # streams the AI consultant (start_enquiry tool)
      enquiry/route.ts            # validates, stores and emails a submitted enquiry
      enquiry/recommend/route.ts  # AI solution recommendation for "Not sure yet"
      enquiry/summary/route.ts    # AI project brief for the review step
    not-found.tsx       # wrapped in SiteChrome
    globals.css
  styles/tokens.css     # ALL design tokens
  content/
    site.ts             # nav, footer columns, company details, CTAs
    home.ts             # every homepage string and data list
    pages.ts            # about / insights / careers / legal pages
    solutions.ts        # solutions catalogue (ids, titles, labels, examples)
    enquiryFlows.ts     # dynamic enquiry engine: router, per-solution flows, scale & ops steps, shared tail
    pricing.ts          # price catalogue: items (£ ranges), scopes, stages, tiers, providers, markets, packages
    assistant.ts        # offline answers and chips
  lib/
    assistant/          # systemPrompt, consultant (recommend + brief), http helpers
    enquiries/store.ts  # Redis or local-file enquiry store (server-only)
    admin/auth.ts       # password check + signed session cookie
    mail.ts             # SMTP sending, email HTML, siteOrigin
    offers/store.ts     # admin-controlled new-customer offer (settings store)
    plan/               # pure plan engine, shared by browser and server:
                        #   signals (requirement profile), requirements (answers -> services),
                        #   build (levels, costs, reasons, advice, packages, phases, diagram),
                        #   format (money), report (printable/email quotation)
  components/
    layout/   Container, Section, Header, Footer, SiteChrome, CookieNotice
    common/   Button, Badge, SectionHeading, GradientText, LogoCloud, IconCard, Icon, Logo,
              Reveal, SpotlightGroup
    visual/   MockWindow, DashboardMockup, AutomationCard, CapabilityVisuals,
              WorkflowDiagram, AgentCard, IntegrationNode, HeroBackdrop, ScrollFlowLine
    assistant/ DotSeekAssistant, useEnquiry, EnquiryControls, EnquiryReview,
               StartEnquiryButton
    portal/   EnquiryView (StatusPill, EnquiryDetails + plan snapshot, Thread), SubmitButton, Portal.module.css
    plan/     PlanDialog (estimate + architecture builder), PlanCard, ArchitectureDiagram, Plan.module.css
    home/     Hero, ActivityTicker, HeroAutomationVisual, TrustedCompanies, ManifestoSection,
              PocketMoneyBand, SolutionsCatalogue, AutomationCapabilities, WorkflowSection, AIAgentsSection,
              BusinessSolutions, IntegrationSection, ProcessSection, ResultsSection,
              CaseStudy, FAQSection, CTASection
```

## Coding rules

- **Content lives in `src/content/`.** Components are presentational. Don't hardcode marketing copy inside a component, except heading strings that need inline `<GradientText>` markup.
- **Server components by default.** Add `"use client"` only for interactivity (`Header`, `WorkflowSection`, `Reveal`, `HeroBackdrop`, `ManifestoSection`, `SpotlightGroup`, `ScrollFlowLine`, `CookieNotice`, `DotSeekAssistant` and its enquiry parts, `StartEnquiryButton`, portal `SubmitButton` and `LoginForm`).
- **SSR-safe randomness.** Anything "random" rendered on the server (e.g. particles) must be deterministic and serialised as rounded strings, or hydration will mismatch.
- One component per file, named export, and a matching `Name.module.css` next to it.
- Join class names with `[a, b && c].filter(Boolean).join(" ")`. No classnames library.
- Use the `@/*` path alias for imports.
- Every CTA uses `<Button>`. With `href` it renders a `Link` (internal routes) or `<a>` (anchors, `mailto:`, `tel:`); without `href` it renders a `<button>` for in-page actions. Never hand-build buttons from `Button.module.css` classes. In each button group, make the main action `primary` and the alternatives `secondary`.
- Home anchors in navigation use `/#id` so they work from secondary pages.
- New icons go in `Icon.tsx`'s `paths` map: 24px grid, stroke-based, `currentColor`.

## Reusable patterns

| Need | Use |
|---|---|
| A new homepage section | `<Section id tone labelledBy>` + `<SectionHeading id eyebrow title body>` |
| Heading with highlighted phrase | `title={<>Lead Text <GradientText>Key Phrase</GradientText></>}` |
| Split header (title left, copy right) | Copy the pattern in `AIAgentsSection` / `IntegrationSection` |
| Product UI illustration | Wrap it in `<MockWindow title toolbar>`. Put status in `<Badge variant="status">`. |
| Visual card with glow well | `<AutomationCard title body visual layout>` |
| Simple feature/outcome grid | `<IconCard icon meta title body>` inside a 3-col grid |
| Scrolling systems strip | `<LogoCloud items label variant reverse speed>` |
| Scroll entrance | `<Reveal index={i % 3} variant>`. Use `as="li"` inside lists. |
| Background grid | `className="bg-grid"` plus a radial `mask-image`. For the animated version use `<HeroBackdrop />` inside a `position: relative; overflow: hidden` section. |
| Cursor-following card border | Add `ds-spotlight` to the card and wrap the grid in `<SpotlightGroup as="ul">`. Don't put `overflow: hidden` on the card itself. |
| Scroll-scrubbed page line | `ScrollFlowLine` is the first child of the `position: relative` wrapper in `app/(site)/page.tsx`. New homepage sections must be direct `<section>` children of that wrapper with an `h2` so they get a node. |
| Mobile carousel | Copy `AIAgentsSection`'s `ul.grid` mobile rule (flex + scroll-snap + negative gutter margin). Use `ul.x` selectors to beat the global `ul[role="list"]` reset. |
| Scroll-linked motion | CSS `animation-timeline: view()` inside `@supports`, with a static fallback and `animation: none` under reduced motion |
| Word-by-word headline | The `Words` helper in `Hero.tsx`. Keep the real text in the h1's `aria-label`. |
| Secondary page | Add an entry to `content/pages.ts` with `seoTitle`, `description`, optional `updated`, and `sections` (`heading`, `body[]`, `list[]`). Use `status: "draft"` until copy is approved. |
| Assistant (AI) | Live answers come from Claude via `app/api/assistant/route.ts`; the system prompt is built from site content in `lib/assistant/systemPrompt.ts`, so updating `content/*` updates what the assistant knows. Don't put dates or other changing values in the system prompt (it is prompt-cached). |
| Assistant (offline) | `content/assistant.ts` intents power the quick-reply chips and the fallback answers when the API is unavailable. Answers may only restate what the site already says. Add a label to `intentLabels` for any intent used as a chip. |
| New solution | Add it to `content/solutions.ts` (`SolutionId`, catalogue entry), add its flow to `content/enquiryFlows.ts`, and the card, chat router, consultant prompt and tool enum all pick it up. |
| Enquiry questions | Steps live in `content/enquiryFlows.ts`: `kind` (`choice`, `multi`, `text`, `longtext`, `email`, `tel`), `other: true` adds an "Other" text field, `optional: true` adds Skip, `when(answers)` shows a step only when relevant (use `includes(answer, option)` for multi answers). Step ids must be unique across flows. `validateAnswers` re-checks every visible step on the server, so never trust the client. |
| Start an enquiry | From any page: `<StartEnquiryButton solution="website">` or dispatch `START_ENQUIRY_EVENT` with `detail: { solution }` (`"consult"` opens the chat as the consultant). The AI starts one by calling the `start_enquiry` tool. |
| Chat stream protocol | `/api/assistant` streams plain text. `\u0000` means "replace the text so far" (refusal), `\u0001` + JSON is a control frame (`{ type: "start_enquiry", solution, reason }`). Validate tool input with zod before emitting a frame. |
| Pricing and estimates | All figures come from the price catalogue in `content/pricing.ts` (each `PlanItem.price` is a £ min–max at Basic scope; `days` is only for the timeline) through `lib/plan/build.ts` (`buildPlan(answers, choices)` returns `estimate.min/recommended/max`, `stage`, phases with budget fit, markets with freelancer and agency ranges). Stages live in `stages`; keep them in step with the AI system prompt. Never show price amounts on the homepage (no "£100" or "from £X"); prices appear only in the estimate. Never hard-code a price in a component, prompt or copy, and never let the AI produce numbers: it receives the calculated plan as context and only explains it and gives advice (`advice.item` must be a catalogue id). The server always recalculates the plan from answers plus `sanitizeChoices(choices)`. Update `pricingMeta.reviewed` whenever figures change. |
| New feature or infrastructure service | Add a `PlanItem` to `content/pricing.ts` (group, days, monthly range or per-tier ranges, `usage`, `impact`, optional `diagram` node, `onlyFor`). Map answers to it in `lib/plan/requirements.ts`, add a reason in `reasonFor` (`lib/plan/build.ts`) if it is infrastructure, and add it to a tier's `infra` list if a level should include it. The quotation, toggles, diagram, report and portal pick it up automatically. |
| Offers and negotiation | The new-customer offer is admin data (`lib/offers/store.ts`, `/admin/offers`, `GET /api/offer`); `lib/plan/offer.ts` (`offerFor`) is the only place that turns it into a price, and `/api/enquiry` re-checks it and first-time eligibility (`hasPreviousEnquiry`). Never hard-code a discount. Preferred budgets (`negotiation`) are stored and shown to the team, never promised to the customer. |
| Reference URLs | Fetch only through `lib/reference/fetch.ts` (public IPs, http(s), standard ports, redirects re-checked, time and size limits); never fetch user URLs any other way. `lib/reference/analyse.ts` turns HTML (or an App Store / Google Play listing) into signals; the AI refines them (`analyseReferenceWithAI`) and must never suggest copying. `lib/plan/reference.ts` maps the analysis to answers (`referenceAnswers`), options (`costOptions`), drivers (`costDrivers`, `setDriverState`) and budget matching; light types live in `lib/plan/referenceFeatures.ts` (also `sanitizeReference` for the server). Keep `isCoreItem` items (for example the app in a mobile-only project) in every version except Basic, and never let cheaper versions drop security, accessibility, responsiveness, data protection or reliability. |
| Enquiry modal | Links to `/enquiry/…` in chat messages open `EnquiryModal` (frame of the portal page). The portal layout marks itself `data-embedded` inside a frame (hides the top bar, forwards Esc via `postMessage`). Keep the site-wide `frame-ancestors 'self'` header; never allow other origins to frame portal pages. |
| Customisation | Only `LOCKED` items (discovery, hosting, encryption) can't be switched off; the solution's main item is optional but planned in Phase 1 (`coreFor`). Scope levels live in `pricing.ts` (`scopeLevels`, `itemScopes` for specific items, group defaults via `scopesFor`). Choices carry `scopes`; use `setScope` and keep `sanitizeChoices` validating them. Default scopes come from `defaultScopes` in `lib/plan/requirements.ts`. |
| Price slider | `fitToBudget(answers, choices, target)` in `lib/plan/build.ts` returns new choices plus a readable change list. Cheaper moves (`cheaperMoves`) and richer moves (`richerMoves`) are ranked; keep the order: lower levels, then later phases, then architecture going down; recommended architecture, recommended services, feature levels, infrastructure Advanced, feature Custom going up. Never add unrelated features, never push infrastructure to Custom, and don't reverse a cut in the fill-up pass. `plan.priceRange` and `plan.recommendedPrice` drive the slider; `choices.target` is sanitised and stored. |
| Architecture rules | `recommendLevel` scores the requirement signals; keep the guards (Enterprise only for large or critical multi-region or fast-growth systems; customer accounts, payments or orders at least Level 2). Recommend the right architecture, not the most expensive: every "not needed" service needs an honest reason. Test changes with a script that calls `buildPlan` for small, medium and large scenarios. |
| Scale questions | `opsSteps` in `content/enquiryFlows.ts` ask business questions only (users, team, regions, files, live updates, availability, security, growth); never ask customers to pick technologies. `lib/plan/signals.ts` reads them. |
| Enquiry state | `assistant/useEnquiry.ts` is the client state machine (asking, recommending, choosing, plan, then contact questions, review, sending, failed). Plan choices (tier, provider, items on/off) live in `state.choices`; the plan engine is loaded with `import()` when an enquiry starts, and `PlanDialog` and the report load on first use, so the homepage stays light. Enquiry messages are tagged `kind: "enquiry"` and never sent to `/api/assistant`. |
| Portal pages | Server components in `app/(portal)` with server actions in `actions.ts`. Check `isAdmin()` in every admin page and action. Customer actions are authorised only by the private token. Wrap each page in `PortalFrame` (customer page, sign-in) or `AdminFrame` (signed-in admin) from `components/portal/Chrome.tsx`. Style shared cards, forms and threads with `components/portal/Portal.module.css` and admin layout (top bar, sign-in, inbox, pager, offers) with `components/portal/Admin.module.css`; submit with `<SubmitButton>` (a `Button type="submit"` with pending text, `variant` and `size`). The inbox paginates 10 per page via `?page=`, alongside `?status=` and `?q=`. |
| Nav active state | `layout/useActiveNav.ts`. To make a new homepage section highlight a nav item, add its id to `SPY_TARGETS` in page order (use `href: null` for sections without a nav item). Nav links use `next/link` for client-side routing. Don't give in-page targets a big `scroll-margin-top`: it adds to the global `scroll-padding-top`. |
| Search metadata | Sitewide defaults and structured data live in `app/layout.tsx`. Sitemap and robots are in `app/sitemap.ts` and `app/robots.ts` (`dynamic = "force-static"` for export). |

## Visual rules (summary of DESIGN.md)

- Graphite canvas, hairline borders, 8–10px radii, signal-yellow accents.
- Headings are weight 400 with the white→grey gradient. The key phrase is yellow.
- At most one solid yellow primary button per cluster. The secondary is a white outline.
- Mockups must show real automation moments (leads, CRM, quotes, approvals, invoices, documents, agents, metrics).
- Yellow corner glow sits *behind* mockups only. Don't add other neon effects.

## Accessibility checklist

- [ ] One `h1` per page. Section `h2` ids are wired to `aria-labelledby`.
- [ ] Interactive elements are keyboard reachable with a visible `:focus-visible` ring.
- [ ] Decorative visuals are `aria-hidden`. Meaningful ones have text alternatives.
- [ ] Custom widgets follow the ARIA pattern (tabs: roving tabindex, arrows, Home/End).
- [ ] The mobile menu traps focus, closes on Esc and restores focus.
- [ ] Contrast is ≥ 4.5:1 for body text.
- [ ] Content is visible with JS disabled and under `prefers-reduced-motion`.

## Performance rules

- Prefer CSS/SVG mockups over images. If you add images, use AVIF/WebP, set explicit sizes, and use `loading="lazy"` below the fold.
- Don't add large dependencies for small effects. Check First Load JS in the build output (it is about 141 kB on the homepage today; heavy enquiry code such as the plan engine and dialog is loaded on demand).
- Keep client components small. Pass data down rather than importing large content modules into client code unnecessarily.
- Animate only `transform`, `opacity` and `filter` (and `background-position` for gradients). Use one scroll/pointer listener per component, throttled with `requestAnimationFrame`.
- Test scroll effects with `window.scrollTo({ top, behavior: "instant" })`. The site sets `scroll-behavior: smooth`, so plain `scrollTo` animates.
- **AI assistant rules:** the API key stays server-side (never `NEXT_PUBLIC_`). Keep the routes' input limits, origin check and rate limits (shared helpers in `lib/assistant/http.ts`). Handle `stop_reason: "refusal"` before using output. The model is `claude-opus-5-5` with `fallbacks: "default"`. Tools use `eager_input_streaming` and `tool_choice: auto` (forced tool choice is not supported on this model). Structured outputs (recommendation, brief) use `messages.parse` with zod schemas; if they fail, the enquiry continues without them. The UI says "powered by DotSeek"; the Privacy policy must keep naming Anthropic as the AI provider.
- **Estimates:** keep the "AI-Generated Indicative Estimate" label and the three disclaimers (`pricingMeta`) on every estimate surface (chat card, dialog, report, emails, portal). Market figures are estimated ranges, savings compare with the UK range only, and final quotations are confirmed by the team.
- **Flicker-free chat:** remount per-step controls with a `key` instead of resetting state in effects; scroll the log in `useLayoutEffect`; use `focus({ preventScroll: true })`; keep mobile inputs at 16px or larger.
- Test the assistant without a real key by pointing `ANTHROPIC_BASE_URL` at a local mock, and test enquiries with `ENQUIRY_DRY_RUN=1`. Without Redis variables, local enquiries are saved to `.data/enquiries.json` (git-ignored); on Vercel they need Redis.
- Don't run `next build` while `next dev` is running; they share `.next`. If the dev server breaks, delete `.next` and restart.

## Content rules (hard)

- No em dash (—) in any content, mockup text, metadata or code comments. Use a comma, colon, full stop or "|" instead. Check with `grep -rn "—" src` before finishing.
- No Aizai/CodeGen wording, logos or screenshots.
- No fabricated customer names, testimonials, logos-as-clients or statistics. Mockup data is clearly UI illustration.
- The case study stays labelled **"Illustrative example"** until a real, client-approved study replaces it.
- Integration names are systems DotSeek *can connect*, never "trusted by".
- Legal pages must describe how the site actually behaves (today: no visitor cookies, the team-only `ds_admin` cookie, AI used for chat, recommendations and briefs, sent enquiries stored). If you add cookies, analytics, forms, storage or third-party embeds, update `/privacy` and `/cookies` and turn `CookieNotice` into a consent prompt in the same change.
- Every new page needs a `seoTitle` and `description` (see `dotseek.md` §8). Draft pages are automatically `noindex` and left out of the sitemap.

## Definition of done

1. `npm run lint` passes with zero warnings.
2. `npm run build` succeeds (type-check, lint and pre-render).
3. Previewed at desktop, tablet (768) and mobile (390) with no horizontal page scroll.
4. No console errors from app code.
5. Reduced-motion and keyboard paths checked for anything interactive.
6. `DESIGN.md`, `SKILL.md` and `dotseek.md` still describe the implementation.
