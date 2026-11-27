"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import {
  showApiError,
  showApiSuccess,
} from "@/features/admin/lib/show-api-error";
import {
  useTenantIdentity,
  useUploadTenantIdentity,
} from "@/features/tenant/hooks/use-tenant-queries";
import { Link } from "@/i18n/routing";
import type {
  IdentityDocumentStatus,
  IdentityDocumentType,
} from "@/lib/types/admin";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<IdentityDocumentStatus | "missing", string> = {
  missing: "bg-brand-soft text-brand",
  pending: "bg-hover text-fg-2",
  checked: "bg-success-soft text-success",
  rejected: "bg-danger-soft text-danger",
};

/**
 * The tenant's KTP / passport photo. Every resident uploads their own; an
 * admin then marks it checked or asks for a clearer photo.
 */
export function TenantIdentitySection() {
  const t = useTranslations("tenant.identity");
  const { data: doc, isLoading } = useTenantIdentity();
  const upload = useUploadTenantIdentity();
  const inputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<IdentityDocumentType>("ktp");

  // Start on the type they uploaded before, so a re-upload keeps it.
  useEffect(() => {
    if (doc?.type) setType(doc.type);
  }, [doc?.type]);

  const status = doc?.status ?? "missing";
  const isImage = doc?.contentType?.startsWith("image/");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    try {
      await upload.mutateAsync({ type, file });
      showApiSuccess(t("uploaded"));
    } catch (err) {
      showApiError(err, t("uploadFailed"));
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section
      id="identitas"
      className="scroll-mt-24 rounded-lg border border-line bg-white p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-fg">{t("title")}</h2>
          <p className="mt-1 max-w-xl text-sm text-fg-muted">{t("hint")}</p>
        </div>
        {!isLoading ? (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
              STATUS_STYLE[status],
            )}
          >
            {t(`status.${status}`)}
          </span>
        ) : null}
      </div>

      {doc?.status === "rejected" && doc.rejectionReason ? (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
          <Icon name="error" size={18} className="mt-px shrink-0" />
          <span>
            <span className="font-semibold">{t("rejectedTitle")}</span>{" "}
            {doc.rejectionReason}
          </span>
        </p>
      ) : null}

      {doc?.url ? (
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-3 rounded-lg border border-line bg-subtle p-3 hover:border-line-strong"
        >
          {isImage ? (
            // Signed, short-lived link to a private file: a plain img is right here.
            // biome-ignore lint/performance/noImgElement: signed private URL
            <img
              src={doc.url}
              alt={t(`types.${doc.type}`)}
              className="h-16 w-24 shrink-0 rounded-md object-cover"
            />
          ) : (
            <span className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md bg-white text-fg-muted">
              <Icon name="picture_as_pdf" size={28} />
            </span>
          )}
          <span className="min-w-0">
            <span className="block text-sm font-medium text-fg">
              {t(`types.${doc.type}`)}
            </span>
            <span className="block text-xs text-fg-muted">{t("view")}</span>
          </span>
        </a>
      ) : null}

      {/* One file input for both the main button and "replace" link. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      {/* Once checked, re-uploading is still possible but tucked away. */}
      {status !== "checked" || upload.isPending ? (
        <div className="mt-5 space-y-4">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-fg">
              {t("whichType")}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {(["ktp", "passport"] as const).map((option) => (
                <label
                  key={option}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border px-3.5 py-3 text-sm font-medium transition-colors",
                    type === option
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line-strong text-fg-2 hover:bg-hover",
                  )}
                >
                  <input
                    type="radio"
                    name="identity-type"
                    value={option}
                    checked={type === option}
                    onChange={() => setType(option)}
                    className="sr-only"
                  />
                  <Icon
                    name={option === "ktp" ? "badge" : "travel_explore"}
                    size={18}
                  />
                  {t(`types.${option}`)}
                </label>
              ))}
            </div>
          </fieldset>

          <ul className="space-y-1 text-sm text-fg-2">
            {(["tipWhole", "tipClear", "tipGlare"] as const).map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <Icon
                  name="check"
                  size={16}
                  className="mt-0.5 shrink-0 text-success"
                />
                {t(tip)}
              </li>
            ))}
          </ul>

          <button
            type="button"
            disabled={upload.isPending}
            onClick={() => inputRef.current?.click()}
            className="admin-btn-primary inline-flex h-11 w-full items-center justify-center gap-2 rounded-md px-5 text-sm font-medium disabled:opacity-60 sm:w-auto"
          >
            <Icon
              name={upload.isPending ? "progress_activity" : "add_a_photo"}
              size={18}
              className={upload.isPending ? "animate-spin" : undefined}
            />
            {upload.isPending
              ? t("uploading")
              : doc
                ? t("replace", { type: t(`types.${type}`) })
                : t("upload", { type: t(`types.${type}`) })}
          </button>
          <p className="text-xs text-fg-muted">{t("privacy")}</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 text-sm font-medium text-brand underline-offset-4 hover:underline"
        >
          {t("replaceChecked")}
        </button>
      )}
    </section>
  );
}

/** Home-screen nudge until the tenant has a usable ID on file. */
export function TenantIdentityReminder() {
  const t = useTranslations("tenant.identity");
  const { data: doc, isLoading } = useTenantIdentity();
  if (isLoading) return null;
  const rejected = doc?.status === "rejected";
  if (doc && !rejected) return null;

  return (
    <Link
      href="/tenant/profile#identitas"
      className={cn(
        "flex items-center gap-3 rounded-lg border p-4 transition-colors",
        rejected
          ? "border-danger/25 bg-danger-soft hover:bg-danger-soft/70"
          : "border-brand-line bg-brand-tint hover:bg-brand-soft",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full bg-white",
          rejected ? "text-danger" : "text-brand",
        )}
      >
        <Icon name="badge" size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-fg">
          {rejected ? t("reminderRejectedTitle") : t("reminderTitle")}
        </span>
        <span className="block text-sm text-fg-2">
          {rejected ? t("reminderRejectedBody") : t("reminderBody")}
        </span>
      </span>
      <Icon name="arrow_forward" size={18} className="shrink-0 text-fg-2" />
    </Link>
  );
}
