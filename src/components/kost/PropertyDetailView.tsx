/**
 * Property detail — dusk-graded photo header with live availability, sticky
 * in-page tabs, photo mosaic, room tiles, facilities + transparent pricing,
 * pinned map, and a sticky booking panel (mobile: floating CTA bar, §5.6).
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
import { ArrowPill } from "@/components/shared/ArrowPill";
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
  index,
  label,
  title,
  accent,
  children,
}: {
  id: string;
  index: number;
  label: string;
  title: string;
  accent?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-36 border-t border-line pt-12"
    >
      <p className="eyebrow flex items-center gap-4 text-fg-muted">
        <span className="tabular-nums text-fg-faint">
          {String(index).padStart(2, "0")}
        </span>
        <span aria-hidden className="h-px w-10 bg-fg/30" />
        {label}
      </p>
      <h2
        id={`${id}-title`}
        className="mb-8 mt-5 text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-fg"
      >
        <span className="block text-balance">{title}</span>
        {accent ? (
          <span className="block text-balance font-normal text-fg/45">
            {accent}
          </span>
        ) : null}
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
  const heroPhoto =
    kost.images[0] || kost.thumbnail || "/assets/cherry-kost.jpeg";

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
      {/* Photo header in the hero's dusk language */}
      <section className="relative isolate w-full overflow-hidden bg-ink text-white">
        <Image
          src={heroPhoto}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(22_16_38/0.9)_0%,rgb(22_16_38/0.65)_45%,rgb(42_31_69/0.3)_100%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgb(22_16_38/0.6)_0%,transparent_30%,rgb(22_16_38/0.85)_100%)]" />

        <div className="mx-auto flex min-h-[min(44rem,88svh)] w-full max-w-[90rem] flex-col px-5 pb-12 pt-24 sm:px-8 lg:px-12 lg:pb-16 lg:pt-28">
          <KostBreadcrumb
            tone="onDark"
            items={[
              crumbs.home,
              crumbs.search,
              crumbs.property(kost.name, kost.id),
            ]}
          />
          <div className="mt-auto pt-16">
            <p className="eyebrow flex items-center gap-4 text-white/75">
              {isOpen ? (
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-bright/70 motion-reduce:animate-none" />
                  <span className="relative inline-flex size-2 rounded-full bg-success-bright" />
                </span>
              ) : (
                <span aria-hidden className="h-px w-10 bg-white/50" />
              )}
              {kost.location.city || t("detail.propertyLabel")}
            </p>
            <h1 className="mt-6 max-w-4xl text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[1] tracking-[-0.04em]">
              <span className="block text-balance">{kost.name}</span>
              {address ? (
                <span className="block text-balance font-normal text-white/55">
                  {address}
                </span>
              ) : null}
            </h1>
            <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px] text-white/80">
              <li className="flex items-center gap-2">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    isOpen
                      ? "bg-success-bright"
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
                <li className="eyebrow text-[10px] text-brand-bright">
                  {t("status.almostFull")}
                </li>
              ) : null}
              {min > 0 ? (
                <li className="tabular-nums">
                  {max > min
                    ? `${formatCurrency(min, { compact: true })} – ${formatCurrency(max, { compact: true })}`
                    : formatCurrency(min, { compact: true })}
                  <span className="text-white/55">{t("pricing.perMonth")}</span>
                </li>
              ) : null}
            </ul>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <ArrowPill
                tone="light"
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
              <ShareButton
                title={kost.name}
                className="h-12 rounded-xl border-transparent bg-transparent px-3 text-[15px] font-medium text-white/80 hover:border-transparent hover:text-white"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sticky in-page tabs */}
      <nav
        aria-label={kost.name}
        className="sticky top-16 z-20 w-full border-b border-line bg-canvas/95 px-5 backdrop-blur-md sm:px-8 lg:px-12"
      >
        <ul className="mx-auto flex w-full max-w-[90rem] gap-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <a
                href={`#${tab.id}`}
                className="eyebrow -mb-px inline-flex h-14 items-center whitespace-nowrap border-b border-transparent text-fg-muted transition-colors hover:border-fg hover:text-fg"
              >
                {tab.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="w-full px-5 pb-24 pt-12 sm:px-8 lg:px-12 lg:pb-32">
        <div className="mx-auto grid w-full max-w-[90rem] gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-16">
          <div className="flex min-w-0 flex-col gap-16">
            <section
              id="overview"
              aria-label={t("detail.overview")}
              className="scroll-mt-36"
            >
              {kost.images.length > 0 ? (
                <ImageGallery
                  images={kost.images}
                  alt={kost.name}
                  variant="mosaic"
                />
              ) : null}
              {kost.description ? (
                <div className="mt-10">
                  <ExpandableText text={kost.description} />
                </div>
              ) : null}
              <dl className="mt-10 grid border-t border-line sm:grid-cols-2 xl:grid-cols-4">
                {facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="border-b border-line py-5 sm:pr-6 xl:border-b-0"
                  >
                    <dt className="eyebrow text-[10px] text-fg-muted">
                      {fact.label}
                    </dt>
                    <dd className="mt-2 text-lg font-semibold tracking-tight text-fg tabular-nums">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <Section
              id="rooms"
              index={1}
              label={t("detail.rooms")}
              title={t("propertyDetail.unitTypes")}
              accent={t("propertyDetail.unitTypesDescription")}
            >
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
                <div className="flex flex-col items-start gap-4 rounded-lg border border-line bg-panel p-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-base text-fg-2">
                    {t("propertyDetail.noUnitTypes")}
                  </p>
                  <LeadDialog
                    type="waitlist"
                    propertyId={kost.id}
                    propertyName={kost.name}
                    trigger={
                      <button type="button" className="btn btn-brand">
                        <Icon name="notifications" size={16} />
                        {t("detail.joinWaitlist")}
                      </button>
                    }
                  />
                </div>
              )}
            </Section>

            <Section
              id="facilities"
              index={2}
              label={t("detail.facilities")}
              title={t("home.amenities.titleLead")}
              accent={t("home.amenities.titleAccent")}
            >
              {kost.facilities.length > 0 ? (
                <ul className="mb-10 grid border-t border-line sm:grid-cols-2 sm:gap-x-8 xl:grid-cols-3">
                  {kost.facilities.map((facility) => (
                    <li
                      key={facility.id}
                      className="flex items-center gap-3 border-b border-line py-4 text-[15px] text-fg"
                    >
                      <Icon
                        name={facility.icon}
                        size={20}
                        className="text-fg-muted"
                      />
                      {facility.name}
                    </li>
                  ))}
                </ul>
              ) : null}
              <IncludedPanel deposit={deposit} />
            </Section>

            <Section
              id="location"
              index={3}
              label={t("detail.location")}
              title={kost.location.city || t("detail.location")}
              accent={address}
            >
              <div className="flex flex-col gap-4">
                <PlaceMap
                  name={kost.name}
                  address={address}
                  className="h-[20rem] lg:h-[26rem]"
                />
                <a
                  href={directionsUrl(kost.name, address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline self-start"
                >
                  {t("detail.directions")}
                  <Icon name="north_east" size={17} />
                </a>
              </div>
            </Section>

            {kost.rules && kost.rules.length > 0 ? (
              <Section
                id="rules"
                index={4}
                label={t("detail.rules")}
                title={t("detail.rules")}
              >
                <ul className="grid border-t border-line sm:grid-cols-2 sm:gap-x-8">
                  {kost.rules.map((rule) => (
                    <li
                      key={rule}
                      className="flex items-start gap-3 border-b border-line py-4 text-[15px] text-fg-2"
                    >
                      <Icon
                        name="check"
                        size={18}
                        className="mt-0.5 shrink-0 text-fg-muted"
                      />
                      {rule}
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}
          </div>

          {/* Sticky booking panel */}
          <aside className="lg:sticky lg:top-36 lg:self-start">
            <div className="rounded-lg border border-line bg-panel p-6">
              <p className="eyebrow flex items-center gap-4 text-fg-muted">
                <span aria-hidden className="h-px w-10 bg-fg/30" />
                {t("detail.bookingCardTitle")}
              </p>
              {min > 0 ? (
                <p className="mt-6">
                  <span className="block text-sm text-fg-muted">
                    {t("pricing.startingFrom")}
                  </span>
                  <span className="text-[2rem] font-semibold tracking-[-0.035em] text-fg tabular-nums">
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
                    className="h-px overflow-hidden bg-line-strong"
                  >
                    <div
                      className="h-full bg-success"
                      style={{
                        width: `${Math.max(openShare, isOpen ? 4 : 0)}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-2">
                <a
                  href={viewingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    track("click_whatsapp", {
                      location: "property_booking_card",
                      property: kost.name,
                    })
                  }
                  className="btn btn-brand w-full"
                >
                  {t("cta.bookViewing")}
                  <Icon name="north_east" size={17} />
                </a>
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
                    className="btn btn-outline w-full bg-transparent px-6 text-[15px] text-fg hover:bg-fg hover:text-white"
                  />
                ) : (
                  <LeadDialog
                    type="waitlist"
                    propertyId={kost.id}
                    propertyName={kost.name}
                    trigger={
                      <button type="button" className="btn btn-outline w-full">
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
              <p className="mt-4 border-t border-line pt-4 text-sm leading-relaxed text-fg-muted">
                {t("detail.noCharge")} {t("detail.replyHint", { hours })}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </PublicPageShell>
  );
}
