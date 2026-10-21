/**
 * Always-reachable contact (§5.15) — appears once the hero scrolls away:
 * a small floating WhatsApp bubble on every screen size (no sticky bottom
 * bar on phones or tablets).
 */

"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { track } from "@/lib/analytics";
import { getContactWhatsAppNumber } from "@/lib/contact";
import { generateWhatsAppURL } from "@/lib/utils/format";

const SHOW_AFTER_PX = 640;

export interface FloatingCtaOptions {
  /** Pre-filled WhatsApp message for this page (§5.15). */
  whatsappMessage?: string;
  /** Show from the top (detail pages) instead of after the hero. */
  alwaysVisible?: boolean;
}

export function HomeFloatingCta({
  whatsappMessage,
  alwaysVisible = false,
}: FloatingCtaOptions = {}) {
  const t = useTranslations("home.floating");
  const tWhatsapp = useTranslations("whatsapp");
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () =>
      setVisible(alwaysVisible || window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [alwaysVisible]);

  const whatsappUrl = generateWhatsAppURL(
    getContactWhatsAppNumber(),
    whatsappMessage ?? tWhatsapp("generalInquiry"),
  );
  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 24 },
        transition: { duration: 0.3 },
      };

  return (
    <AnimatePresence>
      {visible ? (
        // WhatsApp bubble (all screen sizes; no bottom bar on phones)
        <motion.a
          key="bubble"
          {...motionProps}
          href={whatsappUrl}
          onClick={() =>
            track("click_whatsapp", { location: "floating_bubble" })
          }
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("chatLabel")}
          className="group fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 inline-flex h-12 items-center gap-0 overflow-hidden rounded-full bg-ink px-3.5 text-white shadow-[0_16px_40px_-12px_rgb(37_211_102/0.6)] transition-[gap,padding] duration-300 hover:gap-2 hover:pr-6 md:bottom-6 md:right-6 md:h-14 md:px-4"
        >
          <Icon name="whatsapp" size={24} />
          <span className="max-w-0 whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-300 group-hover:max-w-48 group-hover:opacity-100">
            {t("chatLabel")}
          </span>
        </motion.a>
      ) : null}
    </AnimatePresence>
  );
}
