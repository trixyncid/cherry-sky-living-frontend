"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
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
import {
  AdminDetailPage,
  AdminFormActions,
  AdminFormSection,
} from "@/features/admin/components/admin-form-layout";
import { LeaseStatusBadge } from "@/features/admin/components/status-badge";
import { useAdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import {
  useTenantUser,
  useTenantUserMutations,
} from "@/features/admin/hooks/use-admin-queries";
import { resolveLeasePropertyName } from "@/features/admin/lib/entity-display";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { formatDate } from "@/features/admin/lib/format";
import {
  showApiError,
  showApiSuccess,
} from "@/features/admin/lib/show-api-error";
import {
  Avatar,
  StatusDot,
  WhatsAppButton,
} from "@/features/admin/operations/ops-kit";
import { updateTenantUserSchema } from "@/features/admin/users/schemas";
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
  const to = useTranslations("admin.pages.operations");
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

  async function confirmToggleActive() {
    if (!tenant) return;
    const nextActive = !tenant.isActive;
    try {
      await mutations.setActive.mutateAsync({
        id: tenant.id,
        isActive: nextActive,
      });
      showApiSuccess(
        nextActive ? tp("activateSuccess") : tp("deactivateSuccess"),
      );
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
    return <p className="text-sm text-[#6b6b6b]">{t("loading")}</p>;
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

  const phone = tenant.phoneNumber;

  return (
    <>
      <AdminDetailPage
        backHref={BASE}
        backLabel={t("backToList")}
        section={tp("title")}
        mode="view"
        title={form.name || tenant.name}
        description={tp("detailDescription")}
        aside={
          <section className="overflow-hidden rounded-[1.75rem] border border-[#efe7e5] bg-white">
            <div className="flex flex-col items-center gap-3 bg-[#faf7f6] px-5 py-6 text-center">
              <div className="relative">
                <Avatar
                  name={tenant.name}
                  seed={tenant.id}
                  muted={!tenant.isActive}
                  className="size-20 text-2xl"
                />
                <span className="absolute bottom-1 right-1">
                  <StatusDot active={tenant.isActive} />
                </span>
              </div>
              <div>
                <p className="text-xl font-medium tracking-tight">
                  {tenant.name}
                </p>
                <p className="text-sm text-[#6b6b6b]">
                  {phone ?? displayEmailOrEmpty(tenant.email) ?? "—"}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  tenant.isActive
                    ? "bg-[#dff3d6] text-[#2f6d22]"
                    : "bg-[#efeeeb] text-[#6b6b6b]",
                )}
              >
                {tenant.isActive ? tp("statusActive") : tp("statusInactive")}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-2 p-4 text-sm">
              <div className="rounded-2xl bg-[#faf7f6] p-3">
                <dt className="text-xs text-[#6b6b6b]">{tp("joined")}</dt>
                <dd className="font-medium">
                  {formatDate(tenant.createdAt, locale)}
                </dd>
              </div>
              <div className="rounded-2xl bg-[#faf7f6] p-3">
                <dt className="text-xs text-[#6b6b6b]">{tp("leaseCount")}</dt>
                <dd className="font-medium">{leases.length}</dd>
              </div>
            </dl>
            <div className="flex flex-col gap-2 px-4 pb-4">
              <WhatsAppButton
                phone={phone}
                label={to("whatsapp")}
                message={to("waGreeting", {
                  name: tenant.name.split(" ")[0] ?? tenant.name,
                })}
              />
              <button
                type="button"
                onClick={() => setResetOpen(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#ece4e2] bg-white px-4 text-sm font-medium text-[#141414] hover:border-[#e8bfb9] hover:text-[#71130d]"
              >
                <Icon name="lock_reset" size={18} />
                {tp("resetPassword")}
              </button>
              <button
                type="button"
                onClick={() => setToggleOpen(true)}
                className={cn(
                  "inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium",
                  tenant.isActive
                    ? "text-[#a1271b] hover:bg-[#fdecea]"
                    : "bg-[#71130d] text-white hover:bg-[#8a1a12]",
                )}
              >
                <Icon
                  name={tenant.isActive ? "person_off" : "person_check"}
                  size={18}
                />
                {tenant.isActive ? tp("deactivate") : tp("activate")}
              </button>
            </div>
          </section>
        }
      >
        <div className="space-y-6">
          <form onSubmit={(e) => void handleSave(e)} className="space-y-6">
            {formError ? <AdminAlert message={formError} /> : null}
            <AdminFormSection
              icon="badge"
              title={tp("accountSection")}
              hint={tp("identityHint")}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField
                  label={t("name")}
                  htmlFor="tenant-name"
                  required
                  className="sm:col-span-2"
                >
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
                  <p className="mt-1 text-xs text-[#6b6b6b]">
                    {tp("emailOptionalHint")}
                  </p>
                </AdminField>
              </div>
            </AdminFormSection>
            <AdminFormActions
              cancelHref={BASE}
              cancelLabel={t("cancel")}
              pending={pendingSave}
              submitDisabled={!isDirty}
              dirty={isDirty}
              submitLabel={t("save")}
              pendingLabel={t("saving")}
            />
          </form>

          <AdminFormSection icon="description" title={tp("leasesSection")}>
            {leases.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#e3d6d3] p-6 text-center text-sm text-[#6b6b6b]">
                {tp("leasesEmpty")}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {[...leases]
                  .sort((a, b) => b.startDate.localeCompare(a.startDate))
                  .map((lease) => (
                    <li key={lease.id}>
                      <Link
                        href={`/admin/leases/${lease.id}/edit`}
                        className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#faf7f6] p-3 transition-colors hover:bg-[#f6f0ef]"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#71130d]">
                          <Icon name="bed" size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-medium">
                            {lease.unit?.name ?? lease.unitId} ·{" "}
                            {resolveLeasePropertyName(lease, lookups)}
                          </span>
                          <span className="block text-sm text-[#6b6b6b]">
                            {formatDate(lease.startDate, locale)} {tl("to")}{" "}
                            {formatDate(lease.endDate, locale)}
                          </span>
                        </span>
                        <LeaseStatusBadge status={lease.status} />
                        <Icon
                          name="chevron_right"
                          size={20}
                          className="text-[#6b6b6b]"
                        />
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </AdminFormSection>
        </div>
      </AdminDetailPage>

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
