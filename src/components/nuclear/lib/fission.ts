/**
 * Tuning constants for the nucleus hero animation.
 * All magic numbers from the original vanilla JS, surfaced here.
 */
export const TUNING = {
  // Cursor magnetism / drift
  driftStrength: 0.24, // fraction of fieldR pulled toward cursor
  baseBulge: 0.13,     // proximity-bulge base gain
  strength: 1.5,       // global multiplier (was the 'magnetism' tweak)

  // Sizing
  fieldRFrac: 0.54,    // field radius = min(W,H) * this
  restRFrac: 0.66,     // rest nucleus radius = fieldR * this

  // Fission gating
  triggerRadius: 0.85, // cursor must be within this normalised radius
  fastSpeedBase: 2.0,
  requiredTBase: 2.2,

  // Phase durations (seconds)
  splitTime: 0.55,
  bounceTime: 0.55,
  holdTime: 1.0,
  reformTime: 1.2,
  cooldown: 1.2,

  // Half geometry (fraction of fieldR)
  sepRest: 0.50,
  sepOvershoot: 0.74,
  halfScaleRest: 0.50,

  // Particles
  burstColors: ['#fff2a8', '#fde274', '#f3c13a', '#e8b51c', '#f59321', '#ef6b1a', '#d44214', '#a02410'] as const,
  maxParticles: 9000,
  burstCount: 4800,
  particleGravity: 520,

  // Performance tunables - defaults preserve the canonical look exactly.
  // Fading particles (life <= 0.3) are batched into this many alpha levels so the
  // tail of a burst is a handful of Path2D fills, not thousands of individual
  // arc/fill calls. 8 levels keeps the worst-case alpha error to half a bucket
  // (~6%) on dots already faint and dying; raise to 16 if banding is ever visible.
  fadeAlphaBuckets: 8,
  // On the decimated (small-render) nucleus only: skip the cursor-bulge maths for
  // points beyond this many sigmas of the Gaussian, where the displacement it
  // would add is sub-pixel (g < 0.011 at 3 sigma). Points are still drawn - only
  // the invisible push is zeroed. The full-fidelity render path ignores this.
  bulgeCutoffSigmas: 3,
  // Draw every Nth polyline point while the nucleus is split (the halves render at
  // 0.5 scale, so a stride of 2 keeps on-screen vertex spacing near the idle look
  // and returns fission's doubled point cost to roughly idle cost). 1 = off, the
  // canonical full-vertex fission - a lever, not a default.
  fissionPointStride: 1,
  // Cap on dead particles kept in the recycle pool. Without it the freeList grows to
  // ~maxParticles and pins that whole array of objects forever after the first big
  // burst. A single typical burst's worth of spares is enough to recycle through the
  // next without re-allocating; the excess is dropped (let GC reclaim it) once a burst
  // has settled. Derived from burstCount so it scales with the burst size.
  freeListCap: 2400,

  // Devicemotion shake-to-fission (touch devices). On a phone there is no cursor
  // to shake, so a physical shake of the handset drives the SAME fission as a
  // cursor shake: the devicemotion handler injects into the same raw reversal /
  // speed channels the pointer path feeds, and the shared state machine takes it
  // from there. These thresholds gate what counts as a deliberate shake (vs the
  // small jitter of holding a phone) so the atom never fissions by accident.
  deviceMotion: {
    // A "jerk" (change in acceleration between samples, m/s^2) below this is treated
    // as hand-tremor and ignored. devicemotion fires ~60Hz, so this is per-sample.
    jerkThreshold: 12,
    // Reversal: the jerk direction flipped against the previous jerk (dot < 0) AND
    // both jerks cleared jerkThreshold - i.e. a genuine back-and-forth shake, not a
    // single jolt. Each reversal feeds one bump into the shared shakeScore channel.
    // Below this magnitude a reversal still counts but injects no extra raw speed.
    reversalMinJerk: 14,
    // Normalised-units/sec written into the raw speed channel per qualifying shake
    // sample, so effectiveSpeed clears the isotope FAST_SPEED gate (1.0 on U-238)
    // the way a brisk cursor flick would. The shared per-frame decay drains it.
    rawSpeedInject: 3.0,
  },
} as const;

export type FissionPhase = 'idle' | 'splitting' | 'bouncing' | 'split' | 'reforming';

export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  maxLife: number;
  size: number;
  ci: number; // color index into burstColors
}

export interface FissionState {
  tension: number;
  fastT: number;
  shakeScore: number;
  phase: FissionPhase;
  pf: number;
  splitAng: number;
  splitX: number; splitY: number;
  particles: Particle[];
  /** Recycled dead particles - spawnBurst pops from here before allocating, so a
   * burst stops churning thousands of fresh objects (and GC pauses) per fission. */
  freeList: Particle[];
  cooldown: number;
  bouncedImpact: boolean;
}

export function makeFissionState(): FissionState {
  return {
    tension: 0,
    fastT: 0,
    shakeScore: 0,
    phase: 'idle',
    pf: 0,
    splitAng: 0,
    splitX: 0, splitY: 0,
    particles: [],
    freeList: [],
    cooldown: 0,
    bouncedImpact: false,
  };
}

/** Map isotope (0..1) → (FAST_SPEED, REQUIRED_T, shakeNeeded). U-235 stable, U-238 enriched (much easier). */
export function isotopeToGates(
  isotope: number,
): { fastSpeed: number; requiredT: number; shakeNeeded: number } {
  const k = Math.max(0, Math.min(1, isotope));
  return {
    fastSpeed: 2.4 - k * 1.4,   // 2.4 → 1.0
    requiredT: 1.9 - k * 1.5,   // 1.9s → 0.4s
    shakeNeeded: 8 - k * 4,     // 8 → 4 reversals
  };
}
