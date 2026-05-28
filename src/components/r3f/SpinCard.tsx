// Minimal react-three-fiber island — proof that React + R3F + drei + GSAP run
// as an Astro island. Mount with `client:visible`. This is the pattern future
// 3D interactions should follow (declarative scene + GSAP for choreography),
// living alongside the static editorial pages.

import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import type * as THREE from 'three';

function Card() {
  const ref = useRef<THREE.Mesh>(null!);

  useEffect(() => {
    // GSAP entrance — scale + a settle in rotation.
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
