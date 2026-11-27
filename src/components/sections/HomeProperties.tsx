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
      <article className="group flex h-full flex-col">
        <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-hover">
          {kost.thumbnail ? (
            <Image
              src={kost.thumbnail}
              alt={kost.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
            />
          ) : null}
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1 text-xs font-medium text-fg">
            <span
              className={cn(
                "size-1.5 rounded-full",
                isOpen
                  ? "bg-success"
                  : hasInventory
                    ? "bg-danger"
                    : "bg-warning",
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
        </div>

        <div className="flex flex-1 flex-col gap-6 pt-6">
          <div>
            <p className="eyebrow flex items-center gap-4 text-[10px] text-fg-muted">
              <span className="tabular-nums text-brand">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span aria-hidden className="h-px w-8 bg-fg/30" />
              {kost.location.city}
            </p>
            <h3 className="mt-3 text-[clamp(1.6rem,2.6vw,2.25rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-fg">
              {kost.name}
            </h3>
            <p className="mt-2 flex items-start gap-2 text-base leading-relaxed text-fg-muted">
              <Icon
                name="location_on"
                size={18}
                className="mt-0.5 shrink-0 text-fg-faint"
              />
              {kost.location.address}
            </p>
          </div>

          {/* Availability meter: number + bar, not color alone */}
          {hasInventory || min > 0 ? (
            <div className="border-t border-line pt-4">
              <div className="mb-3 flex items-baseline justify-between text-sm">
                <span className="text-fg-muted">{t("monthlyRent")}</span>
                <span className="font-semibold tabular-nums text-fg">
                  {priceLabel}
                </span>
              </div>
              <div
                aria-hidden
                className="h-1 overflow-hidden rounded-full bg-line"
              >
                <div
                  className="h-full rounded-full bg-success transition-[width] duration-1000"
                  style={{ width: `${Math.max(openShare, isOpen ? 4 : 0)}%` }}
                />
              </div>
            </div>
          ) : null}

          {kost.deposit ? (
            <p className="flex items-baseline justify-between border-t border-line pt-4 text-sm">
              <span className="text-fg-muted">{t("deposit")}</span>
              <span className="font-semibold tabular-nums text-fg">
                {formatCurrency(kost.deposit)}
              </span>
            </p>
          ) : null}

          {roomTypes.length > 0 ? (
            <div>
              <p className="eyebrow mb-3 text-[10px] text-fg-muted">
                {t("roomTypes")}
              </p>
              <ul className="flex flex-wrap gap-2">
                {roomTypes.map((rt) => (
                  <li key={rt.id}>
                    <Link
                      href={`/kosts/${kost.id}/${rt.id}`}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                        rt.availableCount > 0
                          ? "border-line-strong text-fg hover:border-fg"
                          : "border-line text-fg-muted",
                      )}
                    >
                      {rt.name}
                      {rt.availableCount === 0 ? (
                        <span>· {tStatus("full")}</span>
                      ) : rt.price > 0 ? (
                        <span className="text-fg-muted">
                          {formatCurrency(rt.price, { compact: true })}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-line pt-5">
            <Link
              href={`/kosts/${kost.id}`}
              className="btn btn-solid group/btn"
            >
              {t("viewRooms")}
              <Icon
                name="north_east"
                size={17}
                className="transition-transform duration-300 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 motion-reduce:transition-none"
              />
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
              className="btn btn-outline"
            >
              <Icon name="whatsapp" size={16} className="text-[#25D366]" />
              {t("requestVisit")}
            </a>
            <a
              href={mapsSearchUrl(kost)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-1.5 px-2 text-sm font-medium text-fg-muted underline-offset-4 transition-colors hover:text-fg hover:underline"
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
        "relative w-full overflow-hidden bg-canvas px-5 py-24 sm:px-8 lg:px-12 lg:py-32",
        !asPage && "border-t border-line",
      )}
    >
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-14 lg:gap-20">
        {asPage ? null : (
          <HomeSectionHeading
            id="houses-heading"
            eyebrow={t("eyebrow")}
            titleLead={t("titleLead")}
            titleAccent={t("titleAccent")}
            aside={
              <p className="text-base leading-relaxed text-fg-muted">
                {t("description")}
              </p>
            }
          />
        )}

        <div className="grid gap-x-10 gap-y-20 lg:grid-cols-2">
          {isLoading
            ? [0, 1].map((i) => (
                <div key={i} aria-hidden>
                  <div className="aspect-[16/10] animate-pulse rounded-lg bg-hover" />
                  <div className="flex flex-col gap-3 pt-6">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-hover" />
                    <div className="h-2 w-full animate-pulse rounded bg-hover" />
                    <div className="h-8 w-1/2 animate-pulse rounded bg-hover" />
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
