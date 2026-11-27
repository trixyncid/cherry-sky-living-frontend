"use client";

import { useLocale, useTranslations } from "next-intl";
import { directionsUrl, PlaceMap } from "@/components/kost/PlaceMap";
import { PublicPageShell } from "@/components/layout/PublicPageShell";
import { LeadForm } from "@/components/leads/LeadForm";
import { PageHero } from "@/components/sections/PageHero";
import { Icon } from "@/components/shared/Icon";
import { Reveal } from "@/components/shared/Reveal";
import { localized, siteConfig } from "@/config/site";
import { track } from "@/lib/analytics";
import { useKosts } from "@/lib/hooks/use-kost-data";
import { cn } from "@/lib/utils";
import { generateWhatsAppURL } from "@/lib/utils/format";

/**
 * Contact — four direct channels, a lead-saving inquiry form, and each
 * residence with a pinned map. All details come from live data/site config.
 */
export function ContactView() {
  const t = useTranslations("contact");
  const tWhatsapp = useTranslations("whatsapp");
  const locale = useLocale();
  const { data: kosts, isLoading } = useKosts();

  const channels = [
    {
      key: "whatsapp",
      icon: "whatsapp",
      title: t("hero.whatsapp"),
      value: siteConfig.phoneDisplay,
      sub: t("page.whatsappSub"),
      href: generateWhatsAppURL(
        siteConfig.whatsappNumber,
        tWhatsapp("generalInquiry"),
      ),
      external: true,
      onClick: () => track("click_whatsapp", { location: "contact_channel" }),
      featured: true,
    },
    {
      key: "call",
      icon: "call",
      title: t("hero.call"),
      value: siteConfig.phoneDisplay,
      sub: t("page.callSub"),
      href: `tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`,
      onClick: () => track("click_call", { location: "contact_channel" }),
    },
    {
      key: "email",
      icon: "mail",
      title: t("hero.email"),
      value: siteConfig.email,
      sub: t("page.emailSub"),
      href: `mailto:${siteConfig.email}`,
    },
    {
      key: "hours",
      icon: "schedule",
      title: t("hero.hours"),
      value: `${localized(siteConfig.viewingHours.days, locale)} · ${siteConfig.viewingHours.time}`,
      sub: t("page.hoursSub"),
    },
  ];

  return (
    <PublicPageShell hideCta>
      <PageHero
        eyebrow={t("hero.subtitle")}
        titleLead={t("page.titleLead")}
        titleAccent={t("page.titleAccent")}
        description={t("hero.description")}
        photo="/assets/skykost.jpeg"
      />
      <section className="w-full bg-canvas px-5 pt-24 sm:px-8 lg:px-12 lg:pt-32">
        <div className="mx-auto w-full max-w-[90rem]">
          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {channels.map((c, i) => {
              const inner = (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm tabular-nums text-fg-faint">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "flex size-10 items-center justify-center rounded-full border transition-colors",
                        c.featured
                          ? "border-brand bg-brand text-white"
                          : "border-line-strong text-fg",
                        c.href &&
                          !c.featured &&
                          "group-hover:border-fg group-hover:bg-fg group-hover:text-white",
                      )}
                    >
                      <Icon name={c.icon} size={18} />
                    </span>
                  </div>
                  <div>
                    <p className="eyebrow text-[10px] text-fg-muted">
                      {c.title}
                    </p>
                    <p className="mt-2 break-all text-xl font-semibold tracking-[-0.03em] text-fg">
                      {c.value}
                    </p>
                    <p className="mt-1 text-sm text-fg-muted">{c.sub}</p>
                  </div>
                </>
              );
              const box = cn(
                "group flex h-full flex-col justify-between gap-8 border-t pt-5",
                c.featured ? "border-fg" : "border-line",
              );
              return (
                <li key={c.key}>
                  <Reveal delay={i * 0.06} className="h-full">
                    {c.href ? (
                      <a
                        href={c.href}
                        target={c.external ? "_blank" : undefined}
                        rel={c.external ? "noopener noreferrer" : undefined}
                        onClick={c.onClick}
                        className={cn(
                          box,
                          "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand",
                        )}
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className={box}>{inner}</div>
                    )}
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="w-full bg-canvas px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid w-full max-w-[90rem] gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
          <Reveal className="rounded-lg border border-line bg-panel p-6 sm:p-8 lg:self-start lg:p-10">
            <h2 className="text-[clamp(1.75rem,2.8vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-fg">
              {t("page.formTitle")}
            </h2>
            <p className="mt-3 text-base text-fg-muted">{t("page.formSub")}</p>
            <LeadForm type="inquiry" kosts={kosts} className="relative mt-8" />
          </Reveal>

          <div className="flex flex-col gap-10">
            <h2 className="text-[clamp(1.75rem,2.8vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-fg">
              {t("page.visitTitle")}
            </h2>
            {isLoading
              ? [0, 1].map((i) => (
                  <div
                    key={i}
                    aria-hidden
                    className="h-72 animate-pulse rounded-lg bg-hover"
                  />
                ))
              : (kosts ?? []).map((kost) => {
                  const address = [kost.location.address, kost.location.city]
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <Reveal key={kost.id}>
                      <PlaceMap
                        name={kost.name}
                        address={address}
                        className="h-56 rounded-lg border border-line"
                      />
                      <div className="flex flex-wrap items-end justify-between gap-4 pt-5">
                        <div>
                          <p className="eyebrow text-[10px] text-fg-muted">
                            {kost.location.city}
                          </p>
                          <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-fg">
                            {kost.name}
                          </p>
                          <p className="mt-1 text-base text-fg-2">{address}</p>
                        </div>
                        <a
                          href={directionsUrl(kost.name, address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline"
                        >
                          <Icon name="near_me" size={17} />
                          {t("map.directionsButton")}
                        </a>
                      </div>
                    </Reveal>
                  );
                })}
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
