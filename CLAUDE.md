# courtgranville.com - project context

This file orients any Claude Code session working in this repository. Read it before acting.

## What this is

The personal portfolio site of Court Granville - a product/design student at IE University, Madrid, with a professional background in brand strategy and digital marketing. The site presents Court's design work and, by being built well, doubles as evidence of Court's ability as an AI-assisted designer-developer.

- Domain: **courtgranville.com** (live on Cloudflare Pages, auto-deploying from `main`).
- Repo: **https://github.com/courtgranville/courtgranville** (public).

## Current state - read before doing anything

A working **Astro site** (`astro@6`). **The homepage is now the canonical centrepiece of the whole site - a single-page identity narrative.** It opens with a **scroll-driven particle narrative** (`src/components/ScrollHero.astro`) and then flows, in normal editorial flow, through the full story of who Court is: *All work* link → **About** ("In short.") → **Disciplines** ("What I do.") → **Approach** → **Beginnings** → **Writing** → **Colophon** → **Contact** (with an inline `ContactForm`). The rest of the site is editorial pages off the same chrome: a `/work/` index with per-project pages at `/work/[slug]/`, plus dedicated `/about/`, `/blog/` (+ `/blog/[slug]/`) and `/contact/` pages. The homepage's About/Contact sections double as the in-page anchor targets the nav links to (`/#about`, `/#contact`).

The current design direction (recently built):
- **ScrollHero - the homepage narrative** (`src/components/ScrollHero.astro`). One vanilla three.js canvas plays a single continuous story as you scroll: the proven **CG particle glyph** builds (load-in), **disperses once into a screen-filling cloud** and re-forms into **The Nuclear Question** (the dust becomes the live interactive nucleus/atom - see the sub-bullet below), which then **morphs directly** into each of the four featured products' **real textured GLB** (Mantis, Wave, Backgammon, Spider-209 - grab-and-spin), one shape-shifting straight into the next. **The narrative no longer closes on a particle-text "Selected Work" divider** - that interstitial was removed. The final product (Spider-209) rests at the bottom of the stage and **scrolls straight up into the editorial body below**, which opens with the **About ("In short.")** section - no dispersal interstitial, no blank screen. (Each featured beat carries a "Selected Work" *kicker* in its overlay copy; the `BEATS` array is `glyph → nucleus → 4 × model` - the five featured beats, the nucleus + four models, drive the `NN / 05` index and the right-edge beat dots - with no trailing `text`/`disperse` beat. The legacy `dividerHeight`/`exitVh` tunables in `CONFIG` are vestigial - there is no text divider to drive.) **A full-screen dispersal now happens ONLY at a section boundary** - either side of a structural beat (the CG glyph): `GAP_DISPERSE[i] = isStructural(kind[i]) || isStructural(kind[i+1])` (structural = `glyph`/`text`/`disperse`). So glyph→nucleus still explodes, but the nucleus and all four models morph **directly** into one another. (The earlier rule keyed off any change of beat *kind*, which made nucleus→Mantis a second screen-filling explosion; that is gone.) The editorial body below flows normally, opaque, and occludes the sticky canvas as it scrolls up. **The whole engine + all tunables live in one `CONFIG`/`BEATS` block** (mirrors the old hero's discipline); the no-build tuning reference is `prototypes/hero/_scroll-narrative.html` (append `?dbg` there for `window.__toP`/`__state`). Key mechanics: a non-uniform scroll→timeline map (`STOP_F`) whose per-transition scroll DISTANCE is tuned short so a single wheel flick completes a transition (`CONFIG.scroll.modelVh` ~0.85 viewport-heights per morph, `sectionVh` ~1.3 for the dispersal) - the dispersal is kept the LONGEST segment because it is a two-phase explode + reform that travels the furthest (too short and it flashes by "weirdly"); **the timeline tracks the scroll INTENT, not Lenis's eased scroll** - `state.p` follows `lenis.targetScroll` through a tight, frame-rate-independent follower (`CONFIG.scroll.followTau`), so the dispersal/morph is glued 1:1 to the wheel with no smooth-scroll lag (the canvas is `position:sticky`, so the morph need only track intent; during a programmatic snap it reads the eased scroll instead, so the settle still honours `snapDuration`); a **direct** particle morph (position read straight from the timeline target, no follow-lag) with the original hero's **spring-play** as a separate pointer displacement; `formW` (how built the nearest shape is) drives the texture/atom crossfade so a model only skins on - and the live atom only fades in - as the dust forms it; cloud + model share **one rotation** (incl. drag) so they never disconnect; per-product resting `viewRY/viewRX`; and a **snap-to-nearest-beat that fires only on a genuine stop** - it waits until the wheel has been quiet (`snapStopMs`) AND Lenis momentum has settled (`|velocity| < snapVel`), with a `snapStopMsHard` fail-safe so a jittery velocity can't strand the dust mid-dispersal, then eases OUT (`easeOutCubic`) to the nearest beat (`advanceThresh` ~0.4), so it never fights an active scroll the way the old eager 200ms ease-in-out snap did (which held-then-surged mid-scroll); a guard clears `snapping` once Lenis stops, since an interrupted no-`lock` `scrollTo` never fires `onComplete`. Models load from `public/models/*.glb` (optimised meshopt+WebP, no DRACO); a GPU pre-warm (offscreen render) avoids first-scroll texture-upload hitches. **Perf (keep the dispersal smooth):** the live atom's full-viewport canvas-2D redraw is gated to run only when it is about to be visible (`formW > 0.55`), not for the whole nucleus beat, so it never competes with the particle step during the glyph→nucleus dispersal; and `stepParticles` + the 1.68 MB position-buffer upload + the points draw are **skipped whenever the dust is fully hidden** behind a skinned model/atom (`smootherstep(texAt,1,formW) > 0.99`) - look-free, frees main-thread + fill budget at every rest. A `uDisperse` uniform additionally shrinks the point size (×0.84) **only** while the dust is in the screen-filling dispersal - cutting the heaviest overdraw on retina/ProMotion without changing the formed look (0 effect on the glyph/models + the compact model→model morphs). Adaptive DPR is **refresh-rate aware** (steps down on sustained sub-60fps on a 120Hz panel, sub-40fps on 60Hz; still needs ~24 sustained slow frames). **WebGL fallback:** if the context is unavailable or lost (`webglcontextlost`), the dead canvas is hidden and a static `#cgFallback` CG monogram + the intro copy are revealed and the atom paused - the crawlable project links + h1 in the sr-only block keep content/SEO intact either way.
  - **Lenis:** ScrollHero owns the page's Lenis (tuned `lerp:0.15`) and exposes it as `window.__cgLenis`; `Layout.astro` shares that single instance on the homepage instead of starting a second, and treats `.scroll-stage` as a "hero" for the nav fade-in. Lenis smooths the page's *actual* scroll (the editorial body), but the morph timeline bypasses that easing and reads `lenis.targetScroll` directly (see Key mechanics). The homepage now ships **one** three.js (the CDN copy) - no duplicate-three warning.
  - **The Nuclear Question beat = the live `NuclearAtom` island** (`src/components/nuclear/`, a canvas-2D React island hydrated `client:idle`). The dust re-forms into the nucleus contour (sampled from `public/nucleus-paths.json` by the same draw→sample technique as the glyph), then crossfades to the real interactive atom (U-235/U-238 isotope toggle, shake-to-fission) drawn over the model region. It is **not** a GLB - the nucleus is particles + the live atom - which is why the `/work` gallery still omits TNQ (no model). The engine positions the overlay and drives its opacity per beat, and owns a **pause contract**: `window.__cgAtomActive` + an `atom:active` CustomEvent make the island early-return its rAF loop while the nucleus is not the active, visible beat, so its full-screen redraw stays off the rest of the time.
- **Work gallery** (`src/components/r3f/WorkGallery.tsx`) - **the `/work/` index**: a responsive grid (1→2→3→4 columns, mobile→4K) of the projects rendered as **grab-and-spin textured GLBs** on the plain white ground, each with a small "View project" link to `/work/[slug]/`. One R3F island mounted `client:visible`; each cell is its own `<Canvas>` that renders while on/near screen (IntersectionObserver, 300px pre-arm) and pauses off-screen, mirroring `ProjectViewer`'s fit-to-bounding-sphere + Meshy-normalise + in-engine studio-IBL handoff. Per-project framing (`fill`, resting `viewRY`/`viewRX`) lives in one array in `src/pages/work/index.astro` - `fill` is kept ≤1.0 so the sphere never clips at any spin angle, and each stage is a taller `4∶5` box for breathing room. Two gotchas baked in: the canvas is pulled **out of flow** (via the Canvas `style` prop → `position:absolute`, which beats R3F's inline `position:relative`) so its drawing-buffer height can't feed back into the `aspect-ratio` stage and inflate it frame-by-frame; and the gallery wrapper must **not** carry the editorial `.reveal` class (it races scroll-restoration and can stick at `opacity:0` - the island brings its own per-model GSAP entrance). Each model cell shows a faint, on-brand **loading skeleton** (`.wg-skeleton` - a slow tonal pulse on its `::before` so the wrapper's opacity stays free to fade) behind the transparent canvas; it fades out once the GLB is ready (`Model` fires `onReady`), so cells never flash empty on slow networks. The Nuclear Question is omitted until its model exists.
- **3D image canvas** - a reusable lit, cursor-parallax card that wraps a project's hero image (`public/js/hero-canvas.js`, vanilla three.js). The frame always adopts the image's **true** aspect, read from the *decoded image* (`tex.image.width/height`), never a manifest value - this is what stops portrait/landscape squishing. Don't reintroduce manifest-aspect sizing. It powered the old WorkIndex hover-preview; with WorkIndex superseded it is **no longer used by a live page** (kept in tree). Project pages (`/work/[slug]`) render their imagery as plain responsive `<img>` (with `srcset`) from the manifest.
- **Superseded but kept in tree:** `Hero.astro` (old standalone CG hero); `Carousel.astro` + `src/components/r3f/ProjectViewer.tsx` (the old Selected-Work textured-GLB R3F carousel); and `WorkIndex.astro` (the old typographic `/work/` list with 3D-image hover-preview, replaced by `WorkGallery`). None are used by a live page. `ProjectViewer`'s fit-scale + material-normalisation + studio-IBL logic was the reference for both ScrollHero's and WorkGallery's model handoff. R3F is first-class for `/work/`, `/lab/` and future stateful-3D islands.

Build deliberately, one proven piece at a time. Prefer extending the existing grid + components over new patterns.

## The core idea of the site

The site is one coherent, light, editorial space. Its identity comes from a deliberate duality, and every design decision should reinforce it:

- A **generative, kinetic hero** - the dimensional particle "CG", which rotates and reacts - representing Court as a designer who works with code and AI.
- A **static, editorial body** - the work and the written identity, typographic and precise - representing Court as a traditionally trained product designer. On the homepage this body is the single-page identity narrative (About → Disciplines → Approach → Beginnings → Writing → Colophon → Contact); on inner pages it's the `/work/`, `/about/` and `/blog/` editorial flow.

Hero and body share the same light ground; the contrast is generative-vs-editorial, not dark-vs-light. The Playfair/Raleway type pairing carries the same duality.

## Design system

Exact, current values live in **`src/styles/tokens.css`** - treat it as the source of truth and change values there, not inline.

### Palette
A single light ground, dark ink, one sharp accent. No other colours; no decorative gradients.
- Ground: **`#FFFFFF`** (`--bg`). *(The off-white `#F4F3EF` direction was explored in the prototypes - "not pure white, not cream". Revisit if pure white reads too clinical; it is a tunable call.)*
- Ink / text: **`#161616`** (`--text`), with `--text-quiet` / `--text-faint` / `--rule` / `--hairline` derivations.
- Accent: a single **deep red `#8E1B0E`** (`--accent`), used sparingly.

### Light / dark theme
The site ships a **light/dark toggle** (a half-disc "contrast" button in the nav, right of Contact). The whole system rides the existing tokens - don't add per-component theme code:
- **`data-theme` attribute on `<html>`** (`light` | `dark`) is the switch. A `:root[data-theme="dark"]` block in `tokens.css` overrides the colour tokens (`--bg`, `--text`, the quiet/faint/rule/hairline derivations, `--field-bg`, `--nav-backdrop`); everything reading those flips automatically. **Dark is the default opening state** of the site (a first-time visitor with no stored preference lands in dark); switching to light persists and opts out. The starting dark palette (near-black `#0E0E0E` ground, warm near-white `#F4F3EF` ink) is a tunable call - adjust in `tokens.css`, not inline. The single accent is kept in both.
- **No-flash:** a blocking inline script at the very top of `<head>` (`Layout.astro`) sets `data-theme` from the `cg-theme` **localStorage** key before first paint. The preference persists across reloads and pages.
- **The hero:** the homepage particle hero is the only opaque WebGL surface, so it can't flip via CSS. The toggle dispatches a **`theme:change` CustomEvent** on `window` (mirroring the `hero:loaded` contract); `ScrollHero.astro` listens and runs `applyTheme()` - sets the clear/scene colour + the `uInk` particle uniform, and lazily builds the bloom composer (dark only). Particle **motion/density/behaviour is identical** in both themes; only ink colour (→white) and the dark-only bloom differ. The alpha `/work/` + ProjectViewer canvases need no change - they inherit the page ground.

### Typography
Google Fonts only (`src/styles/fonts.css`).
- Display / headings: **Playfair Display, Regular (400)** (`--serif`); Italic for pull-quotes.
- Hero monogram "CG": **Playfair Display, Bold (700)**.
- Body, UI, labels: **Raleway** (`--sans`) - 400 body, 500 for uppercase tracked labels. *(Note: this replaced the earlier "monospace placeholder" idea - the structural face is Raleway, a sans, not a mono.)*

### Principles
- **Work-first.** The path from landing to the work is short and unmistakable.
- **One signature interaction, then restraint.** The CG hero is the single "wow" moment. Do not add decorative animation elsewhere.
- **Editorial and precise.** Whitespace is a material. Full-bleed imagery for project work.
- **Atmosphere through depth, not decoration.** Richness comes from real dimensional depth, density and motion - never glow, bloom, or applied filters. **One deliberate exception:** bloom is used on the homepage particle hero, but **scoped to the dark theme only** (the white particles read as light against the near-black ground). The **light theme stays bloom-free** - its render path is byte-for-byte unchanged from before the theme system.

### Explicitly forbidden
This site must read as the work of a professional designer. Never introduce:
- Generic "AI" aesthetics - beige/cream backgrounds, purple or violet gradients, glassmorphism, soft drop-shadow cards.
- Generic fonts - Inter, Roboto, Arial, system-ui, Space Grotesk.
- Unmotivated CTAs, decorative icons, emoji.
- Centred-everything landing-page layouts and stock component patterns.

## Layout grid - CANONICAL for every page and section

**All pages and sections lay out on one shared column grid.** Use it; do not invent per-page grids or arbitrary margins. The grid is the skeleton of the whole site - Swiss/editorial discipline depends on everything aligning to it.

- **Columns:** 12 (desktop ≥1200px) · 8 (tablet ≥768px) · 4 (mobile). Shifts automatically via the `--cols` token.
- **Gutter:** `24px` (`--gutter`). **Outer margin:** `max(36px, 5vw)` desktop/tablet, `max(24px, 5vw)` mobile (`--outer`).
- **Baseline:** `8px` (`--baseline*`). Vertical rhythm reduces to multiples of 8.
- Source of truth: `src/styles/tokens.css`. The container is `src/components/Grid.astro` (`display:grid; repeat(var(--cols),1fr)`); children set `grid-column: <start> / <end>` per breakpoint.

Rules:
- **The column lines are never rendered** in the live site - the grid governs *placement only*, it is not a visible decoration. (A dev-only guide overlay may be toggled in a prototype, but never ships.)
- Place real content on specific column ranges (e.g. work index list `1 / 8`, 3D canvas `8 / 13` at desktop). Full-bleed sections still align inner content to the grid via a nested `.grid`.
- **Astro scoping gotcha:** a `<Grid class="x">` renders the grid container *inside the Grid component*, so a parent's scoped CSS does **not** reach it. To style that container's own properties (padding, row-gap, align-items), write `:global(.x){…}`. Column placement on children written in your own template scopes normally.

## Architecture - key files

- `src/components/Layout.astro` - document shell; loads tokens/fonts/global CSS; hosts the **CDN import map** (`three@0.162.0`, addons, `lil-gui@0.19.2`, `lenis@1.3.23`) for inline scripts; site-wide Lenis smooth-scroll + reveal observer + nav state.
- `src/components/Nav.astro`, `Footer.astro` - site chrome. Nav links are **Work** (`/work/`) + **About** / **Contact** (homepage anchors `/#about`, `/#contact`); brand "CG" scrolls to top.
- `src/components/ScrollHero.astro` - the homepage's scroll-driven particle narrative (see Current state). Vanilla three.js; owns the page Lenis.
- `src/components/ContactForm.astro` - the inline contact form mounted in the homepage's Contact section. A label-voice **"Download CV ↓"** link sits beside it (and under the email on `/contact/`), pointing at `public/Court_Granville_CV.pdf` (served at `/Court_Granville_CV.pdf` - the CV lives in `public/`, not `docs/`, so it's downloadable; the public repo means it is publicly accessible by design).
- `src/components/Hero.astro` - the WebGL particle CG hero (locked `CONFIG`; lil-gui tuning panel; dispatches `hero:loaded`). Vanilla three.js via `<script is:inline type="module">`.
- `src/components/Grid.astro` - the column container (see grid section).
- `src/components/WorkIndex.astro` - the old typographic `/work/` list + 3D-image-canvas hover-preview surface (uses `public/js/hero-canvas.js`). **Superseded by `WorkGallery.tsx`; no longer mounted by a live page** (kept in tree).
- `src/components/r3f/` - **React/R3F islands**. `WorkGallery.tsx` (the `/work/` model gallery - a grid of per-cell grab-and-spin GLB canvases; see Current state); `ProjectViewer.tsx` (textured-GLB viewer: `useGLTF` + `RoomEnvironment` IBL + `OrbitControls` + `useGSAP`); `SpinCard.tsx` (minimal reference pattern). Mounted `client:visible`.
- `src/components/nuclear/` - the **`NuclearAtom`** canvas-2D React island that powers the homepage's Nuclear Question beat (and the atom on its project page): `NuclearAtom.tsx` (wrapper - isotope/theme/hint state), `NucleusHero.tsx` (the rAF render loop - cursor magnetism, breathing, fission), and `lib/` helpers (fission state machine, particle bursts, SVG-path parsing, DPR fit). Hydrated `client:idle`; reads `public/nucleus-paths.json`; pauses its loop off-beat (the `atom:active` contract) and off-screen (IntersectionObserver). Styled by `src/styles/atom.css` (imported in ScrollHero). Not three.js - pure canvas 2D.
- `public/js/hero-canvas.js` / `object-canvas.js` - shared vanilla-three ES modules (`mount…Canvas(canvas, opts)`). Both are unused by the live site now (kept in tree).
- `public/models/*.glb` - **optimised** (WebP+meshopt, ~1–3 MB) textured project models. ScrollHero uses four (`mantis.glb`, `speaker.glb`, `backgammon.glb`, `spider.glb`); WorkGallery uses those plus `lumi.glb`, `yourpal.glb`, `wabiSabi.glb`. Raw sources live in `assets/models/*.glb` (git-ignored); drop a new textured export there and re-run `scripts/optimize-models.mjs`.
- `src/pages/` - `index.astro` (the single-page homepage narrative), `about/index.astro`, `contact/index.astro`, `blog/index.astro` + `blog/[slug].astro`, `work/index.astro` (mounts `WorkGallery` + holds its per-project framing array) + `work/[slug].astro`, `lab/` (the R3F island sandbox / reference, unlinked from nav). `work/[slug].astro` groups a project's flat block array into labelled sections (kicker on the rail, prose on the body, photos full width as justified orientation-grouped rows) and closes on the `heroImage` studio shot; alongside the image blocks it renders an inline-PDF **`booklet`** block (a hairline-framed, theme-aware `<iframe>` at the document's own aspect plus a `textlink` download link - reusable, e.g. for Wave's "Build a Speaker" manual). The served PDF lives in `public/` (the MUJI booklet is `public/wabi-sabi-booklet.pdf`).
- `src/content.config.ts` - defines **two** collections: `projects` (JSON, glob-loaded) and `blog` (`.md`/`.mdx` posts, with `draft` flag - drafts build in dev only, excluded from prod). A project's `blocks` array is a `type`-discriminated union: `label`, `text`, `quote`, `image`, `imagePair`, `imageGrid`, `specList`, **`booklet`** (`{ pdf, label?, downloadText? }`). Image blocks reference slugs in the manifest; `booklet.pdf` is a public path.
- `src/content/` - `projects/*.json` (project data) + `projects-images.json` (per-project image manifest: `src`, `srcset`, `width`, `height`, `aspect`) + `blog/*.md` (writing posts). **Note:** the collection schema lives in `src/content.config.ts` (Astro 6 root location), *not* inside `src/content/`.
- `src/styles/` - `tokens.css`, `global.css` (resets + `.label`/`.reveal`/`.sr-only`), `fonts.css`.
- `scripts/process-images.mjs` - generates the optimised `public/assets/projects/**` webp (1200/2400) from raw originals in `assets/projects/**`.
- `scripts/optimize-models.mjs` - `gltf-transform` pass turning the big textured GLBs in `assets/models/` into web-ready `public/models/` (2048px WebP + meshopt; ~199 MB → ~12 MB).
- `prototypes/hero/` - `index.html` (the proven hero prototype), `_scroll-narrative.html` (the no-build tuning reference for ScrollHero - append `?dbg`), and `_homepage-studies.html` (scratch design studies); these are no-build and safe to delete.

## Running it

- **Site (Astro):** `npm run dev` → `http://localhost:4321/`. `npm run build`, `npm run preview`, `npm run check` (astro check).
- **Prototypes (no build):** run `python3 -m http.server` from the repo root → `http://localhost:8000/prototypes/hero/`. Preview over HTTP, never `file://` (Google Fonts / some CDN behaviour break on `file://`).
- Desktop-first. Mobile/touch is being filled in via the responsive grid but is not the priority surface.

## Code style
- Modern ES modules. No jQuery, no legacy patterns.
- The hero keeps a single `CONFIG` object holding all tunable constants - nothing tweakable buried as a magic number. Apply the same discipline to new interactive pieces.
- Comment the *why*, not the *what*.
- Copy is written in **British English**.
- **No em-dashes.** Never use the em-dash character (U+2014) in any file you author or edit - site copy, comments, JSON content, config, scripts, or markdown (including this file). Use a single spaced hyphen (` - `) for the parenthetical/break role it would have played, or restructure the sentence. The shipped site (`src/`, `public/`) and maintained tooling are em-dash-free; archival `docs/` and `prototypes/` were left as historical records, so don't treat a stray em-dash there as a licence to add new ones. (The one deliberate exception is the separator character class in `src/pages/work/[slug].astro`, which must keep matching legacy em/en-dash prefixes in old data.)

## Performance
- Target a stable 60fps on a 2020-era laptop. Hero particle count is the primary tuning lever; the 3D canvases pause their render loop when scrolled off-screen (IntersectionObserver).
- The hero also adapts at runtime so it holds frame on weaker / high-refresh hardware without changing the look: a static `lowEnd` heuristic (few cores / little RAM) caps particle count + DPR; a **refresh-rate-aware adaptive DPR** steps the pixel ratio down only on sustained jank (tuned per 60/120Hz); and the screen-filling dispersal (the fill-rate peak on retina/ProMotion) shrinks its points via `uDisperse` to stay in budget. The atom island's redraw and the particle sim are both gated off when not visible (see the ScrollHero notes above). The dominant remaining cost is the dispersal's full-screen translucent overdraw, not CPU.

## Build stack & 3D approach

**Astro** hosts both the WebGL hero and the editorial content, and is the chosen stack (not moving to a bare Vite SPA - Astro is already Vite-powered, and a SPA would cost SEO/first-paint and the content collections for a content-first portfolio).

Two ways 3D ships:
1. **Vanilla three.js** via `<script is:inline type="module">`, resolving `three`/addons through the Layout import map (CDN, pinned `three@0.162.0`). Shared logic lives in `public/js/` (e.g. `hero-canvas.js`, `object-canvas.js`). This is what the homepage ScrollHero uses today; the WorkIndex hover-preview that also used it is now superseded.
2. **React islands** - now **first-class on `main`** (the preferred path for richer, stateful 3D). The stack is installed and wired: `@astrojs/react` (in `astro.config.mjs`) + **react-three-fiber 9 + drei 10 + GSAP 3 (`@gsap/react`)** + npm `three@0.184`, with JSX in `tsconfig.json`. Components live in `src/components/r3f/`; mount with `client:visible` so editorial pages stay static. **`WorkGallery.tsx`** (the live `/work/` model gallery) and **`ProjectViewer.tsx`** (the Selected-Work model viewer) are the real examples; **`SpinCard.tsx`** + the **`/lab/`** page are the minimal reference pattern - copy these to build new 3D sections. Conventions: studio IBL via in-engine `RoomEnvironment` (no HDRI download - deploy-safe), `useGSAP` for choreography, `OrbitControls` with zoom/pan disabled (so the wheel still scrolls), render loops pause off-screen. Convert vanilla pieces to R3F incrementally; don't rewrite wholesale (notably, leave the hero as vanilla).

Note: vanilla scripts use CDN `three@0.162`; React islands bundle npm `three@0.184`. **The homepage now ships only one three.js** (ScrollHero's CDN copy) - the old carousel R3F island is no longer mounted there, so there is no longer a "multiple instances of three.js" warning on the homepage. If you ever put a vanilla canvas and an R3F island on the *same* page, expect that benign warning (they run in separate contexts); avoid doing so *unnecessarily*. R3F islands are `client:visible`, so their bundle loads on scroll.

**Asset weight - optimised (done).** The raw textured Meshy exports are ~30–40 MB each (~199 MB total) - unshippable. They're now run through **`scripts/optimize-models.mjs`** (`@gltf-transform/cli`): PBR textures → 2048px **WebP**, geometry → **meshopt** (`EXT_meshopt_compression`), geometry preserved (no decimation). Result: **~199 MB → ~12 MB total** (1.1–2.9 MB per model), rendering unchanged.
- **Sources** (`assets/models/<slug>.glb`, **git-ignored**) → **served** (`public/models/<slug>.glb`, committed). Re-run `node scripts/optimize-models.mjs` after dropping a new textured export into `assets/models/`.
- No runtime decoder dependency: three reads WebP natively (`EXT_texture_webp`); drei's `useGLTF` enables the **bundled** MeshoptDecoder by default (no CDN). (`useGLTF` would also wire a gstatic **Draco** CDN decoder if a model used Draco - we use meshopt to avoid that.)

## Version control

- `main` - stable, deployable. `feat/<name>` branches for trials (the React/R3F work lives on `feat/react-islands`).
- Flow: branch off `main`, build, `git push -u origin feat/<name>`, open a PR to merge when happy (or delete the branch).
- The 87 MB `docs/projects/spider-209/source/SPIDER-209-BRIEF.pdf` triggers GitHub's >50 MB warning (still under the 100 MB hard limit). Consider Git LFS for large source files if the repo needs slimming.
- `.gitignore` excludes `node_modules`, `dist`, `.astro`, `.tmp-screenshots/`, `.claude/settings.local.json`, env files.

## Deploy (Cloudflare Pages)

**The site is live and auto-deploying.** Cloudflare Pages is connected to the
GitHub repo and rebuilds on every push to `main`; the build is served at both
`courtgranville.pages.dev` and the custom domain **`courtgranville.com`** (DNS
managed by Cloudflare). A push to `main` is therefore an outward-facing deploy -
treat it as one. The settings below are the connected configuration (kept for
reference / re-creation).

Fully static build - no adapter needed. The Cloudflare Pages project is
configured with:
- **Framework preset:** Astro
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Node version:** 22 - Astro 6 requires Node `>=22.12.0` (Node 20 is rejected at build). Pinned in-repo via `.nvmrc` (`22`), which Cloudflare reads for **every** deployment. Prefer this over a dashboard `NODE_VERSION` env var: dashboard vars are set per-environment (Production vs Preview are separate), so a Production-only var leaves PR **preview** builds on an unsupported default Node and they fail.
- **Env vars:** none required.

The hero/3D-canvas three.js loads from jsDelivr (CDN import map) and fonts from
Google Fonts at runtime - both work in production (verified live). The custom
domain `courtgranville.com` is added in Pages → Custom domains and Cloudflare
manages the DNS. `astro.config.mjs` `site` is set for canonical URLs + sitemap.

## Roadmap

Phases: (1) research - done; (2) design system + hero prototype - done; (3) framework build (Astro) - done; (4) GitHub version control - done; (5) iterate in Claude Code with full-resolution assets - **current**; (6) deploy to Cloudflare Pages - **done & live** (connected, auto-deploying from `main`, serving on `courtgranville.com`).

An **on-site Writing track now exists**: a `blog` content collection (`src/content/blog/*.md`) with a `/blog/` index and `/blog/[slug]/` post template, linked from the homepage's Writing section. Open question, not in scope now: courtgranville.com also has a separate Cargo-hosted blog/thesis track; whether that and the on-site `/blog/` are reconciled into one is undecided.
