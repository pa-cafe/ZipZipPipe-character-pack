#!/usr/bin/env node
// Runs the codex CLI's built-in image generation for one character, one raw image per step.
// Usage: node tools/gen.mjs <id> [step...] [--force] [--jobs N]
// Steps: model, walk-S, walk-W, walk-N, walk-E, seat-S, seat-W, seat-N, seat-E
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const roster = JSON.parse(readFileSync(join(root, 'tools/roster.json'), 'utf8'));
const args = process.argv.slice(2), force = args.includes('--force');
const jobsAt = args.indexOf('--jobs'), jobs = jobsAt >= 0 ? Number(args[jobsAt + 1]) : 4;
const positional = args.filter((a, i) => !a.startsWith('--') && (jobsAt < 0 || i !== jobsAt + 1));
const [id, ...wanted] = positional;
const character = roster.characters.find(c => c.id === id);
if (!character) { console.error(`Unknown character ${id}. Known: ${roster.characters.map(c => c.id).join(', ')}`); process.exit(2); }

const common = 'Use your built-in image generation tool (not code, not SVG, not a script that draws shapes) to draw ONE image. Background: fully transparent (real alpha channel). No floor, no ground shadow, no chair, no furniture, no text, no labels, no grid lines, no borders, no sparkles or floating effects. If the character has an ahoge (a single antenna-like strand of hair on top of the head), keep it small and thin, lying close to the head; never enlarge it. Do not create any other files. After saving, print the file path and pixel size.';
const walkViews = {
  S: 'seen straight from the front, facing the viewer',
  W: 'in strict left side profile, the whole body facing and walking toward the LEFT edge of the image',
  N: 'seen straight from behind, back to the viewer, face not visible',
  E: 'in strict right side profile, the whole body facing and walking toward the RIGHT edge of the image',
};
const seatViews = {
  S: 'a front three-quarter view: the face is visible and the whole body is turned 45 degrees toward the viewer\'s RIGHT (knees and toes point to the lower-right of the image)',
  W: 'a front three-quarter view: the face is visible and the whole body is turned 45 degrees toward the viewer\'s LEFT (knees and toes point to the lower-left of the image)',
  N: 'a back three-quarter view: the back is toward the viewer, the eyes are NOT visible, and the whole body is turned 45 degrees so it faces the upper-LEFT of the image',
  E: 'a back three-quarter view: the back is toward the viewer, the eyes are NOT visible, and the whole body is turned 45 degrees so it faces the upper-RIGHT of the image',
};
const steps = {
  model: () => ({
    images: [join(root, character.reference), join(root, 'work/style-reference.png')],
    prompt: `${common} Save it as work/${id}/model.png. Subject: the character in the first attached image, redrawn as a cute chibi game sprite in the same proportions and rendering style as the second attached image (about 2.3 heads tall, big head, soft cel shading, clean dark outline). Keep every identifying design element of the first image: hair colour, length and style, eye colour, ears, horns, wings or tail if any, headwear, the full outfit with its colours and emblems, legwear and shoes.${character.notes ? ` Notes: ${character.notes}` : ''} Do not copy the second image's character; it only shows the target style. Pose: standing still facing the viewer, arms relaxed at the sides, hands empty (leave out hand-held props), both feet visible. Full body, centred, fully inside the frame with a clear margin on every side. Portrait canvas about 1024x1536.`,
  }),
  ...Object.fromEntries(Object.entries(walkViews).map(([facing, view]) => [`walk-${facing}`, () => ({
    images: [join(root, `work/${id}/model.png`)],
    prompt: `${common} Save it as work/${id}/walk-${facing}.png. Draw a sprite sheet of EXACTLY 8 full-body frames of the exact chibi character in the attached image (same design, same outfit, same proportions, same rendering style, hands empty), laid out as a grid of 4 columns by 2 rows on a landscape canvas about 1536x1024, read left to right, top row first. In every frame the character is ${view}. Frame 1: standing still, feet together. Frames 2 to 8: one looping walk cycle in place, small natural steps with the legs alternating and the arms swinging gently (2 right foot steps forward, 3 weight on the right foot, 4 legs passing, 5 left foot steps forward, 6 weight on the left foot, 7 legs passing, 8 right foot about to step). Keep the chibi proportions of the attached image exactly: very big head, small body, very short legs; do not lengthen the legs or torso. All 8 figures are the same size and stand on the same height within their row. Every figure sits entirely inside its own grid cell with a wide fully transparent gap around it: hair, tail, wings and skirt must never touch or overlap a neighbouring figure.`,
  })])),
  ...Object.fromEntries(Object.entries(seatViews).map(([facing, view]) => [`seat-${facing}`, () => ({
    images: [join(root, `work/${id}/model.png`)],
    prompt: `${common} Save it as work/${id}/seat-${facing}.png. Draw EXACTLY 3 full-body figures of the exact chibi character in the attached image (same design, same outfit, same proportions, same rendering style, hands empty), side by side in one row on a landscape canvas about 1536x1024, read left to right. All three are drawn in ${view}. They show the character sitting down onto an invisible chair, and the chair itself is NOT drawn: figure 1 starts to lower itself, knees slightly bent; figure 2 is half seated, knees bent further, hips lower; figure 3 is fully seated and holding the pose, thighs horizontal on the invisible seat, lower legs hanging straight down with both feet complete and level, hands resting on the lap. Chibi proportions are critical and must match the attached image exactly: a very big head (with its hair, about 60% as wide as the character is tall when standing), a small body and very short stubby legs. Do NOT lengthen the legs or the torso. Because the legs are so short, the fully seated figure 3 is compact: its total height is only about 1.5 times the height of its head, and the feet hang just a little below the skirt or hips. All three figures are drawn at the same scale (same head size) with their feet on the same line. Every figure has a wide fully transparent gap around it: hair, tail, wings and skirt must never touch or overlap a neighbouring figure.`,
  })])),
};

function run(step) {
  const out = join(root, `work/${id}/${step}.png`);
  if (existsSync(out)) { if (!force) { console.log(`skip ${id}/${step} (exists)`); return Promise.resolve(true); } rmSync(out); }
  mkdirSync(dirname(out), { recursive: true });
  const { images, prompt } = steps[step]();
  writeFileSync(join(root, `work/${id}/${step}.prompt.txt`), prompt);
  return new Promise(done => {
    const started = Date.now();
    const child = spawn('codex', ['exec', '-s', 'workspace-write', '--skip-git-repo-check', '-C', root, ...images.flatMap(i => ['-i', i]), '-'], { stdio: ['pipe', 'pipe', 'pipe'] });
    let log = ''; child.stdout.on('data', d => log += d); child.stderr.on('data', d => log += d);
    child.stdin.end(prompt);
    const timer = setTimeout(() => child.kill('SIGKILL'), 15 * 60 * 1000);
    child.on('close', code => {
      clearTimeout(timer); writeFileSync(join(root, `work/${id}/${step}.log`), log);
      const ok = existsSync(out);
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${id}/${step} (${Math.round((Date.now() - started) / 1000)}s, exit ${code})`);
      done(ok);
    });
  });
}

const list = wanted.length ? wanted : Object.keys(steps);
for (const step of list) if (!steps[step]) { console.error(`Unknown step ${step}`); process.exit(2); }
let failed = 0;
if (list.includes('model')) { if (!await run('model')) process.exit(1); }
const queue = list.filter(s => s !== 'model');
await Promise.all(Array.from({ length: jobs }, async () => { for (let s; (s = queue.shift());) if (!await run(s)) failed++; }));
process.exit(failed ? 1 : 0);
