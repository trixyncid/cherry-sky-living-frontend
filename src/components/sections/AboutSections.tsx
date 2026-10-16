/**
 * About page sections: typographic hero with photo strip, story with
 * mission/vision, values grid, and live "by the numbers".
 */

"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { CHECK_AVAILABILITY_HREF } from "@/components/layout/nav-links";
import { HomeSectionHeading } from "@/components/sections/HomeSectionHeading";
import { PageHero } from "@/components/sections/PageHero";
import { ArrowPill, Eyebrow } from "@/components/shared/ArrowPill";
import { Icon } from "@/components/shared/Icon";
import { Reveal } from "@/components/shared/Reveal";
import { siteConfig } from "@/config/site";
import { track } from "@/lib/analytics";
import type { Kost } from "@/lib/types";
import { formatCurrency, generateWhatsAppURL } from "@/lib/utils/format";

export function AboutHeroSection({ kosts = [] }: { kosts?: Kost[] }) {
  const t = useTranslations("about");
  const tWhatsapp = useTranslations("whatsapp");
  const roomPhoto = kosts.flatMap((k) =>
    k.roomTypes.flatMap((rt) => rt.images),
  )[0];
  const photos = [
    { src: "/assets/cherry-kost.jpeg", alt: t("mission.storyPhotoAlt") },
    { src: roomPhoto ?? "/assets/skykost.jpeg", alt: t("hero.title") },
    { src: "/assets/skykost.jpeg", alt: t("hero.subtitle") },
  ];

  return (
    <>
      <PageHero
        eyebrow={t("hero.eyebrow")}
        titleLead={t("page.heroLead")}
        titleAccent={t("page.heroAccent")}
        description={t("hero.description")}
        photo="/assets/skykost.jpeg"
      >
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ArrowPill href={CHECK_AVAILABILITY_HREF} tone="light">
            {t("hero.ctaRooms")}
          </ArrowPill>
          <a
            href={generateWhatsAppURL(
              siteConfig.whatsappNumber,
              tWhatsapp("generalInquiry"),
            )}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("click_whatsapp", { location: "about_hero" })}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/30 px-5 text-[15px] font-semibold text-white backdrop-blur-sm hover:bg-white/10"
          >
            <Icon name="whatsapp" size={18} />
            {t("hero.ctaViewing")}
          </a>
        </div>
      </PageHero>
      <section className="w-full px-5 pt-12 sm:px-8 lg:pt-16">
        <div className="mx-auto grid w-full max-w-[90rem] gap-3 sm:grid-cols-[1.3fr_1fr_1fr]">
          {photos.map((photo, i) => (
            <Reveal
              key={`${photo.src}-${i}`}
              delay={i * 0.08}
              className="relative h-[16rem] overflow-hidden rounded-[1.25rem] bg-[#e7e4df] lg:h-[22rem]"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 640px) 100vw, 40vw"
                className="object-cover"
              />
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}

export function AboutStorySection() {
  const t = useTranslations("about");
  const cards = [
    {
      label: t("mission.missionLabel"),
      title: t("mission.title"),
      body: t("mission.description"),
    },
    {
      label: t("mission.visionLabel"),
      title: t("mission.vision"),
      body: t("mission.visionDescription"),
    },
  ];

  return (
    <section className="w-full px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto grid w-full max-w-[90rem] gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <Reveal className="relative min-h-[22rem] overflow-hidden rounded-[1.25rem] lg:sticky lg:top-24 lg:h-[34rem] lg:self-start">
          <Image
            src="/assets/skykost.jpeg"
            alt={t("mission.storyPhotoAlt")}
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover grayscale"
          />
        </Reveal>
        <div className="flex flex-col gap-8">
          <Eyebrow>{t("page.storyEyebrow")}</Eyebrow>
          <h2 className="text-[clamp(1.75rem,3.1vw,2.6rem)] font-medium leading-[1.12] tracking-[-0.025em] text-[#141414]">
            {t("mission.storyTitle")}
          </h2>
          <p className="text-lg leading-relaxed text-[#3d3a36]">
            {t("mission.storyDescription")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {cards.map((card, i) => (
              <Reveal
                key={card.label}
                delay={i * 0.08}
                className="flex flex-col gap-6 rounded-[1.25rem] bg-white p-6"
              >
                <span className="font-mono text-[13px] text-[#6b6b6b]">
                  {`//${card.label}`}
                </span>
                <div>
                  <h3 className="text-xl font-medium tracking-tight text-[#141414]">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-[#6b6b6b]">
                    {card.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const VALUES = [
  { key: "quality", icon: "workspace_premium" },
  { key: "trust", icon: "handshake" },
  { key: "community", icon: "diversity_3" },
  { key: "innovation", icon: "autorenew" },
] as const;

export function AboutValuesSection() {
  const t = useTranslations("about");
  return (
    <section className="w-full bg-white px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-10">
        <HomeSectionHeading
          id="values-heading"
          eyebrow={t("values.subtitle")}
          titleLead={t("page.valuesLead")}
          titleAccent={t("page.valuesAccent")}
          aside={
            <p className="text-base leading-relaxed text-[#6b6b6b]">
              {t("values.description")}
            </p>
          }
        />
        <ul className="grid gap-3 sm:grid-cols-2">
          {VALUES.map((value, i) => (
            <li key={value.key}>
              <Reveal
                delay={i * 0.06}
                className="flex h-full items-start gap-5 rounded-[1.25rem] bg-[#f7f3f2] p-6 lg:p-8"
              >
                <span className="text-sm font-semibold tabular-nums text-[#6b6b6b]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <h3 className="text-2xl font-medium tracking-tight text-[#141414]">
                    {t(`values.${value.key}.title`)}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-[#6b6b6b]">
                    {t(`values.${value.key}.description`)}
                  </p>
                </div>
                <Icon
                  name={value.icon}
                  size={40}
                  className="text-[#71130d] [font-variation-settings:'wght'_200]"
                />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function AboutNumbersSection({
  kosts = [],
  isLoading = false,
}: {
  kosts?: Kost[];
  isLoading?: boolean;
}) {
  const t = useTranslations("about.page");
  const rooms = kosts.reduce((s, k) => s + k.availableRooms, 0);
  const types = kosts.reduce(
    (s, k) => s + k.roomTypes.filter((rt) => rt.totalCount > 0).length,
    0,
  );
  const prices = kosts.map((k) => k.priceRange.min).filter((p) => p > 0);
  const from = prices.length ? Math.min(...prices) : 0;
  const stats = [
    { label: t("roomsOpen"), value: String(rooms) },
    { label: t("residences"), value: String(kosts.length) },
    { label: t("roomTypes"), value: String(types) },
    {
      label: t("fromRent"),
      value: from ? formatCurrency(from, { compact: true }) : "—",
    },
  ];

  return (
    <section className="w-full px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-10">
        <HomeSectionHeading
          id="numbers-heading"
          eyebrow={t("roomsOpen")}
          titleLead={t("numbersLead")}
          titleAccent={t("numbersAccent")}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Reveal
              key={stat.label}
              delay={i * 0.06}
              className="flex min-h-[11rem] flex-col justify-between rounded-[1.25rem] bg-white p-6"
            >
              <span className="font-mono text-[13px] text-[#6b6b6b]">{`//0${i + 1}`}</span>
              <div>
                <p className="text-[clamp(2.25rem,4vw,3.25rem)] font-medium leading-none tracking-[-0.04em] text-[#141414] tabular-nums">
                  {isLoading ? (
                    <span className="inline-block h-10 w-20 animate-pulse rounded-md bg-[#efeeeb]" />
                  ) : (
                    stat.value
                  )}
                </p>
                <p className="mt-2 text-sm text-[#6b6b6b]">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
