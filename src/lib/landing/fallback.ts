/**
 * Fallback landing content — used until the admin serves GET /public/landing,
 * and whenever that request fails or returns something unusable.
 *
 * PLACEHOLDER marks copy the owner still needs to confirm (see README).
 * Prices, availability, room types and photos are NOT here: those always
 * come live from the catalogue.
 */

import cherryManifest from "../../../public/media/cherry/manifest.json";
import skyManifest from "../../../public/media/sky/manifest.json";
import { mediaFromManifest, type VideoManifest } from "./media";
import type { LandingContent } from "./schema";

const t = (id: string, en: string) => ({ id, en });

export const FALLBACK_LANDING: LandingContent = {
  hero: {
    // PLACEHOLDER headline (owner to confirm).
    headline: t("Pulang ke kamar yang", "Come home to a room that"),
    accent: t("terasa seperti rumah.", "feels like home."),
    subtitle: t(
      "Dua kost terawat di Medan, dikelola langsung oleh pemilik. Kamar siap huni — cek ketersediaan hari ini.",
      "Two well-kept boarding houses in Medan, managed directly by the owner. Move-in ready rooms — check today's availability.",
    ),
  },
  properties: [
    {
      key: "cherry",
      match: "cherry",
      // PLACEHOLDER tagline + area.
      tagline: t("Klasik, terang, dan tenang.", "Classic, bright and calm."),
      area: t("Medan", "Medan"),
      exteriorPhoto: "/assets/cherry-kost.jpeg",
      exteriorFocal: { x: 0.62, y: 0.45 },
      heroRoom: "Executive",
      heroRoomFeatures: [
        t("Kasur queen & lemari tanam", "Queen bed & built-in wardrobe"),
        t("AC dan meja rias", "Air-conditioning and vanity desk"),
        t("Jendela dengan cahaya alami", "Window with natural light"),
      ],
      media: mediaFromManifest(cherryManifest as VideoManifest, {
        "journey-1-arrival": { x: 0.58, y: 0.5 },
        "journey-3-room": { x: 0.55, y: 0.5 },
        closing: { x: 0.68, y: 0.5 },
      }),
      overlays: [
        { at: 0.05, kind: "gate", title: t("", ""), body: t("", "") },
        {
          at: 0.29,
          kind: "lobby",
          title: t("Lift ke semua lantai", "Lift to every floor"),
          body: t(
            "Lobi terang, tangga dan lift di depan pintu.",
            "A bright lobby, with stairs and a lift by the door.",
          ),
        },
        {
          at: 0.66,
          kind: "corridor",
          title: t(
            "Lorong tenang dan selalu bersih",
            "Quiet, always-clean corridors",
          ),
          body: t(
            "Setiap kamar punya pintu dan kunci sendiri.",
            "Every room has its own door and lock.",
          ),
        },
        { at: 0.95, kind: "room", title: t("", ""), body: t("", "") },
      ],
      // PLACEHOLDER captions; photos are added in the admin.
      facilities: [
        {
          key: "kitchen",
          icon: "cooking",
          alt: t("Dapur bersama", "Shared kitchen"),
          caption: t(
            "Dapur bersama untuk penghuni",
            "Shared kitchen for residents",
          ),
          detail: t("", ""),
        },
        {
          key: "laundry",
          icon: "local_laundry_service",
          alt: t("Laundry", "Laundry"),
          caption: t(
            "Laundry langsung di dalam gedung",
            "Laundry inside the building",
          ),
          detail: t("", ""),
        },
        {
          key: "parking",
          icon: "local_parking",
          alt: t("Parkir penghuni", "Resident parking"),
          caption: t("Parkir untuk penghuni", "Parking for residents"),
          detail: t("", ""),
        },
      ],
      rules: [],
    },
    {
      key: "sky",
      match: "sky",
      // PLACEHOLDER tagline + area.
      tagline: t("Modern, hijau, dan lapang.", "Modern, green and airy."),
      area: t("Medan", "Medan"),
      exteriorPhoto: "/assets/skykost.jpeg",
      exteriorFocal: { x: 0.5, y: 0.5 },
      // PLACEHOLDER features, taken from what the room video shows.
      heroRoomFeatures: [
        t("Kamar terang ber-AC", "Bright, air-conditioned room"),
        t("Kasur dan lemari pakaian", "Bed and wardrobe"),
        t("Lantai keramik, mudah dirawat", "Tiled floor, easy to keep clean"),
      ],
      // Exterior → lounge → corridor → room, then the rooftop to close.
      media: mediaFromManifest(skyManifest as VideoManifest, {
        "journey-1-arrival": { x: 0.56, y: 0.5 },
        "journey-2-lift": { x: 0.52, y: 0.5 },
        "journey-3-room": { x: 0.56, y: 0.5 },
        closing: { x: 0.45, y: 0.5 },
      }),
      overlays: [
        { at: 0.05, kind: "gate", title: t("", ""), body: t("", "") },
        {
          at: 0.29,
          kind: "lobby",
          title: t("Ruang santai bersama", "A shared lounge"),
          body: t(
            "Meja kayu dan taman hijau untuk bersantai atau bekerja.",
            "Wooden tables and greenery to relax or work.",
          ),
        },
        {
          at: 0.66,
          kind: "corridor",
          title: t("Lorong terang dan bersih", "Bright, clean corridors"),
          body: t(
            "Setiap kamar punya pintu dan kunci sendiri.",
            "Every room has its own door and lock.",
          ),
        },
        { at: 0.95, kind: "room", title: t("", ""), body: t("", "") },
      ],
      // PLACEHOLDER captions; photos are added in the admin.
      facilities: [
        {
          key: "lounge",
          icon: "weekend",
          alt: t("Ruang santai", "Lounge"),
          caption: t("Ruang santai di lantai dasar", "Ground-floor lounge"),
          detail: t("", ""),
        },
        {
          key: "rooftop",
          icon: "deck",
          alt: t("Rooftop", "Rooftop"),
          caption: t(
            "Rooftop dengan pemandangan kota",
            "Rooftop with a city view",
          ),
          detail: t("", ""),
        },
      ],
      rules: [],
    },
  ],
  landmarks: [],
  testimonials: [],
};
