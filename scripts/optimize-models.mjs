// Optimise the textured project GLBs for the web. For each model it:
//   • resizes PBR textures to ≤2048px and re-encodes them as WebP
//     (decoded natively by three via EXT_texture_webp — no extra loader),
//   • meshopt-compresses geometry (EXT_meshopt_compression — decoded by drei's
//     bundled MeshoptDecoder, so NO runtime CDN dependency),
//   • preserves geometry exactly (no --simplify decimation), so product shapes
//     stay faithful.
//
// Source : assets/models/<slug>.glb  — raw Meshy textured exports (git-ignored,
//          ~30–40 MB each, kept locally as the re-optimisation source).
// Output : public/models/<slug>.glb  — optimised + served + committed.
//
// Re-run after dropping a new textured export into assets/models:
//   node scripts/optimize-models.mjs

import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'assets/models';
const OUT = 'public/models';
const BIN = join('node_modules', '.bin', 'gltf-transform');

const mb = (p) => (statSync(p).size / 1048576).toFixed(1);

if (!existsSync(SRC)) {
  console.error(`Missing ${SRC}/ — put the textured source GLBs there first.`);
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const files = readdirSync(SRC).filter((f) => f.endsWith('.glb'));
if (!files.length) { console.error(`No .glb files in ${SRC}/.`); process.exit(1); }

let before = 0, after = 0;
for (const f of files) {
  const inP = join(SRC, f), outP = join(OUT, f);
  process.stdout.write(`• ${f.padEnd(18)} ${mb(inP).padStart(6)} MB → `);
  execFileSync(BIN, [
    'optimize', inP, outP,
    '--compress', 'meshopt',
    '--texture-compress', 'webp',
    '--texture-size', '2048',
    '--simplify', 'false',
  ], { stdio: ['ignore', 'ignore', 'inherit'] });
  before += statSync(inP).size;
  after += statSync(outP).size;
  console.log(`${mb(outP).padStart(5)} MB`);
}
console.log(`\nTotal  ${(before / 1048576).toFixed(1)} MB → ${(after / 1048576).toFixed(1)} MB`);
