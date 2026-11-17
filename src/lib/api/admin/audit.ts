import { apiFetch } from "@/lib/api/client";

export type AuditLogEntry = {
  id: string;
  actorId: string | null;
  actorName: string | null;
  actorRole: string | null;
  /** e.g. "DELETE /admin/leases/:id" */
  action: string;
  entityType: string;
  entityId: string | null;
  details: unknown;
  createdAt: string;
};

export type AuditLogPage = {
  data: AuditLogEntry[];
  /** Pass as `before` to load the next (older) page; null at the end. */
  nextBefore: string | null;
};

/** Superadmin only. Newest first, 50 per page. */
export async function listAuditLogs(before?: string): Promise<AuditLogPage> {
  const query = before ? `?${new URLSearchParams({ before })}` : "";
  return await apiFetch<AuditLogPage>(`/admin/audit-logs${query}`);
}
