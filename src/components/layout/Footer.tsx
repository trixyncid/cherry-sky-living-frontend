/**
 * Footer (§5.14) — navy, in the hero's language: an optional final CTA
 * card, then a two-tone brand sign-off with contacts, three ruled link
 * columns and a legal bar.
 */

"use client";

import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Icon } from "@/components/shared/Icon";
import { localized, siteConfig } from "@/config/site";
import { Link } from "@/i18n/routing";
import { track } from "@/lib/analytics";
import { getContactWhatsAppNumber } from "@/lib/contact";
import { useKosts } from "@/lib/hooks/use-kost-data";
import { generateWhatsAppURL } from "@/lib/utils/format";

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
        { label: t("nav.howItWorks"), href: "/how-it-works" },
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
    <footer className="w-full bg-ink text-white">
      <div className="mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-12">
        {cta ? <div className="py-24 lg:py-32">{cta}</div> : null}

        <div className="grid gap-16 border-t border-white/15 pb-16 pt-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:pb-20 lg:pt-28">
          <div>
            <p className="text-[clamp(2.4rem,5.4vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
              <span className="block">{t("common.brand.wordmark")}</span>
              <span className="block max-w-3xl text-balance font-normal text-white/55">
                {t("footer.tagline")}
              </span>
            </p>
            <p className="mt-8 max-w-md text-[15px] leading-relaxed text-white/70">
              {t("footer.about")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={generateWhatsAppURL(
                  getContactWhatsAppNumber(),
                  t("whatsapp.generalInquiry"),
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("click_whatsapp", { location: "footer" })}
                className="btn btn-outline-light"
              >
                <Icon name="whatsapp" size={18} />
                {t("footer.messageUs")}
              </a>
              <a
                href={`tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`}
                onClick={() => track("click_call", { location: "footer" })}
                className="btn btn-outline-light"
              >
                <Icon name="call" size={18} />
                {siteConfig.phoneDisplay}
              </a>
            </div>
            <ul className="mt-8 flex flex-col gap-2 text-[15px] text-white/70">
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
            className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3"
          >
            {columns.map((col) => (
              <div key={col.title}>
                <p className="eyebrow flex items-center gap-3 text-white/75">
                  <span aria-hidden className="h-px w-6 bg-white/50" />
                  {col.title}
                </p>
                <ul className="mt-6 flex flex-col gap-3">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      {"external" in link && link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[15px] capitalize text-white/70 transition-colors hover:text-white"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-[15px] text-white/70 transition-colors hover:text-white"
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

        <div className="flex flex-col gap-3 border-t border-white/15 py-7 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
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
