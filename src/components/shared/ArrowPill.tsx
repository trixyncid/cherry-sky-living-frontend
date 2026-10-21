/**
 * Pill CTA with a round arrow badge — the site's primary button shape.
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

const TONES: Record<Tone, { pill: string; badge: string }> = {
  dark: {
    pill: "bg-brand text-white hover:bg-brand-hover",
    badge: "bg-white text-brand",
  },
  light: {
    pill: "bg-white text-fg hover:bg-brand-tint",
    badge: "bg-brand text-white",
  },
  outline: {
    pill: "border border-line-strong bg-transparent text-fg hover:border-brand",
    badge: "bg-brand text-white",
  },
};

interface BaseProps {
  children: ReactNode;
  tone?: Tone;
  icon?: string;
  /** Leading icon inside the pill (e.g. WhatsApp). */
  leading?: ReactNode;
  className?: string;
}

const pillClass = (tone: Tone, className?: string) =>
  cn(
    "group inline-flex h-12 items-center gap-3 rounded-full pl-5 pr-1.5 text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
    TONES[tone].pill,
    className,
  );

function Badge({ tone, icon }: { tone: Tone; icon: string }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:-rotate-45 motion-reduce:transition-none",
        TONES[tone].badge,
      )}
    >
      <Icon name={icon} size={18} />
    </span>
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
      <span className="flex-1 text-center">{children}</span>
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
      <span className="flex-1 text-center">{children}</span>
      <Badge tone={tone} icon={icon} />
    </button>
  );
});

/** "• Label" eyebrow used above every section. */
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
        "inline-flex items-center gap-2 text-sm font-semibold",
        tone === "dark" ? "text-white" : "text-fg",
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-brand" />
      {children}
    </p>
  );
}
