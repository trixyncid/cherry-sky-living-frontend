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
        <p className="inline-flex rounded-full border border-white/12 bg-white/[0.08] px-4 py-2 text-sm text-white/80 backdrop-blur-md">
          {t("lastUpdated")}
        </p>
      </PageHero>

      <section className="w-full px-5 py-12 sm:px-8 lg:py-16">
        <div className="mx-auto grid w-full max-w-[90rem] gap-10 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-16">
          <nav
            aria-label={tLegal("onThisPage")}
            className="lg:sticky lg:top-24 lg:self-start"
          >
            <p className="mb-3 text-sm font-semibold text-[#141414]">
              {tLegal("onThisPage")}
            </p>
            <ol className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:overflow-visible [&::-webkit-scrollbar]:hidden">
              {sections.map(([key, section], i) => (
                <li key={key} className="shrink-0">
                  <a
                    href={`#${key}`}
                    aria-current={active === key ? "location" : undefined}
                    className={cn(
                      "flex items-start gap-3 rounded-xl px-3 py-2 text-[15px] transition-colors",
                      active === key
                        ? "bg-white font-semibold text-[#141414]"
                        : "text-[#6b6b6b] hover:text-[#141414]",
                    )}
                  >
                    <span className="tabular-nums text-[#857f77]">
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
                className="scroll-mt-24 border-b border-[#e7e4df] py-8 first:pt-0 last:border-b-0"
              >
                <span className="text-sm font-semibold tabular-nums text-[#71130d]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2
                  id={`${key}-title`}
                  className="mt-2 text-2xl font-medium tracking-tight text-[#141414]"
                >
                  {stripNumber(section.title)}
                </h2>
                <p className="mt-4 text-[17px] leading-[1.75] text-[#3d3a36]">
                  {section.content}
                </p>
                {section.items?.length ? (
                  <ul className="mt-4 flex flex-col gap-2.5">
                    {section.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-[17px] leading-[1.7] text-[#3d3a36]"
                      >
                        <span
                          aria-hidden
                          className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-[#71130d]"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            <div className="mt-10 flex flex-col items-start gap-4 rounded-[1.25rem] bg-[#71130d] p-6 text-white sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold">{tLegal("questions")}</p>
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
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-semibold text-[#141414]"
              >
                <Icon name="whatsapp" size={16} className="text-[#25D366]" />
                WhatsApp
              </a>
            </div>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#3d3a36] hover:text-[#141414]"
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
