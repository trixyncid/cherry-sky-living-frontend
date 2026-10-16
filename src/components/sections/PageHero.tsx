/**
 * Inner-page hero in the homepage's language: night-graded photo, the
 * transparent navbar over it, guide lines, a glass pill eyebrow and a
 * centred two-tone headline. Page-specific controls go in `children`.
 */

"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow: string;
  titleLead: string;
  titleAccent?: string;
  description?: string;
  photo?: string;
  /** Shows a pulsing live dot in the eyebrow pill. */
  live?: boolean;
  children?: ReactNode;
  className?: string;
}

const DEFAULT_PHOTO = "/assets/cherry-kost.jpeg";

export function PageHero({
  eyebrow,
  titleLead,
  titleAccent,
  description,
  photo,
  live = false,
  children,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative w-full overflow-hidden bg-[#1c0b0a] text-white",
        className,
      )}
    >
      <Image
        src={photo || DEFAULT_PHOTO}
        alt=""
        fill
        priority
        loading="eager"
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="pointer-events-none absolute inset-0 bg-[#4a100c]/45 mix-blend-multiply" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgb(28_11_10/0.9)_0%,rgb(28_11_10/0.72)_45%,rgb(28_11_10/0.92)_100%)]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-[22%] hidden w-px bg-white/10 lg:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-[22%] hidden w-px bg-white/10 lg:block"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[90rem] flex-col items-center px-5 pb-12 pt-28 text-center sm:px-8 lg:pb-16 lg:pt-32">
        <p className="inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.08] px-4 py-2 text-[15px] backdrop-blur-md">
          {live ? (
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34d399]/70 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-[#34d399]" />
            </span>
          ) : null}
          {eyebrow}
        </p>
        <h1 className="mt-6 max-w-4xl text-balance text-[clamp(2rem,3.4vw,3.1rem)] font-medium leading-[1.06] tracking-[-0.035em]">
          {titleLead}
          {titleAccent ? (
            <>
              {" "}
              <span className="text-white/60">{titleAccent}</span>
            </>
          ) : null}
        </h1>
        {description ? (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-8 w-full">{children}</div> : null}
      </div>
    </section>
  );
}
