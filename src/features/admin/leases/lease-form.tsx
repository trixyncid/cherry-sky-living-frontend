"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import {
  AdminDateRangePicker,
  AdminField,
  AdminFileInput,
  AdminSelect,
  adminInputClassName,
} from "@/features/admin/components/admin-field";
import { AdminAttachmentsList } from "@/features/admin/components/admin-attachments-list";
import { AdminFormPage } from "@/features/admin/crud/admin-form-page";
import { AdminLeaseRenewalActions } from "@/features/admin/leases/lease-renewal-actions";
import {
  useLease,
  useLeaseMutations,
  useLeases,
  useUnit,
  useUnitPricings,
} from "@/features/admin/hooks/use-admin-queries";
import { UnitCombobox } from "@/features/admin/units/unit-combobox";
import { TenantCombobox } from "@/features/admin/users/tenant-combobox";
import { useAdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import {
  getLeaseEndDateValue,
  resolveLeasePropertyName,
  resolvePricingUnitTypeName,
  resolveUnitPropertyName,
} from "@/features/admin/lib/entity-display";
import { formatDate, formatIdrTable, toDateInputValue } from "@/features/admin/lib/format";
import {
  findLeaseOverlapConflicts,
  type LeaseOverlapConflict,
} from "@/features/admin/leases/lease-overlap";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { showApiError, showApiSuccess } from "@/features/admin/lib/show-api-error";
import { createLeaseFormSchema } from "@/features/admin/leases/lease-form.schema";
import {
  deleteLeaseAttachment,
  uploadLeaseAttachment,
} from "@/lib/api/admin/attachments";
import { computeLeaseAmount, DAILY_DURATION_DAYS, MONTHLY_DURATION_DAYS, toMonthEndInputValue } from "@/lib/billing";
import { parseDateOnly } from "@/lib/date-input";
import { adminKeys } from "@/lib/query/keys";
import type { LeaseAttachmentKind, LeaseStatus } from "@/lib/types/admin";

const BASE = "/admin/leases";

type FormState = {
  unitId: string;
  userId: string;
  startDate: string;
  endDate: string;
  unitPricingId: string;
  status: LeaseStatus;
  leaseRenewalId: string;
  attachmentKind: LeaseAttachmentKind;
};

const emptyForm: FormState = {
  unitId: "",
  userId: "",
  startDate: "",
  endDate: "",
  unitPricingId: "",
  status: "unpaid",
  leaseRenewalId: "",
  attachmentKind: "downpayment",
};

/** Apply lease date range: end is always snapped to month-end when set. */
function applyLeaseDateRange(
  prev: FormState,
  from: string,
  to: string,
): FormState {
  if (!from) {
    return { ...prev, startDate: "", endDate: "" };
  }
  const endDate = to ? toMonthEndInputValue(to) : "";
  return { ...prev, startDate: from, endDate };
}

export function LeaseForm({ id }: { id?: string }) {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.leases");
  const tr = useTranslations("admin.pages.leaseRenewals");
  const ta = useTranslations("admin.attachments");
  const locale = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const isEdit = !!id;
  const { data: pricings = [] } = useUnitPricings();
  const { data: lease, isLoading } = useLease(id ?? "", isEdit);
  const mutations = useLeaseMutations();
  const lookups = useAdminLookups();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePending, setImagePending] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const attachments = lease?.attachments ?? lease?.downpaymentAttachments ?? [];

  const renewalPrefill = useMemo(() => {
    if (isEdit) return null;
    const renewalId = searchParams.get("renewalId");
    const unitId = searchParams.get("unitId");
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    if (!renewalId || !unitId || !userId) return null;
    return { renewalId, unitId, userId, startDate: startDate ?? "" };
  }, [isEdit, searchParams]);

  const unitPrefill = useMemo(() => {
    if (isEdit || renewalPrefill) return null;
    const unitId = searchParams.get("unitId");
    if (!unitId) return null;
    return {
      unitId,
      startDate: searchParams.get("startDate") ?? "",
    };
  }, [isEdit, renewalPrefill, searchParams]);

  const { data: selectedUnit } = useUnit(form.unitId, !!form.unitId);

  const overlapUnitId = isEdit ? lease?.unitId : form.unitId;
  const overlapUserId = isEdit ? lease?.userId : form.userId;

  const { data: unitLeases = [] } = useLeases(
    overlapUnitId ? { unitId: overlapUnitId } : undefined,
    { enabled: !!overlapUnitId },
  );
  const { data: tenantLeases = [] } = useLeases(
    overlapUserId ? { userId: overlapUserId } : undefined,
    { enabled: !!overlapUserId },
  );

  const selectedPricing = useMemo(
    () => pricings.find((p) => p.id === form.unitPricingId),
    [pricings, form.unitPricingId],
  );

  const dailyPricing = useMemo(() => {
    const unitTypeId =
      selectedUnit?.unitTypeId ??
      selectedPricing?.unitTypeId ??
      lease?.unit?.unitTypeId;
    if (!unitTypeId) return null;
    return (
      pricings.find(
        (p) => p.unitTypeId === unitTypeId && p.durationDays === DAILY_DURATION_DAYS,
      ) ?? null
    );
  }, [pricings, selectedUnit, selectedPricing, lease]);

  const amountPreview = useMemo(() => {
    if (!form.startDate || !form.endDate || !selectedPricing) return null;
    const start = parseDateOnly(form.startDate);
    const end = parseDateOnly(form.endDate);
    if (!start || !end) return null;
    try {
      return computeLeaseAmount(
        start,
        end,
        selectedPricing.price,
        dailyPricing?.price ?? null,
      );
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Unable to preview amount",
      } as const;
    }
  }, [form.startDate, form.endDate, selectedPricing, dailyPricing]);

  const overlapConflicts = useMemo(() => {
    if (!form.startDate || !form.endDate || !overlapUnitId || !overlapUserId) {
      return [];
    }

    return findLeaseOverlapConflicts({
      startDate: form.startDate,
      endDate: form.endDate,
      unitId: overlapUnitId,
      userId: overlapUserId,
      unitLeases,
      tenantLeases,
      excludeLeaseIds: id ? [id] : [],
      excludeRenewalId: form.leaseRenewalId || undefined,
    });
  }, [
    form.startDate,
    form.endDate,
    form.leaseRenewalId,
    overlapUnitId,
    overlapUserId,
    unitLeases,
    tenantLeases,
    id,
  ]);

  const pricingOptions = useMemo(() => {
    const monthly = pricings.filter((p) => p.durationDays === MONTHLY_DURATION_DAYS);
    if (!selectedUnit) return monthly;
    return monthly.filter((p) => p.unitTypeId === selectedUnit.unitTypeId);
  }, [pricings, selectedUnit]);

  useEffect(() => {
    if (lease) {
      setForm({
        unitId: lease.unitId,
        userId: lease.userId,
        startDate: toDateInputValue(lease.startDate),
        endDate: toDateInputValue(lease.endDate),
        unitPricingId: lease.unitPricingId,
        status: lease.status,
        leaseRenewalId: "",
        attachmentKind: "downpayment",
      });
    } else if (!isEdit) {
      const startDate =
        renewalPrefill?.startDate ||
        unitPrefill?.startDate ||
        toDateInputValue(new Date());
      setForm((f) => ({
        ...f,
        startDate,
        endDate: toMonthEndInputValue(startDate),
        unitId: renewalPrefill?.unitId ?? unitPrefill?.unitId ?? f.unitId,
        userId: renewalPrefill?.userId ?? f.userId,
        leaseRenewalId: renewalPrefill?.renewalId ?? "",
      }));
    }
  }, [lease, isEdit, renewalPrefill, unitPrefill]);

  function invalidateLease() {
    void qc.invalidateQueries({ queryKey: adminKeys.leases.all() });
    if (id) {
      void qc.invalidateQueries({ queryKey: adminKeys.leases.detail(id) });
    }
  }

  async function handleImageUpload() {
    if (!isEdit || !id) {
      setImageError(tp("saveFirstToUpload"));
      return;
    }
    if (!imageFile) {
      setImageError(tp("imageRequired"));
      return;
    }

    setImageError(null);
    setImagePending(true);
    try {
      await uploadLeaseAttachment(id, imageFile, form.attachmentKind);
      showApiSuccess(tp("imageUploaded"));
      setImageFile(null);
      invalidateLease();
    } catch (err) {
      const msg = getErrorMessage(err, tp("imageUploadFailed"));
      setImageError(msg);
      showApiError(err, msg);
    } finally {
      setImagePending(false);
    }
  }

  async function handleDeleteAttachment(attachmentId: string) {
    setDeletePending(true);
    try {
      await deleteLeaseAttachment(attachmentId);
      showApiSuccess(ta("deleted"));
      invalidateLease();
    } catch (err) {
      showApiError(err, ta("deleteFailed"));
      throw err;
    } finally {
      setDeletePending(false);
    }
  }

  function formatOverlapMessage(conflict: LeaseOverlapConflict): string {
    const { lease } = conflict;
    const endDate = getLeaseEndDateValue(lease);
    const start = formatDate(lease.startDate, locale);
    const end = endDate ? formatDate(endDate, locale) : "—";

    if (conflict.kind === "unit") {
      return tp("overlapUnit", { start, end });
    }

    return tp("overlapTenant", {
      unit: lease.unit?.name ?? lease.unitId,
      property: resolveLeasePropertyName(lease, lookups),
      start,
      end,
    });
  }

  function attachmentKindLabel(kind: LeaseAttachmentKind): string {
    if (kind === "agreement") return tp("kindAgreement");
    if (kind === "payment") return tp("kindPayment");
    return tp("kindDownpayment");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!isEdit) {
      const parsed = createLeaseFormSchema({
        unit: t("selectUnit"),
        tenant: t("selectTenant"),
        startDate: t("pickDate"),
        endDate: t("pickDate"),
        pricing: t("selectPricing"),
      }).safeParse(form);

      if (!parsed.success) {
        const msg = parsed.error.issues[0]?.message ?? t("saveFailed");
        setFormError(msg);
        return;
      }
    }

    if (overlapConflicts.length > 0) {
      setFormError(formatOverlapMessage(overlapConflicts[0]!));
      return;
    }

    try {
      if (isEdit && id) {
        await mutations.update.mutateAsync({
          id,
          startDate: form.startDate,
          endDate: form.endDate,
          unitPricingId: form.unitPricingId || undefined,
          status: form.status,
        });
        if (imageFile) {
          await uploadLeaseAttachment(id, imageFile, form.attachmentKind);
        }
        showApiSuccess(t("updated"));
      } else {
        await mutations.create.mutateAsync({
          unitId: form.unitId,
          userId: form.userId,
          startDate: form.startDate,
          endDate: form.endDate,
          unitPricingId: form.unitPricingId,
          leaseRenewalId: form.leaseRenewalId || undefined,
          file: imageFile,
          attachmentKind: form.attachmentKind,
        });
        showApiSuccess(t("created"));
      }
      router.push(form.leaseRenewalId ? "/admin/lease-renewals" : BASE);
      router.refresh();
    } catch (err) {
      const msg = getErrorMessage(err, t("saveFailed"));
      setFormError(msg);
      showApiError(err, t("saveFailed"));
    }
  }

  const pending =
    mutations.create.isPending ||
    mutations.update.isPending ||
    (isEdit && isLoading);

  if (isEdit && isLoading && !lease) {
    return <p className="text-sm text-[#83746b]">{t("loading")}</p>;
  }

  return (
    <AdminFormPage
      title={isEdit ? t("editTitle") : t("createTitle")}
      description={tp("formDescription")}
      backHref={BASE}
      backLabel={t("backToList")}
      error={formError}
      onSubmit={(e) => void handleSubmit(e)}
      pending={pending}
      submitLabel={t("save")}
      pendingLabel={t("saving")}
      cancelHref={form.leaseRenewalId ? "/admin/lease-renewals" : BASE}
      cancelLabel={t("cancel")}
    >
      {!isEdit && renewalPrefill && (
        <div className="rounded-xl border border-[#8b5e3c]/20 bg-[#fef7e0]/40 px-4 py-3 text-sm text-[#51443c]">
          {tr("renewalFormHint")}
        </div>
      )}
      {!isEdit && unitPrefill && selectedUnit && (
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-4 py-3 text-sm text-[#51443c]">
          {tp("unitPrefillHint", {
            unit: selectedUnit.name,
            property: resolveUnitPropertyName(selectedUnit, lookups),
          })}
        </div>
      )}
      {!isEdit && (
        <>
          <AdminField label={t("unit")} htmlFor="lease-unit" required>
            <UnitCombobox
              id="lease-unit"
              required
              value={form.unitId}
              disabled={!!renewalPrefill || !!unitPrefill}
              onChange={(unitId) =>
                setForm((f) => ({
                  ...f,
                  unitId,
                  unitPricingId: "",
                }))
              }
            />
          </AdminField>
          <AdminField label={t("tenant")} htmlFor="lease-user" required>
            <TenantCombobox
              id="lease-user"
              required
              value={form.userId}
              disabled={!!renewalPrefill}
              onChange={(userId) =>
                setForm((f) => ({ ...f, userId }))
              }
            />
          </AdminField>
        </>
      )}
      <AdminField label={tp("leasePeriod")} htmlFor="lease-period" required>
        <AdminDateRangePicker
          id="lease-period"
          from={form.startDate}
          to={form.endDate}
          numberOfMonths={2}
          placeholder={tp("leasePeriodPlaceholder")}
          onChange={({ from, to }) =>
            setForm((f) => applyLeaseDateRange(f, from, to))
          }
        />
        <p className="mt-1 text-xs text-[#83746b]">{tp("leasePeriodHint")}</p>
      </AdminField>
      <AdminField label={t("pricing")} htmlFor="lease-pricing" required={!isEdit}>
        <AdminSelect
          id="lease-pricing"
          required={!isEdit}
          value={form.unitPricingId}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              unitPricingId: e.target.value,
            }))
          }
        >
          <option value="">{t("selectPricing")}</option>
          {(isEdit
            ? pricings.filter((p) => p.durationDays === MONTHLY_DURATION_DAYS)
            : pricingOptions
          ).map((p) => (
            <option key={p.id} value={p.id}>
              {resolvePricingUnitTypeName(p, lookups)} · {tp("monthlyPackage")}{" "}
              — {formatIdrTable(p.price)}
            </option>
          ))}
        </AdminSelect>
        {!isEdit && selectedUnit && pricingOptions.length === 0 && (
          <p className="mt-1 text-xs text-[#ba1a1a]">{tp("noPricingForUnit")}</p>
        )}
        {!isEdit &&
          selectedUnit &&
          pricingOptions.length > 0 &&
          !dailyPricing &&
          form.startDate &&
          parseDateOnly(form.startDate)?.getDate() !== 1 && (
            <p className="mt-1 text-xs text-[#ba1a1a]">{tp("needDailyPricing")}</p>
          )}
      </AdminField>
      {amountPreview && "error" in amountPreview ? (
        <div className="rounded-xl border border-[#ba1a1a]/25 bg-[#fff5f5] px-4 py-3 text-sm text-[#ba1a1a]">
          {amountPreview.error}
        </div>
      ) : amountPreview ? (
        <div className="rounded-xl border border-[#e3e2e0] bg-[#faf9f6]/80 px-4 py-3 text-sm text-[#51443c]">
          <p className="font-semibold text-[#1a1c1a]">{tp("amountPreview")}</p>
          <dl className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {amountPreview.stubDays > 0 ? (
              <>
                <div className="flex justify-between gap-2 sm:block">
                  <dt className="text-xs text-[#83746b]">{tp("stubDays")}</dt>
                  <dd className="font-medium text-[#1a1c1a]">
                    {amountPreview.stubDays}
                  </dd>
                </div>
                <div className="flex justify-between gap-2 sm:block">
                  <dt className="text-xs text-[#83746b]">{tp("dailyRate")}</dt>
                  <dd className="font-medium text-[#1a1c1a]">
                    {formatIdrTable(amountPreview.dailyRate)}
                  </dd>
                </div>
              </>
            ) : null}
            <div className="flex justify-between gap-2 sm:block">
              <dt className="text-xs text-[#83746b]">{tp("fullMonths")}</dt>
              <dd className="font-medium text-[#1a1c1a]">
                {amountPreview.fullMonths}
              </dd>
            </div>
            <div className="flex justify-between gap-2 sm:block">
              <dt className="text-xs text-[#83746b]">{tp("amountDue")}</dt>
              <dd className="font-medium text-[#1a1c1a]">
                {formatIdrTable(amountPreview.amountDue)}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
      {overlapConflicts.length > 0 && (
        <div className="space-y-2 rounded-xl border border-[#ba1a1a]/25 bg-[#fff5f5] px-4 py-3 text-sm text-[#51443c]">
          {overlapConflicts.map((conflict) => (
            <p key={`${conflict.kind}-${conflict.lease.id}`}>
              {formatOverlapMessage(conflict)}
            </p>
          ))}
        </div>
      )}
      {isEdit && lease?.user && (
        <AdminField label={t("tenant")} htmlFor="lease-tenant-readonly">
          <input
            id="lease-tenant-readonly"
            readOnly
            disabled
            className={adminInputClassName}
            value={`${lease.user.name} (${lease.user.email})`}
          />
        </AdminField>
      )}
      {isEdit && (
        <AdminField label={t("status")} htmlFor="lease-status">
          <AdminSelect
            id="lease-status"
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({ ...f, status: e.target.value as LeaseStatus }))
            }
          >
            <option value="unpaid">Unpaid</option>
            <option value="waiting_for_review">Waiting for Review</option>
            <option value="paid">Paid</option>
          </AdminSelect>
        </AdminField>
      )}
      {isEdit &&
        lease?.status === "unpaid" &&
        (lease.paymentDueDate != null ||
          lease.daysLate != null ||
          lease.lateFeeAmount != null) && (
        <div className="rounded-xl border border-[#B06000]/20 bg-[#FEF7E0]/50 px-4 py-3 text-sm text-[#51443c]">
          <dl className="grid gap-1.5 sm:grid-cols-3">
            {lease.paymentDueDate != null && (
              <div>
                <dt className="text-xs text-[#83746b]">{tp("paymentDueDate")}</dt>
                <dd className="font-medium text-[#1a1c1a]">
                  {formatDate(lease.paymentDueDate, locale)}
                </dd>
              </div>
            )}
            {lease.daysLate != null && (
              <div>
                <dt className="text-xs text-[#83746b]">{tp("daysLate")}</dt>
                <dd className="font-medium text-[#1a1c1a]">{lease.daysLate}</dd>
              </div>
            )}
            {lease.lateFeeAmount != null && (
              <div>
                <dt className="text-xs text-[#83746b]">{tp("lateFeeAmount")}</dt>
                <dd className="font-medium text-[#1a1c1a]">
                  {formatIdrTable(lease.lateFeeAmount)}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
      {isEdit && lease?.leaseRenewal && (
        <AdminLeaseRenewalActions lease={lease} />
      )}
      <div className="space-y-3 border-t border-[#e3e2e0] pt-4">
        <div>
          <h3 className="text-sm font-bold text-[#1a1c1a]">{tp("attachmentsTitle")}</h3>
          <p className="text-xs text-[#83746b]">
            {isEdit ? tp("attachmentsEditHint") : tp("attachmentsCreateHint")}
          </p>
        </div>
        <AdminField label={tp("attachmentKind")} htmlFor="lease-attachment-kind">
          <AdminSelect
            id="lease-attachment-kind"
            value={form.attachmentKind}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                attachmentKind: e.target.value as LeaseAttachmentKind,
              }))
            }
          >
            <option value="agreement">{tp("kindAgreement")}</option>
            <option value="downpayment">{tp("kindDownpayment")}</option>
            <option value="payment">{tp("kindPayment")}</option>
          </AdminSelect>
        </AdminField>
        <AdminField label={tp("attachmentFile")} htmlFor="lease-proof">
          <AdminFileInput
            id="lease-proof"
            file={imageFile}
            onFileChange={setImageFile}
          />
          {isEdit ? (
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => void handleImageUpload()}
                disabled={imagePending || !imageFile}
                className="rounded-lg border border-[#6f4627] bg-[#faf9f6] px-3 py-1.5 text-sm font-semibold text-[#6f4627] transition-colors hover:bg-[#efeeeb] disabled:opacity-50"
              >
                {imagePending ? tp("uploadingImage") : tp("uploadImage")}
              </button>
            </div>
          ) : (
            <p className="mt-1 text-xs text-[#83746b]">{tp("attachmentCreateHint")}</p>
          )}
          {imageError ? (
            <p className="mt-1 text-xs text-[#ba1a1a]">{imageError}</p>
          ) : null}
        </AdminField>
        {isEdit ? (
          <AdminAttachmentsList
            attachments={attachments.map((a) => ({
              ...a,
              kindLabel: attachmentKindLabel(a.kind),
            }))}
            onDelete={handleDeleteAttachment}
            deletePending={deletePending}
          />
        ) : null}
      </div>
    </AdminFormPage>
  );
}
