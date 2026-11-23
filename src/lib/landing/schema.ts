/**
 * Landing-page content shapes (zod). Everything the admin publishes for the
 * landing page is parsed through these; a missing or malformed field falls
 * back to a safe default instead of crashing the page.
 *
 * The backend will serve this shape from GET /public/landing. Until that
 * endpoint exists (and whenever it fails) `fallback.ts` supplies the content.
 */

import { z } from "zod";

export const PROPERTY_KEYS = ["cherry", "sky"] as const;
export type PropertyKey = (typeof PROPERTY_KEYS)[number];

/** Text the admin writes in both languages. */
const localized = z
  .object({ id: z.string().catch(""), en: z.string().catch("") })
  .catch({ id: "", en: "" });
export type Localized = z.infer<typeof localized>;

const fraction = z.number().min(0).max(1);
const focal = z
  .object({ x: fraction.catch(0.5), y: fraction.catch(0.5) })
  .catch({ x: 0.5, y: 0.5 });

export const VIDEO_ROLES = [
  "journey-1-arrival",
  "journey-2-lift",
  "journey-3-room",
  "closing",
] as const;
export type VideoRole = (typeof VIDEO_ROLES)[number];

/** One processed clip (output of scripts/process-video). */
const clip = z.object({
  /** Normally encoded, for autoplay / mobile chapter playback. */
  desktopPlay: z.string().optional(),
  mobilePlay: z.string().optional(),
  posterDesktop: z.string().optional(),
  posterMobile: z.string().optional(),
  lastFrameDesktop: z.string().optional(),
  lastFrameMobile: z.string().optional(),
  duration: z.number().positive().catch(8),
  focal,
});
export type Clip = z.infer<typeof clip>;

/** A scrub file: every frame is a keyframe so currentTime can follow scroll. */
const scrub = z.object({
  mp4: z.string(),
  webm: z.string().optional(),
  duration: z.number().positive(),
});

const overlay = z.object({
  /** Where on the journey (0–1) the caption is centred. */
  at: fraction,
  kind: z.enum(["gate", "lobby", "corridor", "room"]).catch("lobby"),
  title: localized,
  body: localized,
});
export type JourneyOverlay = z.infer<typeof overlay>;

const chapter = z.object({
  role: z.enum(VIDEO_ROLES),
  start: fraction,
  end: fraction,
});

const facility = z.object({
  key: z.string(),
  photo: z.string().optional(),
  alt: localized,
  caption: localized,
  /** Free text such as real laundry prices. */
  detail: localized,
  icon: z.string().catch("check_circle"),
});
export type FacilityItem = z.infer<typeof facility>;

const propertyContent = z.object({
  key: z.enum(PROPERTY_KEYS),
  /** Matches the property in the live catalogue by name. */
  match: z.string(),
  tagline: localized,
  area: localized,
  gender: z.enum(["putra", "putri", "campur"]).optional(),
  whatsapp: z.string().optional(),
  exteriorPhoto: z.string(),
  exteriorFocal: focal,
  /** The room the journey ends in (matched to a live room type by name). */
  heroRoom: z.string().optional(),
  heroRoomFeatures: z.array(localized).catch([]),
  media: z
    .object({
      journeyScrub: scrub.optional(),
      journeyScrubMobile: scrub.optional(),
      closingScrub: scrub.optional(),
      choiceLoop: z.string().optional(),
      chapters: z.array(chapter).catch([]),
      clips: z.partialRecord(z.enum(VIDEO_ROLES), clip).catch({}),
    })
    .catch({ chapters: [], clips: {} }),
  overlays: z.array(overlay).catch([]),
  facilities: z.array(facility).catch([]),
  rules: z.array(localized).catch([]),
  geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
  mapsUrl: z.string().optional(),
});
export type PropertyContent = z.infer<typeof propertyContent>;

const landmark = z.object({
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  /** e.g. "5 menit ke kampus". */
  travel: localized,
  nearest: z.enum(PROPERTY_KEYS).optional(),
});
export type Landmark = z.infer<typeof landmark>;

const testimonial = z.object({
  name: z.string(),
  role: z.string().catch(""),
  property: z.enum(PROPERTY_KEYS).optional(),
  quote: localized,
});
export type Testimonial = z.infer<typeof testimonial>;

export const landingContentSchema = z.object({
  hero: z
    .object({ headline: localized, accent: localized, subtitle: localized })
    .optional(),
  properties: z.array(propertyContent).catch([]),
  landmarks: z.array(landmark).catch([]),
  testimonials: z.array(testimonial).catch([]),
  googleRating: z
    .object({ rating: z.number(), count: z.number(), url: z.string() })
    .optional(),
});
export type LandingContent = z.infer<typeof landingContentSchema>;

export function pick(text: Localized | undefined, locale: string) {
  if (!text) return "";
  return (locale === "en" ? text.en : text.id) || text.id || text.en;
}
