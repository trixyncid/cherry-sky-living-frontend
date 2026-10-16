"use client";

import { useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Icon } from "@/components/shared/Icon";
import {
  CELL,
  CROWN_H,
  DEFAULT_ANGLE,
  GAP_EXPLODED,
  GAP_STACKED,
  PODIUM_H,
  ROOM_H,
  TILT,
  TILT_PEEK,
  World,
  ZOOM_MAX,
  ZOOM_MIN,
} from "@/features/admin/units/components/building-world";
import type {
  BuildingLayout,
  RoomVisual,
} from "@/features/admin/units/lib/building-layout";
import type { Unit } from "@/lib/types/admin";

interface Building3DProps {
  layout: BuildingLayout;
  visualOf: (unit: Unit) => RoomVisual;
  selectedFloor: number | null;
  onSelectFloor: (index: number) => void;
  onOpenUnit: (unit: Unit) => void;
  exploded: boolean;
  activeUnitId?: string;
  label: string;
  /** Rendered over the stage (e.g. the desktop floor picker). */
  overlay?: ReactNode;
  /** Quick-look content for a hovered room (desktop). */
  renderTooltip: (unit: Unit) => ReactNode;
  /** Floor highlighted from the floor list before it's opened. */
  previewFloor?: number | null;
  /** Vacant windows pulse (Vacant-only mode). */
  pulseVacant?: boolean;
  /** Rooms to spotlight (search hits). */
  focusIds?: Set<string> | null;
}

/**
 * Interactive CSS-3D building. Drag/swipe rotates (mouse drag also tilts),
 * pinch or the buttons zoom, tapping a floor lifts the floors above it so
 * the rooms inside are visible; tapping a room on that floor opens it.
 */
export function Building3D({
  layout,
  visualOf,
  selectedFloor,
  onSelectFloor,
  onOpenUnit,
  exploded,
  activeUnitId,
  label,
  overlay,
  renderTooltip,
  previewFloor = null,
  pulseVacant = false,
  focusIds = null,
}: Building3DProps) {
  const t = useTranslations("admin.pages.units.building");
  const reduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const view = useRef({ angle: DEFAULT_ANGLE - 50, tilt: TILT, zoom: 1 });
  const gesture = useRef({
    pointers: new Map<number, { x: number; y: number }>(),
    startX: 0,
    startY: 0,
    moved: false,
    pinchDist: 0,
    pinchZoom: 1,
  });
  const [hover, setHover] = useState<{
    unit: Unit;
    x: number;
    y: number;
  } | null>(null);

  const unitById = useCallback(
    (id: string) => {
      for (const f of layout.floors)
        for (const r of f.rooms) if (r.unit.id === id) return r.unit;
      return null;
    },
    [layout],
  );

  const hasOverlay = Boolean(overlay);
  const gap = exploded ? GAP_EXPLODED : GAP_STACKED;
  const buildingH = PODIUM_H + layout.floors.length * (ROOM_H + gap) + CROWN_H;
  const W = layout.cols * CELL + 52;
  const D = layout.rows * CELL + 52;
  const diag = Math.hypot(W, D);

  const apply = useCallback(
    (animate: boolean) => {
      const cam = cameraRef.current;
      if (!cam || size.w === 0) return;
      const { angle, tilt, zoom } = view.current;
      const rad = (tilt * Math.PI) / 180;
      const screenH = buildingH * Math.sin(rad) + diag * Math.cos(rad);
      // Desktop floor picker sits over the right edge — centre in what's left.
      const reserve =
        hasOverlay && window.matchMedia("(min-width: 1024px)").matches
          ? 200
          : 0;
      // Capped so a small kost doesn't balloon into giant blocks.
      const fit = Math.min(
        1.5,
        ((size.w - reserve) * 0.9) / diag,
        (size.h * 0.84) / screenH,
      );
      const s = fit * zoom;
      const offsetY = (buildingH * Math.sin(rad) * s) / 2;
      const offsetX = -reserve / 2;
      cam.style.transition =
        animate && !reduceMotion
          ? "transform 650ms cubic-bezier(.2,.8,.2,1)"
          : "none";
      cam.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${s}) rotateX(${tilt}deg) rotateZ(${angle}deg)`;
      cam.style.setProperty("--counter", `${-angle}deg`);
    },
    [size, buildingH, diag, reduceMotion, hasOverlay],
  );

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Intro swing, then re-fit whenever size/floors/selection change.
  useEffect(() => {
    if (view.current.angle < DEFAULT_ANGLE - 1) {
      apply(false);
      view.current.angle = DEFAULT_ANGLE;
      requestAnimationFrame(() => apply(true));
    } else {
      apply(true);
    }
  }, [apply]);

  // Look down into the selected floor.
  useEffect(() => {
    view.current.tilt = selectedFloor === null ? TILT : TILT_PEEK;
    apply(true);
  }, [selectedFloor, apply]);

  const nudge = (patch: Partial<typeof view.current>) => {
    view.current = { ...view.current, ...patch };
    view.current.zoom = Math.min(
      ZOOM_MAX,
      Math.max(ZOOM_MIN, view.current.zoom),
    );
    apply(true);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const g = gesture.current;
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (g.pointers.size === 1) {
      g.startX = e.clientX;
      g.startY = e.clientY;
      g.moved = false;
    } else if (g.pointers.size === 2) {
      const [a, b] = [...g.pointers.values()];
      if (a && b) {
        g.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
        g.pinchZoom = view.current.zoom;
        g.moved = true;
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    const prev = g.pointers.get(e.pointerId);

    if (e.pointerType === "mouse" && !prev) {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-room]");
      const rect = stageRef.current?.getBoundingClientRect();
      const unit = el?.dataset.room ? unitById(el.dataset.room) : null;
      setHover(
        unit && rect
          ? { unit, x: e.clientX - rect.left, y: e.clientY - rect.top }
          : null,
      );
      return;
    }
    if (!prev) return;
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (g.pointers.size === 2) {
      const [a, b] = [...g.pointers.values()];
      if (a && b && g.pinchDist > 0) {
        view.current.zoom = Math.min(
          ZOOM_MAX,
          Math.max(
            ZOOM_MIN,
            (g.pinchZoom * Math.hypot(a.x - b.x, a.y - b.y)) / g.pinchDist,
          ),
        );
        apply(false);
      }
      return;
    }

    if (
      !g.moved &&
      Math.hypot(e.clientX - g.startX, e.clientY - g.startY) > 6
    ) {
      g.moved = true;
      setHover(null);
      stageRef.current?.setPointerCapture(e.pointerId);
    }
    if (g.moved) {
      view.current.angle += (e.clientX - prev.x) * 0.45;
      if (e.pointerType === "mouse")
        view.current.tilt = Math.min(
          78,
          Math.max(20, view.current.tilt - (e.clientY - prev.y) * 0.3),
        );
      apply(false);
    }
  };

  const onPointerEnd = (e: React.PointerEvent) => {
    gesture.current.pointers.delete(e.pointerId);
  };

  const onClick = (e: React.MouseEvent) => {
    if (gesture.current.moved) return;
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-room]");
    if (!el?.dataset.room) return;
    const floor = Number(el.dataset.floor);
    const unit = unitById(el.dataset.room);
    if (!unit) return;
    if (selectedFloor === floor) onOpenUnit(unit);
    else onSelectFloor(floor);
  };

  const roundBtn =
    "flex size-11 items-center justify-center rounded-full border border-[#ece4e2] bg-white/95 text-[#3d3a36] shadow-[0_8px_20px_-14px_rgb(28_11_10/0.4)] backdrop-blur transition-colors hover:text-[#71130d] active:scale-95";

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] bg-[radial-gradient(120%_90%_at_50%_10%,#ffffff_0%,#f6efed_55%,#efe5e2_100%)]">
      {/* Pointer-only shortcut: the floor picker and room tiles below are the keyboard path. */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard path is the floor picker + tiles */}
      <div
        ref={stageRef}
        role="img"
        aria-label={label}
        className="relative h-[22rem] cursor-grab touch-pan-y select-none active:cursor-grabbing sm:h-[26rem] lg:h-[32rem]"
        style={{ perspective: "1800px" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") setHover(null);
        }}
        onClick={onClick}
      >
        <div
          ref={cameraRef}
          className="absolute left-1/2 top-1/2 size-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          <World
            layout={layout}
            visualOf={visualOf}
            selectedFloor={selectedFloor}
            exploded={exploded}
            activeUnitId={activeUnitId}
            previewFloor={previewFloor}
            pulseVacant={pulseVacant}
            focusIds={focusIds}
            coreLabel={t("core")}
          />
        </div>
      </div>

      {hover ? (
        <div
          className="pointer-events-none absolute z-20 w-56 -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-2xl border border-[#ece4e2] bg-white/95 p-3 shadow-[0_18px_40px_-18px_rgb(28_11_10/0.45)] backdrop-blur"
          style={{ left: hover.x, top: hover.y }}
        >
          {renderTooltip(hover.unit)}
        </div>
      ) : null}

      {overlay}

      <p className="pointer-events-none absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-xs text-[#6b6b6b] backdrop-blur">
        <Icon name="touch_app" size={14} />
        {selectedFloor === null ? t("dragHint") : t("tapRoomHint")}
      </p>

      <div className="absolute bottom-3 left-3 flex gap-2">
        <button
          type="button"
          className={roundBtn}
          aria-label={t("rotateLeft")}
          onClick={() => nudge({ angle: view.current.angle - 45 })}
        >
          <Icon name="rotate_left" size={20} />
        </button>
        <button
          type="button"
          className={roundBtn}
          aria-label={t("rotateRight")}
          onClick={() => nudge({ angle: view.current.angle + 45 })}
        >
          <Icon name="rotate_right" size={20} />
        </button>
      </div>
      <div className="absolute bottom-3 right-3 flex gap-2">
        <button
          type="button"
          className={roundBtn}
          aria-label={t("zoomOut")}
          onClick={() => nudge({ zoom: view.current.zoom / 1.25 })}
        >
          <Icon name="remove" size={20} />
        </button>
        <button
          type="button"
          className={roundBtn}
          aria-label={t("zoomIn")}
          onClick={() => nudge({ zoom: view.current.zoom * 1.25 })}
        >
          <Icon name="add" size={20} />
        </button>
        <button
          type="button"
          className={roundBtn}
          aria-label={t("resetView")}
          onClick={() =>
            nudge({
              angle: DEFAULT_ANGLE,
              zoom: 1,
              tilt: selectedFloor === null ? TILT : TILT_PEEK,
            })
          }
        >
          <Icon name="center_focus_strong" size={20} />
        </button>
      </div>
    </div>
  );
}
