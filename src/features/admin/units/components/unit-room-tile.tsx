"use client";

import { useTranslations } from "next-intl";
import { memo } from "react";
import { Icon } from "@/components/shared/Icon";
import { adminPageIcons } from "@/features/admin/constants/nav-items";
import type { AdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import {
  resolveUnitTenantLabel,
  resolveUnitTypeNameForUnit,
} from "@/features/admin/lib/entity-display";
import { isUnitOccupied, type Unit, type UnitStatus } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

const tileStyles: Record<
  UnitStatus,
  { tile: string; dot: string; icon: string }
> = {
  vacant: {
    tile: "border-line bg-panel hover:border-success/50 hover:shadow-[0_8px_20px_-12px_rgb(11_11_13/0.25)]",
    dot: "bg-success",
    icon: "text-success",
  },
  occupied: {
    tile: "border-ink bg-ink hover:border-brand hover:shadow-[0_8px_20px_-10px_rgb(122_22_48/0.55)]",
    dot: "bg-brand-bright",
    icon: "text-white/60",
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
          "flex w-full flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2",
          styles.tile,
        )}
        aria-label={t("roomAria", {
          name: unit.name,
          status: t(`status.${status}`),
        })}
      >
        <div className="flex w-full items-center justify-between gap-2">
          <Icon name={adminPageIcons.units} size={18} className={styles.icon} />
          <span
            className={cn("size-2 shrink-0 rounded-full", styles.dot)}
            aria-hidden
          />
        </div>
        <div className="min-w-0 w-full">
          <p
            className={cn(
              "truncate text-sm font-semibold",
              occupied ? "text-white" : "text-fg",
            )}
          >
            {unit.name}
          </p>
          <p
            className={cn(
              "truncate text-xs",
              occupied ? "text-white/60" : "text-fg-muted",
            )}
          >
            {unitType}
          </p>
        </div>
      </button>

      <div
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-52 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 sm:block"
        role="tooltip"
      >
        <div className="glass-overlay rounded-xl p-3">
          <p className="text-sm font-semibold text-fg">{unit.name}</p>
          <p className="mt-0.5 text-xs text-fg-muted">{unitType}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className={cn("size-1.5 rounded-full", styles.dot)} />
            <span
              className={cn(
                "capitalize",
                occupied ? "font-semibold text-fg" : "font-medium text-success",
              )}
            >
              {t(`status.${status}`)}
            </span>
          </div>
          {occupied && tenant !== "—" && (
            <p className="mt-2 truncate text-xs text-fg-2">
              <span className="text-fg-muted">{t("tenant")}: </span>
              {tenant}
            </p>
          )}
          <p className="mt-2 text-[10px] text-fg-faint">
            {t("clickForDetails")}
          </p>
        </div>
      </div>
    </div>
  );
});
