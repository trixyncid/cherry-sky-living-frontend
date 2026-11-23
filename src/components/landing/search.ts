/**
 * Availability search: filter state synced to the URL (shareable links) and
 * the instant client-side match against the live catalogue.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import type { RoomType } from "@/lib/types";
import { monthlyPrice, type PropertyVM } from "./shared";

export interface SearchFilters {
  property: "all" | "cherry" | "sky";
  roomType: string;
  /** YYYY-MM */
  moveIn: string;
  duration: "" | "1" | "3" | "6" | "12";
  /** Max monthly rent in Rp; 0 = any. */
  budget: number;
  gender: "" | "putra" | "putri" | "campur";
}

export const EMPTY_FILTERS: SearchFilters = {
  property: "all",
  roomType: "",
  moveIn: "",
  duration: "",
  budget: 0,
  gender: "",
};
export const BUDGETS = [1_500_000, 2_000_000, 2_500_000, 3_000_000, 4_000_000];

const PARAMS = {
  property: "property",
  roomType: "tipe",
  moveIn: "masuk",
  duration: "durasi",
  budget: "budget",
  gender: "gender",
} as const;

function fromUrl(): SearchFilters {
  const q = new URLSearchParams(window.location.search);
  const property = q.get(PARAMS.property);
  const duration = q.get(PARAMS.duration) ?? "";
  const gender = q.get(PARAMS.gender) ?? "";
  return {
    property: property === "cherry" || property === "sky" ? property : "all",
    roomType: q.get(PARAMS.roomType) ?? "",
    moveIn: /^\d{4}-\d{2}$/.test(q.get(PARAMS.moveIn) ?? "")
      ? (q.get(PARAMS.moveIn) as string)
      : "",
    duration: ["1", "3", "6", "12"].includes(duration)
      ? (duration as SearchFilters["duration"])
      : "",
    budget: Math.max(0, Number(q.get(PARAMS.budget)) || 0),
    gender: ["putra", "putri", "campur"].includes(gender)
      ? (gender as SearchFilters["gender"])
      : "",
  };
}

export function isFiltered(f: SearchFilters) {
  return (
    f.property !== "all" ||
    Boolean(f.roomType || f.moveIn || f.duration || f.budget || f.gender)
  );
}

export function useSearchFilters() {
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setFilters(fromUrl());
    setReady(true);
  }, []);

  const update = useCallback(
    (patch: Partial<SearchFilters>) =>
      setFilters((prev) => ({ ...prev, ...patch })),
    [],
  );

  // Keep the URL in step with the filters (shareable links).
  useEffect(() => {
    if (!ready) return;
    const q = new URLSearchParams(window.location.search);
    for (const [key, param] of Object.entries(PARAMS) as [
      keyof SearchFilters,
      string,
    ][]) {
      const value = filters[key];
      if (!value || value === "all") q.delete(param);
      else q.set(param, String(value));
    }
    const qs = q.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    if (
      next !==
      `${window.location.pathname}${window.location.search}${window.location.hash}`
    )
      window.history.replaceState(window.history.state, "", next);
  }, [filters, ready]);

  return { filters, update, ready };
}

export interface Match {
  vm: PropertyVM;
  room: RoomType;
}

/** Rooms that fit the filters, open rooms first, then cheapest. */
export function matchRooms(
  properties: PropertyVM[],
  f: SearchFilters,
): Match[] {
  return properties
    .filter((vm) => f.property === "all" || vm.key === f.property)
    .filter(
      (vm) => !f.gender || !vm.content.gender || vm.content.gender === f.gender,
    )
    .flatMap((vm) => (vm.kost?.roomTypes ?? []).map((room) => ({ vm, room })))
    .filter(({ room }) => room.totalCount > 0)
    .filter(({ room }) => !f.roomType || room.name === f.roomType)
    .filter(
      ({ room }) =>
        !f.budget || (monthlyPrice(room) > 0 && monthlyPrice(room) <= f.budget),
    )
    .sort((a, b) => {
      const open =
        Number(b.room.availableCount > 0) - Number(a.room.availableCount > 0);
      return (
        open ||
        (monthlyPrice(a.room) || Infinity) - (monthlyPrice(b.room) || Infinity)
      );
    });
}

export function describeFilters(
  f: SearchFilters,
  properties: PropertyVM[],
  locale: string,
) {
  const en = locale === "en";
  const name = properties.find((p) => p.key === f.property)?.name;
  return [
    name ? `${en ? "Property" : "Kost"}: ${name}` : null,
    f.roomType ? `${en ? "Room type" : "Tipe kamar"}: ${f.roomType}` : null,
    f.moveIn ? `${en ? "Move-in" : "Masuk"}: ${f.moveIn}` : null,
    f.duration
      ? `${en ? "Duration" : "Durasi"}: ${f.duration} ${en ? "month(s)" : "bulan"}`
      : null,
    f.budget ? `Budget: ≤ Rp ${f.budget.toLocaleString("id-ID")}` : null,
    f.gender ? `${en ? "For" : "Untuk"}: ${f.gender}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}
