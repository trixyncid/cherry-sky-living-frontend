/**
 * Turns a scripts/process-video manifest into the media block of a property.
 * The admin will store the same URLs on the media items after it runs the
 * processing on upload; until then the manifest ships with the site.
 */

import { type Clip, type PropertyContent, VIDEO_ROLES } from "./schema";

interface ManifestFile {
  url: string;
  bytes: number;
  duration?: number;
}
export interface VideoManifest {
  files: Record<string, ManifestFile | undefined>;
  journey?: { chapters: { role: string; start: number; end: number }[] };
}

type Media = PropertyContent["media"];

export function mediaFromManifest(
  manifest: VideoManifest,
  focals: Partial<
    Record<(typeof VIDEO_ROLES)[number], { x: number; y: number }>
  > = {},
): Media {
  const f = manifest.files;
  const scrub = (mp4?: ManifestFile, webm?: ManifestFile) =>
    mp4
      ? { mp4: mp4.url, webm: webm?.url, duration: mp4.duration ?? 8 }
      : undefined;

  const clips: Media["clips"] = {};
  for (const role of VIDEO_ROLES) {
    const play = f[`${role}.desktop.play`];
    if (!play) continue;
    const clip: Clip = {
      desktopPlay: play.url,
      mobilePlay: f[`${role}.mobile.play`]?.url,
      posterDesktop: f[`${role}.desktop.first`]?.url,
      posterMobile: f[`${role}.mobile.first`]?.url,
      lastFrameDesktop: f[`${role}.desktop.last`]?.url,
      lastFrameMobile: f[`${role}.mobile.last`]?.url,
      duration: play.duration ?? 8,
      focal: focals[role] ?? { x: 0.5, y: 0.5 },
    };
    clips[role] = clip;
  }

  return {
    journeyScrub: scrub(
      f["journey.desktop.scrub.mp4"],
      f["journey.desktop.scrub.webm"],
    ),
    journeyScrubMobile: scrub(f["journey.mobile.scrub.mp4"]),
    closingScrub: scrub(
      f["closing.desktop.scrub.mp4"],
      f["closing.desktop.scrub.webm"],
    ),
    choiceLoop: f["choice-loop"]?.url,
    chapters: (manifest.journey?.chapters ?? []).filter(
      (c): c is Media["chapters"][number] =>
        (VIDEO_ROLES as readonly string[]).includes(c.role),
    ),
    clips,
  };
}
