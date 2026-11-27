/**
 * Facilities (§5.7–5.8) — photo feature cards, icon cards, and a full-bleed
 * photo carrying the transparent "included vs. paid separately" panel.
 */

"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { CHECK_AVAILABILITY_HREF } from "@/components/layout/nav-links";
import { HomeSectionHeading } from "@/components/sections/HomeSectionHeading";
import { ArrowPill } from "@/components/shared/ArrowPill";
import { Icon } from "@/components/shared/Icon";
import { Reveal } from "@/components/shared/Reveal";
import type { Kost } from "@/lib/types";

const FALLBACK_PHOTOS = ["/assets/cherry-kost.jpeg", "/assets/skykost.jpeg"];

const AMENITIES = [
  { id: "wifi", icon: "wifi" },
  { id: "ac", icon: "ac_unit" },
  { id: "security", icon: "shield_lock" },
  { id: "parking", icon: "local_parking" },
] as const;

const EXTRAS = [
  { id: "furnished", icon: "bed" },
  { id: "support", icon: "forum" },
] as const;

interface AmenitiesProps {
  kosts?: Kost[];
  /** Main content of /facilities: the page hero carries the headline. */
  asPage?: boolean;
}

export function Amenities({ kosts = [], asPage = false }: AmenitiesProps) {
  const t = useTranslations("home.amenities");

  // Real room photos first ("life inside"), then exteriors.
  const roomPhotos = Array.from(
    new Set(kosts.flatMap((k) => k.roomTypes.flatMap((rt) => rt.images))),
  ).filter(Boolean);
  const photos = [...roomPhotos, ...FALLBACK_PHOTOS];

  const included = [
    ...EXTRAS.map((e) => ({ icon: e.icon, label: t(`extra.${e.id}.title`) })),
    ...AMENITIES.map((a) => ({
      icon: a.icon,
      label: t(`items.${a.id}.title`),
    })),
  ];

  return (
    <section
      id="amenities"
      aria-labelledby="amenities-heading"
      className="w-full bg-canvas pt-24 lg:pt-32"
    >
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-14 px-5 sm:px-8 lg:gap-20 lg:px-12">
        {asPage ? null : (
          <HomeSectionHeading
            id="amenities-heading"
            eyebrow={t("badge")}
            titleLead={t("titleLead")}
            titleAccent={t("titleAccent")}
            aside={
              <p className="text-base leading-relaxed text-fg-muted">
                {t("description")}
              </p>
            }
          />
        )}

        <div className="grid gap-x-6 gap-y-10 lg:grid-cols-[1.9fr_1fr]">
          {EXTRAS.map((extra, index) => (
            <Reveal key={extra.id} delay={index * 0.08}>
              <div className="relative h-[18rem] overflow-hidden rounded-lg bg-ink lg:h-[26rem]">
                <Image
                  src={photos[index] ?? FALLBACK_PHOTOS[index]}
                  alt={t(`extra.${extra.id}.title`)}
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                />
              </div>
              <p className="eyebrow mt-5 text-[10px] tabular-nums text-fg-faint">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 text-xl font-medium tracking-tight text-fg">
                {t(`extra.${extra.id}.title`)}
              </h3>
              <p className="mt-1.5 max-w-md text-base leading-relaxed text-fg-muted">
                {t(`extra.${extra.id}.description`)}
              </p>
            </Reveal>
          ))}
        </div>

        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {AMENITIES.map((item, index) => (
            <Reveal
              key={item.id}
              delay={0.05 * index}
              className="flex flex-col border-t border-line pt-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm tabular-nums text-fg-faint">
                  {String(EXTRAS.length + index + 1).padStart(2, "0")}
                </span>
                <Icon
                  name={item.icon}
                  size={32}
                  className="text-fg [font-variation-settings:'wght'_200]"
                />
              </div>
              <h3 className="mt-8 text-lg font-medium tracking-tight text-fg">
                {t(`items.${item.id}.title`)}
              </h3>
              <p className="mt-1.5 text-base leading-relaxed text-fg-muted">
                {t(`items.${item.id}.description`)}
              </p>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Full-bleed photo with the transparency panel (§5.8, §7.4); ends on
          ink so the photo flows into the footer with no light strip. */}
      <div className="relative mt-24 bg-ink pb-24 lg:mt-32 lg:pb-32">
        <div className="relative h-[26rem] w-full overflow-hidden lg:h-[36rem]">
          <Image
            src={photos[2] ?? FALLBACK_PHOTOS[1]}
            alt={t("photoCaption")}
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_55%,rgb(22_16_38/0.9)_100%)]" />
        </div>
        <div className="mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-12">
          <Reveal className="relative -mt-24 ml-auto w-full max-w-md overflow-hidden rounded-lg bg-panel lg:-mt-72">
            <div className="p-6 lg:p-8">
              <p className="eyebrow mb-5 flex items-center gap-3 text-fg-muted">
                <span aria-hidden className="size-2 rounded-full bg-success" />
                {t("included")}
              </p>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {included.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center gap-2 text-[15px] text-fg"
                  >
                    <Icon name={item.icon} size={16} className="text-success" />
                    {item.label}
                  </li>
                ))}
              </ul>
              <p className="eyebrow mb-4 mt-8 flex items-center gap-3 text-fg-muted">
                <span aria-hidden className="h-px w-6 bg-brand" />
                {t("paidSeparately")}
              </p>
              <ul className="flex flex-col gap-2 text-[15px] leading-relaxed text-fg-2">
                <li>{t("electricity")}</li>
                <li>{t("deposit")}</li>
              </ul>
              <p className="mt-6 border-t border-line pt-5 text-[15px] font-medium text-fg">
                {t("noAgent")}
              </p>
              <ArrowPill
                href={CHECK_AVAILABILITY_HREF}
                className="mt-6 w-full justify-between"
              >
                {t("seeRooms")}
              </ArrowPill>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
