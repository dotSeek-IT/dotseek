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
| Workflow storytelling | Auto-advancing tabs while in view. Stops on any interaction and is never used under reduced motion. |
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
| layout | `Header` | Fixed header. Becomes blurred and bordered on scroll. Accessible mobile menu (focus trap, Esc, scroll lock). |
| assistant | `DotSeekAssistant` | Floating chat: yellow pill launcher "Ask DotSeek" (icon-only on ≤559px) opens a 390px panel with header ("powered by DotSeek"), message log (`role="log"`), typing dots then a streaming caret, quick-reply chips ("Start an enquiry" chip is solid yellow), input and disclaimer. Replies render plain text, "- " bullets and auto-linked paths, emails and phone numbers. Tablets (560 to 1199px): 440px wide; portrait tablets up to 760px tall. Short screens (≤820px tall, e.g. landscape tablets): compact header, log and options. During the enquiry only the option list scrolls (max 112 to 220px), so the text field and actions stay visible. Touch devices get 16px inputs (no iOS/iPadOS zoom). Bottom sheet on mobile: 82svh (doesn't resize with the keyboard), dimmed page behind, page scroll locked while open, 16px inputs (no iOS zoom), no auto-focus on touch, and the log pinned to the newest message before paint. Esc closes and focus returns to the launcher. |
| assistant | `EnquiryControls` | Replaces the chat input during the enquiry: wrapping pill option buttons (`aria-pressed` for multi-select, check icon when selected), an "Other" pill that opens an inline text field, text/email/textarea fields with inline validation (warning colour), a solid yellow primary action plus underlined text actions (Skip, Start again, Cancel), and consent copy on review. |
| layout | `CookieNotice` | Fixed bottom-left notice ("No tracking cookies"), dismissed via local storage. Full-width on ≤559px. |
| layout | `Footer` | Contact strip, brand/contact, 4 link columns, social, oversized outline wordmark |
| common | `Button` | `primary` (yellow) / `secondary` (white outline) / `ghost`, sizes `sm/md/lg`. Always a link. |
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

### States

Every interactive element defines default, hover, `:focus-visible` (2px
`--ds-color-focus` outline, 3px offset) and active. Buttons are links, so there is no
disabled state. If a real `<button>` gains one, use 40% opacity and `cursor: not-allowed`.

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
