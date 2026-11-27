/**
 * Primary button: a slightly rounded rectangle with an inline ↗.
 * Renders an i18n Link (internal href), an <a> (external / tel / wa.me),
 * or a <button>.
 */

"use client";

import type { ComponentProps, ReactNode } from "react";
import { forwardRef } from "react";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type Tone = "dark" | "light" | "outline";

/** Slightly rounded rectangles with an inline ↗ (see btn-* in globals.css). */
const TONES: Record<Tone, string> = {
  dark: "btn-solid",
  light: "btn-outline-light",
  outline: "btn-outline",
};

interface BaseProps {
  children: ReactNode;
  tone?: Tone;
  icon?: string;
  /** Leading icon inside the button (e.g. WhatsApp). */
  leading?: ReactNode;
  className?: string;
}

const pillClass = (tone: Tone, className?: string) =>
  cn("btn group", TONES[tone], className);

function Badge({ icon }: { tone: Tone; icon: string }) {
  return (
    <Icon
      name={icon === "arrow_forward" ? "north_east" : icon}
      size={17}
      className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
    />
  );
}

type LinkPillProps = BaseProps & { href: string; external?: false } & Omit<
    ComponentProps<typeof Link>,
    "href" | "className" | "children"
  >;
type AnchorPillProps = BaseProps & { href: string; external: true } & Omit<
    ComponentProps<"a">,
    "href" | "className" | "children"
  >;

export function ArrowPill(props: LinkPillProps | AnchorPillProps) {
  const {
    children,
    tone = "dark",
    icon = "arrow_forward",
    leading,
    className,
    ...rest
  } = props;
  const content = (
    <>
      {leading}
      <span>{children}</span>
      <Badge tone={tone} icon={icon} />
    </>
  );

  if (props.external) {
    const { external: _external, ...anchorProps } = rest as AnchorPillProps;
    return (
      <a {...anchorProps} className={pillClass(tone, className)}>
        {content}
      </a>
    );
  }
  const { external: _external, ...linkProps } = rest as LinkPillProps;
  return (
    <Link {...linkProps} className={pillClass(tone, className)}>
      {content}
    </Link>
  );
}

/** Button variant (dialog triggers, carousel controls). */
export const ArrowPillButton = forwardRef<
  HTMLButtonElement,
  BaseProps & Omit<ComponentProps<"button">, "className" | "children">
>(function ArrowPillButton(
  {
    children,
    tone = "dark",
    icon = "arrow_forward",
    leading,
    className,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      className={pillClass(tone, className)}
    >
      {leading}
      <span>{children}</span>
      <Badge tone={tone} icon={icon} />
    </button>
  );
});

/** "—— LABEL" ruled uppercase eyebrow used above sections. */
export function Eyebrow({
  children,
  tone = "light",
  className,
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "eyebrow inline-flex items-center gap-4",
        tone === "dark" ? "text-white/75" : "text-fg-muted",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-px w-10",
          tone === "dark" ? "bg-white/50" : "bg-fg/30",
        )}
      />
      {children}
    </p>
  );
}
