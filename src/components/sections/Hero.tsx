/**
 * Hero — fits one screen on desktop so every visitor sees the whole offer.
 * Left: live availability, headline, the room finder as the primary action
 * and WhatsApp as the quiet alternative. Right: a full-height photo carrying
 * the proof — live per-residence availability and three real numbers.
 * Every number comes from property data — no invented counts or logos.
 */

"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { HeroRoomFinder } from "@/components/sections/HeroRoomFinder";
import { Icon } from "@/components/shared/Icon";
import { localized, siteConfig } from "@/config/site";
import { Link } from "@/i18n/routing";
import { track } from "@/lib/analytics";
import type { Kost } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatCurrency, generateWhatsAppURL } from "@/lib/utils/format";

/** Local, preloaded photo: paints immediately so it can be the LCP element. */
const HERO_PHOTO = "/assets/cherry-kost.jpeg";

interface HeroProps {
  kosts?: Kost[];
  featured?: Kost;
  isLoading?: boolean;
}

function LiveDot({ on }: { on: boolean }) {
  return (
    <span className="relative flex size-2 shrink-0">
      {on ? (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-bright/70 motion-reduce:animate-none" />
      ) : null}
      <span
        className={cn(
          "relative inline-flex size-2 rounded-full",
          on ? "bg-success-bright" : "bg-warning",
        )}
      />
    </span>
  );
}

export function Hero({ kosts = [], isLoading = false }: HeroProps) {
  const t = useTranslations();
  const tn = useTranslations("hero.night");
  const tTrust = useTranslations("trust");
  const tWhatsapp = useTranslations("whatsapp");
  const locale = useLocale();

  const ready = !isLoading;
  const availableRooms = kosts.reduce((sum, k) => sum + k.availableRooms, 0);
  const totalRooms = kosts.reduce((sum, k) => sum + k.totalRooms, 0);
  const prices = kosts.map((k) => k.priceRange.min).filter((p) => p > 0);
  const lowest = prices.length > 0 ? Math.min(...prices) : 0;
  const whatsappUrl = generateWhatsAppURL(
    siteConfig.whatsappNumber,
    tWhatsapp("generalInquiry"),
  );
  const viewingHours = tn("liveViewings", {
    days: localized(siteConfig.viewingHours.days, locale),
    time: siteConfig.viewingHours.time,
  });

  const proof = [
    {
      value:
        ready && lowest > 0 ? formatCurrency(lowest, { compact: true }) : "—",
      label: t("hero.statPrice"),
    },
    {
      value: ready && totalRooms > 0 ? `${availableRooms}/${totalRooms}` : "—",
      label: t("hero.statRooms"),
    },
    {
      value: ready ? String(kosts.length) : "—",
      label: t("hero.statResidences"),
    },
  ];

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-ink text-white"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-48 -top-40 size-[40rem] rounded-full bg-brand/30 blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-56 left-1/3 size-[30rem] rounded-full bg-brand/15 blur-[140px]"
      />

      {/* Desktop: exactly one screen (nav floats on top), within sane bounds. */}
      <div className="relative mx-auto grid w-full max-w-[90rem] gap-8 px-5 pb-8 pt-24 sm:px-8 lg:h-[100svh] lg:max-h-[62rem] lg:min-h-[40rem] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12 lg:pb-8">
        {/* ——— Message + primary action ——— */}
        <div className="flex flex-col justify-center">
          <p
            aria-live="polite"
            className="inline-flex w-fit items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm"
          >
            <LiveDot on={availableRooms > 0} />
            {ready ? (
              <span className="font-medium">
                {t("hero.availableNow", { count: availableRooms })}
              </span>
            ) : (
              <span className="inline-block h-4 w-40 animate-pulse rounded bg-white/20" />
            )}
          </p>

          <h1
            id="hero-heading"
            className="mt-5 text-balance text-[clamp(2.2rem,4.2vw,3.7rem)] font-semibold leading-[1.03] tracking-[-0.04em]"
          >
            {t("hero.titleLead")}{" "}
            <span className="text-brand-bright">{t("hero.titleAccent")}</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70 lg:text-[17px]">
            {t("hero.subtitle")}
          </p>

          <div className="mt-7">
            <HeroRoomFinder kosts={kosts} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-sm text-white/60">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("click_whatsapp", { location: "hero" })}
              className="inline-flex items-center gap-2 font-semibold text-white underline-offset-4 hover:underline"
            >
              <Icon name="whatsapp" size={18} className="text-[#25d366]" />
              {t("hero.chatWhatsApp")}
            </a>
            <span className="flex items-center gap-1.5">
              <Icon name="forum" size={16} />
              {tn("liveReply")}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="schedule" size={16} />
              {viewingHours}
            </span>
          </div>
        </div>

        {/* ——— Photo + proof ——— */}
        <div className="flex min-h-0 flex-col gap-3">
          <div className="relative aspect-[4/3] min-h-0 overflow-hidden rounded-[2rem] ring-1 ring-white/10 lg:aspect-auto lg:flex-1">
            <Image
              src={HERO_PHOTO}
              alt={t("common.brand.fullName")}
              fill
              priority
              loading="eager"
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover object-[center_60%]"
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(11_11_13/0.85),transparent_40%)]" />

            <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-ink shadow-sm">
              <Icon name="verified_user" size={15} className="text-brand" />
              {tTrust("ownerSub")}
            </span>

            <dl className="absolute inset-x-0 bottom-0 grid grid-cols-3 divide-x divide-white/15 px-2 pb-5">
              {proof.map((item) => (
                <div key={item.label} className="px-3 sm:px-5">
                  <dt className="text-[11px] leading-snug text-white/65 sm:text-xs">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-[clamp(1.15rem,2vw,1.6rem)] font-semibold tracking-tight tabular-nums">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Live availability per residence */}
          <ul className="grid gap-2 sm:grid-cols-2">
            {ready
              ? kosts.map((k) => (
                  <li key={k.id}>
                    <Link
                      href={`/kosts/${k.id}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm transition-colors hover:border-white/25 hover:bg-white/10"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <LiveDot on={k.availableRooms > 0} />
                        <span className="truncate font-medium">{k.name}</span>
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-xs font-semibold",
                          k.availableRooms > 0
                            ? "text-success-bright"
                            : "text-brand-bright",
                        )}
                      >
                        {k.totalRooms > 0 && k.availableRooms > 0
                          ? t("hero.roomsOfTotal", {
                              available: k.availableRooms,
                              total: k.totalRooms,
                            })
                          : tn("waitlistOpen")}
                      </span>
                    </Link>
                  </li>
                ))
              : [0, 1].map((i) => (
                  <li
                    key={i}
                    className="h-12 animate-pulse rounded-2xl bg-white/[0.06]"
                  />
                ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
