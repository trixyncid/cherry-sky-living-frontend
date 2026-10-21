/**
 * Homepage "explore more" row — routes visitors to the dedicated pages.
 */

"use client";

import { useTranslations } from "next-intl";
import { Eyebrow } from "@/components/shared/ArrowPill";
import { Icon } from "@/components/shared/Icon";
import { Reveal } from "@/components/shared/Reveal";
import { Link } from "@/i18n/routing";

const LINKS = [
  { key: "facilities", href: "/facilities", icon: "wifi" },
  { key: "location", href: "/location", icon: "location_on" },
  { key: "faq", href: "/faq", icon: "help" },
] as const;

export function HomeExplore() {
  const t = useTranslations("explore");

  return (
    <section aria-label={t("eyebrow")} className="w-full px-5 pt-6 sm:px-8">
      <div className="mx-auto w-full max-w-[90rem]">
        <Eyebrow className="mb-5">{t("eyebrow")}</Eyebrow>
        <ul className="grid gap-3 sm:grid-cols-3">
          {LINKS.map((link, index) => (
            <li key={link.key} className="h-full">
              <Reveal delay={index * 0.06} className="h-full">
                <Link
                  href={link.href}
                  className="group flex h-full min-h-[9rem] flex-col justify-between gap-6 rounded-[1.25rem] bg-white p-6 transition-colors hover:bg-brand hover:text-white"
                >
                  <span className="flex items-start justify-between">
                    <span className="flex size-11 items-center justify-center rounded-full bg-canvas text-brand">
                      <Icon name={link.icon} size={22} />
                    </span>
                    <Icon
                      name="north_east"
                      size={20}
                      className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xl font-medium tracking-tight">
                      {t(`${link.key}.title`)}
                    </span>
                    <span className="mt-1 block text-base text-fg-muted group-hover:text-white/70">
                      {t(`${link.key}.description`)}
                    </span>
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
