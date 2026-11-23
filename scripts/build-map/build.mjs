#!/usr/bin/env node
/**
 * Builds the 3D neighbourhood for the landing page's location map.
 *
 *   node scripts/build-map/build.mjs [--samples 64] [--res 2048]
 *
 * Runs Blender headless on build_map.py (set BLENDER_PATH if Blender is not in
 * /Applications), then converts the baked PNGs to WebP with sharp. Output goes
 * to public/media/map: city.glb, ground.webp, city-lm.webp, heroes-lm.webp,
 * poster.webp. Takes roughly 15–25 minutes at the default quality.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const out = path.join(root, "public/media/map");
const work = path.join(process.env.MAP_WORK_DIR ?? tmpdir(), "cherry-sky-map");
const blender =
  process.env.BLENDER_PATH ??
  "/Applications/Blender.app/Contents/MacOS/Blender";

if (!existsSync(blender)) {
  console.error(`Blender not found at ${blender}. Set BLENDER_PATH.`);
  process.exit(1);
}
mkdirSync(out, { recursive: true });
mkdirSync(work, { recursive: true });

const run = spawnSync(
  blender,
  [
    "-b",
    "-P",
    path.join(here, "build_map.py"),
    "--",
    "--out",
    out,
    "--work",
    work,
    ...process.argv.slice(2),
  ],
  {
    stdio: ["ignore", "pipe", "inherit"],
    encoding: "utf8",
    maxBuffer: 1 << 28,
  },
);
for (const line of run.stdout.split("\n"))
  if (line.startsWith("MAP")) console.log(line);
if (run.status !== 0 || !run.stdout.includes("MAP done")) {
  console.error(run.stdout.split("\n").slice(-30).join("\n"));
  process.exit(1);
}

const quality = { ground: 82, "city-lm": 86, "heroes-lm": 88, poster: 80 };
for (const [name, q] of Object.entries(quality)) {
  const png = path.join(out, `${name}.png`);
  const webp = path.join(out, `${name}.webp`);
  await sharp(png).webp({ quality: q, effort: 6 }).toFile(webp);
  rmSync(png);
  console.log(`${name}.webp  ${(statSync(webp).size / 1024).toFixed(0)} KB`);
}
console.log(
  `city.glb  ${(statSync(path.join(out, "city.glb")).size / 1024).toFixed(0)} KB`,
);
