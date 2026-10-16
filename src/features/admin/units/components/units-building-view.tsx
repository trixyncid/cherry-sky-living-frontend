"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import type { AdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import {
  resolveUnitTenantLabel,
  resolveUnitTypeNameForUnit,
} from "@/features/admin/lib/entity-display";
import { Segmented } from "@/features/admin/overview/dashboard-widgets";
import { Building3D } from "@/features/admin/units/components/building-3d";
import { UnitDetailSheet } from "@/features/admin/units/components/unit-detail-sheet";
import {
  type BuildingFloor,
  buildLayout,
  type RoomVisual,
} from "@/features/admin/units/lib/building-layout";
import { isUnitOccupied, type Unit } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

type FloorKey = number | "other" | null;

interface UnitsBuildingViewProps {
  /** Every unit in scope — the building is always drawn whole. */
  units: Unit[];
  /** Units matching search/availability; others are ghosted. null = all. */
  matchingIds: Set<string> | null;
  /** Availability search: matching rooms are free for the chosen dates. */
  availabilityMode?: boolean;
  lookups: AdminLookups;
  onDelete: (unit: Unit) => void;
  deleteDisabled?: boolean;
  suggestedLeaseStartDate?: string;
}

const TILE: Record<RoomVisual, string> = {
  vacant: "border-[#bfe0c3] bg-[#eef8ec] text-[#1f5a2a] hover:border-[#7fb98a]",
  occupied:
    "border-[#ead0cc] bg-[#fbf1ef] text-[#71130d] hover:border-[#c97f76]",
  ghost: "border-[#eee8e6] bg-[#faf8f7] text-[#a39b95] hover:border-[#ddd3d0]",
};

const DOT: Record<RoomVisual, string> = {
  vacant: "bg-[#3f9a52]",
  occupied: "bg-[#71130d]",
  ghost: "bg-[#d6ccc9]",
};

export function UnitsBuildingView({
  units,
  matchingIds,
  availabilityMode = false,
  lookups,
  onDelete,
  deleteDisabled,
  suggestedLeaseStartDate,
}: UnitsBuildingViewProps) {
  const t = useTranslations("admin.pages.units");
  const tb = useTranslations("admin.pages.units.building");

  const properties = useMemo(() => {
    const byId = new Map<string, Unit[]>();
    for (const u of units) {
      const list = byId.get(u.propertyId);
      if (list) list.push(u);
      else byId.set(u.propertyId, [u]);
    }
    return [...byId.entries()]
      .map(([id, list]) => {
        const property = lookups.propertyById.get(id);
        const occupied = list.filter((u) => isUnitOccupied(u.status)).length;
        return {
          id,
          name: property?.name ?? list[0]?.property?.name ?? "—",
          address: [property?.address, property?.city]
            .filter(Boolean)
            .join(", "),
          units: list,
          occupied,
          vacant: list.length - occupied,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [units, lookups]);

  const [propertyId, setPropertyId] = useState<string>("");
  const property =
    properties.find((p) => p.id === propertyId) ?? properties[0] ?? null;

  const [floorKey, setFloorKey] = useState<FloorKey>(null);
  const [vacantOnly, setVacantOnly] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [previewFloor, setPreviewFloor] = useState<number | null>(null);

  // Reset the floor when switching building.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on building change only
  useEffect(() => setFloorKey(null), [property?.id]);

  const layout = useMemo(
    () => buildLayout(property?.units ?? []),
    [property?.units],
  );

  // Search jump: when a search narrows to rooms in one building/floor,
  // open that building and floor so the match is right in front of you.
  useEffect(() => {
    if (availabilityMode || !matchingIds || matchingIds.size === 0) return;
    const owners = new Set(
      units.filter((u) => matchingIds.has(u.id)).map((u) => u.propertyId),
    );
    const only = [...owners][0];
    if (owners.size === 1 && only) setPropertyId(only);
  }, [matchingIds, availabilityMode, units]);

  useEffect(() => {
    if (
      availabilityMode ||
      !matchingIds ||
      matchingIds.size === 0 ||
      matchingIds.size > 12
    )
      return;
    const hit = new Set(
      layout.floors
        .map((f, i) => (f.units.some((u) => matchingIds.has(u.id)) ? i : -1))
        .filter((i) => i >= 0),
    );
    const only = [...hit][0];
    if (hit.size === 1 && only !== undefined) setFloorKey(only);
  }, [matchingIds, availabilityMode, layout]);

  const visualOf = useCallback(
    (unit: Unit): RoomVisual => {
      if (matchingIds && !matchingIds.has(unit.id)) return "ghost";
      if (availabilityMode) return "vacant";
      const occupied = isUnitOccupied(unit.status);
      if (vacantOnly && occupied) return "ghost";
      return occupied ? "occupied" : "vacant";
    },
    [matchingIds, availabilityMode, vacantOnly],
  );

  const floorIndexOf = useCallback(
    (unit: Unit): FloorKey => {
      const i = layout.floors.findIndex((f) =>
        f.units.some((u) => u.id === unit.id),
      );
      if (i >= 0) return i;
      return layout.other?.units.some((u) => u.id === unit.id) ? "other" : null;
    },
    [layout],
  );

  /** Select a floor; a light tick on Android phones confirms the tap. */
  const chooseFloor = (key: FloorKey) => {
    setFloorKey(key);
    if (key !== null && typeof navigator !== "undefined")
      navigator.vibrate?.(8);
  };

  const openUnit = (unit: Unit) => {
    setFloorKey(floorIndexOf(unit));
    setSelectedUnit(unit);
  };

  const floorTitle = (floor: BuildingFloor) =>
    floor.floor === null
      ? t("floorOther")
      : t("floorLabel", { floor: floor.floor });
  const floorShort = (floor: BuildingFloor) =>
    floor.floor === null
      ? t("floorOther")
      : tb("floorShort", { floor: floor.floor });
  // Real vacancy, unaffected by search/"Vacant only"; in availability
  // mode it counts rooms free for the chosen dates.
  const vacantIn = (floor: BuildingFloor) =>
    floor.units.filter((u) =>
      availabilityMode ? visualOf(u) === "vacant" : !isUnitOccupied(u.status),
    ).length;

  // Search hits get a raised, ringed highlight (small result sets only).
  const focusIds =
    !availabilityMode && matchingIds && matchingIds.size <= 12
      ? matchingIds
      : null;

  // Keep the active floor chip visible in the mobile scroller.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the floor changes
  useEffect(() => {
    const chip = document.querySelector<HTMLElement>(
      "[data-floor-chip][aria-pressed=true]",
    );
    const row = chip?.parentElement;
    if (chip && row)
      row.scrollTo({
        left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2,
        behavior: "smooth",
      });
  }, [floorKey]);

  const selectedFloor =
    typeof floorKey === "number"
      ? (layout.floors[floorKey] ?? null)
      : floorKey === "other"
        ? layout.other
        : null;

  if (!property) {
    return (
      <p className="rounded-[1.75rem] bg-white p-10 text-center text-sm text-[#6b6b6b]">
        {t("mapEmpty")}
      </p>
    );
  }

  const pickerItems: { key: FloorKey; floor: BuildingFloor | null }[] = [
    { key: null, floor: null },
    ...[...layout.floors.keys()]
      .reverse()
      .map((i) => ({ key: i as FloorKey, floor: layout.floors[i] ?? null })),
    ...(layout.other
      ? [{ key: "other" as FloorKey, floor: layout.other }]
      : []),
  ];

  const renderPickerItem = (
    { key, floor }: (typeof pickerItems)[number],
    compact: boolean,
  ) => {
    const active = floorKey === key;
    const vacant = floor ? vacantIn(floor) : 0;
    const total = floor?.units.length ?? 0;
    return (
      <button
        key={String(key)}
        type="button"
        data-floor-chip={compact ? "" : undefined}
        aria-pressed={active}
        onClick={() => chooseFloor(active && key !== null ? null : key)}
        onPointerEnter={() =>
          setPreviewFloor(typeof key === "number" ? key : null)
        }
        onPointerLeave={() => setPreviewFloor(null)}
        onFocus={() => setPreviewFloor(typeof key === "number" ? key : null)}
        onBlur={() => setPreviewFloor(null)}
        className={cn(
          "shrink-0 rounded-2xl text-left transition-colors",
          compact ? "min-w-[6.5rem] px-3 py-2" : "w-full px-3 py-2",
          active
            ? "bg-[#71130d] text-white shadow-[0_12px_24px_-14px_rgb(113_19_13/0.8)]"
            : "border border-[#ece4e2] bg-white text-[#141414] hover:border-[#e8bfb9]",
        )}
      >
        {floor ? (
          <>
            <span className="flex items-center justify-between gap-2 text-sm font-medium">
              {floorShort(floor)}
              <span
                className={cn(
                  "text-xs tabular-nums",
                  active ? "text-white/80" : "text-[#6b6b6b]",
                )}
              >
                {tb("floorVacant", { count: vacant })}
              </span>
            </span>
            <span
              className={cn(
                "mt-1.5 flex h-1.5 overflow-hidden rounded-full",
                active ? "bg-white/25" : "bg-[#f1ebea]",
              )}
            >
              <span
                className={active ? "bg-[#9fe0ab]" : "bg-[#3f9a52]"}
                style={{ width: `${total ? (vacant / total) * 100 : 0}%` }}
              />
            </span>
          </>
        ) : (
          <span className="flex items-center gap-2 py-0.5 text-sm font-medium">
            <Icon name="apartment" size={16} />
            {tb("wholeBuilding")}
          </span>
        )}
      </button>
    );
  };

  const vacantFloors = layout.floors
    .map((floor, i) => ({
      floor,
      i,
      rooms: floor.units.filter((u) => visualOf(u) === "vacant"),
    }))
    .filter((f) => f.rooms.length > 0)
    .reverse();

  return (
    <>
      <section className="rounded-[1.75rem] bg-white p-4 sm:p-6">
        {properties.length > 1 ? (
          <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
            {properties.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={p.id === property.id}
                onClick={() => setPropertyId(p.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  p.id === property.id
                    ? "bg-[#1c0b0a] text-white"
                    : "bg-[#f6f0ef] text-[#3d3a36] hover:text-[#71130d]",
                )}
              >
                <Icon name="apartment" size={16} />
                {p.name}
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    p.id === property.id
                      ? "bg-white/15"
                      : "bg-white text-[#2f6d22]",
                  )}
                >
                  {tb("floorVacant", { count: p.vacant })}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-medium tracking-tight text-[#141414] sm:text-2xl">
              {property.name}
            </h2>
            {property.address ? (
              <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-[#6b6b6b]">
                <Icon name="location_on" size={16} />
                {property.address}
              </p>
            ) : null}
          </div>
          <dl className="grid grid-cols-3 gap-2 sm:flex">
            <Stat
              label={t("status.vacant")}
              value={property.vacant}
              className="bg-[#eef8ec] text-[#1f5a2a]"
            />
            <Stat
              label={t("status.occupied")}
              value={property.occupied}
              className="bg-[#fbf1ef] text-[#71130d]"
            />
            <Stat
              label={t("occupancy")}
              value={`${property.units.length ? Math.round((property.occupied / property.units.length) * 100) : 0}%`}
              className="bg-[#f6f0ef] text-[#141414]"
            />
          </dl>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          {availabilityMode ? (
            <p className="flex items-center gap-2 rounded-full bg-[#eef8ec] px-3 py-2 text-sm text-[#1f5a2a]">
              <span className="size-2.5 rounded-full bg-[#3f9a52]" />
              {tb("available")}
            </p>
          ) : (
            <Segmented
              label={tb("show")}
              value={vacantOnly ? "vacant" : "all"}
              onChange={(v) => setVacantOnly(v === "vacant")}
              options={[
                { id: "all", label: tb("showAll") },
                { id: "vacant", label: tb("showVacant") },
              ]}
            />
          )}
          <button
            type="button"
            aria-pressed={exploded}
            onClick={() => setExploded((v) => !v)}
            className={cn(
              "inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium transition-colors sm:px-4",
              exploded
                ? "bg-[#1c0b0a] text-white"
                : "border border-[#ece4e2] bg-white text-[#3d3a36] hover:text-[#71130d]",
            )}
          >
            <Icon name={exploded ? "unfold_less" : "unfold_more"} size={18} />
            <span className="sr-only sm:not-sr-only">
              {exploded ? tb("stack") : tb("explode")}
            </span>
          </button>
        </div>

        <div className="mt-4">
          <Building3D
            layout={layout}
            visualOf={visualOf}
            selectedFloor={typeof floorKey === "number" ? floorKey : null}
            onSelectFloor={chooseFloor}
            previewFloor={previewFloor}
            pulseVacant={vacantOnly}
            focusIds={focusIds}
            onOpenUnit={openUnit}
            exploded={exploded}
            activeUnitId={selectedUnit?.id}
            label={tb("aria", {
              name: property.name,
              vacant: property.vacant,
              total: property.units.length,
            })}
            overlay={
              <div className="absolute right-3 top-3 hidden max-h-[calc(100%-5.5rem)] w-44 flex-col gap-1.5 overflow-y-auto rounded-3xl bg-white/70 p-2 backdrop-blur-md lg:flex">
                <p className="px-2 pt-1 text-xs font-medium uppercase tracking-[0.06em] text-[#6b6b6b]">
                  {tb("floors")}
                </p>
                {pickerItems.map((item) => renderPickerItem(item, false))}
              </div>
            }
            renderTooltip={(unit) => {
              const visual = visualOf(unit);
              const tenant = resolveUnitTenantLabel(unit);
              const onSelected =
                typeof floorKey === "number" && floorIndexOf(unit) === floorKey;
              return (
                <>
                  <p className="flex items-center justify-between gap-2 text-[15px] font-medium text-[#141414]">
                    {unit.name}
                    <span
                      className={cn("size-2.5 rounded-full", DOT[visual])}
                    />
                  </p>
                  <p className="text-xs text-[#6b6b6b]">
                    {resolveUnitTypeNameForUnit(unit, lookups)}
                  </p>
                  <p className="mt-2 text-sm text-[#3d3a36]">
                    {visual === "ghost"
                      ? tb("notMatching")
                      : t(
                          `status.${isUnitOccupied(unit.status) ? "occupied" : "vacant"}`,
                        )}
                    {isUnitOccupied(unit.status) && tenant !== "—"
                      ? ` · ${tenant}`
                      : ""}
                  </p>
                  <p className="mt-2 text-xs text-[#857f77]">
                    {onSelected ? tb("clickForDetails") : tb("clickToPeek")}
                  </p>
                </>
              );
            }}
          />
        </div>

        {/* Mobile floor picker */}
        <div className="relative -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
          {pickerItems.map((item) => renderPickerItem(item, true))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#3d3a36]">
          <Legend dot="bg-[#3f9a52]" label={t("status.vacant")} />
          <Legend dot="bg-[#71130d]" label={t("status.occupied")} />
          {matchingIds || vacantOnly ? (
            <Legend dot="bg-[#d6ccc9]" label={tb("notMatching")} />
          ) : null}
        </div>
      </section>

      {/* Floor plan / vacant list */}
      <section className="mt-4 rounded-[1.75rem] bg-white p-4 sm:p-6">
        {selectedFloor ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-medium tracking-tight text-[#141414]">
                  {floorTitle(selectedFloor)}
                </h3>
                <p className="mt-0.5 text-sm text-[#6b6b6b]">
                  {tb("floorSummary", {
                    total: selectedFloor.units.length,
                    vacant: vacantIn(selectedFloor),
                  })}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {typeof floorKey === "number" ? (
                  <>
                    <FloorStep
                      icon="arrow_downward"
                      label={tb("floorBelow")}
                      disabled={floorKey <= 0}
                      onClick={() => chooseFloor(floorKey - 1)}
                    />
                    <FloorStep
                      icon="arrow_upward"
                      label={tb("floorAbove")}
                      disabled={floorKey >= layout.floors.length - 1}
                      onClick={() => chooseFloor(floorKey + 1)}
                    />
                  </>
                ) : null}
                <FloorStep
                  icon="close"
                  label={tb("backToBuilding")}
                  onClick={() => setFloorKey(null)}
                />
              </div>
            </div>
            <ul className="mt-4 grid grid-cols-3 gap-2 min-[420px]:grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
              {selectedFloor.units.map((unit) => {
                const visual = visualOf(unit);
                const occupied = isUnitOccupied(unit.status);
                return (
                  <li key={unit.id}>
                    <button
                      type="button"
                      onClick={() => openUnit(unit)}
                      aria-label={t("roomAria", {
                        name: unit.name,
                        status: t(`status.${occupied ? "occupied" : "vacant"}`),
                      })}
                      className={cn(
                        "flex min-h-16 w-full flex-col items-start justify-between rounded-2xl border p-2.5 text-left transition-colors",
                        TILE[visual],
                        selectedUnit?.id === unit.id &&
                          "ring-2 ring-[#141414] ring-offset-1",
                      )}
                    >
                      <span className="flex w-full items-center justify-between gap-1">
                        <span className="truncate text-[15px] font-semibold tabular-nums">
                          {unit.name}
                        </span>
                        <Icon
                          name={occupied ? "person" : "door_open"}
                          size={16}
                          className="shrink-0 opacity-80"
                        />
                      </span>
                      <span className="w-full truncate text-[11px] opacity-80">
                        {resolveUnitTypeNameForUnit(unit, lookups)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-medium tracking-tight text-[#141414]">
                  {tb("vacantRooms")}
                </h3>
                <p className="mt-0.5 text-sm text-[#6b6b6b]">
                  {tb("pickFloorHint")}
                </p>
              </div>
            </div>
            {vacantFloors.length === 0 ? (
              <p className="mt-4 flex items-center gap-2 rounded-2xl bg-[#faf7f6] p-4 text-[15px] text-[#3d3a36]">
                <Icon name="task_alt" size={20} className="text-[#2f6d22]" />
                {tb("noVacant")}
              </p>
            ) : (
              <ul className="mt-4 flex flex-col divide-y divide-[#f1ebea]">
                {vacantFloors.map(({ floor, i, rooms }) => (
                  <li
                    key={floor.floor ?? "x"}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:gap-4"
                  >
                    <button
                      type="button"
                      onClick={() => chooseFloor(i)}
                      className="flex shrink-0 items-center gap-2 text-left text-sm font-medium text-[#141414] hover:text-[#71130d] sm:w-36"
                    >
                      {floorTitle(floor)}
                      <span className="rounded-full bg-[#eef8ec] px-2 py-0.5 text-xs text-[#1f5a2a]">
                        {rooms.length}
                      </span>
                    </button>
                    <div className="flex flex-wrap gap-1.5">
                      {rooms.map((unit) => (
                        <button
                          key={unit.id}
                          type="button"
                          onClick={() => openUnit(unit)}
                          className="h-9 rounded-full border border-[#bfe0c3] bg-[#eef8ec] px-3 text-sm font-medium text-[#1f5a2a] tabular-nums transition-colors hover:border-[#7fb98a]"
                        >
                          {unit.name}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

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

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl px-4 py-2.5 sm:min-w-24", className)}>
      <dt className="text-xs opacity-80">{label}</dt>
      <dd className="text-xl font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={cn("size-2.5 rounded-full", dot)} />
      {label}
    </span>
  );
}

function FloorStep({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-full border border-[#ece4e2] bg-white text-[#3d3a36] transition-colors hover:text-[#71130d] disabled:opacity-40"
    >
      <Icon name={icon} size={20} />
    </button>
  );
}
