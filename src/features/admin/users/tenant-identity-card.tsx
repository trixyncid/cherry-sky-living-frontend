"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { formatDate } from "@/features/admin/lib/format";
import {
  showApiError,
  showApiSuccess,
} from "@/features/admin/lib/show-api-error";
import { reviewTenantIdentity } from "@/lib/api/admin/users";
import { adminKeys } from "@/lib/query/keys";
import type {
  IdentityDocument,
  IdentityDocumentStatus,
} from "@/lib/types/admin";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<IdentityDocumentStatus | "missing", string> = {
  missing: "bg-brand-soft text-brand",
  pending: "bg-brand-soft text-brand",
  checked: "bg-success-soft text-success",
  rejected: "bg-danger-soft text-danger",
};

/** The tenant's KTP / passport on their admin profile, with the review actions. */
export function TenantIdentityCard({
  tenantId,
  doc,
}: {
  tenantId: string;
  doc: IdentityDocument | null | undefined;
}) {
  const t = useTranslations("admin.pages.users.identity");
  const locale = useLocale();
  const qc = useQueryClient();
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");

  const review = useMutation({
    mutationFn: (input: { status: "checked" | "rejected"; reason?: string }) =>
      reviewTenantIdentity(tenantId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.users.all() });
    },
  });

  async function markChecked() {
    try {
      await review.mutateAsync({ status: "checked" });
      showApiSuccess(t("checkedDone"));
    } catch (err) {
      showApiError(err, t("reviewFailed"));
    }
  }

  async function askNewPhoto() {
    if (!reason.trim()) return;
    try {
      await review.mutateAsync({ status: "rejected", reason: reason.trim() });
      showApiSuccess(t("rejectedDone"));
      setAsking(false);
      setReason("");
    } catch (err) {
      showApiError(err, t("reviewFailed"));
    }
  }

  const status = doc?.status ?? "missing";
  const isImage = doc?.contentType?.startsWith("image/");

  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold text-fg">{t("title")}</h2>
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold",
            STATUS_STYLE[status],
          )}
        >
          {t(`status.${status}`)}
        </span>
      </div>

      {!doc ? (
        <p className="mt-2 text-sm text-fg-muted">{t("missingHint")}</p>
      ) : (
        <div className="mt-3 space-y-3">
          {doc.url ? (
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-md border border-line bg-subtle"
            >
              {isImage ? (
                // biome-ignore lint/performance/noImgElement: signed private URL
                <img
                  src={doc.url}
                  alt={t(`types.${doc.type}`)}
                  className="max-h-56 w-full object-contain"
                />
              ) : (
                <span className="flex items-center gap-2 p-4 text-sm text-fg-2">
                  <Icon name="picture_as_pdf" size={22} />
                  {doc.fileName}
                </span>
              )}
            </a>
          ) : null}
          <p className="text-sm text-fg-2">
            {t(`types.${doc.type}`)} ·{" "}
            {t("uploadedOn", { date: formatDate(doc.createdAt, locale) })}
          </p>
          {doc.status === "rejected" && doc.rejectionReason ? (
            <p className="text-sm text-danger">
              {t("askedReason", { reason: doc.rejectionReason })}
            </p>
          ) : null}

          {asking ? (
            <div className="space-y-2">
              <label
                htmlFor="identity-reason"
                className="block text-sm font-medium text-fg"
              >
                {t("reasonLabel")}
              </label>
              <input
                id="identity-reason"
                value={reason}
                maxLength={300}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("reasonPlaceholder")}
                className="h-11 w-full rounded-md border border-line-strong bg-white px-3 text-base text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 sm:text-[15px]"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!reason.trim() || review.isPending}
                  onClick={() => void askNewPhoto()}
                  className="inline-flex h-10 items-center rounded-md bg-ink px-4 text-sm font-medium text-white disabled:opacity-50"
                >
                  {t("sendRequest")}
                </button>
                <button
                  type="button"
                  onClick={() => setAsking(false)}
                  className="inline-flex h-10 items-center rounded-md px-3 text-sm font-medium text-fg-2 hover:bg-hover"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {doc.status !== "checked" ? (
                <button
                  type="button"
                  disabled={review.isPending}
                  onClick={() => void markChecked()}
                  className="admin-btn-primary inline-flex h-10 items-center gap-1.5 rounded-md px-4 text-sm font-medium disabled:opacity-50"
                >
                  <Icon name="verified" size={16} />
                  {t("markChecked")}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setAsking(true)}
                className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line-strong px-4 text-sm font-medium text-fg hover:bg-hover"
              >
                <Icon name="restart_alt" size={16} />
                {t("askNew")}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
