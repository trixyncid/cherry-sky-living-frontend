/**
 * Kost Grid Component
 * Estoria-style property cards with Details + inquiry CTAs
 */

"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import { PropertyImageCarousel } from "@/components/kost/PropertyImageCarousel";
import type { Kost, SearchFilters } from "@/lib/types";
import { formatCurrency, generateWhatsAppURL } from "@/lib/utils/format";

interface KostGridProps {
  kosts: Kost[];
  filters: SearchFilters;
  isLoading?: boolean;
  error?: Error | null;
}

export function KostGrid({ kosts, isLoading, error }: KostGridProps) {
  const t = useTranslations();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-80 animate-pulse rounded-[1.5rem] bg-[#efe8e0]"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center px-6 py-20"
      >
        <div className="max-w-md text-center">
          <Icon
            name="error_outline"
            size={64}
            className="mx-auto mb-4 text-[#d5c3b8]"
          />
          <h3 className="mb-2 text-2xl font-bold text-[#1a1c1a]">
            {t("common.error")}
          </h3>
          <p className="text-sm text-[#83746b]">
            {error.message || t("search.tryDifferentFilters")}
          </p>
        </div>
      </motion.div>
    );
  }

  if (kosts.length === 0) {
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
      className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      {kosts.map((kost) => {
        const inquiryUrl = generateWhatsAppURL(
          kost.whatsappNumber,
          t("whatsapp.inquiry", { propertyName: kost.name }),
        );

        return (
          <motion.div key={kost.id} variants={item} className="group">
            <article className="glass-card flex h-full flex-col overflow-hidden rounded-[1.5rem] transition-all duration-300 hover:-translate-y-1">
              <div className="relative">
                <PropertyImageCarousel
                  images={
                    kost.images.length > 0
                      ? kost.images
                      : kost.thumbnail
                        ? [kost.thumbnail]
                        : []
                  }
                  alt={kost.name}
                  href={`/kosts/${kost.id}`}
                />
                <div className="pointer-events-none absolute left-3 top-3 z-10">
                  <span className="rounded-full bg-[#1a130f]/75 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                    {t("propertyDetail.availableRooms", {
                      available: kost.availableRooms,
                      total: kost.totalRooms,
                    })}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-5">
                <div>
                  <h3 className="mb-1 line-clamp-1 text-lg font-bold text-[#1a1c1a] group-hover:text-[#6f4627]">
                    {kost.name}
                  </h3>
                  <p className="flex items-start gap-1 text-sm text-[#83746b]">
                    <Icon
                      name="location_on"
                      size={14}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="line-clamp-2">
                      {kost.location.address}
                      {kost.location.city ? `, ${kost.location.city}` : ""}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-[#83746b]">
                  {kost.roomTypes.slice(0, 2).map((roomType) => (
                    <span
                      key={roomType.id}
                      className="inline-flex items-center gap-1"
                    >
                      <Icon name="bed" size={14} />
                      {roomType.name}
                    </span>
                  ))}
                  {kost.facilities[0] ? (
                    <span className="inline-flex items-center gap-1">
                      <Icon
                        name={kost.facilities[0].icon || "check"}
                        size={14}
                      />
                      {kost.facilities[0].name}
                    </span>
                  ) : null}
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#eee4db] pt-4">
                  <div>
                    {kost.priceRange.min > 0 ? (
                      <>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#83746b]">
                          {t("pricing.startingFrom")}
                        </p>
                        <p className="text-lg font-bold text-[#1a1c1a]">
                          {formatCurrency(kost.priceRange.min)}
                          <span className="text-xs font-normal text-[#83746b]">
                            {t("pricing.perMonth")}
                          </span>
                        </p>
                      </>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {kost.availableRooms > 0 ? (
                      <a
                        href={inquiryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d5c3b8] bg-white text-[#25D366] hover:border-[#25D366]/40 hover:bg-[#f4fbf6]"
                        aria-label={t("cta.sendInquiry")}
                      >
                        <Icon name="whatsapp" size={16} />
                      </a>
                    ) : null}
                    <Link
                      href={`/kosts/${kost.id}`}
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
