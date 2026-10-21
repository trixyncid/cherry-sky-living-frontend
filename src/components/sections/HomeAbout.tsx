/**
 * About + live stats. The statement reveals word by word on scroll
 * (static under prefers-reduced-motion); stats are computed from data.
 */

"use client";

import {
  type MotionValue,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { Eyebrow } from "@/components/shared/ArrowPill";
import { Reveal } from "@/components/shared/Reveal";
import type { Kost } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";

function Word({
  word,
  index,
  total,
  progress,
}: {
  word: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const start = index / total;
  // Grey → ink (not transparent) so every word stays above WCAG contrast.
  const color = useTransform(
    progress,
    [start, start + 1 / total],
    ["#6b6b6b", "#141414"],
  );
  return (
    <motion.span style={{ color }} className="inline">
      {word}{" "}
    </motion.span>
  );
}

function RevealStatement({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 85%", "end 45%"],
  });
  const words = text.split(" ");

  return (
    <p
      ref={ref}
      className="text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium leading-[1.22] tracking-[-0.025em] text-fg"
    >
      {reduceMotion
        ? text
        : words.map((word, i) => (
            <Word
              // biome-ignore lint/suspicious/noArrayIndexKey: words can repeat; order is stable
              key={i}
              word={word}
              index={i}
              total={words.length}
              progress={scrollYProgress}
            />
          ))}
    </p>
  );
}

interface HomeAboutProps {
  kosts?: Kost[];
  isLoading?: boolean;
}

export function HomeAbout({ kosts = [], isLoading = false }: HomeAboutProps) {
  const t = useTranslations("home.intro");
  const tHero = useTranslations("hero");

  const availableRooms = kosts.reduce((sum, k) => sum + k.availableRooms, 0);
  const prices = kosts.map((k) => k.priceRange.min).filter((p) => p > 0);
  const lowest = prices.length > 0 ? Math.min(...prices) : 0;
  const city = kosts[0]?.location.city || "";

  const stats = [
    { value: String(availableRooms), label: tHero("statRooms") },
    {
      value: lowest > 0 ? formatCurrency(lowest, { compact: true }) : "—",
      label: tHero("statPrice"),
    },
    {
      value: String(kosts.length),
      label: city
        ? tHero("statResidencesIn", { city })
        : tHero("statResidences"),
    },
  ];

  return (
    <section
      aria-label={t("eyebrow")}
      className="w-full px-5 py-16 sm:px-8 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[90rem] border-t border-line-strong pt-10 lg:pt-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div className="flex flex-col gap-8">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <Reveal className="relative hidden aspect-[4/3.2] overflow-hidden rounded-[1.5rem] lg:block">
              <Image
                src="/assets/skykost.jpeg"
                alt={t("photoSky")}
                fill
                sizes="(max-width: 1024px) 100vw, 35vw"
                className="object-cover grayscale contrast-[1.05]"
              />
            </Reveal>
          </div>

          <div className="flex flex-col gap-8">
            <RevealStatement text={t("description")} />

            <Reveal className="flex items-center gap-5">
              <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src="/assets/cherry-kost.jpeg"
                  alt={t("photoCherry")}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>
              <p className="text-base font-medium leading-relaxed text-fg">
                {t("points.support")}
              </p>
            </Reveal>

            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((stat, index) => (
                <Reveal
                  key={stat.label}
                  delay={index * 0.08}
                  className="flex min-h-[10rem] flex-col justify-between rounded-[1.25rem] bg-white p-5"
                >
                  <span className="font-mono text-[13px] text-fg-muted">
                    {`//0${index + 1}`}
                  </span>
                  <div className="flex flex-col-reverse">
                    <p className="mt-2 text-sm text-fg-muted">{stat.label}</p>
                    <p className="text-[clamp(2rem,3.4vw,2.75rem)] font-medium leading-none tracking-[-0.04em] text-fg tabular-nums">
                      {isLoading ? (
                        <span className="inline-block h-9 w-20 animate-pulse rounded-md bg-hover" />
                      ) : (
                        stat.value
                      )}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
