# courtgranville.com — project context

This file orients any Claude Code session working in this repository. Read it before acting.

## What this is

The personal portfolio site of Court Granville — a product/design student at IE University, Madrid, with a professional background in brand strategy and digital marketing. The site presents Court's design work and, by being built well, doubles as evidence of Court's ability as an AI-assisted designer-developer.

- Domain: **courtgranville.com** (to be deployed on Cloudflare Pages).
- Repo: **https://github.com/courtgranville/courtgranville** (public).

## Current state — read before doing anything

A working **Astro site** (`astro@6`). The proven WebGL particle "CG" hero ships on the homepage (`src/components/Hero.astro`); the body is editorial — a Selected-Work carousel and a `/work/` index, with per-project pages at `/work/[slug]/`.

The current design direction (recently built):
- **3D image canvas** — a reusable lit, cursor-parallax card that wraps a project's hero image (`public/js/hero-canvas.js`, vanilla three.js). The frame always adopts the image's **true** aspect, read from the *decoded image* (`tex.image.width/height`), never a manifest value — this is what stops portrait/landscape squishing. Don't reintroduce manifest-aspect sizing.
- **Work index** (`src/components/WorkIndex.astro`) — a typographic project list; hovering a row previews that project's hero on the 3D canvas.
- **Selected-Work carousel** (`src/components/Carousel.astro`) — the same 3D canvas, stepped with Prev/Next + arrow keys. Replaced the old full-bleed dark image carousel.

Build deliberately, one proven piece at a time. Prefer extending the existing grid + components over new patterns.

## The core idea of the site

The site is one coherent, light, editorial space. Its identity comes from a deliberate duality, and every design decision should reinforce it:

- A **generative, kinetic hero** — the dimensional particle "CG", which rotates and reacts — representing Court as a designer who works with code and AI.
- A **static, editorial body** — the work itself, typographic and precise — representing Court as a traditionally trained product designer.

Hero and body share the same light ground; the contrast is generative-vs-editorial, not dark-vs-light. The Playfair/Raleway type pairing carries the same duality.

## Design system

Exact, current values live in **`src/styles/tokens.css`** — treat it as the source of truth and change values there, not inline.

### Palette
A single light ground, dark ink, one sharp accent. No other colours; no decorative gradients.
- Ground: **`#FFFFFF`** (`--bg`). *(The off-white `#F4F3EF` direction was explored in the prototypes — "not pure white, not cream". Revisit if pure white reads too clinical; it is a tunable call.)*
- Ink / text: **`#161616`** (`--text`), with `--text-quiet` / `--text-faint` / `--rule` / `--hairline` derivations.
- Accent: a single **deep red `#8E1B0E`** (`--accent`), used sparingly.

### Typography
Google Fonts only (`src/styles/fonts.css`).
- Display / headings: **Playfair Display, Regular (400)** (`--serif`); Italic for pull-quotes.
- Hero monogram "CG": **Playfair Display, Bold (700)**.
- Body, UI, labels: **Raleway** (`--sans`) — 400 body, 500 for uppercase tracked labels. *(Note: this replaced the earlier "monospace placeholder" idea — the structural face is Raleway, a sans, not a mono.)*

### Principles
- **Work-first.** The path from landing to the work is short and unmistakable.
- **One signature interaction, then restraint.** The CG hero is the single "wow" moment. Do not add decorative animation elsewhere.
- **Editorial and precise.** Whitespace is a material. Full-bleed imagery for project work.
- **Atmosphere through depth, not decoration.** Richness comes from real dimensional depth, density and motion — never glow, bloom, or applied filters.

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
- Source of truth: `src/styles/tokens.css`. The container is `src/components/Grid.astro` (`display:grid; repeat(var(--cols),1fr)`); children set `grid-column: <start> / <end>` per breakpoint.

Rules:
- **The column lines are never rendered** in the live site — the grid governs *placement only*, it is not a visible decoration. (A dev-only guide overlay may be toggled in a prototype, but never ships.)
- Place real content on specific column ranges (e.g. work index list `1 / 8`, 3D canvas `8 / 13` at desktop). Full-bleed sections still align inner content to the grid via a nested `.grid`.
- **Astro scoping gotcha:** a `<Grid class="x">` renders the grid container *inside the Grid component*, so a parent's scoped CSS does **not** reach it. To style that container's own properties (padding, row-gap, align-items), write `:global(.x){…}`. Column placement on children written in your own template scopes normally.

## Architecture — key files

- `src/components/Layout.astro` — document shell; loads tokens/fonts/global CSS; hosts the **CDN import map** (`three@0.162.0`, addons, `lil-gui@0.19.2`, `lenis@1.3.23`) for inline scripts; site-wide Lenis smooth-scroll + reveal observer + nav state.
- `src/components/Nav.astro`, `Footer.astro`, `Intro.astro` — chrome + intro section.
- `src/components/Hero.astro` — the WebGL particle CG hero (locked `CONFIG`; lil-gui tuning panel; dispatches `hero:loaded`). Vanilla three.js via `<script is:inline type="module">`.
- `src/components/Grid.astro` — the column container (see grid section).
- `src/components/WorkIndex.astro`, `Carousel.astro` — the 3D-image-canvas surfaces (use `public/js/hero-canvas.js`).
- `src/components/WorkGrid.astro` — older tile gallery (superseded on `/work/` by WorkIndex; still in tree).
- `src/components/blocks/*` — project-page body blocks (ImageGrid, ImagePair, ImageSingle, PullQuote, SpecList, SectionLabel, Text).
- `public/js/hero-canvas.js` — shared ES module: `mountHeroCanvas(canvas, opts) → { show(hero), destroy() }`. Imported by component inline scripts.
- `src/pages/` — `index.astro` (home), `work/index.astro`, `work/[slug].astro`. (`lab/` exists only on the `feat/react-islands` branch.)
- `src/content/` — `projects/*.json` (project data) + `projects-images.json` (per-project image manifest: `src`, `srcset`, `width`, `height`, `aspect`) + `content.config.ts`.
- `src/styles/` — `tokens.css`, `global.css` (resets + `.label`/`.reveal`/`.sr-only`), `fonts.css`.
- `scripts/process-images.mjs` — generates the optimised `public/assets/projects/**` webp (1200/2400) from raw originals in `assets/projects/**`.
- `prototypes/hero/` — `index.html` (the proven hero prototype) plus scratch design studies (`_homepage-studies.html`, `_mcp-demo.html`); these are no-build and safe to delete.

## Running it

- **Site (Astro):** `npm run dev` → `http://localhost:4321/`. `npm run build`, `npm run preview`, `npm run check` (astro check).
- **Prototypes (no build):** run `python3 -m http.server` from the repo root → `http://localhost:8000/prototypes/hero/`. Preview over HTTP, never `file://` (Google Fonts / some CDN behaviour break on `file://`).
- Desktop-first. Mobile/touch is being filled in via the responsive grid but is not the priority surface.

## Code style
- Modern ES modules. No jQuery, no legacy patterns.
- The hero keeps a single `CONFIG` object holding all tunable constants — nothing tweakable buried as a magic number. Apply the same discipline to new interactive pieces.
- Comment the *why*, not the *what*.
- Copy is written in **British English**.

## Performance
- Target a stable 60fps on a 2020-era laptop. Hero particle count is the primary tuning lever; the 3D canvases pause their render loop when scrolled off-screen (IntersectionObserver).

## Build stack & 3D approach

**Astro** hosts both the WebGL hero and the editorial content, and is the chosen stack (not moving to a bare Vite SPA — Astro is already Vite-powered, and a SPA would cost SEO/first-paint and the content collections for a content-first portfolio).

Two ways 3D ships:
1. **Vanilla three.js** via `<script is:inline type="module">`, resolving `three`/addons through the Layout import map (CDN, pinned `three@0.162.0`). Shared logic lives in `public/js/`. This is what the hero and the 3D image canvases use today.
2. **React islands** (preferred for richer, stateful 3D going forward): `@astrojs/react` + **react-three-fiber + drei + GSAP** + npm `three`, mounted with `client:load`/`client:visible` so editorial pages stay static. Scaffolded on the **`feat/react-islands`** branch (`src/components/r3f/SpinCard.tsx`, `/lab/`). Convert vanilla pieces to R3F incrementally; don't rewrite wholesale.

Note: vanilla scripts use CDN `three@0.162`; React islands bundle npm `three@0.184`. They run in separate contexts — fine, but avoid loading both on the same page unnecessarily.

## Version control

- `main` — stable, deployable. `feat/<name>` branches for trials (the React/R3F work lives on `feat/react-islands`).
- Flow: branch off `main`, build, `git push -u origin feat/<name>`, open a PR to merge when happy (or delete the branch).
- The 87 MB `docs/projects/spider-209/source/SPIDER-209-BRIEF.pdf` triggers GitHub's >50 MB warning (still under the 100 MB hard limit). Consider Git LFS for large source files if the repo needs slimming.
- `.gitignore` excludes `node_modules`, `dist`, `.astro`, `.tmp-screenshots/`, `.claude/settings.local.json`, env files.

## Roadmap

Phases: (1) research — done; (2) design system + hero prototype — done; (3) framework build (Astro) — done; (4) GitHub version control — done; (5) iterate in Claude Code with full-resolution assets — **current**; (6) deploy to Cloudflare Pages.

Open question, not in scope now: courtgranville.com also has a separate Cargo-hosted blog/thesis track; whether the two are reconciled into one site is undecided.
