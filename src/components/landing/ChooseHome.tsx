/**
 * Choose your home — one card per property. A card plays the property's
 * boomerang loop while on screen, or shows its exterior photo with a slow
 * push-in when there is no clip. Picking a card starts that journey.
 */

"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/shared/Icon";
import { pick } from "@/lib/landing/schema";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";
import { SectionHeading } from "./SectionHeading";
import type { DeviceTier, PropertyVM } from "./shared";

function Card({
  vm,
  tier,
  selected,
  onSelect,
}: {
  vm: PropertyVM;
  tier: DeviceTier | null;
  selected: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations("landing.choose");
  const locale = useLocale();
  const video = useRef<HTMLVideoElement>(null);
  const loop =
    tier && tier !== "static" ? vm.content.media.choiceLoop : undefined;

  // Play only while visible; the file is not requested before that.
  useEffect(() => {
    const v = video.current;
    if (!v || !loop) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        if (!v.src) v.src = loop;
        v.play().catch(() => {});
      } else v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
  }, [loop]);

  const k = vm.kost;
  const min = k?.priceRange.min ?? 0;
  const max = k?.priceRange.max ?? 0;
  const open = k?.availableRooms ?? 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      data-property={vm.key}
      className={cn(
        "lp-theme group relative flex min-h-[26rem] w-full flex-col justify-end overflow-hidden rounded-[2rem] text-left text-white ring-1 ring-white/10 transition-shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lp-accent-soft)] lg:min-h-[34rem]",
        selected && "ring-2 ring-[var(--lp-accent-soft)]",
      )}
    >
      <Image
        src={vm.content.exteriorPhoto}
        alt={t("photoAlt", { name: vm.name })}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className={cn("object-cover", !loop && "lp-kenburns")}
        style={{
          objectPosition: `${vm.content.exteriorFocal.x * 100}% ${vm.content.exteriorFocal.y * 100}%`,
        }}
      />
      {loop ? (
        <video
          ref={video}
          muted
          playsInline
          loop
          preload="none"
          aria-hidden
          tabIndex={-1}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(11_11_13/0.92),rgb(11_11_13/0.35)_55%,transparent_80%)]" />

      <div className="relative p-6 sm:p-8">
        <p className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
          <span>{pick(vm.content.area, locale)}</span>
          {vm.content.gender ? (
            <span className="rounded-full border border-white/25 px-2.5 py-1 tracking-normal">
              {t(`gender.${vm.content.gender}`)}
            </span>
          ) : null}
        </p>
        <h3 className="mt-3 font-display text-[clamp(2.6rem,4.6vw,4rem)] leading-none">
          {vm.name}
        </h3>
        <p className="mt-3 max-w-sm text-white/85">
          {pick(vm.content.tagline, locale)}
        </p>
        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-white/60">{t("price")}</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums">
              {min > 0
                ? `${formatCurrency(min, { compact: true })}${max > min ? ` – ${formatCurrency(max, { compact: true })}` : ""}`
                : t("ask")}
            </dd>
          </div>
          <div>
            <dt className="text-white/60">{t("available")}</dt>
            <dd className="mt-0.5 flex items-center gap-2 text-lg font-semibold tabular-nums">
              <span
                className={cn(
                  "size-2 rounded-full",
                  open > 0 ? "bg-success-bright" : "bg-warning",
                )}
              />
              {k ? t("rooms", { count: open }) : "—"}
            </dd>
          </div>
        </dl>
        <span className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-ink transition-colors group-hover:bg-[var(--lp-accent-soft)]">
          {t("cta", { name: vm.name })}
          <Icon
            name="arrow_forward"
            size={18}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </button>
  );
}

export function ChooseHome({
  properties,
  tier,
  selected,
  onSelect,
}: {
  properties: PropertyVM[];
  tier: DeviceTier | null;
  selected: string;
  onSelect: (key: PropertyVM["key"]) => void;
}) {
  const t = useTranslations("landing.choose");
  return (
    <section
      id="pilih"
      aria-labelledby="pilih-heading"
      className="scroll-mt-16 bg-ink px-5 pb-16 pt-10 text-white sm:px-8 lg:pb-24 lg:pt-14"
    >
      <div className="mx-auto w-full max-w-[90rem]">
        <SectionHeading
          id="pilih-heading"
          index={1}
          dark
          eyebrow={t("eyebrow")}
          lead={t("titleLead")}
          accent={t("titleAccent")}
          aside={t("aside")}
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {properties.map((vm) => (
            <Card
              key={vm.key}
              vm={vm}
              tier={tier}
              selected={selected === vm.key}
              onSelect={() => onSelect(vm.key)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
