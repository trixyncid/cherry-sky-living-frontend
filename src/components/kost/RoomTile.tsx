/**
 * Room type tile — shared by the homepage carousel and the search grid so a
 * room looks the same everywhere. Live status badge (colour + text), price,
 * size/capacity chips, and a one-tap CTA: booking inquiry when rooms are
 * open, waitlist when full (landing-page-instructions §5.5).
 */

"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { WhatsAppInquiryDialog } from "@/components/kost/WhatsAppInquiryDialog";
import { LeadDialog } from "@/components/leads/LeadDialog";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import type { RoomTypePricing } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";

export interface RoomTileProps {
  roomTypeId: string;
  propertyId: string;
  name: string;
  propertyName: string;
  city?: string;
  image?: string;
  availableCount: number;
  totalCount: number;
  monthlyPrice: number;
  pricings: RoomTypePricing[];
  whatsappNumber: string;
  tags?: string[];
  /** Fixed width for carousels; omit to fill a grid cell. */
  width?: "carousel" | "fill";
}

export function RoomTile({
  roomTypeId,
  propertyId,
  name,
  propertyName,
  city,
  image,
  availableCount,
  totalCount,
  monthlyPrice,
  pricings,
  whatsappNumber,
  tags = [],
  width = "fill",
}: RoomTileProps) {
  const t = useTranslations("home.residences");
  const isOpen = availableCount > 0;
  const href = `/kosts/${propertyId}/${roomTypeId}`;

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-[1.25rem] bg-white p-2 transition-shadow duration-300 hover:shadow-[0_24px_50px_-30px_rgb(20_16_14/0.35)]",
        width === "carousel" && "w-[18rem] shrink-0 snap-start sm:w-[20rem]",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#efeeeb]">
        {image ? (
          <Image
            src={image}
            alt={`${name}, ${propertyName}`}
            fill
            sizes="(max-width: 640px) 100vw, 352px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Icon name="image" size={36} className="text-[#c9c5be]" />
          </div>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#141414]">
          <span
            className={cn(
              "size-1.5 rounded-full",
              isOpen ? "bg-[#059669]" : "bg-[#ba1a1a]",
            )}
          />
          {isOpen
            ? t("availableCount", { count: availableCount })
            : t("fullyBooked")}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-3 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[17px] font-semibold tracking-tight text-[#141414]">
            {/* Stretched link: whole card opens the room; CTA stays clickable */}
            <Link
              href={href}
              className="outline-none after:absolute after:inset-0 after:rounded-[1.25rem] focus-visible:after:ring-2 focus-visible:after:ring-[#71130d]"
              aria-label={t("viewRoom", { name: `${name}, ${propertyName}` })}
            >
              {name}
            </Link>
          </h3>
          {tags.length > 0 ? (
            <ul className="flex shrink-0 gap-1">
              {tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-[#dedad4] px-2.5 py-1 text-xs text-[#6b6b6b]"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <p className="text-sm text-[#6b6b6b]">
          {propertyName}
          {city ? ` • ${city}` : ""}
          {totalCount > 0
            ? ` • ${t("roomsOfTotal", { available: availableCount, total: totalCount })}`
            : ""}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-[#efeeeb] pt-3">
          <p className="whitespace-nowrap text-[17px] font-semibold tracking-tight text-[#141414] tabular-nums">
            {monthlyPrice > 0 ? (
              <>
                {formatCurrency(monthlyPrice)}
                <span className="ml-0.5 text-xs font-normal text-[#6b6b6b]">
                  {t("perMonth")}
                </span>
              </>
            ) : (
              <span className="text-sm font-normal text-[#6b6b6b]">
                {t("noPrice")}
              </span>
            )}
          </p>
          <div className="relative z-10">
            {isOpen ? (
              <WhatsAppInquiryDialog
                phoneNumber={whatsappNumber}
                propertyName={propertyName}
                roomName={name}
                pricings={pricings}
                fallbackPrice={monthlyPrice}
                variant="compact"
                label={t("bookViewing")}
                className="h-10 whitespace-nowrap rounded-full bg-[#71130d] px-4 font-semibold hover:bg-[#8a1a12]"
              />
            ) : (
              <LeadDialog
                type="waitlist"
                propertyId={propertyId}
                propertyName={propertyName}
                unitTypeId={roomTypeId}
                roomName={name}
                trigger={
                  <button
                    type="button"
                    className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#dedad4] px-4 text-sm font-semibold text-[#141414] transition-colors hover:border-[#141414]"
                  >
                    <Icon name="notifications" size={15} />
                    {t("joinWaitlist")}
                  </button>
                }
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
