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
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import NuclearAtom from '../nuclear/NuclearAtom';

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

// Neutral studio IBL generated in-engine (no HDRI download → safe for the static
// Cloudflare deploy). Requests one frame once ready, since we run on `demand`.
function StudioEnv() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
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

function Cell({ p }: { p: Project }) {
  // Render only while the cell is on (or near) screen: an off-screen cell pauses
  // its loop so a wall of canvases stays cheap, and `rootMargin` re-arms it just
  // before it scrolls into view so the model is always painted by the time it's
  // seen - no blank pre-load frame, no compositor-cleared buffer.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0, rootMargin: '300px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Projects with no GLB (The Nuclear Question) are shown as the live atom - a
  // compact, cursor-reactive nucleus - instead of an R3F model canvas.
  if (!p.model) {
    return (
      <article className="wg-cell">
        <div className="wg-stage wg-stage--atom" ref={wrapRef}>
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

  return (
    <article className="wg-cell">
      <div className="wg-stage" ref={wrapRef}>
        {/* Faint placeholder behind the transparent canvas so the cell never flashes
            empty while the GLB streams; fades out once the model is ready. */}
        <div className={`wg-skeleton${loaded ? ' is-loaded' : ''}`} aria-hidden="true" />
        <Canvas
          frameloop={active ? 'always' : 'never'}
          dpr={[1, 2]}
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
          <Suspense fallback={null}>
            <Model url={p.model!} fill={p.fill ?? DEFAULT_FILL} viewRY={p.viewRY ?? 0} viewRX={p.viewRX ?? 0} onReady={() => setLoaded(true)} />
          </Suspense>
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

export default function WorkGallery({ projects }: Props) {
  return (
    <div className="wg-grid">
      {projects.map((p) => <Cell key={p.slug} p={p} />)}
    </div>
  );
}
