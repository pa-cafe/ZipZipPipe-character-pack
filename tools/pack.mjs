#!/usr/bin/env node
// Cuts the raw codex strips in work/<id>/ into PA Cafe sheets under characters/<id>/.
// Mechanical only: alpha cleanup, connected-component cut, uniform scale, translate. Nothing is drawn or retouched.
// Usage: node tools/pack.mjs <id>...
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ALPHA = 24, CELL = 256, FACINGS = ['S', 'W', 'N', 'E'];
const WALK = { cols: 8, baseline: 240, standing: 208, maxW: 246, maxH: 234 };
// Hip pivots and sole baselines of PA Cafe's standard seated sheet (shared/seated-sheet.ts).
const SEAT = { S: { hip: 120, sole: 254 }, W: { hip: 136, sole: 254 }, N: { hip: 132, sole: 238 }, E: { hip: 124, sole: 238 } };
const SEAT_HEAD_RATIO = .9, SEAT_MARGIN = 6;

async function load(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // Generated art keeps its body slightly below full alpha and may carry a faint glow: stretch to full range, drop the glow.
  const histogram = new Uint32Array(256); for (let i = 3; i < data.length; i += 4) histogram[data[i]]++;
  let top = 255; for (let seen = 0, need = (data.length / 4 - histogram[0]) * .5; top > 0; top--) { seen += histogram[top]; if (seen >= need) break; }
  const low = 40, span = Math.max(1, top - low);
  for (let i = 3; i < data.length; i += 4) { const a = data[i]; data[i] = a <= low ? 0 : Math.min(255, Math.round((a - low) * 255 / span)); }
  return { data, w: info.width, h: info.height };
}

function components({ data, w, h }) {
  const labels = new Int32Array(w * h), list = [], stack = new Int32Array(w * h);
  for (let start = 0; start < w * h; start++) {
    if (labels[start] || data[start * 4 + 3] <= ALPHA) continue;
    const id = list.length + 1; let size = 0, l = w, t = h, r = -1, b = -1, sx = 0, sy = 0, n = 0;
    stack[n++] = start; labels[start] = id;
    while (n) {
      const p = stack[--n], x = p % w, y = (p / w) | 0;
      size++; sx += x; sy += y; if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; if (y > b) b = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx; if (!labels[q] && data[q * 4 + 3] > ALPHA) { labels[q] = id; stack[n++] = q; }
      }
    }
    list.push({ id, size, l, t, r, b, cx: sx / size, cy: sy / size });
  }
  return { labels, list };
}

// Returns cols*rows figures in reading order, each an RGBA crop that holds only its own pixels.
function figures(image, cols, rows, name) {
  const { labels, list } = components(image), count = cols * rows;
  const bySize = [...list].sort((a, b) => b.size - a.size), bodies = bySize.slice(0, count);
  if (bodies.length < count || bodies.at(-1).size < bodies[Math.floor(count / 2)].size * .3) throw new Error(`${name}: expected ${count} separate figures, found ${bodies.filter(b => b.size >= bodies[0].size * .3).length} (figures touch or are missing)`);
  if (bySize[count] && bySize[count].size > bodies.at(-1).size * .6) throw new Error(`${name}: more than ${count} figures drawn`);
  bodies.sort((a, b) => a.cy - b.cy);
  const ordered = []; for (let row = 0; row < rows; row++) ordered.push(...bodies.slice(row * cols, (row + 1) * cols).sort((a, b) => a.cx - b.cx));
  const owner = new Map(ordered.map((body, index) => [body.id, index]));
  for (const part of list) {
    if (owner.has(part.id) || part.size < 12) continue;
    let best = -1, distance = 24;
    ordered.forEach((body, index) => {
      const dx = Math.max(body.l - part.cx, 0, part.cx - body.r), dy = Math.max(body.t - part.cy, 0, part.cy - body.b), d = Math.hypot(dx, dy);
      if (d < distance) { distance = d; best = index; }
    });
    if (best >= 0) owner.set(part.id, best);
  }
  return ordered.map((_, index) => {
    let l = image.w, t = image.h, r = -1, b = -1;
    for (const part of list) if (owner.get(part.id) === index) { l = Math.min(l, part.l); t = Math.min(t, part.t); r = Math.max(r, part.r); b = Math.max(b, part.b); }
    const w = r - l + 1, h = b - t + 1, data = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = (t + y) * image.w + l + x; if (owner.get(labels[p]) !== index) continue;
      image.data.copy(data, (y * w + x) * 4, p * 4, p * 4 + 4);
    }
    return { data, w, h };
  });
}

// Same reading of a figure as PA Cafe's seated validator: rows with at least 4 solid pixels, widest row of the top 35%.
function measure(figure) {
  const rows = []; let sx = 0, n = 0;
  for (let y = 0; y < figure.h; y++) { let count = 0; for (let x = 0; x < figure.w; x++) if (figure.data[(y * figure.w + x) * 4 + 3] > ALPHA) { count++; sx += x; n++; } if (count >= 4) rows.push(y); }
  const top = rows[0], bottom = rows.at(-1), limit = top + Math.round((bottom - top) * .35); let headWidth = 0;
  for (let y = top; y < limit; y++) { let l = figure.w, r = -1; for (let x = 0; x < figure.w; x++) if (figure.data[(y * figure.w + x) * 4 + 3] > ALPHA) { l = Math.min(l, x); r = x; } if (r >= 0) headWidth = Math.max(headWidth, r - l + 1); }
  return { height: bottom - top + 1, headWidth, centre: sx / n };
}
function bandCentre(figure, from, to) {
  let sx = 0, n = 0;
  for (let y = Math.max(0, Math.round(from)); y < Math.min(figure.h, Math.round(to)); y++) for (let x = 0; x < figure.w; x++) if (figure.data[(y * figure.w + x) * 4 + 3] > ALPHA) { sx += x; n++; }
  return n ? sx / n : figure.w / 2;
}
async function scaled(figure, scale) {
  const w = Math.max(1, Math.round(figure.w * scale)), h = Math.max(1, Math.round(figure.h * scale));
  const data = await sharp(figure.data, { raw: { width: figure.w, height: figure.h, channels: 4 } }).resize(w, h, { fit: 'fill', kernel: 'lanczos3' }).raw().toBuffer();
  return { data, w, h };
}
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
function blit(sheet, sheetW, figure, left, top) {
  for (let y = 0; y < figure.h; y++) for (let x = 0; x < figure.w; x++) {
    const a = figure.data[(y * figure.w + x) * 4 + 3]; if (!a) continue;
    figure.data.copy(sheet, ((top + y) * sheetW + left + x) * 4, (y * figure.w + x) * 4, (y * figure.w + x) * 4 + 4);
  }
}
async function save(path, data, width, height, maxBytes) {
  mkdirSync(dirname(path), { recursive: true });
  const png = await sharp(data, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
  if (png.length > maxBytes) throw new Error(`${path}: ${png.length} bytes, over the ${maxBytes} limit`);
  writeFileSync(path, png); return png.length;
}

async function packWalk(id) {
  const rows = [];
  for (const facing of FACINGS) rows.push(figures(await load(join(root, `work/${id}/walk-${facing}.png`)), 4, 2, `${id}/walk-${facing}`));
  // One standing height for every facing; shrink all of them together when any frame would leave its cell.
  let fit = 1;
  const wanted = rows.map(row => { const s = WALK.standing / measure(row[0]).height; for (const f of row) fit = Math.min(fit, WALK.maxW / (f.w * s), WALK.maxH / (f.h * s)); return s; });
  const sheet = Buffer.alloc(CELL * WALK.cols * CELL * 4 * 4);
  for (const [r, row] of rows.entries()) for (const [c, raw] of row.entries()) {
    const f = await scaled(raw, wanted[r] * fit), centre = measure(f).centre;
    const left = clamp(Math.round(CELL / 2 - centre), 3, CELL - 3 - f.w);
    blit(sheet, CELL * WALK.cols, f, c * CELL + left, r * CELL + WALK.baseline - f.h);
  }
  return save(join(root, `characters/${id}/walk.png`), sheet, CELL * WALK.cols, CELL * 4, 3 * 1024 * 1024);
}

async function packSeated(id, headShare) {
  const sheet = Buffer.alloc(CELL * 4 * CELL * 4 * 4), report = {};
  for (const [r, facing] of FACINGS.entries()) {
    const row = figures(await load(join(root, `work/${id}/seat-${facing}.png`)), 3, 1, `${id}/seat-${facing}`), { hip, sole } = SEAT[facing];
    const held = measure(row[2]);
    let scale = SEAT_HEAD_RATIO * headShare * CELL / held.headWidth;
    scale = Math.min(scale, .9 * CELL / held.height);
    const fits = f => Math.min((CELL - 2 * SEAT_MARGIN) / f.w, (sole - SEAT_MARGIN) / f.h);
    scale = Math.min(scale, fits(row[2]), fits(row[0]) / .88, fits(row[1]) / .88);
    for (const [index, raw] of row.entries()) {
      // The more upright lowering frames may be up to 12% smaller than the held pose so a tall hairstyle still fits the cell.
      const own = Math.min(scale, fits(raw));
      const f = await scaled(raw, own), hipRow = f.h - (sole - (facing === 'S' || facing === 'W' ? 214 : 206));
      const anchor = index === 2 ? bandCentre(f, hipRow - 10, hipRow + 10) : measure(f).centre;
      const left = clamp(Math.round(hip - anchor), SEAT_MARGIN, CELL - SEAT_MARGIN - f.w);
      blit(sheet, CELL * 4, f, (index + 1) * CELL + left, r * CELL + sole - f.h);
    }
    report[facing] = { scale: +scale.toFixed(3), heldHeight: Math.round(held.height * scale), heldHead: Math.round(held.headWidth * scale) };
  }
  console.log(`  seated ${JSON.stringify(report)}`);
  return save(join(root, `characters/${id}/seated.png`), sheet, CELL * 4, CELL * 4, 3 * 1024 * 1024);
}

async function packModel(id) {
  const image = await load(join(root, `work/${id}/model.png`)), [figure] = figures(image, 1, 1, `${id}/model`);
  const fitInto = async (source, width, height, pad) => {
    const scale = Math.min((width - 2 * pad) / source.w, (height - 2 * pad) / source.h), f = await scaled(source, scale), out = Buffer.alloc(width * height * 4);
    blit(out, width, f, Math.round((width - f.w) / 2), height - pad - f.h); return out;
  };
  const standee = await save(join(root, `characters/${id}/standee.png`), await fitInto(figure, 512, 1024, 16), 512, 1024, 2 * 1024 * 1024);
  // Portrait: a square over the head and shoulders, cut from the same drawing.
  const m = measure(figure), side = Math.min(figure.w, Math.round(m.height * .58)), left = clamp(Math.round(bandCentre(figure, 0, m.height * .45) - side / 2), 0, figure.w - side), bust = Buffer.alloc(side * side * 4);
  for (let y = 0; y < side; y++) figure.data.copy(bust, y * side * 4, (y * figure.w + left) * 4, (y * figure.w + left + side) * 4);
  let portrait;
  for (const size of [512, 448, 384]) { try { portrait = await save(join(root, `characters/${id}/portrait.png`), await fitInto({ data: bust, w: side, h: side }, size, size, Math.round(size / 32)), size, size, 512 * 1024); break; } catch (error) { if (size === 384) throw error; } }
  return { standee, portrait };
}

function standingHeadShare(sheetPath) {
  return sharp(sheetPath).extract({ left: 0, top: 0, width: CELL, height: CELL }).raw().toBuffer().then(data => { const m = measure({ data, w: CELL, h: CELL }); return m.headWidth / m.height; });
}

let failed = 0;
for (const id of process.argv.slice(2)) {
  try {
    if (!existsSync(join(root, `work/${id}/model.png`))) throw new Error(`work/${id}/model.png is missing; run tools/gen.mjs ${id} first`);
    const { standee, portrait } = await packModel(id), walk = await packWalk(id);
    const headShare = await standingHeadShare(join(root, `characters/${id}/walk.png`));
    const seated = await packSeated(id, headShare);
    console.log(`ok   ${id}: portrait ${portrait} B, standee ${standee} B, walk ${walk} B, seated ${seated} B`);
  } catch (error) { failed++; console.log(`FAIL ${id}: ${error.message}`); }
}
process.exit(failed ? 1 : 0);
