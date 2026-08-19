"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import type { AdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import {
  resolveUnitTenantLabel,
  resolveUnitTypeNameForUnit,
} from "@/features/admin/lib/entity-display";
import { cn } from "@/lib/utils";
import { isUnitOccupied, type Unit, type UnitStatus } from "@/lib/types/admin";

const tileStyles: Record<UnitStatus, { tile: string; dot: string; icon: string }> =
  {
    vacant: {
      tile: "border-emerald-300/40 bg-gradient-to-br from-emerald-50/70 via-white/40 to-white/20 backdrop-blur-md hover:border-emerald-400/70 hover:shadow-[0_8px_24px_-10px_rgba(16,185,129,0.4)]",
      dot: "bg-emerald-500",
      icon: "text-emerald-600/70",
    },
    occupied: {
      tile: "border-red-300/40 bg-gradient-to-br from-red-50/70 via-white/40 to-white/20 backdrop-blur-md hover:border-red-400/70 hover:shadow-[0_8px_24px_-10px_rgba(220,38,38,0.35)]",
      dot: "bg-red-600",
      icon: "text-red-600/80",
    },
  };

interface UnitRoomTileProps {
  unit: Unit;
  lookups: AdminLookups;
  onSelect: (unit: Unit) => void;
}

export const UnitRoomTile = memo(function UnitRoomTile({
  unit,
  lookups,
  onSelect,
}: UnitRoomTileProps) {
  const t = useTranslations("admin.pages.units");
  const status = unit.status.toLowerCase() as UnitStatus;
  const styles = tileStyles[status] ?? tileStyles.vacant;
  const unitType = resolveUnitTypeNameForUnit(unit, lookups);
  const tenant = resolveUnitTenantLabel(unit);
  const occupied = isUnitOccupied(status);

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => onSelect(unit)}
        className={cn(
          "flex w-full flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5e3c]/40 focus-visible:ring-offset-2",
          styles.tile,
        )}
        aria-label={t("roomAria", { name: unit.name, status: t(`status.${status}`) })}
      >
        <div className="flex w-full items-center justify-between gap-2">
          <Icon name="door_front" size={18} className={styles.icon} />
          <span
            className={cn("size-2 shrink-0 rounded-full", styles.dot)}
            aria-hidden
          />
        </div>
        <div className="min-w-0 w-full">
          <p className="truncate text-sm font-semibold text-[#1a1c1a]">
            {unit.name}
          </p>
          <p className="truncate text-xs text-[#83746b]">{unitType}</p>
        </div>
      </button>

      <div
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-52 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 sm:block"
        role="tooltip"
      >
        <div className="glass-panel-strong rounded-xl p-3">
          <p className="text-sm font-semibold text-[#1a1c1a]">{unit.name}</p>
          <p className="mt-0.5 text-xs text-[#83746b]">{unitType}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className={cn("size-1.5 rounded-full", styles.dot)} />
            <span
              className={cn(
                "capitalize",
                occupied
                  ? "font-bold text-[#ba1a1a]"
                  : "font-medium text-[#51443c]",
              )}
            >
              {t(`status.${status}`)}
            </span>
          </div>
          {occupied && tenant !== "—" && (
            <p className="mt-2 truncate text-xs text-[#51443c]">
              <span className="text-[#83746b]">{t("tenant")}: </span>
              {tenant}
            </p>
          )}
          <p className="mt-2 text-[10px] text-[#a89b92]">{t("clickForDetails")}</p>
        </div>
      </div>
    </div>
  );
});
