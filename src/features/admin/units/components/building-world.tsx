"use client";

/**
 * The 3D building itself, drawn with CSS 3D transforms in a classical
 * residential style: cream walls with pilasters and cornice bands, one framed
 * window + balcony per room (glass colour = room status), a colonnaded
 * podium, a balustrade parapet with arched pediments, and a fenced plot.
 * Selecting a floor switches its roof to a status-coloured floor plan.
 */

import { type CSSProperties, memo } from "react";
import type {
  BuildingLayout,
  PlacedRoom,
  RoomVisual,
  Side,
} from "@/features/admin/units/lib/building-layout";
import type { Unit } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

/* Geometry (CSS px before the fit scale). */
export const CELL = 30;
export const ROOM_H = 26;
export const GAP_STACKED = 0;
export const GAP_EXPLODED = 30;
export const PODIUM_H = 30;
export const CROWN_H = 22;
export const LIFT = 160;
export const DEFAULT_ANGLE = -36;
export const TILT = 66;
export const TILT_PEEK = 42;
export const ZOOM_MIN = 0.7;
export const ZOOM_MAX = 2.6;
const PLOT_PAD = 26;
const PARAPET_H = 5;
const FENCE_H = 7;

/* Materials */
const WALL_LIGHT = "#f4ece1";
const WALL_SHADE = "#dfd2c1";
const CORNICE = "#cdbea9";
const ROOF = "#e9e0d3";
const RAIL = "#8c8273";
const CORRIDOR_WALL = "#efe7dc";
const CORE_WALL = "#e8dfd2";
const CORRIDOR = 7;

const GLASS: Record<RoomVisual, { glass: string; glow?: string }> = {
  vacant: {
    glass: "linear-gradient(180deg,#8fdc9c 0%,#3f9a52 60%,#2a7a3c 100%)",
    glow: "0 0 5px rgb(79 174 99 / 0.75)",
  },
  occupied: {
    glass: "linear-gradient(180deg,#f2a184 0%,#b4463c 55%,#7a160f 100%)",
    glow: "0 0 5px rgb(230 120 95 / 0.55)",
  },
  ghost: { glass: "linear-gradient(180deg,#ece7e3,#cfc7c1)" },
};

const PLAN: Record<RoomVisual, { top: string; ink: string }> = {
  vacant: { top: "#cfeccf", ink: "#1f5a2a" },
  occupied: { top: "#b4463c", ink: "#ffffff" },
  ghost: { top: "#f2edeb", ink: "#a39b95" },
};

type Orient = "x" | "y";

/**
 * Place a vertical wall: runs `len` px along x or y from (x, y), from height
 * z up to z + h. Element "up" maps to world up, so top/bottom details
 * (cornices, balconies, arches) render the right way round from any angle.
 */
function wallStyle(
  orient: Orient,
  x: number,
  y: number,
  len: number,
  h: number,
  z = 0,
): CSSProperties {
  const m =
    orient === "x"
      ? `matrix3d(1,0,0,0, 0,0,-1,0, 0,1,0,0, ${x},${y},${z + h},1)`
      : `matrix3d(0,1,0,0, 0,0,-1,0, -1,0,0,0, ${x},${y},${z + h},1)`;
  return {
    position: "absolute",
    left: 0,
    top: 0,
    width: len,
    height: h,
    transformOrigin: "0 0",
    transform: m,
  };
}

function sideWall(side: Side, h: number, z = 0): CSSProperties {
  switch (side) {
    case "n":
      return wallStyle("x", 0, 0, CELL, h, z);
    case "s":
      return wallStyle("x", 0, CELL, CELL, h, z);
    case "w":
      return wallStyle("y", 0, 0, CELL, h, z);
    default:
      return wallStyle("y", CELL, 0, CELL, h, z);
  }
}

/** Facade sides of a ring cell — the rest face the inner corridor. */
function outerSides(room: PlacedRoom, cols: number, rows: number): Side[] {
  return room.exposed.filter(
    (side) =>
      (side === "n" && room.y === 0) ||
      (side === "s" && room.y === rows - 1) ||
      (side === "w" && room.x === 0) ||
      (side === "e" && room.x === cols - 1),
  );
}

const shadeOf = (side: Side) =>
  side === "s" || side === "w" ? WALL_LIGHT : WALL_SHADE;

/** Cream wall with pilasters at the edges and a cornice band on top. */
function facadeBackground(side: Side): string {
  return [
    `linear-gradient(180deg, ${CORNICE} 0 2.5px, transparent 2.5px)`,
    "linear-gradient(90deg, rgb(0 0 0 / 0.07) 0 1.5px, transparent 1.5px calc(100% - 1.5px), rgb(0 0 0 / 0.07) calc(100% - 1.5px))",
    shadeOf(side),
  ].join(",");
}

const Room = memo(function Room({
  room,
  floorIndex,
  visual,
  plan,
  showLabel,
  faded,
  active,
  roof,
  topFloor,
  outer,
  isCorner,
  plaque,
  preview,
  pulse,
  focus,
}: {
  room: PlacedRoom;
  floorIndex: number;
  visual: RoomVisual;
  /** Roof shows the status-coloured floor plan. */
  plan: boolean;
  showLabel: boolean;
  faded: boolean;
  active: boolean;
  /** Nothing above this room — draw parapet. */
  roof: boolean;
  topFloor: boolean;
  /** Sides on the street facade (others face the inner corridor). */
  outer: Side[];
  isCorner: boolean;
  /** Floor number plaque on this corner room's facade. */
  plaque: number | null;
  /** Floor is being previewed from the floor list. */
  preview: boolean;
  /** Vacant windows pulse (Vacant-only mode). */
  pulse: boolean;
  /** Search hit — raised and ringed. */
  focus: boolean;
}) {
  const glass = GLASS[visual];
  const fade = faded ? "opacity-[0.07]" : "";

  return (
    <div
      data-room={room.unit.id}
      data-floor={floorIndex}
      className="group/room absolute cursor-pointer"
      style={{
        left: room.x * CELL,
        top: room.y * CELL,
        width: CELL,
        height: CELL,
        transformStyle: "preserve-3d",
        transform: (active || focus) && plan ? "translateZ(8px)" : undefined,
        transition: "transform 300ms ease",
        pointerEvents: faded ? "none" : undefined,
      }}
    >
      {room.exposed.map((side) => {
        const street = outer.includes(side);
        // Text on s/w walls would read mirrored — flip it back.
        const mirrored = side === "s" || side === "w";
        return (
          <div
            key={side}
            className={cn(
              "transition-[opacity,filter] duration-500 group-hover/room:brightness-[1.08]",
              fade,
            )}
            style={{
              ...sideWall(side, ROOM_H),
              background: street ? facadeBackground(side) : CORRIDOR_WALL,
              boxShadow: active
                ? "inset 0 0 0 1.5px #141414"
                : preview
                  ? "inset 0 0 0 30px rgb(113 19 13 / 0.12), inset 0 -1.5px 0 #71130d, inset 0 1.5px 0 #71130d"
                  : undefined,
            }}
          >
            {street ? (
              <>
                {/* Window: arched on the top floor, like the reference crown. */}
                <div
                  className={cn(
                    "absolute left-[26%] right-[26%] top-[15%] border-[1.5px] border-[#fbf8f3]",
                    topFloor ? "rounded-t-full" : "rounded-[1px]",
                    isCorner ? "bottom-[22%]" : "bottom-[12%]",
                    pulse &&
                      visual === "vacant" &&
                      "motion-safe:animate-[vacant-pulse_1.6s_ease-in-out_infinite]",
                  )}
                  style={{ background: glass.glass, boxShadow: glass.glow }}
                />
                {/* Balcony: slab + railing (plain windows on corners). */}
                {!isCorner ? (
                  <div
                    className="absolute bottom-[8%] left-[16%] right-[16%] h-[24%] border-b-2 border-t border-b-[#cdbea9]"
                    style={{
                      borderTopColor: RAIL,
                      background: `repeating-linear-gradient(90deg, ${RAIL} 0 0.8px, transparent 0.8px 2.6px)`,
                    }}
                  />
                ) : null}
                {plaque !== null && !plan ? (
                  <span
                    className="absolute left-[6%] top-[14%] rounded-[2px] bg-[#1c0b0a] px-[2px] text-[6px] font-semibold leading-[8px] text-white"
                    style={{ transform: mirrored ? "scaleX(-1)" : undefined }}
                  >
                    {plaque}
                  </span>
                ) : null}
              </>
            ) : (
              <>
                {/* Corridor side: door + small status window. */}
                <div className="absolute bottom-0 left-[16%] h-[62%] w-[26%] rounded-t-[2px] bg-[#a3876c]" />
                <div
                  className="absolute right-[18%] top-[22%] h-[28%] w-[32%] rounded-[1px] border border-[#fbf8f3]"
                  style={{ background: glass.glass }}
                />
              </>
            )}
          </div>
        );
      })}

      {/* Roof slab / floor plan */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-[opacity,background-color] duration-500 group-hover/room:brightness-[1.06]",
          fade,
        )}
        style={{
          background: plan ? PLAN[visual].top : ROOF,
          transform: `translateZ(${ROOM_H}px)`,
          boxShadow: active
            ? "inset 0 0 0 2px #141414"
            : focus
              ? "inset 0 0 0 2px #71130d, 0 0 12px rgb(113 19 13 / 0.45)"
              : plan
                ? "inset 0 0 0 0.5px rgb(0 0 0 / 0.15)"
                : "inset 0 0 0 0.5px rgb(0 0 0 / 0.06)",
        }}
      >
        {showLabel ? (
          <span
            className="select-none text-[8px] font-semibold leading-none tabular-nums"
            style={{
              color: plan ? PLAN[visual].ink : "#8c8273",
              transform: "rotate(var(--counter))",
            }}
          >
            {room.unit.name.match(/\d+/)?.[0] ?? room.unit.name.slice(0, 4)}
          </span>
        ) : null}
      </div>

      {/* Balustrade parapet on the street side where the roof is open */}
      {roof && !plan
        ? outer.map((side) => (
            <div
              key={`p-${side}`}
              className={fade}
              style={{
                ...sideWall(side, PARAPET_H, ROOM_H),
                background: `linear-gradient(180deg, ${CORNICE} 0 1.5px, transparent 1.5px), repeating-linear-gradient(90deg, ${shadeOf(side)} 0 1.6px, transparent 1.6px 3.2px)`,
              }}
            />
          ))
        : null}
    </div>
  );
});

/**
 * Central core that fills the middle of every floor: an inner corridor ring
 * around the lift + stair block. On the top floor its roof is a garden; in
 * floor-plan view it's labelled so landlords can orient themselves.
 */
const Core = memo(function Core({
  cols,
  rows,
  plan,
  rooftop,
  faded,
  label,
}: {
  cols: number;
  rows: number;
  plan: boolean;
  rooftop: boolean;
  faded: boolean;
  label: string;
}) {
  const fade = faded ? "opacity-[0.07]" : "";
  const x0 = CELL;
  const y0 = CELL;
  const iw = (cols - 2) * CELL;
  const ih = (rows - 2) * CELL;
  const cx = x0 + CORRIDOR;
  const cy = y0 + CORRIDOR;
  const cw = iw - CORRIDOR * 2;
  const ch = ih - CORRIDOR * 2;
  const hasBlock = cw > 8 && ch > 8;
  const coreWall = (o: Orient, x: number, y: number, len: number) => (
    <div
      key={`${o}${x}${y}`}
      className={fade}
      style={{
        ...wallStyle(o, x, y, len, ROOM_H),
        background: `linear-gradient(90deg, transparent 0 calc(50% - 4px), #b59a7f calc(50% - 4px) calc(50% + 4px), transparent calc(50% + 4px)) bottom / 100% 62% no-repeat, ${CORE_WALL}`,
        pointerEvents: "none",
      }}
    />
  );

  return (
    <>
      {/* Corridor floor */}
      <div
        className={cn("absolute", fade)}
        style={{
          left: x0,
          top: y0,
          width: iw,
          height: ih,
          transform: "translateZ(0.5px)",
          background:
            "repeating-linear-gradient(0deg, #e9e0d3 0 5px, #e2d8c9 5px 6px), #e9e0d3",
          pointerEvents: "none",
        }}
      />
      {hasBlock ? (
        <>
          {coreWall("x", cx, cy, cw)}
          {coreWall("x", cx, cy + ch, cw)}
          {coreWall("y", cx, cy, ch)}
          {coreWall("y", cx + cw, cy, ch)}
          <div
            className={cn(
              "absolute flex items-center justify-center overflow-hidden",
              fade,
            )}
            style={{
              left: cx,
              top: cy,
              width: cw,
              height: ch,
              transform: `translateZ(${ROOM_H}px)`,
              pointerEvents: "none",
              background: plan
                ? "linear-gradient(90deg, transparent 0 62%, rgb(0 0 0 / 0.05) 62%), repeating-linear-gradient(90deg, #ddd2c3 0 3px, #cfc2b0 3px 4px)"
                : rooftop
                  ? "radial-gradient(circle at 22% 30%, #9cc48c 0 7%, transparent 7.5%), radial-gradient(circle at 78% 70%, #9cc48c 0 9%, transparent 9.5%), radial-gradient(circle at 70% 24%, #b2d3a3 0 5%, transparent 5.5%), repeating-linear-gradient(90deg, transparent 0 9px, rgb(140 130 115 / 0.35) 9px 10px), #cfe3c2"
                  : ROOF,
              boxShadow: "inset 0 0 0 1.5px #d8cbb8",
            }}
          >
            {plan ? (
              <span
                className="flex select-none items-center gap-1 rounded-full bg-white/85 px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wide text-[#6b6b6b]"
                style={{ transform: "rotate(var(--counter))" }}
              >
                {label}
              </span>
            ) : rooftop ? (
              <span className="size-[30%] max-h-6 max-w-6 rounded-[3px] border border-[#d8cbb8] bg-[#efe7dc] shadow-[0_2px_0_#cdbea9]" />
            ) : null}
          </div>
        </>
      ) : null}
      {/* Glazed roof over the corridor on the top floor */}
      {rooftop && !plan ? (
        <div
          className={cn("absolute", fade)}
          style={{
            left: x0,
            top: y0,
            width: iw,
            height: ih,
            transform: `translateZ(${ROOM_H}px)`,
            pointerEvents: "none",
            border: `${CORRIDOR}px solid #c9d4da`,
            borderRadius: 1,
            boxShadow: "inset 0 0 0 0.5px #a9b6bd",
            background: "transparent",
          }}
        />
      ) : null}
    </>
  );
});

/** Colonnaded ground floor with arched openings and a central entrance. */
const Podium = memo(function Podium({
  rooms,
  cols,
  height,
}: {
  rooms: PlacedRoom[];
  cols: number;
  height: number;
}) {
  const entranceX = Math.floor(cols / 2);
  return (
    <>
      {rooms.flatMap((room) =>
        room.exposed.map((side) => {
          const entrance = side === "s" && room.x === entranceX;
          return (
            <div
              key={`${room.unit.id}-${side}`}
              style={{
                ...sideWall(side, height),
                left: room.x * CELL,
                top: room.y * CELL,
                background: [
                  `linear-gradient(180deg, ${CORNICE} 0 3px, transparent 3px)`,
                  "linear-gradient(90deg, #faf6f0 0 3px, transparent 3px calc(100% - 3px), #faf6f0 calc(100% - 3px))",
                  side === "s" || side === "w" ? "#ebe1d3" : "#d6c8b5",
                ].join(","),
                pointerEvents: "none",
              }}
            >
              <div
                className="absolute bottom-0 left-[22%] right-[22%] top-[24%] rounded-t-full border-[1.5px] border-b-0 border-[#faf6f0]"
                style={{
                  background: entrance
                    ? "linear-gradient(180deg,#f7d9a6,#c98a4b)"
                    : "linear-gradient(180deg,#5a5862,#2f2e35)",
                }}
              />
            </div>
          );
        }),
      )}
    </>
  );
});

/** Arched pediment crowning the middle of each facade (reference roofline). */
function Crown({
  x,
  y,
  orient,
  z,
  faded,
}: {
  x: number;
  y: number;
  orient: Orient;
  z: number;
  faded: boolean;
}) {
  return (
    <div
      className={cn(
        "transition-opacity duration-500",
        faded && "opacity-[0.07]",
      )}
      style={{
        ...wallStyle(orient, x, y, CELL * 1.4, CROWN_H, z),
        background: `linear-gradient(180deg, transparent 0 0, ${WALL_LIGHT} 0)`,
        borderRadius: "999px 999px 0 0",
        boxShadow: `inset 0 2px 0 ${CORNICE}`,
        pointerEvents: "none",
      }}
    >
      <div className="absolute bottom-[14%] left-[32%] right-[32%] top-[30%] rounded-t-full border border-[#fbf8f3] bg-[linear-gradient(180deg,#9fb3c4,#5d7183)]" />
    </div>
  );
}

export const World = memo(function World({
  layout,
  visualOf,
  selectedFloor,
  exploded,
  activeUnitId,
  previewFloor,
  pulseVacant,
  focusIds,
  coreLabel,
}: {
  layout: BuildingLayout;
  visualOf: (unit: Unit) => RoomVisual;
  selectedFloor: number | null;
  exploded: boolean;
  activeUnitId?: string;
  previewFloor: number | null;
  pulseVacant: boolean;
  focusIds: Set<string> | null;
  coreLabel: string;
}) {
  const W = layout.cols * CELL;
  const D = layout.rows * CELL;
  const gap = exploded ? GAP_EXPLODED : GAP_STACKED;
  const courtyard = layout.cols > 2 && layout.rows > 2;
  const floors = layout.floors;
  const top = floors.length - 1;
  const cellsAbove = floors.map(
    (_, i) => new Set((floors[i + 1]?.rooms ?? []).map((r) => `${r.x},${r.y}`)),
  );
  const zOf = (i: number) => {
    const lifted = selectedFloor !== null && i > selectedFloor;
    return (
      PODIUM_H +
      i * (ROOM_H + gap) +
      (lifted ? LIFT + (i - (selectedFloor ?? 0)) * 24 : 0)
    );
  };

  // Pediments at the middle of each outer facade on the top floor.
  const topRooms = floors[top]?.rooms ?? [];
  const has = (x: number, y: number) =>
    topRooms.some((r) => r.x === x && r.y === y);
  const midX = Math.floor(layout.cols / 2);
  const midY = Math.floor(layout.rows / 2);
  const crowns: { key: string; x: number; y: number; orient: Orient }[] = [];
  if (layout.cols >= 3) {
    if (has(midX, 0))
      crowns.push({ key: "n", x: midX * CELL - CELL * 0.2, y: 0, orient: "x" });
    if (has(midX, layout.rows - 1))
      crowns.push({ key: "s", x: midX * CELL - CELL * 0.2, y: D, orient: "x" });
  }
  if (layout.rows >= 3) {
    if (has(0, midY))
      crowns.push({ key: "w", x: 0, y: midY * CELL - CELL * 0.2, orient: "y" });
    if (has(layout.cols - 1, midY))
      crowns.push({ key: "e", x: W, y: midY * CELL - CELL * 0.2, orient: "y" });
  }
  const topLifted = selectedFloor !== null && top > selectedFloor;
  const showCrown = !exploded && (selectedFloor === null || topLifted);

  return (
    <div
      className="absolute"
      style={{
        left: -W / 2,
        top: -D / 2,
        width: W,
        height: D,
        transformStyle: "preserve-3d",
      }}
    >
      {/* Plot: paving, lawn edge, shadow */}
      <div
        className="absolute rounded-[10px]"
        style={{
          left: -PLOT_PAD,
          top: -PLOT_PAD,
          width: W + PLOT_PAD * 2,
          height: D + PLOT_PAD * 2,
          transform: "translateZ(-1px)",
          background:
            "linear-gradient(#e6ddd0,#e6ddd0) padding-box, linear-gradient(135deg,#c9dcbf,#b5cfa8) border-box",
          border: "6px solid transparent",
          boxShadow: "0 40px 70px -24px rgb(28 11 10 / 0.3)",
        }}
      />
      {/* Entrance path */}
      <div
        className="absolute bg-[#d6cab9]"
        style={{
          left: Math.floor(layout.cols / 2) * CELL + CELL * 0.2,
          top: D,
          width: CELL * 0.6,
          height: PLOT_PAD,
        }}
      />
      {/* Fence around the plot */}
      {(
        [
          ["x", -PLOT_PAD + 6, -PLOT_PAD + 6, W + PLOT_PAD * 2 - 12],
          ["y", -PLOT_PAD + 6, -PLOT_PAD + 6, D + PLOT_PAD * 2 - 12],
          ["y", W + PLOT_PAD - 6, -PLOT_PAD + 6, D + PLOT_PAD * 2 - 12],
        ] as const
      ).map(([o, x, y, len]) => (
        <div
          key={`${o}${x}${y}`}
          style={{
            ...wallStyle(o, x, y, len, FENCE_H),
            background: `linear-gradient(180deg, ${RAIL} 0 1px, transparent 1px), repeating-linear-gradient(90deg, ${RAIL} 0 0.8px, transparent 0.8px 3px)`,
            pointerEvents: "none",
          }}
        />
      ))}
      {/* Front fence with a gate gap at the entrance */}
      {[
        [
          -PLOT_PAD + 6,
          Math.floor(layout.cols / 2) * CELL + CELL * 0.1 + PLOT_PAD - 6,
        ],
        [
          Math.floor(layout.cols / 2) * CELL + CELL * 0.9,
          W + PLOT_PAD - 6 - (Math.floor(layout.cols / 2) * CELL + CELL * 0.9),
        ],
      ].map(([x, len]) =>
        (len ?? 0) > 0 ? (
          <div
            key={`f${x}`}
            style={{
              ...wallStyle("x", x ?? 0, D + PLOT_PAD - 6, len ?? 0, FENCE_H),
              background: `linear-gradient(180deg, ${RAIL} 0 1px, transparent 1px), repeating-linear-gradient(90deg, ${RAIL} 0 0.8px, transparent 0.8px 3px)`,
              pointerEvents: "none",
            }}
          />
        ) : null,
      )}

      {courtyard ? (
        // Ground-floor lobby fills the middle at street level.
        <div
          className="absolute bg-[#e2d8c9]"
          style={{
            left: CELL,
            top: CELL,
            width: (layout.cols - 2) * CELL,
            height: (layout.rows - 2) * CELL,
            transform: `translateZ(${PODIUM_H}px)`,
          }}
        />
      ) : null}

      {floors[0] ? (
        <Podium rooms={floors[0].rooms} cols={layout.cols} height={PODIUM_H} />
      ) : null}

      {floors.map((floor, i) => {
        const lifted = selectedFloor !== null && i > selectedFloor;
        const plan = selectedFloor === i || exploded;
        return (
          <div
            key={floor.floor ?? "x"}
            className="absolute inset-0"
            style={{
              transformStyle: "preserve-3d",
              transform: `translateZ(${zOf(i)}px)`,
              transition: "transform 600ms cubic-bezier(.2,.8,.2,1)",
            }}
          >
            {courtyard ? (
              <Core
                cols={layout.cols}
                rows={layout.rows}
                plan={plan && !lifted}
                rooftop={i === top}
                faded={lifted}
                label={coreLabel}
              />
            ) : null}
            {floor.rooms.map((room) => {
              const outer = outerSides(room, layout.cols, layout.rows);
              const isCorner =
                (room.x === 0 || room.x === layout.cols - 1) &&
                (room.y === 0 || room.y === layout.rows - 1);
              return (
                <Room
                  key={room.unit.id}
                  room={room}
                  floorIndex={i}
                  visual={visualOf(room.unit)}
                  plan={plan && !lifted}
                  faded={lifted}
                  roof={!cellsAbove[i]?.has(`${room.x},${room.y}`) || plan}
                  topFloor={i === top}
                  showLabel={!lifted && plan}
                  active={activeUnitId === room.unit.id}
                  outer={outer}
                  isCorner={isCorner}
                  plaque={isCorner ? floor.floor : null}
                  preview={previewFloor === i && selectedFloor !== i}
                  pulse={pulseVacant}
                  focus={Boolean(focusIds?.has(room.unit.id))}
                />
              );
            })}
          </div>
        );
      })}

      {showCrown
        ? crowns.map((c) => (
            <Crown
              key={c.key}
              x={c.x}
              y={c.y}
              orient={c.orient}
              z={zOf(top) + ROOM_H}
              faded={topLifted}
            />
          ))
        : null}
    </div>
  );
});
