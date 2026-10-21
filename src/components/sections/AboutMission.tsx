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
    <section className="relative w-full overflow-hidden bg-subtle px-6 py-20 lg:px-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-subtle to-transparent" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-16">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
              {t("eyebrow")}
            </p>
            <h2 className="mb-4 max-w-md text-3xl font-semibold tracking-tight text-fg md:text-4xl">
              {t("storyTitle")}
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-fg-muted md:text-base">
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

        <div className="grid gap-px overflow-hidden rounded-[1.5rem] border border-line bg-line md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-subtle p-8 md:p-10"
          >
            <div className="mb-5 inline-flex size-11 items-center justify-center rounded-xl bg-brand text-white">
              <Icon name="flag" size={22} />
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand">
              {t("missionLabel")}
            </p>
            <h3 className="mb-3 text-2xl font-semibold tracking-tight text-fg">
              {t("title")}
            </h3>
            <p className="text-sm leading-relaxed text-fg-2 md:text-base">
              {t("description")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="bg-subtle p-8 md:p-10"
          >
            <div className="mb-5 inline-flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Icon name="visibility" size={22} />
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-fg-muted">
              {t("visionLabel")}
            </p>
            <h3 className="mb-3 text-2xl font-semibold tracking-tight text-fg">
              {t("vision")}
            </h3>
            <p className="text-sm leading-relaxed text-fg-2 md:text-base">
              {t("visionDescription")}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
