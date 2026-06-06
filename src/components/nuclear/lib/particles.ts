import type { FissionState } from './fission';
import { TUNING } from './fission';

const { burstColors, maxParticles, burstCount, fadeAlphaBuckets, freeListCap } = TUNING;

export function spawnBurst(
  state: FissionState,
  x: number, y: number,
  ang: number,
  intensity = 1,
): void {
  const N = Math.floor(burstCount * intensity);
  const room = maxParticles - state.particles.length;
  const count = Math.min(N, Math.max(0, room));
  const free = state.freeList;
  for (let i = 0; i < count; i++) {
    const radial = Math.random() < 0.55;
    const a = radial
      ? Math.random() * Math.PI * 2
      : ang + (Math.random() - 0.5) * 1.4 + (Math.random() < 0.5 ? 0 : Math.PI);
    const speed = 120 + Math.random() * 1080;
    const ci = Math.min(
      burstColors.length - 1,
      Math.floor(Math.pow(Math.random(), 1.6) * burstColors.length),
    );
    // Recycle a dead particle when one is available - the splitting phase spawns
    // hundreds per frame and the bounce impact thousands in one, so allocating
    // fresh objects every burst meant GC pauses exactly when frame budget is
    // tightest. Every field is re-initialised, so a pooled object is
    // indistinguishable from a fresh one.
    const p = free.pop();
    if (p) {
      p.x = x; p.y = y;
      p.vx = Math.cos(a) * speed;
      p.vy = Math.sin(a) * speed;
      p.life = 1;
      p.maxLife = 1.6 + Math.random() * 2.6;
      p.size = 0.7 + Math.random() * 1.8;
      p.ci = ci;
      state.particles.push(p);
    } else {
      state.particles.push({
        x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 1,
        maxLife: 1.6 + Math.random() * 2.6,
        size: 0.7 + Math.random() * 1.8,
        ci,
      });
    }
  }
}

/**
 * Step + draw all particles. Mutates state.particles (compaction).
 * Batched fills (one path per color) for performance.
 */
export function stepAndDrawParticles(
  ctx: CanvasRenderingContext2D,
  state: FissionState,
  dt: number,
  H: number,
): void {
  if (state.particles.length === 0) return;
  const GRAVITY = TUNING.particleGravity;
  const FLOOR = H - 1;
  const NC = burstColors.length;
  // dt is constant for the whole step, so the exponential velocity damping is
  // two pow calls per frame here - not two per particle (up to 18k at peak).
  const dampX = Math.pow(0.78, dt);
  const dampY = Math.pow(0.985, dt);
  const fullPaths: (Path2D | null)[] = new Array(NC).fill(null);
  // Fading particles (life <= 0.3) are batched per (color, alpha-bucket) Path2D -
  // see TUNING.fadeAlphaBuckets. Unbatched, the tail of a burst degenerated to
  // thousands of individual beginPath/arc/fill calls with per-particle alpha.
  const NB = fadeAlphaBuckets;
  const fadePaths: (Path2D | null)[] = new Array(NC * NB).fill(null);

  const arr = state.particles;
  const free = state.freeList;
  let write = 0;
  for (let i = 0; i < arr.length; i++) {
    const p = arr[i];
    p.vy += GRAVITY * dt;
    p.vx *= dampX;
    p.vy *= dampY;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.y > FLOOR) {
      p.y = FLOOR;
      p.vy = -p.vy * 0.28;
      p.vx *= 0.55;
      if (Math.abs(p.vy) < 12) p.vy = 0;
    }
    p.life -= dt / p.maxLife;
    if (p.life <= 0) { free.push(p); continue; }
    arr[write++] = p;
    let path: Path2D | null;
    if (p.life > 0.3) {
      path = fullPaths[p.ci];
      if (!path) {
        path = new Path2D();
        fullPaths[p.ci] = path;
      }
    } else {
      const b = Math.min(NB - 1, Math.floor((p.life / 0.3) * NB));
      const bi = p.ci * NB + b;
      path = fadePaths[bi];
      if (!path) {
        path = new Path2D();
        fadePaths[bi] = path;
      }
    }
    path.moveTo(p.x + p.size, p.y);
    path.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  }
  arr.length = write;
  // Trim the recycle pool back to its cap so a burst's worth of dead objects isn't
  // retained forever (the freeList would otherwise grow to ~maxParticles and pin the
  // whole set after the first big fission). Done here, once per frame, so the excess
  // is shed as a burst settles - spawnBurst still finds plenty to recycle next time.
  if (free.length > freeListCap) free.length = freeListCap;

  ctx.globalAlpha = 1;
  for (let c = 0; c < NC; c++) {
    const path = fullPaths[c];
    if (!path) continue;
    ctx.fillStyle = burstColors[c];
    ctx.fill(path);
  }
  for (let c = 0; c < NC; c++) {
    let styled = false;
    for (let b = 0; b < NB; b++) {
      const path = fadePaths[c * NB + b];
      if (!path) continue;
      if (!styled) { ctx.fillStyle = burstColors[c]; styled = true; }
      // Bucket midpoint stands in for each particle's exact alpha - at 8 buckets
      // the worst case is half a bucket (~6% alpha) on 1-3px dots that are
      // already below 30% opacity and dying. Raise fadeAlphaBuckets if visible.
      ctx.globalAlpha = ((b + 0.5) / NB);
      ctx.fill(path);
    }
  }
  ctx.globalAlpha = 1;
}
