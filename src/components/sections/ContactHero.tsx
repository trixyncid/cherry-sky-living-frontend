/**
 * Contact hero — story on the left, quick-reach glass card on the right
 */

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { generateWhatsAppURL } from "@/lib/utils/format";
import { getContactWhatsAppNumber } from "@/lib/contact";

const CONTACT_PHOTO =
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1920&h=1080&fit=crop&q=80";

export function ContactHero() {
  const t = useTranslations("contact.hero");
  const tInfo = useTranslations("contact.info");
  const tWhatsapp = useTranslations("whatsapp");
  const whatsappURL = generateWhatsAppURL(
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
            src={CONTACT_PHOTO}
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

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-10">
        <div className="max-w-2xl">
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
            className="text-[2.15rem] font-bold leading-[1.1] tracking-tight text-[#faf9f6] sm:text-5xl lg:text-[3.25rem]"
          >
            {t("title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26, duration: 0.45 }}
            className="mt-4 max-w-lg text-sm font-light leading-relaxed text-[#f5f2ee]/90 md:text-base"
          >
            {t("description")}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-5 text-xs font-medium text-white/70"
          >
            {t("responseTime")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48 }}
            className="mt-7 flex flex-wrap gap-3 lg:hidden"
          >
            <a
              href={whatsappURL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1fb855]"
            >
              <Icon name="whatsapp" size={16} />
              {t("whatsapp")}
            </a>
            <a
              href="tel:+628116359119"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/15"
            >
              <Icon name="call" size={16} />
              {t("call")}
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="glass-card hidden overflow-hidden rounded-[1.75rem] lg:block"
        >
          <div className="border-b border-[#eee4db] px-6 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#83746b]">
              {t("reachTitle")}
            </p>
          </div>
          <div className="flex flex-col gap-1 p-3">
            <a
              href={whatsappURL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-[#f4fbf6]"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white">
                <Icon name="whatsapp" size={18} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-[#1a1c1a]">
                  {t("whatsapp")}
                </span>
                <span className="text-xs text-[#83746b]">
                  {tInfo("phonePrimary")}
                </span>
              </span>
            </a>
            <a
              href="tel:+628116359119"
              className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-[#faf9f6]"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#6f4627] text-white">
                <Icon name="call" size={18} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-[#1a1c1a]">
                  {t("call")}
                </span>
                <span className="text-xs text-[#83746b]">
                  {tInfo("phonePrimary")}
                </span>
              </span>
            </a>
            <a
              href="mailto:info@cherryskykost.com"
              className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-[#faf9f6]"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f5e4d4] text-[#6f4627]">
                <Icon name="mail" size={18} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-[#1a1c1a]">
                  {t("email")}
                </span>
                <span className="text-xs text-[#83746b]">
                  {tInfo("emailPrimary")}
                </span>
              </span>
            </a>
            <div className="flex items-center gap-3 rounded-2xl px-3 py-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f5e4d4] text-[#6f4627]">
                <Icon name="schedule" size={18} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-[#1a1c1a]">
                  {t("hours")}
                </span>
                <span className="text-xs text-[#83746b]">
                  {tInfo("weekdaysHours")}
                </span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
