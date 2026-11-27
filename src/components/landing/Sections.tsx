/**
 * Landing sections that are plain content: facilities, location (Google Maps),
 * comparison table, testimonials, final CTA and the sticky mobile bar.
 */

"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { directionsUrl, PlaceMap } from "@/components/kost/PlaceMap";
import { LeadForm } from "@/components/leads/LeadForm";
import { SurveyScheduleDialog } from "@/components/sections/SurveyScheduleDialog";
import { Icon } from "@/components/shared/Icon";
import { localized, siteConfig } from "@/config/site";
import { type LandingContent, pick } from "@/lib/landing/schema";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";
import { SectionHeading } from "./SectionHeading";
import { type PropertyVM, trackWhatsApp, whatsappHref } from "./shared";

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
      className="scroll-mt-16 bg-canvas py-24 lg:py-32"
    >
      <div className="mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-12">
        <SectionHeading
          id="fasilitas-heading"
          index={3}
          eyebrow={vm.name}
          lead={t("titleLead")}
          accent={t("titleAccent")}
          aside={t("aside")}
        />
        {items.length > 0 ? (
          <ul className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((f, i) => (
              <li key={f.key} className={cn(i === 0 && "sm:col-span-2")}>
                <div className="group relative h-64 overflow-hidden rounded-md bg-panel lg:h-80">
                  {f.photo ? (
                    <Image
                      src={f.photo}
                      alt={pick(f.alt, locale)}
                      fill
                      sizes={
                        i === 0
                          ? "(min-width: 640px) 66vw, 100vw"
                          : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      }
                      className="object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-105 motion-reduce:transition-none"
                    />
                  ) : (
                    // No photo yet: a quiet hairline tile with the icon.
                    <div className="flex h-full items-center justify-center rounded-md border border-line">
                      <Icon
                        name={f.icon}
                        size={72}
                        className="text-fg-faint [font-variation-settings:'wght'_200]"
                      />
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-4">
                  <span className="pt-0.5 text-sm tabular-nums text-fg-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-base font-medium text-fg">
                      {pick(f.caption, locale)}
                    </h3>
                    {pick(f.detail, locale) ? (
                      <p className="mt-1 max-w-md text-sm leading-relaxed text-fg-muted">
                        {pick(f.detail, locale)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        {live.length > 0 ? (
          <ul className="mt-12 flex flex-wrap gap-2 border-t border-line pt-8">
            {live.map((f) => (
              <li
                key={f.id}
                className="inline-flex items-center gap-2 rounded-[0.5rem] border border-line bg-panel px-3 py-2 text-sm text-fg-2"
              >
                <Icon name={f.icon} size={16} className="text-fg-muted" />
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

export function Location({
  properties,
  landmarks,
}: {
  properties: PropertyVM[];
  landmarks: LandingContent["landmarks"];
}) {
  const t = useTranslations("landing.location");
  const locale = useLocale();
  return (
    <section
      id="lokasi"
      aria-labelledby="lokasi-heading"
      className="scroll-mt-16 bg-ink py-24 text-white lg:py-32"
    >
      <div className="mx-auto grid w-full max-w-[90rem] gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16 lg:px-12">
        <div>
          <SectionHeading
            id="lokasi-heading"
            index={4}
            dark
            eyebrow={t("eyebrow")}
            lead={t("titleLead")}
            accent={t("titleAccent")}
          />
          <ul className="mt-12 divide-y divide-white/15 border-y border-white/15">
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
                  className="flex items-center justify-between gap-4 py-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: PIN[vm.key] }}
                    />
                    <div className="min-w-0">
                      <p className="text-base font-medium">{vm.name}</p>
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
                    className="group inline-flex h-10 shrink-0 items-center gap-2 rounded-[0.5rem] border border-white/50 px-4 text-sm font-medium transition-colors hover:bg-white hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {t("openMaps")}
                    <Icon name="north_east" size={16} />
                  </a>
                </li>
              );
            })}
          </ul>
          {landmarks.length > 0 ? (
            <ul className="mt-8 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {landmarks.map((lm) => (
                <li
                  key={lm.name}
                  className="flex items-center gap-2.5 text-[15px] text-white/80"
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
        <div className="grid gap-4">
          {properties.map((vm) => (
            <figure key={vm.key} className="flex flex-col gap-2.5">
              {/* Above the map: Google's own place card covers the top-left. */}
              <figcaption className="eyebrow flex items-center gap-2 text-[11px] text-white/75">
                <span
                  className="size-2 rounded-full"
                  style={{ background: PIN[vm.key] }}
                />
                {vm.name}
              </figcaption>
              <PlaceMap
                name={vm.name}
                address={
                  [vm.kost?.location.address, vm.kost?.location.city]
                    .filter(Boolean)
                    .join(", ") || "Medan"
                }
                className="aspect-[16/9] rounded-md border-white/15"
              />
            </figure>
          ))}
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
      className="bg-canvas py-24 lg:py-32"
    >
      <div className="mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-12">
        <SectionHeading
          id="banding-heading"
          index={5}
          eyebrow={t("eyebrow")}
          lead={t("titleLead")}
          accent={t("titleAccent")}
          aside={t("aside")}
        />
        <div className="mt-14 overflow-x-auto">
          <table className="w-full min-w-[34rem] table-fixed border-collapse text-left text-[15px]">
            <thead>
              <tr>
                <th scope="col" className="w-[22%] pb-6">
                  <span className="sr-only">{t("eyebrow")}</span>
                </th>
                {properties.map((vm) => (
                  <th
                    key={vm.key}
                    scope="col"
                    className="px-3 pb-6 align-bottom font-normal"
                  >
                    <div className="relative h-36 overflow-hidden rounded-md lg:h-44">
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
                    </div>
                    <span className="mt-3 block text-base font-medium text-fg">
                      {vm.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-line">
                  <th
                    scope="row"
                    className="eyebrow py-5 pr-4 align-top text-[10px] text-fg-muted"
                  >
                    {row.label}
                  </th>
                  {properties.map((vm) => (
                    <td key={vm.key} className="px-3 py-5 align-top text-fg">
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
      className="bg-panel py-24 lg:py-32"
    >
      <div className="mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
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
              className="inline-flex h-10 items-center gap-2 rounded-[0.5rem] border border-line-strong px-4 text-sm font-medium text-fg transition-colors hover:bg-hover"
            >
              <Icon name="star" size={16} className="text-warning" />
              {t("google", {
                rating: content.googleRating.rating.toFixed(1),
                count: content.googleRating.count,
              })}
            </a>
          ) : null}
        </div>
        <ul className="mt-14 grid gap-x-8 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
          {content.testimonials.map((item) => (
            <li
              key={`${item.name}-${item.quote.id.slice(0, 24)}`}
              className="flex flex-col justify-between border-t border-line pt-6"
            >
              <blockquote className="text-lg leading-relaxed tracking-[-0.01em] text-fg">
                “{pick(item.quote, locale)}”
              </blockquote>
              <p className="mt-6 text-sm text-fg-muted">
                <span className="font-medium text-fg">{item.name}</span>
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
      className="scroll-mt-16 bg-ink py-24 text-white lg:py-32"
    >
      <div className="mx-auto grid w-full max-w-[90rem] gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:items-start lg:gap-16 lg:px-12">
        <div>
          <SectionHeading
            id="tanya-heading"
            dark
            eyebrow={t("eyebrow")}
            lead={t("titleLead")}
            accent={t("titleAccent")}
          />
          <p className="mt-7 max-w-md text-base leading-relaxed text-white/75 md:text-[17px]">
            {t("body", {
              days: localized(siteConfig.viewingHours.days, locale),
              time: siteConfig.viewingHours.time,
            })}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <SurveyScheduleDialog
              triggerLabel={t("survey")}
              className="mt-0 h-12 rounded-md bg-white px-6 py-0 text-[15px] font-medium text-ink hover:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            />
            <a
              href={whatsappHref(ctx, locale)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWhatsApp(ctx)}
              className="btn btn-outline-light"
            >
              <Icon name="whatsapp" size={18} />
              {t("whatsapp")}
            </a>
          </div>
        </div>
        <div className="rounded-md border border-white/15 p-6 sm:p-8">
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
          className="btn btn-outline-light px-3 text-sm"
        >
          <Icon name="whatsapp" size={18} />
          WhatsApp
        </a>
        <a
          href="#cari"
          tabIndex={show ? 0 : -1}
          className="btn btn-light px-3 text-sm"
        >
          <Icon name="search" size={18} />
          {t("check")}
        </a>
      </div>
    </div>
  );
}
