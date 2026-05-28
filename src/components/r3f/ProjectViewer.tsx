// ProjectViewer — the Selected-Work 3D stage as a React island (R3F + drei +
// GSAP), the "richer, stateful 3D" path from CLAUDE.md. Each project is a
// textured GLB you grab and spin like a modelling viewport. The editorial chrome
// (index, name, meta, prev/next) stays static in Carousel.astro and drives this
// island by dispatching a `cg:project` CustomEvent with the new index — so only
// this stage hydrates, mounted client:visible.
//
// Restraint (per the brief): drag-to-rotate is the only interaction. Zoom and
// pan are disabled so the wheel keeps scrolling the page; there is no idle auto-
// spin — the hero is the site's single kinetic "wow". Switching projects plays a
// brief GSAP settle, nothing more. The render loop pauses while off-screen.

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, useTexture } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

type Project = { name?: string; model?: string; src?: string; fill?: number };
type Props = { projects: Project[]; eventName?: string };

// How much of the frame's tighter axis the object's bounding SPHERE fills.
// The sphere is rotation-invariant, so framing to fit it guarantees the object
// can never clip at any spin angle. Per-project `fill` overrides this (e.g.
// Mantis fills more — it's the largest product). SAFETY keeps a hair of margin.
const DEFAULT_FILL = 0.92;
const IMAGE_FILL = 0.86;
const SAFETY = 0.97;

// Scale that makes a bounding-sphere of `radius` fill `fill` of the frame at the
// current camera distance + viewport aspect (binds on the tighter axis).
// Recomputes on resize; independent of orbit angle (zoom is off → distance fixed).
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
// Cloudflare deploy). Gives PBR materials correct soft reflections.
function StudioEnv() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => { scene.environment = null; env.dispose(); pmrem.dispose(); };
  }, [gl, scene]);
  return null;
}

function Model({ url, fill }: { url: string; fill: number }) {
  const { scene } = useGLTF(url);
  const maxAniso = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const inner = useRef<THREE.Group>(null!);

  // Clone (so the cached gltf isn't mutated across shows / StrictMode), normalise
  // Meshy output (ensure normals, sRGB + anisotropy on maps), recentre on the
  // bounding-sphere centre, and report the raw sphere radius for fit scaling.
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
    root.position.sub(sphere.center);                 // sphere centre → origin (orbit pivot)
    return { obj: root, radius: sphere.radius || 1 };
  }, [scene, maxAniso]);

  const scale = useFitScale(radius, fill);

  // Inner group carries the GSAP entrance so the outer fit-scale (which also
  // updates on resize) isn't overwritten by the tween.
  useGSAP(() => {
    gsap.fromTo(inner.current.scale, { x: 0.9, y: 0.9, z: 0.9 },
      { x: 1, y: 1, z: 1, duration: 0.55, ease: 'power3.out' });
    gsap.from(inner.current.rotation, { y: -0.5, duration: 0.75, ease: 'power3.out' });
  }, { dependencies: [url] });

  return (
    <group scale={scale}>
      <group ref={inner}><primitive object={obj} /></group>
    </group>
  );
}

// Fallback for projects with no model (e.g. an app design) — the cutout shown
// flat, facing the viewer; orbit is disabled for these.
function ImagePlane({ src, fill }: { src: string; fill: number }) {
  const tex = useTexture(src);
  tex.colorSpace = THREE.SRGBColorSpace;
  const img = tex.image as { width?: number; height?: number } | undefined;
  const a = (img?.width ?? 1) / (img?.height ?? 1);
  const radius = 0.5 * Math.hypot(a, 1);
  const scale = useFitScale(radius, fill);
  return (
    <group scale={scale}>
      <mesh>
        <planeGeometry args={[a, 1]} />
        <meshBasicMaterial map={tex} transparent alphaTest={0.02} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function ProjectViewer({ projects, eventName = 'cg:project' }: Props) {
  const [index, setIndex] = useState(0);
  const [active, setActive] = useState(true);   // off-screen → pause the loop
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onEvt = (e: Event) => {
      const i = (e as CustomEvent<{ index: number }>).detail?.index;
      if (typeof i === 'number') setIndex(i);
    };
    window.addEventListener(eventName, onEvt);
    return () => window.removeEventListener(eventName, onEvt);
  }, [eventName]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cur = projects[index];
  const hasModel = !!cur?.model;

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%' }}>
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={[1, 2]}
        camera={{ position: [1.0, 0.45, 3.0], fov: 32 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }}
      >
        <StudioEnv />
        <directionalLight position={[2, 3, 2]} intensity={1.1} />
        <directionalLight position={[-2, 0.5, -1.5]} intensity={0.35} />
        <Suspense fallback={null}>
          {hasModel ? <Model key={cur!.model} url={cur!.model!} fill={cur!.fill ?? DEFAULT_FILL} />
            : cur?.src ? <ImagePlane key={cur.src} src={cur.src} fill={cur.fill ?? IMAGE_FILL} /> : null}
        </Suspense>
        <OrbitControls
          makeDefault
          enabled={hasModel}
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
  );
}
