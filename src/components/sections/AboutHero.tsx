/**
 * About hero — brand-led cinematic story + conversion CTAs
 */

"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import { getContactWhatsAppNumber } from "@/lib/contact";
import { generateWhatsAppURL } from "@/lib/utils/format";

const ABOUT_PHOTO = "/assets/skykost.jpeg";

export function AboutHero() {
  const t = useTranslations("about.hero");
  const tBrand = useTranslations("common.brand");
  const tWhatsapp = useTranslations("whatsapp");
  const viewingUrl = generateWhatsAppURL(
    getContactWhatsAppNumber(),
    tWhatsapp("generalInquiry"),
  );

  return (
    <section className="relative flex min-h-[min(78svh,40rem)] w-full flex-col justify-end overflow-hidden hero-atmosphere pt-[max(5rem,calc(4rem+env(safe-area-inset-top)))] lg:min-h-[min(70svh,44rem)]">
      <div className="absolute inset-0">
        <motion.div
          initial={false}
          animate={{ scale: 1 }}
          transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 origin-center will-change-transform"
        >
          <img
            src={ABOUT_PHOTO}
            alt={tBrand("fullName")}
            className="absolute inset-0 h-full w-full object-cover object-[center_45%]"
            fetchPriority="high"
            decoding="async"
          />
        </motion.div>
        <div className="absolute inset-0 hero-overlay-x" />
        <div className="absolute inset-0 hero-overlay-y" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-deep/55 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-14 pt-24 sm:pb-16 lg:px-10 lg:pb-20">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-[clamp(2.1rem,5.5vw,3.5rem)] font-bold leading-[0.95] tracking-[-0.03em] text-subtle"
        >
          {tBrand("fullName")}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-2xl text-xl font-medium leading-snug tracking-tight text-panel sm:text-2xl lg:text-[1.7rem]"
        >
          {t("title")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 max-w-xl text-sm font-light leading-relaxed text-panel/85 md:text-[15px]"
        >
          {t("description")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 flex flex-wrap items-center gap-3"
        >
          <a
            href={viewingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            <Icon name="whatsapp" size={16} />
            {t("ctaViewing")}
          </a>
          <Link
            href="/search-kosts"
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/18"
          >
            {t("ctaRooms")}
            <Icon name="arrow_forward" size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
