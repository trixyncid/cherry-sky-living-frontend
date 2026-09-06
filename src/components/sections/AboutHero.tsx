/**
 * About hero — cinematic story, trust facts, conversion CTAs
 */

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import { generateWhatsAppURL } from "@/lib/utils/format";
import { getContactWhatsAppNumber } from "@/lib/contact";

const ABOUT_PHOTO =
  "https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=1920&h=1080&fit=crop&q=80";

export function AboutHero() {
  const t = useTranslations("about.hero");
  const tWhatsapp = useTranslations("whatsapp");
  const viewingUrl = generateWhatsAppURL(
    getContactWhatsAppNumber(),
    tWhatsapp("generalInquiry"),
  );

  return (
    <section className="relative flex min-h-[min(78svh,40rem)] w-full flex-col justify-center overflow-hidden hero-atmosphere pt-[max(5rem,calc(4rem+env(safe-area-inset-top)))] lg:h-[min(70svh,44rem)]">
      <div className="absolute inset-0">
        <motion.div
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Image
            src={ABOUT_PHOTO}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </motion.div>
        <div className="absolute inset-0 hero-overlay-x" />
        <div className="absolute inset-0 hero-overlay-y" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-16 lg:px-10">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-md"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d4af37]" />
          {t("eyebrow")}
        </motion.p>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.1,
            duration: 0.55,
            type: "spring",
            stiffness: 70,
          }}
          className="max-w-3xl text-[2.15rem] font-bold leading-[1.1] tracking-tight text-[#faf9f6] sm:text-5xl lg:text-[3.25rem]"
        >
          {t("title")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.45 }}
          className="mt-4 max-w-xl text-sm font-light leading-relaxed text-[#f5f2ee]/90 md:text-base"
        >
          {t("description")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.45 }}
          className="mt-8 flex flex-wrap items-center gap-3"
        >
          <Link
            href="/search-kosts"
            className="inline-flex items-center gap-2 rounded-full bg-[#6f4627] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgb(111_70_39_/_0.35)] hover:bg-[#805533]"
          >
            {t("ctaRooms")}
            <Icon name="arrow_forward" size={16} />
          </Link>
          <a
            href={viewingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/15"
          >
            <Icon name="whatsapp" size={16} />
            {t("ctaViewing")}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
