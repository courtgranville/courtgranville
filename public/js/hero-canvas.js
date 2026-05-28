// hero-canvas.js — the shared "3D image canvas" for photo cards (Work index,
// homepage Selected-Work, project headers). The image is shown TRUE: a flat
// plane with MeshBasicMaterial (no lights, no luminance shift on move), no
// bevel, no idle motion. 3D is expressed only as a restrained cursor-parallax
// tilt at the shared --tilt intensity, and only while the pointer is over the
// field. At rest the card faces the viewer. (§3 of the v3 spec.)
//
// The card is `contain`-fit inside the canvas, which fills a fixed-aspect
// `.field` cell — so portraits letterbox against the field ground, landscapes
// nearly fill it; the field itself never reshapes.
//
// mountHeroCanvas(canvasEl, opts) → { show(hero), preload(srcs), destroy() }

import * as THREE from 'three';

export function mountHeroCanvas(canvas, opts = {}) {
  const camZ    = opts.camZ  ?? 6;
  const inset   = opts.inset ?? 0.94;     // image sits just inside the field frame
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TILT    = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tilt')) || 0.16;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, camZ);

  // Flat true-colour card: no lights, no tone mapping, no depth/bevel.
  const mat  = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const card = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  scene.add(card);

  const loader   = new THREE.TextureLoader();
  const texCache = new Map();              // src → texture; load once, reuse → no flicker
  const onAspect = opts.onAspect || null;
  const onShown  = opts.onShown  || null;
  let aspect = 1;

  function sizeRenderer() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  // contain the image (aspect a) inside the field's visible frustum
  function fit(a) {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    const vH = 2 * camZ * Math.tan(camera.fov * Math.PI / 360);
    const vW = vH * (w / h);
    const fieldA = w / h;
    let pw, ph;
    if (a >= fieldA) { pw = inset * vW; ph = pw / a; }
    else             { ph = inset * vH; pw = ph * a; }
    return { pw, ph };
  }
  function applyScale(a) { const { pw, ph } = fit(a); card.scale.set(pw, ph, 1); }

  function getTex(src) {
    const cached = texCache.get(src);
    if (cached) return Promise.resolve(cached);
    return new Promise((resolve) => {
      loader.load(src, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = maxAniso;
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

  // parallax tilt — only while the pointer is over the field
  const tgt = { x: 0, y: 0 }; let active = false;
  const clamp = (v) => Math.max(-1, Math.min(1, v));
  function onMove(e) {
    const r = canvas.getBoundingClientRect();
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

  let raf = null, visible = true;
  function tick() {
    raf = visible ? requestAnimationFrame(tick) : null;
    const ry = (active && !reduced) ?  tgt.x * TILT : 0;   // at rest → 0 (flat)
    const rx = (active && !reduced) ? -tgt.y * TILT : 0;
    card.rotation.y += (ry - card.rotation.y) * 0.08;
    card.rotation.x += (rx - card.rotation.x) * 0.08;
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(tick);

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && raf === null) raf = requestAnimationFrame(tick);
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
