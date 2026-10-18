"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export type AdminDetailMode = "create" | "edit" | "view";

/**
 * Frame for every create / edit / detail screen: breadcrumb + mode chip,
 * a clear title, and an optional sticky side panel (live preview, photos…).
 */
export function AdminDetailPage({
  backHref,
  backLabel,
  title,
  description,
  children,
  className,
  wide = true,
  section,
  mode,
  aside,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
  /** Parent page name for the breadcrumb (e.g. "Properties"). */
  section?: string;
  mode?: AdminDetailMode;
  /** Sticky right column on desktop, shown after the form on phones. */
  aside?: React.ReactNode;
}) {
  const t = useTranslations("admin.form");
  const twoCol = Boolean(aside);

  return (
    <div
      className={cn(
        "mx-auto",
        wide || twoCol ? "max-w-6xl" : "max-w-3xl",
        className,
      )}
    >
      <header className="mb-6 flex items-start gap-3 sm:gap-4">
        <Link
          href={backHref}
          aria-label={backLabel}
          title={backLabel}
          className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-full border border-[#ece4e2] bg-white text-[#3d3a36] transition-colors hover:border-[#e8bfb9] hover:text-[#71130d]"
        >
          <Icon name="arrow_back" size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <nav
            aria-label={t("breadcrumb")}
            className="flex flex-wrap items-center gap-1.5 text-sm text-[#6b6b6b]"
          >
            <Link href={backHref} className="hover:text-[#71130d]">
              {section ?? backLabel}
            </Link>
            {mode ? (
              <>
                <Icon name="chevron_right" size={16} aria-hidden />
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    mode === "create" && "bg-[#dff3d6] text-[#2f6d22]",
                    mode === "edit" && "bg-[#f3dedb] text-[#71130d]",
                    mode === "view" && "bg-[#f6f0ef] text-[#3d3a36]",
                  )}
                >
                  {t(`mode.${mode}`)}
                </span>
              </>
            ) : null}
          </nav>
          <h1 className="mt-1 truncate text-[clamp(1.6rem,2.4vw,2.1rem)] font-medium tracking-[-0.03em] text-[#141414]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-[15px] text-[#6b6b6b]">
              {description}
            </p>
          ) : null}
        </div>
      </header>

      {twoCol ? (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0">{children}</div>
          <aside className="space-y-4 lg:sticky lg:top-4">{aside}</aside>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/**
 * A form step. Inside a <form> sections are numbered automatically (CSS
 * counter, see globals.css); elsewhere they show their icon.
 */
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
    <section
      data-form-section
      className={cn(
        "rounded-[1.75rem] border border-[#efe7e5] bg-white p-5 sm:p-6",
        className,
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span
            aria-hidden
            className="form-step-num mt-0.5 hidden size-8 shrink-0 items-center justify-center rounded-full bg-[#71130d] text-sm font-semibold text-white"
          />
          <span className="form-step-icon mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f6f0ef] text-[#71130d]">
            <Icon name={icon} size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-medium tracking-tight text-[#141414]">
              {title}
            </h2>
            {hint ? (
              <p className="mt-0.5 text-sm leading-relaxed text-[#6b6b6b]">
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

/**
 * Save bar that sticks to the bottom of the screen while the form scrolls
 * (above the phone tab bar), with an unsaved-changes indicator on edit.
 */
export function AdminFormActions({
  cancelHref,
  cancelLabel,
  pending,
  submitLabel,
  pendingLabel,
  submitDisabled,
  dirty,
}: {
  cancelHref: string;
  cancelLabel: string;
  pending?: boolean;
  submitLabel: string;
  pendingLabel: string;
  submitDisabled?: boolean;
  /** Edit screens: true = unsaved changes, false = everything saved. */
  dirty?: boolean;
}) {
  const t = useTranslations("admin.form");
  return (
    // Sticky offsets are measured inside <main>'s bottom padding (pb-32 on
    // phones for the tab bar, pb-12 on desktop) — subtract it so the bar
    // lands just above the tab bar / near the bottom edge.
    <div className="sticky bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem-8rem)] z-20 lg:bottom-[-2rem]">
      <div className="flex flex-col gap-2 rounded-[1.5rem] border border-[#ece4e2] bg-white/95 p-2.5 sm:gap-3 sm:p-3 shadow-[0_18px_40px_-20px_rgb(28_11_10/0.35)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:pl-5">
        <p
          className={cn(
            "items-center gap-2 text-sm text-[#6b6b6b]",
            // Phones: only surface unsaved changes, keep the bar compact.
            dirty ? "flex" : "hidden sm:flex",
          )}
          aria-live="polite"
        >
          {dirty === undefined ? (
            <>
              <Icon name="info" size={16} />
              {t("requiredNote")}
            </>
          ) : dirty ? (
            <>
              <span className="size-2 rounded-full bg-[#c98a4b]" />
              {t("unsaved")}
            </>
          ) : (
            <>
              <Icon name="cloud_done" size={16} className="text-[#2f6d22]" />
              {t("saved")}
            </>
          )}
        </p>
        <div className="flex gap-2">
          <Link
            href={cancelHref}
            className={cn(
              "inline-flex h-11 flex-1 items-center justify-center whitespace-nowrap rounded-full border border-[#ece4e2] bg-white px-4 text-sm font-medium sm:px-5 sm:text-[15px] text-[#3d3a36] transition-colors hover:border-[#e8bfb9] hover:text-[#71130d] sm:flex-none",
              pending && "pointer-events-none opacity-50",
            )}
          >
            {cancelLabel}
          </Link>
          <button
            type="submit"
            disabled={pending || submitDisabled}
            className="inline-flex h-11 min-w-0 flex-[2] items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#71130d] px-4 text-sm font-medium sm:px-6 sm:text-[15px] text-white shadow-[0_10px_24px_-12px_rgb(113_19_13/0.8)] transition-colors hover:bg-[#8a1a12] disabled:cursor-not-allowed disabled:bg-[#c9b8b4] disabled:shadow-none sm:flex-none"
          >
            {pending ? (
              <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Icon name="check" size={18} />
            )}
            {pending ? pendingLabel : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminFormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <AdminAlert message={message} />;
}
