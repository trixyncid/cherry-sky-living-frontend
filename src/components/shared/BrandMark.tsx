/**
 * Brand mark — Cherry Sky Living logos for public marketing surfaces
 */

"use client";

import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  /** `onDark` = light silhouette for hero/footer; `onLight` = original brand colors */
  tone?: "onDark" | "onLight";
  /** `mark` = icon only; `nav` = full wordmark for navigation */
  variant?: "mark" | "nav";
}

const LOGO_SRC = {
  mark: "/cherry-sky-living-logo.svg",
  nav: "/cherry-sky-living-logo-nav.svg",
} as const;

export function BrandMark({
  className,
  tone = "onLight",
  variant = "mark",
}: BrandMarkProps) {
  const onDark = tone === "onDark";

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden",
        className,
      )}
    >
      {/* Plain img avoids next/image SSR/client attribute drift on static SVGs */}
      <img
        src={LOGO_SRC[variant]}
        alt=""
        className={cn(
          "h-full w-full object-contain object-center transition-[filter,opacity] duration-300",
          onDark &&
            "brightness-0 invert drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]",
        )}
      />
    </span>
  );
}
