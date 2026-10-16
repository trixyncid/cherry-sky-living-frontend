/**
 * Home properties — both residences side by side with live availability,
 * price range, room types and visit CTAs, plus an on-demand map.
 */

"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { HomeSectionHeading } from "@/components/sections/HomeSectionHeading";
import { Icon } from "@/components/shared/Icon";
import { Reveal } from "@/components/shared/Reveal";
import { Link } from "@/i18n/routing";
import { track } from "@/lib/analytics";
import type { Kost } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatCurrency, generateWhatsAppURL } from "@/lib/utils/format";

function mapsSearchUrl(kost: Kost) {
  const query = [kost.name, kost.location.address, kost.location.city]
    .filter(Boolean)
    .join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function PropertyCard({ kost, index }: { kost: Kost; index: number }) {
  const t = useTranslations("home.houses");
  const tWhatsapp = useTranslations("whatsapp");
  const tStatus = useTranslations("status");

  const isOpen = kost.availableRooms > 0;
  const hasInventory = kost.totalRooms > 0;
  const openShare =
    kost.totalRooms > 0 ? (kost.availableRooms / kost.totalRooms) * 100 : 0;
  const { min, max } = kost.priceRange;
  const priceLabel =
    min > 0
      ? max > min
        ? `${formatCurrency(min, { compact: true })} – ${formatCurrency(max, { compact: true })}`
        : formatCurrency(min, { compact: true })
      : "—";
  const roomTypes = kost.roomTypes.filter((rt) => rt.totalCount > 0);
  const visitUrl = generateWhatsAppURL(
    kost.whatsappNumber,
    tWhatsapp("visitSchedule", { propertyName: kost.name }),
  );

  return (
    <Reveal delay={index * 0.1} className="h-full">
      <article className="group flex h-full flex-col rounded-[1.25rem] bg-white p-2">
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-[#efeeeb]">
          {kost.thumbnail ? (
            <Image
              src={kost.thumbnail}
              alt={kost.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
            />
          ) : null}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
          <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-[#141414]">
            <span
              className={cn(
                "size-1.5 rounded-full",
                isOpen
                  ? "bg-[#059669]"
                  : hasInventory
                    ? "bg-[#ba1a1a]"
                    : "bg-[#d97706]",
              )}
            />
            {isOpen
              ? t("roomsOpen", {
                  available: kost.availableRooms,
                  total: kost.totalRooms,
                })
              : hasInventory
                ? t("fullyBooked")
                : t("askAvailability")}
          </span>
          <div className="absolute inset-x-6 bottom-5 text-white">
            <p className="text-sm font-medium text-white/75">
              {kost.location.city}
            </p>
            <h3 className="mt-1 text-[clamp(1.4rem,2.4vw,1.85rem)] font-medium leading-tight tracking-[-0.03em]">
              {kost.name}
            </h3>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-5 px-4 pb-4 pt-5 sm:px-5">
          <p className="flex items-start gap-2 text-base leading-relaxed text-[#6b6b6b]">
            <Icon
              name="location_on"
              size={18}
              className="mt-0.5 shrink-0 text-[#71130d]"
            />
            {kost.location.address}
          </p>

          {/* Availability meter: number + bar, not color alone */}
          {hasInventory || min > 0 ? (
            <div>
              <div className="mb-2 flex items-baseline justify-between text-sm">
                <span className="text-[#6b6b6b]">{t("monthlyRent")}</span>
                <span className="font-semibold tabular-nums text-[#141414]">
                  {priceLabel}
                </span>
              </div>
              <div
                aria-hidden
                className="h-1.5 overflow-hidden rounded-full bg-[#efeeeb]"
              >
                <div
                  className="h-full rounded-full bg-[#059669] transition-[width] duration-1000"
                  style={{ width: `${Math.max(openShare, isOpen ? 4 : 0)}%` }}
                />
              </div>
            </div>
          ) : null}

          {roomTypes.length > 0 ? (
            <div>
              <p className="mb-3 text-sm font-semibold text-[#141414]">
                {t("roomTypes")}
              </p>
              <ul className="flex flex-wrap gap-2">
                {roomTypes.map((rt) => (
                  <li key={rt.id}>
                    <Link
                      href={`/kosts/${kost.id}/${rt.id}`}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        rt.availableCount > 0
                          ? "border-[#dedad4] text-[#141414] hover:border-[#141414]"
                          : "border-[#efeeeb] bg-[#f7f3f2] text-[#6b6b6b]",
                      )}
                    >
                      {rt.name}
                      {rt.availableCount === 0 ? (
                        <span>· {tStatus("full")}</span>
                      ) : rt.price > 0 ? (
                        <span className="text-[#6b6b6b]">
                          {formatCurrency(rt.price, { compact: true })}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-[#efeeeb] pt-4">
            <Link
              href={`/kosts/${kost.id}`}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#71130d] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#8a1a12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#71130d] focus-visible:ring-offset-2"
            >
              {t("viewRooms")}
              <Icon name="arrow_forward" size={16} />
            </Link>
            <a
              href={visitUrl}
              onClick={() =>
                track("click_whatsapp", {
                  location: "home_property_card",
                  property: kost.name,
                })
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[#dedad4] px-5 text-sm font-semibold text-[#141414] transition-colors hover:border-[#141414]"
            >
              <Icon name="whatsapp" size={16} className="text-[#25D366]" />
              {t("requestVisit")}
            </a>
            <a
              href={mapsSearchUrl(kost)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-1.5 px-2 text-sm font-semibold text-[#6b6b6b] transition-colors hover:text-[#71130d]"
            >
              <Icon name="near_me" size={16} />
              {t("directions")}
            </a>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

interface HomePropertiesProps {
  kosts?: Kost[];
  isLoading?: boolean;
  /** Main content of /residences: the page hero carries the headline. */
  asPage?: boolean;
}

export function HomeProperties({
  kosts = [],
  isLoading = false,
  asPage = false,
}: HomePropertiesProps) {
  const t = useTranslations("home.houses");

  return (
    <section
      id="residences"
      aria-labelledby="houses-heading"
      className={cn(
        "relative w-full overflow-hidden px-5 py-14 sm:px-8 lg:py-20",
        asPage ? "pt-12 lg:pt-16" : "border-t border-[#e7e4df]",
      )}
    >
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-8 lg:gap-12">
        {asPage ? null : (
          <HomeSectionHeading
            id="houses-heading"
            eyebrow={t("eyebrow")}
            titleLead={t("titleLead")}
            titleAccent={t("titleAccent")}
            aside={
              <p className="text-base leading-relaxed text-[#6b6b6b]">
                {t("description")}
              </p>
            }
          />
        )}

        <div className="grid gap-3 lg:grid-cols-2">
          {isLoading
            ? [0, 1].map((i) => (
                <div
                  key={i}
                  aria-hidden
                  className="overflow-hidden rounded-[1.25rem] bg-white p-2"
                >
                  <div className="aspect-[16/10] animate-pulse bg-[#efeeeb]" />
                  <div className="flex flex-col gap-3 p-8">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-[#efeeeb]" />
                    <div className="h-2 w-full animate-pulse rounded bg-[#efeeeb]" />
                    <div className="h-8 w-1/2 animate-pulse rounded bg-[#efeeeb]" />
                  </div>
                </div>
              ))
            : kosts.map((kost, index) => (
                <PropertyCard key={kost.id} kost={kost} index={index} />
              ))}
        </div>
      </div>
    </section>
  );
}
