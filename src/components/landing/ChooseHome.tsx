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
      className="lp-theme group flex w-full flex-col text-left text-white focus-visible:outline-none"
    >
      <span
        className={cn(
          "relative block aspect-[4/3] w-full overflow-hidden rounded-lg ring-1 transition sm:aspect-[16/10]",
          selected
            ? "ring-2 ring-white"
            : "ring-white/10 group-focus-visible:ring-2 group-focus-visible:ring-white",
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
      </span>

      <span className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <span className="block">
          <span className="eyebrow flex flex-wrap items-center gap-3 text-[10px] text-white/60">
            {pick(vm.content.area, locale)}
            {vm.content.gender ? (
              <>
                <span aria-hidden className="h-px w-6 bg-white/40" />
                {t(`gender.${vm.content.gender}`)}
              </>
            ) : null}
          </span>
          <h3 className="mt-3 text-[clamp(1.75rem,2.6vw,2.4rem)] font-semibold leading-none tracking-[-0.035em]">
            {vm.name}
          </h3>
          <span className="mt-3 block max-w-sm text-[15px] leading-relaxed text-white/70">
            {pick(vm.content.tagline, locale)}
          </span>
        </span>
        <span className="btn btn-outline-light shrink-0 self-start group-hover:bg-white group-hover:text-ink lg:self-auto">
          {t("cta", { name: vm.name })}
          <Icon name="north_east" size={17} />
        </span>
      </span>

      <dl className="mt-6 grid w-full grid-cols-2 border-t border-white/15 pt-5 text-sm">
        <div>
          <dt className="eyebrow text-[10px] text-white/55">{t("price")}</dt>
          <dd className="mt-1.5 text-lg font-medium tabular-nums">
            {min > 0
              ? `${formatCurrency(min, { compact: true })}${max > min ? ` – ${formatCurrency(max, { compact: true })}` : ""}`
              : t("ask")}
          </dd>
        </div>
        <div className="border-l border-white/15 pl-5">
          <dt className="eyebrow text-[10px] text-white/55">
            {t("available")}
          </dt>
          <dd className="mt-1.5 flex items-center gap-2 text-lg font-medium tabular-nums">
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
      className="scroll-mt-16 bg-ink px-5 py-24 text-white sm:px-8 lg:px-12 lg:py-32"
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
        <div className="mt-14 grid gap-x-8 gap-y-16 lg:grid-cols-2">
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
