// object-canvas.js — a cursor-reactive 3D object built from a transparent
// cutout PNG. The cutout is stacked into N alpha-cut layers along z, darkened
// toward the back, so the silhouette reads as a solid EXTRUDED object with real
// thickness. The object holds a small resting lean (so the depth is always
// visible) and swings toward the cursor when the pointer is over the canvas.
//
// Vanilla three.js, resolved through the CDN import map in Layout.astro. Shared
// by the homepage Selected-Work carousel.
//
//   mountObjectCanvas(canvas, opts) -> { show(item), preload(srcs), destroy() }
//   item = { src, aspect? }   (aspect is read from the decoded image if omitted)

import * as THREE from 'three';

export function mountObjectCanvas(canvas, opts = {}) {
  const LAYERS    = opts.layers   ?? 26;     // extrusion slices
  const DEPTH     = opts.depth    ?? 0.13;   // total thickness (object height = 1)
  const BACK_DARK = opts.backDark ?? 0.40;   // brightness of the rearmost slice
  const REST_TILT = opts.restTilt ?? 0.18;   // resting y-lean → depth always shows
  const TILT      = opts.tilt     ?? 0.5;    // cursor parallax intensity (radians)
  const FILL      = opts.fill     ?? 0.86;   // fraction of the frustum to fill
  const CAM_Z     = opts.camZ     ?? 4.2;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.setClearColor(0x000000, 0);              // transparent → page ground shows
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, CAM_Z);

  const group = new THREE.Group();
  scene.add(group);

  // One shared plane; one mesh per slice, stepped back in z and darkened.
  const geo = new THREE.PlaneGeometry(1, 1);
  const meshes = [];
  for (let i = 0; i < LAYERS; i++) {
    const t = LAYERS === 1 ? 0 : i / (LAYERS - 1);   // 0 = front, 1 = back
    const shade = 1 - t * (1 - BACK_DARK);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(shade, shade, shade),
      alphaTest: 0.45,            // hard cutout edge → depth-correct extrusion
      transparent: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.z = (0.5 - t) * DEPTH;
    group.add(m);
    meshes.push(m);
  }

  const loader = new THREE.TextureLoader();
  const cache  = new Map();
  function loadTex(src) {
    if (cache.has(src)) return Promise.resolve(cache.get(src));
    return new Promise((resolve) => {
      loader.load(src, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        cache.set(src, tex);
        resolve(tex);
      });
    });
  }

  let aspect = 1;
  function fit() {
    const cw = canvas.clientWidth || 1;
    const ch = canvas.clientHeight || 1;
    const visH = 2 * Math.tan((camera.fov * Math.PI) / 360) * CAM_Z;
    const visW = visH * (cw / ch);
    const s = Math.min((visW * FILL) / aspect, visH * FILL);   // object is aspect × 1
    group.scale.set(s, s, s);
    for (const m of meshes) m.scale.set(aspect, 1, 1);
  }

  async function show(item) {
    if (!item || !item.src) return;
    const tex = await loadTex(item.src);
    aspect = item.aspect ?? (tex.image.width / tex.image.height);
    for (const m of meshes) { m.material.map = tex; m.material.needsUpdate = true; }
    fit();
    if (opts.onShown) opts.onShown();
  }

  function preload(srcs) { for (const s of srcs) if (s) loadTex(s); }

  function resize() {
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    if (!cw || !ch) return;
    renderer.setSize(cw, ch, false);
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    fit();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // Cursor parallax — gated to the canvas bounds so it only reacts on hover.
  let active = false;
  const tgt = { x: 0, y: 0 };
  function onMove(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) { active = false; return; }
    active = true;
    tgt.x = x * 2 - 1;
    tgt.y = y * 2 - 1;
  }
  function onLeave() { active = false; }
  window.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);

  let visible = true;
  let raf = null;
  function tick() {
    raf = null;
    const ry = REST_TILT + (active && !reduced ? tgt.x *  TILT : 0);
    const rx =             (active && !reduced ? tgt.y * -TILT : 0);
    group.rotation.y += (ry - group.rotation.y) * 0.09;
    group.rotation.x += (rx - group.rotation.x) * 0.09;
    renderer.render(scene, camera);
    if (visible) raf = requestAnimationFrame(tick);
  }
  resize();
  tick();

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) { active = false; }
    else if (raf === null) tick();
  }, { threshold: 0 });
  io.observe(canvas);

  function destroy() {
    if (raf) cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    window.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerleave', onLeave);
    geo.dispose();
    for (const m of meshes) m.material.dispose();
    for (const tex of cache.values()) tex.dispose();
    renderer.dispose();
  }

  return { show, preload, destroy };
}
