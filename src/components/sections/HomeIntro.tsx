/**
 * Home intro: property photography, story, and trust stats
 */

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { StatsBar } from "@/components/sections/StatsBar";
import { Icon } from "@/components/shared/Icon";

const INTRO_IMAGES = [
  { src: "/assets/cherry-kost.jpeg", altKey: "photoCherry" as const },
  { src: "/assets/skykost.jpeg", altKey: "photoSky" as const },
] as const;

const STORY_POINTS = [
  { icon: "king_bed", key: "furnished" },
  { icon: "verified_user", key: "security" },
  { icon: "handshake", key: "support" },
] as const;

export function HomeIntro() {
  const t = useTranslations("home.intro");

  return (
    <section className="relative w-full overflow-hidden bg-[#faf9f6] px-6 py-20 lg:px-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#f3eee8] to-transparent" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-14">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-14">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl text-3xl font-semibold tracking-tight text-[#1a1c1a] md:text-5xl md:leading-[1.08]"
          >
            {t("title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="max-w-md text-sm leading-relaxed text-[#83746b] md:text-base"
          >
            {t("description")}
          </motion.p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-5 sm:grid-cols-2">
            {INTRO_IMAGES.map((image, index) => (
              <motion.div
                key={image.src}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className={`relative min-h-[240px] overflow-hidden rounded-[1.5rem] sm:min-h-[320px] ${
                  index === 0 ? "sm:mt-8" : "sm:mb-8"
                }`}
              >
                <Image
                  src={image.src}
                  alt={t(image.altKey)}
                  fill
                  sizes="(max-width: 640px) 100vw, 40vw"
                  className="object-cover transition-transform duration-700 hover:scale-[1.03]"
                />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.12 }}
            className="flex flex-col justify-center border-t border-[#e3e2e0] pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#83746b]">
              {t("storyEyebrow")}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[#51443c] md:text-[15px]">
              {t("story")}
            </p>
            <ul className="mt-8 space-y-4">
              {STORY_POINTS.map((point) => (
                <li
                  key={point.key}
                  className="flex items-start gap-3 text-sm leading-snug text-[#1a1c1a]"
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f5e4d4] text-[#71130d]">
                    <Icon name={point.icon} size={16} />
                  </span>
                  <span className="pt-1.5">{t(`points.${point.key}`)}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <StatsBar />
      </div>
    </section>
  );
}
