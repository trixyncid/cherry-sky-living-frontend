/**
 * Floating section dock (desktop): a glass pill at the bottom of the screen
 * that shows where you are in the page and jumps between sections, with
 * WhatsApp always one click away. Phones use the sticky bar instead.
 */

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { cn } from "@/lib/utils";
import { type PropertyVM, trackWhatsApp, whatsappHref } from "./shared";

const ITEMS = [
  { id: "pilih", key: "choose" },
  { id: "journey", key: "journey" },
  { id: "kamar", key: "rooms" },
  { id: "fasilitas", key: "facilities" },
  { id: "lokasi", key: "location" },
  { id: "faq", key: "faq" },
] as const;

export function SectionDock({ selected }: { selected?: PropertyVM }) {
  const t = useTranslations("landing.dock");
  const locale = useLocale();
  const [show, setShow] = useState(false);
  const [active, setActive] = useState("");
  const [present, setPresent] = useState<string[]>([]);

  // Which sections exist depends on the chosen property; re-scan when it changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-scan the DOM when the chosen property changes
  useEffect(() => {
    const scan = () => {
      const marker = window.scrollY + window.innerHeight * 0.45;
      const found = ITEMS.filter((i) => document.getElementById(i.id));
      setPresent(found.map((i) => i.id));
      let current = "";
      for (const item of found) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top + window.scrollY <= marker)
          current = item.id;
      }
      setActive(current);
      const footer = document.getElementById("contact");
      const nearEnd = footer
        ? footer.getBoundingClientRect().top < window.innerHeight * 0.9
        : false;
      setShow(window.scrollY > window.innerHeight * 0.6 && !nearEnd);
    };
    scan();
    window.addEventListener("scroll", scan, { passive: true });
    window.addEventListener("resize", scan);
    return () => {
      window.removeEventListener("scroll", scan);
      window.removeEventListener("resize", scan);
    };
  }, [selected?.key]);

  const ctx = { property: selected, section: "dock" };
  return (
    <nav
      aria-label={t("label")}
      className={cn(
        "fixed bottom-5 left-1/2 z-40 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-white/15 bg-ink/80 p-1.5 text-white shadow-[0_20px_50px_-20px_rgb(0_0_0/0.7)] backdrop-blur-xl transition-all duration-300 lg:flex",
        show
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-6 opacity-0",
      )}
    >
      {ITEMS.filter((i) => present.includes(i.id)).map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          tabIndex={show ? 0 : -1}
          aria-current={active === item.id ? "true" : undefined}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
            active === item.id
              ? "bg-white text-ink"
              : "text-white/75 hover:text-white",
          )}
        >
          {item.key === "journey" && selected ? selected.name : t(item.key)}
        </a>
      ))}
      <a
        href={whatsappHref(ctx, locale)}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={show ? 0 : -1}
        onClick={() => trackWhatsApp(ctx)}
        className="ml-1 inline-flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-2 text-sm font-semibold text-ink hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <Icon name="whatsapp" size={16} />
        WhatsApp
      </a>
    </nav>
  );
}
