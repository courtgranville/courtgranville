# Homepage — QA & Fixes

> A focused fix pass on the built homepage (`prototypes/hero/index.html`). **Not a feature pass.** Do not add sections, do not restyle, do not touch the hero or its locked CONFIG. Fix exactly the items below and nothing else.

## Fix 1 — The carousel loop (the real bug)

The carousel advances by translating a single flex track — `track.style.transform = translate3d(-current*100%, 0, 0)` — with `current` wrapped by modulo, and the track carries a CSS `transition` on `transform`. So when the user advances past the last slide, `current` wraps `4 → 0` and the transform animates from `-400%` to `0%`: the track visibly **rewinds through every slide**. The same happens going back past the first slide. It is broken on the arrows, the keyboard, and drag alike.

**Fix: make the carousel clamped, not looping.**
- `setSlide` clamps the index to `[0, N-1]` instead of wrapping it.
- At index 0 the **Previous** button is disabled; at index `N-1` the **Next** button is disabled. Disabled is a clear, quiet visual state — reduced opacity, `cursor: default`, the `disabled` attribute (so it is also removed from the tab order and announced) — not hidden.
- Keyboard ArrowLeft / ArrowRight respect the same clamp.
- Drag: a drag past the first slide or past the last simply snaps back to the current slide on release — it must never reveal empty space beside the track. Light rubber-band resistance while dragging past an end is welcome but optional.

A genuinely seamless infinite loop would need cloned slides and snap-on-clone logic — more surface area and more ways to break. For a five-slide featured carousel, clamped is the robust, refined choice. If an infinite loop is specifically wanted later, that is its own task.

## Fix 2 — Drag must not start on the controls

`dragStart` is bound to the whole carousel element, so a `pointerdown` on the Prev/Next buttons or the "View project" link also begins a carousel drag. Ignore any `pointerdown` whose target sits inside a `button` or `a`:

```js
function dragStart(e) {
  if (e.target.closest('button, a')) return;
  // ...existing logic
}
```

## Fix 3 — Remove the dead CSS rule

`.intro-statement` is declared twice in the stylesheet — `max-width: 22ch`, then `max-width: 24ch`; the first is dead code. Collapse to a single rule. Leave the value at `24ch` — whether to widen the measure is a visual decision Court will make after viewing; do not change the value unless Court specifies.

## Fix 4 — Placeholder links (minor)

The nav links, footer links, and the "About →", "All work →" and "View project →" links are placeholders (`href="#"`). A stray click currently jolts the page to the top. Give every placeholder link a `preventDefault` on click (or `aria-disabled="true"` with click suppressed) so it is inert until its real page exists. The brand home link (`#top`) and the `mailto:` link keep working.

## Out of scope — do not touch

The hero and its locked CONFIG; the visual design — type, colour, spacing, layout; the motion timings; any new section or page. Court is reviewing the homepage's *feel and refinement* separately; any changes there will come as a separate instruction, not in this pass.
