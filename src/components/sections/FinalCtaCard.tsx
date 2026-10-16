/**
 * Final call to action (§5.13) — rounded card on the footer's photo:
 * live availability headline, viewing + inquiry actions (the inquiry form
 * opens in a dialog and saves a lead).
 */

"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { LeadDialog } from "@/components/leads/LeadDialog";
import { SurveyScheduleDialog } from "@/components/sections/SurveyScheduleDialog";
import { Icon } from "@/components/shared/Icon";
import { Reveal } from "@/components/shared/Reveal";
import type { Kost } from "@/lib/types";

const FALLBACK_PHOTO = "/assets/cherry-kost.jpeg";

export function FinalCtaCard({
  kosts = [],
  isLoading = false,
}: {
  kosts?: Kost[];
  isLoading?: boolean;
}) {
  const t = useTranslations("home.cta");
  const tFooter = useTranslations("footer");
  const availableRooms = kosts.reduce((sum, k) => sum + k.availableRooms, 0);
  const photo =
    kosts.flatMap((k) => k.roomTypes.flatMap((rt) => rt.images))[1] ??
    kosts[0]?.thumbnail ??
    FALLBACK_PHOTO;

  return (
    <Reveal className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[2rem] bg-[#f4f5f8] shadow-[0_40px_80px_-40px_rgb(0_0_0/0.6)]">
      <div className="absolute inset-y-0 right-0 hidden w-[62%] sm:block">
        <Image
          src={photo}
          alt=""
          fill
          sizes="(max-width: 1280px) 60vw, 720px"
          className="object-cover [mask-image:linear-gradient(to_right,transparent_0%,black_45%)]"
        />
      </div>
      <div className="relative max-w-xl px-7 py-9 sm:px-10 sm:py-11">
        <h2
          id="cta-heading"
          className="text-[clamp(1.75rem,2.6vw,2.35rem)] font-medium leading-[1.08] tracking-[-0.03em] text-[#141414]"
        >
          {isLoading ? (
            <span className="inline-block h-[0.9em] w-3/4 animate-pulse rounded-lg bg-[#e3e4e9] align-middle" />
          ) : (
            t("liveTitle", { count: availableRooms })
          )}
          <span className="block text-[#6b6f7a]">{t("titleAccent")}</span>
        </h2>
        <p className="mt-4 max-w-md text-base leading-relaxed text-[#3d4048]">
          {t("description")}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <SurveyScheduleDialog
            triggerLabel={t("schedule")}
            className="mt-0 h-12 justify-center gap-2.5 rounded-full bg-[#71130d] px-7 text-[15px] font-medium shadow-[0_18px_36px_-18px_rgb(0_0_0/0.6)] hover:bg-[#8a1a12]"
          />
          <LeadDialog
            type="inquiry"
            kosts={kosts}
            trigger={
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#141414]/15 bg-white/80 px-6 text-[15px] font-medium text-[#141414] backdrop-blur-sm hover:bg-white"
              >
                <Icon name="edit_note" size={18} />
                {tFooter("sendInquiry")}
              </button>
            }
          />
        </div>
      </div>
    </Reveal>
  );
}
