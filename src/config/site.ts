/**
 * Site settings — single place the owner (or a developer) edits business
 * details. Copy lives in src/locales; numbers and contacts live here.
 *
 * Values left empty are hidden on the site rather than shown as placeholders.
 */

import { CONTACT_PHONE_DISPLAY, getContactWhatsAppNumber } from "@/lib/contact";

export const siteConfig = {
  brandName: "Cherry Sky Living",
  /** Owner WhatsApp. */
  whatsappNumber: getContactWhatsAppNumber(),
  /** Click-to-call number. */
  phone: getContactWhatsAppNumber(),
  /** The number as shown on the page. */
  phoneDisplay: CONTACT_PHONE_DISPLAY,
  email: "info@cherryskykost.com",
  /** Shown near CTAs and in form success states. */
  viewingHours: {
    days: { en: "Mon–Sat", id: "Sen–Sab" },
    time: "08:00–17:00 WIB",
  },
  /** {{RESPONSE_TIME}} — leave empty until the owner commits to one. */
  responseTime: { en: "", id: "" },
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
