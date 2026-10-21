import { apiFetch, apiFetchFormData } from "@/lib/api/client";
import type {
  ApiDataResponse,
  ManualPettyCashType,
  PettyCashEntry,
  PettyCashEntryType,
  PettyCashSummary,
} from "@/lib/types/admin";

export type PettyCashFilters = {
  propertyId?: string;
  type?: PettyCashEntryType;
  startDate?: string;
  endDate?: string;
};

export type PettyCashListResponse = {
  data: PettyCashEntry[];
  summary: PettyCashSummary;
};

export async function listPettyCash(
  filters?: PettyCashFilters,
): Promise<PettyCashListResponse> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters ?? {})) {
    if (value) params.set(key, value);
  }
  const q = params.toString();
  return apiFetch<PettyCashListResponse>(
    `/admin/petty-cash${q ? `?${q}` : ""}`,
  );
}

export async function getPettyCashEntry(id: string): Promise<PettyCashEntry> {
  const res = await apiFetch<ApiDataResponse<PettyCashEntry>>(
    `/admin/petty-cash/${id}`,
  );
  return res.data;
}

export type PettyCashInput = {
  propertyId: string;
  type: ManualPettyCashType;
  /** Positive; the server applies the sign from the type. */
  amount: number;
  category?: string | null;
  description: string;
  date: string;
};

export async function createPettyCashEntry(
  input: PettyCashInput,
): Promise<PettyCashEntry> {
  const res = await apiFetch<ApiDataResponse<PettyCashEntry>>(
    "/admin/petty-cash",
    { method: "POST", body: input },
  );
  return res.data;
}

export async function updatePettyCashEntry(
  id: string,
  input: Partial<
    Pick<PettyCashInput, "amount" | "category" | "description" | "date">
  >,
): Promise<PettyCashEntry> {
  const res = await apiFetch<ApiDataResponse<PettyCashEntry>>(
    `/admin/petty-cash/${id}`,
    { method: "PUT", body: input },
  );
  return res.data;
}

/** Record counted cash; the difference to the book becomes an adjustment. */
export async function countPettyCash(input: {
  propertyId: string;
  countedAmount: number;
  note?: string;
}): Promise<PettyCashEntry> {
  const res = await apiFetch<ApiDataResponse<PettyCashEntry>>(
    "/admin/petty-cash/count",
    { method: "POST", body: input },
  );
  return res.data;
}

export async function voidPettyCashEntry(
  id: string,
  reason?: string,
): Promise<PettyCashEntry> {
  const res = await apiFetch<ApiDataResponse<PettyCashEntry>>(
    `/admin/petty-cash/${id}/void`,
    { method: "POST", body: { reason } },
  );
  return res.data;
}

export async function uploadPettyCashReceipt(
  pettyCashEntryId: string,
  file: File,
): Promise<void> {
  const form = new FormData();
  form.set("pettyCashEntryId", pettyCashEntryId);
  form.set("file", file);
  await apiFetchFormData("/admin/attachments/petty-cash", form);
}

export async function deletePettyCashReceipt(id: string): Promise<void> {
  await apiFetch(`/admin/attachments/petty-cash/${id}`, { method: "DELETE" });
}
