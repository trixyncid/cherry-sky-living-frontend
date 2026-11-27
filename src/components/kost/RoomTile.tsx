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
  whatsappNumber: string;
  /** The property's refundable deposit (Rp), when set. */
  deposit?: number;
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
  whatsappNumber,
  deposit,
  tags = [],
  width = "fill",
}: RoomTileProps) {
  const t = useTranslations("home.residences");
  const isOpen = availableCount > 0;
  const href = `/kosts/${propertyId}/${roomTypeId}`;

  return (
    <article
      className={cn(
        "group relative flex flex-col",
        width === "carousel" && "w-[18rem] shrink-0 snap-start sm:w-[20rem]",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-hover">
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
            <Icon name="image" size={36} className="text-fg-faint" />
          </div>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1 text-xs font-medium text-fg">
          <span
            className={cn(
              "size-1.5 rounded-full",
              isOpen ? "bg-success" : "bg-danger",
            )}
          />
          {isOpen
            ? t("availableCount", { count: availableCount })
            : t("fullyBooked")}
        </span>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <p className="eyebrow text-[10px] text-fg-muted">
          {propertyName}
          {city ? ` · ${city}` : ""}
        </p>
        <h3 className="mt-2 text-base font-medium tracking-tight text-fg">
          {/* Stretched link: whole card opens the room; CTA stays clickable */}
          <Link
            href={href}
            className="outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-brand"
            aria-label={t("viewRoom", { name: `${name}, ${propertyName}` })}
          >
            {name}
          </Link>
        </h3>
        <p className="mb-4 mt-1 text-sm text-fg-muted">
          {[
            ...tags,
            totalCount > 0
              ? t("roomsOfTotal", {
                  available: availableCount,
                  total: totalCount,
                })
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line pt-4">
          <p className="whitespace-nowrap text-base font-semibold tracking-tight text-fg tabular-nums">
            {monthlyPrice > 0 ? (
              <>
                {formatCurrency(monthlyPrice)}
                <span className="ml-0.5 text-xs font-normal text-fg-muted">
                  {t("perMonth")}
                </span>
              </>
            ) : (
              <span className="text-sm font-normal text-fg-muted">
                {t("noPrice")}
              </span>
            )}
          </p>
          <div className="relative z-10">
            {isOpen ? (
              <WhatsAppInquiryDialog
                phoneNumber={whatsappNumber}
                deposit={deposit}
                propertyName={propertyName}
                roomName={name}
                propertyId={propertyId}
                unitTypeId={roomTypeId}
                variant="compact"
                label={t("bookViewing")}
                className="h-10 whitespace-nowrap rounded-lg bg-brand px-4 hover:bg-brand-hover"
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
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line-strong px-4 text-sm font-medium text-fg transition-colors hover:border-fg"
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
