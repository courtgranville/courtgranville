# Project pages — editorial content output

> The §9 editorial pass on the seven Work projects, applied to the markdown converted from `Court_Granville_Portfolio.docx`. Each project: YAML frontmatter (canonical fields for Astro content collection) plus an ordered block sequence. The agent fills image-block `src` fields during the §10 image pass by matching `role` (sketches / cad / prototype / process / final / studio) to the categorised images in each project's folder.
>
> Save this in `~/code/courtgranville/docs/`. The agent splits each `## project-slug` section into the corresponding `src/content/projects/<slug>.md` during Phase 3, dropping the heading wrappers.
>
> **One note on the angles.** The project-pages plan's §2 assigned each project a positioning angle. Five of seven held against the source as written. **Mantis** was reframed: the plan's "mechanism / engineering of motion" angle is not in the source — the doc describes a found-object transformation, not an articulating mechanism. Mantis is re-positioned around the transformation brief and its exhibition selections (IE School of Architecture and Design final + the Meyrit Biennale, Madrid), which are the strongest signals in the source. **YourPAL** was kept on its UX angle but with the page tightly bounded to what the source actually carries. **LUMI** is honest about the screen-time-response behaviour being designed for but not implemented.
>
> The thesis project ("The Nuclear Question") is excluded from this output — it belongs to the blog/thesis track per the build spec §11.

---

## spider-209

```yaml
name: "Spider-209"
year: 2022
discipline: "Product Design"
slug: "spider-209"
group: true
framing: "A desk-lamp version of Joe Colombo's 1965 Spider, fabricated from materials found on the streets of Madrid."
hero_role: "studio"
```

### Blocks

1. **SectionLabel** — `01 / THE BRIEF`
2. **Text** (span 3/9):
   > Our first product design project at IE University. The brief: take a well-known lamp design and reproduce it, using only materials found or recycled from the streets of Madrid. We chose Joe Colombo's Spider — a 1965 design for O Luce — and adapted it from its original ceiling form into a desk lamp, built from the ground up in metal, plastics, wood and electronics.

3. **SectionLabel** — `02 / PROCESS`
4. **Text** (span 3/9):
   > Research and drawings first — studying the original closely enough to reproduce it from scrap. Then a cardboard prototype to check proportions and assembly. Then the working build.

5. **ImageGrid** (2-up, span 2/12) — `role: sketches` — alt: "Hand sketches studying the original lamp's proportions"
6. **ImageSingle** (wide) — `role: prototype` — alt: "The cardboard prototype, before the final build"

7. **SectionLabel** — `03 / RESOLVED`
8. **Text** (span 3/9):
   > The finished desk lamp: Colombo's form, reproduced from what we could find.

9. **ImageSingle** (full-bleed) — `role: studio` — alt: "The finished Spider-209 desk lamp"

---

## universal-phone-case

```yaml
name: "Universal Phone Case"
year: 2022
discipline: "Product Design"
slug: "universal-phone-case"
group: true
framing: "A brief from MUJI's design language, met by a 3D-printed iPhone case engineered to fit every model from the SE to the 14."
hero_role: "final"
spec:
  brief: "design a product MUJI could sell"
  concept: "Wabi Sabi — beauty in serenity, simplicity and imperfection"
  range: "iPhone SE — iPhone 14"
  material: "flexible 3D-printing filament"
```

### Blocks

1. **SectionLabel** — `01 / THE BRIEF`
2. **Text** (span 3/9):
   > An early studio project — the first to introduce our class to 3D modelling. The brief was to design something MUJI could sell, in MUJI's "this will do" design language.

3. **SectionLabel** — `02 / CONCEPT`
4. **Text** (span 3/9):
   > We named the project Wabi Sabi — the Japanese principle of beauty in serenity, simplicity and imperfection — and worked toward an object that would be honest in form and useful in function: a universal phone case.

5. **SectionLabel** — `03 / KEY DECISIONS`
6. **Text** (span 3/9):
   > Two decisions defined the project. The first was scope. We wanted a case that fit *every* phone; budget and time pulled that back to iPhones, and within iPhones, the range from the SE up to the 14 — the most recent model at the time. The second was material. We chose a flexible 3D-printing filament: its give meant the same case could expand and contract to fit different phone sizes, and as a second-order property, it absorbed impact better than the brittle standard filaments. That second property became a design feature on its own — padded corners, the only addition we allowed ourselves on top of the bare case form.

7. **ImageGrid** (3-up, span 2/12) — `role: process` — alt: "Iteration shots from the print runs, November 2022"

8. **SectionLabel** — `04 / RESOLVED`
9. **Text** (span 3/9):
   > A working prototype that fits every iPhone from the SE to the 14, made from one material, with one functional addition.

10. **ImageGrid** (3-up, span 2/12) — `role: final` — alt: "The finished case across the phone range"
11. **ImageSingle** (full-bleed) — `role: final` — alt: "Detail of the case on an iPhone"

---

## lumi

```yaml
name: "LUMI"
year: 2023
discipline: "Product Design / Critical Design"
slug: "lumi"
group: false
framing: "A critical-design lamp, designed to support people managing screen-time, ADHD and anxiety — my first product modelled and 3D-printed end to end."
hero_role: "final"
```

### Blocks

1. **SectionLabel** — `01 / THE BRIEF`
2. **Text** (span 3/9):
   > The brief, as set: *"To design a product that encourages a responsible use of social media, raising questions about our addiction to them."* My concept became a lamp that could benefit people managing any combination of three related issues — ADHD, anxiety, and social-media addiction.

3. **SectionLabel** — `02 / MAKING`
4. **Text** (span 3/9):
   > My first product designed entirely in 3D modelling. The fabrication primary techniques were 3D-printed threaded parts that screwed together, and internal components modelled to house LED lighting strips intended to be controlled by an app or custom software.

5. **ImageGrid** (3-up, span 2/12) — `role: cad` — alt: "Threaded-part details from the 3D model"

6. **SectionLabel** — `03 / RESOLVED`
7. **Text** (span 3/9):
   > The artefact: a working lamp object, designed for the screen-time-responsive behaviour but not yet implementing it. The software side remains open — the next stage of the project rather than this one.

8. **ImageSingle** (full-bleed) — `role: final` — alt: "The finished LUMI lamp"
9. **ImageSingle** (wide) — `role: final` — alt: "Detail of the threaded-part construction"

---

## yourpal

```yaml
name: "YourPAL"
year: 2023
discipline: "App Design / UX·UI / Interaction Design"
slug: "yourpal"
group: true
framing: "A productivity app concept for students — an introduction to Figma, and to user-journey thinking, built around the rhythm of an academic week."
hero_role: "final"
```

### Blocks

1. **SectionLabel** — `01 / THE PROBLEM`
2. **Text** (span 3/9):
   > A study companion for students, built to address the three failure modes of the undergraduate week: procrastination, burnout, and timekeeping. The premise was an AI-assisted personal assistant that learns the user's work habits, identifies their peak productivity hours, and builds schedules around them — integrating assignment management with a broader sense of wellbeing.

3. **SectionLabel** — `02 / APPROACH`
4. **Text** (span 3/9):
   > The project was our introduction to Figma and to UX/UI thinking, with a focus on the user journey — mapping how a student moves through the app over the course of a day, a week, a term.

5. **ImageGrid** (3-up, span 2/12) — `role: process` — alt: "Iteration shots — flows and screen drafts"

6. **SectionLabel** — `03 / RESOLVED`
7. **Text** (span 3/9):
   > Wireframes, flows and a functional Figma mockup — the foundation for what an iterative build would refine.

8. **ImageSingle** (full-bleed) — `role: final` — alt: "Composite of the YourPAL screens"
9. **ImageGrid** (3-up, span 2/12) — `role: final` — alt: "Key screens — the dashboard, the schedule, the wellness view"

---

## backgammon

```yaml
name: "Gravity Wave Backgammon"
year: 2024
discipline: "Product Design"
slug: "backgammon"
group: true
framing: "A backgammon board CNC'd from a single 1m × 1m sheet of recycled plastic, with the playing grid hidden in the material itself."
hero_role: "final"
spec:
  client_brief: "Gravity Wave — recycled-plastic material"
  constraint: "1m × 1m sheet, single material"
  insight: "1–3mm thickness allows light transmission"
```

### Blocks

1. **SectionLabel** — `01 / THE BRIEF`
2. **Text** (span 3/9):
   > A brief from Gravity Wave, the company that makes the recycled-plastic material. The instructions were short and a little provocative: take a 1m × 1m board of this material and increase its value in some way.

3. **SectionLabel** — `02 / WHY BACKGAMMON`
4. **Text** (span 3/9):
   > We chose to make a backgammon board for two reasons. The material had unusual visual characteristics — translucency, depth, an earthy tonal range — that belonged to an object you would want to look at for hours. And backgammon boards have a long tradition of craftsmanship and value: an object that takes well-made well.

5. **SectionLabel** — `03 / THE KEY DECISION`
6. **Text** (span 3/9):
   > The brief had a constraint that should have been a problem: nothing on the board could be made from anything but the material itself. No inlays, no paint, no second material to distinguish the dark and light triangles that define a backgammon field. We had to find a way to render the playing grid using only the single material.

7. **Text** (span 3/9):
   > We noticed that if we CNC'd the material down to a thickness between 1 and 3 millimetres, varying degrees of light could pass through it. From there: a 3D model of the board with indented sections corresponding to the dark and light triangles, alternating layer thickness so that backlighting would render the pattern on the surface — while the surface itself stayed entirely flat and smooth.

8. **ImageGrid** (3-up, span 2/12) — `role: cad` — alt: "3D model — the alternating-thickness backgammon grid"

9. **SectionLabel** — `04 / MAKING`
10. **Text** (span 3/9):
    > Initial prototypes were 3D-modelled and CNC'd from wood — iterations to confirm the form and the playing-surface dimensions before committing to the single 1m × 1m sheet.

11. **ImageGrid** (3-up, span 2/12) — `role: prototype` — alt: "Wood prototypes, before the final CNC pass"

12. **SectionLabel** — `05 / RESOLVED`
13. **ImageSingle** (full-bleed) — `role: final` — alt: "The finished board, backlit"
14. **ImageSingle** (wide) — `role: final` — alt: "Detail — light passing through the thinned material"

---

## wave

```yaml
name: "Wave"
year: 2026
discipline: "Product Design"
slug: "wave"
group: true
framing: "A custom CNC'd enclosure for a pair of broken Edifier desktop speakers — built across a ten-week studio with ten weekly deliverables."
hero_role: "final"
spec:
  brief_structure: "10 deliverables over 10 weeks"
  disciplines: "electronics, woodworking, audio, product design"
  source: "a broken pair of Edifier desktop speakers"
```

### Blocks

1. **SectionLabel** — `01 / THE BRIEF`
2. **Text** (span 3/9):
   > A group project with an unusual structure: deliver ten different things over ten consecutive weeks. The deliverables compounded — each week built on the last — until the final object became the culmination of a semester's range of work. Our group's interests sat across electronics, woodworking, audio design and product design, and we let the project move across all four.

3. **SectionLabel** — `02 / PROCESS`
4. **Text** (span 3/9):
   > Many of those weeks were spent in materials — testing different woods, learning CNC machining, 3D-printing internal components — and in researching sound and speaker design. The build emerged from those weeks rather than being designed up front.

5. **ImageGrid** (2-up, span 2/12) — `role: process` — alt: "Materials and CNC tests from the early weeks"

6. **SectionLabel** — `03 / KEY DECISION`
7. **Text** (span 3/9):
   > We started from a broken pair of Edifier desktop speakers. The drivers were salvageable; the housings weren't. We rebuilt them — drivers given a new custom enclosure, sized and tuned for them, CNC'd from solid wood, sanded and finished by hand. The internal mounting was 3D-printed and CNC'd to fit.

8. **SectionLabel** — `04 / RESOLVED`
9. **ImageSingle** (full-bleed) — `role: final` — alt: "The finished speaker"
10. **ImageSingle** (wide) — `role: final` — alt: "Side detail — the wood grain and the driver mounting"
11. **ImageSingle** (wide) — `role: final` — alt: "Wave and Mantis paired on the same desk"

---

## mantis

```yaml
name: "Mantis"
year: 2026
discipline: "Product Design"
slug: "mantis"
group: true
framing: "A standing lamp made from a broken wooden side table — its surface the base, its legs reconnected with 3D-printed joints."
hero_role: "final"
exhibitions:
  - "IE University, School of Architecture and Design — final exhibition (2026)"
  - "Meyrit Biennale, Madrid (2026)"
```

### Blocks

1. **SectionLabel** — `01 / THE BRIEF`
2. **Text** (span 3/9):
   > The brief was a transformation: take a found object — an artefact, a product — and turn it into something new. We took a wooden side table that needed repair.

3. **SectionLabel** — `02 / MAKING`
4. **Text** (span 3/9):
   > The table's surface became the lamp's base. Its legs, reconnected with 3D-printed joints, became its structure. The remaining components — bulb, fittings, lampshade — were purchased and assembled into the body of the new object.

5. **ImageGrid** (3-up, span 2/12) — `role: final` — alt: "Detail — the joint, the lampshade, the base"

6. **SectionLabel** — `03 / EXHIBITED`
7. **Text** (span 3/9):
   > Selected for IE University's School of Architecture and Design final exhibition, and for the Meyrit Biennale, Madrid.

8. **ImageSingle** (full-bleed) — `role: final` — alt: "The finished Mantis lamp"

---

## Notes for the agent (Phase 3)

- These seven files map directly to `src/content/projects/<slug>.md`. The `## <slug>` heading wrappers are for this document only; drop them when splitting.
- Image-block `src` fields are deliberately empty. Fill them during the §10 image pass by matching the block's `role` to the categorised images in `assets/projects/<slug>/`, using the §10 ordering rules.
- Where a block specifies a count (e.g. `3-up`) and the project has fewer images of that role available, reduce the count rather than padding from other roles.
- The `spec` and `exhibitions` frontmatter fields on a few projects (Universal Phone Case, Backgammon, Wave, Mantis) drive a `SpecList` block — render them at cols 9/13 per the build spec §8.
- The page header for every project renders: the `name` as Playfair Display H1, the `discipline · year` as a Raleway-caps meta line, and the `framing` as a single editorial line in Playfair Display below — that is the §2 angle at the top of the page.
- Do not add a "reflection" section to any project. None of the seven sources carries one; per §9, omitted is correct.
