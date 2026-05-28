#!/usr/bin/env node
// Image pipeline for the seven project pages (spec §10).
//
// For each project the MANIFEST below names the source files we use, the
// clean ordered slug they are written to, and the block role. The script
// emits two WebP widths per image (1200, 2400) into
// public/assets/projects/<slug>/, and writes a manifest JSON the content
// collection consumes.
//
// HEIC inputs are handled natively by sharp / libheif. WebP quality is tuned
// against the per-image size targets in §10.7 (hero ≤ 250 KB, inline ≤ 150 KB).

import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const SRC  = path.join(ROOT, 'assets/projects');
const OUT  = path.join(ROOT, 'public/assets/projects');

const WIDTHS = [1200, 2400];
const QUALITY_HERO = 76;
const QUALITY_INLINE = 72;

// Ordered per-project source → output mapping. Slugs are numeric-prefixed so
// the content collection can reference them deterministically.
const MANIFEST = {
  'spider-209': {
    sourceDir: 'lamp (SPIDER-209)',
    images: [
      { src: 'sketches/sketch-1.jpg',                 slug: '01-sketch-1',  role: 'sketches', priority: 'inline' },
      { src: 'sketches/sketch-2.jpg',                 slug: '02-sketch-2',  role: 'sketches', priority: 'inline' },
      { src: 'photographs/prototype/prototype_1.jpg', slug: '03-prototype', role: 'prototype', priority: 'hero'  },
      { src: 'photographs/studio/hero.jpg',           slug: '04-final',     role: 'studio',   priority: 'hero'   },
      { src: 'photographs/studio/studio_2.jpg',       slug: '05-studio-2',  role: 'studio',   priority: 'inline' },
    ],
  },
  'universal-phone-case': {
    sourceDir: 'muji',
    images: [
      { src: 'images/20221212162408_IMG_1124 (1).JPG', slug: '01-process-1', role: 'process', priority: 'inline' },
      { src: 'images/20221212164415_IMG_1140 (1).JPG', slug: '02-process-2', role: 'process', priority: 'inline' },
      { src: 'images/20221212170310_IMG_1166 (1).JPG', slug: '03-process-3', role: 'process', priority: 'inline' },
      { src: 'images/Wabi Sabi (A) Phone Case 1.jpg',  slug: '04-final-1',   role: 'final',   priority: 'inline' },
      { src: 'images/Wabi Sabi (A) Phone Case 2.jpg',  slug: '05-final-2',   role: 'final',   priority: 'inline' },
      { src: 'images/Wabi Sabi (A) Phone Case 3.jpg',  slug: '06-final-3',   role: 'final',   priority: 'inline' },
      { src: 'images/Hero.JPG',                        slug: '07-final-hero', role: 'final',  priority: 'hero'   },
    ],
  },
  'lumi': {
    sourceDir: 'lamp (LUMI)',
    images: [
      { src: 'rhino/rhino-base.png',             slug: '01-cad-base',     role: 'cad',   priority: 'inline' },
      { src: 'rhino/rhino-component-1.png',      slug: '02-cad-component', role: 'cad',  priority: 'inline' },
      { src: 'rhino/rhino-threaded-insert.png',  slug: '03-cad-threaded', role: 'cad',   priority: 'inline' },
      { src: 'final/hero.JPG',                   slug: '04-final-hero',   role: 'final', priority: 'hero'   },
      { src: 'final/detail.JPG',                 slug: '05-final-detail', role: 'final', priority: 'inline' },
    ],
  },
  'yourpal': {
    sourceDir: 'yourpal',
    images: [
      { src: 'images/iteration_1.png',     slug: '01-process-1',  role: 'process', priority: 'inline' },
      { src: 'images/iteration_2.png',     slug: '02-process-2',  role: 'process', priority: 'inline' },
      { src: 'images/iteration_3.png',     slug: '03-process-3',  role: 'process', priority: 'inline' },
      { src: 'images/hero.png',            slug: '04-final-hero', role: 'final',   priority: 'hero'   },
      { src: 'images/mockup2.png',         slug: '05-final-1',    role: 'final',   priority: 'inline' },
      { src: 'images/figma-pages.png',     slug: '06-final-2',    role: 'final',   priority: 'inline' },
      { src: 'images/mockups-iphone.png',  slug: '07-final-3',    role: 'final',   priority: 'inline' },
    ],
  },
  'backgammon': {
    sourceDir: 'backgammon',
    images: [
      { src: 'rhino/rhino-model.png',           slug: '01-cad-1',      role: 'cad',       priority: 'inline' },
      { src: 'rhino/rhino-model2.png',          slug: '02-cad-2',      role: 'cad',       priority: 'inline' },
      { src: 'rhino/rhino-model3.png',          slug: '03-cad-3',      role: 'cad',       priority: 'inline' },
      { src: 'prototype/prototype_top.JPG',     slug: '04-prototype-1', role: 'prototype', priority: 'inline' },
      { src: 'prototype/prototype_detail.JPG',  slug: '05-prototype-2', role: 'prototype', priority: 'inline' },
      { src: 'prototype/prototype_detail2.JPG', slug: '06-prototype-3', role: 'prototype', priority: 'inline' },
      { src: 'studio/hero.JPG',                 slug: '07-final-hero', role: 'final',     priority: 'hero'   },
      { src: 'home/lighting-detail-1.jpeg',     slug: '08-final-detail', role: 'final',   priority: 'inline' },
    ],
  },
  'wave': {
    sourceDir: 'speaker',
    images: [
      { src: 'images/process-1.JPG',                  slug: '01-process-1',     role: 'process', priority: 'inline' },
      { src: 'images/process_2.JPG',                  slug: '02-process-2',     role: 'process', priority: 'inline' },
      { src: 'images/hero.JPG',                       slug: '03-final-hero',    role: 'final',   priority: 'hero'   },
      { src: 'images/side-details.JPG',               slug: '04-final-side',    role: 'final',   priority: 'inline' },
      { src: 'images/speaker + mantis lamp.JPG',      slug: '05-final-paired',  role: 'final',   priority: 'inline' },
    ],
  },
  'mantis': {
    sourceDir: 'lamp (MANTIS)',
    images: [
      { src: 'joint1.jpg',     slug: '01-joint',     role: 'final', priority: 'inline' },
      { src: 'lampshade.jpg',  slug: '02-lampshade', role: 'final', priority: 'inline' },
      { src: 'component2.jpg', slug: '03-base',      role: 'final', priority: 'inline' },
      { src: 'hero.jpg',       slug: '04-final-hero', role: 'final', priority: 'hero'  },
    ],
  },
};

// Process one source file: emit 1200 and 2400 widths as WebP, with optional
// height passthrough. Sharp's `rotate()` auto-applies EXIF orientation so
// portraits don't end up sideways.
async function processOne(srcAbs, outDir, slug, priority) {
  await fs.mkdir(outDir, { recursive: true });
  const base = sharp(srcAbs).rotate();
  const meta = await base.metadata();
  // metadata() reports PRE-rotation dimensions. EXIF orientation 5–8 rotates
  // the displayed image 90°, so swap to record the TRUE (post-rotation) aspect
  // — otherwise a portrait shot stored landscape-with-flag yields a landscape
  // aspect here while the emitted webp (which is rotated) is portrait.
  let trueW = meta.width, trueH = meta.height;
  if (meta.orientation && meta.orientation >= 5) { [trueW, trueH] = [trueH, trueW]; }
  const isHero = priority === 'hero';
  const q = isHero ? QUALITY_HERO : QUALITY_INLINE;
  const outputs = [];
  for (const targetW of WIDTHS) {
    // Don't upscale beyond the original; if the source is small, emit at
    // native width with the chosen quality.
    const width = Math.min(targetW, meta.width || targetW);
    const file = path.join(outDir, `${slug}-${targetW}.webp`);
    await sharp(srcAbs)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: q, effort: 6 })
      .toFile(file);
    const stat = await fs.stat(file);
    outputs.push({ width: targetW, bytes: stat.size, path: file });
  }
  return { width: trueW, height: trueH, outputs };
}

async function main() {
  await fs.rm(OUT, { recursive: true, force: true });
  await fs.mkdir(OUT, { recursive: true });

  const manifestOut = {};
  for (const [slug, project] of Object.entries(MANIFEST)) {
    const projectDir = path.join(OUT, slug);
    await fs.mkdir(projectDir, { recursive: true });
    manifestOut[slug] = { images: [] };
    for (const img of project.images) {
      const srcAbs = path.join(SRC, project.sourceDir, img.src);
      try {
        const result = await processOne(srcAbs, projectDir, img.slug, img.priority);
        // Compute aspect from the *source* metadata so the rendered HTML can
        // reserve space and avoid CLS.
        const aspect = result.width && result.height
          ? +(result.width / result.height).toFixed(3)
          : null;
        manifestOut[slug].images.push({
          slug:  img.slug,
          role:  img.role,
          src:   `/assets/projects/${slug}/${img.slug}-2400.webp`,
          srcset: WIDTHS.map(w => `/assets/projects/${slug}/${img.slug}-${w}.webp ${w}w`).join(', '),
          width:  result.width,
          height: result.height,
          aspect,
        });
        const total = result.outputs.reduce((a, b) => a + b.bytes, 0);
        const kb = Math.round(total / 1024);
        console.log(`  ${slug}/${img.slug}  → ${result.outputs.length} widths, ${kb} KB total`);
      } catch (err) {
        console.error(`  ${slug}/${img.slug}  FAILED: ${err.message}`);
        throw err;
      }
    }
  }
  await fs.writeFile(
    path.join(ROOT, 'src/content/projects-images.json'),
    JSON.stringify(manifestOut, null, 2),
  );
  console.log(`\nWrote manifest: src/content/projects-images.json`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
