"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTenantLease, listTenantLeases, updateTenantLeaseRenewal } from "@/lib/api/tenant/leases";
import {
  changeTenantPassword,
  getTenantProfile,
  updateTenantProfile,
} from "@/lib/api/tenant/profile";
import { tenantKeys } from "@/lib/query/keys";

export function useTenantLeases() {
  return useQuery({
    queryKey: tenantKeys.leases.all(),
    queryFn: listTenantLeases,
  });
}

export function useTenantLease(id: string, enabled = true) {
  return useQuery({
    queryKey: tenantKeys.leases.detail(id),
    queryFn: () => getTenantLease(id),
    enabled: enabled && !!id,
  });
}

export function useTenantLeaseMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: tenantKeys.leases.all() });
  };

  return {
    updateRenewal: useMutation({
      mutationFn: ({
        leaseId,
        action,
      }: {
        leaseId: string;
        action: "renew" | "decline" | "cancel";
      }) => updateTenantLeaseRenewal(leaseId, { action }),
      onSuccess: invalidate,
    }),
  };
}

export function useTenantProfile() {
  return useQuery({
    queryKey: tenantKeys.profile.all(),
    queryFn: getTenantProfile,
  });
}

export function useTenantProfileMutations() {
  const qc = useQueryClient();
  const invalidateProfile = () =>
    void qc.invalidateQueries({ queryKey: tenantKeys.profile.all() });

  return {
    updateProfile: useMutation({
      mutationFn: updateTenantProfile,
      onSuccess: invalidateProfile,
    }),
    changePassword: useMutation({
      mutationFn: changeTenantPassword,
    }),
  };
}
