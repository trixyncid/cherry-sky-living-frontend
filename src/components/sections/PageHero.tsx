/**
 * Inner-page hero in the homepage's language: dusk-graded photo under the
 * transparent navbar, a ruled uppercase eyebrow and a left-aligned two-line
 * headline (white, then muted). Page-specific controls go in `children`.
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
        "relative isolate w-full overflow-hidden bg-ink text-white",
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
        className="-z-10 object-cover object-center"
      />
      {/* Dusk grade, as on the homepage: navy from the left, darker below. */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(22_16_38/0.9)_0%,rgb(22_16_38/0.65)_45%,rgb(42_31_69/0.3)_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgb(22_16_38/0.6)_0%,transparent_30%,rgb(22_16_38/0.85)_100%)]" />

      <div className="relative mx-auto w-full max-w-[90rem] px-5 pb-12 pt-32 sm:px-8 lg:px-12 lg:pb-16 lg:pt-40">
        <p className="flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.32em] text-white/80">
          {live ? (
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-bright/70 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-success-bright" />
            </span>
          ) : (
            <span aria-hidden className="h-px w-12 bg-white/60" />
          )}
          {eyebrow}
        </p>
        <h1 className="mt-6 max-w-4xl text-[clamp(2.25rem,5vw,4.25rem)] font-semibold leading-[1] tracking-[-0.04em]">
          <span className="block text-balance">{titleLead}</span>
          {titleAccent ? (
            <span className="block text-balance font-normal text-white/60">
              {titleAccent}
            </span>
          ) : null}
        </h1>
        {description ? (
          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/80 md:text-[17px]">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-10 w-full">{children}</div> : null}
      </div>
    </section>
  );
}
