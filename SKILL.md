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

- **Next.js 15 App Router in server mode** (`next build` + `next start`; pages are still pre-rendered, only `/api/*` runs on the server), **React 19**, **TypeScript 5** (strict).
- **Styling:** CSS Modules per component, plus `src/app/globals.css` (reset, utilities, reveal, keyframes) and `src/styles/tokens.css`.
- **Fonts:** `next/font/google` for Ubuntu and Ubuntu Mono, exposed as `--font-ubuntu` / `--font-ubuntu-mono`.
- **No UI or animation libraries.** Icons are inline SVG in `common/Icon.tsx`. Motion is CSS plus IntersectionObserver.
- Scripts: `npm run dev` (port from `.claude/launch.json`: 3100), `npm run build`, `npm run lint`, `npm run typecheck`, `npm start` (`next start`). Copy `.env.example` to `.env.local` for `ANTHROPIC_API_KEY` and SMTP settings.

## Folder architecture

```
src/
  app/
    layout.tsx        # fonts, metadata, motion flag script, Header/Footer, skip link
    page.tsx          # homepage = ordered list of home sections
    [slug]/page.tsx   # secondary pages from content/pages.ts (SSG)
    not-found.tsx
    globals.css
  styles/tokens.css   # ALL design tokens
  content/
    site.ts           # nav, footer columns, company details, CTAs
    home.ts           # every homepage string and data list
    pages.ts          # about / insights / careers / legal pages
  components/
    layout/   Container, Section, Header, Footer
    common/   Button, Badge, SectionHeading, GradientText, LogoCloud, IconCard, Icon, Logo,
              Reveal, SpotlightGroup
    visual/   MockWindow, DashboardMockup, AutomationCard, CapabilityVisuals,
              WorkflowDiagram, AgentCard, IntegrationNode, HeroBackdrop, ScrollFlowLine
    assistant/ DotSeekAssistant (site-wide chat), EnquiryControls, StartEnquiryButton
  app/api/
    assistant/route.ts   # streams Claude replies (server-only key)
    enquiry/route.ts     # emails chat enquiries via SMTP
  lib/assistant/systemPrompt.ts  # prompt built from content/*
    home/     Hero, ActivityTicker, HeroAutomationVisual, TrustedCompanies, ManifestoSection,
              AutomationCapabilities,
              WorkflowSection, AIAgentsSection, BusinessSolutions, IntegrationSection,
              ProcessSection, ResultsSection, CaseStudy, FAQSection, CTASection
```

## Coding rules

- **Content lives in `src/content/`.** Components are presentational. Don't hardcode marketing copy inside a component, except heading strings that need inline `<GradientText>` markup.
- **Server components by default.** Add `"use client"` only for interactivity (`Header`, `WorkflowSection`, `Reveal`, `HeroBackdrop`, `ManifestoSection`, `SpotlightGroup`, `ScrollFlowLine`, `CookieNotice`, `DotSeekAssistant`).
- **SSR-safe randomness.** Anything "random" rendered on the server (e.g. particles) must be deterministic and serialised as rounded strings, or hydration will mismatch.
- One component per file, named export, and a matching `Name.module.css` next to it.
- Join class names with `[a, b && c].filter(Boolean).join(" ")`. No classnames library.
- Use the `@/*` path alias for imports.
- Every CTA is a `<Button href>`, which renders a `Link` for internal routes and `<a>` for anchors, `mailto:` and `tel:`.
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
| Scroll-scrubbed page line | `ScrollFlowLine` is the first child of the `position: relative` wrapper in `app/page.tsx`. New homepage sections must be direct `<section>` children of that wrapper with an `h2` so they get a node. |
| Mobile carousel | Copy `AIAgentsSection`'s `ul.grid` mobile rule (flex + scroll-snap + negative gutter margin). Use `ul.x` selectors to beat the global `ul[role="list"]` reset. |
| Scroll-linked motion | CSS `animation-timeline: view()` inside `@supports`, with a static fallback and `animation: none` under reduced motion |
| Word-by-word headline | The `Words` helper in `Hero.tsx`. Keep the real text in the h1's `aria-label`. |
| Secondary page | Add an entry to `content/pages.ts` with `seoTitle`, `description`, optional `updated`, and `sections` (`heading`, `body[]`, `list[]`). Use `status: "draft"` until copy is approved. |
| Assistant (AI) | Live answers come from Claude via `app/api/assistant/route.ts`; the system prompt is built from site content in `lib/assistant/systemPrompt.ts`, so updating `content/*` updates what the assistant knows. Don't put dates or other changing values in the system prompt (it is prompt-cached). |
| Assistant (offline) | `content/assistant.ts` intents power the quick-reply chips and the fallback answers when the API is unavailable. Answers may only restate what the site already says. Add a label to `intentLabels` for any intent used as a chip. |
| Chat enquiry | Questions live in `content/enquiry.ts` (`choice`, `multi`, `text`, `email`; `other: true` adds an "Other" text field; `optional: true` adds Skip). Answers go only to `/api/enquiry` (email), never to the AI. Open it from any page with `window.dispatchEvent(new Event(START_ENQUIRY_EVENT))` or `<StartEnquiryButton />`. |
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
- Don't add large dependencies for small effects. Check First Load JS in the build output (it is about 118 kB on the homepage today).
- Keep client components small. Pass data down rather than importing large content modules into client code unnecessarily.
- Animate only `transform`, `opacity` and `filter` (and `background-position` for gradients). Use one scroll/pointer listener per component, throttled with `requestAnimationFrame`.
- Test scroll effects with `window.scrollTo({ top, behavior: "instant" })`. The site sets `scroll-behavior: smooth`, so plain `scrollTo` animates.
- **AI assistant rules:** the API key stays server-side (never `NEXT_PUBLIC_`). Keep the route's input limits, origin check and rate limit. Handle `stop_reason: "refusal"` before using output. The model is `claude-opus-5-5` with `fallbacks: "default"`. The UI says "powered by DotSeek"; the Privacy policy must keep naming Anthropic as the AI provider.
- **Flicker-free chat:** remount per-step controls with a `key` instead of resetting state in effects; scroll the log in `useLayoutEffect`; use `focus({ preventScroll: true })`; keep mobile inputs at 16px or larger.
- Test the assistant without a real key by pointing `ANTHROPIC_BASE_URL` at a local mock, and test enquiries with `ENQUIRY_DRY_RUN=1`.
- Don't run `next build` while `next dev` is running; they share `.next`. If the dev server breaks, delete `.next` and restart.

## Content rules (hard)

- No em dash (—) in any content, mockup text, metadata or code comments. Use a comma, colon, full stop or "|" instead. Check with `grep -rn "—" src` before finishing.
- No Aizai/CodeGen wording, logos or screenshots.
- No fabricated customer names, testimonials, logos-as-clients or statistics. Mockup data is clearly UI illustration.
- The case study stays labelled **"Illustrative example"** until a real, client-approved study replaces it.
- Integration names are systems DotSeek *can connect*, never "trusted by".
- Legal pages must describe how the site actually behaves. If you add cookies, analytics, forms or third-party embeds, update `/privacy` and `/cookies` and turn `CookieNotice` into a consent prompt in the same change.
- Every new page needs a `seoTitle` and `description` (see `dotseek.md` §8). Draft pages are automatically `noindex` and left out of the sitemap.

## Definition of done

1. `npm run lint` passes with zero warnings.
2. `npm run build` succeeds (type-check, lint and pre-render).
3. Previewed at desktop, tablet (768) and mobile (390) with no horizontal page scroll.
4. No console errors from app code.
5. Reduced-motion and keyboard paths checked for anything interactive.
6. `DESIGN.md`, `SKILL.md` and `dotseek.md` still describe the implementation.
