// hero-canvas.js — a reusable "3D image canvas": a project hero image wrapped
// over a lit, cursor-parallax CARD (a real dimensional slab, not a flat plane).
// Shared by the Work index and the homepage Selected-Work carousel.
//
// Loaded by <script is:inline type="module"> so the page's CDN import map
// (Layout.astro) resolves `three` without Vite bundling.
//
// mountHeroCanvas(canvasEl, opts) → { show(hero), preload(srcs), destroy() }
//   hero = { src, aspect }  (from src/content/projects-images.json)
//
// The renderer is sized to the canvas element (no scissor) — the canvas *is*
// the frame. The card fills it, preserving each image's true aspect.

import * as THREE from 'three';

export function mountHeroCanvas(canvas, opts = {}) {
  const camZ      = opts.camZ      ?? 7;
  const fill      = opts.fill      ?? 0.9;    // fraction of the cell the card fills
  const tiltX     = opts.tiltX     ?? 0.20;   // extra pitch (rad) from the cursor
  const tiltY     = opts.tiltY     ?? 0.26;   // extra yaw   (rad) from the cursor
  const anchorTop = opts.anchorTop ?? false;  // sit the card's top at the frame top
  const reduced   = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // A constant 3/4 lean so the slab always reads as 3D, even at rest.
  const BASE_Y = 0.16;
  const BASE_X = -0.07;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, camZ);
  scene.add(new THREE.AmbientLight(0xffffff, 0.58));
  const key = new THREE.DirectionalLight(0xffffff, 0.95); key.position.set(-6, 7, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.45); rim.position.set(7, -3, 5); scene.add(rim);

  // Dimensional card: image on the front/back faces, a neutral lit edge on the
  // four sides. BoxGeometry material order: [px, nx, py, ny, pz(front), nz(back)].
  const faceMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5,  metalness: 0.0 });
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0xE6E3DC, roughness: 0.72, metalness: 0.0 });
  const DEPTH = 0.3;
  const card = new THREE.Mesh(new THREE.BoxGeometry(1, 1, DEPTH),
    [edgeMat, edgeMat, edgeMat, edgeMat, faceMat, faceMat]);
  scene.add(card);

  const loader = new THREE.TextureLoader();
  const texCache = new Map();                 // src → THREE.Texture (load once, reuse → no flicker)
  const onAspect = opts.onAspect || null;
  const onShown  = opts.onShown  || null;
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
    return { w: ch * a, h: ch, vH };
  }
  function applyScale(a) {
    const { w, h, vH } = fit(a);
    card.scale.set(w, h, 1);
    card.position.y = anchorTop ? (vH - h) / 2 : 0;   // top edge at frame top, or centred
  }

  function getTex(src) {
    const cached = texCache.get(src);
    if (cached) return Promise.resolve(cached);
    return new Promise((resolve) => {
      loader.load(src, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = maxAniso;
        texCache.set(src, tex);
        resolve(tex);
      });
    });
  }
  function preload(srcs) { (srcs || []).forEach((s) => s && getTex(s)); }

  function show(hero) {
    if (!hero) return;
    getTex(hero.src).then((tex) => {
      // Real decoded dimensions — never a manifest value that may disagree.
      const iw = tex.image && tex.image.width, ih = tex.image && tex.image.height;
      aspect = (iw && ih) ? iw / ih : (hero.aspect || 1);
      if (onAspect) onAspect(aspect);
      applyScale(aspect);
      faceMat.map = tex; faceMat.needsUpdate = true;   // cached textures aren't disposed here
      if (onShown) onShown();
    });
  }

  // cursor parallax — relative to the canvas, clamped
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
  const ro = new ResizeObserver(() => { sizeRenderer(); applyScale(aspect); });
  ro.observe(canvas);

  let t = 0, raf = null, visible = true, last = performance.now();
  function tick(now) {
    raf = visible ? requestAnimationFrame(tick) : null;
    const dt = Math.min((now - last) / 1000, 1 / 30); last = now; t += dt;
    const ay = (active && !reduced ? tgt.x * tiltY : 0) + (reduced ? 0 : Math.sin(t * 0.4) * 0.10);
    const ax = (active && !reduced ? tgt.y * tiltX : 0) + (reduced ? 0 : Math.sin(t * 0.33) * 0.04);
    card.rotation.y += ((BASE_Y + ay) - card.rotation.y) * 0.08;
    card.rotation.x += ((BASE_X + ax) - card.rotation.x) * 0.08;
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(tick);

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && raf === null) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }, { threshold: 0 });
  io.observe(canvas);

  return {
    show, preload,
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      card.geometry.dispose();
      texCache.forEach((tx) => tx.dispose());
      faceMat.dispose(); edgeMat.dispose(); renderer.dispose();
    },
  };
}
