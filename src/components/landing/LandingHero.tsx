/**
 * Hero — a centred, editorial opening: live availability pill, headline,
 * the two calls to action, then a glass search dock and a row of live
 * numbers. Everything is server-rendered HTML that works before any 3D
 * loads; the shader sky fades in behind once the page is idle.
 */

"use client";

import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
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

const SkyCanvas = dynamic(() => import("./SkyCanvas"), { ssr: false });

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
  const locale = useLocale();
  const [sky, setSky] = useState<"off" | "loading" | "ready">("off");

  useEffect(() => {
    if (tier === null || tier === "static") return;
    const start = () => setSky((s) => (s === "off" ? "loading" : s));
    const idle = window.requestIdleCallback?.(start, { timeout: 1500 });
    const timer =
      idle === undefined ? window.setTimeout(start, 500) : undefined;
    return () => {
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [tier]);

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
    <section
      id="cari"
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-ink text-white"
    >
      <div aria-hidden className="story-sky-fallback absolute inset-0" />
      {sky !== "off" ? (
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            sky === "ready" ? "opacity-100" : "opacity-0",
          )}
        >
          <SkyCanvas onReady={() => setSky("ready")} />
        </div>
      ) : null}
      {/* Deepens the sky to late dusk so white type and the glass dock sit
          on a dark, even field; a little warmth is left low on the horizon. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgb(11_11_13/0.82)_0%,rgb(24_10_20/0.66)_45%,rgb(40_14_26/0.5)_78%,rgb(11_11_13/0.7)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_30%,transparent_30%,rgb(11_11_13/0.55)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent"
      />

      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[80rem] flex-col items-center justify-center px-5 pb-10 pt-28 text-center sm:px-8">
        <p
          aria-live="polite"
          className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-md"
        >
          <span className="relative flex size-2">
            {available > 0 ? (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-bright/70 motion-reduce:animate-none" />
            ) : null}
            <span
              className={cn(
                "relative inline-flex size-2 rounded-full",
                available > 0 ? "bg-success-bright" : "bg-warning",
              )}
            />
          </span>
          {loading ? (
            <span className="inline-block h-4 w-56 animate-pulse rounded bg-white/25" />
          ) : (
            <span className="font-medium">
              {t("count", { count: available, names })}
            </span>
          )}
        </p>

        <h1
          id="hero-heading"
          className="mt-7 max-w-5xl text-balance text-[clamp(2.75rem,7.2vw,6.5rem)] font-semibold leading-[0.98] tracking-[-0.045em]"
        >
          {pick(content.hero?.headline, locale)}{" "}
          <span className="font-display font-normal italic tracking-[-0.015em] text-brand-line">
            {pick(content.hero?.accent, locale)}
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-white/85">
          {pick(content.hero?.subtitle, locale)}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={whatsappHref(ctx, locale)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsApp(ctx)}
            className="inline-flex h-13 items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-ink shadow-[0_18px_40px_-20px_rgb(255_255_255/0.6)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <Icon name="whatsapp" size={18} />
            {t("whatsapp")}
          </a>
          <a
            href="#pilih"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3.5 text-[15px] font-semibold backdrop-blur-md transition-colors hover:bg-white hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {t("explore")}
            <Icon name="arrow_downward" size={18} />
          </a>
        </div>

        <div className="mt-12 w-full">
          <SearchBar
            properties={properties}
            filters={filters}
            update={update}
            onSubmit={onSearch}
          />
        </div>

        <dl className="mt-8 grid w-full max-w-3xl grid-cols-2 gap-y-5 sm:grid-cols-4 sm:divide-x sm:divide-white/15">
          {stats.map((s) => (
            <div key={s.label} className="px-4">
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
  );
}
