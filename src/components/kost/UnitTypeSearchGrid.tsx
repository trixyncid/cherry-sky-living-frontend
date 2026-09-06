/**
 * Unit Type Search Grid
 * Estoria-style room type cards with Details + WhatsApp inquiry
 */

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { WhatsAppInquiryDialog } from "@/components/kost/WhatsAppInquiryDialog";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import type { SearchUnitTypeResult } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";

interface UnitTypeSearchGridProps {
  unitTypes: SearchUnitTypeResult[];
  isLoading?: boolean;
}

function getDurationLabel(
  durationDays: number,
  t: ReturnType<typeof useTranslations>,
): string {
  const known: Record<number, string> = {
    7: t("search.duration7"),
    12: t("search.duration12"),
    30: t("search.duration30"),
  };
  return (
    known[durationDays] ?? t("search.durationDaysCount", { days: durationDays })
  );
}

export function UnitTypeSearchGrid({
  unitTypes,
  isLoading,
}: UnitTypeSearchGridProps) {
  const t = useTranslations();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-72 animate-pulse rounded-[1.5rem] bg-[#efe8e0]"
          />
        ))}
      </div>
    );
  }

  if (unitTypes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center px-6 py-20"
      >
        <div className="max-w-md text-center">
          <Icon
            name="search_off"
            size={64}
            className="mx-auto mb-4 text-[#d5c3b8]"
          />
          <h3 className="mb-2 text-2xl font-bold text-[#1a1c1a]">
            {t("search.noResults")}
          </h3>
          <p className="text-sm text-[#83746b]">
            {t("search.tryDifferentFilters")}
          </p>
        </div>
      </motion.div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      {unitTypes.map((unitType) => {
        const detailUrl = `/kosts/${unitType.propertyId}/${unitType.id}`;
        const minPrice =
          unitType.minPrice > 0
            ? unitType.minPrice
            : (unitType.pricings[0]?.price ?? 0);

        return (
          <motion.div
            key={`${unitType.propertyId}-${unitType.id}`}
            variants={item}
            className="group"
          >
            <article className="glass-card flex h-full flex-col overflow-hidden rounded-[1.5rem] transition-all duration-300 hover:-translate-y-1">
              <Link href={detailUrl} className="block">
                <div className="relative h-44 w-full overflow-hidden bg-[#f5e4d4]">
                  {unitType.thumbnail ? (
                    <Image
                      src={unitType.thumbnail}
                      alt={unitType.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Icon name="image" size={48} className="text-[#c4b5a8]" />
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3">
                    {unitType.availableCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1a130f]/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                        <span className="h-1.5 w-1.5 rounded-full bg-status-vacant" />
                        {t("search.unitsAvailable", {
                          count: unitType.availableCount,
                        })}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1a130f]/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                        <span className="h-1.5 w-1.5 rounded-full bg-status-occupied" />
                        {t("status.full")}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              <div className="flex flex-1 flex-col gap-2 p-4">
                <div>
                  <h3 className="mb-1 line-clamp-1 text-lg font-bold text-[#1a1c1a]">
                    {unitType.name}
                  </h3>
                  <p className="flex items-start gap-1 text-sm text-[#83746b]">
                    <Icon
                      name="apartment"
                      size={14}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="line-clamp-1">
                      {unitType.propertyName}
                      {unitType.city ? ` · ${unitType.city}` : ""}
                    </span>
                  </p>
                </div>

                {unitType.pricings.length > 0 ? (
                  <p className="text-xs text-[#83746b]">
                    {getDurationLabel(unitType.pricings[0].durationDays, t)}
                  </p>
                ) : null}

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#eee4db] pt-3">
                  <p className="text-lg font-bold text-[#1a1c1a]">
                    {minPrice > 0
                      ? formatCurrency(minPrice)
                      : t("search.noPricing")}
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    {unitType.availableCount > 0 ? (
                      <WhatsAppInquiryDialog
                        phoneNumber={unitType.whatsappNumber}
                        propertyName={unitType.propertyName}
                        roomName={unitType.name}
                        pricings={unitType.pricings}
                        fallbackPrice={unitType.minPrice}
                        variant="icon"
                      />
                    ) : (
                      <span className="rounded-full border border-status-occupied/20 bg-status-occupied/10 px-3 py-2 text-xs font-semibold text-status-occupied">
                        {t("status.full")}
                      </span>
                    )}
                    <Link
                      href={detailUrl}
                      className="inline-flex h-9 items-center rounded-full bg-[#6f4627] px-4 text-xs font-semibold text-white hover:bg-[#805533]"
                    >
                      {t("cta.viewDetails")}
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
