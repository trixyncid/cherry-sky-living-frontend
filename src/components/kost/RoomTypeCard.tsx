/**
 * Room Type Card — compact row for comparing unit types at a glance
 */

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { WhatsAppInquiryDialog } from "@/components/kost/WhatsAppInquiryDialog";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import type { RoomTypeCardProps } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatCapacity, formatCurrency } from "@/lib/utils/format";
import { getDurationLabel } from "@/lib/utils/kost-display";

export function RoomTypeCard({
  roomType,
  kostName,
  kostId,
  whatsappNumber,
  index = 0,
}: RoomTypeCardProps & { index?: number; kostId?: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const isAvailable =
    roomType.status === "available" && roomType.availableCount > 0;

  const detailHref = kostId ? `/kosts/${kostId}/${roomType.id}` : null;

  const pricingRows =
    roomType.pricings && roomType.pricings.length > 0
      ? roomType.pricings
      : roomType.price > 0
        ? [{ id: roomType.id, durationDays: 30, price: roomType.price }]
        : [];

  const startingPricing =
    pricingRows.find((pricing) => pricing.durationDays === 30) ??
    pricingRows[0];

  const image = (
    <div className="relative h-36 w-full overflow-hidden bg-brand-soft sm:h-full sm:min-h-[8.75rem] sm:w-[9.5rem] lg:w-40">
      {roomType.images?.[0] ? (
        <Image
          src={roomType.images[0]}
          alt={roomType.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Icon name="image" size={32} className="text-fg-faint" />
        </div>
      )}

      <div className="absolute bottom-2 left-2">
        {isAvailable ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-status-vacant" />
            {t("propertyDetail.availableRooms", {
              available: roomType.availableCount,
              total: roomType.totalCount,
            })}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-status-occupied" />
            {t("status.full")}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
    >
      <article
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-2xl glass-card transition-all duration-300 sm:flex-row sm:items-stretch",
          "hover:-translate-y-0.5",
          !isAvailable && "opacity-80",
        )}
      >
        {detailHref ? (
          <Link href={detailHref} className="block shrink-0 sm:self-stretch">
            {image}
          </Link>
        ) : (
          <div className="shrink-0 sm:self-stretch">{image}</div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-1.5 px-4 py-3">
            {detailHref ? (
              <Link href={detailHref}>
                <h3 className="line-clamp-1 text-base font-bold text-fg transition-colors group-hover:text-brand">
                  {roomType.name}
                </h3>
              </Link>
            ) : (
              <h3 className="line-clamp-1 text-base font-bold text-fg">
                {roomType.name}
              </h3>
            )}

            {roomType.description ? (
              <p className="line-clamp-1 text-xs leading-relaxed text-fg-muted">
                {roomType.description}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
              {roomType.size != null && (
                <span className="inline-flex items-center gap-1">
                  <Icon name="square_foot" size={13} />
                  {roomType.size} m²
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Icon name="group" size={13} />
                {formatCapacity(
                  roomType.capacity,
                  locale === "en" ? "en" : "id",
                )}
              </span>
            </div>

            {startingPricing ? (
              <p className="mt-auto pt-1">
                <span className="text-sm font-bold text-fg">
                  {formatCurrency(startingPricing.price)}
                </span>
                <span className="ml-1 text-[11px] text-fg-muted">
                  {getDurationLabel(startingPricing.durationDays, t)}
                </span>
              </p>
            ) : (
              <p className="mt-auto pt-1 text-xs text-fg-muted">
                {t("search.noPricing")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-line px-4 py-2.5">
            {detailHref ? (
              <Link
                href={detailHref}
                className="flex items-center justify-center gap-1.5 rounded-full bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-deep"
              >
                <Icon name="visibility" size={14} />
                {t("cta.viewDetails")}
              </Link>
            ) : (
              <span className="flex items-center justify-center gap-1.5 rounded-full bg-brand px-3 py-2 text-xs font-semibold text-white">
                <Icon name="visibility" size={14} />
                {t("cta.viewDetails")}
              </span>
            )}
            {isAvailable ? (
              <WhatsAppInquiryDialog
                phoneNumber={whatsappNumber}
                propertyName={kostName}
                roomName={roomType.name}
                variant="compact"
                className="h-full w-full justify-center rounded-full px-3 py-2 text-xs font-semibold"
              />
            ) : (
              <span className="flex items-center justify-center rounded-full bg-hover px-3 py-2 text-xs font-semibold text-fg-muted">
                {t("status.full")}
              </span>
            )}
          </div>
        </div>
      </article>
    </motion.div>
  );
}
