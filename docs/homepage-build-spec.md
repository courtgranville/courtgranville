# Homepage — Build Spec

> Active task for the courtgranville.com repo. Read `CLAUDE.md` (project context, design system) and `docs/hero-prototype-spec.md` (the hero, now built and proven) first. This document specifies the rest of the homepage.

## What this builds

The hero particle "CG" is built and proven. This task extends it into the full homepage by adding, in scroll order: a **persistent navigation bar**, a **short introduction**, a **featured-works carousel**, and a **minimal footer**.

- **Extend the existing file** — `prototypes/hero/index.html`. This file now *is* the homepage. Do not rebuild the hero; leave its WebGL/particle system intact except for the CONFIG lock in §0 and the nav change in §1.
- **Homepage only.** The Work, Blog, About and Contact pages do not exist yet — their nav links are placeholders. Project detail pages, real project imagery, and a CMS are all out of scope.
- Single self-contained file, no build step, consistent with the established convention. The file is getting large; that is acceptable for now — decomposition into a framework is the separate Phase 3 step.

The brief from Court: **particular attention on UI/UX.** Components, interactions and motion must be modern but refined — considered, restrained, and clearly the work of a designer who recognises quality. §6 and §7 are not optional polish; they are the point.

## 0. Lock the hero tuning

Court has settled the hero's tuning. Set the hero `CONFIG` to these values (or, if Court provides the `Log CONFIG as JSON` output, use that verbatim — the table is the reference):

- scene: `bgColor` #FFFFFF · `cameraDistance` 15 · `cameraFov` 32 · `cameraDriftAmp` 0 · `cameraDriftSpeed` 0
- particles: `count` 140000 · `contourBoost` 0 · `baseSize` 0.032 · `sizeVariance` 0.22 · `opacity` 1 · `depthFade` 0 · `inkLightnessVar` 0 · `inkColor` #161616
- glyph: `depth` 0.39
- physics: `springK` 15 · `damping` 0.99 · `maxVel` 12.1 · `maxDisplacement` 4 · `ambientMode` off · `ambientAmp` 0.003 · `ambientFreq` 0.11
- pointer: `mode` repel · `radius` 0.27 · `strength` 25 · `falloff` smoothstep · `smoothing` 0.59
- rotation: `mode` continuous · `speed` 0.06 · `parallax` false
- loadIn: `duration` 1.6 · `stagger` 0.7 · `staggerMode` leftToRight · `easing` easeOutCubic · `startVolume` 7
- post: `grain` 0 · `vignette` 0 · `chromaticAberration` 0

Court has stripped the atmosphere effects to zero deliberately — the look is a crisp, stark, fully-opaque particle field. The GUI stays in place for future tuning.

**Whole-page ground colour:** every section below uses the same `bgColor` as its background, so the site reads as one continuous light space. (Note: this is pure white in the values above; CLAUDE.md still records an off-white `#F4F3EF` — if Court confirms the off-white, change `bgColor` and every section ground together.)

## 1. The persistent navigation bar

A fixed bar, present on every page. On the homepage it sits above the hero and remains as the user scrolls.

- **Left — the name.** "Court Granville" set in **Playfair Display Regular**. It is the home link: clicking it smooth-scrolls to the top of the page.
- **Right — the pages.** `WORK   BLOG   ABOUT   CONTACT`, in **IBM Plex Mono**, uppercase, letter-spaced (~0.2em), small (~11px). For now these are placeholder links (the pages don't exist) — wire them as anchors with no destination.
- The serif name set against the mono caps is deliberate — it carries the site's serif/mono duality in the one element on every page. Keep that contrast crisp.
- **Behaviour:** the nav fades in together with the hero's other UI, *after* the particle load-in completes. It is `position: fixed`.
- **Over the hero:** no background — just text on the light ground. **On scroll:** once the hero is scrolled past, a subtle semi-opaque white backdrop with a light blur fades in behind the bar, so the text stays legible over carousel imagery. The transition is gentle (~250ms).
- **Hover:** the link goes to the deep-red accent, with a thin underline that wipes in from the left (~200ms). The name's hover is quieter — a subtle opacity or colour shift only.
- Keyboard-focusable with a visible, considered focus state.

## 2. Page structure & scroll

- The hero occupies the first 100vh. Its WebGL canvas is `position: fixed`; the content sections below sit in normal flow with **opaque backgrounds** and scroll up over it.
- **Smooth scrolling** via Lenis (loaded through the CDN import map, version pinned). Keep the inertia *subtle* — a gentle, refined glide, not a heavy floaty lag.
- **Performance:** pause the hero's WebGL render loop when the hero is fully scrolled out of view (IntersectionObserver), and resume it when the hero returns. No reason to spend GPU on an off-screen particle system.
- The hero's `SCROLL` cue fades out smoothly as soon as the user begins scrolling.

## 3. Introduction section

Immediately below the hero. Quiet, typographic, generous — the calm after the kinetic hero.

- Generous vertical whitespace; the page ground colour; content held to a comfortable measure, not full width.
- A small **mono kicker label** (uppercase, letter-spaced): `01 — INTRODUCTION`.
- The **introduction statement**, set large in **Playfair Display Regular** (this is the editorial heart of the page):

  > I'm a product designer drawn to the technical, complex, and contested subjects that design too often leaves alone. The real work, I've come to think, is translation — turning that complexity into something people can understand, trust, and act on.

- Beneath it, a **mono factual line** (uppercase, letter-spaced, small, quieter):

  > PRODUCT DESIGN — IE UNIVERSITY, MADRID · PREVIOUSLY BRAND STRATEGY & DIGITAL MARKETING · CURRENT THESIS ON THE PUBLIC PERCEPTION OF CONTESTED TECHNOLOGY

- A subtle text link, mono, deep-red on hover: `About →` (placeholder — links to the future About page).
- **No portrait.** The intro is purely typographic by design — a photo belongs on the About page; here it would dilute the editorial restraint.
- **Reveal:** as the section enters the viewport, its elements rise (~24px) and fade in, gently staggered, once. See §6.

(All copy above is final and ready to use, but editable — Court may refine wording.)

## 4. Featured works carousel

A full-bleed horizontal carousel — the loud counterpoint to the quiet intro.

- A **mono kicker label** above it: `02 — SELECTED WORK`.
- **Full-bleed:** the carousel spans the full viewport width, edge to edge. Height ~85vh — immersive, but a sliver short of the hero so it reads as a section, not a second hero.
- **One project per slide.** Each slide is a full-bleed image (`object-fit: cover`).
- **Per-slide content,** overlaid bottom-left over a subtle dark-to-transparent scrim (so text stays legible regardless of the image): the **project name** in Playfair Display; a line of **mono metadata** — `YEAR · DISCIPLINE`; and a small `View project →` link (placeholder).
- **Controls:** a minimal **prev / next** arrow pair, bottom-right (thin chevrons or small circular buttons — restrained, custom, not stock). Next is the primary action. A small **slide index** nearby — `01 / 05`. Support the keyboard left/right arrows; trackpad/touch drag-to-advance is a welcome addition.
- **Motion:** advancing slides the carousel horizontally with a smooth eased transition (~700ms, ease-in-out — see §6). The incoming image settles from a very slight scale (1.04 → 1.0) for a refined arrival; the metadata cross-fades. **No autoplay** — the carousel is entirely user-driven. It loops at the ends.
- **Data-driven.** Build the carousel from a JS array of project objects — `{ name, year, discipline, image, featured }`. Pre-populate with Court's eight projects:

  1. The Nuclear Question — 2026 — Data Visualisation / Information Design
  2. Mantis — 2026 — Product Design
  3. Wave — 2026 — Product Design
  4. Gravity Wave Backgammon — 2024 — Product Design
  5. LUMI — 2023 — Critical / Product Design
  6. YourPAL — 2023 — App Design / UX·UI
  7. Spider-209 — 2022 — Product Design
  8. Wabi Sabi — 2022 — Product Design

  The carousel shows the **featured** subset (Court will curate which and in what order — default to featuring the five most recent). Real photography does not exist yet: use a tasteful placeholder per slide — a solid mid-tone tonal block with the project name centred — so the layout reads correctly now and images drop in later. Lazy-load slide images.
- Below the carousel, a mono text link: `All work →` (placeholder — links to the future Work page).

## 5. Footer

A minimal closing band so the page ends gracefully and surfaces a contact path. (A modest addition — keep it small.)

- The page ground colour, a quiet top hairline rule.
- A short line — `Get in touch` — and the email `court@courtgranville.com` as a link (deep-red on hover).
- The four nav links repeated, small and mono.
- `© 2026 Court Granville`, mono, quiet.

## 6. Motion & interaction language

One coherent motion system across the whole page — this is where "refined" is won or lost.

- **Easing.** A single entrance curve for reveals — `cubic-bezier(0.16, 1, 0.3, 1)`; a single ease-in-out for the carousel — `cubic-bezier(0.65, 0, 0.35, 1)`. Do not scatter ad-hoc curves.
- **Durations.** Section reveals ~700ms; carousel slide ~700–800ms; hover transitions ~180–220ms. Consistency reads as intent.
- **Section reveals.** IntersectionObserver-driven; elements rise ~24px and fade in; staggered for multi-element sections; trigger once, never re-hide.
- **Hover states.** Every interactive element has a considered hover — restrained, ~200ms, the deep-red accent for links.
- **Restraint is the brief.** No bounce, no scroll-jacking, no exaggerated parallax, no animation for its own sake. Modern *and* refined means controlled.
- **`prefers-reduced-motion`.** Honour it: curtail or disable non-essential motion (reveals become instant, the carousel still works without the scale flourish, smooth-scroll falls back to native). This is a quality and accessibility marker, not an afterthought.

## 7. Components & craft

- Custom, precise components throughout — no stock UI-library widgets, no generic patterns. Reinforce CLAUDE.md's forbidden list (no AI-default aesthetics, no generic fonts, no decorative noise).
- **Typography.** Playfair Display — Regular — for the nav name, the intro statement, and project names. IBM Plex Mono for the nav links, kicker labels, metadata, factual lines, footer. Nothing else.
- Whitespace is a material — generous, intentional, editorial.
- Pixel-level care: aligned baselines, consistent rhythm, deliberate margins. The references Court chose (tux, clementgrellier, clayboan) win on exactly this.

## 8. Accessibility

- Semantic HTML5 — real `<nav>`, `<main>`, `<section>`, `<footer>` landmarks; a logical heading order.
- `alt` text on every image (placeholders included).
- Fully keyboard-navigable: nav links, carousel arrows and on-page links all focusable, with visible focus states; carousel responds to the arrow keys.
- Sufficient contrast for all text, including over carousel imagery (the scrim handles this).
- `prefers-reduced-motion` respected (see §6).

## 9. Tech & constraints

- Extends `prototypes/hero/index.html`; single file, no build step. Lenis added via the CDN import map, version pinned alongside three.js and lil-gui.
- Keep the file cleanly sectioned — clear HTML structure, organised CSS, modular JS. Decomposition into a framework is deferred to Phase 3.
- Desktop-first. The layout must remain sensible and unbroken at narrower widths, but full mobile polish (and a touch-tuned hero) is explicitly out of scope for now.

## 10. Out of scope

The Work / Blog / About / Contact pages; project detail pages; real project photography; any CMS; full mobile optimisation; the hero itself (already built — only its CONFIG is locked here).

## 11. Success criteria

1. The homepage reads as one continuous, considered editorial space — hero, introduction, carousel and footer cohering through type, colour, whitespace and a single motion language.
2. The nav is persistent, legible over both the hero and imagery, and carries the serif/mono contrast cleanly.
3. The carousel is full-bleed, user-driven, and moves with a smooth, refined, restrained motion — no autoplay, no flourish for its own sake.
4. Every interaction feels intentional; nothing reads as a stock component or an AI default.
5. Keyboard-navigable, `prefers-reduced-motion`-aware, and holding 60fps (hero loop paused when off-screen).
