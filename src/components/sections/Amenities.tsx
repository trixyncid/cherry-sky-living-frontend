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
import { cn } from "@/lib/utils";

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
      className={cn("w-full pt-14 lg:pt-20", asPage && "pt-12 lg:pt-16")}
    >
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-8 px-5 sm:px-8 lg:gap-12">
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

        <div className="grid gap-3 lg:grid-cols-[1.9fr_1fr]">
          {EXTRAS.map((extra, index) => (
            <Reveal
              key={extra.id}
              delay={index * 0.08}
              className="relative min-h-[18rem] overflow-hidden rounded-[1.25rem] bg-ink lg:min-h-[22rem]"
            >
              <Image
                src={photos[index] ?? FALLBACK_PHOTOS[index]}
                alt={t(`extra.${extra.id}.title`)}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-6 bottom-6 max-w-sm text-white">
                <h3 className="text-2xl font-medium tracking-tight">
                  {t(`extra.${extra.id}.title`)}
                </h3>
                <p className="mt-1.5 text-base text-white/80">
                  {t(`extra.${extra.id}.description`)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="-mt-5 grid gap-3 sm:grid-cols-2 lg:-mt-9 lg:grid-cols-4">
          {AMENITIES.map((item, index) => (
            <Reveal
              key={item.id}
              delay={0.05 * index}
              className="flex flex-col rounded-[1.25rem] bg-white p-6"
            >
              <Icon
                name={item.icon}
                size={44}
                className="text-fg [font-variation-settings:'wght'_200]"
              />
              <h3 className="mt-6 text-xl font-medium tracking-tight text-fg">
                {t(`items.${item.id}.title`)}
              </h3>
              <p className="mt-1.5 text-base leading-relaxed text-fg-muted">
                {t(`items.${item.id}.description`)}
              </p>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Full-bleed photo with the transparency panel (§5.8, §7.4) */}
      {/* Ends on the footer's deep wine so the photo flows into it with no
          light strip, whatever the floating card's height. */}
      <div className="relative mt-14 bg-ink pb-14 lg:mt-20 lg:pb-20">
        <div className="relative h-[26rem] w-full overflow-hidden lg:h-[34rem]">
          <Image
            src={photos[2] ?? FALLBACK_PHOTOS[1]}
            alt={t("photoCaption")}
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="mx-auto w-full max-w-[90rem] px-5 sm:px-8">
          <Reveal className="relative -mt-24 ml-auto w-full max-w-md overflow-hidden rounded-[1.25rem] bg-white shadow-[0_30px_60px_-30px_rgb(0_0_0/0.4)] lg:-mt-72">
            <div className="p-6">
              <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-success">
                <Icon name="check_circle" size={18} />
                {t("included")}
              </p>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {included.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center gap-2 text-[15px] text-fg"
                  >
                    <Icon
                      name={item.icon}
                      size={16}
                      className="text-success"
                    />
                    {item.label}
                  </li>
                ))}
              </ul>
              <p className="mb-3 mt-6 flex items-center gap-2 text-sm font-semibold text-brand">
                <Icon name="receipt_long" size={18} />
                {t("paidSeparately")}
              </p>
              <ul className="flex flex-col gap-2 text-[15px] leading-relaxed text-fg-2">
                <li>{t("electricity")}</li>
                <li>{t("deposit")}</li>
              </ul>
              <p className="mt-4 border-t border-hover pt-4 text-[15px] font-semibold text-fg">
                {t("noAgent")}
              </p>
            </div>
            <ArrowPill
              href={CHECK_AVAILABILITY_HREF}
              className="h-14 w-full rounded-none pl-6"
            >
              {t("seeRooms")}
            </ArrowPill>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
