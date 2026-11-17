import { apiFetch } from "@/lib/api/client";
import type { ApiDataResponse } from "@/lib/types/admin";

type TaskLease = {
  id: string;
  userId: string;
  updatedAt: string;
  unit: { name: string } | null;
  user: { name: string; phoneNumber: string | null; email: string } | null;
};

export type AdminTaskFeed = {
  bills: Array<{
    id: string;
    sequence: number;
    amount: number;
    updatedAt: string;
    lease: TaskLease;
  }>;
  renewals: Array<{
    id: string;
    isConfirmed: boolean;
    updatedAt: string;
    lease: TaskLease;
  }>;
};

/** Bills awaiting review + open renewals: what the sidebar badges count. */
export async function getAdminTasks(): Promise<AdminTaskFeed> {
  const res =
    await apiFetch<ApiDataResponse<AdminTaskFeed>>("/admin/meta/tasks");
  return res.data;
}
