/**
 * Facility List Component
 * Displays facilities with icons in different layouts
 */

"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { Badge } from "@/components/ui/badge";
import type { FacilityListProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FacilityList({
  facilities,
  variant = "grid",
  showCategory = false,
  highlightPremium = true,
}: FacilityListProps) {
  const t = useTranslations();

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap gap-2">
        {facilities.slice(0, 6).map((facility) => (
          <Badge
            key={facility.id}
            variant="secondary"
            className="flex items-center gap-1.5 px-3 py-1"
          >
            <Icon name={facility.icon} size={16} />
            <span className="text-xs">{facility.name}</span>
          </Badge>
        ))}
        {facilities.length > 6 && (
          <Badge variant="outline" className="px-3 py-1">
            <span className="text-xs">+{facilities.length - 6} lainnya</span>
          </Badge>
        )}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {facilities.map((facility) => (
          <div
            key={facility.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full",
                facility.isPremium
                  ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
              )}
            >
              <Icon name={facility.icon} size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {facility.name}
              </p>
              {facility.detail && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {facility.detail}
                </p>
              )}
            </div>
            {highlightPremium && facility.isHighlight && (
              <Badge className="bg-[#d4af37] text-white text-xs shrink-0">
                {t("property.premium")}
              </Badge>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Grid variant (default) - Refactored for Sleek Look
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {facilities.map((facility) => (
        <div
          key={facility.id}
          className={cn(
            "flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300",
            facility.isPremium
              ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30"
              : "bg-white/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800",
            "hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-200/50 hover:scale-[1.02] hover:-translate-y-1",
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl mb-3 transition-colors",
              facility.isPremium
                ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                : "bg-slate-100 text-primary dark:bg-slate-800 dark:text-primary/80 group-hover:bg-primary group-hover:text-white",
            )}
          >
            <Icon name={facility.icon} size={24} />
          </div>

          <h4 className="font-semibold text-sm text-slate-800 dark:text-white text-center">
            {facility.name}
          </h4>

          {facility.detail && (
            <p className="text-xs text-slate-400 text-center mt-1">
              {facility.detail}
            </p>
          )}

          {facility.isPremium && (
            <span className="mt-2 text-[10px] uppercase font-bold text-amber-500 bg-amber-100 px-2 py-0.5 rounded-full">
              Premium
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
