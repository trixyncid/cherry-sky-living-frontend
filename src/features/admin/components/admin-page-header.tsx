"use client";

import { Icon } from "@/components/shared/Icon";
import { useCurrentPageIcon } from "@/features/admin/lib/nav-state";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  /** @deprecated Use primaryAction */
  actionLabel?: string;
  /** @deprecated Use primaryAction */
  onAction?: () => void;
  actionDisabled?: boolean;
  primaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: string;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: string;
    disabled?: boolean;
  };
  className?: string;
}

export function AdminPageHeader({
  title,
  description,
  actionLabel,
  onAction,
  actionDisabled,
  primaryAction,
  secondaryAction,
  className,
}: AdminPageHeaderProps) {
  const pageIcon = useCurrentPageIcon();
  const resolvedPrimary =
    primaryAction ??
    (actionLabel && onAction
      ? {
          label: actionLabel,
          onClick: onAction,
          icon: "add",
          disabled: actionDisabled,
        }
      : undefined);

  const primaryClassName =
    "admin-btn-primary flex h-10 flex-1 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors disabled:opacity-50 sm:flex-none";

  return (
    <div
      className={cn(
        "mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end lg:mb-8",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3.5">
        {pageIcon ? (
          <span
            className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl bg-ink text-white shadow-[0_6px_16px_-8px_rgb(11_11_13/0.5)]"
            aria-hidden
          >
            <Icon name={pageIcon} size={22} />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-[clamp(1.5rem,2vw,1.875rem)] font-semibold tracking-[-0.025em] text-fg">
            {title}
          </h2>
          {description && (
            <p className="mt-1 max-w-2xl text-[15px] text-fg-muted">
              {description}
            </p>
          )}
        </div>
      </div>

      {(resolvedPrimary || secondaryAction) && (
        <div className="flex w-full gap-3 sm:w-auto">
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-line-strong bg-panel px-5 text-sm font-medium text-fg transition-colors hover:border-fg hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50 sm:flex-none"
            >
              {secondaryAction.icon && (
                <Icon name={secondaryAction.icon} size={18} />
              )}
              {secondaryAction.label}
            </button>
          )}
          {resolvedPrimary &&
            (resolvedPrimary.href ? (
              <Link
                href={resolvedPrimary.href}
                className={cn(
                  primaryClassName,
                  resolvedPrimary.disabled && "pointer-events-none opacity-50",
                )}
              >
                {resolvedPrimary.icon && (
                  <Icon name={resolvedPrimary.icon} size={18} />
                )}
                {resolvedPrimary.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={resolvedPrimary.onClick}
                disabled={resolvedPrimary.disabled}
                className={primaryClassName}
              >
                {resolvedPrimary.icon && (
                  <Icon name={resolvedPrimary.icon} size={18} />
                )}
                {resolvedPrimary.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
