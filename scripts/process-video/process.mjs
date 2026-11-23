#!/usr/bin/env node
/**
 * Process a property's video clips for the landing page.
 *
 *   node scripts/process-video/process.mjs scripts/process-video/cherry.config.json
 *
 * For the clips in the config (roles: journey-1-arrival, journey-2-lift,
 * journey-3-room, closing — any may be missing) it writes to `outDir`:
 *
 *   journey.desktop.scrub.mp4/.webm   1+2+3 joined, every frame a keyframe, 1280w
 *   journey.mobile.scrub.mp4          same, 9:16 crop around each clip's focal point
 *   <role>.desktop.play.mp4           normally encoded, for autoplay
 *   <role>.mobile.play.mp4            9:16, for scroll-triggered playback
 *   closing.desktop.scrub.mp4/.webm, closing.mobile.scrub.mp4
 *   <role>.<desktop|mobile>.first.webp / .last.webp   posters
 *   choice-loop.mp4                   first 3 s of the arrival, forward + reversed
 *   manifest.json                     URLs, sizes, durations, chapter marks
 *
 * No audio anywhere. Scrub files are tuned down (quality, then frame rate)
 * until they fit the size targets; the manifest records what was used.
 *
 * ffmpeg comes from @ffmpeg-installer/ffmpeg (or FFMPEG_PATH); posters are
 * converted to WebP with sharp, so no system packages are needed.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const FFMPEG = process.env.FFMPEG_PATH || require("@ffmpeg-installer/ffmpeg").path;
const FFPROBE = process.env.FFPROBE_PATH || require("@ffprobe-installer/ffprobe").path;
const sharp = require("sharp");

const FPS = 24;
const JOIN_FRAMES = 6; // cross-blend at each journey join (clips are near-, not frame-identical)
const DESKTOP_W = 1280;
const MOBILE_H = 720;
const JOURNEY_ROLES = ["journey-1-arrival", "journey-2-lift", "journey-3-room"];

const configPath = process.argv[2];
if (!configPath) {
  console.error("usage: process.mjs <config.json>");
  process.exit(1);
}
const config = JSON.parse(readFileSync(configPath, "utf8"));
const OUT = resolve(config.outDir);
const PUBLIC_PREFIX = `/${config.outDir.replace(/^public\//, "")}`;
const TMP = mkdtempSync(join(tmpdir(), "process-video-"));
mkdirSync(OUT, { recursive: true });

const ff = (args) => execFileSync(FFMPEG, ["-v", "error", "-y", ...args], { stdio: ["ignore", "ignore", "inherit"] });
const probe = (file) => {
  const out = execFileSync(FFPROBE, ["-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries", "stream=nb_read_frames,width,height", "-of", "csv=p=0", file]).toString().trim();
  const [width, height, frames] = out.split(",").map(Number);
  return { width, height, frames };
};
const size = (file) => statSync(file).size;
const mb = (bytes) => `${(bytes / 1048576).toFixed(2)} MB`;
const even = (n) => 2 * Math.round(n / 2);

/** 9:16 crop window around the focal point, clamped inside the frame. */
function mobileCrop(width, height, focal) {
  const w = even((height * 9) / 16);
  const x = Math.round(Math.min(Math.max(focal.x * width - w / 2, 0), width - w));
  return `crop=${w}:${height}:${x}:0,scale=-2:${MOBILE_H}`;
}

// ——— 1. Normalise every clip (24 fps, no audio, near-lossless intermediates) ———
const clips = {};
for (const [role, clip] of Object.entries(config.clips)) {
  if (!clip?.file || !existsSync(clip.file)) {
    console.warn(`skip ${role}: file not found`);
    continue;
  }
  const src = probe(clip.file);
  const focal = clip.focal ?? { x: 0.5, y: 0.5 };
  const desktop = join(TMP, `${role}.desktop.mkv`);
  const mobile = join(TMP, `${role}.mobile.mkv`);
  const base = ["-i", clip.file, "-an", "-r", String(FPS), "-pix_fmt", "yuv420p", "-c:v", "libx264", "-preset", "veryfast", "-crf", "10"];
  ff([...base, "-vf", `scale=${DESKTOP_W}:-2`, desktop]);
  ff([...base, "-vf", mobileCrop(src.width, src.height, focal), mobile]);
  clips[role] = { desktop, mobile, frames: probe(desktop).frames, source: { ...src, file: clip.file } };
}

const manifest = { property: config.property, fps: FPS, generatedAt: new Date().toISOString(), files: {}, notes: [] };
const record = (key, file, extra = {}) => {
  manifest.files[key] = { url: `${PUBLIC_PREFIX}/${file}`, bytes: size(join(OUT, file)), ...extra };
};

// ——— 2. Posters (first + last frame, WebP) and playback encodes ———
for (const [role, clip] of Object.entries(clips)) {
  for (const variant of ["desktop", "mobile"]) {
    for (const [which, select] of [["first", "eq(n\\,0)"], ["last", `eq(n\\,${clip.frames - 1})`]]) {
      const png = join(TMP, `${role}.${variant}.${which}.png`);
      ff(["-i", clip[variant], "-vf", `select=${select}`, "-vframes", "1", png]);
      const file = `${role}.${variant}.${which}.webp`;
      await sharp(png).webp({ quality: 80 }).toFile(join(OUT, file));
      record(`${role}.${variant}.${which}`, file);
    }
    const file = `${role}.${variant}.play.mp4`;
    ff(["-i", clip[variant], "-an", "-c:v", "libx264", "-preset", "slow", "-crf", variant === "desktop" ? "25" : "26", "-pix_fmt", "yuv420p", "-movflags", "+faststart", join(OUT, file)]);
    record(`${role}.${variant}.play`, file, { duration: clip.frames / FPS });
  }
}

// ——— 3. Scrub encodes: every frame a keyframe, fitted to a size budget ———
/** Encode all-intra, stepping quality (then frame rate) down until it fits. */
function encodeScrub(input, outFile, codec, budgetBytes, label) {
  const steps = codec === "h264"
    ? [[24, FPS], [27, FPS], [30, FPS], [32, FPS], [34, FPS], [32, 12], [35, 12]]
    : [[38, FPS], [44, FPS], [50, FPS], [56, FPS], [50, 12], [58, 12]];
  for (const [crf, fps] of steps) {
    const rate = fps === FPS ? [] : ["-r", String(fps)];
    const args = codec === "h264"
      ? ["-i", input, "-an", ...rate, "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-g", "1", "-keyint_min", "1", "-sc_threshold", "0", "-pix_fmt", "yuv420p", "-movflags", "+faststart", outFile]
      : ["-i", input, "-an", ...rate, "-c:v", "libvpx-vp9", "-crf", String(crf), "-b:v", "0", "-g", "1", "-deadline", "good", "-cpu-used", "5", "-row-mt", "1", "-pix_fmt", "yuv420p", outFile];
    ff(args);
    if (size(outFile) <= budgetBytes) {
      if (fps !== FPS) manifest.notes.push(`${label}: dropped to ${fps} fps (crf ${crf}) to fit ${mb(budgetBytes)}`);
      return { crf, fps };
    }
  }
  manifest.notes.push(`${label}: still over budget (${mb(size(outFile))} > ${mb(budgetBytes)}) at the lowest setting`);
  return { crf: steps.at(-1)[0], fps: steps.at(-1)[1] };
}

const journeyClips = JOURNEY_ROLES.filter((role) => clips[role]);
if (journeyClips.length > 0) {
  // Join 1+2+3 into one shot. The clips end/start on near-identical frames,
  // so a short cross-blend hides the seam better than dropping one frame.
  const join_ = JOIN_FRAMES / FPS;
  const chapters = [];
  for (const variant of ["desktop", "mobile"]) {
    const inputs = journeyClips.flatMap((role) => ["-i", clips[role][variant]]);
    let filter = "";
    let last = "[0:v]";
    let elapsed = clips[journeyClips[0]].frames / FPS;
    const marks = [0];
    for (let i = 1; i < journeyClips.length; i++) {
      const offset = elapsed - join_;
      filter += `${last}[${i}:v]xfade=transition=fade:duration=${join_.toFixed(4)}:offset=${offset.toFixed(4)}[x${i}];`;
      last = `[x${i}]`;
      marks.push(offset + join_ / 2);
      elapsed = offset + clips[journeyClips[i]].frames / FPS;
    }
    const joined = join(TMP, `journey.${variant}.mkv`);
    if (journeyClips.length === 1) ff(["-i", clips[journeyClips[0]][variant], "-c", "copy", joined]);
    else ff([...inputs, "-filter_complex", filter.replace(/;$/, ""), "-map", last, "-an", "-r", String(FPS), "-c:v", "libx264", "-preset", "veryfast", "-crf", "10", "-pix_fmt", "yuv420p", joined]);
    const duration = probe(joined).frames / FPS;
    if (variant === "desktop")
      journeyClips.forEach((role, i) => chapters.push({ role, start: marks[i] / duration, end: (marks[i + 1] ?? duration) / duration }));

    const budget = (variant === "desktop" ? config.targets.desktopJourneyMB : config.targets.mobileJourneyMB) * 1048576;
    const mp4 = `journey.${variant}.scrub.mp4`;
    const used = encodeScrub(joined, join(OUT, mp4), "h264", budget, mp4);
    record(`journey.${variant}.scrub.mp4`, mp4, { duration, ...used });
    if (variant === "desktop") {
      const webm = "journey.desktop.scrub.webm";
      const usedWebm = encodeScrub(joined, join(OUT, webm), "vp9", budget, webm);
      record("journey.desktop.scrub.webm", webm, { duration, ...usedWebm });
    }
  }
  manifest.journey = { chapters };
}

if (clips.closing) {
  // Closing gets a third of the journey budget (it is a third as long).
  for (const variant of ["desktop", "mobile"]) {
    const budget = ((variant === "desktop" ? config.targets.desktopJourneyMB : config.targets.mobileJourneyMB) / 3) * 1048576;
    const mp4 = `closing.${variant}.scrub.mp4`;
    const used = encodeScrub(clips.closing[variant], join(OUT, mp4), "h264", budget, mp4);
    record(mp4.replace(/\.mp4$/, ".mp4"), mp4, { duration: clips.closing.frames / FPS, ...used });
    if (variant === "desktop") {
      const usedWebm = encodeScrub(clips.closing.desktop, join(OUT, "closing.desktop.scrub.webm"), "vp9", budget, "closing.desktop.scrub.webm");
      record("closing.desktop.scrub.webm", "closing.desktop.scrub.webm", { duration: clips.closing.frames / FPS, ...usedWebm });
    }
  }
}

// ——— 4. Choice-screen boomerang: 3 s forward, then the same 3 s reversed ———
if (clips["journey-1-arrival"]) {
  const file = "choice-loop.mp4";
  ff(["-i", clips["journey-1-arrival"].desktop, "-filter_complex", "[0:v]trim=0:3,setpts=PTS-STARTPTS,scale=960:-2,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[v]", "-map", "[v]", "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-movflags", "+faststart", join(OUT, file)]);
  record("choice-loop", file, { duration: 6 });
}

writeFileSync(join(OUT, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
rmSync(TMP, { recursive: true, force: true });

console.log(`\n${config.property}: ${Object.keys(manifest.files).length} files → ${config.outDir}`);
for (const [key, f] of Object.entries(manifest.files)) console.log(`  ${key.padEnd(34)} ${mb(f.bytes).padStart(9)}${f.crf ? `  crf ${f.crf} @ ${f.fps} fps` : ""}`);
for (const note of manifest.notes) console.log(`  note: ${note}`);
