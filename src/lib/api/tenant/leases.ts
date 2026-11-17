import { apiFetch, apiFetchFormData } from "@/lib/api/client";
import type {
  ApiDataResponse,
  ApiListResponse,
  Lease,
  LeaseAttachment,
  LeaseRenewal,
} from "@/lib/types/admin";

/**
 * Upload an inspection video: the backend signs a storage URL, the browser
 * PUTs the file there directly (videos are too big for the API), then the
 * backend verifies and records it. `onProgress` gets 0–1.
 */
export async function uploadTenantInspectionVideo(
  leaseId: string,
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<LeaseAttachment> {
  const contentType = file.type || "video/mp4";
  const start = await apiFetch<
    ApiDataResponse<{
      uploadUrl: string;
      headers: Record<string, string>;
      objectKey: string;
    }>
  >(`/leases/${leaseId}/inspection/video`, {
    method: "POST",
    body: { fileName: file.name, contentType, sizeBytes: file.size },
  });

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", start.data.uploadUrl);
    for (const [name, value] of Object.entries(start.data.headers)) {
      xhr.setRequestHeader(name, value);
    }
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Video upload failed (${xhr.status})`));
    xhr.onerror = () =>
      reject(new Error("Video upload failed. Check your connection."));
    xhr.send(file);
  });

  const done = await apiFetch<ApiDataResponse<LeaseAttachment>>(
    `/leases/${leaseId}/inspection/video/complete`,
    {
      method: "POST",
      body: { objectKey: start.data.objectKey, fileName: file.name },
    },
  );
  return done.data;
}

/** Upload one unit-inspection photo or PDF to a lease the tenant lives in. */
export async function uploadTenantInspection(
  leaseId: string,
  file: File,
): Promise<LeaseAttachment> {
  const form = new FormData();
  form.set("file", file);
  const res = await apiFetchFormData<ApiDataResponse<LeaseAttachment>>(
    `/leases/${leaseId}/inspection`,
    form,
  );
  return res.data;
}

export async function listTenantLeases(): Promise<Lease[]> {
  const res = await apiFetch<ApiListResponse<Lease>>("/leases");
  return res.data;
}

export async function getTenantLease(id: string): Promise<Lease> {
  const res = await apiFetch<ApiDataResponse<Lease>>(`/leases/${id}`);
  return res.data;
}

export async function updateTenantLeaseRenewal(
  leaseId: string,
  input: { action: "renew" | "decline" | "cancel" },
): Promise<LeaseRenewal> {
  const res = await apiFetch<ApiDataResponse<LeaseRenewal>>(
    `/leases/${leaseId}/renewal`,
    {
      method: "PUT",
      body: input,
    },
  );
  return res.data;
}
