"use client";

import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { cn } from "@/lib/utils";

export function AdminDetailPage({
  backHref,
  backLabel,
  title,
  description,
  children,
  className,
  wide = true,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div className={cn("mx-auto", wide ? "max-w-5xl" : "max-w-3xl", className)}>
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#71130d] transition-colors hover:text-[#8a1a12]"
      >
        <Icon name="arrow_back" size={18} />
        {backLabel}
      </Link>
      <AdminPageHeader title={title} description={description} />
      {children}
    </div>
  );
}

export function AdminFormSection({
  icon,
  title,
  hint,
  children,
  className,
  headerExtra,
}: {
  icon: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  headerExtra?: React.ReactNode;
}) {
  return (
    <section className={cn("glass-panel rounded-[1.75rem] p-5 sm:p-6", className)}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-ferrugem/10 text-ferrugem">
            <Icon name={icon} size={18} />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[#1a1c1a]">{title}</h3>
            {hint ? (
              <p className="mt-0.5 text-xs leading-relaxed text-[#83746b]">
                {hint}
              </p>
            ) : null}
          </div>
        </div>
        {headerExtra}
      </div>
      {children}
    </section>
  );
}

export function AdminFormActions({
  cancelHref,
  cancelLabel,
  pending,
  submitLabel,
  pendingLabel,
  submitDisabled,
}: {
  cancelHref: string;
  cancelLabel: string;
  pending?: boolean;
  submitLabel: string;
  pendingLabel: string;
  submitDisabled?: boolean;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <Link
        href={cancelHref}
        className={cn(
          "glass-control inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-semibold text-[#51443c] transition-colors hover:bg-white/80",
          pending && "pointer-events-none opacity-50",
        )}
      >
        {cancelLabel}
      </Link>
      <button
        type="submit"
        disabled={pending || submitDisabled}
        className="admin-btn-primary inline-flex h-10 items-center justify-center rounded-xl px-6 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? pendingLabel : submitLabel}
      </button>
    </div>
  );
}

export function AdminFormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <AdminAlert message={message} />;
}
