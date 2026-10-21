"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import {
  AdminCurrencyInput,
  AdminDatePicker,
  AdminField,
  AdminSelect,
  adminInputClassName,
} from "@/features/admin/components/admin-field";
import {
  AdminDetailPage,
  AdminFormActions,
  AdminFormError,
  AdminFormSection,
} from "@/features/admin/components/admin-form-layout";
import { AdminImageGallery } from "@/features/admin/components/admin-image-gallery";
import { useAdminShell } from "@/features/admin/components/admin-shell-context";
import { adminPageIcons } from "@/features/admin/constants/nav-items";
import { useAdminPropertyFilter } from "@/features/admin/hooks/use-admin-property-filter";
import {
  usePettyCash,
  usePettyCashEntry,
  usePettyCashMutations,
} from "@/features/admin/hooks/use-admin-queries";
import { useAttachmentQueue } from "@/features/admin/hooks/use-attachment-queue";
import { useLeaveGuard } from "@/features/admin/hooks/use-leave-guard";
import { getErrorMessage } from "@/features/admin/lib/errors";
import {
  formatIdr,
  formatIdrInput,
  parseIdrInput,
  toDateInputValue,
} from "@/features/admin/lib/format";
import { stashPendingUploads } from "@/features/admin/lib/pending-uploads";
import {
  showApiError,
  showApiSuccess,
} from "@/features/admin/lib/show-api-error";
import { PETTY_CASH_TYPE_ICON } from "@/features/admin/petty-cash/petty-cash-list";
import { useRouter } from "@/i18n/routing";
import {
  deletePettyCashReceipt,
  uploadPettyCashReceipt,
} from "@/lib/api/admin/petty-cash";
import {
  LEDGER_EXPENSE_CATEGORIES,
  LEDGER_INCOME_CATEGORIES,
} from "@/lib/ledger-categories";
import { adminKeys } from "@/lib/query/keys";
import type { ManualPettyCashType } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

const BASE = "/admin/petty-cash";
const TYPES: ManualPettyCashType[] = [
  "expense",
  "top_up",
  "cash_in",
  "return_to_bank",
];
const SIGN: Record<ManualPettyCashType, 1 | -1> = {
  top_up: 1,
  cash_in: 1,
  expense: -1,
  return_to_bank: -1,
};

function categoriesFor(type: ManualPettyCashType): readonly string[] {
  if (type === "expense") return LEDGER_EXPENSE_CATEGORIES;
  if (type === "cash_in") return LEDGER_INCOME_CATEGORIES;
  return [];
}

type FormState = {
  type: ManualPettyCashType;
  propertyId: string;
  amount: string;
  category: string;
  description: string;
  date: string;
};

/** Record or edit one petty cash movement (receipts attach any time). */
export function PettyCashForm({ id }: { id?: string }) {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.pettyCash");
  const tf = useTranslations("admin.pages.pettyCash.form");
  const tb = useTranslations("admin.pages.bookkeeping");
  const ta = useTranslations("admin.attachments");
  const router = useRouter();
  const qc = useQueryClient();
  const isEdit = !!id;
  const { properties } = useAdminShell();
  const { propertyId: filterPropertyId } = useAdminPropertyFilter();
  const { data: entry, isLoading } = usePettyCashEntry(id ?? "", isEdit);
  const mutations = usePettyCashMutations();
  const [form, setForm] = useState<FormState>({
    type: "expense",
    propertyId: "",
    amount: "",
    category: "",
    description: "",
    date: toDateInputValue(new Date()),
  });
  const [formError, setFormError] = useState<string | null>(null);

  // New entry: type and property can come from the link (?type=, ?propertyId=).
  useEffect(() => {
    if (isEdit) return;
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type") as ManualPettyCashType | null;
    const propertyId =
      params.get("propertyId") ||
      filterPropertyId ||
      (properties.length === 1 ? properties[0]?.id : "") ||
      "";
    setForm((f) => ({
      ...f,
      type: type && TYPES.includes(type) ? type : f.type,
      propertyId: f.propertyId || propertyId,
    }));
  }, [isEdit, filterPropertyId, properties]);

  useEffect(() => {
    if (!entry || entry.type === "adjustment") return;
    setForm({
      type: entry.type,
      propertyId: entry.propertyId,
      amount: formatIdrInput(Math.abs(entry.amount)),
      category: entry.category ?? "",
      description: entry.description,
      date: toDateInputValue(entry.date),
    });
  }, [entry]);

  const { data: boxData } = usePettyCash(
    form.propertyId ? { propertyId: form.propertyId } : undefined,
    Boolean(form.propertyId),
  );
  const boxBalance = boxData?.summary.balances[0]?.balance;

  const locked = entry
    ? entry.invoiceId
      ? tf("lockedBill")
      : entry.type === "adjustment"
        ? tf("lockedCount")
        : entry.reversedAt
          ? tf("voidedNotice")
          : null
    : null;

  const attachments = entry?.attachments ?? [];
  const queue = useAttachmentQueue({
    upload: id ? (file) => uploadPettyCashReceipt(id, file) : null,
    handoffKey: id ? `pettyCash:${id}` : undefined,
    onSettled: ({ succeeded, failed, firstError }) => {
      if (succeeded > 0) {
        void qc.invalidateQueries({ queryKey: adminKeys.pettyCash.all() });
        showApiSuccess(ta("uploadedCount", { count: succeeded }));
      }
      if (failed > 0) {
        showApiError(firstError, ta("uploadFailedCount", { count: failed }));
      }
    },
  });
  useLeaveGuard(queue.hasUnsent, ta("leaveWarning"));

  async function handleDeleteReceipt(attachmentId: string) {
    try {
      await deletePettyCashReceipt(attachmentId);
      showApiSuccess(ta("deleted"));
      void qc.invalidateQueries({ queryKey: adminKeys.pettyCash.all() });
    } catch (err) {
      showApiError(err, ta("deleteFailed"));
      throw err;
    }
  }

  const amount = parseIdrInput(form.amount);
  const previousEffect =
    entry && entry.type !== "adjustment" ? entry.amount : 0;
  const balanceAfter =
    boxBalance !== undefined && amount > 0
      ? boxBalance - previousEffect + SIGN[form.type] * amount
      : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.propertyId) {
      setFormError(tf("propertyRequired"));
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError(tf("amountRequired"));
      return;
    }
    const payload = {
      amount,
      category: form.category || null,
      description: form.description.trim(),
      date: form.date,
    };
    try {
      if (isEdit && id) {
        await mutations.update.mutateAsync({ id, ...payload });
        showApiSuccess(t("updated"));
      } else {
        const created = await mutations.create.mutateAsync({
          ...payload,
          type: form.type,
          propertyId: form.propertyId,
        });
        const files = queue.takeAll();
        stashPendingUploads(`pettyCash:${created.id}`, files);
        showApiSuccess(
          files.length > 0
            ? ta("savedUploading", { count: files.length })
            : tf("created"),
        );
        router.replace(files.length > 0 ? `${BASE}/${created.id}/edit` : BASE);
      }
    } catch (err) {
      setFormError(getErrorMessage(err, t("saveFailed")));
      showApiError(err, t("saveFailed"));
    }
  }

  if (isEdit && isLoading && !entry) {
    return <p className="text-sm text-fg-muted">{t("loading")}</p>;
  }

  const categories = categoriesFor(form.type);
  const pending = mutations.create.isPending || mutations.update.isPending;

  return (
    <AdminDetailPage
      section={tp("title")}
      mode={isEdit ? "edit" : "create"}
      backHref={BASE}
      backLabel={t("backToList")}
      title={
        isEdit
          ? entry?.description || t("editTitle")
          : tp(`actions.${form.type}`)
      }
      description={isEdit ? tf("editDescription") : tf("newDescription")}
    >
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21.5rem]">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          <AdminFormError message={formError} />
          {locked ? (
            <p className="flex items-start gap-2 rounded-xl border border-warning/25 bg-warning-soft px-4 py-3 text-sm text-warning">
              <Icon name="lock" size={18} className="mt-px shrink-0" />
              {locked}
            </p>
          ) : null}

          <AdminFormSection
            icon={adminPageIcons.pettyCash}
            title={tf("detailsTitle")}
            hint={tf("detailsHint")}
          >
            <fieldset disabled={Boolean(locked)} className="space-y-5">
              {!isEdit ? (
                <div>
                  <p className="mb-2 text-sm font-medium text-fg">
                    {tf("entryType")}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={form.type === type}
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            type,
                            category: categoriesFor(type).includes(f.category)
                              ? f.category
                              : "",
                          }))
                        }
                        className={cn(
                          "flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left text-sm transition-colors",
                          form.type === type
                            ? "border-brand bg-brand-tint text-fg"
                            : "border-line text-fg-2 hover:border-line-strong",
                        )}
                      >
                        <Icon
                          name={PETTY_CASH_TYPE_ICON[type]}
                          size={20}
                          className={
                            form.type === type ? "text-brand" : "text-fg-muted"
                          }
                        />
                        <span className="font-semibold">
                          {tp(`types.${type}`)}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-fg-muted">
                    {tp(`typeHints.${form.type}`)}
                  </p>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField
                  label={t("property")}
                  htmlFor="petty-property"
                  required
                >
                  <AdminSelect
                    id="petty-property"
                    value={form.propertyId}
                    disabled={isEdit}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, propertyId: e.target.value }))
                    }
                  >
                    <option value="">{t("selectProperty")}</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField
                  label={tf("amount")}
                  htmlFor="petty-amount"
                  required
                >
                  <AdminCurrencyInput
                    id="petty-amount"
                    required
                    value={form.amount}
                    onValueChange={(value) =>
                      setForm((f) => ({ ...f, amount: value }))
                    }
                    placeholder="Rp. 0"
                  />
                </AdminField>
                <AdminField label={tf("date")} htmlFor="petty-date" required>
                  <AdminDatePicker
                    id="petty-date"
                    value={form.date}
                    onChange={(date) => setForm((f) => ({ ...f, date }))}
                    placeholder={t("pickDate")}
                  />
                </AdminField>
                {categories.length > 0 ? (
                  <AdminField label={tf("category")} htmlFor="petty-category">
                    <AdminSelect
                      id="petty-category"
                      value={form.category}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, category: e.target.value }))
                      }
                    >
                      <option value="">{tf("categoryNone")}</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {tb(`categories.${category}`)}
                        </option>
                      ))}
                    </AdminSelect>
                  </AdminField>
                ) : null}
                <AdminField
                  label={t("description")}
                  htmlFor="petty-description"
                  required
                  className="sm:col-span-2"
                >
                  <input
                    id="petty-description"
                    required
                    maxLength={500}
                    className={adminInputClassName}
                    placeholder={tf("descriptionPlaceholder")}
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                  />
                </AdminField>
              </div>

              {boxBalance !== undefined ? (
                <div className="flex flex-wrap gap-x-5 gap-y-1 rounded-xl bg-subtle px-4 py-3 text-sm">
                  <span className="text-fg-2">
                    {tf("balanceNow", { amount: formatIdr(boxBalance) })}
                  </span>
                  {balanceAfter !== undefined ? (
                    <span
                      className={cn(
                        "font-semibold",
                        balanceAfter < 0 ? "text-danger" : "text-fg",
                      )}
                    >
                      {tf("balanceAfter", {
                        amount: `${balanceAfter < 0 ? "−" : ""}${formatIdr(Math.abs(balanceAfter))}`,
                      })}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </fieldset>
          </AdminFormSection>

          {!locked ? (
            <AdminFormActions
              cancelHref={BASE}
              cancelLabel={t("cancel")}
              pending={pending}
              submitLabel={isEdit ? tf("saveChanges") : tf("save")}
              pendingLabel={t("saving")}
            />
          ) : null}
        </form>

        <aside className="space-y-4 lg:sticky lg:top-4">
          <AdminFormSection
            icon="receipt_long"
            title={tf("receiptsTitle")}
            hint={isEdit ? tf("receiptsHint") : tf("receiptsHintCreate")}
          >
            <AdminImageGallery
              attachments={attachments}
              queue={queue}
              onDelete={handleDeleteReceipt}
              allowPdf
              camera
            />
          </AdminFormSection>
        </aside>
      </div>
    </AdminDetailPage>
  );
}
