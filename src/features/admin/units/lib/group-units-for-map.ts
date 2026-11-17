import type { AdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import { resolveUnitPropertyName } from "@/features/admin/lib/entity-display";
import { isUnitOccupied, type Unit } from "@/lib/types/admin";

export type UnitFloorGroup = {
  floor: number | null;
  units: Unit[];
};

export type PropertyUnitGroup = {
  propertyId: string;
  propertyName: string;
  address?: string;
  city?: string;
  floors: UnitFloorGroup[];
  stats: {
    total: number;
    vacant: number;
    occupied: number;
    occupancyPct: number;
  };
};

/** Infer floor from room number (e.g. 101 → 1, 1203 → 12). Returns null when unknown. */
export function parseUnitFloor(name: string): number | null {
  const match = name.match(/(\d{2,})/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  if (num >= 100) return Math.floor(num / 100);
  if (num >= 10) return Math.floor(num / 10);
  return 0;
}

export function unitSortKey(unit: Unit): string {
  const match = unit.name.match(/(\d+)/);
  if (match) return match[1].padStart(8, "0");
  return unit.name.toLowerCase();
}

function sortUnits(units: Unit[]): Unit[] {
  return [...units].sort((a, b) =>
    unitSortKey(a).localeCompare(unitSortKey(b), undefined, { numeric: true }),
  );
}

export function groupUnitsForMap(
  units: Unit[],
  lookups: AdminLookups,
): PropertyUnitGroup[] {
  const byProperty = new Map<string, Unit[]>();

  for (const unit of units) {
    const list = byProperty.get(unit.propertyId);
    if (list) list.push(unit);
    else byProperty.set(unit.propertyId, [unit]);
  }

  const groups: PropertyUnitGroup[] = [];

  for (const [propertyId, propertyUnits] of byProperty) {
    const property = lookups.propertyById.get(propertyId);
    const propertyName =
      property?.name ?? resolveUnitPropertyName(propertyUnits[0], lookups);

    const floorMap = new Map<number | null, Unit[]>();
    for (const unit of propertyUnits) {
      const floor = parseUnitFloor(unit.name);
      const list = floorMap.get(floor);
      if (list) list.push(unit);
      else floorMap.set(floor, [unit]);
    }

    const floors: UnitFloorGroup[] = [...floorMap.entries()]
      .sort(([a], [b]) => {
        if (a === null) return 1;
        if (b === null) return -1;
        return a - b;
      })
      .map(([floor, floorUnits]) => ({
        floor,
        units: sortUnits(floorUnits),
      }));

    const occupied = propertyUnits.filter((u) =>
      isUnitOccupied(u.status),
    ).length;
    const total = propertyUnits.length;
    const vacant = total - occupied;

    groups.push({
      propertyId,
      propertyName,
      address: property?.address,
      city: property?.city,
      floors,
      stats: {
        total,
        vacant,
        occupied,
        occupancyPct: total > 0 ? Math.round((occupied / total) * 100) : 0,
      },
    });
  }

  return groups.sort((a, b) => a.propertyName.localeCompare(b.propertyName));
}
