"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
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
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { AdminTableShell } from "@/features/admin/components/admin-table-shell";
import { AdminDeleteDialog } from "@/features/admin/crud/admin-delete-dialog";
import {
  AdminCrudTable,
  AdminCrudTableCell,
  AdminCrudTableRow,
} from "@/features/admin/crud/admin-crud-table";
import { Link } from "@/i18n/routing";
import { getStaffUserSortValue } from "@/features/admin/crud/admin-table-sort";
import { useClientTable } from "@/features/admin/crud/use-client-table";
import { useDeleteDialog } from "@/features/admin/crud/use-delete-dialog";
import { useAdminShell } from "@/features/admin/components/admin-shell-context";
import { StaffResetPasswordDialog } from "@/features/admin/staff/staff-reset-password-dialog";
import {
  useStaffUserMutations,
  useStaffUsers,
} from "@/features/admin/hooks/use-admin-queries";
import { formatDate } from "@/features/admin/lib/format";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { showApiError, showApiSuccess } from "@/features/admin/lib/show-api-error";
import { ApiError } from "@/lib/api/errors";
import type { StaffUser } from "@/lib/types/admin";
import { UserRole } from "@/lib/types/auth";
import { cn } from "@/lib/utils";

const BASE = "/admin/staff";

function roleBadgeClass(role: StaffUser["role"]) {
  return role === "superadmin"
    ? "bg-ferrugem-soft text-ferrugem border-[#e8dfd6]"
    : "bg-[#efeeeb] text-[#51443c] border-[#e3e2e0]";
}

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

  const {
    page,
    setPage,
    pageData,
    total,
    pageSize,
    setPageSize,
    sortKey,
    sortDir,
    onSort,
  } = useClientTable(data, getSortValue, { defaultSortKey: "name" });

  async function confirmToggleActive() {
    if (!toggleUser) return;
    const nextActive = !toggleUser.isActive;
    try {
      await mutations.setActive.mutateAsync({
        id: toggleUser.id,
        isActive: nextActive,
      });
      showApiSuccess(nextActive ? tp("activateSuccess") : tp("deactivateSuccess"));
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

      <div className="relative mb-4 max-w-md">
        <Icon
          name="search"
          size={20}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#83746b]"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={tp("searchPlaceholder")}
          className="h-10 w-full rounded-xl border border-[#e3e2e0] bg-white/80 pl-10 pr-4 text-sm outline-none focus:border-ferrugem/50 focus:ring-2 focus:ring-ferrugem/15"
        />
      </div>

      {error && (
        <div className="mb-4">
          <AdminAlert message={getErrorMessage(error, t("loadFailed"))} />
        </div>
      )}

      <AdminTableShell
        footer={
          !isLoading && total > 0 ? (
            <AdminPagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          ) : undefined
        }
      >
        {isLoading ? (
          <p className="p-8 text-center text-sm text-[#83746b]">{t("loading")}</p>
        ) : data.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#83746b]">{tp("empty")}</p>
        ) : (
          <AdminCrudTable
            columns={[
              { key: "name", label: t("name") },
              { key: "email", label: t("email") },
              { key: "role", label: tp("role") },
              { key: "status", label: tp("status") },
              { key: "joined", label: tp("joined") },
              { key: "actions", label: t("actions"), align: "right" },
            ]}
            sortKey={sortKey}
            sortDirection={sortDir}
            onSort={onSort}
          >
            {pageData.map((user) => {
              const isSelf = user.id === currentUser.id;
              return (
                <AdminCrudTableRow key={user.id} className="group">
                  <AdminCrudTableCell className="font-semibold">
                    {user.name}
                    {isSelf && (
                      <span className="ml-2 text-xs font-medium text-[#83746b]">
                        ({tp("you")})
                      </span>
                    )}
                  </AdminCrudTableCell>
                  <AdminCrudTableCell className="text-[#51443c]">
                    {user.email}
                  </AdminCrudTableCell>
                  <AdminCrudTableCell>
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
                        roleBadgeClass(user.role),
                      )}
                    >
                      {tp(`roles.${user.role}`)}
                    </span>
                  </AdminCrudTableCell>
                  <AdminCrudTableCell>
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                        user.isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-[#e3e2e0] bg-[#efeeeb] text-[#83746b]",
                      )}
                    >
                      {user.isActive ? tp("statusActive") : tp("statusInactive")}
                    </span>
                  </AdminCrudTableCell>
                  <AdminCrudTableCell className="text-[#51443c]">
                    {formatDate(user.createdAt)}
                  </AdminCrudTableCell>
                  <AdminCrudTableCell align="right">
                    {isSuperadmin ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setResetUser(user)}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-[#51443c] transition-colors hover:bg-[#efeeeb] hover:text-[#6f4627] sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100"
                          aria-label={tp("resetPassword")}
                        >
                          <Icon name="lock_reset" size={18} />
                        </button>
                        <button
                          type="button"
                          disabled={isSelf}
                          onClick={() => setToggleUser(user)}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-[#51443c] transition-colors hover:bg-[#efeeeb] hover:text-[#6f4627] disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100"
                          aria-label={
                            user.isActive ? tp("deactivate") : tp("activate")
                          }
                        >
                          <Icon
                            name={user.isActive ? "person_off" : "person"}
                            size={18}
                          />
                        </button>
                        <Link
                          href={`${BASE}/${user.id}/edit`}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-[#51443c] transition-colors hover:bg-[#efeeeb] hover:text-[#6f4627] sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100"
                          aria-label={t("editTitle")}
                        >
                          <Icon name="edit" size={18} />
                        </Link>
                        <button
                          type="button"
                          disabled={isSelf}
                          onClick={() => deleteDialog.openDelete(user)}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-[#51443c] transition-colors hover:bg-[#ffdad6]/60 hover:text-[#ba1a1a] disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100"
                          aria-label={t("deleteConfirm")}
                        >
                          <Icon name="delete" size={18} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-[#83746b]">—</span>
                    )}
                  </AdminCrudTableCell>
                </AdminCrudTableRow>
              );
            })}
          </AdminCrudTable>
        )}
      </AdminTableShell>

      <StaffResetPasswordDialog
        user={resetUser}
        open={resetUser !== null}
        onOpenChange={(open) => !open && setResetUser(null)}
      />

      <Dialog open={toggleUser !== null} onOpenChange={(open) => !open && setToggleUser(null)}>
        <DialogContent showCloseButton={!pending}>
          <DialogHeader>
            <DialogTitle>
              {toggleUser?.isActive ? tp("deactivateTitle") : tp("activateTitle")}
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
