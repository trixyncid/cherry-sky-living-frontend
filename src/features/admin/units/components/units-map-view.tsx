"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { adminPageIcons } from "@/features/admin/constants/nav-items";
import type { AdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import { UnitDetailSheet } from "@/features/admin/units/components/unit-detail-sheet";
import { UnitRoomTile } from "@/features/admin/units/components/unit-room-tile";
import {
  groupUnitsForMap,
  type PropertyUnitGroup,
} from "@/features/admin/units/lib/group-units-for-map";
import type { Unit } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

interface UnitsMapViewProps {
  units: Unit[];
  lookups: AdminLookups;
  onDelete: (unit: Unit) => void;
  deleteDisabled?: boolean;
  suggestedLeaseStartDate?: string;
}

function BuildingCard({
  group,
  lookups,
  onSelect,
}: {
  group: PropertyUnitGroup;
  lookups: AdminLookups;
  onSelect: (unit: Unit) => void;
}) {
  const t = useTranslations("admin.pages.units");

  return (
    <article className="glass-panel overflow-hidden rounded-2xl">
      <header className="relative overflow-hidden bg-ink px-5 py-5 text-white">
        <div
          className="pointer-events-none absolute -right-10 -top-16 size-40 rounded-full bg-brand/40 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl border border-white/20 bg-white/10 p-2">
                <Icon name={adminPageIcons.properties} size={22} />
              </div>
              <h3 className="truncate text-lg font-semibold tracking-tight">
                {group.propertyName}
              </h3>
            </div>
            {(group.address || group.city) && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-white/80">
                <Icon name="location_on" size={16} />
                <span className="truncate">
                  {[group.address, group.city].filter(Boolean).join(", ")}
                </span>
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <StatPill
              label={t("status.vacant")}
              value={group.stats.vacant}
              className="bg-white/10 text-white"
            />
            <StatPill
              label={t("status.occupied")}
              value={group.stats.occupied}
              className="bg-white/10 text-white"
            />
            <StatPill
              label={t("occupancy")}
              value={`${group.stats.occupancyPct}%`}
              className="bg-brand text-white"
            />
          </div>
        </div>
      </header>

      <div className="space-y-6 p-5">
        {group.floors.map((floorGroup) => (
          <section key={floorGroup.floor ?? "other"}>
            <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">
              <Icon name="layers" size={16} className="text-fg-faint" />
              {floorGroup.floor === null
                ? t("floorOther")
                : t("floorLabel", { floor: floorGroup.floor })}
              <span className="font-normal normal-case text-fg-faint">
                ({floorGroup.units.length})
              </span>
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {floorGroup.units.map((unit) => (
                <UnitRoomTile
                  key={unit.id}
                  unit={unit}
                  lookups={lookups}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}

function StatPill({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg px-2.5 py-1.5 text-center text-xs font-medium backdrop-blur-sm",
        className,
      )}
    >
      <p className="text-[10px] uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}

function MapLegend() {
  const t = useTranslations("admin.pages.units");

  const items = [
    { status: "vacant" as const, dot: "bg-success" },
    { status: "occupied" as const, dot: "bg-ink" },
  ];

  return (
    <div className="glass-panel flex flex-wrap items-center gap-4 rounded-xl px-4 py-3 text-sm text-fg-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
        {t("legend")}
      </span>
      {items.map(({ status, dot }) => (
        <span
          key={status}
          className={cn(
            "inline-flex items-center gap-2",
            status === "occupied" && "font-bold text-danger",
          )}
        >
          <span className={cn("size-2.5 rounded-full", dot)} />
          {t(`status.${status}`)}
        </span>
      ))}
      <span className="hidden text-xs text-fg-faint sm:inline">
        · {t("hoverHint")}
      </span>
    </div>
  );
}

export function UnitsMapView({
  units,
  lookups,
  onDelete,
  deleteDisabled,
  suggestedLeaseStartDate,
}: UnitsMapViewProps) {
  const t = useTranslations("admin.pages.units");
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const propertyGroups = useMemo(
    () => groupUnitsForMap(units, lookups),
    [units, lookups],
  );

  if (propertyGroups.length === 0) {
    return (
      <p className="glass-panel rounded-2xl border-dashed p-10 text-center text-sm text-fg-muted">
        {t("mapEmpty")}
      </p>
    );
  }

  return (
    <>
      <div className="mb-4">
        <MapLegend />
      </div>

      <div className="space-y-8">
        {propertyGroups.map((group) => (
          <BuildingCard
            key={group.propertyId}
            group={group}
            lookups={lookups}
            onSelect={setSelectedUnit}
          />
        ))}
      </div>

      <UnitDetailSheet
        unit={selectedUnit}
        lookups={lookups}
        onClose={() => setSelectedUnit(null)}
        onDelete={(unit) => {
          setSelectedUnit(null);
          onDelete(unit);
        }}
        deleteDisabled={deleteDisabled}
        suggestedLeaseStartDate={suggestedLeaseStartDate}
      />
    </>
  );
}
