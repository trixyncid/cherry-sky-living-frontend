/**
 * Hero — full-bleed property photography that cycles between slides, a
 * left-aligned editorial headline, a numbered slide index on the right and
 * a row of thumbnails along the bottom. The availability search and live
 * numbers sit in a dark band directly underneath (#cari).
 */

"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { localized, siteConfig } from "@/config/site";
import { type LandingContent, pick } from "@/lib/landing/schema";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";
import { SearchBar } from "./AvailabilitySearch";
import type { SearchFilters } from "./search";
import {
  type DeviceTier,
  type PropertyVM,
  trackWhatsApp,
  whatsappHref,
} from "./shared";

const SLIDE_MS = 7000;

interface Slide {
  photo: string;
  focal: { x: number; y: number };
  title: string;
  label: string;
}

/** Each property's exterior, then the first property's hero room (max 3). */
function buildSlides(properties: PropertyVM[], locale: string): Slide[] {
  const slides: Slide[] = properties.map((p) => ({
    photo: p.content.exteriorPhoto,
    focal: p.content.exteriorFocal,
    title: p.name,
    label: pick(p.content.area, locale),
  }));
  const first = properties[0];
  const room = first?.content.media.clips["journey-3-room"];
  if (first && room?.posterDesktop)
    slides.push({
      photo: room.posterDesktop,
      focal: room.focal,
      title: first.content.heroRoom ?? first.name,
      label: first.name,
    });
  return slides.slice(0, 3);
}

export function LandingHero({
  content,
  properties,
  loading,
  tier,
  filters,
  update,
  onSearch,
}: {
  content: LandingContent;
  properties: PropertyVM[];
  loading: boolean;
  tier: DeviceTier | null;
  filters: SearchFilters;
  update: (patch: Partial<SearchFilters>) => void;
  onSearch: () => void;
}) {
  const t = useTranslations("landing.hero");
  const tc = useTranslations("common.brand");
  const locale = useLocale();
  const slides = useMemo(
    () => buildSlides(properties, locale),
    [properties, locale],
  );
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Auto-advance; off for reduced motion / low-end devices and while hovered.
  // `active` restarts the timer after a manual pick.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see above
  useEffect(() => {
    if (paused || tier === null || tier === "static" || slides.length < 2)
      return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(
      () => setActive((i) => (i + 1) % slides.length),
      SLIDE_MS,
    );
    return () => window.clearTimeout(id);
  }, [active, paused, tier, slides.length]);

  const available = properties.reduce(
    (s, p) => s + (p.kost?.availableRooms ?? 0),
    0,
  );
  const names = properties.map((p) => p.name).join(" & ");
  const prices = properties
    .map((p) => p.kost?.priceRange.min ?? 0)
    .filter((p) => p > 0);
  const roomTypes = properties.reduce(
    (s, p) =>
      s + (p.kost?.roomTypes.filter((r) => r.totalCount > 0).length ?? 0),
    0,
  );
  const ctx = { section: "hero" };

  const stats = [
    {
      value:
        prices.length > 0
          ? formatCurrency(Math.min(...prices), { compact: true })
          : "—",
      label: t("statPrice"),
    },
    { value: loading ? "—" : String(available), label: t("statRooms") },
    { value: loading ? "—" : String(roomTypes), label: t("statTypes") },
    {
      value: siteConfig.viewingHours.time.replace(" WIB", ""),
      label: t("statHours", {
        days: localized(siteConfig.viewingHours.days, locale),
      }),
    },
  ];

  return (
    <>
      <section
        aria-labelledby="hero-heading"
        className="relative isolate overflow-hidden bg-ink text-white"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          aria-hidden
          className="story-sky-fallback absolute inset-0 -z-20"
        />
        {slides.map((s, i) => (
          <Image
            key={s.photo}
            src={s.photo}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            className={cn(
              "-z-10 object-cover transition-opacity duration-[1400ms] ease-out motion-reduce:transition-none",
              i === active ? "opacity-100" : "opacity-0",
            )}
            style={{
              objectPosition: `${s.focal.x * 100}% ${s.focal.y * 100}%`,
            }}
          />
        ))}
        {/* Dusk grade: navy from the left for the type, darker at the foot
            for the thumbnails; the photo stays readable on the right. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(22_16_38/0.85)_0%,rgb(22_16_38/0.55)_42%,rgb(42_31_69/0.15)_75%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgb(22_16_38/0.55)_0%,transparent_22%,transparent_60%,rgb(22_16_38/0.9)_100%)]"
        />

        <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[90rem] flex-col px-5 pb-8 pt-32 sm:px-8 lg:px-12 lg:pt-40">
          <div className="max-w-[56rem]">
            <p className="flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.32em] text-white/80">
              <span aria-hidden className="h-px w-12 bg-white/60" />
              {tc("fullName")}
            </p>
            <p
              aria-live="polite"
              className="mt-4 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.32em] text-white/80"
            >
              <span
                aria-hidden
                className={cn(
                  "size-2 rounded-full",
                  available > 0 ? "bg-success-bright" : "bg-warning",
                )}
              />
              {loading ? (
                <span className="inline-block h-3 w-56 animate-pulse rounded bg-white/25" />
              ) : (
                t("count", { count: available, names })
              )}
            </p>

            <h1
              id="hero-heading"
              className="mt-7 text-[clamp(2.75rem,6.2vw,5.5rem)] font-semibold leading-[0.98] tracking-[-0.045em]"
            >
              <span className="block text-balance">
                {pick(content.hero?.headline, locale)}
              </span>
              <span className="block text-balance font-normal text-white/60">
                {pick(content.hero?.accent, locale)}
              </span>
            </h1>
            <p className="mt-7 max-w-md text-pretty text-base leading-relaxed text-white/85 md:text-[17px]">
              {pick(content.hero?.subtitle, locale)}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <a
                href="#pilih"
                className="group inline-flex h-13 items-center gap-3 rounded-xl border border-white/70 px-7 text-[15px] font-medium transition-colors hover:bg-white hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {t("explore")}
                <Icon
                  name="north_east"
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
                />
              </a>
              <a
                href={whatsappHref(ctx, locale)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsApp(ctx)}
                className="inline-flex items-center gap-2 text-[15px] font-medium text-white/80 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Icon name="whatsapp" size={17} />
                {t("whatsapp")}
              </a>
            </div>
          </div>

          {/* Slide index — desktop only, like a page counter. */}
          {slides.length > 1 ? (
            <div className="absolute right-8 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex xl:right-12">
              {slides.map((s, i) => (
                <button
                  key={s.photo}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={t("slide", { n: i + 1, title: s.title })}
                  aria-current={i === active}
                  className={cn(
                    "flex flex-col items-center gap-3 text-xs font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                    i === active
                      ? "text-white"
                      : "text-white/50 hover:text-white",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                  {i === active ? (
                    <span aria-hidden className="h-9 w-px bg-white/80" />
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-auto flex items-end gap-8 pt-14">
            <ul className="flex gap-4 overflow-x-auto sm:gap-6">
              {slides.map((s, i) => (
                <li key={s.photo} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={t("slide", { n: i + 1, title: s.title })}
                    aria-current={i === active}
                    className="group block text-left focus-visible:outline-none"
                  >
                    <span
                      className={cn(
                        "relative block h-16 w-28 overflow-hidden rounded-md ring-1 transition sm:h-20 sm:w-36",
                        i === active
                          ? "ring-white"
                          : "opacity-75 ring-white/10 group-hover:opacity-100 group-focus-visible:ring-white",
                      )}
                    >
                      <Image
                        src={s.photo}
                        alt=""
                        fill
                        sizes="144px"
                        className="object-cover"
                      />
                    </span>
                    <span className="mt-3 block text-sm font-medium">
                      {s.title}
                    </span>
                    <span className="mt-1 block text-[10px] uppercase tracking-[0.24em] text-white/60">
                      {s.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <span
              aria-hidden
              className="mb-12 hidden h-px flex-1 bg-white/25 md:block"
            />
            <a
              href="#cari"
              className="group mb-7 hidden shrink-0 items-center gap-4 text-sm font-medium md:inline-flex"
            >
              {t("scroll")}
              <span className="flex size-11 items-center justify-center rounded-full border border-white/60 transition-colors group-hover:bg-white group-hover:text-ink">
                <Icon name="arrow_downward" size={18} />
              </span>
            </a>
          </div>
        </div>
      </section>

      <section
        id="cari"
        aria-label={t("searchLabel")}
        className="relative scroll-mt-16 border-t border-white/10 bg-ink text-white"
      >
        <div className="mx-auto w-full max-w-[90rem] px-5 py-10 sm:px-8 lg:px-12 lg:py-12">
          <SearchBar
            properties={properties}
            filters={filters}
            update={update}
            onSubmit={onSearch}
          />
          <dl className="mt-8 grid grid-cols-2 gap-y-5 sm:grid-cols-4 sm:divide-x sm:divide-white/15">
            {stats.map((s) => (
              <div key={s.label} className="px-4 first:pl-0">
                <dd className="whitespace-nowrap text-[clamp(1.25rem,2vw,1.7rem)] font-semibold tracking-tight tabular-nums">
                  {s.value}
                </dd>
                <dt className="mt-1 text-xs leading-snug text-white/65">
                  {s.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
