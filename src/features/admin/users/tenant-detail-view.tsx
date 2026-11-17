"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { PhoneNumbersField } from "@/components/shared/phone-numbers-field";
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
import { adminPageIcons } from "@/features/admin/constants/nav-items";
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
import {
  contactSummary,
  displayEmailOrEmpty,
  formatPhoneDisplay,
} from "@/lib/phone";
import {
  emptyPhoneList,
  type PhoneListValue,
  phoneListFromUser,
  phoneListSignature,
  takenPhoneFromError,
  validatePhoneList,
} from "@/lib/phone-list";
import { cn } from "@/lib/utils";

const BASE = "/admin/users";

const emptyForm = { name: "", email: "" };

interface TenantDetailViewProps {
  id: string;
}

export function TenantDetailView({ id }: TenantDetailViewProps) {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.users");
  const tl = useTranslations("admin.pages.leases");
  const trm = useTranslations("admin.pages.leases.roommates");
  const to = useTranslations("admin.pages.operations");
  const tph = useTranslations("common.phoneList");
  const locale = useLocale();
  const { data: tenant, isLoading, error } = useTenantUser(id);
  const mutations = useTenantUserMutations();
  const lookups = useAdminLookups();
  const [form, setForm] = useState(emptyForm);
  const [phones, setPhones] = useState<PhoneListValue>(emptyPhoneList);
  const [formError, setFormError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);

  useEffect(() => {
    if (tenant) {
      setForm({
        name: tenant.name,
        email: displayEmailOrEmpty(tenant.email),
      });
      setPhones(phoneListFromUser(tenant));
    }
  }, [tenant]);

  const pendingToggle = mutations.setActive.isPending;
  const pendingSave = mutations.update.isPending;
  // Leases they're billed for, plus ones where they're a roommate.
  const leases = [
    ...(tenant?.leases ?? []).map((lease) => ({ lease, roommate: false })),
    ...(tenant?.leaseOccupancies ?? []).map((o) => ({
      lease: o.lease,
      roommate: true,
    })),
  ];

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    setFormError(null);

    const parsed = updateTenantUserSchema({
      nameRequired: tp("validation.nameRequired"),
      emailInvalid: tp("validation.emailInvalid"),
    }).safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? t("saveFailed"));
      return;
    }
    const phoneList = validatePhoneList(phones, {
      required: tph("required"),
      invalid: tph("invalid"),
      duplicate: tph("duplicate"),
    });
    if (!phoneList.ok) {
      setFormError(phoneList.error);
      return;
    }

    try {
      await mutations.update.mutateAsync({
        id: tenant.id,
        name: parsed.data.name,
        ...phoneList.data,
        // Empty clears to placeholder on the server
        email: parsed.data.email ?? null,
      });
      showApiSuccess(t("updated"));
    } catch (err) {
      const taken = takenPhoneFromError(err);
      const msg = taken
        ? tph("taken", { phone: taken })
        : err instanceof ApiError && err.code === "CONFLICT"
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
    return <p className="text-sm text-fg-muted">{t("loading")}</p>;
  }

  if (error || !tenant) {
    return (
      <AdminAlert message={getErrorMessage(error, tp("detailNotFound"))} />
    );
  }

  const isDirty =
    form.name !== tenant.name ||
    phoneListSignature(phones) !==
      phoneListSignature(phoneListFromUser(tenant)) ||
    form.email !== displayEmailOrEmpty(tenant.email);

  const phone = tenant.phoneNumber;
  const savedPhones = phoneListFromUser(tenant).rows;

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
          <section className="overflow-hidden rounded-[1.75rem] border border-line bg-white">
            <div className="flex flex-col items-center gap-3 bg-subtle px-5 py-6 text-center">
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
                <p className="text-sm text-fg-muted">
                  {contactSummary(tenant) || "—"}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  tenant.isActive
                    ? "bg-success-soft text-success"
                    : "bg-hover text-fg-muted",
                )}
              >
                {tenant.isActive ? tp("statusActive") : tp("statusInactive")}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-2 p-4 text-sm">
              <div className="rounded-2xl bg-subtle p-3">
                <dt className="text-xs text-fg-muted">{tp("joined")}</dt>
                <dd className="font-medium">
                  {formatDate(tenant.createdAt, locale)}
                </dd>
              </div>
              <div className="rounded-2xl bg-subtle p-3">
                <dt className="text-xs text-fg-muted">{tp("leaseCount")}</dt>
                <dd className="font-medium">{leases.length}</dd>
              </div>
            </dl>
            {savedPhones.length > 0 ? (
              <div className="px-4 pb-4">
                <p className="mb-1.5 text-xs text-fg-muted">{tph("title")}</p>
                <ul className="space-y-1.5">
                  {savedPhones.map((p) => {
                    const isLogin = p.phoneNumber === tenant.phoneNumber;
                    return (
                      <li
                        key={p.phoneNumber}
                        className="flex items-center gap-2 rounded-xl bg-subtle px-3 py-2 text-sm"
                      >
                        <Icon
                          name={isLogin ? "key" : "call"}
                          size={16}
                          className={isLogin ? "text-brand" : "text-fg-muted"}
                        />
                        <span className="min-w-0 flex-1 truncate font-medium tabular-nums">
                          {formatPhoneDisplay(p.phoneNumber)}
                        </span>
                        {isLogin ? (
                          <span className="shrink-0 rounded-full bg-brand-tint px-2 py-0.5 text-[11px] font-semibold text-brand">
                            {tph("loginBadge")}
                          </span>
                        ) : p.label ? (
                          <span className="shrink-0 truncate text-xs text-fg-muted">
                            {p.label}
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
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
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-medium text-fg hover:border-brand-line hover:text-brand"
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
                    ? "text-danger hover:bg-danger-soft"
                    : "bg-brand text-white hover:bg-brand-hover",
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
              icon="person"
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
                  <p className="mt-1 text-xs text-fg-muted">
                    {tp("emailOptionalHint")}
                  </p>
                </AdminField>
                <div className="sm:col-span-2">
                  <PhoneNumbersField
                    audience="admin"
                    value={phones}
                    onChange={setPhones}
                    savedLoginPhone={tenant.phoneNumber}
                  />
                </div>
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

          <AdminFormSection
            icon={adminPageIcons.leases}
            title={tp("leasesSection")}
          >
            {leases.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-fg-muted">
                {tp("leasesEmpty")}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {[...leases]
                  .sort((a, b) =>
                    b.lease.startDate.localeCompare(a.lease.startDate),
                  )
                  .map(({ lease, roommate }) => (
                    <li key={lease.id}>
                      <Link
                        href={`/admin/leases/${lease.id}/edit`}
                        className="flex flex-wrap items-center gap-3 rounded-2xl bg-subtle p-3 transition-colors hover:bg-hover"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand">
                          <Icon name={adminPageIcons.units} size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-medium">
                            {lease.unit?.name ?? lease.unitId} ·{" "}
                            {resolveLeasePropertyName(lease, lookups)}
                          </span>
                          <span className="block text-sm text-fg-muted">
                            {formatDate(lease.startDate, locale)} {tl("to")}{" "}
                            {formatDate(lease.endDate, locale)}
                          </span>
                          {roommate ? (
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-tint px-2 py-0.5 text-[11px] font-semibold text-brand">
                              <Icon name="group" size={12} />
                              {trm("roommateOf", {
                                name: lease.user?.name ?? "—",
                              })}
                            </span>
                          ) : lease.occupants?.length ? (
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-semibold text-fg-2">
                              <Icon name="group" size={12} />
                              {trm("sharedWith", {
                                names: lease.occupants
                                  .map((o) => o.user?.name ?? "—")
                                  .join(", "),
                              })}
                            </span>
                          ) : null}
                        </span>
                        <LeaseStatusBadge status={lease.status} />
                        <Icon
                          name="chevron_right"
                          size={20}
                          className="text-fg-muted"
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
