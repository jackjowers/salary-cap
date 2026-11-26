// Downloads preset board images from Wikimedia Commons, crops them to squares,
// and writes public/images/<board>/<slug>.jpg plus src/lib/credits.json.
// Originals are cached in .image-cache/ so crops can be redone without downloading again.
// Usage: node scripts/fetch-images.mjs [--force] [--only=<id>,<id>]
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SIZE = 320;
const UA = "SalaryCapGameImageFetcher/0.1 (one-off build script)";
const force = process.argv.includes("--force");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7).split(",");
const CACHE = path.join(ROOT, ".image-cache");

const slug = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/ /g, "-");

const exists = (p) => access(p).then(() => true, () => false);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function download(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (attempt === 3) throw new Error(`${res.status} for ${url}`);
    await sleep(10000 * attempt);
  }
}

async function toSquare(buf, logo) {
  if (logo) {
    const inner = Math.round(SIZE * 0.8);
    const fitted = await sharp(buf)
      .resize(inner, inner, { fit: "inside" })
      .flatten({ background: "#ffffff" })
      .toBuffer();
    return sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: "#ffffff" } })
      .composite([{ input: fitted, gravity: "center" }])
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
  }
  const { width = 0, height = 0 } = await sharp(buf).metadata();
  let img = sharp(buf).flatten({ background: "#1a1a1a" });
  if (height > width * 1.1) {
    // Portraits: faces sit near the top, so take a square from just below the top edge.
    const top = Math.round(Math.min(height * 0.04, height - width));
    img = img.extract({ left: 0, top, width, height: width }).resize(SIZE, SIZE);
  } else {
    img = img.resize(SIZE, SIZE, { fit: "cover", position: sharp.strategy.attention });
  }
  return img
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
}

const sources = JSON.parse(await readFile(path.join(ROOT, "scripts/image-sources.json"), "utf8"));
const credits = {};
const failures = [];

for (const [board, items] of Object.entries(sources)) {
  if (board.startsWith("_")) continue;
  const dir = path.join(ROOT, "public/images", board);
  await mkdir(dir, { recursive: true });
  for (const [name, src] of Object.entries(items)) {
    const id = `${board}-${slug(name)}`;
    const out = path.join(dir, `${slug(name)}.jpg`);
    credits[id] = {
      name,
      artist: src.artist,
      license: src.license,
      licenseUrl: src.licenseUrl,
      source: `https://commons.wikimedia.org/wiki/File:${src.file}`,
    };
    if (only && !only.includes(id)) continue;
    if (!force && !only && (await exists(out))) continue;
    let hit = false;
    try {
      const cached = path.join(CACHE, `${id}.bin`);
      hit = await exists(cached);
      const buf = hit ? await readFile(cached) : await download(`https://upload.wikimedia.org/wikipedia/commons/${src.thumb}`);
      if (!hit) await mkdir(CACHE, { recursive: true }).then(() => writeFile(cached, buf));
      await writeFile(out, await toSquare(buf, src.logo));
      console.log(`ok   ${id}`);
    } catch (err) {
      failures.push(`${id}: ${err.message}`);
      console.error(`FAIL ${id}: ${err.message}`);
    }
    if (!hit) await sleep(3000);
  }
}

await writeFile(path.join(ROOT, "src/lib/credits.json"), JSON.stringify(credits, null, 2) + "\n");
console.log(`\n${Object.keys(credits).length} credits written, ${failures.length} failures`);
if (failures.length) process.exit(1);
