"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
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
import { useAdminShell } from "@/features/admin/components/admin-shell-context";
import { UnitPreview } from "@/features/admin/components/form-previews";
import { adminPageIcons } from "@/features/admin/constants/nav-items";
import { useAdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import {
  useUnit,
  useUnitMutations,
  useUnitTypes,
} from "@/features/admin/hooks/use-admin-queries";
import { resolveUnitTypePropertyName } from "@/features/admin/lib/entity-display";
import { getErrorMessage } from "@/features/admin/lib/errors";
import {
  showApiError,
  showApiSuccess,
} from "@/features/admin/lib/show-api-error";
import { unitMaxOccupancySchema } from "@/features/admin/properties/schemas";
import { useRouter } from "@/i18n/routing";
import type { UnitStatus } from "@/lib/types/admin";

const BASE = "/admin/units";

type FormState = {
  name: string;
  maxOccupancy: string;
  propertyId: string;
  unitTypeId: string;
};

const emptyForm: FormState = {
  name: "",
  maxOccupancy: "",
  propertyId: "",
  unitTypeId: "",
};

export function UnitForm({ id }: { id?: string }) {
  const t = useTranslations("admin.crud");
  const tq = useTranslations("admin.mobile.actions");
  const tp = useTranslations("admin.pages.units");
  const router = useRouter();
  const isEdit = !!id;
  const { properties } = useAdminShell();
  const { data: unit, isLoading } = useUnit(id ?? "", isEdit);
  const mutations = useUnitMutations();
  const lookups = useAdminLookups();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [status, setStatus] = useState<UnitStatus>("vacant");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: unitTypes = [] } = useUnitTypes(
    form.propertyId || undefined,
    !!form.propertyId || isEdit,
  );

  const availableUnitTypes = useMemo(() => {
    if (!form.propertyId) return [];
    return unitTypes.filter((ut) => ut.propertyId === form.propertyId);
  }, [unitTypes, form.propertyId]);

  useEffect(() => {
    if (unit) {
      setForm({
        name: unit.name,
        maxOccupancy:
          unit.maxOccupancy != null ? String(unit.maxOccupancy) : "",
        propertyId: unit.propertyId,
        unitTypeId: unit.unitTypeId,
      });
      setStatus(unit.status);
    }
  }, [unit]);

  const isDirty =
    !unit ||
    form.name !== unit.name ||
    form.maxOccupancy !==
      (unit.maxOccupancy != null ? String(unit.maxOccupancy) : "") ||
    status !== unit.status;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const occupancyRaw = form.maxOccupancy.trim()
      ? Number(form.maxOccupancy)
      : null;
    const occupancyParsed = unitMaxOccupancySchema.safeParse(occupancyRaw);
    if (!occupancyParsed.success) {
      setFormError(occupancyParsed.error.issues[0]?.message ?? t("saveFailed"));
      return;
    }
    const maxOccupancy = occupancyParsed.data;

    try {
      if (isEdit && id) {
        await mutations.update.mutateAsync({
          id,
          name: form.name,
          maxOccupancy,
          status,
        });
        showApiSuccess(t("updated"));
      } else {
        if (!form.unitTypeId) {
          setFormError(t("selectUnitType"));
          return;
        }
        await mutations.create.mutateAsync({
          name: form.name,
          unitTypeId: form.unitTypeId,
          maxOccupancy: maxOccupancy ?? undefined,
        });
        showApiSuccess(t("created"));
        router.replace(BASE);
        router.refresh();
        return;
      }
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

  if (isEdit && isLoading && !unit) {
    return <p className="text-sm text-fg-muted">{t("loading")}</p>;
  }

  return (
    <AdminDetailPage
      section={tp("title")}
      mode={isEdit ? "edit" : "create"}
      aside={
        <UnitPreview
          name={form.name}
          maxOccupancy={form.maxOccupancy}
          propertyName={properties.find((p) => p.id === form.propertyId)?.name}
          unitTypeName={
            (isEdit ? unitTypes : availableUnitTypes).find(
              (ut) => ut.id === form.unitTypeId,
            )?.name
          }
        />
      }
      backHref={BASE}
      backLabel={t("backToList")}
      title={isEdit ? unit?.name || t("editTitle") : tq("addUnit")}
      description={isEdit ? tp("editDescription") : tp("formDescription")}
      wide={false}
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <AdminFormError message={formError} />

        <AdminFormSection
          icon={adminPageIcons.units}
          title={tp("identityTitle")}
          hint={tp("identityHint")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {!isEdit ? (
              <AdminField
                label={t("property")}
                htmlFor="unit-property"
                required
              >
                <AdminSelect
                  id="unit-property"
                  required
                  value={form.propertyId}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      propertyId: e.target.value,
                      unitTypeId: "",
                    }))
                  }
                >
                  <option value="">{t("selectProperty")}</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>
            ) : null}

            <AdminField label={t("unitType")} htmlFor="unit-type" required>
              <AdminSelect
                id="unit-type"
                required
                disabled={isEdit || !form.propertyId}
                value={form.unitTypeId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, unitTypeId: e.target.value }))
                }
              >
                <option value="">
                  {!form.propertyId && !isEdit
                    ? t("selectPropertyFirst")
                    : t("selectUnitType")}
                </option>
                {(isEdit ? unitTypes : availableUnitTypes).map((ut) => (
                  <option key={ut.id} value={ut.id}>
                    {ut.name}
                    {resolveUnitTypePropertyName(ut, lookups) !== "—"
                      ? ` — ${resolveUnitTypePropertyName(ut, lookups)}`
                      : ""}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>

            <AdminField label={t("name")} htmlFor="unit-name" required>
              <input
                id="unit-name"
                required
                className={adminInputClassName}
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </AdminField>

            <AdminField label={t("maxOccupancy")} htmlFor="unit-max-occupancy">
              <input
                id="unit-max-occupancy"
                type="number"
                min={1}
                className={adminInputClassName}
                value={form.maxOccupancy}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maxOccupancy: e.target.value }))
                }
              />
              <p className="mt-1 text-xs text-fg-muted">
                {tp("occupancyHint")}
              </p>
            </AdminField>

            {isEdit ? (
              <AdminField label={t("status")} htmlFor="unit-status">
                <AdminSelect
                  id="unit-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as UnitStatus)}
                >
                  <option value="vacant">{tp("status.vacant")}</option>
                  <option value="occupied">{tp("status.occupied")}</option>
                </AdminSelect>
                <p className="mt-1 text-xs text-fg-muted">
                  {tp("statusHint")}
                </p>
              </AdminField>
            ) : null}
          </div>
        </AdminFormSection>

        <AdminFormActions
          cancelHref={BASE}
          cancelLabel={t("cancel")}
          pending={pending}
          submitDisabled={isEdit && !isDirty}
          dirty={isEdit ? isDirty : undefined}
          submitLabel={tp("saveDetails")}
          pendingLabel={t("saving")}
        />
      </form>
    </AdminDetailPage>
  );
}
