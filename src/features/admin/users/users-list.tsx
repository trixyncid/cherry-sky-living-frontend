"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { AdminSelect } from "@/features/admin/components/admin-field";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import {
  AdminToolbar,
  usePropertyToolbarFilter,
} from "@/features/admin/components/admin-toolbar";
import { LeaseStandingBadge } from "@/features/admin/components/status-badge";
import { adminPageIcons } from "@/features/admin/constants/nav-items";
import { getTenantUserSortValue } from "@/features/admin/crud/admin-table-sort";
import { useClientTable } from "@/features/admin/crud/use-client-table";
import { useAdminLookups } from "@/features/admin/hooks/use-admin-lookups";
import { useAdminPropertyFilter } from "@/features/admin/hooks/use-admin-property-filter";
import {
  useLeases,
  useTenantUsers,
} from "@/features/admin/hooks/use-admin-queries";
import {
  EmptyPanel,
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
  Avatar,
  StatusDot,
  WhatsAppButton,
} from "@/features/admin/operations/ops-kit";
import { Link } from "@/i18n/routing";
import { displayEmailOrEmpty, formatPhoneDisplay } from "@/lib/phone";
import type {
  IdentityDocumentStatus,
  Lease,
  TenantUser,
} from "@/lib/types/admin";
import { cn } from "@/lib/utils";

const BASE = "/admin/users";

export function UsersList() {
  const t = useTranslations("admin.crud");
  const tp = useTranslations("admin.pages.users");
  const [search, setSearch] = useState("");
  const { data = [], isLoading, error } = useTenantUsers(search || undefined);
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

  const { propertyId: propertyFilter, setPropertyId: setPropertyFilter } =
    useAdminPropertyFilter();
  const tt = useTranslations("admin.toolbar");
  const propertyToolbar = usePropertyToolbarFilter(propertyFilter, (id) => {
    setPropertyFilter(id);
    setPage(1);
  });

  const visible = useMemo(
    () =>
      data
        .filter((u) =>
          filter === "all"
            ? true
            : filter === "housed"
              ? currentLease.has(u.id)
              : filter === "unhoused"
                ? u.isActive && !currentLease.has(u.id)
                : !u.isActive,
        )
        .filter(
          (u) =>
            !propertyFilter ||
            currentLease.get(u.id)?.propertyId === propertyFilter,
        ),
    [data, filter, currentLease, propertyFilter],
  );

  const getSortValue = useCallback(
    (item: TenantUser, key: string) => getTenantUserSortValue(item, key),
    [],
  );

  const { page, setPage, pageData, total, pageSize, setPageSize } =
    useClientTable(visible, getSortValue, {
      defaultSortKey: "name",
      pageSize: 25,
    });

  return (
    <>
      <AdminPageHeader
        title={tp("title")}
        description={tp("description")}
        primaryAction={{
          label: t("addTenant"),
          href: `${BASE}/new`,
          icon: "add",
        }}
      />

      <AdminToolbar
        search={{
          value: search,
          onChange: (v) => {
            setSearch(v);
            setPage(1);
          },
          placeholder: tp("searchPlaceholder"),
        }}
        filters={[
          {
            key: "status",
            label: tt("status"),
            active: filter !== "all",
            chip: to(`tenantFilter.${filter}`),
            onClear: () => setFilter("all"),
            width: "w-52",
            control: (
              <AdminSelect
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value as typeof filter);
                  setPage(1);
                }}
              >
                {(["all", "housed", "unhoused", "inactive"] as const).map(
                  (f) => (
                    <option key={f} value={f}>
                      {`${to(`tenantFilter.${f}`)} (${counts[f]})`}
                    </option>
                  ),
                )}
              </AdminSelect>
            ),
          },
          propertyToolbar,
        ]}
        resultCount={isLoading ? undefined : visible.length}
      />

      {error && (
        <div className="mb-4">
          <AdminAlert message={getErrorMessage(error, t("loadFailed"))} />
        </div>
      )}

      {isLoading ? (
        <SkeletonCards count={3} className="sm:grid-cols-2 xl:grid-cols-3" />
      ) : visible.length === 0 ? (
        <EmptyPanel icon={adminPageIcons.users} title={tp("empty")} />
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
                        className="block truncate text-lg font-medium tracking-tight text-fg hover:text-brand"
                      >
                        {user.name}
                      </Link>
                      <p className="truncate text-sm text-fg-muted">
                        {formatPhoneDisplay(user.phoneNumber) || email || "—"}
                      </p>
                      {user.phoneNumber && email ? (
                        <p className="truncate text-xs text-fg-muted">
                          {email}
                        </p>
                      ) : null}
                      <IdentityChip status={user.identityDocument?.status} />
                    </div>
                    {!user.isActive ? (
                      <span className="shrink-0 rounded-full bg-hover px-2.5 py-1 text-xs font-medium text-fg-muted">
                        {tp("statusInactive")}
                      </span>
                    ) : null}
                  </div>

                  {lease ? (
                    <Link
                      href={`/admin/leases/${lease.id}/edit`}
                      className="flex items-center gap-3 rounded-2xl bg-subtle p-3 transition-colors hover:bg-hover"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand">
                        <Icon name={adminPageIcons.units} size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium text-fg">
                          {lease.unit?.name ?? "—"} ·{" "}
                          {resolveLeasePropertyName(lease, lookups)}
                        </span>
                        <span className="block truncate text-xs text-fg-muted">
                          {to("until", {
                            date: end ? formatDate(end, locale) : "—",
                          })}
                        </span>
                      </span>
                      <LeaseStandingBadge lease={lease} />
                    </Link>
                  ) : (
                    <p className="flex items-center gap-2 rounded-2xl border border-dashed border-line p-3 text-sm text-fg-muted">
                      <Icon name={adminPageIcons.units} size={18} />
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
                      className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border border-line bg-white px-4 text-sm font-medium text-fg hover:border-brand-line hover:text-brand"
                    >
                      {to("profile")}
                    </Link>
                  </div>
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
    </>
  );
}

/** ID (KTP/passport) state on a tenant card; nothing once it's checked. */
function IdentityChip({ status }: { status?: IdentityDocumentStatus }) {
  const t = useTranslations("admin.pages.users.identity");
  if (status === "checked") return null;
  const key = status ?? "missing";
  return (
    <span
      className={cn(
        "mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        key === "rejected"
          ? "bg-danger-soft text-danger"
          : "bg-brand-soft text-brand",
      )}
    >
      <Icon name="badge" size={14} />
      {t(`chip.${key}`)}
    </span>
  );
}
