export const adminKeys = {
  all: ["admin"] as const,
  properties: {
    all: () => [...adminKeys.all, "properties"] as const,
    detail: (id: string) => [...adminKeys.properties.all(), id] as const,
  },
  unitTypes: {
    all: () => [...adminKeys.all, "unit-types"] as const,
    list: (propertyId?: string) =>
      [...adminKeys.unitTypes.all(), { propertyId }] as const,
    detail: (id: string) => [...adminKeys.unitTypes.all(), id] as const,
  },
  unitPricings: {
    all: () => [...adminKeys.all, "unit-pricings"] as const,
    list: (filters?: { unitTypeId?: string; propertyId?: string }) =>
      [...adminKeys.unitPricings.all(), filters ?? {}] as const,
    detail: (id: string) => [...adminKeys.unitPricings.all(), id] as const,
  },
  units: {
    all: () => [...adminKeys.all, "units"] as const,
    list: (propertyId?: string) =>
      [...adminKeys.units.all(), { propertyId }] as const,
    vacant: (params: {
      startDate: string;
      endDate: string;
      propertyId?: string;
    }) => [...adminKeys.units.all(), "vacant", params] as const,
    detail: (id: string) => [...adminKeys.units.all(), id] as const,
  },
  leases: {
    all: () => [...adminKeys.all, "leases"] as const,
    list: (filters?: {
      unitId?: string;
      userId?: string;
      propertyId?: string;
    }) => [...adminKeys.leases.all(), filters ?? {}] as const,
    detail: (id: string) => [...adminKeys.leases.all(), id] as const,
  },
  users: {
    all: () => [...adminKeys.all, "users"] as const,
    list: (search?: string) =>
      [...adminKeys.users.all(), { search: search ?? "" }] as const,
    detail: (id: string) => [...adminKeys.users.all(), id] as const,
  },
  staff: {
    all: () => [...adminKeys.all, "staff"] as const,
    list: (search?: string) =>
      [...adminKeys.staff.all(), { search: search ?? "" }] as const,
    detail: (id: string) => [...adminKeys.staff.all(), id] as const,
  },
  ledgerEntries: {
    all: () => [...adminKeys.all, "ledger-entries"] as const,
    list: (filters?: {
      propertyId?: string;
      type?: string;
      startDate?: string;
      endDate?: string;
    }) => [...adminKeys.ledgerEntries.all(), filters ?? {}] as const,
    detail: (id: string) => [...adminKeys.ledgerEntries.all(), id] as const,
  },
  pettyCash: {
    all: () => [...adminKeys.all, "petty-cash"] as const,
    list: (filters?: Record<string, string | undefined>) =>
      [...adminKeys.pettyCash.all(), filters ?? {}] as const,
    detail: (id: string) => [...adminKeys.pettyCash.all(), id] as const,
  },
  dashboard: {
    all: () => [...adminKeys.all, "dashboard"] as const,
    overview: (propertyId?: string) =>
      [...adminKeys.dashboard.all(), { propertyId: propertyId ?? "" }] as const,
  },
  profile: {
    all: () => [...adminKeys.all, "profile"] as const,
  },
} as const;

export const publicKeys = {
  all: ["public"] as const,
  properties: {
    all: () => [...publicKeys.all, "properties"] as const,
    detail: (id: string) => [...publicKeys.properties.all(), id] as const,
  },
  search: {
    all: () => [...publicKeys.all, "search"] as const,
    list: (params: Record<string, unknown>) =>
      [...publicKeys.search.all(), params] as const,
  },
} as const;

export const tenantKeys = {
  all: ["tenant"] as const,
  leases: {
    all: () => [...tenantKeys.all, "leases"] as const,
    detail: (id: string) => [...tenantKeys.leases.all(), id] as const,
  },
  profile: {
    all: () => [...tenantKeys.all, "profile"] as const,
  },
} as const;
