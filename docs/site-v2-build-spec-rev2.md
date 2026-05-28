# Site v2 — Build Spec (rev 2)

> One prompt, three checkpointed phases. Framework move (Astro) + Swiss-grid design layer + Work page + seven project pages built from existing source material. Read alongside `CLAUDE.md`, the homepage build spec, and the project-pages plan (its §2 per-project angles, §3 copy principles and §4 scaffold still govern).
>
> **Rev 2 changes:** typography updated to **Playfair Display + Raleway** (Plex Mono and the previously proposed Plex Serif both dropped). The homepage's existing Mono usage swaps to Raleway as part of the Phase 2 port. Everything else is unchanged from rev 1.
>
> **Precondition.** Apply the homepage QA fixes (`homepage-qa-fixes.md`) before starting this build, if not already done.
>
> **Pause at each phase checkpoint and wait for Court's go-ahead before continuing.** Do not run all three phases in one pass.

---

## 1. What this build delivers

- The framework move from a single hand-coded `prototypes/hero/index.html` to a real Astro site at `~/code/courtgranville/`.
- A formal **Swiss-grid design system** layered onto the existing typography and palette — applied site-wide.
- The existing **homepage** ported into the new structure, with all behaviours preserved (WebGL hero, locked CONFIG, nav, intro, carousel, reveals, smooth scroll, hero pause off-screen, `prefers-reduced-motion`) — and its labels/kickers/nav swapped from Plex Mono to Raleway.
- A **Work index** page — the Swiss-grid project gallery.
- **Seven project pages**, content extracted from Court's `portfolio.docx` (or supplied directly as markdown — see §9), images analysed and ordered per project from the existing folders under `assets/projects/`.

What stays exactly as it is: the WebGL hero's locked CONFIG and visual identity, the **Playfair Display** display face, the deep-red accent, the existing motion language and easing tokens, all accessibility behaviour, the content of the homepage (re-arranged onto the grid and re-typed in Raleway, but not rewritten).

## 2. The design language

**Swiss grid as architecture; WebGL as the moments of breath.**

The grid disciplines every layout decision site-wide — columns, gutters, baseline, alignment, the lengths of measures, the depth of margins. The WebGL elements are the deliberate kinetic disruptions *inside* the grid — full-bleed in their own right, but contained by, and bordered against, gridded content above and below.

This is not classical Swiss. Classical Swiss is sans-serif Helvetica purism. This is **editorial Swiss** in its own register: Playfair Display as the editorial display voice; Raleway as the workhorse sans across body, UI and labels, disciplined to a 12-column grid and an 8px baseline. The pairing reads softer and more contemporary than a Plex Mono direction would have — that softness is offset, deliberately, by the Medium weight and letter-spacing of every uppercase label, which keeps Raleway working as a structural face rather than drifting into the lifestyle register it can fall into.

Principle of restraint: the grid is **mostly felt, occasionally seen**. Visible only where it earns being visible — the Work page (where the project grid *is* the page), section indices in the margin on project pages. Elsewhere it shapes everything quietly. No decorative column rules anywhere they aren't doing real work.

## 3. The grid system

- **12 columns** at desktop, **8** at tablet, **4** at mobile.
- **Gutter:** 24px (1.5rem), consistent across breakpoints.
- **Outer margin:** `max(36px, 5vw)` on each side — generous, scales.
- **Baseline:** 8px. Every vertical spacing (margins, line-heights, paddings) must be a multiple of 8.
- **Breakpoints:** mobile `<768px` (4-col), tablet `768–1199px` (8-col), desktop `≥1200px` (12-col).

**Implementation.** Native CSS Grid; no Tailwind. A `.grid` container at the layout level:

```css
.grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  column-gap: var(--gutter);
  padding-inline: var(--outer);
}
```

with `--cols`, `--gutter`, `--outer` defined per breakpoint via CSS custom properties. Children take `grid-column: <start> / <end>` to occupy specific column ranges (see §8).

**Where the grid is visible.** Work page tiles (the grid *is* the layout); a small Raleway-caps section index in the margin on project pages (`01 / EXPLORATION`-style, on the outer edge). Nowhere else. No hairline columns, no decoration.

## 4. Typography on the grid

**Two faces.** Both disciplined to the 8px baseline.

- **Playfair Display Regular** — display moments only. Project names, the homepage statement, the project-page header. Used sparingly; this is the editorial voice.
- **Playfair Display Italic** — pull-quotes only.
- **Raleway** — everything else. Body copy, labels, kickers, nav, metadata, factual lines, captions. Used at two weights (Regular 400 for body, Medium 500 for uppercase labels) — and only those two; do not load thin/light weights.

| Role | Face & weight | Treatment | Size / line-height |
|---|---|---|---|
| Display (homepage statement, project header) | Playfair Display Regular | — | 56 / 64 desktop · 40 / 48 tablet · 32 / 40 mobile |
| H1 (project name on page) | Playfair Display Regular | — | 40 / 48 |
| H2 (sparingly) | Playfair Display Regular | — | 28 / 32 |
| Pull quote | Playfair Display Italic | — | 32 / 40 |
| Body | Raleway 400 | — | 17 / 28 |
| Body small / caption | Raleway 400 | — | 14 / 24 |
| UI label / kicker | Raleway 500 | uppercase, letter-spacing 0.2em | 12 / 16 |
| Nav link | Raleway 500 | uppercase, letter-spacing 0.2em | 12 / 16 |
| Slide index, metadata, factual lines | Raleway 500 | uppercase, letter-spacing 0.2em | 12 / 16 |

Notes:
- **Letter-spacing on caps is non-optional.** Raleway's letter widths aren't uniform like Plex Mono's were, so without 0.2em letter-spacing the caps read crowded; with it they read structural. Tune slightly per visual; do not drop below 0.18em or above 0.25em.
- **Medium (500) for caps, not Regular.** Regular-weight uppercase Raleway looks thin and lifestyle-y; Medium gives it presence as a structural face.
- Bodies flush-left, ragged-right. No justified type anywhere.
- Load Raleway from Google Fonts (or self-host) — **only the 400 and 500 weights**, only Latin subset. Playfair Display Regular and Italic. Four files total. Pin versions in the font URL.

## 5. Palette

Unchanged from the existing system, with one addition for grid-visible moments:

- Page ground: per existing homepage CONFIG (`bgColor` — currently `#FFFFFF` per the screenshot; CLAUDE.md still records `#F4F3EF`. Confirm with Court once and reconcile both).
- Text: `#161616`.
- Accent: existing deep red (single-accent discipline holds).
- Hairline gray (new, very limited use): `#E5E5E5` — for the project-tile cell borders on the Work page only. Nowhere else.

## 6. WebGL × grid integration

- **Homepage.** The CG hero stays exactly as built (locked CONFIG, all behaviours preserved). It is full-bleed and z-fixed; the grid governs everything overlaid on it (nav, intro section after scroll, carousel, footer) and everything below it. The hero's particle geometry (Playfair-derived) is unchanged; only the overlaid UI's typography shifts to Raleway.
- **Work page.** Optional **WebGL ambient layer** — a very low-density particle field as background texture, non-interactive, no cursor response, no rotation. Defaults to **disabled** for the first build; the slot is there to enable later. The project grid is the focus.
- **Project pages.** Each template includes an optional **interactive moment** slot — a place where a small project-specific WebGL/interactive element can sit later (Spider-209 mechanism, LUMI screen-time response, Mantis articulation). For this build, the slot is just defined in the template and left empty per page; building the per-project interactions is a future task explicitly out of scope.

Principle: the grid contains; WebGL animates within deliberate moments. Not everywhere. Not decoratively.

## 7. Framework — Astro

Astro project initialised at the repo root `~/code/courtgranville/`. The existing `prototypes/hero/index.html` is preserved (do not delete) but the site moves to the Astro structure.

```
src/
  components/
    Layout.astro
    Nav.astro
    Footer.astro
    Grid.astro              ← the 12-col container
    Hero.astro              ← the WebGL hero (client:load island)
    blocks/
      SectionLabel.astro
      Text.astro
      PullQuote.astro
      ImageSingle.astro
      ImagePair.astro
      ImageGrid.astro
      SpecList.astro
  content/
    config.ts               ← content collection schema for projects
    projects/
      spider-209.md
      backgammon.md
      lumi.md
      mantis.md
      wave.md
      universal-phone-case.md
      yourpal.md
  pages/
    index.astro             ← homepage
    work/
      index.astro           ← Work index
      [slug].astro          ← project page route, content-driven
  styles/
    tokens.css              ← grid, type, color, baseline as CSS vars
    fonts.css               ← Playfair + Raleway @font-face / Google Fonts import
    global.css
public/
  assets/
    projects/<slug>/...     ← processed images per project
```

Pin Astro to the latest stable minor (verify current version; document the pinned version in `package.json`). The WebGL hero loads as a client island (`client:load`); its existing module script and three.js + Lenis imports come across as-is, with no changes to the WebGL behaviour or CONFIG. Routing is file-based: `/`, `/work/`, `/work/<slug>/`. Load Raleway 400 + 500 and Playfair Display Regular + Italic only — no other weights.

## 8. The block model — project page composition

Each project page is composed from frontmatter (metadata) plus an ordered array of **blocks**. Block types and their grid-column behaviour at desktop (12-col):

| Block | Default columns | Notes |
|---|---|---|
| `SectionLabel` | 1 / 3 | The Raleway-caps kicker (`01 / EXPLORATION`), sits in the outer margin |
| `Text` | 3 / 9 | Body prose (Raleway 400), comfortable measure (~62ch) |
| `PullQuote` | 5 / 12 | Playfair italic, offset right |
| `ImageSingle` (narrow) | 3 / 9 | Inline reading-width image |
| `ImageSingle` (wide) | 2 / 12 | Bleeds to outer margin |
| `ImageSingle` (full-bleed) | 1 / -1 | Edge-to-edge, breaks the grid deliberately |
| `ImagePair` | 2 / 12 | Two side-by-side, equal cells with gutter |
| `ImageGrid` (3-up) | 2 / 12 | Three across |
| `ImageGrid` (4-up) | 2 / 12 | Four across, smaller cells |
| `SpecList` | 9 / 13 | Raleway-caps factual block (year, discipline, tools, materials), tucked right |

Block specs flex predictably at tablet (8-col) and mobile (4-col, mostly stacked single-column). The block array per project is rendered as a vertical sequence within the grid container; the scaffold (§4 of the project-pages plan: problem → exploration → decisions → making → resolved → reflection) is realised as a sequence of `SectionLabel` + content blocks.

## 9. Content extraction *(agent task — unless copy is supplied directly)*

**If Court has supplied extracted copy** at `~/code/courtgranville/docs/portfolio.md` (or as a set of per-project markdown files in `src/content/projects/`), skip the pandoc extraction; use the supplied copy verbatim, applying §10 image work alongside. Note the per-project frontmatter and block arrays may need to be assembled from the supplied prose; the §9 hard rules below still govern that assembly.

**Otherwise:** locate the portfolio source — likely `~/code/courtgranville/portfolio.docx` or `~/Desktop/003_academics/Portfolio/Court_Granville_Portfolio.docx`; search if needed; ask Court if not found. Convert to markdown with pandoc:

```
pandoc Court_Granville_Portfolio.docx -o docs/portfolio.md \
  --extract-media=./docs/portfolio-media
```

Parse the markdown into per-project sections by project name. For each project, map the extracted prose to the scaffold sections (problem, exploration, decisions, making, resolved, reflection). Output a content-collection markdown file per project at `src/content/projects/<slug>.md` with frontmatter and the block array.

### Hard rules for the copy

These determine whether the pages succeed or fail. Apply them strictly:

1. **Do not invent.** If the source doesn't cover a scaffold section, omit that section. Better a shorter, honest page than a padded one. *Do not write process detail, decisions, failures, or reasoning that aren't in the source.*
2. **Strip hype adjectives.** If the source contains words like "stunning", "innovative", "passionate", "cutting-edge", "amazing" — remove them; replace with concrete detail from the source where possible, else delete the sentence. The principle: specificity over assertion (project-pages plan §3).
3. **Preserve specificity.** Where the source names tools, materials, processes, dimensions, numbers, manufacturers, designers — keep them exactly. Specificity is the texture of competence.
4. **Voice.** First person, considered, plain. Same voice as the homepage intro. No exclamation marks. Restraint.
5. **Per-project framing.** Each project's page header line (the one-line under the project name) should reflect the project-pages plan §2 angle for that project (Spider-209: fabrication fidelity / learning from a master; LUMI: critical/conceptual; Mantis: mechanism; etc.). If the source's framing is generic, replace it with a line that reflects the §2 angle — but again, only assert what the source supports.
6. **Honesty about scope.** Where a project is image-thin (Mantis, LUMI) or source-thin, the page will be short. That is the correct outcome.

## 10. Image analysis & ordering *(agent task)*

Per project folder under `assets/projects/`:

1. **Inventory.** List all images.
2. **Categorise** each by content (sketch / CAD / prototype / process / final / studio). Use filename heuristics first; open and visually inspect any image whose category is ambiguous from the filename. (You have file-viewing tooling — use it.)
3. **Map** categories to scaffold sections: sketches → Exploration; CAD + prototype + process → Making & Iteration; final + studio → Resolved.
4. **Order within each section.** Prefer (a) any explicit numeric ordering in filenames, then (b) chronology by file mtime, then (c) visual logic: wide context shots before details; rough/early before refined/late; assembled wholes before disassembled parts; sketches before models before prototypes before finals.
5. **Convert** `.heic` files to `.webp` (preferred) or `.jpg`. Convert all camera-default-name files and WhatsApp-named files to clean ordered slugs.
6. **Rename** to a clean numbered convention: `01-sketch-arm.webp`, `04-cad-bracket.webp`, `08-prototype-03.webp`, `12-final-detail.webp`. Lowercase, ASCII only, hyphens, no spaces or parens.
7. **Compress** for web. Target: hero/full-bleed ≤ 250 KB; inline ≤ 150 KB. Don't ship multi-MB originals.
8. **Generate** a `srcset` set per image at 1×, 2× (and 3× where useful) widths.
9. **Move and rename folders** to clean slugs: `lamp (LUMI)` → `lumi/`, `lamp (MANTIS)` → `mantis/`, `lamp (SPIDER-209)` → `spider-209/`, `muji` → `universal-phone-case/` (per the canonical name; see §13), keep `backgammon/`, `speaker/` → `wave/`, `yourpal/`.
10. **Move source PDFs and docx** out of the web tree to `docs/projects/<slug>/source/` — they are writing fuel, not site assets.
11. **Update** the per-project content-collection markdown to reference renamed images in the block array.

## 11. The Work page

The project index. The grid *is* the layout.

- **Desktop (12-col):** three project tiles per row, each spanning 4 columns. Optionally, occasional 6-column "feature" tiles for the project being most prominent. Default: even 4-col tiles.
- **Tablet (8-col):** two per row (each 4-col).
- **Mobile (4-col):** one per row (full 4-col width).

Per tile: hero image (object-fit: cover), project name in Playfair (24/32), then a Raleway-caps meta line below (`2026 · PRODUCT DESIGN` etc., Raleway 500 12/16 letter-spaced 0.2em). Vertical rhythm at multiples of 8.

Subtle Swiss marginalia: a thin `#E5E5E5` hairline along the bottom of each tile row only (not vertical between cells). A small Raleway-caps project number in the margin to the left of each row (`01`, `02`...). Restrained — these are the only grid-visible flourishes.

Hover: subtle image scale to 1.02 over 400ms with the `--ease-out` curve; project name shifts to deep-red. Click → `/work/<slug>/`.

Order: most recent first by default. The seven projects with their years:
- The Nuclear Question (2026, thesis — *exclude from Work*; it belongs to the blog/thesis track) → not listed here
- Mantis (2026)
- Wave (2026)
- Gravity Wave Backgammon (2024)
- LUMI (2023)
- YourPAL (2023)
- Spider-209 (2022)
- Universal Phone Case (2022)

Seven on the Work page. Most-recent first as the default order.

WebGL ambient layer: slot exists, **disabled** by default (see §6).

## 12. Homepage retrofit

Port the existing homepage at `prototypes/hero/index.html` into Astro structure at `src/pages/index.astro`. Re-arrange onto the grid; do not rewrite content or change behaviour; **swap all Plex Mono usage to Raleway** per §4.

- The WebGL hero → `<Hero client:load />`, full-bleed, **locked CONFIG verbatim**, all behaviour preserved.
- The nav → global `<Nav />` component. All behaviours preserved (fade-in after load-in, scroll backdrop, hover underline-wipe, brand home anchor). **Nav links retype from Plex Mono to Raleway 500 uppercase letter-spaced 0.2em.** The brand "Court Granville" stays in Playfair Display Regular.
- Intro section → grid-aligned: `SectionLabel` cols 1/3 (Raleway-caps margin kicker), Playfair statement cols 3/9, **Raleway-caps factual line cols 3/12** (re-typed from Plex Mono), `About →` link cols 3/5 (Raleway).
- Carousel → ports as-is. Its full-bleed character is preserved (a deliberate full-bleed moment that the grid contains by surrounding above and below). **Slide metadata (year · discipline · slide index) retypes from Plex Mono to Raleway 500 caps letter-spaced 0.2em.** The carousel's prev/next arrow buttons unchanged.
- Footer → global `<Footer />` component. Email link unchanged behaviour; **footer text retypes from Plex Mono to Raleway**.
- SCROLL cue: retypes from Plex Mono to Raleway 500 caps letter-spaced 0.2em, all behaviours preserved (the 90px scroll-fade, the load-in fade-in).
- Smooth scroll (Lenis), reveals (IntersectionObserver), hero pause off-screen, `prefers-reduced-motion`, focus-visible styling — all preserved.

**The hero's particle geometry is Playfair-derived and unchanged.** The Raleway swap touches only the overlaid HTML/CSS UI, not the WebGL.

**Do not change** the hero CONFIG, the carousel motion, the nav behaviours, or the reveal language during the port. The typography swap is the only visible delta — anything else that renders differently after port is a regression to fix, not an intentional change.

## 13. Project canonical names

- `muji` folder → project name **"Universal Phone Case"**. Use this name on both the homepage carousel (replace the current "Wabi Sabi" entry) and the Work index and the project page header. The MUJI brief context and the wabi-sabi concept go in the body copy, where they can be explained honestly. (If Court has specified differently, use Court's choice — but both surfaces must match.)
- `speaker` folder → project name **"Wave"** on all surfaces.
- The other names match their existing carousel entries.

## 14. Phased sequencing — checkpoints

**Pause at each checkpoint. Wait for Court's go-ahead before continuing.**

### Phase 1 — Foundations

- Initialise Astro at the repo root; pin version; commit a clean baseline.
- Load Playfair Display Regular + Italic and Raleway 400 + 500 only (`fonts.css`).
- Implement `tokens.css` (grid vars, type scale per §4, color, baseline).
- Build the `<Grid>`, `<Layout>`, `<Nav>`, `<Footer>` components — grid-disciplined, no content yet, **typography per §4**.
- Port the WebGL hero into `<Hero client:load />` as a verbatim transplant of the WebGL particle system. Confirm it renders identically.
- Confirm the grid behaves correctly at all three breakpoints.

**Checkpoint 1.** Court verifies: the Astro site builds and runs; the homepage WebGL hero renders identically to the current `prototypes/hero/index.html` (same CONFIG, same feel); Playfair Display + Raleway both load and render at the spec'd weights; the empty grid wrapping renders correctly at mobile / tablet / desktop. Court greenlights → Phase 2.

### Phase 2 — Homepage retrofit + Work page

- Port the homepage's intro, carousel, footer onto the grid (§12). All behaviours preserved; **Plex Mono → Raleway swap completed throughout the overlay**.
- Build the Work index page (§11) with **placeholder content** for the seven project tiles (project names, years, disciplines, placeholder image blocks — same approach as the original homepage carousel's pre-image state).
- Wire navigation: nav links to `/work/`, brand to `/`, footer links match.

**Checkpoint 2.** Court verifies: the homepage's feel is preserved (carousel motion, hero pause, nav transition, intro line-breaks at 24ch); the Raleway swap reads correctly (caps not crowded, body comfortable at 17/28); the Work index reads as a coherent Swiss-grid composition at all breakpoints. Court greenlights → Phase 3.

### Phase 3 — Content extraction + project pages

- Use Court-supplied `docs/portfolio.md` if present (§9), else extract from `Court_Granville_Portfolio.docx` via pandoc.
- For each of the seven projects, run image analysis and ordering (§10): inventory, categorise, order, convert, rename, compress, srcset.
- Generate seven `src/content/projects/<slug>.md` content-collection files with frontmatter + block arrays.
- Build the project-page route `src/pages/work/[slug].astro` that renders the block array for any project.
- Render all seven project pages; QA each.
- Update the homepage carousel and Work index to reference real hero images and the canonical project names (§13).

**Checkpoint 3.** Court reviews each project page. Pages that read thin (Mantis and LUMI are expected to) get marked for future re-shoot or rewrite. Any factual or voice corrections noted for a follow-up pass.

## 15. Honest scope — what this build does not deliver

- **Process narratives deeper than the source.** The extraction is bound by the docx (or supplied markdown). Where the source is uneven on process, the pages will be uneven on process. The build does not invent process detail; that's correct behaviour, not a bug.
- **Behaviour shots / images that don't exist.** LUMI has no screen-time-response imagery on disk. The page will not have any. Re-shoots remain the lever.
- **Per-project interactive moments.** Spider-209's mechanism animation, LUMI's screen-time interaction, Mantis's articulation animation — the template *defines a slot* for these; building them is a future task explicitly out of scope here.
- **Mobile polish beyond functional.** Layouts must remain unbroken at all breakpoints; full mobile-tuned interaction polish is out of scope.
- **Visible delta to the existing homepage.** The Plex Mono → Raleway swap changes the look of the nav, kickers, factual line, slide metadata, footer text and scroll cue. This is intentional and per spec, but worth knowing on first view post-port — it's not a regression.

## 16. Success criteria

1. Astro site builds and deploys without warnings.
2. Existing homepage hero WebGL, behaviours and overall feel are preserved exactly — the only visible delta is the Mono → Raleway typography swap (per spec).
3. Swiss-grid + WebGL hybrid reads as one coherent language across `/`, `/work/`, `/work/<slug>/`.
4. The grid is mostly invisible; visible only on the Work page and the project-page section indices.
5. Each of seven project pages renders with extracted-and-cleaned copy plus correctly ordered, web-optimised images, and reflects its §2 angle where source supports it.
6. Pages where source is thin are short and honest, not padded or invented.
7. Accessibility (semantic landmarks, focus-visible, keyboard nav, alt text, `prefers-reduced-motion`) and performance (lazy-loading, srcset, paused WebGL off-screen) are upheld throughout.
