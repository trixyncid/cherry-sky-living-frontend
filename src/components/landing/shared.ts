/**
 * Shared landing-page helpers: the per-property view model (admin content +
 * live catalogue), the device tier that decides how video behaves, and the
 * WhatsApp message builder.
 */

"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site";
import { track } from "@/lib/analytics";
import type { PropertyContent, PropertyKey } from "@/lib/landing/schema";
import type { Kost, RoomType } from "@/lib/types";
import { generateWhatsAppURL } from "@/lib/utils/format";

export interface PropertyVM {
  key: PropertyKey;
  content: PropertyContent;
  /** Live catalogue entry (prices, rooms, availability); absent while loading. */
  kost?: Kost;
  name: string;
}

export function buildProperties(
  content: PropertyContent[],
  kosts: Kost[],
): PropertyVM[] {
  return content.map((c) => {
    const kost = kosts.find((k) =>
      k.name.toLowerCase().includes(c.match.toLowerCase()),
    );
    return {
      key: c.key,
      content: c,
      kost,
      name: kost?.name ?? (c.key === "cherry" ? "Cherry Kost" : "Sky Kost"),
    };
  });
}

export function monthlyPrice(rt: RoomType) {
  return rt.pricings?.find((p) => p.durationDays === 30)?.price ?? rt.price;
}

/** The room the journey ends in: the admin's pick, else the first open room. */
export function heroRoom(vm: PropertyVM): RoomType | undefined {
  const rooms = vm.kost?.roomTypes.filter((rt) => rt.totalCount > 0) ?? [];
  const wanted = vm.content.heroRoom?.toLowerCase();
  return (
    (wanted
      ? rooms.find((rt) => rt.name.toLowerCase().includes(wanted))
      : undefined) ??
    rooms.find((rt) => rt.availableCount > 0) ??
    rooms[0]
  );
}

/**
 * How video behaves on this device:
 *  - "scrub"  desktop: scroll position drives video.currentTime
 *  - "play"   phones / touch / iOS: entering a chapter plays its clip forward
 *  - "static" low-end, Save-Data, slow connection or reduced motion: posters only
 * `null` until mounted (server render shows posters).
 */
export type DeviceTier = "scrub" | "play" | "static";

export function useDeviceTier(): DeviceTier | null {
  const [tier, setTier] = useState<DeviceTier | null>(null);
  useEffect(() => {
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const slow = /(^|-)2g|3g/.test(nav.connection?.effectiveType ?? "");
    const lowEnd =
      (nav.deviceMemory ?? 8) <= 2 || (nav.hardwareConcurrency ?? 8) <= 2;
    if (reduced || nav.connection?.saveData || slow || lowEnd)
      return setTier("static");
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const iOS =
      /iP(hone|ad|od)/.test(nav.userAgent) ||
      (nav.userAgent.includes("Mac") && nav.maxTouchPoints > 1);
    setTier(touch || iOS || window.innerWidth < 1024 ? "play" : "scrub");
  }, []);
  return tier;
}

export interface WhatsAppContext {
  property?: PropertyVM;
  roomType?: string;
  moveIn?: string;
  duration?: string;
  section: string;
}

/** wa.me link with a prefilled message; logs the click for analytics. */
export function whatsappHref(ctx: WhatsAppContext, locale: string) {
  const en = locale === "en";
  const where = ctx.property?.name ?? "Cherry Sky Living";
  const lines = [
    en
      ? `Hello 👋 I'm interested in ${where}.`
      : `Halo kak 👋 Saya tertarik dengan ${where}.`,
    ctx.roomType
      ? en
        ? `Room type: ${ctx.roomType}`
        : `Tipe kamar: ${ctx.roomType}`
      : null,
    ctx.moveIn
      ? en
        ? `Move-in: ${ctx.moveIn}`
        : `Rencana masuk: ${ctx.moveIn}`
      : null,
    ctx.duration
      ? en
        ? `Duration: ${ctx.duration}`
        : `Durasi: ${ctx.duration}`
      : null,
    en
      ? "Is it still available? Thank you 🙏"
      : "Apakah masih tersedia? Terima kasih 🙏",
  ].filter(Boolean);
  const number =
    ctx.property?.content.whatsapp ||
    ctx.property?.kost?.whatsappNumber ||
    siteConfig.whatsappNumber;
  return generateWhatsAppURL(number, lines.join("\n"));
}

export function trackWhatsApp(ctx: WhatsAppContext) {
  track("whatsapp_click", {
    property: ctx.property?.key,
    roomType: ctx.roomType,
    section: ctx.section,
  });
  track("click_whatsapp", { location: ctx.section });
}
