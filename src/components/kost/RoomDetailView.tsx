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
import { Icon } from "@/components/shared/Icon";
import { ShareButton } from "@/components/shared/ShareButton";
import { localized, siteConfig } from "@/config/site";
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

function SectionTitle({
  id,
  index,
  label,
  title,
  accent,
}: {
  id: string;
  index: number;
  label: string;
  title: string;
  accent?: string;
}) {
  return (
    <>
      <p className="eyebrow flex items-center gap-4 text-fg-muted">
        <span className="tabular-nums text-fg-faint">
          {String(index).padStart(2, "0")}
        </span>
        <span aria-hidden className="h-px w-10 bg-fg/30" />
        {label}
      </p>
      <h2
        id={id}
        className="mb-8 mt-5 text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-fg"
      >
        <span className="block text-balance">{title}</span>
        {accent ? (
          <span className="block text-balance font-normal text-fg/45">
            {accent}
          </span>
        ) : null}
      </h2>
    </>
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
              className="mx-auto text-fg-muted"
            />
            <h1 className="mt-4 text-2xl font-semibold tracking-[-0.035em] text-fg">
              {t("propertyDetail.unitTypeNotFound")}
            </h1>
            <Link href={`/kosts/${kost.id}`} className="btn btn-solid mt-6">
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
  const deposit = kost.deposit;
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
      <section className="w-full px-5 pt-24 sm:px-8 lg:px-12 lg:pt-28">
        <div className="mx-auto w-full max-w-[90rem]">
          <KostBreadcrumb
            items={[
              crumbs.home,
              crumbs.search,
              crumbs.property(kost.name, kost.id),
              crumbs.unitType(roomType.name),
            ]}
            className="mb-10"
          />
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="eyebrow flex items-center gap-4 text-fg-muted">
                {isOpen ? (
                  <span className="size-2 rounded-full bg-success" />
                ) : (
                  <span aria-hidden className="h-px w-10 bg-fg/30" />
                )}
                {kost.name}
              </p>
              <h1 className="mt-6 text-[clamp(2.5rem,5.5vw,4.5rem)] font-semibold leading-[1] tracking-[-0.04em] text-fg">
                <span className="block text-balance">{roomType.name}</span>
                {price > 0 ? (
                  <span className="block font-normal tabular-nums text-fg/45">
                    {formatCurrency(price)}
                    {t("pricing.perMonth")}
                  </span>
                ) : null}
              </h1>
              <ul className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px] text-fg-2">
                <li className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      isOpen ? "bg-success" : "bg-danger",
                    )}
                  />
                  {isOpen
                    ? t("home.residences.availableCount", {
                        count: roomType.availableCount,
                      })
                    : t("status.full")}
                </li>
                {roomType.size ? <li>{roomType.size} m²</li> : null}
                {capacity ? <li>{capacity}</li> : null}
              </ul>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link
                href={`/kosts/${kost.id}`}
                className="inline-flex h-11 items-center gap-2 text-[15px] font-medium text-fg-2 underline-offset-4 hover:text-fg hover:underline"
              >
                <Icon name="arrow_back" size={16} />
                {t("detail.backToResidence", { name: kost.name })}
              </Link>
              <span aria-hidden className="mx-2 h-4 w-px bg-line-strong" />
              <ShareButton
                title={`${roomType.name}, ${kost.name}`}
                className="h-11 rounded-none border-0 bg-transparent px-0 text-[15px] font-medium text-fg-2 underline-offset-4 hover:text-fg hover:underline"
              />
            </div>
          </div>

          {images.length > 0 ? (
            <div className="mt-10">
              <ImageGallery
                images={images}
                alt={roomType.name}
                variant="mosaic"
              />
            </div>
          ) : null}
        </div>
      </section>

      <div className="w-full px-5 pb-24 pt-14 sm:px-8 lg:px-12 lg:pb-32">
        <div className="mx-auto grid w-full max-w-[90rem] gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-16">
          <div className="flex min-w-0 flex-col gap-16">
            <ul className="grid grid-cols-2 border-t border-line xl:grid-cols-4">
              {specs.map((spec) => (
                <li
                  key={spec.label}
                  className="min-w-0 border-b border-line py-5 pr-4"
                >
                  <p className="eyebrow flex items-center gap-2 text-[10px] text-fg-muted">
                    <Icon name={spec.icon} size={16} />
                    {spec.label}
                  </p>
                  <p className="mt-2 break-words text-[17px] font-semibold tracking-tight text-fg">
                    {spec.value}
                  </p>
                </li>
              ))}
            </ul>

            {roomType.description ? (
              <p className="-mt-4 max-w-3xl text-pretty text-[clamp(1.15rem,1.7vw,1.4rem)] leading-snug tracking-tight text-fg-2">
                {roomType.description}
              </p>
            ) : null}

            {pricings.length > 0 ? (
              <section aria-labelledby="packages-title">
                <SectionTitle
                  id="packages-title"
                  index={1}
                  label={t("pricing.packages")}
                  title={t("detail.priceBreakdown")}
                  accent={
                    deposit
                      ? t("detail.depositFor", {
                          amount: formatCurrency(deposit),
                        })
                      : undefined
                  }
                />
                <ul className="border-t border-line">
                  {pricings.map((p) => {
                    const monthly = p.durationDays === 30;
                    return (
                      <li
                        key={p.id}
                        className={cn(
                          "flex items-center justify-between gap-4 border-b border-line py-5",
                        )}
                      >
                        <span className="flex items-center gap-2 text-base text-fg-2">
                          {getDurationLabel(p.durationDays, t)}
                          {monthly ? (
                            <span className="eyebrow rounded-md border border-brand/30 px-2 py-0.5 text-[10px] text-brand">
                              {t("pricing.popular")}
                            </span>
                          ) : null}
                        </span>
                        <span className="text-xl font-semibold tracking-[-0.025em] text-fg tabular-nums">
                          {formatCurrency(p.price)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            <section aria-labelledby="included-title">
              <SectionTitle
                id="included-title"
                index={pricings.length > 0 ? 2 : 1}
                label={t("detail.facilities")}
                title={t("home.amenities.titleLead")}
                accent={t("home.amenities.titleAccent")}
              />
              <IncludedPanel deposit={deposit} />
            </section>

            <section aria-labelledby="room-location-title">
              <SectionTitle
                id="room-location-title"
                index={pricings.length > 0 ? 3 : 2}
                label={t("detail.location")}
                title={kost.location.city || t("detail.location")}
                accent={address}
              />
              <PlaceMap
                name={kost.name}
                address={address}
                className="h-[18rem] lg:h-[22rem]"
              />
              <a
                href={directionsUrl(kost.name, address)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline mt-4"
              >
                {t("detail.directions")}
                <Icon name="north_east" size={17} />
              </a>
            </section>
          </div>

          {/* Sticky booking card */}
          <aside
            id="booking"
            className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start"
          >
            <div className="rounded-lg bg-ink p-6 text-white sm:p-7">
              <p className="eyebrow flex items-center gap-4 text-white/75">
                <span aria-hidden className="h-px w-10 bg-white/50" />
                {isOpen
                  ? t("detail.bookingCardTitle")
                  : t("detail.joinWaitlist")}
              </p>
              {price > 0 ? (
                <p className="mt-6">
                  <span className="text-[2.1rem] font-semibold tracking-[-0.035em] tabular-nums">
                    {formatCurrency(price)}
                  </span>
                  <span className="ml-1 text-sm text-white/55">
                    {t("pricing.perMonth")}
                  </span>
                </p>
              ) : (
                <p className="mt-6 text-base text-white/60">
                  {t("search.noPricing")}
                </p>
              )}
              {deposit ? (
                <p className="mt-1 text-sm text-white/60">
                  {t("detail.depositFor", { amount: formatCurrency(deposit) })}
                </p>
              ) : null}
              <p className="mt-5 flex items-center gap-2 border-t border-white/15 pt-5 text-sm text-white/80">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    isOpen ? "bg-success-bright" : "bg-danger",
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
                    deposit={kost.deposit}
                    propertyName={kost.name}
                    roomName={roomType.name}
                    propertyId={kost.id}
                    unitTypeId={roomType.id}
                    variant="compact"
                    label={t("cta.bookViewing")}
                    className="btn w-full bg-brand px-6 text-[15px] hover:bg-brand-hover"
                  />
                ) : (
                  <LeadDialog
                    type="waitlist"
                    propertyId={kost.id}
                    propertyName={kost.name}
                    unitTypeId={roomType.id}
                    roomName={roomType.name}
                    trigger={
                      <button type="button" className="btn btn-brand w-full">
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
                  className="btn btn-outline-light w-full"
                >
                  <Icon name="whatsapp" size={16} />
                  {t("cta.whatsapp")}
                </a>
                <a
                  href={`tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`}
                  onClick={() =>
                    track("click_call", { location: "room_booking_card" })
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 text-[15px] font-medium text-white/70 hover:text-white"
                >
                  <Icon name="call" size={16} />
                  {t("detail.call")} {siteConfig.phone}
                </a>
              </div>
              <p className="mt-4 border-t border-white/15 pt-4 text-sm leading-relaxed text-white/60">
                {t("detail.noCharge")} {t("detail.replyHint", { hours })}
              </p>
            </div>
          </aside>
        </div>
      </div>

      {similar.length > 0 ? (
        <section
          aria-labelledby="similar-title"
          className="w-full border-t border-line py-24 lg:py-32"
        >
          <div className="mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-12">
            <p className="eyebrow flex items-center gap-4 text-fg-muted">
              <span aria-hidden className="h-px w-10 bg-fg/30" />
              {t("detail.rooms")}
            </p>
            <h2
              id="similar-title"
              className="mt-5 text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1] tracking-[-0.035em] text-fg"
            >
              <span className="block">{t("detail.similarTitle")}</span>
              <span className="block font-normal text-fg/45">
                {t("detail.similarAccent")}
              </span>
            </h2>
          </div>
          <div className="mt-10 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:scroll-px-8 sm:px-8 lg:scroll-px-[max(3rem,calc((100vw-90rem)/2+3rem))] lg:px-[max(3rem,calc((100vw-90rem)/2+3rem))] [&::-webkit-scrollbar]:hidden">
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
                whatsappNumber={k.whatsappNumber}
                deposit={k.deposit}
                tags={rt.size ? [`${rt.size} m²`] : []}
              />
            ))}
          </div>
        </section>
      ) : null}
    </PublicPageShell>
  );
}
