// ProjectModel - the single grab-and-spin product model that now opens every
// project page. One large Canvas carrying the project's textured GLB, the same
// 3D handoff the /work/ gallery uses (fit-to-bounding-sphere, Meshy normalise,
// in-engine studio IBL) so the object reads identically wherever it appears -
// kept self-contained so this island can't disturb WorkGallery or the hero.
//
// Restraint (per the brief): drag-to-rotate is the only interaction. Zoom and
// pan are off so the wheel still scrolls the page; there is no idle auto-spin.
// Runs on the `demand` frameloop and pauses while scrolled off-screen, so the
// stage costs nothing once you've moved past it. Styling lives as global .proj-
// stage CSS on the page.

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

type Props = {
  model: string;
  fill?: number;
  viewRY?: number;
  viewRX?: number;
};

const DEFAULT_FILL = 0.9;
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

function Model({ url, fill, viewRY, viewRX }: { url: string; fill: number; viewRY: number; viewRX: number }) {
  const { scene } = useGLTF(url);
  const maxAniso = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const invalidate = useThree((s) => s.invalidate);
  const inner = useRef<THREE.Group>(null!);

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
      { x: 1, y: 1, z: 1, duration: 0.8, ease: 'power3.out', onUpdate: invalidate });
    gsap.from(inner.current.rotation, { y: viewRY - 0.6, duration: 1.0, ease: 'power3.out', onUpdate: invalidate });
  }, { dependencies: [url, viewRY, viewRX] });

  return (
    <group scale={scale}>
      <group ref={inner}><primitive object={obj} /></group>
    </group>
  );
}

export default function ProjectModel({ model, fill = DEFAULT_FILL, viewRY = 0, viewRX = 0 }: Props) {
  // Pause the loop once the stage scrolls off-screen; re-arm a little before it
  // returns so the model is always painted by the time it's seen again.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0, rootMargin: '300px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="proj-stage-canvas" ref={wrapRef}>
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={[1, 2]}
        camera={{ position: [1.0, 0.45, 3.0], fov: 32 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping }}
        // Absolute (inline, overriding R3F's own inline position:relative) pulls the
        // canvas out of flow so its drawing-buffer height can't feed back into the
        // stage box's height and inflate it frame-by-frame.
        style={{ position: 'absolute', inset: 0 }}
      >
        <StudioEnv />
        <directionalLight position={[2, 3, 2]} intensity={1.1} />
        <directionalLight position={[-2, 0.5, -1.5]} intensity={0.35} />
        <Suspense fallback={null}>
          <Model url={model} fill={fill} viewRY={viewRY} viewRX={viewRX} />
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
  );
}
