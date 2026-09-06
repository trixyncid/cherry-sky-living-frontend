/**
 * Footer Component
 * Dark charcoal footer with inquiry strip and oversized brand wordmark
 */

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import { generateWhatsAppURL } from "@/lib/utils/format";
import { getContactWhatsAppNumber } from "@/lib/contact";

const CONTACT_EMAIL = "info@cherryskykost.com";

export function Footer() {
  const t = useTranslations();
  const currentYear = new Date().getFullYear();
  const [name, setName] = useState("");

  const footerLinks = [
    { label: t("nav.about"), href: "/about" },
    { label: t("nav.search"), href: "/search-kosts" },
    { label: t("nav.contact"), href: "/contact" },
    { label: t("footer.termsConditions"), href: "/terms" },
    { label: t("footer.privacyPolicy"), href: "/privacy" },
  ];

  const handleInquiry = (event: React.FormEvent) => {
    event.preventDefault();
    const intro = name.trim()
      ? `Dear Cherry Sky Living,\n\nMy name is ${name.trim()}. I would like to schedule a viewing and learn more about available rooms.`
      : t("whatsapp.generalInquiry");
    window.open(
      generateWhatsAppURL(getContactWhatsAppNumber(), intro),
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <footer className="relative w-full overflow-hidden bg-maroon-deep px-6 pt-16 pb-0 text-[#f2f1ee] lg:px-10">
      <div className="pointer-events-none absolute right-0 top-0 h-[420px] w-[420px] rounded-full bg-maroon/40 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-24 left-0 h-[360px] w-[360px] rounded-full bg-ferrugem/20 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-16 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="flex flex-col gap-6 lg:col-span-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#6f4627] p-2.5">
                <Icon name="apartment" className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight">
                {t("common.brand.fullName")}
              </h3>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-[#c8c6c5]">
              {t("footer.tagline")}
            </p>

            <form
              onSubmit={handleInquiry}
              className="max-w-md rounded-2xl border border-white/12 bg-white/[0.06] p-4"
            >
              <p className="mb-1 text-sm font-semibold text-white">
                {t("footer.inquiryTitle")}
              </p>
              <p className="mb-3 text-xs leading-relaxed text-white/70">
                {t("footer.inquiryDescription")}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("footer.inquiryNamePlaceholder")}
                  className="h-11 flex-1 rounded-xl border border-white/15 bg-maroon-deep/40 px-3 text-sm text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#6f4627] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#805533]"
                >
                  <Icon name="whatsapp" size={16} />
                  {t("footer.inquiryButton")}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-3 lg:col-start-7">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#c8c6c5] transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
              {t("footer.contact")}
            </h4>
            <ul className="space-y-3 text-sm text-[#c8c6c5]">
              <li className="flex items-center gap-2">
                <Icon name="location_on" size={16} />
                {t("footer.location")}
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="flex items-center gap-2 transition-colors hover:text-white"
                >
                  <Icon name="mail" size={16} />
                  {CONTACT_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-[#c8c6c5] md:flex-row">
          <p>{t("footer.copyright", { year: currentYear })}</p>
          <span className="flex items-center gap-2">
            <Icon name="location_on" size={16} />
            {t("footer.location")}
          </span>
        </div>
      </div>

      <div className="relative mx-auto mt-8 max-w-7xl overflow-hidden">
        <p
          aria-hidden
          className="select-none text-center text-[18vw] font-bold leading-[0.72] tracking-tight text-white/12 md:text-[10rem] lg:text-[12rem]"
        >
          {t("common.brand.wordmark")}
        </p>
      </div>
    </footer>
  );
}
