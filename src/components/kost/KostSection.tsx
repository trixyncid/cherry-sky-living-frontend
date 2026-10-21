/**
 * Kost Section Component
 * Displays a complete kost property with all its room types
 */

"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { Badge } from "@/components/ui/badge";
import type { Kost } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RoomTypeCard } from "./RoomTypeCard";

interface KostSectionProps {
  kost: Kost;
  showFacilities?: boolean;
}

export function KostSection({ kost, showFacilities = true }: KostSectionProps) {
  const t = useTranslations();
  const isAlmostFull = kost.availableRooms > 0 && kost.availableRooms <= 3;

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="flex flex-col gap-8"
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex-1">
          {/* Featured Badge */}
          {kost.isFeatured && (
            <div className="flex items-center gap-2 mb-3">
              <Icon name="star" className="text-[#d4af37]" size={20} filled />
              <span className="text-xs font-bold text-[#d4af37] uppercase tracking-widest">
                {t("property.flagship")}
              </span>
            </div>
          )}

          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {kost.name}
          </h2>

          {/* Description and Location */}
          <div className="mt-3 space-y-2">
            <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 font-light">
              {kost.description}
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Icon name="location_on" size={16} className="text-primary" />
              <span>{kost.location.address}</span>
              {kost.location.nearbyLandmark && (
                <>
                  <span>•</span>
                  <span className="font-medium text-primary">
                    {kost.location.nearbyLandmark}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tags and Status */}
        <div className="flex flex-wrap gap-2">
          {kost.location.nearbyLandmark && (
            <Badge variant="secondary" className="px-3 py-1">
              <Icon name="school" size={14} className="mr-1.5" />
              {kost.location.nearbyLandmark}
            </Badge>
          )}
          {kost.highlights.slice(0, 2).map((highlight, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-primary/80"
            >
              {highlight}
            </Badge>
          ))}
          {isAlmostFull && (
            <Badge className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <Icon name="schedule" size={14} className="mr-1.5" />
              {t("status.almostFull")}
            </Badge>
          )}
        </div>
      </div>

      {/* Room Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8">
        {kost.roomTypes.map((roomType, index) => (
          <RoomTypeCard
            key={roomType.id}
            roomType={roomType}
            kostName={kost.name}
            kostId={kost.id}
            whatsappNumber={kost.whatsappNumber}
            index={index}
          />
        ))}
      </div>
    </motion.section>
  );
}
