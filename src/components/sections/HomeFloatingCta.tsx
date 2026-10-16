/**
 * Floating WhatsApp bubble (desktop) — appears once the hero scrolls away.
 * Mobile has no sticky bar; contact lives in each page's CTAs and footer.
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
        // Desktop bubble only
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
          className="group fixed bottom-6 right-6 z-40 hidden h-14 items-center gap-0 overflow-hidden rounded-full bg-[#25D366] pl-4 pr-4 text-white shadow-[0_16px_40px_-12px_rgb(37_211_102/0.6)] transition-[gap,padding] duration-300 hover:gap-2 hover:pr-6 md:inline-flex"
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
