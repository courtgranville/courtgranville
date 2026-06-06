// client/src/components/NucleusHero.tsx
import { useEffect, useRef, type ReactNode } from 'react';
import { buildPolylines, type BBox, type Polyline } from './lib/parseSvg';
import {
  TUNING,
  isotopeToGates,
  makeFissionState,
  type FissionState,
} from './lib/fission';
import { spawnBurst, stepAndDrawParticles } from './lib/particles';
import { fitCanvasToDpr } from './lib/canvasUtils';
import { sampleCoalescedPointer } from './lib/cursorSampling';
import { easeAlpha } from './lib/animationTiming';

interface NucleusHeroProps {
  /** SVG path d-strings extracted from the icon. */
  paths: string[];
  /** 0 = U-235 (stable, harder to fission); 1 = U-238 (enriched, easier). */
  isotope: 0 | 1;
  /** Children rendered absolutely on top of the canvas (e.g. tweaks anchor). */
  children?: ReactNode;
  /** Fired the moment the nucleus begins splitting (phase: idle → splitting).
   * Used by the homepage to surface the Fission Room invitation after the
   * user earns the interaction. */
  onFissionFire?: () => void;
  /** Stroke colour for the nucleus polylines. Defaults to the near-black ink;
   * the portfolio passes a theme-aware value so the atom flips with the page. */
  ink?: string;
  /** When true, the canvas is sized to the full viewport (the host fixes it over
   * the page) and the nucleus form is drawn at - and tracks - the container's
   * on-screen box, so the fission particles explode across the whole screen while
   * the form stays put. Used by the project-page hero. */
  viewportParticles?: boolean;
  /** Decimate the nucleus polylines to ~1/stride of their points. drawFrame loops
   * every point every frame, so a higher stride is a direct per-frame saving where
   * the nucleus renders small (the homepage beat). Default 1 = full fidelity. */
  pointStride?: number;
  /** Touch-device shake-to-fission. When true, a physical shake of the handset
   * triggers the same fission as a cursor shake (the handler injects into the same
   * raw reversal / speed channels the pointer path feeds). The wrapper only sets
   * this on touch-primary devices AND once devicemotion is usable (permission
   * granted on iOS 13+, or not required elsewhere) - denied/unsupported leaves it
   * false, so no listener is ever attached and the atom stays a pure visual. The
   * listener self-gates further on armed (U-238) + active + visible, so it costs
   * nothing while the nucleus is U-235, off-beat or off-screen. */
  shakeEnabled?: boolean;
}

/**
 * Hero canvas - full-bleed wide, height-driven sizing. Draws the nucleus
 * every frame from the parsed polylines, applies cursor magnetism, breathing,
 * shake-detected fission with bounce + reform phases, and a particle burst.
 *
 * The animation is identical to the canonical vite-port: same TUNING constants,
 * same state machine, same magnetism math. The isotope prop is read through a
 * ref so toggling it never restarts the loop.
 */
export function NucleusHero({ paths, isotope, children, onFissionFire, ink, viewportParticles = false, pointStride = 1, shakeEnabled = false }: NucleusHeroProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Live ref so the loop reads the latest isotope without restarting.
  const isotopeRef = useRef<number>(isotope);
  isotopeRef.current = isotope;
  // Live refs for the devicemotion gate so toggling the isotope (armed = U-238) or
  // the shake-enabled flag never restarts the canvas effect; the effect installs a
  // sync function on syncDeviceMotionRef that these effects below call to re-evaluate
  // whether the listener should currently be attached.
  const shakeEnabledRef = useRef<boolean>(shakeEnabled);
  shakeEnabledRef.current = shakeEnabled;
  const syncDeviceMotionRef = useRef<(() => void) | null>(null);
  // Re-evaluate the devicemotion attachment whenever arming (isotope) or the
  // shake-enabled flag changes - the canvas effect owns the actual attach/detach.
  useEffect(() => { syncDeviceMotionRef.current?.(); }, [isotope, shakeEnabled]);
  // Live ref for the fire callback so changes don't restart the effect.
  const onFissionFireRef = useRef<(() => void) | undefined>(onFissionFire);
  onFissionFireRef.current = onFissionFire;
  // Live ref for the stroke ink so a theme flip never restarts the loop.
  const inkRef = useRef<string>(ink ?? '#0d1a1e');
  inkRef.current = ink ?? '#0d1a1e';

  // Live ref for the "is this beat active?" pause signal. This canvas-2D loop is
  // full-viewport on the homepage and would otherwise redraw every frame even
  // while the atom is invisible (it's the live beat on only one of six) - that
  // continuous redraw measured as ~80% of homepage scroll CPU. The ScrollHero
  // engine sets window.__cgAtomActive and dispatches `atom:active` as the nucleus
  // enters/leaves the active beat (mirrors its window.__cgLenis / theme:change
  // contracts). Where no engine drives the atom (the project page, the gallery)
  // __cgAtomActive is undefined, so it defaults to always-active and nothing changes.
  const activeRef = useRef<boolean>(
    !(typeof window !== 'undefined' && (window as unknown as { __cgAtomActive?: boolean }).__cgAtomActive === false),
  );
  useEffect(() => {
    const onActive = (e: Event) => {
      activeRef.current = !!(e as CustomEvent).detail?.active;
      // Active-beat changes also gate the devicemotion listener (attached only while
      // armed + active + visible), so re-evaluate when the beat enters/leaves.
      syncDeviceMotionRef.current?.();
    };
    window.addEventListener('atom:active', onActive);
    return () => window.removeEventListener('atom:active', onActive);
  }, []);
  // On-screen ref - pause the loop whenever the canvas is scrolled out of view.
  // This is what stops the project page and the /work gallery cell from running
  // their canvas-2D loop while off-screen (the homepage is already gated by the
  // engine signal above; this is an additional, universal guard). Combined with
  // activeRef so the loop only runs when it's BOTH the active beat AND visible.
  const onScreenRef = useRef<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Honour reduced-motion. The canvas still renders the static nucleus, but
    // breathing/drift are off (fission stays - it is a deliberate user gesture).
    // Tracked live, not just sampled at mount: subscribe to the MediaQueryList so
    // toggling the OS setting while the page is open updates the running loop. The
    // listener (and its cleanup) are added below, after motionMq is in scope.
    const motionMq =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    let prefersReduced = !!motionMq?.matches;
    const onMotionChange = (e: MediaQueryListEvent) => { prefersReduced = e.matches; };
    motionMq?.addEventListener('change', onMotionChange);

    let W = 0;
    let H = 0;
    // The "form region": where the nucleus is drawn and how big, in canvas px.
    // By default it's the canvas centre at the field radius (the canvas IS the
    // form box). When the host sets --form-cx/--form-cy/--form-r (the homepage,
    // where the canvas is full-screen so the fission particles can fly across it
    // while the nucleus stays small), the form is drawn at that offset region and
    // the cursor is measured relative to it. Particles always use the full canvas.
    let formCx = 0, formCy = 0, formR = 0, useFormRegion = false;

    const resize = () => {
      // viewportParticles: the canvas covers the whole viewport (host fixes it),
      // so particles span the screen. Otherwise the canvas is its container.
      if (viewportParticles) { W = window.innerWidth; H = window.innerHeight; }
      else { const r = container.getBoundingClientRect(); W = r.width; H = r.height; }
      // Cap DPR at 2.0 - matches the pre-helper hardcoded value.
      // NucleusHero ran fine at this DPR; the original migration
      // to a 3.0 global ceiling didn't change its effective cap on
      // retina (still 2.0) so this is a no-op for NucleusHero
      // specifically. Explicit for parity with the other components.
      const { dpr } = fitCanvasToDpr(canvas, W, H, 2.0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      readFormRegion();
    };
    // Resolve the form region (where/how big the nucleus is drawn, in canvas px -
    // which equal viewport px, since every form-region canvas sits at viewport 0,0).
    //   • viewportParticles  → the container's live on-screen box (tracks scroll).
    //   • __cgFormRegion     → the ScrollHero engine's push channel (the homepage).
    //   • --form-* CSS vars  → an explicit offset region (fallback for hosts
    //                          that only set the vars).
    //   • none of the above  → the whole canvas is the form box (project default / gallery).
    // Only the viewportParticles branch runs per frame (the form must track scroll);
    // the others run at resize/event time only - polling the CSS vars with
    // getComputedStyle every frame forced a style recalc per frame on the homepage,
    // where the engine also writes overlay styles, and that recalc was a large part
    // of the cursor lag.
    const readFormRegion = () => {
      if (viewportParticles) {
        const rc = container.getBoundingClientRect();
        useFormRegion = true;
        formCx = rc.left + rc.width / 2;
        formCy = rc.top + rc.height / 2;
        formR = Math.max(1, Math.min(rc.width, rc.height)) * TUNING.fieldRFrac;
        return;
      }
      const pub = (window as unknown as { __cgFormRegion?: { cx: number; cy: number; r: number } }).__cgFormRegion;
      if (pub && pub.r > 0) {
        useFormRegion = true;
        formCx = pub.cx; formCy = pub.cy; formR = pub.r;
        return;
      }
      const cs = getComputedStyle(container);
      const fr = parseFloat(cs.getPropertyValue('--form-r'));
      if (fr > 0) {
        useFormRegion = true;
        formR = fr;
        formCx = parseFloat(cs.getPropertyValue('--form-cx')) || W / 2;
        formCy = parseFloat(cs.getPropertyValue('--form-cy')) || H / 2;
      } else {
        useFormRegion = false;
        formCx = W / 2; formCy = H / 2; formR = Math.min(W, H) * TUNING.fieldRFrac;
      }
    };
    resize();
    // The engine re-fits its camera (and so the form region) on its own schedule -
    // follow the push channel instead of polling (covers the hydrate-after-fitCamera
    // race too: the event lands whenever fitCamera next runs).
    const onFormRegion = () => readFormRegion();
    window.addEventListener('atom:formregion', onFormRegion);
    // In viewport mode the canvas tracks the window, not the container's size.
    if (viewportParticles) window.addEventListener('resize', resize);

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // Pause the loop while the canvas is off-screen (project page / gallery cell
    // scrolled away). 200px margin so it resumes just before re-entering view.
    const io = new IntersectionObserver(
      ([e]) => {
        onScreenRef.current = e.isIntersecting;
        // Visibility also gates the devicemotion listener - re-evaluate on scroll
        // into / out of view so we don't listen to the accelerometer off-screen.
        syncDeviceMotion();
      },
      { rootMargin: '200px 0px' },
    );
    io.observe(container);

    // DPR-change refit. The ResizeObserver above only fires on a container-size
    // change, but browser zoom or dragging the window onto another monitor changes
    // window.devicePixelRatio WITHOUT resizing the container - leaving the backing
    // store at the old ratio and the nucleus blurry / mis-scaled. A media query of
    // `(resolution: <current>dppx)` flips the moment the DPR moves off its current
    // value, so we re-fit on its change. The query string is pinned to a specific
    // dppx, so each new DPR needs a fresh query: re-subscribe after every change.
    let dprMq: MediaQueryList | null = null;
    const onDprChange = () => {
      resize(); // re-fit the backing store at the new devicePixelRatio
      watchDpr(); // re-arm against the now-current dppx (the old query no longer matches)
    };
    const watchDpr = () => {
      if (typeof window.matchMedia !== 'function') return;
      dprMq?.removeEventListener('change', onDprChange);
      dprMq = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      dprMq.addEventListener('change', onDprChange);
    };
    watchDpr();

    // Parse paths once.
    const { polylines, bbox } = buildPolylines(paths, pointStride);

    // Cursor state.
    const ptr = {
      x: 0, y: 0, tx: 0, ty: 0,
      vx: 0, vy: 0, speed: 0,
      active: false,
    };
    // Raw event-level tracking for fission detection. With coalesced-
    // sample averaging (sampleCoalescedPointer above), both this raw
    // channel and the smoothed magnetism channel receive Firefox-
    // equivalent input in every browser, so the fission gate triggers
    // on the same effective gesture intensity regardless of pointer
    // device sample rate.
    const rawLast = { x: 0, y: 0, dx: 0, dy: 0, t: 0 };
    let rawSpeed = 0;     // peak normalised-units/sec, decays per frame
    let rawReversals = 0; // pending reversal bumps, drained per frame

    const onPointerMove = (e: PointerEvent) => {
      const sample = sampleCoalescedPointer(e);
      // Measure the cursor relative to the form centre/radius so the magnetism and
      // shake-to-split feel right wherever the form sits. In form-region modes the
      // canvas sits at viewport 0,0, so formCx/formCy are absolute viewport coords -
      // no layout read needed. Only the container-box mode measures the rect, and
      // only then: getBoundingClientRect forces layout, and this handler runs per
      // pointer event (up to 1000Hz mice).
      let nx: number, ny: number;
      if (useFormRegion) {
        nx = (sample.clientX - formCx) / formR;
        ny = (sample.clientY - formCy) / formR;
      } else {
        const r = container.getBoundingClientRect();
        nx = (sample.clientX - (r.left + r.width / 2)) / (r.width / 2);
        ny = (sample.clientY - (r.top + r.height / 2)) / (r.height / 2);
      }
      ptr.tx = Math.max(-1.4, Math.min(1.4, nx));
      ptr.ty = Math.max(-1.4, Math.min(1.4, ny));
      ptr.active = true;

      const now = e.timeStamp || performance.now();
      if (rawLast.t > 0) {
        const rdt = Math.max(0.001, (now - rawLast.t) / 1000);
        const rdx = nx - rawLast.x;
        const rdy = ny - rawLast.y;
        const rspd = Math.hypot(rdx, rdy) / rdt;
        if (rspd > rawSpeed) rawSpeed = rspd;
        const rdot = rdx * rawLast.dx + rdy * rawLast.dy;
        // Reversal: direction flipped between events while moving briskly.
        if (rdot < 0 && rspd > 0.8) rawReversals += 1;
        rawLast.dx = rdx;
        rawLast.dy = rdy;
      }
      rawLast.x = nx;
      rawLast.y = ny;
      rawLast.t = now;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    // ── Devicemotion shake-to-fission (touch) ─────────────────────────────────
    // On a phone there is no cursor to shake, so a physical shake of the handset
    // drives the SAME fission as a cursor shake: this handler writes into the very
    // same rawSpeed / rawReversals channels the pointer path feeds (see onPointerMove
    // above), and the shared per-frame state machine in drawFrame takes it from there
    // - no parallel fission path. On touch the cursor stays at the form centre
    // (ptr.x/y default 0), so `nearCentre` already holds and only the speed + reversal
    // gates need feeding. We detect a shake from the JERK (change in acceleration
    // between samples) reversing direction, which mirrors the cursor reversal test.
    const DM = TUNING.deviceMotion;
    const accLast = { x: 0, y: 0, z: 0, jx: 0, jy: 0, jz: 0, have: false };
    const onDeviceMotion = (e: DeviceMotionEvent) => {
      // Prefer gravity-free acceleration; fall back to includingGravity (the only one
      // many Android browsers provide). Either way we work in jerk (deltas), which
      // cancels the constant gravity offset so the fall-back behaves like the clean signal.
      const a = e.acceleration && e.acceleration.x != null ? e.acceleration : e.accelerationIncludingGravity;
      if (!a) return;
      const ax = a.x ?? 0, ay = a.y ?? 0, az = a.z ?? 0;
      if (accLast.have) {
        // Jerk = change in acceleration this sample.
        const jx = ax - accLast.x, jy = ay - accLast.y, jz = az - accLast.z;
        const jMag = Math.hypot(jx, jy, jz);
        if (jMag > DM.jerkThreshold) {
          // Reversal: this jerk opposes the previous jerk (dot < 0) and both were
          // brisk - a genuine back-and-forth shake, not a single jolt. Mirrors the
          // cursor reversal gate, and feeds the same shakeScore channel.
          const dot = jx * accLast.jx + jy * accLast.jy + jz * accLast.jz;
          if (dot < 0 && jMag > DM.reversalMinJerk) {
            rawReversals += 1;
            if (DM.rawSpeedInject > rawSpeed) rawSpeed = DM.rawSpeedInject;
          }
        }
        accLast.jx = jx; accLast.jy = jy; accLast.jz = jz;
      }
      accLast.x = ax; accLast.y = ay; accLast.z = az; accLast.have = true;
    };

    // Attach the accelerometer listener only while it can matter: shake usable
    // (touch + permission), armed (U-238), the active beat, on-screen AND the tab
    // foreground. Removed the instant any of those drops (battery discipline - the
    // sensor stays off the ~99% of the time the nucleus is U-235, off-beat, scrolled
    // away or backgrounded) and on unmount.
    let dmAttached = false;
    const syncDeviceMotion = () => {
      const want =
        shakeEnabledRef.current &&
        isotopeRef.current === 1 &&
        activeRef.current &&
        onScreenRef.current &&
        !document.hidden;
      if (want === dmAttached) return;
      if (want) {
        accLast.have = false; // fresh baseline so the first sample never reads as a jerk
        window.addEventListener('devicemotion', onDeviceMotion);
      } else {
        window.removeEventListener('devicemotion', onDeviceMotion);
      }
      dmAttached = want;
    };
    // Expose to the prop-driven effects (isotope / shakeEnabled changes call this).
    syncDeviceMotionRef.current = syncDeviceMotion;
    syncDeviceMotion();

    // Animation state.
    const fission: FissionState = makeFissionState();
    let smoothSpeed = 0;
    let cursorAngle = 0;
    const t0 = performance.now();
    let lastT = t0;
    let rafId = 0;

    // Visibility gate: a backgrounded tab keeps requestAnimationFrame scheduled
    // (browsers throttle but don't stop a self-rescheduling loop), so stop
    // scheduling frames entirely while the document is hidden and resume on
    // return. This sits ALONGSIDE the existing active/on-screen gates - those
    // skip the draw but keep the loop alive; this stops the loop outright when
    // the whole tab is hidden. scheduleFrame is the single rescheduling point so
    // the visibility check lives in one place; rafId === 0 marks "stopped" so the
    // visibilitychange handler knows whether it needs to restart the loop.
    const scheduleFrame = () => {
      if (document.hidden) { rafId = 0; return; }
      rafId = requestAnimationFrame(frame);
    };
    const onVisibility = () => {
      if (document.hidden) {
        // Stop scheduling; the in-flight frame (if any) will see rafId reset.
        if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      } else if (!rafId) {
        // Resume. Reset lastT so the first frame back doesn't compute a huge dt
        // from the hidden gap (dt is clamped anyway, but keep timing clean).
        lastT = performance.now();
        scheduleFrame();
      }
      // The devicemotion gate includes !document.hidden, so detach/re-attach the
      // accelerometer with the tab's foreground state too.
      syncDeviceMotion();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Dev-only diagnostic: ?frametiming in the URL logs average dt per
    // second to the console so we can compare actual RAF rates across
    // browsers. Used to diagnose the Chrome over-reactivity report -
    // see scripts/cross-browser-audit.md (Issue F.2).
    const frameTiming =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).has('frametiming');
    let ftFrames = 0;
    let ftLastReport = performance.now();

    const frame = (now: number) => {
      // Paused (homepage, nucleus is not the active beat): keep the rAF loop alive
      // but skip the full-viewport clear + nucleus redraw + particle step. This is
      // the dominant homepage scroll cost; resuming is instant (drawFrame fully
      // repaints each frame, so one paused-then-active frame is clean).
      if (!activeRef.current || !onScreenRef.current) { lastT = now; scheduleFrame(); return; }
      const dt = Math.max(0.001, Math.min(0.05, (now - lastT) / 1000));
      lastT = now;
      const t = (now - t0) / 1000;
      // Only the viewport mode reads layout per frame (the form tracks the page's
      // scroll); everywhere else the region updates by resize/event (see readFormRegion).
      if (viewportParticles) readFormRegion();
      if (frameTiming) {
        ftFrames++;
        if (now - ftLastReport >= 1000) {
          // Report true rate from wall clock, not clamped dt average.
          // dt is clamped at 50ms upstream, so the previous avg-dt
          // calculation lied when RAF was throttled off-screen.
          const elapsedMs = now - ftLastReport;
          const trueHz = (ftFrames * 1000) / elapsedMs;
          const trueDtMs = elapsedMs / ftFrames;
          // eslint-disable-next-line no-console
          console.log(
            `[NucleusHero] ${ftFrames} frames in ${elapsedMs.toFixed(0)}ms · ` +
            `true dt ${trueDtMs.toFixed(2)}ms · ${trueHz.toFixed(1)} Hz`,
          );
          ftFrames = 0;
          ftLastReport = now;
        }
      }

      // Resolve isotope-driven gates per frame (ref read, no re-mount).
      const { fastSpeed: FAST_SPEED, requiredT: REQUIRED_T, shakeNeeded: SHAKE_NEEDED } =
        isotopeToGates(isotopeRef.current);

      // Ease cursor toward target; track velocity. Easing coefficients
      // were tuned at REFERENCE_FRAMERATE_HZ (currently 45, Safari-
      // dev calibration); easeAlpha rescales them for the current RAF
      // dt so every browser converges to the same time constant.
      const px = ptr.x, py = ptr.y;
      const aPos = easeAlpha(dt, 0.10);
      ptr.x += (ptr.tx - ptr.x) * aPos;
      ptr.y += (ptr.ty - ptr.y) * aPos;
      ptr.vx = (ptr.x - px) / dt;
      ptr.vy = (ptr.y - py) / dt;
      ptr.speed = Math.hypot(ptr.vx, ptr.vy);
      smoothSpeed += (ptr.speed - smoothSpeed) * easeAlpha(dt, 0.18);

      // Drain raw input signals captured between frames; decay raw peak speed
      // (~100 ms half-life) so a single brisk flick doesn't latch indefinitely.
      rawSpeed *= Math.pow(0.5, dt * 10);
      const reversalsThisFrame = rawReversals;
      rawReversals = 0;
      const effectiveSpeed = Math.max(smoothSpeed, rawSpeed);

      ctx.clearRect(0, 0, W, H);
      if (!polylines.length || !bbox) {
        scheduleFrame();
        return;
      }

      const phaseBefore = fission.phase;

      drawFrame({
        ctx, W, H, t, dt,
        formCx, formCy, formR,
        ptr, smoothSpeed, effectiveSpeed, reversalsThisFrame,
        cursorAngleRef: { get: () => cursorAngle, set: v => { cursorAngle = v; } },
        polylines, bbox,
        fission,
        FAST_SPEED, REQUIRED_T, SHAKE_NEEDED,
        reduced: prefersReduced,
        ink: inkRef.current,
        // The decimated (small-render) path may skip sub-pixel bulge maths far from
        // the cursor; the full-fidelity path (project page) never does.
        decimated: pointStride > 1,
      });

      // Detect the idle → splitting transition: the moment the user
      // earned the fission. Forwarded to the homepage so it can
      // surface the room invitation after the visual settles.
      if (phaseBefore === 'idle' && fission.phase === 'splitting') {
        onFissionFireRef.current?.();
      }

      stepAndDrawParticles(ctx, fission, dt, H);

      scheduleFrame();
    };
    scheduleFrame();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('atom:formregion', onFormRegion);
      document.removeEventListener('visibilitychange', onVisibility);
      motionMq?.removeEventListener('change', onMotionChange);
      dprMq?.removeEventListener('change', onDprChange);
      window.removeEventListener('devicemotion', onDeviceMotion);
      syncDeviceMotionRef.current = null;
      if (viewportParticles) window.removeEventListener('resize', resize);
      ro.disconnect();
      io.disconnect();
    };
    // paths is stable across the page lifetime (imported JSON);
    // isotope is read through a ref so it never re-runs this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paths]);

  return (
    <div className="hero-icon" ref={containerRef}>
      <canvas ref={canvasRef} />
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// drawFrame - extracted to keep the effect compact. Identical math to the
// canonical vite-port: state machine, half geometry, per-loop drawing.
// ─────────────────────────────────────────────────────────────────────────

interface DrawFrameArgs {
  ctx: CanvasRenderingContext2D;
  W: number; H: number;
  t: number; dt: number;
  formCx: number; formCy: number; formR: number;
  ptr: { x: number; y: number; vx: number; vy: number };
  smoothSpeed: number;
  effectiveSpeed: number;
  reversalsThisFrame: number;
  cursorAngleRef: { get: () => number; set: (v: number) => void };
  polylines: Polyline[];
  bbox: BBox;
  fission: FissionState;
  FAST_SPEED: number;
  REQUIRED_T: number;
  SHAKE_NEEDED: number;
  reduced: boolean;
  ink: string;
  /** True when the polylines were point-decimated (the homepage's small render) -
   * enables the bulge early-out, which the full-fidelity render path never takes. */
  decimated: boolean;
}

function drawFrame(a: DrawFrameArgs): void {
  const { ctx, W, H, t, dt, ptr, smoothSpeed, polylines, bbox, fission, reduced } = a;
  // The nucleus is drawn at the form centre with the form radius as its field -
  // small and offset on the homepage's full-screen canvas, the whole canvas
  // otherwise. The fission particles (below) are not bounded by this, so they
  // fly across the entire canvas.
  const ccx = a.formCx, ccy = a.formCy;
  const fieldR = a.formR;
  const restR = fieldR * TUNING.restRFrac;
  const fit = (restR * 2) / bbox.size;

  const driftMul = reduced ? 0 : 1;
  const driftStrength = fieldR * TUNING.driftStrength * TUNING.strength * driftMul;
  const driftX = ptr.x * driftStrength;
  const driftY = ptr.y * driftStrength;

  const halfSrc = bbox.size / 2;
  const cuxSrc = ptr.x * halfSrc * 1.05;
  const cuySrc = ptr.y * halfSrc * 1.05;

  // Smoothed cursor angle (kept for parity with the canonical version).
  let cursorAngle = a.cursorAngleRef.get();
  const targetAng = Math.atan2(ptr.y, ptr.x);
  let da = targetAng - cursorAngle;
  while (da > Math.PI) da -= 2 * Math.PI;
  while (da < -Math.PI) da += 2 * Math.PI;
  cursorAngle += da * easeAlpha(a.dt, 0.12);
  a.cursorAngleRef.set(cursorAngle);

  const impulse = Math.min(1.4, smoothSpeed * 0.45);
  const breathe = reduced ? 1 : 1 + 0.012 * Math.sin(t * 0.7);
  const baseBulge = TUNING.baseBulge * TUNING.strength;
  const bulgeGain = baseBulge * (1 + impulse * 0.6);

  // ── Fission tension & state machine ────────────────────────────────────
  // Fission is a deliberate user-input easter egg, allowed even under
  // reduced-motion: the user must shake the cursor on purpose.
  // Speed gate uses effectiveSpeed (max of smoothed and raw event speed) so
  // brisk shakes from high-DPI / high-polling mice register past the
  // animation's smoothing. Reversals are sampled raw at the event level.
  const isFast = a.effectiveSpeed > a.FAST_SPEED;
  if (fission.cooldown > 0) fission.cooldown -= dt;
  const cursorR = Math.hypot(ptr.x, ptr.y);
  const nearCentre = cursorR < TUNING.triggerRadius;

  fission.shakeScore += a.reversalsThisFrame;
  fission.shakeScore = Math.max(0, fission.shakeScore - dt * 2.5);

  if (fission.phase === 'idle' && fission.cooldown <= 0) {
    if (isFast && nearCentre) fission.fastT += dt;
    else fission.fastT = Math.max(0, fission.fastT - dt * 1.2);
    const tA = Math.min(1, fission.fastT / a.REQUIRED_T);
    const tB = Math.min(1, fission.shakeScore / a.SHAKE_NEEDED);
    fission.tension = Math.min(tA, tB);
    if (fission.tension >= 1) {
      fission.phase = 'splitting';
      fission.pf = 0;
      const va = 0; // horizontal split, always
      fission.splitAng = va;
      fission.splitX = ccx + driftX;
      fission.splitY = ccy + driftY;
      spawnBurst(fission, fission.splitX, fission.splitY, va, 1.4);
    }
  } else if (fission.phase !== 'idle') {
    const phaseDur =
      fission.phase === 'splitting' ? TUNING.splitTime
      : fission.phase === 'bouncing' ? TUNING.bounceTime
      : fission.phase === 'split' ? TUNING.holdTime
      : TUNING.reformTime;
    fission.pf += dt / phaseDur;
    if (fission.pf >= 1) {
      fission.pf = 0;
      if (fission.phase === 'splitting') fission.phase = 'bouncing';
      else if (fission.phase === 'bouncing') fission.phase = 'split';
      else if (fission.phase === 'split') fission.phase = 'reforming';
      else if (fission.phase === 'reforming') {
        fission.phase = 'idle';
        fission.fastT = 0;
        fission.shakeScore = 0;
        fission.tension = 0;
        fission.cooldown = TUNING.cooldown;
      }
    }
  }

  // ── Half geometry ─────────────────────────────────────────────────────
  let sep = 0;
  let halfScale = 1;
  let squashX = 1;
  let squashY = 1;
  if (fission.phase === 'splitting') {
    const p = fission.pf;
    const e = 1 - Math.pow(1 - p, 3);
    sep = e * fieldR * TUNING.sepOvershoot;
    halfScale = 1 - e * (1 - TUNING.halfScaleRest);
  } else if (fission.phase === 'bouncing') {
    const p = fission.pf;
    const wobble = Math.cos(p * Math.PI * 1.7) * Math.exp(-p * 3.2);
    sep = fieldR * (TUNING.sepRest + (TUNING.sepOvershoot - TUNING.sepRest) * wobble);
    halfScale = TUNING.halfScaleRest;
    const pulseA = Math.exp(-Math.pow((p - 0.15) / 0.10, 2));
    const pulseB = 0.35 * Math.exp(-Math.pow((p - 0.55) / 0.12, 2));
    const sq = pulseA + pulseB;
    squashX = 1 - 0.22 * sq;
    squashY = 1 + 0.16 * sq;
  } else if (fission.phase === 'split') {
    sep = fieldR * TUNING.sepRest + Math.sin(t * 1.4) * fieldR * 0.010;
    halfScale = TUNING.halfScaleRest;
  } else if (fission.phase === 'reforming') {
    const p = fission.pf;
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    sep = (1 - e) * fieldR * TUNING.sepRest;
    halfScale = TUNING.halfScaleRest + e * (1 - TUNING.halfScaleRest);
    const merge = Math.exp(-Math.pow((p - 0.85) / 0.08, 2));
    squashX = 1 + 0.10 * merge;
    squashY = 1 - 0.06 * merge;
  }

  type Half = { ox: number; oy: number; scale: number; sx: number; sy: number };
  const halves: Half[] = fission.phase === 'idle'
    ? [{ ox: 0, oy: 0, scale: 1, sx: 1, sy: 1 }]
    : [
        { ox: Math.cos(fission.splitAng) *  sep, oy: Math.sin(fission.splitAng) *  sep, scale: halfScale, sx: squashX, sy: squashY },
        { ox: Math.cos(fission.splitAng) * -sep, oy: Math.sin(fission.splitAng) * -sep, scale: halfScale, sx: squashX, sy: squashY },
      ];

  // ── Particle bursts driven by phase ───────────────────────────────────
  if (fission.phase === 'splitting') {
    fission.splitX = ccx + driftX;
    fission.splitY = ccy + driftY;
    spawnBurst(fission, fission.splitX, fission.splitY, fission.splitAng, 0.04 + fission.pf * 0.06);
  } else if (fission.phase === 'bouncing') {
    if (!fission.bouncedImpact && fission.pf >= 0.12) {
      fission.bouncedImpact = true;
      const halfRadius = fieldR * TUNING.restRFrac * TUNING.halfScaleRest;
      const sxAng = fission.splitAng;
      spawnBurst(fission, ccx + driftX +  (sep + halfRadius), ccy + driftY, sxAng, 0.45);
      spawnBurst(fission, ccx + driftX - (sep + halfRadius), ccy + driftY, sxAng + Math.PI, 0.45);
    }
  }
  if (fission.phase !== 'bouncing') fission.bouncedImpact = false;

  // ── Soft circular rim squish (tanh) ───────────────────────────────────
  const squish = (x: number, y: number): [number, number] => {
    const rx = x - ccx, ry = y - ccy;
    const r = Math.hypot(rx, ry);
    if (r < 1e-3) return [x, y];
    const r2 = fieldR * Math.tanh(r / fieldR);
    const k = r2 / r;
    return [ccx + rx * k, ccy + ry * k];
  };

  // ── Draw nucleus polylines ────────────────────────────────────────────
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = a.ink; // constant across every line and half - set once
  const N = polylines.length;

  // Hoisted out of the per-point loop (it runs ~66k times per frame at the
  // homepage's stride, double that mid-fission - nothing below varies per point).
  const sigma = halfSrc * 0.50;
  const inv2s2 = 1 / (2 * sigma * sigma);
  const pushBase = bulgeGain * halfSrc * 0.50;
  const dragScale = fission.phase === 'idle' ? 1 : 0.15;
  const dragBase = impulse * halfSrc * 0.18 * dragScale;
  const vxDrag = ptr.vx * 0.6;
  const vyDrag = ptr.vy * 0.6;
  // Beyond bulgeCutoffSigmas of the Gaussian the cursor push it gates is sub-pixel
  // (g < 0.011 at 3 sigma), so the decimated small render skips the exp/sqrt for
  // those points - they are still transformed and drawn, only the push is zeroed.
  // The full-fidelity path keeps the cutoff at Infinity (every point, byte-identical).
  const cutoff = TUNING.bulgeCutoffSigmas * sigma;
  const cutoffSq = a.decimated ? cutoff * cutoff : Infinity;
  // While the nucleus is split, optionally walk every Nth point (the halves render
  // at 0.5 scale, so the dropped vertices stay sub-pixel) - see TUNING.fissionPointStride.
  const kStep = fission.phase === 'idle' ? 1 : Math.max(1, TUNING.fissionPointStride);

  for (let hi = 0; hi < halves.length; hi++) {
    const Hh = halves[hi];
    const halfFit = fit * Hh.scale;
    const halfBreathe = reduced
      ? 1
      : breathe * (1 + (hi ? -0.01 : 0.01) * Math.sin(t * 1.7));

    for (let li = 0; li < N; li++) {
      const L = polylines[li];
      const pts = L.pts;
      const n = L.n;
      const depth = li / (N - 1);

      const alpha = 0.38 + 0.55 * (1 - depth);
      const width = 0.42 + 0.55 * (1 - depth);
      ctx.globalAlpha = alpha;
      ctx.lineWidth = width;

      const dragLine = dragBase * (0.4 + depth * 0.9);
      const jx = reduced ? 0 : 0.18 * Math.sin(t * 0.43 + li * 0.91);
      const jy = reduced ? 0 : 0.18 * Math.cos(t * 0.37 + li * 0.71);

      ctx.beginPath();
      // ki clamps the last step so the polyline always ends on its true final
      // point whatever the stride; with kStep 1 this walk is the canonical one.
      for (let k = 0; ; k += kStep) {
        const ki = k < n ? k : n - 1;
        let dx = pts[ki * 2] - bbox.cx;
        let dy = pts[ki * 2 + 1] - bbox.cy;

        const ddx = dx - cuxSrc;
        const ddy = dy - cuySrc;
        const distSq = ddx * ddx + ddy * ddy;
        if (distSq < cutoffSq) {
          const g = Math.exp(-distSq * inv2s2);
          const distLen = Math.sqrt(distSq) + 1e-3;
          const push = g * pushBase;
          dx += (ddx / distLen) * push;
          dy += (ddy / distLen) * push;

          const drag = g * dragLine;
          dx += vxDrag * drag;
          dy += vyDrag * drag;
        }

        const wob = reduced
          ? 0
          : 0.0055 * Math.sin(t * 0.55 + li * 0.13 + ki * 0.045);
        dx *= halfBreathe * (1 + wob);
        dy *= halfBreathe * (1 + wob);

        const xx = ccx + dx * halfFit * Hh.sx + driftX + Hh.ox + jx;
        const yy = ccy + dy * halfFit * Hh.sy + driftY + Hh.oy + jy;
        const [x, y] = squish(xx, yy);
        if (ki === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        if (ki === n - 1) break;
      }
      ctx.stroke();
    }
  }
}
