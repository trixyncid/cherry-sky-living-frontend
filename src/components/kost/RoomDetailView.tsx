/**
 * Room detail (§5.6) — specs, full price packages, transparent inclusions,
 * pinned location, sticky booking card (waitlist when full), room-specific
 * floating CTA, and "similar rooms" to rescue visitors when it's occupied.
 */

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";
import { ImageGallery } from "@/components/kost/ImageGallery";
import { IncludedPanel } from "@/components/kost/IncludedPanel";
import {
  KostBreadcrumb,
  useKostBreadcrumbs,
} from "@/components/kost/KostBreadcrumb";
import { directionsUrl, PlaceMap } from "@/components/kost/PlaceMap";
import { RoomTile } from "@/components/kost/RoomTile";
import { WhatsAppInquiryDialog } from "@/components/kost/WhatsAppInquiryDialog";
import { PublicPageShell } from "@/components/layout/PublicPageShell";
import { LeadDialog } from "@/components/leads/LeadDialog";
import { Eyebrow } from "@/components/shared/ArrowPill";
import { Icon } from "@/components/shared/Icon";
import { ShareButton } from "@/components/shared/ShareButton";
import { depositFor, localized, siteConfig } from "@/config/site";
import { Link } from "@/i18n/routing";
import { track } from "@/lib/analytics";
import { useKosts } from "@/lib/hooks/use-kost-data";
import type { Kost, RoomType } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  formatCapacity,
  formatCurrency,
  generateWhatsAppURL,
} from "@/lib/utils/format";
import { getDurationLabel } from "@/lib/utils/kost-display";

interface RoomDetailViewProps {
  kost: Kost;
  roomTypeId: string;
}

function monthlyPrice(roomType: RoomType): number {
  return (
    roomType.pricings?.find((p) => p.durationDays === 30)?.price ??
    roomType.price
  );
}

export function RoomDetailView({ kost, roomTypeId }: RoomDetailViewProps) {
  const t = useTranslations();
  const locale = useLocale();
  const crumbs = useKostBreadcrumbs();
  const { data: allKosts } = useKosts();
  const roomType = kost.roomTypes.find((rt) => rt.id === roomTypeId);

  useEffect(() => {
    track("view_room_detail", { property: kost.name, room: roomType?.name });
  }, [kost.name, roomType?.name]);

  if (!roomType) {
    return (
      <PublicPageShell hideCta>
        <section className="flex min-h-[70vh] items-center justify-center px-5 pt-24">
          <div className="max-w-md text-center">
            <Icon
              name="search_off"
              size={48}
              className="mx-auto text-[#71130d]"
            />
            <h1 className="mt-4 text-2xl font-medium tracking-tight text-[#141414]">
              {t("propertyDetail.unitTypeNotFound")}
            </h1>
            <Link
              href={`/kosts/${kost.id}`}
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[#71130d] px-6 text-[15px] font-semibold text-white"
            >
              <Icon name="arrow_back" size={18} />
              {t("detail.backToResidence", { name: kost.name })}
            </Link>
          </div>
        </section>
      </PublicPageShell>
    );
  }

  const isOpen = roomType.availableCount > 0;
  const price = monthlyPrice(roomType);
  const address = [kost.location.address, kost.location.city]
    .filter(Boolean)
    .join(", ");
  const deposit = depositFor(kost.name);
  const hours = `${localized(siteConfig.viewingHours.days, locale)} ${siteConfig.viewingHours.time}`;
  const roomMessage = t("whatsapp.roomInquiry", {
    roomType: roomType.name,
    propertyName: kost.name,
  });
  const capacity =
    roomType.capacity && roomType.capacity !== "—"
      ? formatCapacity(roomType.capacity, locale === "en" ? "en" : "id")
      : null;
  const pricings = [...(roomType.pricings ?? [])].sort(
    (a, b) => a.durationDays - b.durationDays,
  );
  const images = roomType.images.length > 0 ? roomType.images : kost.images;

  // Similar rooms: open rooms first, same residence first.
  const similar = (allKosts ?? [kost])
    .flatMap((k) =>
      (k.id === kost.id ? kost : k).roomTypes.map((rt) => ({ rt, k })),
    )
    .filter(({ rt }) => rt.id !== roomType.id && rt.totalCount > 0)
    .sort((a, b) => {
      const open = (x: RoomType) => (x.availableCount > 0 ? 0 : 1);
      if (open(a.rt) !== open(b.rt)) return open(a.rt) - open(b.rt);
      const same = (x: Kost) => (x.id === kost.id ? 0 : 1);
      if (same(a.k) !== same(b.k)) return same(a.k) - same(b.k);
      return monthlyPrice(a.rt) - monthlyPrice(b.rt);
    })
    .slice(0, 8);

  const specs = [
    roomType.size
      ? {
          icon: "square_foot",
          label: t("detail.sizeLabel"),
          value: `${roomType.size} m²`,
        }
      : null,
    capacity
      ? { icon: "group", label: t("detail.capacityLabel"), value: capacity }
      : null,
    {
      icon: isOpen ? "event_available" : "event_busy",
      label: t("detail.statusLabel"),
      value: isOpen
        ? t("detail.roomsOpenAt", {
            available: roomType.availableCount,
            total: roomType.totalCount,
          })
        : t("status.full"),
    },
    { icon: "apartment", label: t("detail.propertyLabel"), value: kost.name },
  ].filter((s): s is { icon: string; label: string; value: string } =>
    Boolean(s),
  );

  return (
    <PublicPageShell
      hideCta
      floating={{
        whatsappMessage: roomMessage,
        alwaysVisible: true,
      }}
    >
      <section className="w-full px-5 pt-24 sm:px-8 lg:pt-28">
        <div className="mx-auto w-full max-w-[90rem]">
          <KostBreadcrumb
            items={[
              crumbs.home,
              crumbs.search,
              crumbs.property(kost.name, kost.id),
              crumbs.unitType(roomType.name),
            ]}
            className="mb-6"
          />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Eyebrow>{kost.name}</Eyebrow>
              <h1 className="mt-3 text-[clamp(2.2rem,4.6vw,3.75rem)] font-medium leading-[1.02] tracking-[-0.04em] text-[#141414]">
                {roomType.name}
              </h1>
              <ul className="mt-4 flex flex-wrap gap-2">
                <li className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-[#141414]">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      isOpen ? "bg-[#059669]" : "bg-[#ba1a1a]",
                    )}
                  />
                  {isOpen
                    ? t("home.residences.availableCount", {
                        count: roomType.availableCount,
                      })
                    : t("status.full")}
                </li>
                {price > 0 ? (
                  <li className="rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-[#141414]">
                    {formatCurrency(price)}
                    <span className="font-normal text-[#6b6b6b]">
                      {t("pricing.perMonth")}
                    </span>
                  </li>
                ) : null}
                {roomType.size ? (
                  <li className="rounded-full border border-[#dedad4] px-3.5 py-1.5 text-sm text-[#3d3a36]">
                    {roomType.size} m²
                  </li>
                ) : null}
                {capacity ? (
                  <li className="rounded-full border border-[#dedad4] px-3.5 py-1.5 text-sm text-[#3d3a36]">
                    {capacity}
                  </li>
                ) : null}
              </ul>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/kosts/${kost.id}`}
                className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-[#3d3a36] hover:text-[#141414]"
              >
                <Icon name="arrow_back" size={16} />
                {t("detail.backToResidence", { name: kost.name })}
              </Link>
              <ShareButton title={`${roomType.name}, ${kost.name}`} />
            </div>
          </div>

          {images.length > 0 ? (
            <div className="mt-8">
              <ImageGallery
                images={images}
                alt={roomType.name}
                variant="mosaic"
              />
            </div>
          ) : null}
        </div>
      </section>

      <div className="w-full px-5 pb-16 pt-10 sm:px-8">
        <div className="mx-auto grid w-full max-w-[90rem] gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="flex min-w-0 flex-col gap-10">
            <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {specs.map((spec) => (
                <li key={spec.label} className="rounded-[1.25rem] bg-white p-5">
                  <Icon name={spec.icon} size={22} className="text-[#71130d]" />
                  <p className="mt-4 text-sm text-[#6b6b6b]">{spec.label}</p>
                  <p className="mt-0.5 text-[17px] font-semibold tracking-tight text-[#141414]">
                    {spec.value}
                  </p>
                </li>
              ))}
            </ul>

            {roomType.description ? (
              <p className="max-w-3xl text-[clamp(1.15rem,1.7vw,1.4rem)] font-medium leading-snug tracking-tight text-[#141414]">
                {roomType.description}
              </p>
            ) : null}

            {pricings.length > 0 ? (
              <section aria-labelledby="packages-title">
                <h2
                  id="packages-title"
                  className="mb-4 text-2xl font-medium tracking-tight text-[#141414]"
                >
                  {t("detail.priceBreakdown")}
                </h2>
                <ul className="overflow-hidden rounded-[1.25rem] bg-white">
                  {pricings.map((p) => {
                    const monthly = p.durationDays === 30;
                    return (
                      <li
                        key={p.id}
                        className={cn(
                          "flex items-center justify-between gap-4 border-b border-[#efeeeb] px-5 py-4 last:border-b-0",
                          monthly && "bg-[#faf9f7]",
                        )}
                      >
                        <span className="flex items-center gap-2 text-base text-[#3d3a36]">
                          {getDurationLabel(p.durationDays, t)}
                          {monthly ? (
                            <span className="rounded-full bg-[#71130d] px-2.5 py-0.5 text-xs font-semibold text-white">
                              {t("pricing.popular")}
                            </span>
                          ) : null}
                        </span>
                        <span className="text-lg font-semibold tracking-tight text-[#141414] tabular-nums">
                          {formatCurrency(p.price)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            <section aria-labelledby="included-title">
              <h2
                id="included-title"
                className="mb-4 text-2xl font-medium tracking-tight text-[#141414]"
              >
                {t("detail.facilities")}
              </h2>
              <IncludedPanel deposit={deposit} />
            </section>

            <section aria-labelledby="room-location-title">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2
                    id="room-location-title"
                    className="text-2xl font-medium tracking-tight text-[#141414]"
                  >
                    {t("detail.location")}
                  </h2>
                  <p className="mt-1 text-base text-[#3d3a36]">{address}</p>
                </div>
                <a
                  href={directionsUrl(kost.name, address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#dedad4] bg-white px-4 text-sm font-semibold text-[#141414] hover:border-[#141414]"
                >
                  <Icon name="near_me" size={16} />
                  {t("detail.directions")}
                </a>
              </div>
              <PlaceMap
                name={kost.name}
                address={address}
                className="h-[18rem]"
              />
            </section>
          </div>

          {/* Sticky booking card */}
          <aside
            id="booking"
            className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start"
          >
            <div className="rounded-[1.25rem] bg-white p-6">
              <p className="text-lg font-semibold tracking-tight text-[#141414]">
                {isOpen
                  ? t("detail.bookingCardTitle")
                  : t("detail.joinWaitlist")}
              </p>
              {price > 0 ? (
                <p className="mt-4">
                  <span className="text-[1.9rem] font-medium tracking-tight text-[#141414] tabular-nums">
                    {formatCurrency(price)}
                  </span>
                  <span className="ml-1 text-sm text-[#6b6b6b]">
                    {t("pricing.perMonth")}
                  </span>
                </p>
              ) : (
                <p className="mt-4 text-base text-[#6b6b6b]">
                  {t("search.noPricing")}
                </p>
              )}
              {deposit ? (
                <p className="mt-1 text-sm text-[#6b6b6b]">
                  {t("detail.depositFor", { amount: formatCurrency(deposit) })}
                </p>
              ) : null}
              <p className="mt-4 flex items-center gap-2 text-sm text-[#3d3a36]">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    isOpen ? "bg-[#059669]" : "bg-[#ba1a1a]",
                  )}
                />
                {isOpen
                  ? t("detail.roomsOpenAt", {
                      available: roomType.availableCount,
                      total: roomType.totalCount,
                    })
                  : t("status.full")}
              </p>

              <div className="mt-6 flex flex-col gap-2">
                {isOpen ? (
                  <WhatsAppInquiryDialog
                    phoneNumber={kost.whatsappNumber}
                    propertyName={kost.name}
                    roomName={roomType.name}
                    pricings={pricings}
                    fallbackPrice={price}
                    variant="compact"
                    label={t("cta.bookViewing")}
                    className="h-12 w-full justify-center rounded-full bg-[#71130d] text-[15px] font-semibold hover:bg-[#8a1a12]"
                  />
                ) : (
                  <LeadDialog
                    type="waitlist"
                    propertyId={kost.id}
                    propertyName={kost.name}
                    unitTypeId={roomType.id}
                    roomName={roomType.name}
                    trigger={
                      <button
                        type="button"
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#71130d] text-[15px] font-semibold text-white hover:bg-[#8a1a12]"
                      >
                        <Icon name="notifications" size={16} />
                        {t("detail.joinWaitlist")}
                      </button>
                    }
                  />
                )}
                <a
                  href={generateWhatsAppURL(kost.whatsappNumber, roomMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    track("click_whatsapp", {
                      location: "room_booking_card",
                      property: kost.name,
                      room: roomType.name,
                    })
                  }
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#dedad4] text-[15px] font-semibold text-[#141414] hover:bg-[#f7f3f2]"
                >
                  <Icon name="whatsapp" size={16} className="text-[#25D366]" />
                  {t("cta.whatsapp")}
                </a>
                <a
                  href={`tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`}
                  onClick={() =>
                    track("click_call", { location: "room_booking_card" })
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 text-[15px] font-semibold text-[#3d3a36] hover:text-[#141414]"
                >
                  <Icon name="call" size={16} />
                  {t("detail.call")} {siteConfig.phone}
                </a>
              </div>
              <p className="mt-4 border-t border-[#efeeeb] pt-4 text-sm leading-relaxed text-[#6b6b6b]">
                {t("detail.noCharge")} {t("detail.replyHint", { hours })}
              </p>
            </div>
          </aside>
        </div>
      </div>

      {similar.length > 0 ? (
        <section
          aria-labelledby="similar-title"
          className="w-full border-t border-[#e7e4df] py-14"
        >
          <div className="mx-auto w-full max-w-[90rem] px-5 sm:px-8">
            <h2
              id="similar-title"
              className="text-[clamp(1.6rem,2.8vw,2.25rem)] font-medium tracking-[-0.025em] text-[#141414]"
            >
              {t("detail.similarTitle")}{" "}
              <span className="text-[#857f77]">
                {t("detail.similarAccent")}
              </span>
            </h2>
          </div>
          <div className="mt-6 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:scroll-px-8 sm:px-8 lg:scroll-px-[max(2rem,calc((100vw-90rem)/2+2rem))] lg:px-[max(2rem,calc((100vw-90rem)/2+2rem))] [&::-webkit-scrollbar]:hidden">
            {similar.map(({ rt, k }) => (
              <RoomTile
                key={rt.id}
                width="carousel"
                roomTypeId={rt.id}
                propertyId={k.id}
                name={rt.name}
                propertyName={k.name}
                city={k.location.city}
                image={rt.images[0] || k.thumbnail}
                availableCount={rt.availableCount}
                totalCount={rt.totalCount}
                monthlyPrice={monthlyPrice(rt)}
                pricings={rt.pricings ?? []}
                whatsappNumber={k.whatsappNumber}
                tags={rt.size ? [`${rt.size} m²`] : []}
              />
            ))}
          </div>
        </section>
      ) : null}
    </PublicPageShell>
  );
}
