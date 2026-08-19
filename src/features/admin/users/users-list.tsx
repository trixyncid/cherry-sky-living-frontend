"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { Link } from "@/i18n/routing";
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
import { adminSearchInputClassName } from "@/features/admin/components/admin-field";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { AdminTableShell } from "@/features/admin/components/admin-table-shell";
import {
  AdminCrudTable,
  AdminCrudTableCell,
  AdminCrudTableRow,
} from "@/features/admin/crud/admin-crud-table";
import { getTenantUserSortValue } from "@/features/admin/crud/admin-table-sort";
import { useClientTable } from "@/features/admin/crud/use-client-table";
import { TenantResetPasswordDialog } from "@/features/admin/users/tenant-reset-password-dialog";
import {
  useTenantUserMutations,
  useTenantUsers,
} from "@/features/admin/hooks/use-admin-queries";
import { formatDate } from "@/features/admin/lib/format";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { showApiError, showApiSuccess } from "@/features/admin/lib/show-api-error";
import { ApiError } from "@/lib/api/errors";
import type { TenantUser } from "@/lib/types/admin";
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

  const getSortValue = useCallback(
    (item: TenantUser, key: string) => getTenantUserSortValue(item, key),
    [],
  );

  const { page, setPage, pageData, total, pageSize, sortKey, sortDir, onSort } =
    useClientTable(data, getSortValue, { defaultSortKey: "name" });

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
          className={adminSearchInputClassName}
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
              { key: "status", label: tp("status") },
              { key: "joined", label: tp("joined") },
              { key: "actions", label: t("actions"), align: "right" },
            ]}
            sortKey={sortKey}
            sortDirection={sortDir}
            onSort={onSort}
          >
            {pageData.map((user) => (
              <AdminCrudTableRow key={user.id} className="group">
                <AdminCrudTableCell className="font-semibold">
                  <Link
                    href={`${BASE}/${user.id}`}
                    className="text-[#6f4627] transition-colors hover:underline"
                  >
                    {user.name}
                  </Link>
                </AdminCrudTableCell>
                <AdminCrudTableCell className="text-[#51443c]">
                  {user.email}
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
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`${BASE}/${user.id}`}
                      className="inline-flex size-8 items-center justify-center rounded-lg text-[#51443c] transition-colors hover:bg-[#efeeeb] hover:text-[#6f4627] sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100"
                      aria-label={tp("viewDetails")}
                    >
                      <Icon name="visibility" size={18} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setResetUser(user)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-[#6f4627] transition-colors hover:bg-[#efeeeb] sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100"
                      aria-label={tp("resetPassword")}
                    >
                      <Icon name="lock_reset" size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setToggleUser(user)}
                      className="inline-flex size-8 items-center justify-center rounded-lg text-[#51443c] transition-colors hover:bg-[#efeeeb] hover:text-[#6f4627] sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100"
                      aria-label={
                        user.isActive ? tp("deactivate") : tp("activate")
                      }
                    >
                      <Icon
                        name={user.isActive ? "person_off" : "person"}
                        size={18}
                      />
                    </button>
                  </div>
                </AdminCrudTableCell>
              </AdminCrudTableRow>
            ))}
          </AdminCrudTable>
        )}
      </AdminTableShell>

      <TenantResetPasswordDialog
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
    </>
  );
}
