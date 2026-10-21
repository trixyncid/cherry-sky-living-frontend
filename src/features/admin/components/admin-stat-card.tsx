import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface AdminStatCardProps {
  icon: string;
  iconClassName: string;
  label: string;
  value: React.ReactNode;
  hint?: string;
  href?: string;
  trend?: { value: string; positive?: boolean };
  className?: string;
  /** @deprecated Use trend */
  badge?: string;
  /** @deprecated Use trend */
  badgeClassName?: string;
  valuePrefix?: string;
}

export function AdminStatCard({
  icon,
  iconClassName,
  label,
  value,
  hint,
  href,
  trend,
  className,
  badge,
  badgeClassName,
  valuePrefix,
}: AdminStatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "rounded-xl p-2.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.55)]",
            iconClassName,
          )}
        >
          <Icon name={icon} size={22} />
        </div>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold backdrop-blur-sm",
              trend.positive
                ? "bg-success-soft text-success"
                : "bg-danger-soft text-danger",
            )}
          >
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
        )}
        {!trend && badge && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              badgeClassName,
            )}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          {valuePrefix && (
            <span className="mr-1 text-base font-medium text-fg-muted">
              {valuePrefix}{" "}
            </span>
          )}
          {value}
        </p>
        <p className="mt-1 text-sm font-medium text-fg-2">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-fg-muted">{hint}</p>}
      </div>
    </>
  );

  const cardClass = cn(
    "glass-panel group relative overflow-hidden rounded-2xl p-5 transition-all duration-300",
    href &&
      "hover:-translate-y-0.5 hover:border-white/80 hover:shadow-[0_16px_40px_-16px_rgba(11,11,13,0.24)]",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        <div className="absolute -right-8 -top-8 size-28 rounded-full bg-brand/10 blur-2xl transition-transform duration-500 group-hover:scale-125" />
        {content}
      </Link>
    );
  }

  return (
    <article className={cardClass}>
      <div
        className="absolute -right-8 -top-8 size-28 rounded-full bg-brand-deep/8 blur-2xl"
        aria-hidden
      />
      {content}
    </article>
  );
}
