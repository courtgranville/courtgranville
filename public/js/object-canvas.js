// object-canvas.js — a cursor-reactive 3D object built from a transparent
// cutout PNG. The clean photo is the front face; behind it the silhouette is
// stacked into a few alpha-cut slices and darkened, giving the object a SUBTLE
// real-depth body rather than a thick slab. At rest it faces front; on hover it
// tips gently toward the pointer, the soft dark rim revealing the depth.
//
// Each cutout is auto-cropped to its alpha bounding box at load, so objects with
// large transparent margins still fill the frame and read at a consistent size.
//
// Vanilla three.js, resolved through the CDN import map in Layout.astro.
//
//   mountObjectCanvas(canvas, opts) -> { show(item), preload(srcs), destroy() }
//   item = { src }

import * as THREE from 'three';

export function mountObjectCanvas(canvas, opts = {}) {
  const LAYERS    = opts.layers   ?? 22;     // depth slices behind the front face
  const DEPTH     = opts.depth    ?? 0.06;   // total thickness (object height = 1) — subtle
  const BACK_DARK = opts.backDark ?? 0.55;   // brightness of the rearmost slice
  const REST_TILT = opts.restTilt ?? 0.06;   // tiny resting lean → a hint of depth
  const TILT      = opts.tilt     ?? 0.32;   // cursor parallax intensity (radians)
  const FILL      = opts.fill     ?? 0.9;    // fraction of the frustum to fill
  const CAM_Z     = opts.camZ     ?? 4.2;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.setClearColor(0x000000, 0);              // transparent → page ground shows
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, CAM_Z);

  const group = new THREE.Group();
  scene.add(group);

  // Front face at +DEPTH/2 (the clean photo, full brightness), slices receding
  // to -DEPTH/2 and darkening — the body sits BEHIND the photo. Pivot centred.
  const geo = new THREE.PlaneGeometry(1, 1);
  const meshes = [];
  for (let i = 0; i < LAYERS; i++) {
    const t = LAYERS === 1 ? 0 : i / (LAYERS - 1);   // 0 = front, 1 = back
    const shade = 1 - t * (1 - BACK_DARK);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(shade, shade, shade),
      alphaTest: 0.4,             // hard cutout edge → depth-correct stacking
      transparent: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.z = (0.5 - t) * DEPTH;
    m.renderOrder = LAYERS - i;   // draw front-most first
    group.add(m);
    meshes.push(m);
  }

  const loader = new THREE.TextureLoader();
  const cache  = new Map();   // src -> { tex, aspect }

  // Find the cutout's content bounds from its alpha channel and bake them into
  // the texture's offset/repeat, so the plane samples only the object (no
  // transparent margin). Returns the cropped aspect ratio.
  function cropToContent(tex) {
    const img = tex.image;
    const iw = img.width, ih = img.height;
    const scale = Math.min(1, 512 / Math.max(iw, ih));
    const w = Math.max(1, Math.round(iw * scale));
    const h = Math.max(1, Math.round(ih * scale));
    const cnv = document.createElement('canvas');
    cnv.width = w; cnv.height = h;
    const ctx = cnv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    let minx = w, miny = h, maxx = -1, maxy = -1;
    const A = 18;
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        if (data[(row + x) * 4 + 3] > A) {
          if (x < minx) minx = x; if (x > maxx) maxx = x;
          if (y < miny) miny = y; if (y > maxy) maxy = y;
        }
      }
    }
    if (maxx < 0) return iw / ih;                       // fully transparent → leave as-is
    const pad = Math.round(Math.min(w, h) * 0.015);
    minx = Math.max(0, minx - pad); miny = Math.max(0, miny - pad);
    maxx = Math.min(w - 1, maxx + pad); maxy = Math.min(h - 1, maxy + pad);
    const bw = (maxx - minx + 1) / w;
    const bh = (maxy - miny + 1) / h;
    const u0 = minx / w;
    const v0 = 1 - (maxy + 1) / h;                      // flipY: image-top → v=1
    tex.offset.set(u0, v0);
    tex.repeat.set(bw, bh);
    return (bw * iw) / (bh * ih);
  }

  function loadTex(src) {
    if (cache.has(src)) return Promise.resolve(cache.get(src));
    return new Promise((resolve) => {
      loader.load(src, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        const aspect = cropToContent(tex);
        const entry = { tex, aspect };
        cache.set(src, entry);
        resolve(entry);
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
    const { tex, aspect: a } = await loadTex(item.src);
    aspect = a;
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
    for (const { tex } of cache.values()) tex.dispose();
    renderer.dispose();
  }

  return { show, preload, destroy };
}
