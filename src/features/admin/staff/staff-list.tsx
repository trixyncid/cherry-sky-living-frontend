"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState } from "react";
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
import { useAdminShell } from "@/features/admin/components/admin-shell-context";
import { AdminDeleteDialog } from "@/features/admin/crud/admin-delete-dialog";
import { getStaffUserSortValue } from "@/features/admin/crud/admin-table-sort";
import { useClientTable } from "@/features/admin/crud/use-client-table";
import { useDeleteDialog } from "@/features/admin/crud/use-delete-dialog";
import {
  useStaffUserMutations,
  useStaffUsers,
} from "@/features/admin/hooks/use-admin-queries";
import {
  EmptyPanel,
  IconAction,
  panel,
  SkeletonCards,
} from "@/features/admin/inventory/inventory-kit";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { formatDate } from "@/features/admin/lib/format";
import {
  showApiError,
  showApiSuccess,
} from "@/features/admin/lib/show-api-error";
import { Avatar, StatusDot } from "@/features/admin/operations/ops-kit";
import { StaffResetPasswordDialog } from "@/features/admin/staff/staff-reset-password-dialog";
import { Link } from "@/i18n/routing";
import { ApiError } from "@/lib/api/errors";
import type { StaffUser } from "@/lib/types/admin";
import { UserRole } from "@/lib/types/auth";
import { cn } from "@/lib/utils";

const BASE = "/admin/staff";

export function StaffList() {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.staff");
  const { user: currentUser } = useAdminShell();
  const [search, setSearch] = useState("");
  const [resetUser, setResetUser] = useState<StaffUser | null>(null);
  const [toggleUser, setToggleUser] = useState<StaffUser | null>(null);
  const deleteDialog = useDeleteDialog<StaffUser>();
  const { data = [], isLoading, error } = useStaffUsers(search || undefined);
  const mutations = useStaffUserMutations();

  const getSortValue = useCallback(
    (item: StaffUser, key: string) => getStaffUserSortValue(item, key),
    [],
  );

  const { page, setPage, pageData, total, pageSize, setPageSize } =
    useClientTable(data, getSortValue, { defaultSortKey: "name" });

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
        err instanceof ApiError && err.code === "CONFLICT"
          ? tp("deactivateBlocked")
          : err instanceof ApiError && err.code === "FORBIDDEN"
            ? tp("forbiddenAction")
            : getErrorMessage(err, t("saveFailed"));
      showApiError(err, msg);
    }
  }

  async function confirmDelete() {
    if (!deleteDialog.item) return;
    try {
      await mutations.remove.mutateAsync(deleteDialog.item.id);
      showApiSuccess(t("deleted"));
      deleteDialog.close();
    } catch (err) {
      const msg =
        err instanceof ApiError && err.code === "CONFLICT"
          ? err.message.toLowerCase().includes("last superadmin")
            ? tp("deleteLastSuperadminBlocked")
            : tp("deleteBlocked")
          : err instanceof ApiError && err.code === "FORBIDDEN"
            ? tp("forbiddenAction")
            : err instanceof ApiError && err.code === "BAD_REQUEST"
              ? tp("deleteSelfBlocked")
              : getErrorMessage(err, t("deleteFailed"));
      showApiError(err, msg);
    }
  }

  const pending = mutations.setActive.isPending;
  const deletePending = mutations.remove.isPending;
  const isSuperadmin = currentUser.role === UserRole.SUPERADMIN;
  const to = useTranslations("admin.pages.operations");
  const locale = useLocale();

  return (
    <>
      <AdminPageHeader
        title={tp("title")}
        description={tp("description")}
        primaryAction={
          isSuperadmin
            ? {
                label: t("add"),
                href: `${BASE}/new`,
                icon: "add",
              }
            : undefined
        }
      />

      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-4">
          <AdminSearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder={tp("searchPlaceholder")}
            className="w-full sm:max-w-md"
          />

          {error && (
            <AdminAlert message={getErrorMessage(error, t("loadFailed"))} />
          )}

          {isLoading ? (
            <SkeletonCards count={2} className="sm:grid-cols-2" />
          ) : data.length === 0 ? (
            <EmptyPanel icon="badge" title={tp("empty")} />
          ) : (
            (["superadmin", "admin"] as const).map((role) => {
              const members = pageData.filter((u) => u.role === role);
              if (members.length === 0) return null;
              return (
                <section key={role}>
                  <h3 className="mb-3 flex items-center gap-2 text-[15px] font-medium text-[#141414]">
                    <Icon
                      name={role === "superadmin" ? "shield_person" : "badge"}
                      size={18}
                      className="text-[#71130d]"
                    />
                    {tp(`roles.${role}`)}
                    <span className="rounded-full bg-white px-2 py-0.5 text-sm font-normal text-[#6b6b6b]">
                      {members.length}
                    </span>
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {members.map((user) => {
                      const isSelf = user.id === currentUser.id;
                      return (
                        <article
                          key={user.id}
                          className={cn(
                            panel,
                            "flex flex-col gap-4 p-5",
                            isSelf && "ring-2 ring-[#e8bfb9]",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <Avatar
                                name={user.name}
                                seed={user.id}
                                muted={!user.isActive}
                                className="size-12 text-base"
                              />
                              <span className="absolute bottom-0 right-0">
                                <StatusDot active={user.isActive} />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="flex items-center gap-2 truncate text-[15px] font-medium text-[#141414]">
                                <span className="truncate">{user.name}</span>
                                {isSelf ? (
                                  <span className="shrink-0 rounded-full bg-[#f3dedb] px-2 py-0.5 text-[11px] font-semibold text-[#71130d]">
                                    {tp("you")}
                                  </span>
                                ) : null}
                              </p>
                              <p className="truncate text-sm text-[#6b6b6b]">
                                {user.email}
                              </p>
                              <p className="mt-1 text-xs text-[#857f77]">
                                {user.isActive
                                  ? tp("statusActive")
                                  : tp("statusInactive")}{" "}
                                ·{" "}
                                {to("joined", {
                                  date: formatDate(user.createdAt, locale),
                                })}
                              </p>
                            </div>
                          </div>
                          {isSuperadmin ? (
                            <div className="flex items-center gap-2 border-t border-[#f6f0ef] pt-3">
                              <Link
                                href={`${BASE}/${user.id}/edit`}
                                className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-[#ece4e2] bg-white px-4 text-sm font-medium text-[#141414] hover:border-[#e8bfb9] hover:text-[#71130d]"
                              >
                                <Icon name="edit" size={16} />
                                {t("editTitle")}
                              </Link>
                              <IconAction
                                icon="lock_reset"
                                label={tp("resetPassword")}
                                onClick={() => setResetUser(user)}
                              />
                              <IconAction
                                icon={
                                  user.isActive ? "person_off" : "person_check"
                                }
                                label={
                                  user.isActive
                                    ? tp("deactivate")
                                    : tp("activate")
                                }
                                onClick={() => setToggleUser(user)}
                                disabled={isSelf}
                              />
                              <IconAction
                                icon="delete"
                                tone="danger"
                                label={t("deleteConfirm")}
                                onClick={() => deleteDialog.openDelete(user)}
                                disabled={isSelf}
                              />
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
          {!isLoading && total > pageSize ? (
            <div className={cn(panel, "overflow-hidden")}>
              <AdminPagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          ) : null}
        </div>

        {/* Who can do what */}
        <aside className="h-fit rounded-[1.75rem] bg-[#1c0b0a] p-5 text-white lg:sticky lg:top-0">
          <p className="text-sm text-white/70">{to("rolesGuide")}</p>
          <ul className="mt-3 space-y-3">
            {(["superadmin", "admin"] as const).map((role) => (
              <li
                key={role}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"
              >
                <p className="flex items-center gap-2 font-medium">
                  <Icon
                    name={role === "superadmin" ? "shield_person" : "badge"}
                    size={18}
                  />
                  {tp(`roles.${role}`)}
                  <span className="ml-auto text-sm tabular-nums text-white/70">
                    {data.filter((u) => u.role === role).length}
                  </span>
                </p>
                <p className="mt-1.5 text-sm text-white/75">
                  {to(`roleCan.${role}`)}
                </p>
              </li>
            ))}
          </ul>
          {!isSuperadmin ? (
            <p className="mt-3 text-xs text-white/60">{to("superadminOnly")}</p>
          ) : null}
        </aside>
      </div>

      <StaffResetPasswordDialog
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

      <AdminDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && deleteDialog.close()}
        itemName={deleteDialog.item?.name ?? ""}
        onConfirm={confirmDelete}
        pending={deletePending}
      />
    </>
  );
}
