/**
 * Verifies the built page actually renders every original string.
 * Usage: node scripts/verify-rendered.mjs http://localhost:3000
 */
import { RUNTIME_COPY, STATIC_COPY, normalise } from '../tests/copy.mjs';

const url = process.argv[2] || 'http://localhost:3000';

const response = await fetch(url);
if (!response.ok) {
  console.error(`✗ ${url} responded ${response.status}`);
  process.exit(1);
}
const html = normalise((await response.text()).replace(/<!--.*?-->/g, ''));
const expected = [...STATIC_COPY, ...RUNTIME_COPY];

const missing = expected.filter((phrase) => !html.includes(normalise(phrase)));

if (missing.length) {
  console.error(`✗ ${missing.length} original string(s) missing from the rendered page:`);
  for (const phrase of missing) console.error(`  - ${phrase}`);
  process.exit(1);
}

const checks = [
  ['Hero 3D stage', 'hero-stage-3d'],
  ['Ambient backdrop', 'page-backdrop'],
  ['Guardian stage', 'guardian-stage'],
  ['Download gating', 'APK COMING SOON'],
  ['Lab disclaimer', 'SIMULATION / NOT A LIVE ANALYSIS'],
  ['Guardian section present', 'guardian-mode-0'],
  ['Hero fallback art for no-WebGL', 'hero-fallback'],
  ['Ambient CSS backdrop', 'backdrop-fallback'],
  ['Guardian viewer wrapper', 'guardian-visual--3d'],
];

for (const [label, needle] of checks) {
  if (!html.includes(needle)) {
    console.error(`✗ ${label} missing`);
    process.exit(1);
  }
}

console.log(`✓ ${expected.length} original strings verified against the rendered page at ${url}`);
