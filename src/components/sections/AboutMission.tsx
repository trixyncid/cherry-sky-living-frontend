/**
 * About mission — real property story + mission / vision
 */

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";

export function AboutMission() {
  const t = useTranslations("about.mission");

  return (
    <section className="relative w-full overflow-hidden bg-[#faf9f6] px-6 py-20 lg:px-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#f3eee8] to-transparent" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-16">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#83746b]">
              {t("eyebrow")}
            </p>
            <h2 className="mb-4 max-w-md text-3xl font-semibold tracking-tight text-[#1a1c1a] md:text-4xl">
              {t("storyTitle")}
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-[#83746b] md:text-base">
              {t("storyDescription")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative min-h-[320px] overflow-hidden rounded-[1.5rem] md:min-h-[420px]"
          >
            <Image
              src="/assets/cherry-kost.jpeg"
              alt={t("storyPhotoAlt")}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </motion.div>
        </div>

        <div className="grid gap-px overflow-hidden rounded-[1.5rem] border border-[#e3e2e0] bg-[#e3e2e0] md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-[#faf9f6] p-8 md:p-10"
          >
            <div className="mb-5 inline-flex size-11 items-center justify-center rounded-xl bg-[#71130d] text-white">
              <Icon name="flag" size={22} />
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#71130d]">
              {t("missionLabel")}
            </p>
            <h3 className="mb-3 text-2xl font-semibold tracking-tight text-[#1a1c1a]">
              {t("title")}
            </h3>
            <p className="text-sm leading-relaxed text-[#51443c] md:text-base">
              {t("description")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="bg-[#faf9f6] p-8 md:p-10"
          >
            <div className="mb-5 inline-flex size-11 items-center justify-center rounded-xl bg-[#f5e4d4] text-[#71130d]">
              <Icon name="visibility" size={22} />
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#83746b]">
              {t("visionLabel")}
            </p>
            <h3 className="mb-3 text-2xl font-semibold tracking-tight text-[#1a1c1a]">
              {t("vision")}
            </h3>
            <p className="text-sm leading-relaxed text-[#51443c] md:text-base">
              {t("visionDescription")}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
