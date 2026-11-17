"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import { AdminAlert } from "@/features/admin/components/admin-alert";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { getErrorMessage } from "@/features/admin/lib/errors";
import { type AuditLogEntry, listAuditLogs } from "@/lib/api/admin/audit";
import { adminKeys } from "@/lib/query/keys";

const VERB_ICONS: Record<string, string> = {
  POST: "add_circle",
  PUT: "edit",
  PATCH: "edit",
  DELETE: "delete",
  PROFILE: "manage_accounts",
};

/** "POST /admin/leases/:id/invoices/confirm" → "leases · invoices · confirm" */
function describeAction(action: string): { verb: string; what: string } {
  const [verb = "", route = ""] = action.split(" ", 2);
  const what = route
    .replace(/^\/admin\/?/, "")
    .split("/")
    .filter((part) => part && !part.startsWith(":"))
    .join(" · ");
  return { verb, what: what || action.slice(verb.length).trim() };
}

/** Superadmin-only record of every admin write (see backend lib/audit.ts). */
export function ActivityLog() {
  const tp = useTranslations("admin.pages.activity");
  const locale = useLocale();
  const query = useInfiniteQuery({
    queryKey: [...adminKeys.all, "audit-logs"],
    queryFn: ({ pageParam }) => listAuditLogs(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextBefore ?? undefined,
  });

  const entries = query.data?.pages.flatMap((p) => p.data) ?? [];
  const timeFormat = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  });

  return (
    <>
      <AdminPageHeader title={tp("title")} description={tp("description")} />

      {query.error ? (
        <AdminAlert message={getErrorMessage(query.error, tp("loadFailed"))} />
      ) : null}

      {query.isLoading ? (
        <p className="text-sm text-fg-muted">{tp("loading")}</p>
      ) : entries.length === 0 && !query.error ? (
        <p className="rounded-2xl border border-dashed border-line bg-subtle/80 px-4 py-6 text-center text-sm text-fg-muted">
          {tp("empty")}
        </p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {entries.map((entry) => (
            <ActivityRow
              key={entry.id}
              entry={entry}
              time={timeFormat.format(new Date(entry.createdAt))}
            />
          ))}
        </ul>
      )}

      {query.hasNextPage ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-white px-5 text-sm font-medium text-fg hover:border-brand-line hover:text-brand disabled:opacity-60"
          >
            <Icon name="expand_more" size={18} />
            {query.isFetchingNextPage ? tp("loading") : tp("loadMore")}
          </button>
        </div>
      ) : null}
    </>
  );
}

function ActivityRow({ entry, time }: { entry: AuditLogEntry; time: string }) {
  const tp = useTranslations("admin.pages.activity");
  const { verb, what } = describeAction(entry.action);
  const verbLabel = tp.has(`verbs.${verb}`) ? tp(`verbs.${verb}`) : verb;

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-subtle text-fg-2">
        <Icon name={VERB_ICONS[verb] ?? "history"} size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-fg">
          <span className="font-medium">{verbLabel}</span>{" "}
          <span className="text-fg-2">{what}</span>
        </p>
        <p className="mt-0.5 text-xs text-fg-muted">
          {tp("by", { name: entry.actorName ?? tp("unknownActor") })}
          {entry.actorRole ? ` (${entry.actorRole})` : ""}
          {entry.entityId
            ? ` · ${tp("record", { id: entry.entityId.slice(0, 12) })}`
            : ""}
        </p>
      </div>
      <time
        dateTime={entry.createdAt}
        className="shrink-0 text-xs tabular-nums text-fg-muted"
      >
        {time}
      </time>
    </li>
  );
}
