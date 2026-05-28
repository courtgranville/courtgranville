# Hero Prototype — Build Spec (Rev 2)

> Active task for the courtgranville.com repo. Read `CLAUDE.md` first for project context and the design system; this document is the detailed task.

## Rev 2 — what changed and why

Rev 1 was built (`prototypes/hero/index.html`) and reviewed. Corrections carried into the sections below:

1. **Palette inverted.** The hero is now **dark ink particles on the off-white ground**, not luminous particles on dark. This is a different rendering model — normal blending, no bloom (§6, §10).
2. **Reads as a solid particle field, not an outline.** Rev 1 over-sampled the glyph's edge contour and tinted it brighter, producing a glowing rim with a starved interior. Sampling is now fill-dominant and even (§5.2).
3. **The monogram is genuinely volumetric.** Rev 1 was a near-flat plane (`depthJitter 0.022`). Particles are now distributed through a real extruded depth (§5.3).
4. **The cursor probe is a ray, not a plane.** Rev 1 intersected the rotating CG plane (edge-on dead zone); a fixed-plane interim failed because a rotating *volume* swings its edges far off any fixed plane. The probe is now the cursor ray itself — per-particle perpendicular distance to that ray — which reaches every depth at every rotation angle (§7.3).
5. **Frame timing and cursor scope.** Rev 1's simulation was frozen by a `THREE.Clock` delta bug — documented in §7.2 so the rebuild cannot reintroduce it. Rotation is now explicitly autonomous, and pointer-parallax defaults off, so the cursor drives only the particle magnetism (§9).

## 1. Objective

Build a standalone prototype of the **first screen a visitor sees** on courtgranville.com: the hero, with the monogram "CG" rendered as a rotating, three-dimensional cloud of **dark ink particles on an off-white ground**, reacting to the cursor.

This prototype exists to answer one question: **can "CG", set in Playfair Display Bold, survive being rebuilt out of particles — staying legible as that specific high-contrast typeface while it rotates in 3D and is disturbed by the pointer?** Every requirement below serves that test.

Build **only** the first-load screen. Nothing below the fold.

## 2. Deliverable & constraints

- A single self-contained `prototypes/hero/index.html`. **No build step** — it must run by being opened in a browser (preview over `http.server`, see `CLAUDE.md`).
- three.js + addons (`EffectComposer`, `RenderPass`, `ShaderPass`) and `lil-gui`, loaded as ES modules via a CDN import map (jsDelivr), versions pinned. **No `UnrealBloomPass`** — see §10.
- Desktop-first. Ignore mobile and touch entirely.
- All tunable values live in a single `CONFIG` object at the top of the file.
- Target a stable 60fps on a typical laptop.

## 3. The screen

A full-viewport **off-white** scene. The CG particle cloud is centred and dominant (~55–60% of viewport height). Over it sit three minimal flat (DOM) UI elements, all in the monospace placeholder (IBM Plex Mono), small and quiet:

- **Top-right** — minimal nav: `WORK   ABOUT   CONTACT`. Letter-spaced, no background, no underline. Not real links. Hovering an item is the one permitted use of the deep-red accent.
- **Bottom-left** — a two-line caption: `COURT GRANVILLE` / `PRODUCT DESIGNER — DESIGN STUDENT`.
- **Bottom-centre** — a `SCROLL` cue with a small, slow, looping downward motion. Placeholder; it need not do anything yet.

The DOM UI fades in gently *after* the particle load-in completes (§8). The strength of the composition is the restraint.

## 4. Scene & camera

- Perspective camera, modest FOV (~35–45°), positioned head-on to the CG with a small offset so rotation reads as 3D.
- Background: flat **off-white** (`CONFIG.scene.bgColor`, ~`#F4F3EF`). No skybox.
- Optional, subtle: a very slow, small-amplitude camera drift (sinusoidal) to keep the scene alive. Tunable, default on, very gentle.
- Renderer: `antialias: true`, sRGB output, pixel ratio capped at 2.

## 5. Glyph sourcing — volumetric

**Do not use `TextGeometry` or an extruded mesh.** Particles are sampled from a 2D rasterisation of the real typeface, then given real depth.

### 5.1 Rasterisation
1. Load Playfair Display Bold (700) from Google Fonts. Wait for `document.fonts.ready` before sampling.
2. Draw `CG` with `fillText` onto an offscreen 2D canvas at high resolution (~2000px+ wide; glyphs fill most of it). Record the canvas-to-world scale.
3. Read the `ImageData`. A pixel is "filled" where alpha exceeds a threshold.

### 5.2 Sampling — fill-dominant and even
The letterform must read as a **solid, uniform field of particles** — not an outline with speckle inside.

- Sample filled pixels **roughly uniformly** (uniform-random selection across all filled pixels). This gives an even areal density over the whole glyph — thick stems and thin hairlines alike.
- Hairlines survive because the *total* density is high enough, **not** because the edge is specially weighted. Do **not** route the majority of particles to the contour — that was the Rev 1 mistake.
- Optional crispness aid: a **small** density boost for pixels on the glyph silhouette (a filled pixel 4-adjacent to an empty one), capped low (≤15% of the budget). These particles are **visually identical** to the rest — same colour, same size. There is no bright edge and no separate edge tint.
- Expose the contour-boost amount in `CONFIG`; default it low.

### 5.3 Extrude into a real volume
The monogram is a three-dimensional object, not a plane.

- Give the glyph a real **depth** — `CONFIG.glyph.depth`, roughly 15–25% of the glyph's cap height in world units.
- Each particle takes its `(x, y)` from a sampled filled pixel and a `z` drawn **uniformly across the full depth** `[-depth/2, +depth/2]`. The result is a genuine extruded particle volume.
- Face-on, the volume projects to the clean Playfair letterform. Rotated, it shows real thickness — the entire point of the 360° rotation.
- Keep depth moderate: enough to be unmistakably dimensional, not so deep the hairlines become long tunnels.

### 5.4 Per-particle data
Pre-allocated typed arrays: `home` (vec3), `pos` (vec3), `vel` (vec3), `seed` (float), `sizeMul` (float).

### 5.5 Count
Target ~80,000 particles (tunable 40k–140k). A volume needs a higher count than a plane to read as solid.

## 6. Rendering — dark ink particles

Render as a single `THREE.Points` with a custom `ShaderMaterial`.

- **Blending: `NormalBlending`.** The particles are dark marks on a light ground — they work by *occluding*, not by adding light. (Additive blending only works on a dark ground; it is wrong here.) Use `transparent: true`, `depthWrite: false`, `depthTest: false` — because every particle is the same dark ink colour, unsorted alpha compositing reads correctly.
- **Vertex shader:** perspective-attenuated point size — `gl_PointSize = baseSize * sizeMul * (sizeScale / -mv.z)`. Also compute a **depth-fade** factor from view-space z: particles further from the camera fade toward the background colour (aerial perspective). This is what makes the volume read as dimensional on a flat background — it replaces what bloom did on the dark version.
- **Fragment shader:** a soft round dot — radial `smoothstep` falloff — in the ink colour. A slightly denser/more-opaque centre is fine for crispness, but the particle is **dark, not glowing** — no hot core. Mix the particle's colour toward the background colour by the depth-fade factor.
- **Colour:** a single off-black ink colour (`CONFIG.particles.inkColor`), with optional tiny per-particle lightness variance. Expose `particleOpacity` and the depth-fade amount.

## 7. Motion & physics

The cloud is a spring-mass system: every particle is tethered to its glyph `home` and perturbed by the cursor and by ambient drift.

### 7.1 Per-frame force model
Each frame, for every particle, accumulate a force, then integrate. Use a clamped delta time (`dt = min(realDt, 1/30)`) so a frame hitch cannot explode the simulation.

1. **Spring to home.** `force += -springK * (pos - home)` — this guarantees the monogram always re-forms.
2. **Damping.** `vel *= damping` each frame (~0.82–0.92). Without it the cloud oscillates forever.
3. **Pointer force.** See §7.3 — particles near the cursor ray are pushed (repel) or pulled (attract).
4. **Ambient drift.** A small continuous motion so the settled cloud breathes — applied as a gentle offset to the spring's *target*, so the cloud never overshoots. Subtle; the letterform must stay legible.

### 7.2 Integration
Semi-implicit Euler: `vel += (force / mass) * dt; pos += vel * dt`. Then **clamp** `|vel|` to `maxVel`, and `|pos - home|` to `maxDisplacement` so a cursor yank can never break the letter irreparably. Keep the loop allocation-free — it runs ~80k times per frame.

**Source `dt` correctly.** Call `clock.getDelta()` exactly once per frame, and read elapsed time as the `clock.elapsedTime` *property*. Do **not** also call `clock.getElapsedTime()` — it internally calls `getDelta()`, consuming the delta and leaving `dt` at ~0, which silently freezes the entire simulation (forces compute correctly, then get multiplied by a zero `dt`). This was the Rev 1 bug.

### 7.3 The cursor probe — a ray, not a plane
The cursor is fundamentally a **ray** into the scene, and the probe must treat it as one. A probe based on any single plane — rotating or fixed — cannot track a rotating three-dimensional object: as the volumetric monogram spins, its edges swing far off any fixed plane (by up to the letterform's half-width), out of reach of a point-and-radius influence. This is why the leading edge of the letter went dead during rotation.

- On `pointermove`, build the world-space cursor ray (`raycaster.setFromCamera`). Smooth the pointer NDC frame-to-frame so fast moves don't jerk; snap on first activation.
- Transform the ray into the CG group's **local space**: apply the inverse group matrix to the ray origin, and `transformDirection` to the ray direction. The physics runs in local space alongside the particles.
- In the simulator, for each particle compute its **perpendicular distance to the cursor ray** — project the origin-to-particle vector onto the ray direction; the rejection (origin-to-particle minus that projection) is the perpendicular vector. Apply the force along that perpendicular.
- This reaches every particle the cursor passes over **at any depth** — front edge, core, and back edge alike — and is well-defined at every rotation angle, so there is no edge-on dead zone.
- On `pointerleave`, disable the pointer force — the spring re-forms the monogram.
- **Modes:** `repel` pushes particles radially away from the ray (opening a clean tube through the letterform wherever the cursor points); `attract` pulls them onto it. Both tunable: `radius` (the cylinder radius — keep it modest, smaller than an old sphere-probe radius), `strength`, and a falloff curve.

### 7.4 Hand-off from load-in
While the load-in (§8) runs, physics is **off**. On completion, set every particle `pos = home`, `vel = 0`, and switch physics on.

## 8. Load-in animation

Roughly 2–2.5s, then hands off to physics (§7.4).

- **Start state:** particles dispersed through a loose volume larger than the final monogram — a faint drifting cloud before it resolves.
- **Coalesce:** each particle interpolates from its start position to its `home` with **per-particle stagger** (delay from particle index or `home.x`) so the monogram resolves with direction rather than snapping uniformly.
- **Easing:** an expressive ease-out (easeOutCubic / easeOutExpo).
- The DOM UI (§3) fades in over ~0.6s once coalesce completes.
- `CONFIG` exposes duration, stagger, easing, start-volume size. A GUI button replays the sequence.

## 9. Rotation

Rotation is **autonomous** — it runs on its own and is **not** driven by the cursor. The cursor's only job is the particle magnetism (§7); the two must stay completely separate.

- **Continuous mode (default):** a slow, constant Y-axis rotation through a full 360°. With real volumetric depth (§5.3) the monogram shows genuine thickness throughout the revolution.
- **Oscillation mode:** a slow ease back and forth within ±~30–35° of front-facing.
- Whichever mode, keep it slow enough that "CG" stays readable. Both are switchable live in the GUI.
- **Pointer parallax** — a small tilt of the whole monogram toward the cursor — is available in the GUI but **off by default**. It makes the cursor appear to drive the rotation, which competes with the magnetism for what the cursor means; leave it off unless deliberately wanted.

## 10. Post-processing

Via `EffectComposer`. **No bloom** — bloom is a light-bleed effect with nothing to act on when particles are dark on light; it is removed entirely.

- `RenderPass`.
- **Film grain** — a fine animated grain over the off-white ground. This is the main atmospheric texture: it gives the ground a printed-paper quality that suits the editorial identity. Tunable, subtle.
- **Vignette** — a very gentle edge darkening, pulled toward a warm-darker version of the ground rather than to black. Optional, default subtle.
- **Chromatic aberration** — optional, default near-zero. A refined ink-on-paper look generally does not want digital fringing; leave it available but quiet.

The dimensional atmosphere comes from the depth-fade in the particle shader (§6), not from post.

## 11. Tuning GUI (lil-gui)

Folders, everything live-adjustable:

- **Particles** — count, contour boost, base size, size variance, depth, particle opacity, depth-fade amount, ink colour.
- **Physics** — spring stiffness, damping, ambient mode/amplitude/frequency, max velocity, max displacement.
- **Pointer** — mode (repel / attract), radius, strength, falloff, smoothing.
- **Rotation** — mode (continuous / oscillate), speed, oscillation angle/frequency, parallax on/off + amount (default off).
- **Post** — grain amount, vignette amount, chromatic-aberration amount.
- **Scene** — background colour, camera drift on/off.
- **Buttons** — "Replay load-in"; "Log CONFIG as JSON".

Changing count, contour boost, size variance or depth rebuilds the system; everything else applies live.

## 12. Code organisation

One file, cleanly sectioned: `CONFIG`; `GlyphSampler` (rasterise + uniform sample + volumetric extrude); `ParticleSystem` (buffers + `ShaderMaterial`); `Simulator` (forces + integration); `Probe` (cursor ray → local space); `RotationController`; `LoadIn`; `PostFX`; `GUI`; `main`. Comment the *why*, not the *what*.

## 13. Out of scope

Everything below the fold; the scroll transition into the editorial body; other pages; real navigation; mobile and touch; sound; any CMS or content system.

## 14. Success criteria

1. "CG" reads **instantly as Playfair Display Bold** — high stroke contrast, hairlines and bracketed serifs intact — and as a **solid, even field of particles**, not an outline.
2. The monogram has **visible three-dimensional depth**: rotating it reveals genuine thickness.
3. The cursor interaction is **fluid and works at every rotation angle and every depth** — front edge, core and back edge alike — and the monogram **always re-coheres** when the cursor leaves.
4. The hero reads as **dark ink on a warm off-white ground** — no glow, no neon, no bloom.
5. Stable 60fps at the target particle count.

If (1) cannot be achieved at any tuning, that is itself a finding — report it rather than shipping a mushy monogram.
