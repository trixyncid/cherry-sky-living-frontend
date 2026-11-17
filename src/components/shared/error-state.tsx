"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";

type ErrorStateProps = {
  variant: "error" | "notFound";
  /** Where "back" goes: the portal home inside a portal, else the site home. */
  homeHref?: string;
  /** Retry the failed render (error boundaries only). */
  onRetry?: () => void;
  /** Error digest, so a user can quote it to support. */
  digest?: string;
  /** Full-page (public site) or inside a portal shell. */
  fullPage?: boolean;
};

export function ErrorState({
  variant,
  homeHref = "/",
  onRetry,
  digest,
  fullPage = false,
}: ErrorStateProps) {
  const t = useTranslations("common.errorPage");
  const isError = variant === "error";

  return (
    <div
      className={
        fullPage
          ? "flex min-h-[70vh] items-center justify-center px-4 py-16"
          : "flex items-center justify-center px-4 py-16"
      }
    >
      <div className="w-full max-w-md text-center">
        <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-brand-tint text-brand">
          <Icon name={isError ? "error" : "travel_explore"} size={28} />
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-fg">
          {isError ? t("errorTitle") : t("notFoundTitle")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          {isError ? t("errorBody") : t("notFoundBody")}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
            >
              <Icon name="refresh" size={18} />
              {t("retry")}
            </button>
          ) : null}
          <Link
            href={homeHref}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-white px-5 text-sm font-medium text-fg transition-colors hover:border-brand-line hover:text-brand"
          >
            <Icon name="home" size={18} />
            {t("home")}
          </Link>
        </div>
        {digest ? (
          <p className="mt-6 text-xs text-fg-faint">
            {t("reference", { digest })}
          </p>
        ) : null}
      </div>
    </div>
  );
}
