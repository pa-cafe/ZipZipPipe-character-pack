#!/usr/bin/env node
// Builds one importable file per character: packs/<id>.pacafe-character.json (format "pa-cafe-character" v1).
// Usage: node tools/build.mjs [id...]   (default: every character whose four images exist)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const roster = JSON.parse(readFileSync(join(root, 'tools/roster.json'), 'utf8'));
const files = { portrait: 'portrait.png', sheet: 'walk.png', standee: 'standee.png', seated: 'seated.png' };
const zip = { name: 'ZipZipPipe', role: 'Original character design (AI娘化)', url: 'https://www.pixiv.net/artworks/148186519' };
const shangshan = { name: '上善无形', role: 'Original whale girl character the DeepSeek design is based on', url: 'https://space.bilibili.com/4456176' };
const pack = { name: 'ZipZipPipe-character-pack', role: 'Chibi sprite adaptation for PA Cafe, drawn with AI image generation', url: roster.repository };
const wanted = process.argv.slice(2), index = [];
mkdirSync(join(root, 'packs'), { recursive: true });
for (const character of roster.characters) {
  if (wanted.length && !wanted.includes(character.id)) continue;
  const dir = join(root, 'characters', character.id);
  if (!Object.values(files).every(name => existsSync(join(dir, name)))) { console.log(`skip ${character.id}: images missing`); continue; }
  const data = {
    format: 'pa-cafe-character', version: 1, id: `zipzippipe-${character.id}`, name: character.name, role: character.nameEn,
    license: { name: 'CC BY-NC-SA 4.0', url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/' },
    credits: [...(character.id === 'deepseek' ? [shangshan] : []), zip, pack],
    source: roster.repository,
    files: Object.fromEntries(Object.entries(files).map(([kind, name]) => [kind, `data:image/png;base64,${readFileSync(join(dir, name)).toString('base64')}`])),
  };
  const out = join(root, 'packs', `${character.id}.pacafe-character.json`), text = JSON.stringify(data);
  writeFileSync(out, text); index.push({ id: character.id, name: character.name, nameEn: character.nameEn, page: character.page, file: `packs/${character.id}.pacafe-character.json`, bytes: text.length });
  console.log(`ok   ${character.id}: ${(text.length / 1024 / 1024).toFixed(2)} MB`);
}
if (!wanted.length) writeFileSync(join(root, 'packs/index.json'), JSON.stringify({ format: 'pa-cafe-character-index', version: 1, characters: index }, null, 2) + '\n');
