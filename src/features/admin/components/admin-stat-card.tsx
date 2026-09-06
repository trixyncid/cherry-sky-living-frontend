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
                ? "bg-emerald-500/15 text-emerald-800"
                : "bg-red-500/15 text-[#ba1a1a]",
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
        <p className="text-3xl font-bold tracking-tight text-[#1a1c1a] sm:text-4xl">
          {valuePrefix && (
            <span className="mr-1 text-base font-medium text-[#5f5e5e]">
              {valuePrefix}{" "}
            </span>
          )}
          {value}
        </p>
        <p className="mt-1 text-sm font-medium text-[#51443c]">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-[#83746b]">{hint}</p>}
      </div>
    </>
  );

  const cardClass = cn(
    "glass-panel group relative overflow-hidden rounded-2xl p-5 transition-all duration-300",
    href &&
      "hover:-translate-y-0.5 hover:border-white/80 hover:shadow-[0_16px_40px_-16px_rgba(90,36,48,0.24)]",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        <div className="absolute -right-8 -top-8 size-28 rounded-full bg-ferrugem/10 blur-2xl transition-transform duration-500 group-hover:scale-125" />
        {content}
      </Link>
    );
  }

  return (
    <article className={cardClass}>
      <div
        className="absolute -right-8 -top-8 size-28 rounded-full bg-maroon/8 blur-2xl"
        aria-hidden
      />
      {content}
    </article>
  );
}
