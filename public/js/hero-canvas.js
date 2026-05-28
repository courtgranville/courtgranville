// hero-canvas.js — a reusable "3D image canvas": the project hero image on a
// lit, cursor-parallax slab. The image fills the front/back faces; the four
// sides take the image's EDGE pixels stretched down the depth — a true
// gallery-wrap, so the photo appears to wrap the object's edges rather than
// being repeated/squished onto the sides.
//
// Loaded by <script is:inline type="module"> so the page's CDN import map
// (Layout.astro) resolves `three` without Vite bundling.
//
// mountHeroCanvas(canvasEl, opts) → { show(hero), preload(srcs), destroy() }
//   hero = { src, aspect }  (from src/content/projects-images.json)

import * as THREE from 'three';

// Box with edge-clamped side UVs: front/back = full image (0..1); each side
// samples the adjacent image edge (u or v pinned to 0/1) → the photo wraps.
// Vertex/face order is [px, nx, py, ny, pz, nz], 4 vertices each.
function buildCardGeometry(depth) {
  const geo = new THREE.BoxGeometry(1, 1, depth);
  const uv = geo.attributes.uv;
  for (let i = 0;  i < 4;  i++) uv.setX(i, 1);  // +x (right) → right edge column
  for (let i = 4;  i < 8;  i++) uv.setX(i, 0);  // -x (left)  → left edge column
  for (let i = 8;  i < 12; i++) uv.setY(i, 1);  // +y (top)   → top edge row
  for (let i = 12; i < 16; i++) uv.setY(i, 0);  // -y (bottom)→ bottom edge row
  uv.needsUpdate = true;
  return geo;
}

export function mountHeroCanvas(canvas, opts = {}) {
  const camZ      = opts.camZ      ?? 7;
  const fill      = opts.fill      ?? 0.82;
  const baseY     = opts.baseY     ?? 0.16;   // constant yaw — always reads 3D, even at rest
  const baseX     = opts.baseX     ?? -0.06;  // constant pitch — shows the top edge
  const swayY     = opts.swayY     ?? 0.12;
  const swayX     = opts.swayX     ?? 0.05;
  const paraY     = opts.paraY     ?? 0.4;
  const paraX     = opts.paraX     ?? 0.3;
  const anchorTop = opts.anchorTop ?? false;
  const reduced   = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, camZ);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 0.95); key.position.set(-6, 7, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.45); rim.position.set(7, -3, 5); scene.add(rim);

  const mat  = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.04 });
  const card = new THREE.Mesh(buildCardGeometry(0.42), mat);   // unit slab, scaled to fit
  scene.add(card);

  const loader = new THREE.TextureLoader();
  const texCache = new Map();
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
    card.position.y = anchorTop ? (vH - h) / 2 : 0;
  }

  function getTex(src) {
    const cached = texCache.get(src);
    if (cached) return Promise.resolve(cached);
    return new Promise((resolve) => {
      loader.load(src, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = maxAniso;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;   // edge pixels for the wrap
        texCache.set(src, tex);
        resolve(tex);
      });
    });
  }
  function preload(srcs) { (srcs || []).forEach((s) => s && getTex(s)); }

  function show(hero) {
    if (!hero) return;
    getTex(hero.src).then((tex) => {
      const iw = tex.image && tex.image.width, ih = tex.image && tex.image.height;
      aspect = (iw && ih) ? iw / ih : (hero.aspect || 1);
      if (onAspect) onAspect(aspect);
      applyScale(aspect);
      mat.map = tex; mat.needsUpdate = true;
      if (onShown) onShown();
    });
  }

  const tgt = { x: 0, y: 0 }; let active = false;
  const clamp = (v) => Math.max(-1, Math.min(1, v));
  function onMove(e) {
    const r = canvas.getBoundingClientRect();
    // Only react when the pointer is over the canvas itself — moving over the
    // project list (or anywhere else) must not tilt it (that was the jitter).
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
      active = false; return;
    }
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
    const ry = baseY + (active && !reduced ? tgt.x * paraY : 0) + (reduced ? 0 : Math.sin(t * 0.4) * swayY);
    const rx = baseX + (active && !reduced ? tgt.y * paraX : 0) + (reduced ? 0 : Math.sin(t * 0.33) * swayX);
    card.rotation.y += (ry - card.rotation.y) * 0.08;
    card.rotation.x += (rx - card.rotation.x) * 0.08;
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
      mat.dispose(); renderer.dispose();
    },
  };
}
