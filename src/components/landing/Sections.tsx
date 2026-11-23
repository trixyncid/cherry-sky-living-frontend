/**
 * Landing sections that are plain content: facilities, location (3D map),
 * comparison table, testimonials, final CTA and the sticky mobile bar.
 * Everything renders as real HTML first; the map canvas is an enhancement.
 */

"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { directionsUrl } from "@/components/kost/PlaceMap";
import { LeadForm } from "@/components/leads/LeadForm";
import { SurveyScheduleDialog } from "@/components/sections/SurveyScheduleDialog";
import { Icon } from "@/components/shared/Icon";
import { localized, siteConfig } from "@/config/site";
import { type LandingContent, pick } from "@/lib/landing/schema";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";
import type { MapProperty } from "./MapCanvas";
import { SectionHeading } from "./SectionHeading";
import {
  type DeviceTier,
  type PropertyVM,
  trackWhatsApp,
  whatsappHref,
} from "./shared";

const MapCanvas = dynamic(() => import("./MapCanvas"), { ssr: false });

const PIN = { cherry: "#d2415f", sky: "#4aa3d8" } as const;

// ——— Facilities (bento) ———

export function Facilities({ vm }: { vm: PropertyVM }) {
  const t = useTranslations("landing.facilities");
  const locale = useLocale();
  const items = vm.content.facilities;
  const live = vm.kost?.facilities ?? [];
  if (items.length === 0 && live.length === 0) return null;

  return (
    <section
      id="fasilitas"
      aria-labelledby="fasilitas-heading"
      className="scroll-mt-16 bg-canvas px-5 pb-16 sm:px-8 lg:pb-24"
    >
      <div className="mx-auto w-full max-w-[90rem] rounded-[2.5rem] bg-white p-6 sm:p-10 lg:p-14">
        <SectionHeading
          id="fasilitas-heading"
          index={3}
          eyebrow={vm.name}
          lead={t("titleLead")}
          accent={t("titleAccent")}
          aside={t("aside")}
        />
        {items.length > 0 ? (
          <ul className="mt-10 grid gap-4 md:grid-cols-3 md:grid-rows-2">
            {items.map((f, i) => (
              <li
                key={f.key}
                className={cn(
                  "group relative flex min-h-[15rem] flex-col justify-end overflow-hidden rounded-[1.75rem] p-6",
                  i === 0 ? "md:col-span-2 md:row-span-2 md:min-h-[32rem]" : "",
                  f.photo ? "text-white" : "bg-[var(--lp-tint)] text-fg",
                )}
              >
                {f.photo ? (
                  <>
                    <Image
                      src={f.photo}
                      alt={pick(f.alt, locale)}
                      fill
                      sizes={
                        i === 0
                          ? "(min-width: 768px) 66vw, 100vw"
                          : "(min-width: 768px) 33vw, 100vw"
                      }
                      className="object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgb(11_11_13/0.85),transparent_60%)]" />
                  </>
                ) : (
                  <>
                    {/* No photo yet: a soft tinted tile with an oversized icon. */}
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-[radial-gradient(90%_70%_at_85%_10%,var(--lp-accent-soft),transparent_65%)] opacity-60"
                    />
                    <Icon
                      name={f.icon}
                      size={i === 0 ? 220 : 120}
                      className="absolute -right-4 -top-2 text-[var(--lp-accent)] opacity-15 [font-variation-settings:'wght'_200] transition-transform duration-700 group-hover:-rotate-6 group-hover:scale-105"
                    />
                  </>
                )}
                <div className="relative">
                  <span
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full",
                      f.photo
                        ? "bg-white/15 backdrop-blur-md"
                        : "bg-white text-[var(--lp-accent)] shadow-sm",
                    )}
                  >
                    <Icon name={f.icon} size={22} />
                  </span>
                  <h3
                    className={cn(
                      "mt-4 font-semibold tracking-tight",
                      i === 0
                        ? "text-[clamp(1.5rem,2.4vw,2.2rem)] leading-tight"
                        : "text-xl",
                    )}
                  >
                    {pick(f.caption, locale)}
                  </h3>
                  {pick(f.detail, locale) ? (
                    <p
                      className={cn(
                        "mt-2",
                        f.photo ? "text-white/80" : "text-fg-2",
                      )}
                    >
                      {pick(f.detail, locale)}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        {live.length > 0 ? (
          <ul className="mt-6 flex flex-wrap gap-2">
            {live.map((f) => (
              <li
                key={f.id}
                className="inline-flex items-center gap-2 rounded-full bg-canvas px-4 py-2.5 text-sm font-medium text-fg-2"
              >
                <Icon
                  name={f.icon}
                  size={16}
                  className="text-[var(--lp-accent)]"
                />
                {locale === "en" ? (f.nameEn ?? f.name) : f.name}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

// ——— Location ———

function geoOf(vm: PropertyVM) {
  return (
    vm.content.geo ??
    (vm.kost?.location.coordinates
      ? {
          lat: vm.kost.location.coordinates.lat,
          lng: vm.kost.location.coordinates.lng,
        }
      : undefined)
  );
}

export function Location({
  properties,
  landmarks,
  tier,
}: {
  properties: PropertyVM[];
  landmarks: LandingContent["landmarks"];
  tier: DeviceTier | null;
}) {
  const t = useTranslations("landing.location");
  const locale = useLocale();
  const wrap = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e?.isIntersecting && setNear(true),
      { rootMargin: "60% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const mapProperties = useMemo<MapProperty[]>(
    () =>
      properties.map((vm) => ({
        key: vm.key,
        name: vm.name,
        color: PIN[vm.key],
        geo: geoOf(vm),
      })),
    [properties],
  );
  const [mapReady, setMapReady] = useState(false);
  const onMapReady = useCallback(() => setMapReady(true), []);

  return (
    <section
      id="lokasi"
      aria-labelledby="lokasi-heading"
      className="scroll-mt-16 bg-ink px-5 py-14 text-white sm:px-8 lg:py-20"
    >
      <div className="mx-auto grid w-full max-w-[90rem] gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
        <div>
          <SectionHeading
            id="lokasi-heading"
            index={4}
            dark
            eyebrow={t("eyebrow")}
            lead={t("titleLead")}
            accent={t("titleAccent")}
          />
          <ul className="mt-7 grid gap-3">
            {properties.map((vm) => {
              const address = [
                vm.kost?.location.address,
                vm.kost?.location.city,
              ]
                .filter(Boolean)
                .join(", ");
              return (
                <li
                  key={vm.key}
                  className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-white/12 bg-white/[0.06] p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ background: PIN[vm.key] }}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold">{vm.name}</p>
                      <p className="truncate text-sm text-white/60">
                        {address || pick(vm.content.area, locale)}
                      </p>
                    </div>
                  </div>
                  <a
                    href={
                      vm.content.mapsUrl ||
                      directionsUrl(vm.name, address || "Medan")
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 px-3.5 py-2 text-sm font-semibold hover:bg-white hover:text-ink"
                  >
                    <Icon name="map" size={16} />
                    {t("openMaps")}
                  </a>
                </li>
              );
            })}
          </ul>
          {landmarks.length > 0 ? (
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {landmarks.map((lm) => (
                <li
                  key={lm.name}
                  className="flex items-center gap-2.5 text-[15px] text-white/85"
                >
                  <Icon
                    name="near_me"
                    size={16}
                    className="text-brand-bright"
                  />
                  <span>
                    <span className="font-medium">{lm.name}</span>
                    {pick(lm.travel, locale) ? (
                      <span className="text-white/60">
                        {" "}
                        · {pick(lm.travel, locale)}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div
          ref={wrap}
          className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-[#0b0c12]"
          aria-hidden
        >
          {/* Still render of the same scene: shown while the model loads, and
              instead of it on devices that skip 3D. */}
          <Image
            src="/media/map/poster.webp"
            alt=""
            fill
            sizes="(min-width: 1024px) 55vw, 100vw"
            className={cn(
              "object-cover transition-opacity duration-700",
              mapReady ? "opacity-0" : "opacity-100",
            )}
          />
          {near && tier !== "static" ? (
            <MapCanvas
              properties={mapProperties}
              landmarks={landmarks}
              onReady={onMapReady}
            />
          ) : null}
          <p className="absolute bottom-3 left-4 rounded-full bg-black/35 px-2.5 py-1 text-xs text-white/60 backdrop-blur-sm">
            {t("schematic")}
          </p>
        </div>
      </div>
    </section>
  );
}

// ——— Comparison ———

export function Comparison({
  properties,
  landmarks,
}: {
  properties: PropertyVM[];
  landmarks: LandingContent["landmarks"];
}) {
  const t = useTranslations("landing.compare");
  const tChoose = useTranslations("landing.choose");
  const locale = useLocale();
  if (properties.length < 2) return null;

  const rows: { label: string; cell: (vm: PropertyVM) => string }[] = [
    {
      label: t("price"),
      cell: (vm) => {
        const { min = 0, max = 0 } = vm.kost?.priceRange ?? {};
        return min > 0
          ? `${formatCurrency(min, { compact: true })}${max > min ? ` – ${formatCurrency(max, { compact: true })}` : ""}`
          : "—";
      },
    },
    {
      label: t("roomTypes"),
      cell: (vm) =>
        vm.kost?.roomTypes
          .filter((r) => r.totalCount > 0)
          .map((r) => r.name)
          .join(", ") || "—",
    },
    {
      label: t("available"),
      cell: (vm) =>
        vm.kost ? tChoose("rooms", { count: vm.kost.availableRooms }) : "—",
    },
    {
      label: t("deposit"),
      cell: (vm) =>
        vm.kost?.deposit ? formatCurrency(vm.kost.deposit) : t("askUs"),
    },
    {
      label: t("facilities"),
      cell: (vm) =>
        vm.kost?.facilities
          .slice(0, 6)
          .map((f) => (locale === "en" ? (f.nameEn ?? f.name) : f.name))
          .join(", ") || "—",
    },
  ];
  if (properties.some((p) => p.content.gender))
    rows.push({
      label: t("gender"),
      cell: (vm) =>
        vm.content.gender ? tChoose(`gender.${vm.content.gender}`) : "—",
    });
  if (properties.some((p) => p.content.rules.length > 0))
    rows.push({
      label: t("rules"),
      cell: (vm) =>
        vm.content.rules.map((r) => pick(r, locale)).join(" · ") || "—",
    });
  if (landmarks.some((l) => l.nearest))
    rows.push({
      label: t("nearby"),
      cell: (vm) =>
        landmarks
          .filter((l) => l.nearest === vm.key)
          .map(
            (l) =>
              `${l.name}${pick(l.travel, locale) ? ` (${pick(l.travel, locale)})` : ""}`,
          )
          .join(", ") || "—",
    });

  return (
    <section
      aria-labelledby="banding-heading"
      className="relative z-10 -mt-10 rounded-t-[2.5rem] bg-canvas px-5 py-16 sm:px-8 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[90rem]">
        <SectionHeading
          id="banding-heading"
          index={5}
          eyebrow={t("eyebrow")}
          lead={t("titleLead")}
          accent={t("titleAccent")}
          aside={t("aside")}
        />
        <div className="mt-10 overflow-x-auto rounded-[2rem] bg-white p-2 shadow-[0_30px_60px_-45px_rgb(11_11_13/0.4)]">
          <table className="w-full min-w-[34rem] table-fixed border-separate border-spacing-0 text-left text-[15px]">
            <thead>
              <tr>
                <th scope="col" className="w-[22%] p-4">
                  <span className="sr-only">{t("eyebrow")}</span>
                </th>
                {properties.map((vm) => (
                  <th key={vm.key} scope="col" className="p-2 align-bottom">
                    <div className="relative h-36 overflow-hidden rounded-[1.5rem]">
                      <Image
                        src={vm.content.exteriorPhoto}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 35vw, 16rem"
                        className="object-cover"
                        style={{
                          objectPosition: `${vm.content.exteriorFocal.x * 100}% ${vm.content.exteriorFocal.y * 100}%`,
                        }}
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgb(11_11_13/0.8),transparent_70%)]" />
                      <span className="absolute bottom-3 left-4 font-display text-3xl font-normal text-white">
                        {vm.name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.label}>
                  <th
                    scope="row"
                    className={cn(
                      "p-4 align-top text-sm font-medium text-fg-muted",
                      i % 2 === 0 && "rounded-l-2xl bg-canvas/70",
                    )}
                  >
                    {row.label}
                  </th>
                  {properties.map((vm, col) => (
                    <td
                      key={vm.key}
                      className={cn(
                        "p-4 align-top font-medium text-fg",
                        i % 2 === 0 && "bg-canvas/70",
                        i % 2 === 0 &&
                          col === properties.length - 1 &&
                          "rounded-r-2xl",
                      )}
                    >
                      {row.cell(vm)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ——— Testimonials (hidden until the admin has real ones) ———

export function Testimonials({
  content,
  properties,
}: {
  content: LandingContent;
  properties: PropertyVM[];
}) {
  const t = useTranslations("landing.testimonials");
  const locale = useLocale();
  if (content.testimonials.length === 0) return null;
  return (
    <section
      aria-labelledby="testi-heading"
      className="bg-white px-5 py-14 sm:px-8 lg:py-20"
    >
      <div className="mx-auto w-full max-w-[90rem]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionHeading
              id="testi-heading"
              index={6}
              eyebrow={t("eyebrow")}
              lead={t("titleLead")}
              accent={t("titleAccent")}
            />
          </div>
          {content.googleRating ? (
            <a
              href={content.googleRating.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-fg hover:bg-hover"
            >
              <Icon name="star" size={16} className="text-warning" />
              {t("google", {
                rating: content.googleRating.rating.toFixed(1),
                count: content.googleRating.count,
              })}
            </a>
          ) : null}
        </div>
        <ul className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {content.testimonials.map((item) => (
            <li
              key={`${item.name}-${item.quote.id.slice(0, 24)}`}
              className="flex flex-col justify-between rounded-[1.5rem] bg-canvas p-6"
            >
              <blockquote className="text-lg leading-relaxed text-fg">
                “{pick(item.quote, locale)}”
              </blockquote>
              <p className="mt-5 text-sm text-fg-muted">
                <span className="font-semibold text-fg">{item.name}</span>
                {item.role ? ` · ${item.role}` : ""}
                {item.property
                  ? ` · ${properties.find((p) => p.key === item.property)?.name ?? ""}`
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ——— Final CTA ———

export function FinalCta({
  properties,
  selected,
}: {
  properties: PropertyVM[];
  selected?: PropertyVM;
}) {
  const t = useTranslations("landing.final");
  const locale = useLocale();
  const ctx = { property: selected, section: "final_cta" };
  return (
    <section
      id="tanya"
      aria-labelledby="tanya-heading"
      className="relative z-10 -mt-10 scroll-mt-16 rounded-t-[2.5rem] bg-ink px-5 py-16 text-white sm:px-8 lg:py-24"
    >
      <div className="mx-auto grid w-full max-w-[90rem] gap-10 lg:grid-cols-2 lg:items-start">
        <div>
          <SectionHeading
            id="tanya-heading"
            dark
            eyebrow={t("eyebrow")}
            lead={t("titleLead")}
            accent={t("titleAccent")}
          />
          <p className="mt-5 max-w-md text-lg text-white/75">
            {t("body", {
              days: localized(siteConfig.viewingHours.days, locale),
              time: siteConfig.viewingHours.time,
            })}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={whatsappHref(ctx, locale)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWhatsApp(ctx)}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#25d366] px-6 text-[15px] font-semibold text-ink hover:brightness-95"
            >
              <Icon name="whatsapp" size={18} />
              {t("whatsapp")}
            </a>
            <SurveyScheduleDialog
              triggerLabel={t("survey")}
              className="mt-0 h-12 rounded-full border border-white/25 bg-transparent px-6 text-[15px] font-semibold text-white hover:bg-white hover:text-ink"
            />
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-white/12 bg-white/[0.06] p-6">
          <LeadForm
            type="inquiry"
            tone="dark"
            kosts={properties.flatMap((p) => (p.kost ? [p.kost] : []))}
            propertyId={selected?.kost?.id}
          />
        </div>
      </div>
    </section>
  );
}

// ——— Sticky mobile bar ———

export function StickyBar({ selected }: { selected?: PropertyVM }) {
  const t = useTranslations("landing.sticky");
  const locale = useLocale();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const ctx = { property: selected, section: "sticky_bar" };
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/90 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md transition-transform duration-300 lg:hidden",
        show ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="mx-auto grid max-w-lg grid-cols-2 gap-2">
        <a
          href={whatsappHref(ctx, locale)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackWhatsApp(ctx)}
          tabIndex={show ? 0 : -1}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25d366] text-[15px] font-semibold text-ink"
        >
          <Icon name="whatsapp" size={18} />
          WhatsApp
        </a>
        <a
          href="#cari"
          tabIndex={show ? 0 : -1}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-ink"
        >
          <Icon name="search" size={18} />
          {t("check")}
        </a>
      </div>
    </div>
  );
}
