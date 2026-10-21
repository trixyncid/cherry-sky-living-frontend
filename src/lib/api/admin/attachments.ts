import { apiFetch, apiFetchFormData } from "@/lib/api/client";
import type {
  ApiDataResponse,
  LeaseAttachment,
  LeaseAttachmentKind,
  LedgerEntryAttachment,
  PropertyAttachment,
  UnitTypeAttachment,
} from "@/lib/types/admin";

async function uploadAttachment(
  path: string,
  fields: Record<string, string>,
  file: File,
): Promise<void> {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.set(key, value);
  }
  form.set("file", file);

  await apiFetchFormData<unknown>(path, form, "POST");
}

export function uploadPropertyImage(
  propertyId: string,
  file: File,
): Promise<void> {
  return uploadAttachment("/admin/attachments/property", { propertyId }, file);
}

export function uploadUnitTypeImage(
  unitTypeId: string,
  file: File,
): Promise<void> {
  return uploadAttachment("/admin/attachments/unit-type", { unitTypeId }, file);
}

export function uploadLeaseAttachment(
  leaseId: string,
  file: File,
  kind: LeaseAttachmentKind = "downpayment",
): Promise<void> {
  return uploadAttachment("/admin/attachments/lease", { leaseId, kind }, file);
}

export function uploadLedgerEntryImage(
  ledgerEntryId: string,
  file: File,
): Promise<void> {
  return uploadAttachment(
    "/admin/attachments/ledger-entry",
    { ledgerEntryId },
    file,
  );
}

/** @deprecated Prefer uploadLeaseAttachment */
export function uploadLeaseDownpaymentImage(
  leaseId: string,
  file: File,
): Promise<void> {
  return uploadLeaseAttachment(leaseId, file, "downpayment");
}

export async function deletePropertyAttachment(
  id: string,
): Promise<PropertyAttachment> {
  const res = await apiFetch<ApiDataResponse<PropertyAttachment>>(
    `/admin/attachments/property/${id}`,
    { method: "DELETE" },
  );
  return res.data;
}

export async function deleteUnitTypeAttachment(
  id: string,
): Promise<UnitTypeAttachment> {
  const res = await apiFetch<ApiDataResponse<UnitTypeAttachment>>(
    `/admin/attachments/unit-type/${id}`,
    { method: "DELETE" },
  );
  return res.data;
}

/** Change an uploaded lease file's document type. */
export async function updateLeaseAttachmentKind(
  id: string,
  kind: LeaseAttachmentKind,
): Promise<LeaseAttachment> {
  const res = await apiFetch<ApiDataResponse<LeaseAttachment>>(
    `/admin/attachments/lease/${id}`,
    { method: "PATCH", body: { kind } },
  );
  return res.data;
}

export async function deleteLeaseAttachment(
  id: string,
): Promise<LeaseAttachment> {
  const res = await apiFetch<ApiDataResponse<LeaseAttachment>>(
    `/admin/attachments/lease/${id}`,
    { method: "DELETE" },
  );
  return res.data;
}

/** @deprecated Prefer deleteLeaseAttachment */
export async function deleteLeaseDownpaymentAttachment(
  id: string,
): Promise<LeaseAttachment> {
  return deleteLeaseAttachment(id);
}

export async function deleteLedgerEntryAttachment(
  id: string,
): Promise<LedgerEntryAttachment> {
  const res = await apiFetch<ApiDataResponse<LedgerEntryAttachment>>(
    `/admin/attachments/ledger-entry/${id}`,
    { method: "DELETE" },
  );
  return res.data;
}
