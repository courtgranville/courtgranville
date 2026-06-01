# courtgranville.com — project context

This file orients any Claude Code session working in this repository. Read it before acting.

## What this is

The personal portfolio site of Court Granville — a product/design student at IE University, Madrid, with a professional background in brand strategy and digital marketing. The site presents Court's design work and, by being built well, doubles as evidence of Court's ability as an AI-assisted designer-developer.

- Domain: **courtgranville.com** (to be deployed on Cloudflare Pages).
- Repo: **https://github.com/courtgranville/courtgranville** (public).

## Current state — read before doing anything

A working **Astro site** (`astro@6`). **The homepage is now the canonical centrepiece of the whole site — a single-page identity narrative.** It opens with a **scroll-driven particle narrative** (`src/components/ScrollHero.astro`) and then flows, in normal editorial flow, through the full story of who Court is: *All work* link → **About** ("In short.") → **Disciplines** ("What I do.") → **Approach** → **Beginnings** → **Writing** → **Colophon** → **Contact** (with an inline `ContactForm`). The rest of the site is editorial pages off the same chrome: a `/work/` index with per-project pages at `/work/[slug]/`, plus dedicated `/about/`, `/blog/` (+ `/blog/[slug]/`) and `/contact/` pages. The homepage's About/Contact sections double as the in-page anchor targets the nav links to (`/#about`, `/#contact`).

The current design direction (recently built):
- **ScrollHero — the homepage narrative** (`src/components/ScrollHero.astro`). One vanilla three.js canvas plays a single continuous story as you scroll: the proven **CG particle glyph** builds (load-in), disperses into a screen-filling cloud, and re-forms into each of four featured products' **real textured GLB** (Mantis, Wave, Backgammon, Spider-209 — grab-and-spin), one adjusting directly into the next. **The narrative no longer closes on a particle-text "Selected Work" divider** — that interstitial was removed. The final product (Spider-209) rests at the bottom of the stage and **scrolls straight up into the editorial body below**, which opens with the **About ("In short.")** section — no dispersal interstitial, no blank screen. (Each product carries a "Selected Work" *kicker* in its overlay copy; the BEATS array is `glyph → 4 × model`, with no trailing `text`/`disperse` beat. The legacy `dividerHeight`/`exitVh` tunables in `CONFIG` are vestigial — there is no text divider to drive.) The editorial body below flows normally, opaque, and occludes the sticky canvas as it scrolls up. **The whole engine + all tunables live in one `CONFIG`/`BEATS` block** (mirrors the old hero's discipline); the no-build tuning reference is `prototypes/hero/_scroll-narrative.html` (append `?dbg` there for `window.__toP`/`__state`). Key mechanics: a non-uniform scroll→timeline map (`STOP_F`; section dispersals span more scroll than model morphs); a **direct** morph (position read straight from the timeline, no follow-lag) with the original hero's **spring-play** as a separate pointer displacement; `formW` (how built the nearest shape is) drives the texture/text crossfade so the model only skins on as the dust forms it; cloud + model share **one rotation** (incl. drag) so they never disconnect; per-product resting `viewRY/viewRX`; a directional, smootherstep, settle-gated **snap** on wheel-stop. Models load from `public/models/*.glb` (optimised meshopt+WebP, no DRACO); a GPU pre-warm (offscreen render) avoids first-scroll texture-upload hitches.
  - **Lenis:** ScrollHero owns the page's Lenis (tuned `lerp:0.1`) and exposes it as `window.__cgLenis`; `Layout.astro` shares that single instance on the homepage instead of starting a second, and treats `.scroll-stage` as a "hero" for the nav fade-in. The homepage now ships **one** three.js (the CDN copy) — no duplicate-three warning.
- **Work gallery** (`src/components/r3f/WorkGallery.tsx`) — **the `/work/` index**: a responsive grid (1→2→3→4 columns, mobile→4K) of the projects rendered as **grab-and-spin textured GLBs** on the plain white ground, each with a small "View project" link to `/work/[slug]/`. One R3F island mounted `client:visible`; each cell is its own `<Canvas>` that renders while on/near screen (IntersectionObserver, 300px pre-arm) and pauses off-screen, mirroring `ProjectViewer`'s fit-to-bounding-sphere + Meshy-normalise + in-engine studio-IBL handoff. Per-project framing (`fill`, resting `viewRY`/`viewRX`) lives in one array in `src/pages/work/index.astro` — `fill` is kept ≤1.0 so the sphere never clips at any spin angle, and each stage is a taller `4∶5` box for breathing room. Two gotchas baked in: the canvas is pulled **out of flow** (via the Canvas `style` prop → `position:absolute`, which beats R3F's inline `position:relative`) so its drawing-buffer height can't feed back into the `aspect-ratio` stage and inflate it frame-by-frame; and the gallery wrapper must **not** carry the editorial `.reveal` class (it races scroll-restoration and can stick at `opacity:0` — the island brings its own per-model GSAP entrance). The Nuclear Question is omitted until its model exists.
- **3D image canvas** — a reusable lit, cursor-parallax card that wraps a project's hero image (`public/js/hero-canvas.js`, vanilla three.js). The frame always adopts the image's **true** aspect, read from the *decoded image* (`tex.image.width/height`), never a manifest value — this is what stops portrait/landscape squishing. Don't reintroduce manifest-aspect sizing. It powered the old WorkIndex hover-preview; with WorkIndex superseded it is **no longer used by a live page** (kept in tree). Project pages (`/work/[slug]`) render their imagery as plain responsive `<img>` (with `srcset`) from the manifest.
- **Superseded but kept in tree:** `Hero.astro` (old standalone CG hero); `Carousel.astro` + `src/components/r3f/ProjectViewer.tsx` (the old Selected-Work textured-GLB R3F carousel); and `WorkIndex.astro` (the old typographic `/work/` list with 3D-image hover-preview, replaced by `WorkGallery`). None are used by a live page. `ProjectViewer`'s fit-scale + material-normalisation + studio-IBL logic was the reference for both ScrollHero's and WorkGallery's model handoff. R3F is first-class for `/work/`, `/lab/` and future stateful-3D islands.

Build deliberately, one proven piece at a time. Prefer extending the existing grid + components over new patterns.

## The core idea of the site

The site is one coherent, light, editorial space. Its identity comes from a deliberate duality, and every design decision should reinforce it:

- A **generative, kinetic hero** — the dimensional particle "CG", which rotates and reacts — representing Court as a designer who works with code and AI.
- A **static, editorial body** — the work and the written identity, typographic and precise — representing Court as a traditionally trained product designer. On the homepage this body is the single-page identity narrative (About → Disciplines → Approach → Beginnings → Writing → Colophon → Contact); on inner pages it's the `/work/`, `/about/` and `/blog/` editorial flow.

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
- `src/components/Nav.astro`, `Footer.astro` — site chrome. Nav links are **Work** (`/work/`) + **About** / **Contact** (homepage anchors `/#about`, `/#contact`); brand "CG" scrolls to top.
- `src/components/ScrollHero.astro` — the homepage's scroll-driven particle narrative (see Current state). Vanilla three.js; owns the page Lenis.
- `src/components/ContactForm.astro` — the inline contact form mounted in the homepage's Contact section.
- `src/components/Hero.astro` — the WebGL particle CG hero (locked `CONFIG`; lil-gui tuning panel; dispatches `hero:loaded`). Vanilla three.js via `<script is:inline type="module">`.
- `src/components/Grid.astro` — the column container (see grid section).
- `src/components/WorkIndex.astro` — the old typographic `/work/` list + 3D-image-canvas hover-preview surface (uses `public/js/hero-canvas.js`). **Superseded by `WorkGallery.tsx`; no longer mounted by a live page** (kept in tree).
- `src/components/r3f/` — **React/R3F islands**. `WorkGallery.tsx` (the `/work/` model gallery — a grid of per-cell grab-and-spin GLB canvases; see Current state); `ProjectViewer.tsx` (textured-GLB viewer: `useGLTF` + `RoomEnvironment` IBL + `OrbitControls` + `useGSAP`); `SpinCard.tsx` (minimal reference pattern). Mounted `client:visible`.
- `public/js/hero-canvas.js` / `object-canvas.js` — shared vanilla-three ES modules (`mount…Canvas(canvas, opts)`). Both are unused by the live site now (kept in tree).
- `public/models/*.glb` — **optimised** (WebP+meshopt, ~1–3 MB) textured project models. ScrollHero uses four (`mantis.glb`, `speaker.glb`, `backgammon.glb`, `spider.glb`); WorkGallery uses those plus `lumi.glb`, `yourpal.glb`, `wabiSabi.glb`. Raw sources live in `assets/models/*.glb` (git-ignored); drop a new textured export there and re-run `scripts/optimize-models.mjs`.
- `src/pages/` — `index.astro` (the single-page homepage narrative), `about/index.astro`, `contact/index.astro`, `blog/index.astro` + `blog/[slug].astro`, `work/index.astro` (mounts `WorkGallery` + holds its per-project framing array) + `work/[slug].astro`, `lab/` (the R3F island sandbox / reference, unlinked from nav).
- `src/content.config.ts` — defines **two** collections: `projects` (JSON, glob-loaded) and `blog` (`.md`/`.mdx` posts, with `draft` flag — drafts build in dev only, excluded from prod).
- `src/content/` — `projects/*.json` (project data) + `projects-images.json` (per-project image manifest: `src`, `srcset`, `width`, `height`, `aspect`) + `blog/*.md` (writing posts). **Note:** the collection schema lives in `src/content.config.ts` (Astro 6 root location), *not* inside `src/content/`.
- `src/styles/` — `tokens.css`, `global.css` (resets + `.label`/`.reveal`/`.sr-only`), `fonts.css`.
- `scripts/process-images.mjs` — generates the optimised `public/assets/projects/**` webp (1200/2400) from raw originals in `assets/projects/**`.
- `scripts/optimize-models.mjs` — `gltf-transform` pass turning the big textured GLBs in `assets/models/` into web-ready `public/models/` (2048px WebP + meshopt; ~199 MB → ~12 MB).
- `prototypes/hero/` — `index.html` (the proven hero prototype), `_scroll-narrative.html` (the no-build tuning reference for ScrollHero — append `?dbg`), and `_homepage-studies.html` (scratch design studies); these are no-build and safe to delete.

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
1. **Vanilla three.js** via `<script is:inline type="module">`, resolving `three`/addons through the Layout import map (CDN, pinned `three@0.162.0`). Shared logic lives in `public/js/` (e.g. `hero-canvas.js`, `object-canvas.js`). This is what the homepage ScrollHero uses today; the WorkIndex hover-preview that also used it is now superseded.
2. **React islands** — now **first-class on `main`** (the preferred path for richer, stateful 3D). The stack is installed and wired: `@astrojs/react` (in `astro.config.mjs`) + **react-three-fiber 9 + drei 10 + GSAP 3 (`@gsap/react`)** + npm `three@0.184`, with JSX in `tsconfig.json`. Components live in `src/components/r3f/`; mount with `client:visible` so editorial pages stay static. **`WorkGallery.tsx`** (the live `/work/` model gallery) and **`ProjectViewer.tsx`** (the Selected-Work model viewer) are the real examples; **`SpinCard.tsx`** + the **`/lab/`** page are the minimal reference pattern — copy these to build new 3D sections. Conventions: studio IBL via in-engine `RoomEnvironment` (no HDRI download — deploy-safe), `useGSAP` for choreography, `OrbitControls` with zoom/pan disabled (so the wheel still scrolls), render loops pause off-screen. Convert vanilla pieces to R3F incrementally; don't rewrite wholesale (notably, leave the hero as vanilla).

Note: vanilla scripts use CDN `three@0.162`; React islands bundle npm `three@0.184`. **The homepage now ships only one three.js** (ScrollHero's CDN copy) — the old carousel R3F island is no longer mounted there, so there is no longer a "multiple instances of three.js" warning on the homepage. If you ever put a vanilla canvas and an R3F island on the *same* page, expect that benign warning (they run in separate contexts); avoid doing so *unnecessarily*. R3F islands are `client:visible`, so their bundle loads on scroll.

**Asset weight — optimised (done).** The raw textured Meshy exports are ~30–40 MB each (~199 MB total) — unshippable. They're now run through **`scripts/optimize-models.mjs`** (`@gltf-transform/cli`): PBR textures → 2048px **WebP**, geometry → **meshopt** (`EXT_meshopt_compression`), geometry preserved (no decimation). Result: **~199 MB → ~12 MB total** (1.1–2.9 MB per model), rendering unchanged.
- **Sources** (`assets/models/<slug>.glb`, **git-ignored**) → **served** (`public/models/<slug>.glb`, committed). Re-run `node scripts/optimize-models.mjs` after dropping a new textured export into `assets/models/`.
- No runtime decoder dependency: three reads WebP natively (`EXT_texture_webp`); drei's `useGLTF` enables the **bundled** MeshoptDecoder by default (no CDN). (`useGLTF` would also wire a gstatic **Draco** CDN decoder if a model used Draco — we use meshopt to avoid that.)

## Version control

- `main` — stable, deployable. `feat/<name>` branches for trials (the React/R3F work lives on `feat/react-islands`).
- Flow: branch off `main`, build, `git push -u origin feat/<name>`, open a PR to merge when happy (or delete the branch).
- The 87 MB `docs/projects/spider-209/source/SPIDER-209-BRIEF.pdf` triggers GitHub's >50 MB warning (still under the 100 MB hard limit). Consider Git LFS for large source files if the repo needs slimming.
- `.gitignore` excludes `node_modules`, `dist`, `.astro`, `.tmp-screenshots/`, `.claude/settings.local.json`, env files.

## Deploy (Cloudflare Pages)

Fully static build — no adapter needed. Connect the GitHub repo in the
Cloudflare Pages dashboard with:
- **Framework preset:** Astro
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Node version:** 20 (set env `NODE_VERSION=20`, or add a `.nvmrc`)
- **Env vars:** none required.

The hero/3D-canvas three.js loads from jsDelivr (CDN import map) and fonts from
Google Fonts at runtime — both work in production. After the first deploy, add
the custom domain `courtgranville.com` in Pages → Custom domains (Cloudflare
manages the DNS). `astro.config.mjs` `site` is already set for canonical URLs +
sitemap. (Connecting the repo + DNS is a dashboard action on Court's account.)

## Roadmap

Phases: (1) research — done; (2) design system + hero prototype — done; (3) framework build (Astro) — done; (4) GitHub version control — done; (5) iterate in Claude Code with full-resolution assets — **current**; (6) deploy to Cloudflare Pages — settings ready, awaiting dashboard connect.

An **on-site Writing track now exists**: a `blog` content collection (`src/content/blog/*.md`) with a `/blog/` index and `/blog/[slug]/` post template, linked from the homepage's Writing section. Open question, not in scope now: courtgranville.com also has a separate Cargo-hosted blog/thesis track; whether that and the on-site `/blog/` are reconciled into one is undecided.
