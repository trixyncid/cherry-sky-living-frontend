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
      <section className="w-full px-5 pt-12 sm:px-8 lg:pt-16">
        <div className="mx-auto w-full max-w-[90rem]">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {channels.map((c, i) => {
              const inner = (
                <>
                  <span
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full",
                      c.featured ? "bg-ink text-white" : "bg-canvas text-brand",
                    )}
                  >
                    <Icon name={c.icon} size={22} />
                  </span>
                  <div>
                    <p
                      className={cn(
                        "text-sm",
                        c.featured ? "text-white/65" : "text-fg-muted",
                      )}
                    >
                      {c.title}
                    </p>
                    <p className="mt-1 break-all text-xl font-medium tracking-tight">
                      {c.value}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-sm",
                        c.featured ? "text-white/65" : "text-fg-muted",
                      )}
                    >
                      {c.sub}
                    </p>
                  </div>
                </>
              );
              const box = cn(
                "flex h-full min-h-[12rem] flex-col justify-between gap-6 rounded-[1.25rem] p-6 transition-colors",
                c.featured
                  ? "bg-brand text-white hover:bg-brand-hover"
                  : "bg-white text-fg",
                c.href && !c.featured && "hover:bg-subtle",
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
                        className={box}
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

      <section className="w-full px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto grid w-full max-w-[90rem] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
          <Reveal className="rounded-[1.25rem] bg-white p-6 sm:p-8 lg:self-start">
            <h2 className="text-2xl font-medium tracking-tight text-fg">
              {t("page.formTitle")}
            </h2>
            <p className="mt-2 text-base text-fg-muted">{t("page.formSub")}</p>
            <LeadForm type="inquiry" kosts={kosts} className="relative mt-6" />
          </Reveal>

          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-medium tracking-tight text-fg">
              {t("page.visitTitle")}
            </h2>
            {isLoading
              ? [0, 1].map((i) => (
                  <div
                    key={i}
                    aria-hidden
                    className="h-72 animate-pulse rounded-[1.25rem] bg-white"
                  />
                ))
              : (kosts ?? []).map((kost) => {
                  const address = [kost.location.address, kost.location.city]
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <Reveal
                      key={kost.id}
                      className="overflow-hidden rounded-[1.25rem] bg-white"
                    >
                      <PlaceMap
                        name={kost.name}
                        address={address}
                        className="h-48 rounded-none"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                        <div>
                          <p className="text-lg font-semibold tracking-tight text-fg">
                            {kost.name}
                          </p>
                          <p className="text-base text-fg-2">{address}</p>
                        </div>
                        <a
                          href={directionsUrl(kost.name, address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover"
                        >
                          <Icon name="near_me" size={16} />
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
