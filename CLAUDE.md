# courtgranville.com — project context

This file orients any Claude Code session working in this repository. Read it before acting.

## What this is

The personal portfolio site of Court Granville — a product/design student at IE University, Madrid, with a professional background in brand strategy and digital marketing. The site presents Court's design work and, by being built well, doubles as evidence of Court's ability as an AI-assisted designer-developer.

Domain: courtgranville.com. To be hosted on Cloudflare Pages, version-controlled on GitHub.

## Current phase — read before doing anything

The project is now a working **Astro site** (`astro@6`, no UI framework yet). The proven WebGL particle "CG" hero ships on the homepage (`src/components/Hero.astro`). The body is editorial: a homepage carousel and a `/work/` index, plus per-project pages under `/work/[slug]/`.

Recently built (the current design direction):
- **3D image canvas** — a reusable lit, cursor-parallax card that wraps a project's hero image (`public/js/hero-canvas.js`, vanilla three.js). The frame always adopts the image's *true* aspect (read from the decoded image, never a manifest value) so portrait/landscape are never squished.
- **Work index** (`src/components/WorkIndex.astro`) — a typographic project list; hovering a row previews that project's hero on the 3D canvas.
- **Selected-Work carousel** (`src/components/Carousel.astro`) — the same 3D canvas, stepped through with Prev/Next + arrow keys. Replaced the old full-bleed dark image carousel.

Build deliberately, one proven piece at a time. Prefer extending the existing grid + components over new patterns.

## The core idea of the site

The site is one coherent, light, editorial space. Its identity comes from a deliberate duality, and every design decision should reinforce it:

- A **generative, kinetic hero** — the dimensional particle "CG", which rotates and reacts — representing Court as a designer who works with code and AI.
- A **static, editorial body** — the work itself, typographic and precise — representing Court as a traditionally trained product designer.

Hero and body share the same off-white ground; the contrast is generative-vs-editorial, not dark-vs-light. The serif/mono type pairing carries the same duality.

## Design system

### Palette
A single light ground, dark ink, one sharp accent. No other colours; no decorative gradients.
- Ground (whole site, hero included): off-white — **not** pure white, **not** cream — ~`#F4F3EF` (tunable)
- Ink / text / hero particles: off-black — ~`#141414` (tunable)
- Accent: a single **deep red**, used sparingly — final value TBD, testing the oxblood-to-bright-deep-red range (`#6E1423`–`#8E1B0E`).

### Typography
Google Fonts only.
- Headings / display: **Playfair Display, Regular (400)**
- Hero monogram "CG": **Playfair Display, Bold (700)**
- Body, UI, labels: a **monospace** — `IBM Plex Mono` is the current placeholder. Final choice TBD (candidates: IBM Plex Mono, JetBrains Mono, DM Mono). Treat the mono as a single swappable variable.

### Principles
- **Work-first.** The path from landing to the work is short and unmistakable.
- **One signature interaction, then restraint.** The CG hero is the single "wow" moment. Do not add decorative animation elsewhere.
- **Editorial and precise.** Whitespace is a material. Full-bleed imagery for project work.
- **Atmosphere through depth, not decoration.** The hero earns its richness through real dimensional depth, particle density and motion — never through glow effects, bloom, or applied filters.

### Explicitly forbidden
This site must read as the work of a professional designer. Never introduce:
- Generic "AI" aesthetics — beige/cream backgrounds, purple or violet gradients, glassmorphism, soft drop-shadow cards.
- Generic fonts — Inter, Roboto, Arial, system-ui, Space Grotesk.
- Unmotivated CTAs, decorative icons, emoji.
- Centred-everything landing-page layouts and stock component patterns.

## Layout grid — CANONICAL for every page and section

**All pages and sections lay out on one shared column grid.** Use it; do not invent per-page grids or arbitrary margins. The grid is the skeleton of the whole site — Swiss/editorial discipline depends on everything aligning to it.

- **Columns:** 12 (desktop ≥1200px) · 8 (tablet ≥768px) · 4 (mobile). Shifts automatically via the `--cols` token.
- **Gutter:** `24px` (`--gutter`). **Outer margin:** `max(36px, 5vw)` desktop/tablet, `max(24px, 5vw)` mobile (`--outer`).
- **Baseline:** `8px` (`--baseline*`). Vertical rhythm reduces to multiples of 8.
- Source of truth: `src/styles/tokens.css` (grid + type + colour + motion tokens). The container is `src/components/Grid.astro` (`display:grid; repeat(var(--cols),1fr)`); children set `grid-column: <start> / <end>` at each breakpoint.

Rules:
- **The column lines are never rendered** in the live site — the grid governs *placement only*, it is not a visible decoration. (A dev-only guide overlay may be toggled in a prototype, but never ships.)
- Place real content on specific column ranges (e.g. work index list `1 / 8`, 3D canvas `8 / 13` at desktop). Full-bleed sections still align their inner content to the grid via a nested `.grid`.
- **Astro scoping gotcha:** a `<Grid class="x">` renders the grid container *inside the Grid component*, so a parent component's scoped CSS does **not** reach it. To style that container's own properties (padding, row-gap, align-items) from the parent, write `:global(.x){…}`. Column placement on children written in your own template scopes normally.

## Technical conventions

### Prototype phase (now)
- Prototypes live at `prototypes/<topic>/index.html` — the hero prototype is `prototypes/hero/`.
- Each prototype is a single self-contained `index.html`. **No build step** — it runs by being opened.
- three.js, addons and lil-gui load as ES modules via a CDN import map (jsDelivr), with **versions pinned** (currently `three@0.162.0`, `lil-gui@0.19.2`) so a moving "latest" cannot break a file.
- Preview over HTTP, not `file://` — run `python3 -m http.server` from the repo root, then open `http://localhost:8000/prototypes/hero/`. Google Fonts and some CDN behaviour are unreliable over `file://`.
- Desktop-first. Mobile/touch is deferred and explicitly out of scope until stated otherwise.

### Code style
- Modern ES modules. No jQuery, no legacy patterns.
- Every prototype keeps a single `CONFIG` object at the top holding all tunable constants — nothing tweakable should be buried as a magic number.
- Comment the *why*, not the *what*.
- Copy is written in **British English**.

### Performance
- Target a stable 60fps on a 2020-era laptop. Particle count is the primary tuning lever.

### Build stack (chosen)
**Astro** hosts both the WebGL hero and the editorial content. WebGL/three.js ships as vanilla `<script is:inline type="module">` so the CDN import map in `Layout.astro` resolves `three` / addons without Vite bundling. Astro is itself Vite-powered (fast dev/HMR), so there is no reason to drop to a bare Vite SPA for this content-first portfolio. When richer stateful 3D is needed, add `@astrojs/react` and build those pieces as React islands (react-three-fiber + GSAP) while keeping editorial pages static — see the framework note in session memory.

Shared 3D lives in `public/js/` as ES modules imported by component inline scripts (e.g. `hero-canvas.js`).

## Roadmap

Six phases: (1) research — done; (2) design system + hero prototype — done; (3) framework build (Astro) — **current**; (4) GitHub version control; (5) iterate in Claude Code with full-resolution assets; (6) deploy to Cloudflare Pages.

Open question, not in scope now: courtgranville.com also has a separate Cargo-hosted blog/thesis track; whether the two are reconciled into one site is undecided.
