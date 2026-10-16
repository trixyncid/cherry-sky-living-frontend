/**
 * Hero — full-bleed night-toned photo with the navbar floating over it.
 * Centre: live availability badge, headline, keyword search and suggested
 * searches built from live data (budget / residence / move-in, §5.2).
 * Sides: glass cards ("why residents stay" facts, live availability).
 * Corners: owner-managed trust note and live starting rent. All numbers
 * are computed from property data — no invented counts or logos.
 */

"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { HeroRoomFinder } from "@/components/sections/HeroRoomFinder";
import { Icon } from "@/components/shared/Icon";
import { localized, siteConfig } from "@/config/site";
import type { Kost } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";

/** Local, preloaded photo: paints immediately so it can be the LCP element. */
const HERO_PHOTO = "/assets/cherry-kost.jpeg";

const WHY_ICONS = ["wifi", "ac_unit", "shield_lock", "local_parking"] as const;

interface HeroProps {
  kosts?: Kost[];
  featured?: Kost;
  isLoading?: boolean;
}

const glass =
  "rounded-2xl border border-white/12 bg-white/[0.08] p-4 backdrop-blur-md";

export function Hero({ kosts = [], isLoading = false }: HeroProps) {
  const t = useTranslations();
  const tn = useTranslations("hero.night");
  const tTrust = useTranslations("trust");
  const locale = useLocale();

  const ready = !isLoading;
  const availableRooms = kosts.reduce((sum, k) => sum + k.availableRooms, 0);
  const prices = kosts.map((k) => k.priceRange.min).filter((p) => p > 0);
  const lowest = prices.length > 0 ? Math.min(...prices) : 0;
  const facts = (tTrust.raw("facts") as string[]).slice(0, 4);

  const whyCard = (
    <div className={glass}>
      <p className="mb-3 flex items-center gap-2 text-[15px] font-medium">
        <Icon name="verified" size={18} />
        {tn("whyTitle")}
      </p>
      <ul className="flex flex-col gap-2 text-sm text-white/80">
        {facts.map((fact, i) => (
          <li key={fact} className="flex items-center gap-2">
            <Icon
              name={WHY_ICONS[i] ?? "check"}
              size={16}
              className="text-white/60"
            />
            {fact}
          </li>
        ))}
      </ul>
    </div>
  );

  const liveCard = (
    <div className={glass}>
      <p className="mb-3 flex items-center gap-2 text-[15px] font-medium">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34d399]/70 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2 rounded-full bg-[#34d399]" />
        </span>
        {tn("liveTitle")}
      </p>
      <ul className="flex flex-col gap-2 text-sm text-white/80">
        {ready
          ? kosts.map((k) => (
              <li key={k.id} className="flex items-center gap-2">
                <Icon name="apartment" size={16} className="text-white/60" />
                {k.totalRooms > 0
                  ? tn("liveResidence", {
                      name: k.name,
                      available: k.availableRooms,
                      total: k.totalRooms,
                    })
                  : tn("liveAsk", { name: k.name })}
              </li>
            ))
          : [0, 1].map((i) => (
              <li
                key={i}
                className="h-4 w-40 animate-pulse rounded bg-white/15"
              />
            ))}
        <li className="flex items-center gap-2">
          <Icon name="schedule" size={16} className="text-white/60" />
          {tn("liveViewings", {
            days: localized(siteConfig.viewingHours.days, locale),
            time: siteConfig.viewingHours.time,
          })}
        </li>
        <li className="flex items-center gap-2">
          <Icon name="forum" size={16} className="text-white/60" />
          {tn("liveReply")}
        </li>
      </ul>
    </div>
  );

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-[#1c0b0a] text-white lg:min-h-[min(100svh,56rem)]"
    >
      <Image
        src={HERO_PHOTO}
        alt={t("common.brand.fullName")}
        fill
        priority
        loading="eager"
        sizes="100vw"
        className="object-cover object-[center_62%]"
      />
      {/* Night grade: navy tint + top/bottom shade for legible text */}
      <div className="pointer-events-none absolute inset-0 bg-[#4a100c]/45 mix-blend-multiply" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgb(28_11_10/0.92)_0%,rgb(28_11_10/0.7)_30%,rgb(28_11_10/0.25)_58%,rgb(28_11_10/0.6)_80%,rgb(28_11_10/1)_100%)]" />

      {/* Guide lines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-[22%] hidden w-px bg-white/10 lg:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-[22%] hidden w-px bg-white/10 lg:block"
      />

      <div className="relative z-10 mx-auto grid w-full max-w-[90rem] flex-1 gap-8 px-5 pb-6 pt-24 sm:px-8 lg:grid-cols-[1fr_minmax(0,51rem)_1fr] lg:gap-6 lg:pt-28">
        {/* Left column */}
        <div className="order-3 flex flex-col justify-between gap-6 lg:order-1 lg:pt-[15.5rem]">
          <div className="w-full lg:max-w-[16rem]">{whyCard}</div>
          <div className="hidden lg:block">
            <div className="flex -space-x-3">
              {kosts.slice(0, 3).map((k) =>
                k.thumbnail ? (
                  <span
                    key={k.id}
                    className="relative size-11 overflow-hidden rounded-full ring-2 ring-[#1c0b0a]"
                  >
                    <Image
                      src={k.thumbnail}
                      alt={k.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </span>
                ) : null,
              )}
            </div>
            <p className="mt-3 max-w-[15rem] text-base leading-snug">
              {tn("cornerLeft")}
            </p>
            <span aria-hidden className="mt-4 block h-px w-14 bg-white/40" />
          </div>
        </div>

        {/* Centre */}
        <div className="order-1 flex flex-col items-center text-center lg:order-2">
          <p
            aria-live="polite"
            className="inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.08] px-4 py-2 text-[15px] backdrop-blur-md"
          >
            <span className="relative flex size-2">
              {availableRooms > 0 ? (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34d399]/70 motion-reduce:animate-none" />
              ) : null}
              <span
                className={cn(
                  "relative inline-flex size-2 rounded-full",
                  availableRooms > 0 ? "bg-[#34d399]" : "bg-[#fbbf24]",
                )}
              />
            </span>
            {ready ? (
              <span>
                <span className="font-semibold">
                  {t("hero.availableNow", { count: availableRooms })}
                </span>
              </span>
            ) : (
              <span className="inline-block h-4 w-40 animate-pulse rounded bg-white/20" />
            )}
          </p>

          <h1
            id="hero-heading"
            className="mt-5 text-balance text-[clamp(2rem,3.2vw,2.9rem)] font-medium leading-[1.06] tracking-[-0.035em]"
          >
            <span className="block">{t("hero.titleLead")}</span>
            <span className="block">{t("hero.titleAccent")}</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75">
            {t("hero.subtitle")}
          </p>

          <div className="mt-6 flex w-full justify-center">
            <HeroRoomFinder kosts={kosts} />
          </div>
        </div>

        {/* Right column */}
        <div className="order-2 flex flex-col justify-between gap-6 lg:order-3 lg:items-end lg:pt-[15.5rem]">
          <div className="w-full lg:max-w-[17rem]">{liveCard}</div>
          <div className="hidden text-right lg:block">
            <p className="text-[clamp(1.9rem,2.8vw,2.5rem)] font-medium leading-none tracking-[-0.04em] tabular-nums">
              {ready && lowest > 0
                ? formatCurrency(lowest, { compact: true })
                : "—"}
            </p>
            <p className="mt-2 text-base">
              {tn("cornerRight")}
              <span className="text-white/60">{t("hero.perMonth")}</span>
            </p>
            <span
              aria-hidden
              className="ml-auto mt-4 block h-px w-14 bg-white/40"
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 flex justify-center pb-6">
        <a
          href="#properties"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-5 text-[15px] backdrop-blur-md transition-colors hover:bg-white/15"
        >
          {tn("seeRooms")}
          <Icon name="arrow_downward" size={16} />
        </a>
      </div>
    </section>
  );
}
