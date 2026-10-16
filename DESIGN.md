# DotSeek: Design System

> The design-system specification for dotseek.co.uk. It describes what is
> implemented. Tokens live in `src/styles/tokens.css`, which is the source of
> truth. If you change a token, update this file in the same change.

## Overview

**Product:** DotSeek, an AI Business Automation Solutions company
**Surface type:** Marketing website (Next.js, pre-rendered pages + server API routes)
**Audience:** SME owners, operations/finance/sales leaders and enterprise decision-makers
**Visual benchmark:** CodeGen Webflow template, https://codiegen-template.webflow.io/home/home-1.
We follow its *design language* (composition, type scale, surfaces, rhythm and
motion). We don't use its branding, copy, logos or screenshots.

### Visual direction

- Premium, futuristic AI SaaS. Minimal and engineered, never a generic corporate template.
- **Graphite-black canvas** with a faint hairline grid, hairline-bordered surfaces and **signal-yellow** highlights. The yellow also links to DotSeek's original logo colour.
- **Headings are regular weight (400)** with a white→grey gradient fill. The key phrase of a heading takes the yellow gradient.
- Large visual storytelling through **genuine product-UI mockups** (automation monitor, agent panel, rules, extraction, insights). We never use decorative blobs or robots.
- Layered depth comes from mockup windows, floating context cards, and a **yellow corner glow** behind mockups (the reference's signature accent).
- **DotSeek's own modern layer on top of the benchmark.** We don't clone the reference. We add an animated beam grid with a cursor spotlight, a word-by-word headline reveal, a live activity ticker, a scroll-lit manifesto, cursor-following card borders, scroll-linked mockup and timeline motion, and an oversized footer wordmark.
- Generous spacing, smooth but restrained motion, and no neon overload.
- **The consultant experience is a product UI too.** The solution plan (estimate, architecture builder, comparisons) uses the same tokens: dark surfaces, hairline borders, yellow only for the estimate figure, the selected option, "Recommended" and primary actions. Costs use tabular numbers and en-dash ranges (`£110–£540/month`). Every estimate view shows the "AI-Generated Indicative Estimate" pill.

### Principles

- **Token-driven.** Every colour, radius, shadow, duration and spacing value comes from `tokens.css`.
- **Reuse before inventing.** Check `src/components/common` and `src/components/visual` first.
- **Honest content.** No fabricated clients, testimonials or statistics (see `dotseek.md`).
- **Accessible by default.** WCAG 2.2 AA is the baseline.

---

## 1. Colour system

All colours are CSS custom properties prefixed `--ds-color-*`.

| Token | Value | Role |
|---|---|---|
| `--ds-color-page` | `#0b0c10` | Page canvas |
| `--ds-color-bg-primary` | `#0b0c10` | Default section background |
| `--ds-color-bg-secondary` | `#111315` | Raised band (`<Section tone="raised">`) |
| `--ds-color-surface` | `#141617` | Cards, panels, mockup chrome |
| `--ds-color-surface-elevated` | `#1b1d20` | Hovered cards, chips, icon tiles |
| `--ds-color-surface-sunken` | `#0f1012` | Mockup canvas, code wells, inner wells |
| `--ds-color-text` | `#ffffff` | Primary text, heading gradient start |
| `--ds-color-text-heading-end` | `#a2a2a2` | Heading gradient end |
| `--ds-color-text-muted` | `#a3a3a3` | Body copy (≈7:1 on surface) |
| `--ds-color-text-subtle` | `#7d7f84` | Captions and meta (≥4.5:1 on page) |
| `--ds-color-doc-*` | `#ffffff` bg, `#0b0c10` ink, `#16181c` text, `#4b4f56` muted, `#6b6f76` subtle, `#9a9ea5` faint, lines `#e6e7e9`/`#eeeff1`/`#d9dadd`, tints `#f6f7f2`/`#fbfbf8`, accent ink `#6d7210`, band text `#c9cbcf` | The light quotation document (`QuotationView`) only |
| `--ds-color-text-on-brand` | `#0b0c10` | Text on yellow |
| `--ds-color-border` | `#1f2123` | Default hairline |
| `--ds-color-border-strong` | `#2c2f33` | Emphasised hairline, dashed connectors |
| `--ds-color-border-bright` | `rgba(255,255,255,.72)` | Secondary button outline |
| `--ds-color-brand` | `#ecf15e` | **Primary brand**: buttons, highlights, active states |
| `--ds-color-brand-soft` | `#f2f5a8` | Secondary accent: eyebrow text, code strings |
| `--ds-color-brand-strong` | `#f4f87a` | Primary hover |
| `--ds-color-gradient-start / -mid / -end` | `#ecf15e` / `#f0f383` / `#f2f5a8` | Highlight gradient stops |
| `--ds-color-success` | `#5fd69b` | Completed and connected states |
| `--ds-color-warning` | `#f5a524` | Processing and attention states |
| `--ds-color-info` | `#8fa8ff` | Code keys in mockups only |
| `--ds-color-hover` | `rgba(236,241,94,.08)` | Hover wash |
| `--ds-color-glow` | `rgba(236,241,94,.32)` | Glow colour |
| `--ds-color-focus` | `#ecf15e` | Focus ring |
| `--ds-color-paper*`, `--ds-color-chart-neutral` | - | Illustration-only (document scan, chart series) |

**Gradients**

| Token | Use |
|---|---|
| `--ds-gradient-heading` | White→grey fill on every h1/h2 (`background-clip: text`) |
| `--ds-gradient-highlight` | Yellow fill on the key phrase (`<GradientText>`) |
| `--ds-gradient-corner-glow` | Yellow radial from the top-left corner, behind mockups |
| `--ds-gradient-hero-glow` | Hero ambient glow (bottom-left yellow) |
| `--ds-grid-line` | Hairline grid colour (`.bg-grid` utility) |

Rules: yellow is an *accent*, never a section background. Use at most one solid
yellow button per view cluster. Status colours appear only inside product-UI mockups.

## 2. Typography

**Families:** Ubuntu (300/400/500/700) for UI and headings, and Ubuntu Mono for code,
numbers in markers, and run IDs. Both are self-hosted via `next/font/google`
(`--font-ubuntu`, `--font-ubuntu-mono`).

| Token | Size (clamp) | Weight | Usage |
|---|---|---|---|
| `--ds-text-display-xl` | 38 → 68px | 400 | Hero h1 |
| `--ds-text-display-lg` | 34 → 56px | 400 | Final CTA heading |
| `--ds-text-h1` | 32 → 52px | 400 | Secondary-page h1 |
| `--ds-text-h2` | 28 → 48px | 400 | Section headings |
| `--ds-text-h3` | 22 → 28px | 400 | Panel titles, process steps, case-study columns |
| `--ds-text-h4` | 18 → 20px | 500 | Card titles, footer contact strip |
| `--ds-text-body-lg` | 17 → 18px | 400 | Hero and CTA supporting copy |
| `--ds-text-body` | 16px | 400 | Default body, section intros |
| `--ds-text-body-sm` | 14px | 400 | Card body, lists, footer links |
| `--ds-text-label` | 13px | 400–500 | Chips, tags, stage labels |
| `--ds-text-caption` | 12px | 400 | Mockup UI, meta |
| `--ds-text-micro` | 11px | 400–500 | Mockup UI only (never marketing copy) |
| `--ds-text-button` | 15px | 500 | Buttons |
| `--ds-text-nav` | 14px | 400 | Header navigation |

Line-height: display 1.14, heading 1.2, body 1.6. Tracking: display −0.025em,
heading −0.015em, uppercase labels +0.06em. Use Title Case for section headings
(as in the reference) and sentence case for body, cards and UI. Headings use
`text-wrap: balance`.

## 3. Layout

| Token | Value |
|---|---|
| `--ds-container-max` | 1280px content width |
| `--ds-container-narrow` | 880px (FAQ, secondary pages) |
| `--ds-gutter` | 20px mobile, 32px from 768px, 60px from 1200px |
| `--ds-section-space` | 72 → 112px vertical section padding |
| `--ds-section-space-sm` | 48 → 80px (integration strip, hero bottom) |
| `--ds-hero-text-max` | 920px |
| `--ds-heading-max` | 780px |
| `--ds-text-max` | 640px paragraph measure |
| `--ds-header-height` | 72px |
| `--ds-grid-size` | 64px background grid cell |

**Grids**

- **Capabilities bento:** 12 columns. Row 1 is 7 + 5, row 2 is 4 + 4 + 4, row 3 is 12 (split card). Tablet is 12 / 6+6 / 12; mobile is a single column.
- **Card grids** (agents, results): 3 columns, then 2 at ≤1023px, then 1 at ≤639px.
- **Solutions:** 6 columns, laid out as 2+2+2 then 3+3. Tablet is 3+3 with the last card full width; mobile is a single column.
- **Split headers** (agents, systems): title left, copy right, stacked at ≤1023px.
- **Workflow:** tab list (0.85fr) beside a sticky panel (1.15fr). At ≤959px it becomes a horizontal number rail above the panel.
- **Process:** 5 columns with a dashed connector. At ≤1023px it becomes a vertical timeline.

- **Tablet (768 to 1023px):** the bento grid is 12 / 6+6 / 6+6 / 12, and the full header nav returns from 1024px. Hero floating cards only show from 1280px so they never cover the mockup. Mockup vignettes use **container queries** on their card (`.visual { container-type: inline-size }`), so narrow cards drop the document paper and the third KPI at any viewport.
- **Mobile (≤639px) recompositions:** the agents grid becomes a swipeable scroll-snap carousel (84% cards, "Swipe to explore" hint); outcome cards put the icon beside the text; the case-study flow becomes a vertical chain; mockup wells tighten; the Insights KPIs drop to 2; and the document illustration hides.

Breakpoints verified: 1440, 1280, 1024, 768, 430, 390 and 375px. Mobile layouts
are recomposed, not shrunk. For example, mockup sidebars and the agent fields hide,
and tabs become a rail.

## 4. Border radius

| Token | Value | Use |
|---|---|---|
| `--ds-radius-badge` | 6px | Tags, chips, eyebrow, small icon tiles |
| `--ds-radius-button` | 8px | Buttons, FAQ rows, inputs, icon tiles |
| `--ds-radius-card` | 10px | Cards, wells, footer strip |
| `--ds-radius-image` | 10px | Images |
| `--ds-radius-mockup` | 12px | `MockWindow` frames |
| `--ds-radius-panel` | 16px | Large panels (case study, workflow well) |
| `--ds-radius-pill` | 999px | Status pills, industry chips, automation-layer pill |

## 5. Shadows and glow

| Token | Use |
|---|---|
| `--ds-shadow-card` | Resting card depth (subtle) |
| `--ds-shadow-float` | Mockup windows, floating cards, scrolled header |
| `--ds-shadow-hover` | Card hover lift |
| `--ds-shadow-inner` | 1px inner highlight for active rows |
| `--ds-glow-ai` | Yellow ring + glow on active markers and the AI core |
| `--ds-glow-gradient` | Soft yellow under-glow for primary button hover and the automation layer |

Glow is reserved for the *one* focal element in a component. Never stack glows.

## 6. Motion

Tokens: `--ds-ease-out` (cubic-bezier(.22,1,.36,1)), `--ds-ease-in-out`,
durations `fast 160ms`, `base 240ms`, `slow 600ms`, `reveal 900ms`, and `--ds-stagger 80ms`.

| Pattern | Implementation |
|---|---|
| Banner pattern (`HeroBackdrop`) | A 64px hairline grid fades in. **Light beams** travel along grid lines (7 beams, horizontal and vertical, 6–9s, staggered). **Grid cells** pulse yellow (7s). A **particle field** twinkles in the bottom-left. A **pointer spotlight** reveals a brighter yellow grid within 260px of the cursor (mouse only). A vignette fades edges to the page. Beams and cells are hidden under reduced motion. |
| Hero reveal | Badge fades up. The **h1 reveals word by word** (blur 10px → 0, 70ms per word), and the highlight phrase then shimmers slowly. Body → CTAs → ticker follow with a blur-up (650/800/1000ms). |
| Activity ticker | `ActivityTicker`: a pill marquee of example automation events (48s loop). Pauses on hover and stops under reduced motion. |
| Mockup scroll tilt | The hero `.frame` starts at `rotateX(22deg) scale(.9)` and flattens as it scrolls in (CSS `animation-timeline: view()`; static where unsupported). |
| Manifesto scroll text | `ManifestoSection`: words go from 14% to 100% opacity as the section scrolls (one rAF scroll listener writes `--p`). The key phrase is yellow. |
| Spotlight cards | `.ds-spotlight` + `<SpotlightGroup>`: a yellow border and faint fill glow follow the cursor across the whole card group (bento, agents, solutions, outcomes). |
| Section heading reveal | `SectionHeading` uses `<Reveal variant="blur">` (blur 12px + fade-up). |
| Scroll flow line (`ScrollFlowLine`) | A vertical line sits on a hero grid line (in the gutter, `--flow-x`). Its glowing head is **scrubbed by scroll**: it follows a point 62% down the viewport, drawing down through every section and retracting along the same path on scroll up. A dashed rail shows the path ahead. At each section heading a node lights up, and on ≥768px a connector grows to the content edge. The hero grid and beams offset by `--flow-x` so the line continues the banner pattern. |
| Process line | A yellow progress line draws over the dashed connector on scroll (horizontal on desktop, vertical on mobile). |
| Section reveal / fade-up | `<Reveal>` adds `.is-visible` via IntersectionObserver. Hidden state applies only under `html.js-motion`. |
| Staggered cards | `<Reveal index={i % 3}>` gives `--reveal-index × --ds-stagger` |
| Floating panels | `ds-float` 6s on hero context cards (offset phases) |
| Scrolling integrations | `<LogoCloud>` marquee. Pauses on hover/focus and wraps statically under reduced motion. |
| Data flow | `ds-dash` / `line-flow` dashed connectors (hub, automation layer) |
| Number/progress reveal | Workflow progress rail (7s), ring fill, bar grow in mockups |
| Hover lift | Cards `translateY(-3/-4px)` with border brighten; buttons `-2px` |
| Workflow storytelling | Auto-advancing tabs while in view on wide screens (≥960px). Stops on any interaction. Never used under reduced motion or on narrow screens, where the stacked panel would change height and shift the page. |
| CTA glow | Perspective grid floor drifting toward the viewer with a radial yellow horizon |

`prefers-reduced-motion: reduce` disables all transitions and animations
globally (`globals.css`), stops marquees, ticker, beams, cells and workflow
auto-advance, shows the manifesto fully lit, keeps scroll-linked elements in their
final state, and never hides content. No motion loops faster than 0.9s except
spinners. Pointer effects (spotlight grid, spotlight cards) only run for mouse
input. Scroll-linked effects use CSS scroll timelines with `@supports` fallbacks.

## 7. Components

| Layer | Component | Purpose |
|---|---|---|
| layout | `Container` | Max-width wrapper (`default` / `narrow`) |
| layout | `Section` | Section shell: `tone` (default/raised), `spacing`, `container`, `labelledBy` |
| layout | `Header` | Fixed header. Becomes blurred and bordered on scroll. Menu below 1024px: full-screen panel on phones (<560px); on tablets (560 to 1023px) a 400px right-aligned dropdown card under the header with a dimmed, tap-to-close backdrop. Accessible (focus trap, Esc, scroll lock, closes on route change). Focus goes to the first link only when opened by keyboard; on tap the panel itself takes focus (no ring). The chat launcher hides while the menu is open (`html[data-menu-open]`). **Active state** (`useActiveNav`): page links match the route (`aria-current="page"`); homepage section links follow a scroll-spy line 140px below the header (`aria-current="location"`). Desktop active is white text with a 16px yellow underline bar; mobile active is yellow text with a yellow left rail and arrow. A clicked item stays active until its section arrives, so nothing flickers during smooth scroll. |
| assistant | `DotSeekAssistant` | Floating chat: yellow pill launcher "Ask DotSeek" (icon-only on ≤559px) opens a 390px panel with header ("powered by DotSeek"), message log (`role="log"`), typing dots then a streaming caret, quick-reply chips ("Start an enquiry" chip is solid yellow), input and disclaimer. Replies render plain text, "- " bullets and auto-linked paths and emails. Tablets (560 to 1199px): 440px wide; portrait tablets up to 760px tall. Short screens (≤820px tall, e.g. landscape tablets): compact header, log and options. During the enquiry only the option list scrolls (max 112 to 220px), so the text field and actions stay visible. Touch devices get 16px inputs (no iOS/iPadOS zoom). Bottom sheet on mobile: 82svh (doesn't resize with the keyboard), dimmed page behind, page scroll locked while open, 16px inputs (no iOS zoom), no auto-focus on touch, and the log pinned to the newest message before paint. Esc closes and focus returns to the launcher. The reference and estimate cards stay where they first appeared in the conversation (just above the question asked at that moment), so the current question is always the last message above the answer field, and the log scrolls to it whenever a card appears. |
| assistant | `EnquiryControls` | Replaces the chat input during the enquiry: wrapping pill option buttons (`aria-pressed` for multi-select, check icon when selected, Continue button), an "Other" pill that opens an inline text field, text/email/tel/textarea fields with inline validation (warning colour), a solid yellow primary action plus underlined text actions (Skip, Keep current answer, Start again, Cancel). States: a typing-dots row while the AI recommends; a "Continue with X" primary plus the other solutions as pills; on review a transcript checkbox, consent copy and Send. |
| assistant | Start card | In-chat card under a consultant reply when the AI suggests an enquiry: soft-yellow bordered box with a primary "Start my website enquiry" style button. |
| assistant | `EnquiryReview` | Review card in the chat log: a yellow-tinted "Project brief" box (kicker, title, overview, feature/technology/clarify lists, AI note; typing dots while loading) above a definition list of answers, each row with a small outlined Edit button. Hidden while an answer is being edited. |
| home | `SolutionsCatalogue` | `#solutions`: 4-column spotlight grid (2 on tablet, 1 on phones). The core Workflow Automation card spans 2 columns with an "Our core" tag. Each card: icon tile, title, summary, example chips, secondary `sm` "Start enquiry" button pinned to the bottom. A full-width "Not sure what you need?" card ends the grid with a primary "Ask the AI consultant" button. |
| portal | `(portal)` pages | Same tokens as the site. Each page renders its own sticky 64px blurred top bar (`PortalFrame` for the customer page and sign-in, with a "Visit website" / "Back to website" outline link; `AdminFrame` when signed in). Cards on `surface` with hairline borders; two-column split (brief + details, conversation + reply) that stacks below 900px (the customer page puts the conversation first). Status pills: New (yellow), In progress (info blue), Awaiting customer (warning amber), Closed (muted). Thread bubbles: own messages yellow-tinted and offset right. Inside the chat's enquiry modal the top bar is hidden. |
| portal | Admin sign-in | Centred two-column card (one column on phones) on a brand backdrop: soft yellow glow, masked grid and a large faint "seek" ring. Left: yellow lock tile, caption kicker "DotSeek team", h3 "Sign in to the admin" with a yellow gradient word, password field with a show/hide eye button, amber alert for errors, full-width primary "Sign in", note that customers use their email link. Right: "Inside the admin" with three icon rows (inbox, replies, offers). |
| portal | `AdminFrame` | Signed-in top bar: logo (links to the inbox) with an outlined yellow "Admin" tag, Inbox and Offers tabs (active tab: white text and the site's 16px yellow underline bar; Inbox shows a yellow count of new or needs-reply enquiries), then "View website" (opens a new tab) and "Sign out" outline buttons. Phones hide the tag, icons and "View website". |
| portal | Admin inbox | Kicker, h2 "Enquiry inbox" and a summary line. Four stat cards (New and Needs reply glow yellow when non-zero and link to their filter; Consultations requested; Open pipeline value). Segmented pill tabs (All, Needs reply, New, In progress, Awaiting customer, Closed) with counts, and a rounded search field (name, company, email, ref, title). One bordered list: initials avatar, title, name/company/email, chips (service, Needs reply yellow, Consultation amber, Price request, Reference, offer), recommended estimate and status with ref and date; new or needs-reply rows get a 3px yellow left edge. 10 per page: "Showing 1–10 of N" plus Previous, numbered pages (current one solid yellow) and Next. Dashed empty state with a "Show all enquiries" link. |
| portal | Admin enquiry | Pill "Back to inbox" button (flipped arrow) with the Inbox / ref breadcrumb, then a profile card (initials, chips, title, name, email, phone, ref and received date) with a status select, secondary "Update status" and a "Customer's page" link. Details on the left; conversation and the "Reply to {name}" form on the right, sticky on desktop; closed enquiries show an "Email {name}" button instead. |
| portal | Admin offers | "Back to inbox", heading with a Live / Off / Expired state badge (yellow glowing dot when live), then one card of sections (label column + fields): Status (toggle switch on a real checkbox), Offer (label; discount, fixed price and expiry in three columns), Eligible services (selectable chip cards). Footer with the save button and a green "Saved." confirmation. |
| layout | `CookieNotice` | Fixed bottom-left notice ("No tracking cookies"), dismissed via local storage. Full-width on ≤559px. |
| layout | `Footer` | Contact strip, brand/contact, 4 link columns, social, oversized outline wordmark |
| common | `Button` | `primary` (yellow, trailing arrow) / `secondary` (white outline; hover fills white with dark text) / `ghost`, sizes `sm/md/lg`. With `href` it renders a link; without `href` it renders a `<button>` (`type` "button" or "submit") for in-page actions and forms, with a disabled state. Optional static leading `icon`. One primary per button group. |
| common | `Badge` | `eyebrow` (dark chip, soft-yellow text), `tag` (yellow), `status` (success/warning/brand/neutral) |
| common | `SectionHeading` | Eyebrow + gradient h2 + intro. `align`, `size`. |
| common | `GradientText` | Yellow highlight phrase inside headings |
| common | `LogoCloud` | Marquee of system names: `wordmark` or `tile` variant, `reverse` |
| common | `IconCard` | Feature-grid card (icon, meta, title, body) |
| common | `Icon` | Inline 24px line-icon set. Add glyphs here. |
| common | `Logo` | DotSeek mark (yellow seek-ring + dot) and wordmark |
| common | `Reveal` | Scroll-reveal wrapper (`variant`: up/scale/left/right/blur, `index`, `as`) |
| common | `SpotlightGroup` | Pointer tracker that drives `.ds-spotlight` card glows |
| visual | `ScrollFlowLine` | Scroll-scrubbed flow line + section nodes across the homepage |
| visual | `HeroBackdrop` | Animated banner pattern: grid, beams, cells, particles, spotlight |
| home | `ActivityTicker` | Live-style automation event marquee under the hero CTAs |
| home | `ManifestoSection` | Scroll-lit editorial statement |
| visual | `MockWindow` | Product-UI window frame used by every mockup |
| visual | `DashboardMockup` | Hero Automation Monitor + Operations Agent panel |
| visual | `AutomationCard` | Bento card: visual in a corner-glow well, plus text (`stacked` / `split`) |
| visual | `CapabilityVisuals` | Agent chat, mini workflow, document extraction, customer chat, integration hub, insights |
| visual | `WorkflowDiagram` | Stage UIs: intake, AI extraction (code), rules, actions, performance |
| visual | `AgentCard` | Agent as a capability: role, tasks, connected systems |
| visual | `IntegrationNode` | "DotSeek automation layer" pill between system rows |
| plan | `PlanCard` | Compact estimate in the chat log: soft-yellow bordered card with the yellow "AI-Generated Indicative Estimate" pill, plan title, a figure list (development, timeline, running costs, architecture, typical UK market) and a primary "Open estimate & architecture" button. |
| plan | `PlanDialog` | Native modal `<dialog>` (focus trapped, Esc closes it without closing the chat, focus returns to the opener). Desktop: 1180px wide, 16px radius, header with the estimate pill and title, underline tabs (Quotation, Architecture, Compare; arrow keys move between tabs), a scrolling main column and a 320px summary sidebar on `bg-secondary` with the yellow estimate figure, budget-fit pill (success or warning tint), primary Continue, secondary Request a consultation and underlined Download and Modify actions. Below 900px it becomes full screen, single column, with a sticky bottom bar (estimate plus Continue). Blurred dark backdrop; reduced motion removes the entrance. |
| plan | Service row | Switch (`role="switch"`, 40×24 track, yellow when on, locked "Core" items disabled), label, status pill (Included: yellow tint; Recommended: yellow outline and a yellow-tinted card border; Optional and Not needed yet: muted), reason text, impact line (Performance, Reliability, Scalability, Complexity) and right-aligned cost impact (+£ setup, £/month). |
| home | `PocketMoneyBand` | `#start`, the one loud moment after the integrations strip: a 16px-radius surface band with a yellow hairline border, a soft yellow radial glow and a slowly rotating conic sheen (off under reduced motion). Copy column: caption kicker, h2 "Big plans. Pocket-money start." (yellow gradient phrase), body, and a growth path of pills joined by yellow arrows (first pill yellow). Actions column: primary "Get my estimate" and secondary "Have a reference site?". Stacks on tablet and phone. No price amounts. |
| plan | `ReferenceCard` | Chat card after a reference is analysed: "Reference analysis" pill, host, figure list (complexity stage, build range, timeline, pages), likely-services chips and an originality note. |
| plan | `CheaperOptions` | "Reference & cheaper options" tab: reference summary and evidence; "Want something similar within a smaller budget?" with the AI or rule-based cost explanation (yellow rule), four option cards (stage caption, name, scope, range, recommended and weeks, Keeps and Simplifies lists, "Use this version"; current outlined yellow); "Within your budget" card; "What drives the cost" table with impact pills (Low muted, Medium info, High warning) and a Keep / Remove / Add later segmented control; and a compare table. |
| plan | Make this cheaper | Dashed yellow outline button at the top of the summary actions, with a status note explaining the switch. |
| plan | Business stage | In the quotation: a 5-step strip (thin top bar per stage; current stage yellow bar, tint and yellow name) under "Business stage: X"; in the summary sidebar an outlined yellow pill "X stage · price label". |
| plan | Estimate figures | Summary shows Recommended (large yellow), Minimum and Maximum; line items show a muted range column and a recommended column; phases show a range and a green "Within your budget" pill when they fit. |
| plan | Offer card | Dashed yellow border and tint: yellow label, struck-through standard estimate, "From £X" (h4), caption with first-enquiry and expiry terms. Only when the admin has an active offer for the service. |
| plan | Negotiation | Underlined text actions (Request a better price, Tell us your budget, Discuss this quote) opening an inline form (£ field, optional note, "Add to my enquiry"); afterwards a surface card confirms the budget was added, without promising it. |
| assistant | Expanded workspace | Expand button in the chat header (expand / collapse icon, `aria-pressed`). Expanded: a fixed panel inset 16px over a dimmed page with two columns: the chat (360 to 420px) and `QuoteWorkspace`. Below 1024px it fills the screen with a Chat / Quote pill switch (one view at a time). The first quote of an enquiry auto-expands on screens 1024px and wider. Esc collapses first, then closes. |
| assistant | Switch offer | When a page asks for a different enquiry while one is in progress: an assistant message with a yellow start card ("Switch to {solution}", "Start from a reference" or "Start a fresh quote") and an underlined "Keep my current enquiry"; once answered the buttons disappear. |
| plan | `QuoteWorkspace` | Right-hand quote canvas on the sunken surface with a soft yellow corner glow. Header: caption kicker (Quote workspace / Live quote) and the plan title; when ready, the recommended total in yellow (h3) with range and timeline, pulsing briefly while "Updating". States: idle (document icon, short text, primary "Start an enquiry"); collecting (spinner + "Gathering your requirement: N answers so far", the answers as a bordered list that animates in, and a shimmering document skeleton); generating (five steps in a soft-yellow card: done steps get a yellow check, the active one a spinner and animated dots, over the skeleton); preparing (an existing quote still loading, e.g. after a refresh: the skeleton only, no replay of the steps); ready (the shared `QuotationDocument`, fading in; updates keep it steady and only the total pulses); sent ("Quote sent" with a check icon, "View your enquiry" and "Start another enquiry"). Footer: secondary "Adjust services and price" and primary "Continue to send enquiry". Reduced motion: no shimmer, spin or fade. |
| plan | Stage picker | Five stage buttons in a row (top border 3px; hover lifts to the elevated surface with a soft-yellow border; the current stage has a yellow border, tint and yellow name; unreachable stages at 40% opacity, not-allowed cursor), then a polite status line with the last change and an underlined "Compare versions in Reference & cheaper options" link. |
| plan | Price slider | "Choose your price" panel (soft-yellow border and tint): target figure in yellow (h3), current estimate on the right, a native range input with a yellow filled track and a yellow thumb ringed in the page colour, a thin white marker at the recommended price, and a three-point scale (Lowest viable, Recommended, Premium). After a move, a surface card lists the adjustments (up to six, then "and N more") with an underlined "Reset to our recommendation". `aria-valuetext` reads the price; results are announced politely. |
| plan | Scope picker | Under each selected item: a segmented control (`role="radiogroup"`) on a sunken track with Basic, Advanced and Custom, each showing its setup cost in tabular figures; the chosen option is solid yellow with dark text. A caption below describes what the chosen level includes. Locked "Core" items (discovery, hosting, encryption) can't be switched off but can change level. |
| plan | Architecture level cards | Four radio cards (`role="radio"`) in a 4-column grid (2 on tablet, 1 on phones): level, name, tagline, monthly range, best-for line, a solid yellow "Recommended" tag; the selected card has a yellow border and tint. |
| plan | `ArchitectureDiagram` | Layered diagram on a faint grid well: a label column (Users, Apps, Edge, Services, Data, External) and centred node chips joined by yellow connector arrows. Node borders encode the layer (apps white, edge info blue, services yellow with tint, data success green, external dashed). New nodes scale and fade in as options change. Text alternative in the list's `aria-label`. No hooks, so the portal renders it on the server. |
| plan | Package and provider comparison | Package cards (Option 1 to 4, price, monthly and weeks, "Use this package"; current one outlined yellow); provider table with Option A, B, C pills, ratings and pros and limitations, unsuitable providers dimmed and disabled (scrolls horizontally on small screens). |
| plan | `QuotationView` | View-only quotation modal. Email step: compact 440px card sized to its content (caption kicker, h4 title, short text, email and optional name fields, full-width primary "View my quotation", privacy note), focus starts in the email field. Document: a white A4-style sheet on a dark backdrop, coloured only with the `--ds-color-doc-*` tokens. Letterhead: a dark brand band (page colour, soft yellow corner glow, faint dot grid and a large faint "seek ring" with its dot echoing the logo) with the yellow DotSeek mark, white wordmark and tagline on the left, the website (yellow) and contact details on the right, and a yellow gradient rule underneath; yellow estimate pill, uppercase QUOTATION title, meta (reference, date, valid until), a tinted three-column parties strip, uppercase section headings with a dark rule, an itemised table (index, item and description, range, amount, zebra rows), totals with a dark "Recommended estimate" bar in yellow, two-column running costs and budget, phases with yellow left rules, terms, the Quotation Notice (small print in a two-column panel with a yellow left rule, two-column bullet lists and a dark pill step chain for "Final confirmation"; one column on phones) and a centred footer. Actions below the sheet. Full screen on phones (range column hidden). Hidden when printing. |
| assistant | `EnquiryModal` | "View your enquiry" after sending: a 1100px modal (full screen on phones) with a caption kicker "Private enquiry page", the reference as title and a close button, showing the private enquiry page in a same-origin frame. Inside the frame the portal top bar is hidden and Esc closes the modal. |
| plan | Quotation email | `lib/plan/quotationEmail.ts`: the quotation document rebuilt with tables and inline styles (same sections and `--ds-color-doc-*` colours as `QuotationView`) on a dark page backdrop: optional greeting above, 680px white sheet with the dark letterhead (inline CID logo, 3px yellow rule), and a yellow CTA button and team-only details below. Plain-text part from `lib/plan/report.ts`. |

### States

Every interactive element defines default, hover, `:focus-visible` (2px
`--ds-color-focus` outline, 3px offset) and active. Link buttons have no
disabled state. Real `<button>`s (chat actions, portal forms) use 45% opacity and `cursor: not-allowed` when disabled.

## 8. Accessibility criteria

- Semantic landmarks: skip link → `header` → `main#main` → `footer`. Each section is labelled by its heading id.
- One `h1` per page. Section `h2`s, card `h3`s.
- Mockups are `aria-hidden`, and the hero mockup has a `figcaption.sr-only` summary.
- The workflow is an ARIA `tablist`/`tab`/`tabpanel` with Arrow, Home and End keys and a roving tabindex.
- The FAQ uses native `<details>/<summary>`.
- The mobile menu uses `aria-expanded` / `aria-controls`, a focus trap, Esc to close, and returns focus to the toggle.
- Text contrast ≥ 4.5:1 for body, ≥ 3:1 for large text. Yellow is only used on dark backgrounds or with dark text.

## Do / Don't

**Do**
- Reference tokens, never raw values. Only illustration internals may use the illustration tokens.
- Give every new section a heading id and `labelledBy`.
- Make every product visual depict a real business-automation moment.

**Don't**
- Use bold (700) for display or section headings. The look depends on regular weight plus gradient.
- Put yellow text on light backgrounds, or use yellow as a section background.
- Add Aizai/CodeGen copy, logos or screenshots, or invent statistics or testimonials.
- Nest interactive elements (e.g. a `Button` inside a link card).
- Add animation libraries for effects CSS can do.

## Definition of done (per component)

- Uses tokens only. It renders at 375px and 1440px without horizontal page scroll.
- Hover, focus-visible and active states are verified. Keyboard operable.
- Respects reduced motion. Content is visible without JS.
- Documented in the component table above if it is reusable.
