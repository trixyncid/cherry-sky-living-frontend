import type { LeadSource } from "@/lib/analytics";
import { apiFetch } from "@/lib/api/client";

export type LeadType = "viewing" | "inquiry" | "waitlist" | "reservation";

export interface CreateLeadPayload {
  type: LeadType;
  name: string;
  phone: string;
  email?: string;
  propertyId?: string;
  unitTypeId?: string;
  preferredDate?: string;
  viewingMode?: "in_person" | "video";
  moveInDate?: string;
  budget?: number;
  message?: string;
  pagePath?: string;
  source?: LeadSource;
  /** Honeypot — must stay empty. */
  website?: string;
}

export function createLead(payload: CreateLeadPayload) {
  return apiFetch<{ success: true; data: { id: string | null } }>(
    "/public/leads",
    { method: "POST", body: payload },
  );
}

/** Same rule as the backend: Indonesian mobile, 08… / 8… / 62… / +62…. */
export function isValidIndonesianMobile(raw: string): boolean {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith("8")) digits = `62${digits}`;
  if (!digits.startsWith("62")) return false;
  const subscriber = digits.slice(2);
  return /^8\d{7,12}$/.test(subscriber);
}
