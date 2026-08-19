import { Icon } from "@/components/shared/Icon";
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
    "admin-btn-primary flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:brightness-105 disabled:opacity-50 sm:flex-none";

  return (
    <div
      className={cn(
        "mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end",
        className,
      )}
    >
      <div>
        <h2 className="mb-1 text-2xl font-semibold tracking-tight text-[#1a1c1a]">
          {title}
        </h2>
        {description && (
          <p className="text-base text-[#5f5e5e]">{description}</p>
        )}
      </div>

      {(resolvedPrimary || secondaryAction) && (
        <div className="flex w-full gap-3 sm:w-auto">
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
              className="glass-control flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-[#1a1c1a] transition-colors hover:bg-white/80 disabled:opacity-50 sm:flex-none"
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
