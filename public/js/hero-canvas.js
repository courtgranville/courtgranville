// hero-canvas.js — a reusable "3D image canvas": a project hero image wrapped
// over a lit, cursor-parallax card. Shared by the Work index and the homepage
// Selected-Work carousel.
//
// Loaded by <script is:inline type="module"> so the page's CDN import map
// (Layout.astro) resolves `three` and the addons without Vite bundling.
//
// mountHeroCanvas(canvasEl, opts) → { show(hero), destroy() }
//   hero = { src, aspect }  (from src/content/projects-images.json)
//
// The renderer is sized to the canvas element (no scissor) — the canvas *is*
// the framed cell. The card fills the cell, preserving each image's aspect.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function mountHeroCanvas(canvas, opts = {}) {
  const camZ  = opts.camZ  ?? 7;
  const fill  = opts.fill  ?? 0.9;     // fraction of the cell the canvas fills
  const tiltX = opts.tiltX ?? 0.22;    // max pitch (rad) at the parallax edge
  const tiltY = opts.tiltY ?? 0.30;    // max yaw   (rad)
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, camZ);
  scene.add(new THREE.AmbientLight(0xffffff, 0.62));
  const key = new THREE.DirectionalLight(0xffffff, 0.85); key.position.set(-5, 7, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.40); rim.position.set(6, -3, 4); scene.add(rim);

  const mat  = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.0 });
  const card = new THREE.Mesh(new RoundedBoxGeometry(1, 1, 0.14, 5, 0.045), mat);
  scene.add(card);

  const loader = new THREE.TextureLoader();
  const onAspect = opts.onAspect || null;   // report the image's true aspect to the host
  let aspect = 1;

  function sizeRenderer() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  function fit(a) {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    const vH = 2 * camZ * Math.tan(camera.fov * Math.PI / 360);
    const vW = vH * (w / h);
    const ch = Math.min(fill * vH, fill * vW / a);
    return { w: ch * a, h: ch };
  }
  function applyGeom(a) {
    const { w, h } = fit(a);
    card.geometry.dispose();
    card.geometry = new RoundedBoxGeometry(w, h, 0.14, 5, 0.045);
  }
  function show(hero) {
    if (!hero) return;
    // Use the ACTUAL decoded image dimensions, not a manifest value that may
    // disagree with a re-cropped hero — this is what prevents squishing.
    loader.load(hero.src, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = maxAniso;
      const iw = tex.image && tex.image.width, ih = tex.image && tex.image.height;
      aspect = (iw && ih) ? iw / ih : (hero.aspect || 1);
      if (onAspect) onAspect(aspect);   // host reshapes the frame to match
      applyGeom(aspect);
      const prev = mat.map; mat.map = tex; mat.needsUpdate = true;
      if (prev) prev.dispose();
    });
  }

  // cursor parallax — relative to the canvas, clamped so a far cursor (e.g.
  // over the index list) can't spin the card past a tasteful angle
  const tgt = { x: 0, y: 0 }; let active = false;
  const clamp = (v) => Math.max(-1, Math.min(1, v));
  function onMove(e) {
    const r = canvas.getBoundingClientRect();
    tgt.x = clamp((e.clientX - (r.left + r.width / 2)) / r.width);
    tgt.y = clamp((e.clientY - (r.top + r.height / 2)) / r.height);
    active = true;
  }
  function onLeave() { active = false; }
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerleave', onLeave);

  sizeRenderer();
  const ro = new ResizeObserver(() => { sizeRenderer(); applyGeom(aspect); });
  ro.observe(canvas);

  let t = 0, raf = null, visible = true, last = performance.now();
  function tick(now) {
    raf = visible ? requestAnimationFrame(tick) : null;
    const dt = Math.min((now - last) / 1000, 1 / 30); last = now; t += dt;
    const ay = active && !reduced ? tgt.x * tiltY : 0;
    const ax = active && !reduced ? tgt.y * tiltX : 0;
    const idY = reduced ? 0 : Math.sin(t * 0.4) * 0.08;
    const idX = reduced ? 0 : Math.sin(t * 0.33) * 0.03;
    card.rotation.y += ((ay + idY) - card.rotation.y) * 0.08;
    card.rotation.x += ((ax + idX) - card.rotation.x) * 0.08;
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(tick);

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && raf === null) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }, { threshold: 0 });
  io.observe(canvas);

  return {
    show,
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      card.geometry.dispose(); if (mat.map) mat.map.dispose(); mat.dispose(); renderer.dispose();
    },
  };
}
