// NuclearAtom - the live homepage interaction from thenuclearquestion.com,
// re-homed as a self-contained portfolio island for the project page. It wraps
// the ported canvas-2D NucleusHero (no three.js) with the isotope control, the
// U-238 shake hint and the link out to the Fission Room.
//
// Behaviour preserved from the source site: the nucleus reacts to the cursor;
// a U-235 / U-238 toggle; on U-238, shaking the cursor near the centre splits
// the atom. The Fission Room itself is a heavy R3F page on the source site, so
// here it is an outbound link, not a port.
//
// Styling lives in the host page (src/pages/work/[slug].astro, global block)
// and rides the portfolio tokens - the source site's cream surfaces are not
// reused, per the design system. Stroke ink is theme-aware so the atom flips
// with the light/dark toggle (mirrors the hero's `theme:change` contract).

import { useEffect, useRef, useState } from 'react';
import { NucleusHero } from './NucleusHero';
// The nucleus contour paths (~271KB) are fetched at runtime from /nucleus-paths.json
// rather than imported as a module, so they are NOT bundled into this island's JS
// (which would bloat it ~271KB on every page that mounts the atom). On the homepage
// ScrollHero already fetches and parses the same file and parks the result on
// window.__cgNucleusPaths (a Promise); this island awaits that shared promise instead
// of issuing a second request (one fetch, one parse, shared). Off the homepage the
// global is absent and the island fetches for itself (see the effect below).
// NucleusHero renders nothing until paths arrive (its frame loop skips while polylines
// are empty), and rebuilds when they do (its effect deps on paths).

const FISSION_ROOM_URL = 'https://thenuclearquestion.com/fission';
const INK_LIGHT = '#0d1a1e';
const INK_DARK = '#ede9e1';
// Delay before the single retry of the nucleus-paths fetch (a transient blip should
// have cleared by then; a hard failure logs once after this).
const NUCLEUS_PATHS_RETRY_MS = 1200;

const readInk = () =>
  typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark'
    ? INK_DARK
    : INK_LIGHT;

// `compact` (a /work/ gallery cell) shows only the cursor-reactive nucleus - no
// isotope control, hint or room link. `roomLink` (default true) can be turned off
// where the link would clutter (e.g. the homepage hero, which has its own copy).
// `viewportParticles` makes the fission explode across the whole screen while the
// form stays in its box (the project-page hero; host fixes the canvas via CSS).
export default function NuclearAtom({ compact = false, roomLink = true, viewportParticles = false, lowDensity = false }: { compact?: boolean; roomLink?: boolean; viewportParticles?: boolean; lowDensity?: boolean }) {
  const [isotope, setIsotope] = useState<0 | 1>(0);
  const [hintVisible, setHintVisible] = useState(false);
  const [fissionFired, setFissionFired] = useState(false);
  const [ink, setInk] = useState<string>(INK_LIGHT);
  const [paths, setPaths] = useState<string[]>([]);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve the nucleus contour paths at runtime (see import note). Empty until then;
  // NucleusHero simply draws nothing and rebuilds once they arrive.
  //
  // On the homepage the ScrollHero engine fetches the very same file, so it parks the
  // parse on window.__cgNucleusPaths (a Promise resolving to the parsed JSON); we await
  // that shared promise instead of issuing a second request. Off the homepage (the
  // /work gallery, the project page) ScrollHero is absent and that global is undefined,
  // so the island falls back to its own fetch. On failure we retry once after a short
  // delay, then - if it still fails - leave the canvas empty but log one warning so the
  // silent-render-nothing failure is diagnosable rather than invisible.
  useEffect(() => {
    let cancelled = false;
    const shared = (window as unknown as { __cgNucleusPaths?: Promise<unknown> }).__cgNucleusPaths;

    const apply = (d: unknown) => { if (!cancelled) setPaths(d as string[]); };

    const fetchOnce = () => fetch('/nucleus-paths.json').then((r) => r.json());

    const source = shared
      ? shared.then((d) => d) // already-in-flight engine fetch; share its result
      : fetchOnce().catch(() =>
          // Retry once after a short delay before giving up (transient network blip).
          new Promise<unknown>((resolve, reject) => {
            setTimeout(() => { fetchOnce().then(resolve, reject); }, NUCLEUS_PATHS_RETRY_MS);
          }),
        );

    source.then(apply).catch((err) => {
      if (!cancelled) console.warn('[NuclearAtom] nucleus-paths.json failed to load; atom will not render.', err);
    });
    return () => { cancelled = true; };
  }, []);

  // Theme-aware stroke: read once on mount, then follow the toggle's event.
  useEffect(() => {
    setInk(readInk());
    const onTheme = () => setInk(readInk());
    window.addEventListener('theme:change', onTheme);
    return () => window.removeEventListener('theme:change', onTheme);
  }, []);

  // Surface the shake hint for 10s whenever the user arms U-238.
  useEffect(() => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    if (isotope === 1) {
      setHintVisible(true);
      hintTimer.current = setTimeout(() => setHintVisible(false), 10_000);
    } else {
      setHintVisible(false);
    }
    return () => { if (hintTimer.current) clearTimeout(hintTimer.current); };
  }, [isotope]);

  return (
    <div
      className={['atom', compact && 'atom--compact', viewportParticles && 'atom--viewport'].filter(Boolean).join(' ')}
      data-fired={fissionFired ? '1' : '0'}
    >
      <NucleusHero
        paths={paths}
        isotope={isotope}
        ink={ink}
        viewportParticles={viewportParticles}
        pointStride={lowDensity ? 2 : 1}
        onFissionFire={() => setFissionFired(true)}
      >
        {!compact && (
          <>
            {/* Isotope control - re-styled to the portfolio's ink/accent, not the
                source site's cream pill. */}
            <div className="atom-control">
              <span className="atom-control-label label">Isotope</span>
              <div className="atom-switch" data-on={isotope}>
                <span className="atom-thumb" aria-hidden="true" />
                <button type="button" aria-pressed={isotope === 0} onClick={() => setIsotope(0)}>U-235</button>
                <button type="button" aria-pressed={isotope === 1} onClick={() => setIsotope(1)}>U-238</button>
              </div>
            </div>

            {hintVisible && (
              <div className="atom-hint" role="status">Shake your cursor to split the atom</div>
            )}
          </>
        )}
      </NucleusHero>

      {!compact && roomLink && (
        <a className="atom-room textlink" href={FISSION_ROOM_URL} target="_blank" rel="noopener">
          {fissionFired ? 'Enter the Fission Room →' : 'Visit the Fission Room →'}
        </a>
      )}
    </div>
  );
}
