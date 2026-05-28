// SpinCard — the minimal react-three-fiber island, kept as the canonical
// reference for the R3F + drei + GSAP pattern (see /lab/). Mount with
// client:visible. The shape: a declarative scene, GSAP via the useGSAP hook for
// choreography, useFrame for per-frame motion. Copy this when building new 3D
// sections; ProjectViewer.tsx is the real-world example.

import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import type * as THREE from 'three';

function Card() {
  const ref = useRef<THREE.Mesh>(null!);

  useGSAP(() => {
    gsap.from(ref.current.scale, { x: 0, y: 0, z: 0, duration: 1.1, ease: 'expo.out' });
    gsap.from(ref.current.rotation, { x: -0.6, duration: 1.4, ease: 'power3.out' });
  }, []);

  useFrame((_, dt) => { ref.current.rotation.y += dt * 0.3; });

  return (
    <RoundedBox ref={ref} args={[2.4, 3, 0.22]} radius={0.08} smoothness={4}>
      <meshStandardMaterial color="#161616" roughness={0.42} metalness={0.05} />
    </RoundedBox>
  );
}

export default function SpinCard() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 35 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <ambientLight intensity={0.62} />
      <directionalLight position={[-5, 7, 9]} intensity={0.85} />
      <directionalLight position={[6, -3, 4]} intensity={0.4} />
      <Card />
    </Canvas>
  );
}
