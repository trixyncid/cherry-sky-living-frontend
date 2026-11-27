export type AdminNavPageKey =
  | "overview"
  | "properties"
  | "unitTypes"
  | "units"
  | "pricing"
  | "leases"
  | "leaseRenewals"
  | "users"
  | "staff"
  | "activity"
  | "bookkeeping"
  | "pettyCash";

export interface AdminNavItem {
  key: AdminNavPageKey;
  href: string;
  icon: string;
  labelKey: `nav.${AdminNavPageKey}`;
}

export type AdminNavGroupLabelKey =
  | "nav.groups.main"
  | "nav.groups.inventory"
  | "nav.groups.operations"
  | "nav.groups.finance"
  | "nav.groups.settings";

export interface AdminNavGroup {
  id: string;
  labelKey: AdminNavGroupLabelKey;
  items: AdminNavItem[];
}

/**
 * One icon per page, used everywhere that page appears (sidebar, phone tabs,
 * page headers, dashboard cards, empty states, links to it). "Create" actions
 * may use the add-variant of the same symbol (post_add, person_add, add_home).
 */
export const adminPageIcons = {
  overview: "space_dashboard",
  properties: "apartment",
  unitTypes: "king_bed",
  units: "meeting_room",
  pricing: "sell",
  leases: "contract",
  leaseRenewals: "event_repeat",
  users: "group",
  staff: "badge",
  activity: "history",
  bookkeeping: "menu_book",
  pettyCash: "wallet",
} as const satisfies Record<AdminNavPageKey, string>;

/** Icon for pages outside the nav (the signed-in user's profile). */
export const adminProfileIcon = "person";

export const adminNavGroups: AdminNavGroup[] = [
  {
    id: "main",
    labelKey: "nav.groups.main",
    items: [
      {
        key: "overview",
        href: "/admin",
        icon: adminPageIcons.overview,
        labelKey: "nav.overview",
      },
    ],
  },
  {
    id: "inventory",
    labelKey: "nav.groups.inventory",
    items: [
      {
        key: "properties",
        href: "/admin/properties",
        icon: adminPageIcons.properties,
        labelKey: "nav.properties",
      },
      {
        key: "unitTypes",
        href: "/admin/unit-types",
        icon: adminPageIcons.unitTypes,
        labelKey: "nav.unitTypes",
      },
      {
        key: "units",
        href: "/admin/units",
        icon: adminPageIcons.units,
        labelKey: "nav.units",
      },
    ],
  },
  {
    id: "operations",
    labelKey: "nav.groups.operations",
    items: [
      {
        key: "leases",
        href: "/admin/leases",
        icon: adminPageIcons.leases,
        labelKey: "nav.leases",
      },
      {
        key: "leaseRenewals",
        href: "/admin/lease-renewals",
        icon: adminPageIcons.leaseRenewals,
        labelKey: "nav.leaseRenewals",
      },
      {
        key: "users",
        href: "/admin/users",
        icon: adminPageIcons.users,
        labelKey: "nav.users",
      },
    ],
  },
  {
    id: "finance",
    labelKey: "nav.groups.finance",
    items: [
      {
        key: "bookkeeping",
        href: "/admin/bookkeeping",
        icon: adminPageIcons.bookkeeping,
        labelKey: "nav.bookkeeping",
      },
      {
        key: "pettyCash",
        href: "/admin/petty-cash",
        icon: adminPageIcons.pettyCash,
        labelKey: "nav.pettyCash",
      },
    ],
  },
  {
    id: "settings",
    labelKey: "nav.groups.settings",
    items: [
      {
        key: "staff",
        href: "/admin/staff",
        icon: adminPageIcons.staff,
        labelKey: "nav.staff",
      },
      {
        key: "activity",
        href: "/admin/activity",
        icon: adminPageIcons.activity,
        labelKey: "nav.activity",
      },
    ],
  },
];

export const adminNavItems: AdminNavItem[] = adminNavGroups.flatMap(
  (g) => g.items,
);

/** Quick-create shortcuts (top bar "Create" menu and the phone "+" sheet). */
export const adminCreateActions = [
  { href: "/admin/leases/new", icon: "post_add", key: "newLease" },
  {
    href: "/admin/bookkeeping/new?type=income",
    icon: "south_west",
    key: "recordIncome",
  },
  {
    href: "/admin/bookkeeping/new?type=expense",
    icon: "north_east",
    key: "recordExpense",
  },
  {
    href: "/admin/petty-cash/new?type=expense",
    icon: adminPageIcons.pettyCash,
    key: "cashExpense",
  },
  { href: "/admin/users/new", icon: "person_add", key: "addTenant" },
] as const;

/** Nav groups visible to a role (staff management is superadmin-only). */
export function adminNavGroupsForRole(isSuperadmin: boolean): AdminNavGroup[] {
  if (isSuperadmin) return adminNavGroups;
  return adminNavGroups
    .map((g) => ({
      ...g,
      // Superadmin-only pages.
      items: g.items.filter((i) => i.key !== "staff" && i.key !== "activity"),
    }))
    .filter((g) => g.items.length > 0);
}
