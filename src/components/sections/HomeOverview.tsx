/**
 * Residence overview — intro copy + CTA (left), tall photo card for the
 * selected residence (centre), live spec list and the team's promise
 * (right). A toggle switches between residences; every value is live.
 */

"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CHECK_AVAILABILITY_HREF } from "@/components/layout/nav-links";
import { BrandMark } from "@/components/shared/BrandMark";
import { Icon } from "@/components/shared/Icon";
import { Reveal } from "@/components/shared/Reveal";
import { Link } from "@/i18n/routing";
import type { Kost } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";

const FALLBACK_PHOTO = "/assets/cherry-kost.jpeg";

export function HomeOverview({
  kosts = [],
  isLoading = false,
}: {
  kosts?: Kost[];
  isLoading?: boolean;
}) {
  const t = useTranslations("home.overview");
  const tIntro = useTranslations("home.intro");
  const [active, setActive] = useState(0);
  const kost = kosts[active] ?? kosts[0];

  const types = kost?.roomTypes.filter((rt) => rt.totalCount > 0).length ?? 0;
  const min = kost?.priceRange.min ?? 0;
  const max = kost?.priceRange.max ?? 0;
  const rent =
    min > 0
      ? max > min
        ? `${formatCurrency(min, { compact: true })} – ${formatCurrency(max, { compact: true })}`
        : formatCurrency(min, { compact: true })
      : t("ask");

  const specs = [
    { label: t("specLocation"), value: kost?.location.city || "—" },
    {
      label: t("specRooms"),
      value:
        kost && kost.totalRooms > 0
          ? t("roomsValue", {
              available: kost.availableRooms,
              total: kost.totalRooms,
            })
          : t("ask"),
    },
    { label: t("specRent"), value: rent },
    { label: t("specFor"), value: t("forValue") },
  ];

  return (
    <section
      aria-labelledby="overview-heading"
      className="w-full px-5 py-14 sm:px-8 lg:py-16"
    >
      <div className="mx-auto grid w-full max-w-[90rem] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,0.95fr)] lg:gap-10">
        {/* Left: copy + CTA */}
        <div className="flex flex-col justify-between gap-10">
          <div>
            <span className="inline-flex rounded-full border border-line-strong bg-white px-4 py-2 text-[15px] text-fg">
              {t("pill")}
            </span>
            <h2
              id="overview-heading"
              className="mt-5 text-[clamp(1.75rem,2.4vw,2.2rem)] font-medium leading-[1.1] tracking-[-0.03em] text-fg"
            >
              {t("titleLead")}{" "}
              <span className="text-fg-muted">{t("titleAccent")}</span>
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-fg-2">
              {tIntro("story")}
            </p>
          </div>
          <Link
            href={CHECK_AVAILABILITY_HREF}
            className="inline-flex h-12 items-center gap-2.5 self-start rounded-full bg-brand px-7 text-[15px] font-medium text-white shadow-[0_18px_36px_-18px_rgb(11_11_13/0.6)] transition-colors hover:bg-brand-hover"
          >
            <Icon name="arrow_forward" size={18} />
            {t("cta")}
          </Link>
        </div>

        {/* Centre: residence photo card */}
        <Reveal className="relative min-h-[26rem] overflow-hidden rounded-[1.75rem] bg-ink-2 lg:mt-10 lg:min-h-[32rem]">
          {isLoading ? (
            <div className="absolute inset-0 animate-pulse bg-ink-3" />
          ) : (
            <Image
              key={kost?.id}
              src={kost?.thumbnail || FALLBACK_PHOTO}
              alt={kost?.name ?? ""}
              fill
              sizes="(max-width: 1024px) 100vw, 38vw"
              className="object-cover"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgb(0_0_0/0.25)_0%,transparent_30%,transparent_50%,rgb(0_0_0/0.82)_100%)]" />
          <span className="absolute left-6 top-6 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-[15px] text-white backdrop-blur-md">
            {t("tag")}
          </span>
          <div className="absolute inset-x-6 bottom-6 text-white">
            <h3 className="text-[clamp(1.4rem,2vw,1.75rem)] font-medium tracking-tight">
              {kost?.name ?? "—"}
            </h3>
            <p className="mt-2 max-w-md text-base leading-relaxed text-white/80">
              {min > 0
                ? t("cardDesc", {
                    types,
                    price: `${formatCurrency(min, { compact: true })}`,
                  })
                : t("cardDescNoPrice")}
            </p>
          </div>
        </Reveal>

        {/* Right: live specs + promise */}
        <div className="flex flex-col justify-between gap-8">
          <div>
            {kosts.length > 1 ? (
              <div
                role="tablist"
                aria-label={t("pill")}
                className="mb-4 inline-flex rounded-full bg-white p-1"
              >
                {kosts.map((k, i) => (
                  <button
                    key={k.id}
                    type="button"
                    role="tab"
                    aria-selected={i === active}
                    aria-label={t("switchTo", { name: k.name })}
                    onClick={() => setActive(i)}
                    className={cn(
                      "h-9 rounded-full px-4 text-sm font-medium transition-colors",
                      i === active
                        ? "bg-brand text-white"
                        : "text-fg-2 hover:text-fg",
                    )}
                  >
                    {k.name}
                  </button>
                ))}
              </div>
            ) : null}
            <dl>
              {specs.map((spec) => (
                <div
                  key={spec.label}
                  className="flex items-baseline justify-between gap-4 border-b border-line-strong py-4"
                >
                  <dt className="text-base text-fg-muted">{spec.label}</dt>
                  <dd className="text-right text-lg font-semibold tracking-tight text-fg">
                    {isLoading ? (
                      <span className="inline-block h-5 w-24 animate-pulse rounded bg-line" />
                    ) : (
                      spec.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <Reveal
            delay={0.1}
            className="flex min-h-[14rem] flex-col justify-between rounded-[1.75rem] bg-white p-6 shadow-[0_24px_50px_-34px_rgb(11_11_13/0.3)]"
          >
            <div>
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-full bg-canvas">
                  <BrandMark tone="onLight" className="size-9" />
                </span>
                <span className="text-sm font-semibold text-brand">
                  {t("promiseLabel")}
                </span>
              </div>
              <blockquote className="mt-4 text-base leading-relaxed text-fg-2">
                {t("promise")}
              </blockquote>
              <p className="mt-3 text-sm font-medium text-fg">
                {t("promiseBy")}
              </p>
            </div>
            <a
              href="#how-it-works"
              className="mt-6 flex items-center justify-between text-[15px] text-fg-2 hover:text-fg"
            >
              {t("promiseLink")}
              <span className="flex size-9 items-center justify-center rounded-full bg-canvas">
                <Icon name="north_east" size={16} />
              </span>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
