"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTenantLease,
  listTenantLeases,
  updateTenantLeaseRenewal,
  uploadTenantInspection,
  uploadTenantInspectionVideo,
} from "@/lib/api/tenant/leases";
import {
  changeTenantPassword,
  getTenantIdentity,
  getTenantProfile,
  updateTenantProfile,
  uploadTenantIdentity,
} from "@/lib/api/tenant/profile";
import { tenantKeys } from "@/lib/query/keys";
import type { IdentityDocumentType } from "@/lib/types/admin";

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
    uploadInspection: useMutation({
      mutationFn: ({ leaseId, file }: { leaseId: string; file: File }) =>
        uploadTenantInspection(leaseId, file),
    }),
    uploadInspectionVideo: useMutation({
      mutationFn: ({
        leaseId,
        file,
        onProgress,
      }: {
        leaseId: string;
        file: File;
        onProgress?: (fraction: number) => void;
      }) => uploadTenantInspectionVideo(leaseId, file, onProgress),
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

/** The tenant's own KTP / passport upload (null until they add one). */
export function useTenantIdentity() {
  return useQuery({
    queryKey: tenantKeys.profile.identity(),
    queryFn: getTenantIdentity,
  });
}

export function useUploadTenantIdentity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, file }: { type: IdentityDocumentType; file: File }) =>
      uploadTenantIdentity(type, file),
    onSuccess: (doc) => qc.setQueryData(tenantKeys.profile.identity(), doc),
  });
}
