import { apiFetch, apiFetchFormData } from "@/lib/api/client";
import type {
  ApiDataResponse,
  ApiLedgerListResponse,
  LedgerEntry,
  LedgerEntryType,
} from "@/lib/types/admin";

export type LedgerEntryFilters = {
  propertyId?: string;
  type?: LedgerEntryType;
  startDate?: string;
  endDate?: string;
};

function buildQuery(filters?: LedgerEntryFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.propertyId) params.set("propertyId", filters.propertyId);
  if (filters.type) params.set("type", filters.type);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  const q = params.toString();
  return q ? `?${q}` : "";
}

export async function listLedgerEntries(
  filters?: LedgerEntryFilters,
): Promise<ApiLedgerListResponse> {
  return apiFetch<ApiLedgerListResponse>(
    `/admin/ledger-entries${buildQuery(filters)}`,
  );
}

export async function getLedgerEntry(id: string): Promise<LedgerEntry> {
  const res = await apiFetch<ApiDataResponse<LedgerEntry>>(
    `/admin/ledger-entries/${id}`,
  );
  return res.data;
}

type LedgerEntryInput = {
  type: LedgerEntryType;
  amount: number;
  description: string;
  category?: string | null;
  date: string;
  propertyId?: string | null;
  /** Optional on create only — backend create accepts multipart; update is JSON-only. */
  file?: File | null;
};

function buildLedgerEntryFormData(
  input: Omit<LedgerEntryInput, "file">,
  file?: File | null,
): FormData {
  const form = new FormData();
  form.set("type", input.type);
  form.set("amount", String(input.amount));
  form.set("description", input.description);
  form.set("date", input.date);
  if (input.category) form.set("category", input.category);
  if (input.propertyId) form.set("propertyId", input.propertyId);
  if (file) form.set("file", file);
  return form;
}

export async function createLedgerEntry(
  input: LedgerEntryInput,
): Promise<LedgerEntry> {
  const { file, ...fields } = input;

  if (file) {
    const res = await apiFetchFormData<ApiDataResponse<LedgerEntry>>(
      "/admin/ledger-entries",
      buildLedgerEntryFormData(fields, file),
    );
    return res.data;
  }

  const res = await apiFetch<ApiDataResponse<LedgerEntry>>(
    "/admin/ledger-entries",
    { method: "POST", body: fields },
  );
  return res.data;
}

export async function updateLedgerEntry(
  id: string,
  input: Omit<Partial<LedgerEntryInput>, "file">,
): Promise<LedgerEntry> {
  // Backend PUT is JSON-only. Upload receipts via POST /admin/attachments/ledger-entry.
  const res = await apiFetch<ApiDataResponse<LedgerEntry>>(
    `/admin/ledger-entries/${id}`,
    { method: "PUT", body: input },
  );
  return res.data;
}

export async function deleteLedgerEntry(id: string): Promise<LedgerEntry> {
  const res = await apiFetch<ApiDataResponse<LedgerEntry>>(
    `/admin/ledger-entries/${id}`,
    { method: "DELETE" },
  );
  return res.data;
}
