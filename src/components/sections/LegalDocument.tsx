/**
 * Legal document layout (Terms, Privacy): header with last-updated date,
 * sticky numbered table of contents with scroll-spy, readable sections.
 * Sections come from the locale file in their written order.
 */

"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/sections/PageHero";
import { Icon } from "@/components/shared/Icon";
import { siteConfig } from "@/config/site";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { generateWhatsAppURL } from "@/lib/utils/format";

/** Copy titles carry their own "1. " prefixes; numbering is rendered here. */
const stripNumber = (title: string) => title.replace(/^\s*\d+[.)]\s*/, "");

interface LegalSection {
  title: string;
  content: string;
  items?: string[];
}

export function LegalDocument({
  namespace,
}: {
  namespace: "terms" | "privacy";
}) {
  const t = useTranslations(namespace);
  const tLegal = useTranslations("legal");
  const tWhatsapp = useTranslations("whatsapp");
  const sections = Object.entries(
    t.raw("sections") as Record<string, LegalSection>,
  );
  const [active, setActive] = useState(sections[0]?.[0] ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const [key] of sections) {
      const el = document.getElementById(key);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  return (
    <>
      <PageHero
        eyebrow={t("hero.subtitle")}
        titleLead={t("hero.title")}
        description={t("hero.description")}
      >
        <p className="eyebrow border-t border-white/15 pt-5 text-[10px] text-white/65">
          {t("lastUpdated")}
        </p>
      </PageHero>

      <section className="w-full bg-canvas px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid w-full max-w-[90rem] gap-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-24">
          <nav
            aria-label={tLegal("onThisPage")}
            className="min-w-0 lg:sticky lg:top-24 lg:self-start"
          >
            <p className="eyebrow mb-4 flex items-center gap-4 text-fg-muted">
              <span aria-hidden className="h-px w-10 bg-fg/30" />
              {tLegal("onThisPage")}
            </p>
            <ol className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:gap-0 lg:overflow-visible lg:border-t lg:border-line [&::-webkit-scrollbar]:hidden">
              {sections.map(([key, section], i) => (
                <li key={key} className="shrink-0">
                  <a
                    href={`#${key}`}
                    aria-current={active === key ? "location" : undefined}
                    className={cn(
                      "flex items-start gap-3 rounded-md border border-line px-3 py-2 text-[15px] transition-colors lg:rounded-none lg:border-0 lg:border-b lg:px-0 lg:py-3",
                      active === key
                        ? "border-fg font-medium text-fg lg:border-line"
                        : "text-fg-muted hover:text-fg",
                    )}
                  >
                    <span
                      className={cn(
                        "tabular-nums",
                        active === key ? "text-brand" : "text-fg-faint",
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="whitespace-nowrap lg:whitespace-normal">
                      {stripNumber(section.title)}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="max-w-3xl">
            {sections.map(([key, section], i) => (
              <section
                key={key}
                id={key}
                aria-labelledby={`${key}-title`}
                className="scroll-mt-24 border-b border-line py-10 first:pt-0 last:border-b-0"
              >
                <span className="text-sm tabular-nums text-fg-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2
                  id={`${key}-title`}
                  className="mt-3 text-[clamp(1.5rem,2.4vw,2rem)] font-semibold leading-[1.1] tracking-[-0.035em] text-fg"
                >
                  {stripNumber(section.title)}
                </h2>
                <p className="mt-4 text-[17px] leading-[1.75] text-fg-2">
                  {section.content}
                </p>
                {section.items?.length ? (
                  <ul className="mt-4 flex flex-col gap-2.5">
                    {section.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-[17px] leading-[1.7] text-fg-2"
                      >
                        <span
                          aria-hidden
                          className="mt-[0.8em] h-px w-3 shrink-0 bg-fg/40"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            <div className="mt-12 flex flex-col items-start gap-5 rounded-lg bg-ink p-6 text-white sm:flex-row sm:items-center sm:justify-between lg:p-8">
              <div>
                <p className="text-xl font-semibold tracking-tight">
                  {tLegal("questions")}
                </p>
                <p className="mt-1 text-base text-white/65">
                  {tLegal("questionsSub")}
                </p>
              </div>
              <a
                href={generateWhatsAppURL(
                  siteConfig.whatsappNumber,
                  tWhatsapp("generalInquiry"),
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  track("click_whatsapp", { location: `legal_${namespace}` })
                }
                className="btn btn-outline-light shrink-0"
              >
                <Icon name="whatsapp" size={17} />
                WhatsApp
                <Icon name="north_east" size={17} />
              </a>
            </div>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-fg-2 underline-offset-4 hover:text-fg hover:underline"
            >
              <Icon name="arrow_upward" size={16} />
              {tLegal("backToTop")}
            </button>
          </article>
        </div>
      </section>
    </>
  );
}
