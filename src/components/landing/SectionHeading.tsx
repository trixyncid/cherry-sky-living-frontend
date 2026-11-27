/**
 * The one heading pattern every landing section uses: a numbered eyebrow,
 * a ruled eyebrow and a stacked two-tone title (white/ink, then muted) and an optional aside.
 */

import type { ReactNode } from "react";
import { Reveal } from "@/components/shared/Reveal";
import { cn } from "@/lib/utils";

export function SectionHeading({
  id,
  index,
  eyebrow,
  lead,
  accent,
  dark = false,
  aside,
  center = false,
}: {
  id: string;
  /** Position in the page, shown as "02". */
  index?: number;
  eyebrow: string;
  lead: string;
  accent: string;
  dark?: boolean;
  aside?: ReactNode;
  center?: boolean;
}) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-6",
        center
          ? "items-center text-center"
          : "lg:flex-row lg:items-end lg:justify-between",
      )}
    >
      <div className={cn(center && "flex flex-col items-center")}>
        <p
          className={cn(
            "eyebrow flex items-center gap-4",
            dark ? "text-white/75" : "text-fg-muted",
          )}
        >
          {index !== undefined ? (
            <span
              className={cn(
                "tabular-nums",
                dark
                  ? "text-white"
                  : "text-[var(--lp-accent,var(--adm-brand))]",
              )}
            >
              {String(index).padStart(2, "0")}
            </span>
          ) : null}
          <span
            aria-hidden
            className={cn("h-px w-10", dark ? "bg-white/50" : "bg-fg/30")}
          />
          {eyebrow}
        </p>
        <h2
          id={id}
          className={cn(
            "mt-5 max-w-3xl text-[clamp(2.1rem,4.4vw,3.75rem)] font-semibold leading-[1] tracking-[-0.04em]",
            dark ? "text-white" : "text-fg",
          )}
        >
          <span className="block text-balance">{lead}</span>
          <span
            className={cn(
              "block text-balance font-normal",
              dark ? "text-white/55" : "text-fg/45",
            )}
          >
            {accent}
          </span>
        </h2>
      </div>
      {aside ? (
        <div
          className={cn(
            "max-w-sm text-[15px] leading-relaxed",
            dark ? "text-white/70" : "text-fg-muted",
          )}
        >
          {aside}
        </div>
      ) : null}
    </Reveal>
  );
}
