import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import test from 'node:test';
import { REQUIRED_COPY, normalise } from './copy.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const sourceFiles = walk(join(ROOT, 'app')).filter((file) =>
  ['.tsx', '.ts'].includes(extname(file)),
);
const source = normalise(sourceFiles.map((file) => readFileSync(file, 'utf8')).join('\n'));

test('every original string still exists in the source', () => {
  const missing = REQUIRED_COPY.filter((phrase) => !source.includes(normalise(phrase)));
  assert.deepEqual(missing, [], `Missing original copy:\n- ${missing.join('\n- ')}`);
});

test('the original Guardian GLB is still shipped and referenced', () => {
  const glb = join(ROOT, 'public', 'oryqen-guardian-v8.glb');
  assert.ok(existsSync(glb), 'public/oryqen-guardian-v8.glb is missing');
  assert.ok(statSync(glb).size > 100_000, 'Guardian GLB looks truncated');
  const loader = readFileSync(join(ROOT, 'app/robot/GuardianGLB.tsx'), 'utf8');
  assert.match(loader, /oryqen-guardian-v8\.glb/, 'GuardianGLB must load the original model');
  assert.match(loader, /useGLTF/, 'Guardian model must be loaded with drei useGLTF');
  assert.ok(existsSync(join(ROOT, 'public', 'oryqen-guardian.webp')), 'static fallback image missing');
});

test('CLARITY / TRUST / CONTROL presets and behaviours are intact', () => {
  const types = readFileSync(join(ROOT, 'app/robot/robot-types.ts'), 'utf8');
  for (const id of ['clarity', 'trust', 'control']) {
    assert.match(types, new RegExp(`id: '${id}'`), `missing ${id} preset`);
  }
  const core = readFileSync(join(ROOT, 'app/cinematic-core.tsx'), 'utf8');
  for (const name of ['CLARITY', 'TRUST', 'CONTROL']) {
    assert.match(core, new RegExp(name));
  }
  for (const behaviour of ['setPaused', 'setResetToken', 'setMode']) {
    assert.match(core, new RegExp(behaviour), `missing ${behaviour} control`);
  }
  assert.match(core, /RobotStage/, 'the real 3D stage must still be mounted');
});

test('downloads stay gated behind valid https environment URLs', () => {
  const page = readFileSync(join(ROOT, 'app/page.tsx'), 'utf8');
  assert.match(page, /NEXT_PUBLIC_APK_URL/);
  assert.match(page, /NEXT_PUBLIC_PLAY_STORE_URL/);
  assert.match(page, /NEXT_PUBLIC_CONTACT_EMAIL/);
  assert.match(page, /protocol === 'https:'/, 'URL validation must remain');
  assert.match(page, /APK COMING SOON/);
  assert.match(page, /PLAY STORE SOON/);
});

test('no invented release links are hard-coded', () => {
  const page = readFileSync(join(ROOT, 'app/page.tsx'), 'utf8');
  assert.doesNotMatch(page, /href=["'{]?https?:\/\/(?!fonts)/, 'unexpected external link in page');
});

test('no-JS and reduced-motion visitors still get the content', () => {
  const page = readFileSync(join(ROOT, 'app/page.tsx'), 'utf8');
  // Content is never gated behind a mounted/ready flag.
  assert.doesNotMatch(page, /if \(!mounted\)/, 'content must not be client-gated');
  assert.doesNotMatch(page, /typeof window === 'undefined' \? null/, 'content must not be client-gated');
  const hook = readFileSync(join(ROOT, 'app/components/useMotionPreference.ts'), 'utf8');
  assert.match(hook, /useState\(false\)/, 'reduced motion must start at the SSR-safe value');
  assert.match(hook, /useEffect/, 'reduced motion must sync after hydration');
  const reveal = readFileSync(join(ROOT, 'app/components/Reveal.tsx'), 'utf8');
  assert.match(reveal, /initial=\{reduced \? false/, 'reduced motion must skip the reveal animation');
});

test('WebGL fallbacks and reduced-motion handling are wired', () => {
  const gate = readFileSync(join(ROOT, 'app/scene/StageGate.tsx'), 'utf8');
  assert.match(gate, /probeWebGL2/);
  assert.match(gate, /useMotionPreference/);
  assert.match(gate, /webglcontextlost/);
  const stage = readFileSync(join(ROOT, 'app/robot/RobotStage.tsx'), 'utf8');
  assert.match(stage, /RobotFallback/);
  assert.match(stage, /oryqen-guardian\.webp/);
});
