"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
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
import { AdminSearchInput } from "@/features/admin/components/admin-field";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { LeaseStatusBadge } from "@/features/admin/components/status-badge";
import { getTenantUserSortValue } from "@/features/admin/crud/admin-table-sort";
import { useClientTable } from "@/features/admin/crud/use-client-table";
import { useAdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import {
  useLeases,
  useTenantUserMutations,
  useTenantUsers,
} from "@/features/admin/hooks/use-admin-queries";
import {
  EmptyPanel,
  IconAction,
  panel,
  SkeletonCards,
} from "@/features/admin/inventory/inventory-kit";
import {
  getLeaseEndDateValue,
  resolveLeasePropertyName,
} from "@/features/admin/lib/entity-display";
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
import { TenantResetPasswordDialog } from "@/features/admin/users/tenant-reset-password-dialog";
import { Link } from "@/i18n/routing";
import { ApiError } from "@/lib/api/errors";
import { displayEmailOrEmpty } from "@/lib/phone";
import type { Lease, TenantUser } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

const BASE = "/admin/users";

export function UsersList() {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.users");
  const [search, setSearch] = useState("");
  const [resetUser, setResetUser] = useState<TenantUser | null>(null);
  const [toggleUser, setToggleUser] = useState<TenantUser | null>(null);
  const { data = [], isLoading, error } = useTenantUsers(search || undefined);
  const mutations = useTenantUserMutations();
  const to = useTranslations("admin.pages.operations");
  const locale = useLocale();
  const lookups = useAdminLookups();
  const { data: leases = [] } = useLeases();
  const [filter, setFilter] = useState<
    "all" | "housed" | "unhoused" | "inactive"
  >("all");

  // Current lease per tenant: the one covering today, else the latest.
  const currentLease = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const map = new Map<string, Lease>();
    for (const l of leases) {
      const end = getLeaseEndDateValue(l) ?? "";
      const covers =
        l.startDate.slice(0, 10) <= today && end.slice(0, 10) >= today;
      const prev = map.get(l.userId);
      if (covers && (!prev || prev.startDate < l.startDate))
        map.set(l.userId, l);
    }
    return map;
  }, [leases]);

  const counts = useMemo(
    () => ({
      all: data.length,
      housed: data.filter((u) => currentLease.has(u.id)).length,
      unhoused: data.filter((u) => u.isActive && !currentLease.has(u.id))
        .length,
      inactive: data.filter((u) => !u.isActive).length,
    }),
    [data, currentLease],
  );

  const visible = useMemo(
    () =>
      data.filter((u) =>
        filter === "all"
          ? true
          : filter === "housed"
            ? currentLease.has(u.id)
            : filter === "unhoused"
              ? u.isActive && !currentLease.has(u.id)
              : !u.isActive,
      ),
    [data, filter, currentLease],
  );

  const getSortValue = useCallback(
    (item: TenantUser, key: string) => getTenantUserSortValue(item, key),
    [],
  );

  const { page, setPage, pageData, total, pageSize, setPageSize } =
    useClientTable(visible, getSortValue, {
      defaultSortKey: "name",
      pageSize: 24,
    });

  async function confirmToggleActive() {
    if (!toggleUser) return;
    const nextActive = !toggleUser.isActive;
    try {
      await mutations.setActive.mutateAsync({
        id: toggleUser.id,
        isActive: nextActive,
      });
      showApiSuccess(
        nextActive ? tp("activateSuccess") : tp("deactivateSuccess"),
      );
      setToggleUser(null);
    } catch (err) {
      const msg =
        err instanceof ApiError && err.code === "FORBIDDEN"
          ? tp("forbiddenAction")
          : getErrorMessage(err, t("saveFailed"));
      showApiError(err, msg);
    }
  }

  const pending = mutations.setActive.isPending;

  return (
    <>
      <AdminPageHeader
        title={tp("title")}
        description={tp("description")}
        primaryAction={{
          label: t("add"),
          href: `${BASE}/new`,
          icon: "add",
        }}
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder={tp("searchPlaceholder")}
          className="w-full sm:max-w-md"
        />
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {(["all", "housed", "unhoused", "inactive"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                filter === f
                  ? "bg-[#1c0b0a] text-white"
                  : "bg-white text-[#3d3a36] hover:text-[#71130d]",
              )}
            >
              {to(`tenantFilter.${f}`)}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  filter === f ? "bg-white/15" : "bg-[#f6f0ef]",
                )}
              >
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <AdminAlert message={getErrorMessage(error, t("loadFailed"))} />
        </div>
      )}

      {isLoading ? (
        <SkeletonCards count={3} className="sm:grid-cols-2 xl:grid-cols-3" />
      ) : visible.length === 0 ? (
        <EmptyPanel icon="group" title={tp("empty")} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pageData.map((user) => {
              const lease = currentLease.get(user.id);
              const end = lease ? getLeaseEndDateValue(lease) : null;
              const email = displayEmailOrEmpty(user.email);
              return (
                <article
                  key={user.id}
                  className={cn(panel, "flex flex-col gap-4 p-5")}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar
                        name={user.name}
                        seed={user.id}
                        muted={!user.isActive}
                        className="size-14 text-lg"
                      />
                      <span className="absolute bottom-0.5 right-0.5">
                        <StatusDot active={user.isActive} />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`${BASE}/${user.id}`}
                        className="block truncate text-lg font-medium tracking-tight text-[#141414] hover:text-[#71130d]"
                      >
                        {user.name}
                      </Link>
                      <p className="truncate text-sm text-[#6b6b6b]">
                        {user.phoneNumber ?? email ?? "—"}
                      </p>
                      {user.phoneNumber && email ? (
                        <p className="truncate text-xs text-[#857f77]">
                          {email}
                        </p>
                      ) : null}
                    </div>
                    {!user.isActive ? (
                      <span className="shrink-0 rounded-full bg-[#efeeeb] px-2.5 py-1 text-xs font-medium text-[#6b6b6b]">
                        {tp("statusInactive")}
                      </span>
                    ) : null}
                  </div>

                  {lease ? (
                    <Link
                      href={`/admin/leases/${lease.id}/edit`}
                      className="flex items-center gap-3 rounded-2xl bg-[#faf7f6] p-3 transition-colors hover:bg-[#f6f0ef]"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#71130d]">
                        <Icon name="bed" size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium text-[#141414]">
                          {lease.unit?.name ?? "—"} ·{" "}
                          {resolveLeasePropertyName(lease, lookups)}
                        </span>
                        <span className="block truncate text-xs text-[#6b6b6b]">
                          {to("until", {
                            date: end ? formatDate(end, locale) : "—",
                          })}
                        </span>
                      </span>
                      <LeaseStatusBadge status={lease.status} />
                    </Link>
                  ) : (
                    <p className="flex items-center gap-2 rounded-2xl border border-dashed border-[#e3d6d3] p-3 text-sm text-[#6b6b6b]">
                      <Icon name="door_open" size={18} />
                      {to("noRoom")}
                    </p>
                  )}

                  <div className="mt-auto flex items-center gap-2">
                    <WhatsAppButton
                      phone={user.phoneNumber}
                      label={to("whatsapp")}
                      message={to("waGreeting", {
                        name: user.name.split(" ")[0] ?? user.name,
                      })}
                    />
                    <Link
                      href={`${BASE}/${user.id}`}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-[#ece4e2] bg-white px-4 text-sm font-medium text-[#141414] hover:border-[#e8bfb9] hover:text-[#71130d]"
                    >
                      {to("profile")}
                    </Link>
                    <IconAction
                      icon="lock_reset"
                      label={tp("resetPassword")}
                      onClick={() => setResetUser(user)}
                    />
                    <IconAction
                      icon={user.isActive ? "person_off" : "person_check"}
                      label={user.isActive ? tp("deactivate") : tp("activate")}
                      tone={user.isActive ? "danger" : "light"}
                      onClick={() => setToggleUser(user)}
                    />
                  </div>
                  <p className="-mt-1 text-xs text-[#857f77]">
                    {to("joined", { date: formatDate(user.createdAt, locale) })}
                  </p>
                </article>
              );
            })}
          </div>
          {total > pageSize ? (
            <div className={cn(panel, "mt-4 overflow-hidden")}>
              <AdminPagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          ) : null}
        </>
      )}

      <TenantResetPasswordDialog
        user={resetUser}
        open={resetUser !== null}
        onOpenChange={(open) => !open && setResetUser(null)}
      />

      <Dialog
        open={toggleUser !== null}
        onOpenChange={(open) => !open && setToggleUser(null)}
      >
        <DialogContent showCloseButton={!pending}>
          <DialogHeader>
            <DialogTitle>
              {toggleUser?.isActive
                ? tp("deactivateTitle")
                : tp("activateTitle")}
            </DialogTitle>
            <DialogDescription>
              {toggleUser?.isActive
                ? tp("deactivateDescription", { name: toggleUser?.name ?? "" })
                : tp("activateDescription", { name: toggleUser?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setToggleUser(null)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant={toggleUser?.isActive ? "destructive" : "default"}
              disabled={pending || !toggleUser}
              onClick={() => void confirmToggleActive()}
            >
              {pending
                ? t("saving")
                : toggleUser?.isActive
                  ? tp("deactivate")
                  : tp("activate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
