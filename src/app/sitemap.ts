import type { MetadataRoute } from "next";

const PATHS = [
  "",
  "/search-kosts",
  "/residences",
  "/facilities",
  "/location",
  "/how-it-works",
  "/faq",
  "/about",
  "/contact",
];

/** Public pages in both locales. Set NEXT_PUBLIC_SITE_URL to the live domain. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  return PATHS.flatMap((path) =>
    ["id", "en"].map((locale) => ({
      url: `${base}/${locale}${path}`,
      changeFrequency: path === "" ? ("daily" as const) : ("weekly" as const),
      priority: path === "" ? 1 : 0.6,
    })),
  );
}
