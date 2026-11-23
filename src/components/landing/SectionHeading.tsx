/**
 * The one heading pattern every landing section uses: a numbered eyebrow,
 * a two-tone title (sans + italic serif accent) and an optional aside.
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
            "flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em]",
            dark ? "text-white/60" : "text-fg-muted",
          )}
        >
          {index !== undefined ? (
            <>
              <span
                className={cn(
                  "tabular-nums",
                  dark
                    ? "text-brand-bright"
                    : "text-[var(--lp-accent,#7a1630)]",
                )}
              >
                {String(index).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "h-px w-8",
                  dark ? "bg-white/25" : "bg-line-strong",
                )}
              />
            </>
          ) : null}
          {eyebrow}
        </p>
        <h2
          id={id}
          className={cn(
            "mt-4 max-w-3xl text-balance text-[clamp(2.1rem,4.2vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.035em]",
            dark ? "text-white" : "text-fg",
          )}
        >
          {lead}{" "}
          <span
            className={cn(
              "font-display font-normal italic tracking-[-0.01em]",
              dark ? "text-brand-bright" : "text-[var(--lp-accent,#7a1630)]",
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
            dark ? "text-white/65" : "text-fg-muted",
          )}
        >
          {aside}
        </div>
      ) : null}
    </Reveal>
  );
}
