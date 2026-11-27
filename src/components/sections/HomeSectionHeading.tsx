/**
 * Section heading: ruled uppercase eyebrow in a narrow left column, a
 * stacked two-tone statement on the right, optional aside.
 */

import type { ReactNode } from "react";
import { Eyebrow } from "@/components/shared/ArrowPill";
import { Reveal } from "@/components/shared/Reveal";
import { cn } from "@/lib/utils";

interface HomeSectionHeadingProps {
  id: string;
  eyebrow?: string;
  titleLead: string;
  titleAccent: string;
  aside?: ReactNode;
  tone?: "light" | "dark";
  /** h1 when the section is the main content of its own page. */
  level?: "h1" | "h2";
  className?: string;
}

export function HomeSectionHeading({
  id,
  eyebrow,
  titleLead,
  titleAccent,
  aside,
  tone = "light",
  level = "h2",
  className,
}: HomeSectionHeadingProps) {
  const dark = tone === "dark";
  const Heading = level;

  return (
    <Reveal
      className={cn(
        "grid gap-5 lg:grid-cols-[minmax(0,13rem)_1fr] lg:gap-10",
        className,
      )}
    >
      <div className="lg:pt-2">
        {eyebrow ? <Eyebrow tone={tone}>{eyebrow}</Eyebrow> : null}
      </div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <Heading
          id={id}
          className={cn(
            "max-w-3xl text-[clamp(1.9rem,3.2vw,2.9rem)] font-semibold leading-[1.02] tracking-[-0.035em]",
            dark ? "text-white" : "text-fg",
          )}
        >
          <span className="block text-balance">{titleLead}</span>
          <span
            className={cn(
              "block text-balance font-normal",
              dark ? "text-white/55" : "text-fg/45",
            )}
          >
            {titleAccent}
          </span>
        </Heading>
        {aside ? (
          <div className="flex shrink-0 flex-col gap-4 lg:max-w-xs">
            {aside}
          </div>
        ) : null}
      </div>
    </Reveal>
  );
}
