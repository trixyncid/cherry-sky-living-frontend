/**
 * Hero continuation — same dark navy as the hero's fade-out. A two-tone
 * statement whose muted half lights up on scroll, three round shortcut
 * buttons, two real room photos, and the owner-managed facts strip.
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
import { Icon } from "@/components/shared/Icon";
import { Reveal } from "@/components/shared/Reveal";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/routing";
import { track } from "@/lib/analytics";
import type { Kost } from "@/lib/types";
import { generateWhatsAppURL } from "@/lib/utils/format";

const FALLBACK_PHOTO_A = "/assets/cherry-kost.jpeg";
const FALLBACK_PHOTO_B = "/assets/skykost.jpeg";

/** Muted (≥4.5:1 on the navy) → white as the statement scrolls into view. */
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
  const color = useTransform(
    progress,
    [start, start + 1 / total],
    ["#b39a97", "#ffffff"],
  );
  return (
    <motion.span style={{ color }} className="inline">
      {word}{" "}
    </motion.span>
  );
}

function Statement({ lead, accent }: { lead: string; accent: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "end 40%"],
  });
  const words = accent.split(" ");

  return (
    <p
      ref={ref}
      className="max-w-3xl text-[clamp(1.5rem,2.3vw,2.1rem)] font-medium leading-[1.2] tracking-[-0.025em] text-white"
    >
      {lead}{" "}
      {reduceMotion ? (
        <span className="text-[#e5d6d4]">{accent}</span>
      ) : (
        words.map((word, i) => (
          <Word
            // biome-ignore lint/suspicious/noArrayIndexKey: words can repeat; order is stable
            key={i}
            word={word}
            index={i}
            total={words.length}
            progress={scrollYProgress}
          />
        ))
      )}
    </p>
  );
}

export function HomeContinuation({ kosts = [] }: { kosts?: Kost[] }) {
  const t = useTranslations("home.continuation");
  const tTrust = useTranslations("trust");
  const tWhatsapp = useTranslations("whatsapp");
  const brand = useTranslations("common.brand")("fullName");

  const roomPhotos = kosts.flatMap((k) =>
    k.roomTypes.flatMap((rt) =>
      rt.images.map((src) => ({ src, name: k.name })),
    ),
  );
  const photos = [
    roomPhotos[0]
      ? {
          src: roomPhotos[0].src,
          alt: t("photoRoom", { name: roomPhotos[0].name }),
        }
      : { src: FALLBACK_PHOTO_A, alt: t("photoHouse", { name: brand }) },
    kosts[1]?.thumbnail
      ? {
          src: kosts[1].thumbnail,
          alt: t("photoHouse", { name: kosts[1].name }),
        }
      : roomPhotos[2]
        ? {
            src: roomPhotos[2].src,
            alt: t("photoRoom", { name: roomPhotos[2].name }),
          }
        : { src: FALLBACK_PHOTO_B, alt: t("photoHouse", { name: brand }) },
  ];
  const facts = tTrust.raw("facts") as string[];

  const shortcut =
    "flex size-14 items-center justify-center rounded-full bg-white/[0.08] text-white transition-colors hover:bg-white hover:text-[#1c0b0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";

  return (
    <section
      aria-label={t("lead")}
      className="w-full bg-[#1c0b0a] px-5 pb-12 pt-8 text-white sm:px-8 lg:pb-16 lg:pt-10"
    >
      <div className="mx-auto grid w-full max-w-[90rem] gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)] lg:gap-14">
        <div className="flex flex-col justify-between gap-10">
          <Statement lead={t("lead")} accent={t("accent")} />
          <div className="flex gap-3">
            <Link
              href="/search-kosts"
              aria-label={t("iconRooms")}
              title={t("iconRooms")}
              className={shortcut}
            >
              <Icon name="bed" size={24} />
            </Link>
            <a
              href={generateWhatsAppURL(
                siteConfig.whatsappNumber,
                tWhatsapp("generalInquiry"),
              )}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                track("click_whatsapp", { location: "home_continuation" })
              }
              aria-label={t("iconChat")}
              title={t("iconChat")}
              className={shortcut}
            >
              <Icon name="forum" size={24} />
            </a>
            <Link
              href="/location"
              aria-label={t("iconLocation")}
              title={t("iconLocation")}
              className={shortcut}
            >
              <Icon name="my_location" size={24} />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 self-end lg:mt-16">
          {photos.map((photo, i) => (
            <Reveal
              key={`${photo.src}-${i}`}
              delay={i * 0.1}
              className="relative aspect-square overflow-hidden rounded-[1.25rem] bg-white/5"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 1024px) 50vw, 22vw"
                className="object-cover"
              />
            </Reveal>
          ))}
        </div>
      </div>

      {/* Owner-managed + true facts marquee */}
      <div className="mx-auto mt-12 flex w-full max-w-[90rem] flex-col gap-4 border-t border-white/10 pt-6 lg:flex-row lg:items-center lg:gap-8">
        <div className="flex shrink-0 items-center gap-3 lg:border-r lg:border-white/10 lg:pr-8">
          <span className="flex size-10 items-center justify-center rounded-full bg-white/[0.08] text-[#f3dedb]">
            <Icon name="verified_user" size={20} />
          </span>
          <div>
            <p className="text-[15px] font-semibold">{tTrust("owner")}</p>
            <p className="text-sm text-white/60">{tTrust("ownerSub")}</p>
          </div>
        </div>
        <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          <ul className="animate-marquee flex w-max gap-3">
            {[...facts, ...facts].map((fact, i) => (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: duplicated marquee track
                key={`${fact}-${i}`}
                aria-hidden={i >= facts.length}
                className="whitespace-nowrap rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-[15px] font-medium text-white/90"
              >
                {fact}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
