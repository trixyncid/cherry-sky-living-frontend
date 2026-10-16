/**
 * Public navigation (landing-page-instructions §5.1).
 * Each item has its own page.
 */

export interface PublicNavLink {
  key: "rooms" | "residences" | "facilities" | "location" | "faq" | "contact";
  href: string;
  icon: string;
}

export const PUBLIC_NAV_LINKS: PublicNavLink[] = [
  { key: "rooms", href: "/search-kosts", icon: "bed" },
  { key: "residences", href: "/residences", icon: "apartment" },
  { key: "facilities", href: "/facilities", icon: "wifi" },
  { key: "location", href: "/location", icon: "location_on" },
  { key: "faq", href: "/faq", icon: "help" },
  { key: "contact", href: "/contact", icon: "call" },
];

/** Primary header CTA: straight to rooms that are open now. */
export const CHECK_AVAILABILITY_HREF = "/search-kosts?availability=available";
