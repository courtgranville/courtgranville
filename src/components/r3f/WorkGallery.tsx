// WorkGallery - the /work/ index as a gallery of independently grab-and-spin
// product models on the plain white ground. One React island: each project is
// its own small Canvas carrying a textured GLB you rotate like the homepage
// models, with a "View project" link beneath. The 3D handoff (fit-to-sphere,
// Meshy normalisation, in-engine studio IBL) mirrors ProjectViewer.tsx - the
// proven reference - kept self-contained so this island can't disturb it.
//
// Restraint (per the brief): drag-to-rotate is the only interaction; zoom and
// pan are off so the wheel still scrolls the page, and there is no idle auto-
// spin. Each Canvas runs on the `demand` frameloop, so an untouched cell costs
// nothing - OrbitControls invalidates while you drag (and during the damping
// settle), the entrance tween invalidates itself, and the studio env requests
// one frame once it's ready. Styling lives as global .wg-* CSS on the page.

import { Canvas, useThree } from '@react-three/fiber';
// Barrel import kept deliberately. We measured the alternative: switching to
// deep subpath imports (@react-three/drei/core/OrbitControls + /core/Gltf for
// useGLTF) changed this island's vendor chunk by 6 bytes (88,824 -> 88,818) -
// drei 10 is authored as ESM per-component files, so Vite/Rollup already
// tree-shakes the unused surface out of the barrel. The subpath form buys
// nothing and is more fragile (drei 10 has no `exports` map, so the deep paths
// could break on a minor bump), so the barrel stays.
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import NuclearAtom from '../nuclear/NuclearAtom';
import ModelBoundary from './ModelBoundary';

// Hysteresis on the off-screen pause: a cell activates immediately on enter but
// waits this long before pausing on leave, and a re-enter cancels the pending
// pause - so a rapid flick-scroll can't thrash a cell's frameloop always/never
// many times a second.
const PAUSE_DELAY_MS = 400;

type Project = {
  name: string;
  year: number;
  discipline: string;
  slug: string;
  model?: string;    // absent for web/data projects shown as the live atom (TNQ)
  fill?: number;     // how much of the frame the bounding sphere fills
  viewRY?: number;   // resting yaw / pitch - the pose the cell opens on
  viewRX?: number;
};
type Props = { projects: Project[] };

// Fill the frame to the bounding SPHERE (rotation-invariant → can't clip at any
// spin angle); SAFETY keeps a hair of margin. Slightly looser than the homepage
// since a grid cell wants air around each object.
const DEFAULT_FILL = 0.86;
const SAFETY = 0.97;

// Scale that makes a bounding-sphere of `radius` fill `fill` of the frame at the
// fixed camera distance + viewport aspect (binds on the tighter axis). Zoom is
// off, so distance is constant; recomputes only on resize.
function useFitScale(radius: number, fill: number) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  return useMemo(() => {
    const dist = camera.position.length();
    const fovV = THREE.MathUtils.degToRad(camera.fov);
    const aspect = size.width / Math.max(1, size.height);
    const fovH = 2 * Math.atan(Math.tan(fovV / 2) * aspect);
    const rFit = dist * Math.sin(Math.min(fovV, fovH) / 2) * SAFETY;
    return (rFit * fill) / (radius || 1);
  }, [camera, size.width, size.height, fill, radius]);
}

// PMREM source-cube size for the prefiltered env. CONSTRAINT, do not re-flag as
// a leak: each cell is its own Canvas => its own WebGLRenderer => its own GL
// context, so a GPU-side env texture CANNOT be shared across cells (a texture
// belongs to the context that allocated it). The only lever left is making each
// per-context prefilter cheaper. RoomEnvironment is a smooth, low-frequency
// studio box, so halving the source cube (128px vs PMREM's 256 default) is a
// real saving on the 7 identical passes with no visible change to the reflections
// on these matte/semi-rough product surfaces at gallery scale.
const ENV_SIZE = 128;

// Neutral studio IBL generated in-engine (no HDRI download → safe for the static
// Cloudflare deploy). Requests one frame once ready, since we run on `demand`.
function StudioEnv() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04, 0.1, 100, { size: ENV_SIZE }).texture;
    scene.environment = env;
    invalidate();
    return () => { scene.environment = null; env.dispose(); pmrem.dispose(); };
  }, [gl, scene, invalidate]);
  return null;
}

function Model({ url, fill, viewRY, viewRX, onReady }: { url: string; fill: number; viewRY: number; viewRX: number; onReady?: () => void }) {
  const { scene } = useGLTF(url);
  const maxAniso = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const invalidate = useThree((s) => s.invalidate);
  const inner = useRef<THREE.Group>(null!);

  // useGLTF suspends until the GLB is decoded, so this component only mounts once the
  // model is ready - tell the cell to fade its loading skeleton out.
  useEffect(() => { onReady?.(); }, [onReady]);

  // Clone (so the cached gltf isn't mutated across StrictMode / re-mounts),
  // normalise Meshy output (ensure normals, sRGB + anisotropy on maps), recentre
  // on the bounding-sphere centre, report the raw radius for fit scaling.
  const { obj, radius } = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((n) => {
      const mesh = n as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (!mesh.geometry.attributes.normal) mesh.geometry.computeVertexNormals();
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat?.map) { mat.map.colorSpace = THREE.SRGBColorSpace; mat.map.anisotropy = maxAniso; }
    });
    const sphere = new THREE.Box3().setFromObject(root).getBoundingSphere(new THREE.Sphere());
    root.position.sub(sphere.center);
    return { obj: root, radius: sphere.radius || 1 };
  }, [scene, maxAniso]);

  const scale = useFitScale(radius, fill);

  // Inner group carries the entrance + resting pose so the outer fit-scale (which
  // also updates on resize) isn't overwritten. invalidate on each tick because we
  // render on demand.
  useGSAP(() => {
    inner.current.rotation.set(viewRX, viewRY, 0);
    gsap.fromTo(inner.current.scale, { x: 0.92, y: 0.92, z: 0.92 },
      { x: 1, y: 1, z: 1, duration: 0.7, ease: 'power3.out', onUpdate: invalidate });
    gsap.from(inner.current.rotation, { y: viewRY - 0.5, duration: 0.9, ease: 'power3.out', onUpdate: invalidate });
  }, { dependencies: [url, viewRY, viewRX] });

  return (
    <group scale={scale}>
      <group ref={inner}><primitive object={obj} /></group>
    </group>
  );
}

// The atom cell (The Nuclear Question - no GLB) is just the live NuclearAtom
// island plus the caption: NuclearAtom owns its own IntersectionObserver pause,
// so the Cell's IO + active/loaded state were dead wiring here (a useless
// observer + setActive re-renders). Split it out so only model cells pay for the
// observer + frameloop machinery.
function AtomCell({ p }: { p: Project }) {
  return (
    <article className="wg-cell">
      <div className="wg-stage wg-stage--atom">
        <NuclearAtom compact />
      </div>
      <a className="wg-cap" href={`/work/${p.slug}/`}>
        <span className="wg-name">{p.name}</span>
        <span className="wg-meta label">{p.year} · {p.discipline}</span>
        <span className="wg-link label">View project &rarr;</span>
      </a>
    </article>
  );
}

function ModelCell({ p }: { p: Project }) {
  // Render only while the cell is on (or near) screen: an off-screen cell pauses
  // its loop so a wall of canvases stays cheap, and `rootMargin` re-arms it just
  // before it scrolls into view so the model is always painted by the time it's
  // seen - no blank pre-load frame, no compositor-cleared buffer.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  // `loaded` drives the skeleton fade; on a GLB failure ModelBoundary flips it
  // too, so the skeleton stops pulsing and the cell rests as a clean empty stage
  // (the caption / View-project link below stays usable either way).
  const [loaded, setLoaded] = useState(false);
  // Stable callback so Model's `useEffect(..., [onReady])` fires once on ready,
  // not on every parent commit (an inline arrow would be a fresh ref each render).
  const onReady = useCallback(() => setLoaded(true), []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    // Hysteresis: activate immediately on enter, but DELAY the pause on leave -
    // a rapid flick-scroll would otherwise toggle frameloop always/never many
    // times a second. A pending pause is cancelled if the cell re-enters first.
    let pauseTimer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (pauseTimer !== undefined) { clearTimeout(pauseTimer); pauseTimer = undefined; }
        setActive(true);
      } else {
        if (pauseTimer !== undefined) clearTimeout(pauseTimer);
        pauseTimer = setTimeout(() => { setActive(false); pauseTimer = undefined; }, PAUSE_DELAY_MS);
      }
    }, { threshold: 0, rootMargin: '300px 0px' });
    io.observe(el);
    return () => { if (pauseTimer !== undefined) clearTimeout(pauseTimer); io.disconnect(); };
  }, []);

  return (
    <article className="wg-cell">
      <div className="wg-stage" ref={wrapRef}>
        {/* Faint placeholder behind the transparent canvas so the cell never flashes
            empty while the GLB streams; fades out once the model is ready. */}
        <div className={`wg-skeleton${loaded ? ' is-loaded' : ''}`} aria-hidden="true" />
        <Canvas
          frameloop={active ? 'always' : 'never'}
          dpr={[1, 1.5]} // capped: on a 4K viewport DPR 2 cells are 4x the pixels of 1.5 for no visible gain at this stage size - Firefox's GL stack in particular pays heavily
          camera={{ position: [1.0, 0.45, 3.0], fov: 32 }}
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false, toneMapping: THREE.ACESFilmicToneMapping }}
          // Absolute (inline, so it overrides R3F's own inline position:relative)
          // pulls the canvas out of flow - its drawing-buffer height can't feed
          // back into the .wg-stage aspect box and inflate it frame-by-frame.
          style={{ position: 'absolute', inset: 0 }}
        >
          <StudioEnv />
          <directionalLight position={[2, 3, 2]} intensity={1.1} />
          <directionalLight position={[-2, 0.5, -1.5]} intensity={0.35} />
          {/* ModelBoundary catches a failed/aborted GLB (which throws past the
              Suspense fallback) and fades the skeleton so the cell rests empty. */}
          <ModelBoundary onError={onReady}>
            <Suspense fallback={null}>
              <Model url={p.model!} fill={p.fill ?? DEFAULT_FILL} viewRY={p.viewRY ?? 0} viewRX={p.viewRX ?? 0} onReady={onReady} />
            </Suspense>
          </ModelBoundary>
          <OrbitControls
            makeDefault
            enableZoom={false}
            enablePan={false}
            enableDamping
            dampingFactor={0.09}
            rotateSpeed={0.9}
            minPolarAngle={0.18}
            maxPolarAngle={2.95}
          />
        </Canvas>
      </div>
      <a className="wg-cap" href={`/work/${p.slug}/`}>
        <span className="wg-name">{p.name}</span>
        <span className="wg-meta label">{p.year} · {p.discipline}</span>
        <span className="wg-link label">View project &rarr;</span>
      </a>
    </article>
  );
}

function Cell({ p }: { p: Project }) {
  // Projects with no GLB (The Nuclear Question) are shown as the live atom - a
  // compact, cursor-reactive nucleus - instead of an R3F model canvas.
  return p.model ? <ModelCell p={p} /> : <AtomCell p={p} />;
}

export default function WorkGallery({ projects }: Props) {
  return (
    <div className="wg-grid">
      {projects.map((p) => <Cell key={p.slug} p={p} />)}
    </div>
  );
}
