# Project Pages — Copy & Build Plan

> Covers the seven design projects in the Work section: their pages, the copy, the images, and the build. The thesis ("The Nuclear Question") is not here — it belongs to the blog/thesis track. Read alongside `CLAUDE.md` for the design system.

## 1. Folder audit

All seven folders exist and are reachable. They map as follows:

| Folder | Project | Suggested slug |
|---|---|---|
| `backgammon` | Gravity Wave Backgammon | `backgammon` |
| `lamp (LUMI)` | LUMI | `lumi` |
| `lamp (MANTIS)` | Mantis | `mantis` |
| `lamp (SPIDER-209)` | Spider-209 | `spider-209` |
| `muji` | MUJI universal phone case | `muji-case` |
| `speaker` | Wave (speaker enclosure) | `wave` |
| `yourpal` | YourPAL | `yourpal` |

Two findings:

**Naming.** Three folders use `lamp (NAME)` — spaces and parentheses. As asset paths these must be URL-encoded (`lamp%20%28LUMI%29`) everywhere they're referenced; fragile and ugly in code. Rename the folders to the clean slugs in column three, and the files inside them too (see §6).

**Coverage — confront this first.** The folder metadata indicates these are *lightly populated* — directory sizes consistent with only a handful of files each. I can't enumerate the exact contents with the tools available here, so step one is a directory listing (§7) for a precise audit. But the likely finding matters, so name it now: **a process-focused page is image-driven, and a few finished shots will not carry one.** A page that walks problem → exploration → decisions → making → outcome realistically needs 10–20+ images per project, spanning sketches, CAD, prototypes, tests and finals. Where a folder holds only three hero shots, the honest options are (a) build a thin page — which makes the work look *slighter* than it is — or (b) go back and document the process: re-photograph prototypes and models, scan sketchbooks, screenshot working CAD, export iteration stages. For most of these, (b). Closing the image gap is the real first task; copy and build both wait on it. §5 builds that in.

## 2. Positioning — the seven as one argument

The portfolio is not seven pages; it is one case made seven times. You asked that it make you look like an amazing, unique designer — that is achieved by *curating the set*, not by inflating each project. Two things the set must land:

**Range** — across the seven: product/industrial design, digital fabrication, critical/conceptual design, and UX. A designer fluent across all four is rare; the set should make that obvious at a glance.

**A through-line** — every project shows rigor, a genuine process, comfort with the technical, and your particular gift: translating something complex into something resolved. The brand/strategy mind from the Christie's and Big Fish years shows up too, as fluency with audience, constraint and language.

So each page has a *job* — one facet it carries for the whole. Write each conscious of its job, so seven pages don't blur into one:

- **Spider-209** — fabrication fidelity, and the confidence to *learn by replicating a master*. Reproducing a Joe Colombo lamp is not a beginner's move; it says you value understanding over novelty. Carries: craft, precision, technical making.
- **LUMI** — critical and conceptual design. A lamp that responds to screen time is a *position* on attention and technology, not just an object. Carries: ideas, criticality, designing for behaviour. (A quiet rhyme with the thesis's interest in contested technology.)
- **Mantis** — mechanism. The articulation: joints, balance, counterweight, the engineering of motion. Carries: mechanical rigor, hard physical problems solved.
- **Gravity Wave Backgammon** — digital fabrication and material. CNC, tolerances, an heirloom object. Carries: CAM/CNC skill, material sensibility, precision craft.
- **MUJI universal phone case** — design for manufacture, and designing *inside a brand's language*. A universal case is a genuine constraint problem; doing it in MUJI's voice shows brand fluency and the discipline of restraint. Carries: DFM, constraint-driven design, brand fluency.
- **Wave** — form and function as one thing. An enclosure is an acoustic instrument and an object at once. Carries: technical-led form, audio, research.
- **YourPAL** — the UX discipline. Research, problem definition, flows, prototyping, testing. Carries: digital range, the research/strategy mind.

(Naming: the homepage carousel currently lists a project as "Wabi Sabi". Confirm whether that is the MUJI case under a concept name, or a separate project — the Work section and the carousel must use identical canonical names.)

## 3. How the copy makes you look exceptional

Worth being precise about how copy actually does this — because the intuitive approach backfires, and as someone whose thesis is about credible versus hollow messaging, you already know why.

It is *not* done with adjectives. "Innovative", "stunning", "passionate", "cutting-edge" are what weak portfolios reach for, and a reader discounts them on sight — they signal the opposite of what they claim.

It is done by *showing*:

- **Specificity.** Real numbers, named materials, named tools, exact constraints, actual processes. "Machined from a single oak billet, tolerances held to 0.1 mm" beats "beautifully crafted" — concrete detail is the texture of competence.
- **Decisions with reasoning.** Every project has two or three pivotal choices. Show the choice, the alternative, and *why*. That is the sound of a designer thinking, and it is the most persuasive thing on the page.
- **Honest difficulty.** Name what was hard, what failed, what you would change. This reads as *senior*, not weak — juniors hide failure, experienced designers analyse it.
- **A point of view.** Opinions; a stance on the brief, the discipline, the object. Range plus a coherent point of view is what "unique" actually means.
- **Restraint.** Confident, concise prose. Saying less, precisely, reads as authority — and it matches the site's editorial character.

Voice: first person, considered, plain — the same voice as the homepage intro. No exclamation marks, no hype.

The difference, in one example:

> *Weak:* "For this project I designed a stunning and innovative desk lamp with a beautiful articulating arm that showcases my passion for product design."
>
> *Strong:* "The brief was a desk lamp; the real problem was the arm. It had to hold any position without a knob to tighten — so the friction had to live in the joint geometry itself. Three prototypes in, I was still chasing the balance between a joint that drifted and one that took two hands to move."

Same project. The second tells you the writer is a designer. The first tells you nothing.

## 4. The page scaffold

One structure, used by all seven, so the Work section feels coherent. It is process-first by construction — the finished object resolves only near the end; most of the page is the thinking.

1. **Header** — project name, a one-line *frame* (not a description), meta line (year · discipline · context), one strong opening image.
2. **The problem** — the brief, the provocation, the self-set challenge; what made it worth doing or hard. *Open on the problem, never the solution.*
3. **Exploration** — research, references, sketches, early directions. Crucially, the directions *considered and rejected*, and why. (Sketch / mood / early-CAD imagery.)
4. **Key decisions** — the two or three pivotal choices, each with its reasoning and trade-off. The designer's-mind section.
5. **Making & iteration** — prototypes, tests, failures, what each taught. CAD, models, fabrication, CNC, test pieces. (The richest image section — the "hands".)
6. **Resolved** — now the finished object. The considered shots. What it does, the details that reward attention, what it achieved against the problem in §2.
7. **Reflection** — short. What you would change, what it taught, where it could go. Honest and brief; signals maturity.

The scaffold flexes by discipline: for YourPAL, §3 is user research and flows and §5 is wireframes and usability testing; for Spider-209, §5 is the heart of the page and §4 is fabrication strategy. Same spine, discipline-appropriate content.

## 5. Writing the copy — workflow

Good process copy cannot be written without the process substance, and that substance is yours — the briefs, the rejected directions, the failures, the decisions. So:

**Per-project intake.** For each project, answer the questions below — bullets are fine. They are built to surface exactly what the scaffold needs, and they double as an image inventory.

1. The brief or starting point — assignment, self-set, a question? What made it worth doing?
2. Hard constraints — technical, material, time, brief.
3. Research and references — what shaped the direction?
4. Directions explored and *rejected* — and why.
5. The two or three pivotal decisions — and the reasoning / trade-off behind each.
6. What you prototyped or tested — and the iterations it went through.
7. What went wrong — failures, dead ends, breakages — and what each taught.
8. Tools, software, processes, materials actually used — be specific.
9. The resolved outcome — what it does, what you are proudest of.
10. If you did it again — what would change; what it taught you.
11. Image inventory — what process material exists (sketches, CAD, WIP photos, prototypes), and what could still be created or recovered.

Your existing portfolio document is raw material for 1–10 — reuse it, don't restart. Question 11 is the one that decides whether a page can be built well yet.

**Then:** I draft each page to the scaffold; you edit for voice and accuracy.

**Do one project end to end first** — copy, images, page. It proves the scaffold, the voice and the template before the other six. Suggested pilot: **Mantis** — recent, and a mechanism project is naturally process-rich — but pick whichever you have the most process documentation for, since that is the real constraint.

## 6. The build

**This is the framework move.** Seven content-rich project pages, plus a Work index, plus the homepage, is a multi-page site — it needs routing, a shared layout, real components and a content model. That cannot live in the single hand-coded `index.html`. This is Phase 3 of your roadmap, and the project pages are simply what triggers it. Recommended: **Astro** — it suits a mostly-static, content-led site, and the WebGL hero ports in cleanly as a client-side script on the home route. (It also sets up the git-based CMS option from our last conversation — Astro + Keystatic — for whenever you want it.)

**One template, not seven pages.** A single project-page template, driven by per-project content. Each project's page is an ordered list of **content blocks**:

- `section-label` (the mono kicker), `text` (a section's prose), `pull-quote` (a key line, set large)
- `image` (single — inline / wide / full-bleed, optional caption), `image-pair` (two side by side — good for rejected-vs-chosen, before-vs-after), `image-grid` (three or more — sketch sets, process runs)
- `spec-list` (the factual block — year, discipline, tools, materials)

A project becomes a metadata object plus a block array. Shared components give a coherent site; free ordering lets each project's narrative differ. This block array is also exactly the content model a CMS would later formalise — sitting in the repo, where Claude Code reads it.

**The Work index** — the page the homepage carousel links to. Lists all seven, links to each. It can reuse the homepage's full-bleed language or go to a grid (the *tux* reference). Specced alongside the template; lighter than the project pages.

**Images.** Rename folders and files to clean slugs and meaningful, ordered names — `01-sketches.jpg`, `05-cad-arm.jpg`, `09-prototype-03.jpg`, `14-final.jpg`. Meaningful names matter: they are how blocks reference images and how the narrative order stays legible. Compress before committing; the template uses responsive `srcset` and lazy-loading (the carousel already lazy-loads).

**Sequencing.**

1. Close the image gap for the pilot project (§5, Q11).
2. Framework move: scaffold Astro, port the homepage in as the home route.
3. Build the project-page template and block components, proven on the pilot project's real copy and images.
4. Build the Work index.
5. Populate the remaining six projects (copy + images) into the template.

The Claude Code build spec — the equivalent of the homepage spec — gets written at step 3, once the pilot's copy and final images exist. A process page is copy- and image-driven; the build cannot sensibly run ahead of them.

## 7. What I need from you next

1. **A directory listing**, so I can audit the images precisely:
   `ls -R "/Users/courtgranville/code/courtgranville/assets/projects"`
   Paste the output.
2. **The §5 intake for the pilot project** — Mantis, or whichever project you have documented best.

With those two, I can audit the real image set, draft the pilot page's copy, and write the Claude Code build spec for the template.
