/**
 * Site settings — single place the owner (or a developer) edits business
 * details. Copy lives in src/locales; numbers and contacts live here.
 *
 * Values left empty are hidden on the site rather than shown as placeholders.
 */

import { getContactWhatsAppNumber } from "@/lib/contact";

export const siteConfig = {
  brandName: "Cherry Sky Living",
  /** Owner WhatsApp (env NEXT_PUBLIC_WHATSAPP_NUMBER overrides). */
  whatsappNumber: getContactWhatsAppNumber(),
  /** Click-to-call number; falls back to the WhatsApp number. */
  phone:
    process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || getContactWhatsAppNumber(),
  email: "info@cherryskykost.com",
  /** Shown near CTAs and in form success states. */
  viewingHours: {
    days: { en: "Mon–Sat", id: "Sen–Sab" },
    time: "08:00–18:00 WIB",
  },
  /** {{RESPONSE_TIME}} — leave empty until the owner commits to one. */
  responseTime: { en: "", id: "" },
  /** Refundable deposit per property name (matched case-insensitively). */
  deposits: [
    { property: "Cherry Kost", amount: 400_000 },
    { property: "Sky Kost", amount: 300_000 },
  ],
  /** Social profiles; empty entries are not rendered. */
  social: {
    instagram: "",
    tiktok: "",
    googleMaps: "",
  },
} as const;

export type SiteLocale = "en" | "id";

export function localized<T extends Record<SiteLocale, string>>(
  value: T,
  locale: string,
): string {
  return value[locale === "en" ? "en" : "id"];
}

/** Refundable deposit for a property, or undefined when not configured. */
export function depositFor(propertyName: string): number | undefined {
  const name = propertyName.trim().toLowerCase();
  return siteConfig.deposits.find((d) => d.property.toLowerCase() === name)
    ?.amount;
}
