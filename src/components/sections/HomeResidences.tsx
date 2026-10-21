/**
 * Available rooms — horizontal, snap-scrolling carousel of every room type
 * (available first, then cheapest). Status, counts and prices are live;
 * each card has a one-tap CTA (viewing via WhatsApp, or waitlist when full).
 */

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { RoomTile } from "@/components/kost/RoomTile";
import { LeadDialog } from "@/components/leads/LeadDialog";
import { HomeSectionHeading } from "@/components/sections/HomeSectionHeading";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import { track } from "@/lib/analytics";
import { getContactWhatsAppNumber } from "@/lib/contact";
import type { Kost, RoomType } from "@/lib/types";
import { formatCapacity } from "@/lib/utils/format";

interface Pick {
  roomType: RoomType;
  kost: Kost;
}

function rankRoomTypes(kosts: Kost[]): Pick[] {
  return kosts
    .flatMap((kost) => kost.roomTypes.map((roomType) => ({ roomType, kost })))
    .filter((item) => item.roomType.totalCount > 0)
    .sort((a, b) => {
      const aOpen = a.roomType.availableCount > 0 ? 0 : 1;
      const bOpen = b.roomType.availableCount > 0 ? 0 : 1;
      if (aOpen !== bOpen) return aOpen - bOpen;
      return (a.roomType.price || Infinity) - (b.roomType.price || Infinity);
    });
}

function roomTags(roomType: RoomType, locale: string): string[] {
  const capacity =
    roomType.capacity && roomType.capacity !== "—"
      ? formatCapacity(roomType.capacity, locale === "en" ? "en" : "id")
      : null;
  return [roomType.size ? `${roomType.size} m²` : null, capacity].filter(
    Boolean,
  ) as string[];
}

function monthlyPrice(roomType: RoomType): number {
  const monthly = roomType.pricings?.find((p) => p.durationDays === 30);
  return monthly?.price ?? roomType.price;
}

interface HomeResidencesProps {
  kosts?: Kost[];
  isLoading?: boolean;
}

export function HomeResidences({
  kosts = [],
  isLoading = false,
}: HomeResidencesProps) {
  const t = useTranslations("home.residences");
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const picks = rankRoomTypes(kosts);
  const allFull =
    !isLoading &&
    picks.length > 0 &&
    picks.every((p) => p.roomType.availableCount === 0);

  // §10 view_room_list: fire once when the room list enters the viewport.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          track("view_room_list", { location: "home" });
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scrollBy = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      id="properties"
      aria-labelledby="residences-heading"
      className="w-full scroll-mt-20 py-12 lg:py-16"
    >
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-6 px-5 sm:px-8 lg:gap-8">
        <HomeSectionHeading
          id="residences-heading"
          eyebrow={t("eyebrow")}
          titleLead={t("titleLead")}
          titleAccent={t("titleAccent")}
          aside={
            <>
              <p className="text-base leading-relaxed text-fg-muted">
                {t("description")}
              </p>
              <div className="flex items-center justify-between gap-4">
                <Link
                  href="/search-kosts"
                  className="group inline-flex items-center gap-1.5 text-[15px] font-semibold text-fg"
                >
                  {t("browseAll")}
                  <Icon
                    name="north_east"
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Link>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => scrollBy(-1)}
                    aria-label={t("prev")}
                    className="flex size-10 items-center justify-center rounded-full bg-white text-fg transition-colors hover:bg-brand hover:text-white"
                  >
                    <Icon name="arrow_back" size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollBy(1)}
                    aria-label={t("next")}
                    className="flex size-10 items-center justify-center rounded-full bg-white text-fg transition-colors hover:bg-brand hover:text-white"
                  >
                    <Icon name="arrow_forward" size={18} />
                  </button>
                </div>
              </div>
            </>
          }
        />
      </div>

      <div
        ref={trackRef}
        // scroll-padding matches the side padding so the first card is already
        // "snapped" on load (otherwise the browser self-scrolls, which also
        // suppresses LCP reporting).
        className="mt-6 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto scroll-smooth px-5 pb-2 [scrollbar-width:none] sm:scroll-px-8 sm:px-8 lg:scroll-px-[max(2rem,calc((100vw-90rem)/2+2rem))] lg:px-[max(2rem,calc((100vw-90rem)/2+2rem))] [&::-webkit-scrollbar]:hidden"
      >
        {isLoading
          ? [0, 1, 2, 3].map((i) => (
              <div
                key={i}
                aria-hidden
                className="h-[26rem] w-[19rem] shrink-0 animate-pulse rounded-[1.25rem] bg-white sm:w-[22rem]"
              />
            ))
          : picks.map(({ roomType, kost }) => (
              <RoomTile
                key={roomType.id}
                width="carousel"
                roomTypeId={roomType.id}
                propertyId={kost.id}
                name={roomType.name}
                propertyName={kost.name}
                city={kost.location.city}
                image={roomType.images[0] || kost.thumbnail}
                availableCount={roomType.availableCount}
                totalCount={roomType.totalCount}
                monthlyPrice={monthlyPrice(roomType)}
                deposit={kost.deposit}
                whatsappNumber={
                  kost.whatsappNumber || getContactWhatsAppNumber()
                }
                tags={roomTags(roomType, locale)}
              />
            ))}
      </div>

      {!isLoading && (picks.length === 0 || allFull) ? (
        <div className="mx-auto mt-6 w-full max-w-[90rem] px-5 sm:px-8">
          <div className="flex flex-col items-start gap-4 rounded-[1.25rem] bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-fg">{t("emptyTitle")}</p>
              <p className="mt-1 text-base text-fg-muted">
                {t("emptyDescription")}
              </p>
            </div>
            <LeadDialog
              type="waitlist"
              kosts={kosts}
              trigger={
                <button
                  type="button"
                  className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-brand px-6 text-[15px] font-semibold text-white"
                >
                  <Icon name="notifications" size={18} />
                  {t("emptyCta")}
                </button>
              }
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
