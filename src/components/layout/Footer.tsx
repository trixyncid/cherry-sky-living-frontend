/**
 * Footer (§5.14) — full-bleed photo background carrying an optional final
 * CTA card, then brand + contacts, three link columns and a legal bar.
 */

"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { localized, siteConfig } from "@/config/site";
import { Link } from "@/i18n/routing";
import { track } from "@/lib/analytics";
import { useKosts } from "@/lib/hooks/use-kost-data";

const FOOTER_PHOTO = "/assets/skykost.jpeg";

interface FooterProps {
  /** Final call-to-action card shown above the footer columns. */
  cta?: ReactNode;
}

export function Footer({ cta }: FooterProps) {
  const t = useTranslations();
  const locale = useLocale();
  const currentYear = new Date().getFullYear();
  const { data: kosts } = useKosts();
  const socials = Object.entries(siteConfig.social).filter(([, url]) => url);

  const columns = [
    {
      title: t("footer.explore"),
      links: [
        { label: t("nav.rooms"), href: "/search-kosts" },
        { label: t("nav.residences"), href: "/residences" },
        { label: t("nav.facilities"), href: "/facilities" },
        { label: t("nav.location"), href: "/location" },
      ],
    },
    {
      title: t("footer.support"),
      links: [
        { label: t("nav.faq"), href: "/faq" },
        { label: t("nav.contact"), href: "/contact" },
        { label: t("footer.tenantPortal"), href: "/tenant/login" },
      ],
    },
    {
      title: t("footer.company"),
      links: [
        { label: t("nav.about"), href: "/about" },
        { label: t("nav.home"), href: "/" },
        ...socials.map(([name, url]) => ({
          label: name === "googleMaps" ? "Google Maps" : name,
          href: url,
          external: true,
        })),
      ],
    },
  ];

  return (
    <footer className="relative w-full overflow-hidden bg-ink text-white">
      <Image
        src={FOOTER_PHOTO}
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-bottom opacity-70 saturate-[0.55]"
      />
      {/* Dark at the top (where the CTA sits), photo shows through below */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#0b0b0d_0%,rgb(11_11_13/0.75)_35%,rgb(11_11_13/0.55)_65%,rgb(11_11_13/0.85)_100%)]" />

      <div className="relative mx-auto w-full max-w-[90rem] px-5 sm:px-8">
        {cta ? <div className="pt-14 lg:pt-20">{cta}</div> : null}

        <div className="grid gap-10 pb-10 pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:pt-20">
          <div>
            <p className="text-[clamp(1.75rem,2.4vw,2.2rem)] font-medium tracking-[-0.035em]">
              {t("common.brand.fullName")}
            </p>
            <p className="mt-3 max-w-md text-base leading-relaxed text-white/80">
              {t("footer.about")}
            </p>
            <ul className="mt-6 flex flex-col gap-1.5 text-[15px] text-white/80">
              <li>
                <a
                  href={`tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`}
                  onClick={() => track("click_call", { location: "footer" })}
                  className="hover:text-white"
                >
                  {siteConfig.phoneDisplay}
                </a>
                {" · "}
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="hover:text-white"
                >
                  {siteConfig.email}
                </a>
              </li>
              {(kosts ?? []).map((kost) => (
                <li key={kost.id}>
                  <span className="text-white">{kost.name}</span>
                  {" · "}
                  {[kost.location.address, kost.location.city]
                    .filter(Boolean)
                    .join(", ")}
                </li>
              ))}
              <li>
                {t("footer.viewingHours")}:{" "}
                {localized(siteConfig.viewingHours.days, locale)}{" "}
                {siteConfig.viewingHours.time}
              </li>
            </ul>
          </div>

          <nav
            aria-label={t("footer.menu")}
            className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:justify-items-end"
          >
            {columns.map((col) => (
              <div key={col.title} className="min-w-[9rem]">
                <p className="border-b border-white/25 pb-3 text-sm uppercase tracking-[0.06em] text-white/85">
                  {col.title}
                </p>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      {"external" in link && link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[15px] capitalize text-white/85 transition-colors hover:text-white"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-[15px] text-white/85 transition-colors hover:text-white"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/20 py-6 text-sm text-white/80 sm:flex-row sm:items-center sm:justify-between">
          <p suppressHydrationWarning>
            {t("footer.copyright", { year: currentYear })}
          </p>
          <p className="flex flex-wrap gap-x-2">
            <Link href="/privacy" className="hover:text-white">
              {t("footer.privacyPolicy")}
            </Link>
            <span aria-hidden>·</span>
            <Link href="/terms" className="hover:text-white">
              {t("footer.termsConditions")}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
