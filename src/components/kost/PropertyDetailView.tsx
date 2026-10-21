/**
 * Property detail — title block with live availability, photo bento,
 * sticky in-page tabs, room tiles, facilities + transparent pricing,
 * pinned map, and a sticky booking card (mobile: floating CTA bar, §5.6).
 */

"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
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
import { ArrowPill, Eyebrow } from "@/components/shared/ArrowPill";
import { Icon } from "@/components/shared/Icon";
import { ShareButton } from "@/components/shared/ShareButton";
import { localized, siteConfig } from "@/config/site";
import { track } from "@/lib/analytics";
import type { Kost, RoomType } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  formatCapacity,
  formatCurrency,
  generateWhatsAppURL,
} from "@/lib/utils/format";
import { sortRoomTypesForDisplay } from "@/lib/utils/kost-display";

interface PropertyDetailViewProps {
  kost: Kost;
}

function monthlyPrice(roomType: RoomType): number {
  return (
    roomType.pricings?.find((p) => p.durationDays === 30)?.price ??
    roomType.price
  );
}

function ExpandableText({ text }: { text: string }) {
  const t = useTranslations("detail");
  const [open, setOpen] = useState(false);
  const long = text.length > 320;
  return (
    <div className="max-w-3xl">
      <p
        className={cn(
          "text-[17px] leading-[1.75] text-fg-2",
          long && !open && "line-clamp-4",
        )}
      >
        {text}
      </p>
      {long ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-2 text-[15px] font-semibold text-fg underline underline-offset-4"
        >
          {open ? t("readLess") : t("readMore")}
        </button>
      ) : null}
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-36 border-t border-line pt-10"
    >
      <h2
        id={`${id}-title`}
        className="mb-6 text-2xl font-medium tracking-tight text-fg"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export function PropertyDetailView({ kost }: PropertyDetailViewProps) {
  const t = useTranslations();
  const locale = useLocale();
  const crumbs = useKostBreadcrumbs();

  const rooms = sortRoomTypesForDisplay(kost.roomTypes).filter(
    (rt) => rt.totalCount > 0,
  );
  const openRoom = rooms.find((rt) => rt.availableCount > 0);
  const address = [kost.location.address, kost.location.city]
    .filter(Boolean)
    .join(", ");
  const isOpen = kost.availableRooms > 0;
  const hasInventory = kost.totalRooms > 0;
  const isAlmostFull = isOpen && kost.availableRooms <= 3;
  const openShare = hasInventory
    ? (kost.availableRooms / kost.totalRooms) * 100
    : 0;
  const deposit = kost.deposit;
  const visitMessage = t("whatsapp.visitSchedule", { propertyName: kost.name });
  const viewingUrl = generateWhatsAppURL(kost.whatsappNumber, visitMessage);
  const hours = `${localized(siteConfig.viewingHours.days, locale)} ${siteConfig.viewingHours.time}`;
  const { min, max } = kost.priceRange;

  const tabs = [
    { id: "overview", label: t("detail.overview") },
    { id: "rooms", label: t("detail.rooms") },
    { id: "facilities", label: t("detail.facilities") },
    { id: "location", label: t("detail.location") },
    ...(kost.rules?.length ? [{ id: "rules", label: t("detail.rules") }] : []),
  ];

  const facts = [
    {
      label: t("detail.rooms"),
      value: hasInventory
        ? t("detail.roomsOpenAt", {
            available: kost.availableRooms,
            total: kost.totalRooms,
          })
        : "—",
    },
    {
      label: t("pricing.startingFrom"),
      value: min > 0 ? `${formatCurrency(min)}${t("pricing.perMonth")}` : "—",
    },
    {
      label: t("propertyDetail.unitTypes"),
      value: String(rooms.length),
    },
    ...(deposit
      ? [
          {
            label: t("roomDetail.depositLabel"),
            value: formatCurrency(deposit),
          },
        ]
      : []),
  ];

  return (
    <PublicPageShell
      hideCta
      floating={{
        whatsappMessage: visitMessage,
        alwaysVisible: true,
      }}
    >
      {/* Title block + gallery */}
      <section className="w-full px-5 pt-24 sm:px-8 lg:pt-28">
        <div className="mx-auto w-full max-w-[90rem]">
          <KostBreadcrumb
            items={[
              crumbs.home,
              crumbs.search,
              crumbs.property(kost.name, kost.id),
            ]}
            className="mb-6"
          />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Eyebrow>
                {kost.location.city || t("detail.propertyLabel")}
              </Eyebrow>
              <h1 className="mt-3 text-[clamp(2.2rem,4.6vw,3.75rem)] font-medium leading-[1.02] tracking-[-0.04em] text-fg">
                {kost.name}
              </h1>
              <p className="mt-3 flex items-start gap-2 text-base text-fg-2">
                <Icon
                  name="location_on"
                  size={18}
                  className="mt-0.5 shrink-0 text-brand"
                />
                {address}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                <li className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-fg">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      isOpen
                        ? "bg-success"
                        : hasInventory
                          ? "bg-danger"
                          : "bg-warning",
                    )}
                  />
                  {isOpen
                    ? t("propertyDetail.availableRooms", {
                        available: kost.availableRooms,
                        total: kost.totalRooms,
                      })
                    : hasInventory
                      ? t("status.full")
                      : t("home.houses.askAvailability")}
                </li>
                {isAlmostFull ? (
                  <li className="rounded-full bg-warning-soft px-3.5 py-1.5 text-sm font-semibold text-warning">
                    {t("status.almostFull")}
                  </li>
                ) : null}
                {min > 0 ? (
                  <li className="rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-fg">
                    {max > min
                      ? `${formatCurrency(min, { compact: true })} – ${formatCurrency(max, { compact: true })}`
                      : formatCurrency(min, { compact: true })}
                    <span className="font-normal text-fg-muted">
                      {t("pricing.perMonth")}
                    </span>
                  </li>
                ) : null}
              </ul>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ShareButton title={kost.name} />
              <ArrowPill
                href={viewingUrl}
                external
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  track("click_whatsapp", {
                    location: "property_header",
                    property: kost.name,
                  })
                }
              >
                {t("cta.bookViewing")}
              </ArrowPill>
            </div>
          </div>

          <div className="mt-8">
            {kost.images.length > 0 ? (
              <ImageGallery
                images={kost.images}
                alt={kost.name}
                variant="mosaic"
              />
            ) : kost.thumbnail ? (
              <div className="relative h-[min(20rem,64vw)] overflow-hidden rounded-[1.25rem] md:h-[min(30rem,36vw)]">
                <Image
                  src={kost.thumbnail}
                  alt={kost.name}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Sticky in-page tabs */}
      <nav
        aria-label={kost.name}
        className="sticky top-16 z-20 mt-8 w-full border-y border-line bg-canvas/95 px-5 backdrop-blur-md sm:px-8"
      >
        <ul className="mx-auto flex w-full max-w-[90rem] gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <a
                href={`#${tab.id}`}
                className="inline-flex h-10 items-center whitespace-nowrap rounded-full px-4 text-[15px] font-medium text-fg-2 transition-colors hover:bg-white hover:text-fg"
              >
                {tab.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="w-full px-5 pb-16 pt-10 sm:px-8">
        <div className="mx-auto grid w-full max-w-[90rem] gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="flex min-w-0 flex-col gap-12">
            <section
              id="overview"
              aria-label={t("detail.overview")}
              className="scroll-mt-36"
            >
              {kost.description ? (
                <ExpandableText text={kost.description} />
              ) : null}
              <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="rounded-[1.25rem] bg-white p-5"
                  >
                    <dt className="text-sm text-fg-muted">{fact.label}</dt>
                    <dd className="mt-1 text-lg font-semibold tracking-tight text-fg">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <Section id="rooms" title={t("propertyDetail.unitTypes")}>
              {rooms.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {rooms.map((rt) => (
                    <RoomTile
                      key={rt.id}
                      roomTypeId={rt.id}
                      propertyId={kost.id}
                      name={rt.name}
                      propertyName={kost.name}
                      image={rt.images[0] || kost.thumbnail}
                      availableCount={rt.availableCount}
                      totalCount={rt.totalCount}
                      monthlyPrice={monthlyPrice(rt)}
                      whatsappNumber={kost.whatsappNumber}
                      deposit={kost.deposit}
                      tags={[
                        rt.size ? `${rt.size} m²` : null,
                        rt.capacity && rt.capacity !== "—"
                          ? formatCapacity(
                              rt.capacity,
                              locale === "en" ? "en" : "id",
                            )
                          : null,
                      ].filter((v): v is string => Boolean(v))}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-start gap-4 rounded-[1.25rem] bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-base text-fg-2">
                    {t("propertyDetail.noUnitTypes")}
                  </p>
                  <LeadDialog
                    type="waitlist"
                    propertyId={kost.id}
                    propertyName={kost.name}
                    trigger={
                      <button
                        type="button"
                        className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-[15px] font-semibold text-white"
                      >
                        <Icon name="notifications" size={16} />
                        {t("detail.joinWaitlist")}
                      </button>
                    }
                  />
                </div>
              )}
            </Section>

            <Section id="facilities" title={t("detail.facilities")}>
              {kost.facilities.length > 0 ? (
                <ul className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {kost.facilities.map((facility) => (
                    <li
                      key={facility.id}
                      className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-[15px] text-fg"
                    >
                      <Icon
                        name={facility.icon}
                        size={20}
                        className="text-brand"
                      />
                      {facility.name}
                    </li>
                  ))}
                </ul>
              ) : null}
              <IncludedPanel deposit={deposit} />
            </Section>

            <Section id="location" title={t("detail.location")}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="flex items-start gap-2 text-base text-fg-2">
                    <Icon
                      name="location_on"
                      size={18}
                      className="mt-0.5 shrink-0 text-brand"
                    />
                    {address}
                  </p>
                  <a
                    href={directionsUrl(kost.name, address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line-strong bg-white px-4 text-sm font-semibold text-fg hover:border-fg"
                  >
                    <Icon name="near_me" size={16} />
                    {t("detail.directions")}
                  </a>
                </div>
                <PlaceMap
                  name={kost.name}
                  address={address}
                  className="h-[20rem] lg:h-[24rem]"
                />
              </div>
            </Section>

            {kost.rules && kost.rules.length > 0 ? (
              <Section id="rules" title={t("detail.rules")}>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {kost.rules.map((rule) => (
                    <li
                      key={rule}
                      className="flex items-start gap-2 rounded-xl bg-white px-4 py-3 text-[15px] text-fg-2"
                    >
                      <Icon
                        name="check"
                        size={18}
                        className="mt-0.5 shrink-0 text-brand"
                      />
                      {rule}
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}
          </div>

          {/* Sticky booking card */}
          <aside className="lg:sticky lg:top-36 lg:self-start">
            <div className="rounded-[1.25rem] bg-white p-6">
              <p className="text-lg font-semibold tracking-tight text-fg">
                {t("detail.bookingCardTitle")}
              </p>
              {min > 0 ? (
                <p className="mt-4">
                  <span className="block text-sm text-fg-muted">
                    {t("pricing.startingFrom")}
                  </span>
                  <span className="text-[1.75rem] font-medium tracking-tight text-fg tabular-nums">
                    {formatCurrency(min)}
                  </span>
                  <span className="ml-1 text-sm text-fg-muted">
                    {t("pricing.perMonth")}
                  </span>
                </p>
              ) : null}
              {hasInventory ? (
                <div className="mt-4">
                  <p className="mb-2 text-sm text-fg-2">
                    {t("detail.roomsOpenAt", {
                      available: kost.availableRooms,
                      total: kost.totalRooms,
                    })}
                  </p>
                  <div
                    aria-hidden
                    className="h-1.5 overflow-hidden rounded-full bg-hover"
                  >
                    <div
                      className="h-full rounded-full bg-success"
                      style={{
                        width: `${Math.max(openShare, isOpen ? 4 : 0)}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-2">
                <ArrowPill
                  href={viewingUrl}
                  external
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    track("click_whatsapp", {
                      location: "property_booking_card",
                      property: kost.name,
                    })
                  }
                  className="w-full"
                >
                  {t("cta.bookViewing")}
                </ArrowPill>
                {openRoom ? (
                  <WhatsAppInquiryDialog
                    phoneNumber={kost.whatsappNumber}
                    deposit={kost.deposit}
                    propertyName={kost.name}
                    roomName={openRoom.name}
                    propertyId={kost.id}
                    unitTypeId={openRoom.id}
                    variant="compact"
                    label={t("cta.sendInquiry")}
                    className="h-12 w-full justify-center rounded-full border border-line-strong bg-white text-[15px] font-semibold text-fg hover:bg-canvas"
                  />
                ) : (
                  <LeadDialog
                    type="waitlist"
                    propertyId={kost.id}
                    propertyName={kost.name}
                    trigger={
                      <button
                        type="button"
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-line-strong text-[15px] font-semibold text-fg hover:bg-canvas"
                      >
                        <Icon name="notifications" size={16} />
                        {t("detail.joinWaitlist")}
                      </button>
                    }
                  />
                )}
                <a
                  href={`tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`}
                  onClick={() =>
                    track("click_call", { location: "property_booking_card" })
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 text-[15px] font-semibold text-fg-2 hover:text-fg"
                >
                  <Icon name="call" size={16} />
                  {t("detail.call")} {siteConfig.phone}
                </a>
              </div>
              <p className="mt-4 border-t border-hover pt-4 text-sm leading-relaxed text-fg-muted">
                {t("detail.noCharge")} {t("detail.replyHint", { hours })}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </PublicPageShell>
  );
}
