"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import {
  AdminField,
  adminInputClassName,
} from "@/features/admin/components/admin-field";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminTableShell } from "@/features/admin/components/admin-table-shell";
import { LeaseStatusBadge } from "@/features/admin/components/status-badge";
import {
  AdminCrudTable,
  AdminCrudTableCell,
  AdminCrudTableRow,
} from "@/features/admin/crud/admin-crud-table";
import {
  useTenantUser,
  useTenantUserMutations,
} from "@/features/admin/hooks/use-admin-queries";
import { useAdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import { resolveLeasePropertyName } from "@/features/admin/lib/entity-display";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { formatDate } from "@/features/admin/lib/format";
import { showApiError, showApiSuccess } from "@/features/admin/lib/show-api-error";
import {
  updateTenantUserSchema,
} from "@/features/admin/users/schemas";
import { TenantResetPasswordDialog } from "@/features/admin/users/tenant-reset-password-dialog";
import { Link } from "@/i18n/routing";
import { ApiError } from "@/lib/api/errors";
import { displayEmailOrEmpty } from "@/lib/phone";
import { cn } from "@/lib/utils";

const BASE = "/admin/users";

const emptyForm = { name: "", phoneNumber: "", email: "" };

interface TenantDetailViewProps {
  id: string;
}

export function TenantDetailView({ id }: TenantDetailViewProps) {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.users");
  const tl = useTranslations("admin.pages.leases");
  const locale = useLocale();
  const { data: tenant, isLoading, error } = useTenantUser(id);
  const mutations = useTenantUserMutations();
  const lookups = useAdminLookups();
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);

  useEffect(() => {
    if (tenant) {
      setForm({
        name: tenant.name,
        phoneNumber: tenant.phoneNumber ?? "",
        email: displayEmailOrEmpty(tenant.email),
      });
    }
  }, [tenant]);

  const pendingToggle = mutations.setActive.isPending;
  const pendingSave = mutations.update.isPending;
  const leases = tenant?.leases ?? [];

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    setFormError(null);

    const parsed = updateTenantUserSchema({
      nameRequired: tp("validation.nameRequired"),
      emailInvalid: tp("validation.emailInvalid"),
      phoneRequired: tp("validation.phoneRequired"),
      phoneInvalid: tp("validation.phoneInvalid"),
    }).safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? t("saveFailed"));
      return;
    }

    try {
      await mutations.update.mutateAsync({
        id: tenant.id,
        name: parsed.data.name,
        phoneNumber: parsed.data.phoneNumber,
        // Empty clears to placeholder on the server
        email: parsed.data.email ?? null,
      });
      showApiSuccess(t("updated"));
    } catch (err) {
      const msg =
        err instanceof ApiError && err.code === "CONFLICT"
          ? tp("emailExists")
          : getErrorMessage(err, t("saveFailed"));
      setFormError(msg);
      showApiError(err, msg);
    }
  }

  function handleCancel() {
    if (!tenant) return;
    setForm({
      name: tenant.name,
      phoneNumber: tenant.phoneNumber ?? "",
      email: displayEmailOrEmpty(tenant.email),
    });
    setFormError(null);
  }

  async function confirmToggleActive() {
    if (!tenant) return;
    const nextActive = !tenant.isActive;
    try {
      await mutations.setActive.mutateAsync({
        id: tenant.id,
        isActive: nextActive,
      });
      showApiSuccess(nextActive ? tp("activateSuccess") : tp("deactivateSuccess"));
      setToggleOpen(false);
    } catch (err) {
      const msg =
        err instanceof ApiError && err.code === "FORBIDDEN"
          ? tp("forbiddenAction")
          : getErrorMessage(err, t("saveFailed"));
      showApiError(err, msg);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-[#83746b]">{t("loading")}</p>;
  }

  if (error || !tenant) {
    return (
      <AdminAlert message={getErrorMessage(error, tp("detailNotFound"))} />
    );
  }

  const isDirty =
    form.name !== tenant.name ||
    form.phoneNumber !== (tenant.phoneNumber ?? "") ||
    form.email !== displayEmailOrEmpty(tenant.email);

  return (
    <>
      <Link
        href={BASE}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#71130d] transition-colors hover:text-[#8a1a12]"
      >
        <Icon name="arrow_back" size={18} />
        {t("backToList")}
      </Link>

      <AdminPageHeader
        title={form.name || tenant.name}
        description={tp("detailDescription")}
        primaryAction={{
          label: tenant.isActive ? tp("deactivate") : tp("activate"),
          onClick: () => setToggleOpen(true),
          icon: tenant.isActive ? "person_off" : "person",
        }}
      />

      <form
        onSubmit={(e) => void handleSave(e)}
        className="glass-panel mb-8 rounded-[1.75rem] p-5 sm:p-6"
      >
        <h2 className="mb-4 text-base font-semibold text-[#1a1c1a]">
          {tp("accountSection")}
        </h2>

        {formError && (
          <div className="mb-4">
            <AdminAlert message={formError} />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label={t("name")} htmlFor="tenant-name" required>
            <input
              id="tenant-name"
              required
              autoComplete="name"
              className={adminInputClassName}
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
            />
          </AdminField>
          <AdminField label={tp("phone")} htmlFor="tenant-phone" required>
            <input
              id="tenant-phone"
              type="tel"
              required
              autoComplete="tel"
              inputMode="tel"
              placeholder={tp("phonePlaceholder")}
              className={adminInputClassName}
              value={form.phoneNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, phoneNumber: e.target.value }))
              }
            />
          </AdminField>
          <AdminField label={tp("emailOptional")} htmlFor="tenant-email">
            <input
              id="tenant-email"
              type="email"
              autoComplete="email"
              className={adminInputClassName}
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
            <p className="mt-1 text-xs text-[#83746b]">
              {tp("emailOptionalHint")}
            </p>
          </AdminField>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pendingSave || !isDirty}>
            {pendingSave ? t("saving") : t("save")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pendingSave || !isDirty}
            onClick={handleCancel}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setResetOpen(true)}
          >
            <Icon name="lock_reset" size={18} className="mr-1.5" />
            {tp("resetPassword")}
          </Button>
        </div>
      </form>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <DetailCard label={tp("status")}>
          <span
            className={cn(
              "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
              tenant.isActive
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-[#e3e2e0] bg-[#efeeeb] text-[#83746b]",
            )}
          >
            {tenant.isActive ? tp("statusActive") : tp("statusInactive")}
          </span>
        </DetailCard>
        <DetailCard
          label={tp("joined")}
          value={formatDate(tenant.createdAt, locale)}
        />
        <DetailCard label={tp("leaseCount")} value={String(leases.length)} />
      </div>

      <h2 className="mb-3 text-base font-semibold text-[#1a1c1a]">
        {tp("leasesSection")}
      </h2>

      <AdminTableShell>
        {leases.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#83746b]">
            {tp("leasesEmpty")}
          </p>
        ) : (
          <AdminCrudTable
            columns={[
              { key: "unit", label: t("unit") },
              { key: "property", label: t("property") },
              { key: "period", label: t("period") },
              { key: "status", label: t("status") },
              { key: "actions", label: t("actions"), align: "right" },
            ]}
          >
            {leases.map((lease) => (
              <AdminCrudTableRow key={lease.id}>
                <AdminCrudTableCell className="font-semibold">
                  {lease.unit?.name ?? lease.unitId}
                </AdminCrudTableCell>
                <AdminCrudTableCell className="text-[#51443c]">
                  {resolveLeasePropertyName(lease, lookups)}
                </AdminCrudTableCell>
                <AdminCrudTableCell className="text-[#51443c]">
                  {formatDate(lease.startDate, locale)} {tl("to")}{" "}
                  {formatDate(lease.endDate, locale)}
                </AdminCrudTableCell>
                <AdminCrudTableCell>
                  <LeaseStatusBadge status={lease.status} />
                </AdminCrudTableCell>
                <AdminCrudTableCell align="right">
                  <Link
                    href={`/admin/leases/${lease.id}/edit`}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-[#51443c] transition-colors hover:bg-[#efeeeb] hover:text-[#71130d]"
                    aria-label={t("editTitle")}
                  >
                    <Icon name="edit" size={18} />
                  </Link>
                </AdminCrudTableCell>
              </AdminCrudTableRow>
            ))}
          </AdminCrudTable>
        )}
      </AdminTableShell>

      <TenantResetPasswordDialog
        user={resetOpen ? tenant : null}
        open={resetOpen}
        onOpenChange={setResetOpen}
      />

      <Dialog open={toggleOpen} onOpenChange={setToggleOpen}>
        <DialogContent showCloseButton={!pendingToggle}>
          <DialogHeader>
            <DialogTitle>
              {tenant.isActive ? tp("deactivateTitle") : tp("activateTitle")}
            </DialogTitle>
            <DialogDescription>
              {tenant.isActive
                ? tp("deactivateDescription", { name: tenant.name })
                : tp("activateDescription", { name: tenant.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pendingToggle}
              onClick={() => setToggleOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant={tenant.isActive ? "destructive" : "default"}
              disabled={pendingToggle}
              onClick={() => void confirmToggleActive()}
            >
              {pendingToggle
                ? t("saving")
                : tenant.isActive
                  ? tp("deactivate")
                  : tp("activate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailCard({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="glass-panel-soft rounded-xl p-4">
      <p className="text-xs font-medium text-[#83746b]">{label}</p>
      {children ?? (
        <p className="mt-1 text-sm font-semibold text-[#1a1c1a]">{value}</p>
      )}
    </div>
  );
}
