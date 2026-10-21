"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminDashboard } from "@/lib/api/admin/dashboard";
import {
  confirmLeaseInvoices,
  createLease,
  deleteLease,
  getLease,
  listLeases,
  setLeaseInvoiceLateFeeWaiver,
  setLeaseInvoicePending,
  updateLease,
  updateLeaseBilling,
  updateLeaseRenewal,
} from "@/lib/api/admin/leases";
import {
  createLedgerEntry,
  deleteLedgerEntry,
  getLedgerEntry,
  type LedgerEntryFilters,
  listLedgerEntries,
  updateLedgerEntry,
} from "@/lib/api/admin/ledger-entries";
import {
  countPettyCash,
  createPettyCashEntry,
  getPettyCashEntry,
  listPettyCash,
  type PettyCashFilters,
  updatePettyCashEntry,
  voidPettyCashEntry,
} from "@/lib/api/admin/petty-cash";
import {
  changeAdminPassword,
  getAdminProfile,
  updateAdminProfile,
} from "@/lib/api/admin/profile";
import {
  createProperty,
  deleteProperty,
  getProperty,
  listProperties,
  updateProperty,
} from "@/lib/api/admin/properties";
import {
  createStaffUser,
  deleteStaffUser,
  getStaffUser,
  listStaffUsers,
  resetStaffPassword,
  setStaffUserActive,
  updateStaffUser,
} from "@/lib/api/admin/staff";
import {
  createUnitPricing,
  deleteUnitPricing,
  getUnitPricing,
  listUnitPricings,
  updateUnitPricing,
  upsertUnitPricingPackages,
} from "@/lib/api/admin/unit-pricings";
import {
  createUnitType,
  deleteUnitType,
  getUnitType,
  listUnitTypes,
  updateUnitType,
} from "@/lib/api/admin/unit-types";
import {
  createUnit,
  deleteUnit,
  getUnit,
  listUnits,
  listVacantUnits,
  updateUnit,
} from "@/lib/api/admin/units";
import {
  createTenantUser,
  getTenantUser,
  listTenantUsers,
  resetTenantPassword,
  setTenantUserActive,
  updateTenantUser,
} from "@/lib/api/admin/users";
import { adminKeys } from "@/lib/query/keys";
import type { LedgerEntryType, UnitStatus } from "@/lib/types/admin";

export function useProperties() {
  return useQuery({
    queryKey: adminKeys.properties.all(),
    queryFn: listProperties,
  });
}

export function useAdminDashboard(propertyId?: string) {
  return useQuery({
    queryKey: adminKeys.dashboard.overview(propertyId),
    queryFn: () => getAdminDashboard(propertyId),
  });
}

export function useProperty(id: string, enabled = true) {
  return useQuery({
    queryKey: adminKeys.properties.detail(id),
    queryFn: () => getProperty(id),
    enabled: enabled && !!id,
  });
}

export function usePropertyMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: adminKeys.properties.all() });
    void qc.invalidateQueries({ queryKey: adminKeys.dashboard.all() });
  };

  return {
    create: useMutation({ mutationFn: createProperty, onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({
        id,
        ...input
      }: { id: string } & Parameters<typeof updateProperty>[1]) =>
        updateProperty(id, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: deleteProperty, onSuccess: invalidate }),
  };
}

export function useUnitTypes(propertyId?: string, enabled = true) {
  return useQuery({
    queryKey: adminKeys.unitTypes.list(propertyId),
    queryFn: () => listUnitTypes(propertyId),
    enabled,
  });
}

export function useUnitType(id: string, enabled = true) {
  return useQuery({
    queryKey: adminKeys.unitTypes.detail(id),
    queryFn: () => getUnitType(id),
    enabled: enabled && !!id,
  });
}

export function useUnitTypeMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: adminKeys.unitTypes.all() });
    void qc.invalidateQueries({ queryKey: adminKeys.unitPricings.all() });
    void qc.invalidateQueries({ queryKey: adminKeys.units.all() });
  };

  return {
    create: useMutation({ mutationFn: createUnitType, onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({
        id,
        ...input
      }: { id: string } & Parameters<typeof updateUnitType>[1]) =>
        updateUnitType(id, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: deleteUnitType, onSuccess: invalidate }),
  };
}

export function useUnitPricings(filters?: {
  unitTypeId?: string;
  propertyId?: string;
}) {
  return useQuery({
    queryKey: adminKeys.unitPricings.list(filters),
    queryFn: () => listUnitPricings(filters),
  });
}

export function useUnitPricing(id: string, enabled = true) {
  return useQuery({
    queryKey: adminKeys.unitPricings.detail(id),
    queryFn: () => getUnitPricing(id),
    enabled: enabled && !!id,
  });
}

export function useUnitPricingMutations() {
  const qc = useQueryClient();
  const invalidate = () =>
    void qc.invalidateQueries({ queryKey: adminKeys.unitPricings.all() });

  return {
    create: useMutation({
      mutationFn: createUnitPricing,
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({
        id,
        ...input
      }: { id: string } & Parameters<typeof updateUnitPricing>[1]) =>
        updateUnitPricing(id, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: deleteUnitPricing,
      onSuccess: invalidate,
    }),
    upsertPackages: useMutation({
      mutationFn: upsertUnitPricingPackages,
      onSuccess: invalidate,
    }),
  };
}

export function useUnits(propertyId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminKeys.units.list(propertyId),
    queryFn: () => listUnits(propertyId),
    enabled: options?.enabled ?? true,
  });
}

export function useVacantUnits(
  params: {
    startDate: string;
    endDate: string;
    propertyId?: string;
  },
  enabled = true,
) {
  return useQuery({
    queryKey: adminKeys.units.vacant(params),
    queryFn: () => listVacantUnits(params),
    enabled:
      enabled &&
      !!params.startDate &&
      !!params.endDate &&
      params.startDate <= params.endDate,
  });
}

export function useUnit(id: string, enabled = true) {
  return useQuery({
    queryKey: adminKeys.units.detail(id),
    queryFn: () => getUnit(id),
    enabled: enabled && !!id,
  });
}

export function useUnitMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: adminKeys.units.all() });
    void qc.invalidateQueries({ queryKey: adminKeys.leases.all() });
    void qc.invalidateQueries({ queryKey: adminKeys.dashboard.all() });
  };

  return {
    create: useMutation({ mutationFn: createUnit, onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({
        id,
        ...input
      }: { id: string } & Parameters<typeof updateUnit>[1]) =>
        updateUnit(id, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: deleteUnit, onSuccess: invalidate }),
  };
}

export function useLeases(
  filters?: {
    unitId?: string;
    userId?: string;
    propertyId?: string;
  },
  options?: { enabled?: boolean; refetchInterval?: number },
) {
  return useQuery({
    queryKey: adminKeys.leases.list(filters),
    queryFn: () => listLeases(filters),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
  });
}

export function useLease(id: string, enabled = true) {
  return useQuery({
    queryKey: adminKeys.leases.detail(id),
    queryFn: () => getLease(id),
    enabled: enabled && !!id,
  });
}

export function useTenantUsers(
  search?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: adminKeys.users.list(search),
    queryFn: () => listTenantUsers(search),
    enabled: options?.enabled ?? true,
  });
}

export function useTenantUser(id: string, enabled = true) {
  return useQuery({
    queryKey: adminKeys.users.detail(id),
    queryFn: () => getTenantUser(id),
    enabled: enabled && !!id,
  });
}

export function useTenantUserMutations() {
  const qc = useQueryClient();
  const invalidate = () =>
    void qc.invalidateQueries({ queryKey: adminKeys.users.all() });

  return {
    create: useMutation({
      mutationFn: createTenantUser,
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({
        id,
        ...input
      }: {
        id: string;
        name: string;
        phoneNumber: string;
        email?: string | null;
      }) => updateTenantUser(id, input),
      onSuccess: invalidate,
    }),
    setActive: useMutation({
      mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
        setTenantUserActive(id, isActive),
      onSuccess: invalidate,
    }),
    resetPassword: useMutation({ mutationFn: resetTenantPassword }),
  };
}

export function useStaffUsers(search?: string) {
  return useQuery({
    queryKey: adminKeys.staff.list(search),
    queryFn: () => listStaffUsers(search),
  });
}

export function useStaffUser(id: string, enabled = true) {
  return useQuery({
    queryKey: adminKeys.staff.detail(id),
    queryFn: () => getStaffUser(id),
    enabled: enabled && !!id,
  });
}

export function useStaffUserMutations() {
  const qc = useQueryClient();
  const invalidate = () =>
    void qc.invalidateQueries({ queryKey: adminKeys.staff.all() });

  return {
    create: useMutation({ mutationFn: createStaffUser, onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({
        id,
        ...input
      }: {
        id: string;
        name: string;
        email: string;
        role: "admin" | "superadmin";
      }) => updateStaffUser(id, input),
      onSuccess: invalidate,
    }),
    setActive: useMutation({
      mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
        setStaffUserActive(id, isActive),
      onSuccess: invalidate,
    }),
    resetPassword: useMutation({ mutationFn: resetStaffPassword }),
    remove: useMutation({ mutationFn: deleteStaffUser, onSuccess: invalidate }),
  };
}

export function useLeaseMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: adminKeys.leases.all() });
    void qc.invalidateQueries({ queryKey: adminKeys.units.all() });
    void qc.invalidateQueries({ queryKey: adminKeys.dashboard.all() });
    // Confirming bills posts rent / late-fee income (bank or petty cash).
    void qc.invalidateQueries({ queryKey: adminKeys.ledgerEntries.all() });
    void qc.invalidateQueries({ queryKey: adminKeys.pettyCash.all() });
  };

  return {
    updateBilling: useMutation({
      mutationFn: ({
        id,
        ...input
      }: { id: string } & Parameters<typeof updateLeaseBilling>[1]) =>
        updateLeaseBilling(id, input),
      onSuccess: invalidate,
    }),
    confirmInvoices: useMutation({
      mutationFn: ({
        id,
        ...input
      }: { id: string } & Parameters<typeof confirmLeaseInvoices>[1]) =>
        confirmLeaseInvoices(id, input),
      onSuccess: invalidate,
    }),
    setInvoicePending: useMutation({
      mutationFn: ({
        id,
        invoiceId,
        status,
      }: {
        id: string;
        invoiceId: string;
        status: "unpaid" | "waiting_for_review";
      }) => setLeaseInvoicePending(id, invoiceId, status),
      onSuccess: invalidate,
    }),
    setLateFeeWaiver: useMutation({
      mutationFn: ({
        id,
        invoiceId,
        ...input
      }: {
        id: string;
        invoiceId: string;
        waived: boolean;
        reason?: string;
      }) => setLeaseInvoiceLateFeeWaiver(id, invoiceId, input),
      onSuccess: invalidate,
    }),
    create: useMutation({
      mutationFn: (input: Parameters<typeof createLease>[0]) =>
        createLease(input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({
        id,
        ...input
      }: { id: string } & Parameters<typeof updateLease>[1]) =>
        updateLease(id, input),
      onSuccess: invalidate,
    }),
    confirmRenewal: useMutation({
      mutationFn: ({
        leaseId,
        isConfirmed,
      }: {
        leaseId: string;
        isConfirmed: boolean;
      }) => updateLeaseRenewal(leaseId, { isConfirmed }),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: deleteLease, onSuccess: invalidate }),
  };
}

export function useLedgerEntries(filters?: LedgerEntryFilters, enabled = true) {
  return useQuery({
    queryKey: adminKeys.ledgerEntries.list(filters),
    queryFn: () => listLedgerEntries(filters),
    enabled,
  });
}

export function useLedgerEntry(id: string, enabled = true) {
  return useQuery({
    queryKey: adminKeys.ledgerEntries.detail(id),
    queryFn: () => getLedgerEntry(id),
    enabled: enabled && !!id,
  });
}

export function useLedgerEntryMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: adminKeys.ledgerEntries.all() });
    void qc.invalidateQueries({ queryKey: adminKeys.dashboard.all() });
  };

  return {
    create: useMutation({
      mutationFn: createLedgerEntry,
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({
        id,
        ...input
      }: {
        id: string;
        type?: LedgerEntryType;
        amount?: number;
        description?: string;
        category?: string | null;
        date?: string;
        propertyId?: string | null;
        file?: File | null;
      }) => updateLedgerEntry(id, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: deleteLedgerEntry,
      onSuccess: invalidate,
    }),
  };
}

export function useAdminProfile() {
  return useQuery({
    queryKey: adminKeys.profile.all(),
    queryFn: getAdminProfile,
  });
}

export function useAdminProfileMutations() {
  const qc = useQueryClient();
  const invalidateProfile = () =>
    void qc.invalidateQueries({ queryKey: adminKeys.profile.all() });

  return {
    updateProfile: useMutation({
      mutationFn: updateAdminProfile,
      onSuccess: invalidateProfile,
    }),
    changePassword: useMutation({
      mutationFn: changeAdminPassword,
    }),
  };
}

export function usePettyCash(filters?: PettyCashFilters, enabled = true) {
  return useQuery({
    queryKey: adminKeys.pettyCash.list(filters),
    queryFn: () => listPettyCash(filters),
    enabled,
  });
}

export function usePettyCashEntry(id: string, enabled = true) {
  return useQuery({
    queryKey: adminKeys.pettyCash.detail(id),
    queryFn: () => getPettyCashEntry(id),
    enabled: enabled && !!id,
  });
}

export function usePettyCashMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: adminKeys.pettyCash.all() });
    void qc.invalidateQueries({ queryKey: adminKeys.leases.all() });
  };
  return {
    create: useMutation({
      mutationFn: createPettyCashEntry,
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({
        id,
        ...input
      }: { id: string } & Parameters<typeof updatePettyCashEntry>[1]) =>
        updatePettyCashEntry(id, input),
      onSuccess: invalidate,
    }),
    count: useMutation({ mutationFn: countPettyCash, onSuccess: invalidate }),
    void: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
        voidPettyCashEntry(id, reason),
      onSuccess: invalidate,
    }),
  };
}
