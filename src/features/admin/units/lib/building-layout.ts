import { isUnitOccupied, type Unit } from "@/lib/types/admin";
import { parseUnitFloor, unitSortKey } from "./group-units-for-map";

/** How a room is drawn: by live status, or ghosted when it doesn't match a filter. */
export type RoomVisual = "vacant" | "occupied" | "ghost";

export type Side = "n" | "e" | "s" | "w";

export interface PlacedRoom {
  unit: Unit;
  /** Grid cell in the footprint (x → east, y → south). */
  x: number;
  y: number;
  /** Sides with no neighbouring room on the same floor (drawn as walls). */
  exposed: Side[];
}

export interface BuildingFloor {
  /** Parsed floor number; null collects rooms whose number gives no floor. */
  floor: number | null;
  rooms: PlacedRoom[];
  units: Unit[];
  vacant: number;
  occupied: number;
}

export interface BuildingLayout {
  cols: number;
  rows: number;
  /** Floors that are drawn in 3D, bottom → top. */
  floors: BuildingFloor[];
  /** Rooms whose floor could not be inferred (list only). */
  other: BuildingFloor | null;
}

/** Ring capacity of a cols×rows footprint (rooms around an open courtyard). */
function ringCapacity(cols: number, rows: number): number {
  if (rows === 1) return cols;
  if (cols === 1) return rows;
  return 2 * (cols + rows) - 4;
}

/**
 * Smallest, squarest footprint whose ring holds `count` rooms — a kost-style
 * courtyard block keeps every room on a facade and fits phone screens.
 */
export function footprintFor(count: number): { cols: number; rows: number } {
  if (count <= 3) return { cols: Math.max(1, count), rows: 1 };
  let best = { cols: count, rows: 1, waste: Number.POSITIVE_INFINITY };
  for (let rows = 2; rows <= 40; rows++) {
    for (let cols = rows; cols <= rows + 2; cols++) {
      const cap = ringCapacity(cols, rows);
      if (cap < count) continue;
      const waste = (cap - count) * 4 + (cols - rows);
      if (waste < best.waste) best = { cols, rows, waste };
    }
  }
  return { cols: best.cols, rows: best.rows };
}

/** Ring cells clockwise from the north-west corner. */
export function ringCells(
  cols: number,
  rows: number,
): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  if (rows === 1) {
    for (let x = 0; x < cols; x++) cells.push({ x, y: 0 });
    return cells;
  }
  if (cols === 1) {
    for (let y = 0; y < rows; y++) cells.push({ x: 0, y });
    return cells;
  }
  for (let x = 0; x < cols; x++) cells.push({ x, y: 0 });
  for (let y = 1; y < rows; y++) cells.push({ x: cols - 1, y });
  for (let x = cols - 2; x >= 0; x--) cells.push({ x, y: rows - 1 });
  for (let y = rows - 2; y >= 1; y--) cells.push({ x: 0, y });
  return cells;
}

function sortUnits(units: Unit[]): Unit[] {
  return [...units].sort((a, b) =>
    unitSortKey(a).localeCompare(unitSortKey(b), undefined, { numeric: true }),
  );
}

function countStatus(units: Unit[]) {
  const occupied = units.filter((u) => isUnitOccupied(u.status)).length;
  return { occupied, vacant: units.length - occupied };
}

export function buildLayout(units: Unit[]): BuildingLayout {
  const byFloor = new Map<number | null, Unit[]>();
  for (const unit of units) {
    const floor = parseUnitFloor(unit.name);
    const list = byFloor.get(floor);
    if (list) list.push(unit);
    else byFloor.set(floor, [unit]);
  }

  const numbered = [...byFloor.entries()]
    .filter((e): e is [number, Unit[]] => e[0] !== null)
    .sort(([a], [b]) => a - b);
  const widest = Math.max(1, ...numbered.map(([, list]) => list.length));
  const { cols, rows } = footprintFor(widest);
  const cells = ringCells(cols, rows);

  const floors: BuildingFloor[] = numbered.map(([floor, list]) => {
    const sorted = sortUnits(list);
    const placed = sorted.map((unit, i) => ({
      unit,
      ...(cells[i] ?? { x: 0, y: 0 }),
    }));
    const taken = new Set(placed.map((p) => `${p.x},${p.y}`));
    const rooms: PlacedRoom[] = placed.map((p) => ({
      ...p,
      exposed: (
        [
          ["n", 0, -1],
          ["e", 1, 0],
          ["s", 0, 1],
          ["w", -1, 0],
        ] as const
      )
        .filter(([, dx, dy]) => !taken.has(`${p.x + dx},${p.y + dy}`))
        .map(([side]) => side),
    }));
    return { floor, rooms, units: sorted, ...countStatus(sorted) };
  });

  const otherUnits = byFloor.get(null);
  const other = otherUnits?.length
    ? {
        floor: null,
        rooms: [],
        units: sortUnits(otherUnits),
        ...countStatus(otherUnits),
      }
    : null;

  return { cols, rows, floors, other };
}
