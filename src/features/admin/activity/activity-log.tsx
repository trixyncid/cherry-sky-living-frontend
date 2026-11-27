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

/** Path words that are actions rather than things ("…/invoices/confirm"). */
const ACTION_WORDS = new Set([
  "confirm",
  "reject",
  "void",
  "active",
  "reset-password",
  "submit-for-review",
  "late-fee-waiver",
  "pending",
  "renewal",
  "billing",
  "occupants",
  "packages",
  "identity",
]);

/**
 * "POST /admin/leases/:id/invoices/confirm" → { verb: "confirm", thing: "invoices" }.
 * A trailing action word wins; otherwise the HTTP method is the verb.
 */
export function describeAction(action: string): {
  verb: string;
  thing: string;
} {
  const [method = "", route = ""] = action.split(" ", 2);
  const parts = route
    .replace(/^\/admin\/?/, "")
    .split("/")
    .filter((part) => part && !part.startsWith(":"));
  const last = parts.at(-1) ?? "";
  if (ACTION_WORDS.has(last)) {
    return { verb: last, thing: parts.at(-2) ?? parts[0] ?? "" };
  }
  return { verb: method, thing: last };
}

/** Calendar day in WIB, e.g. "2026-11-27". */
function dayKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    new Date(iso),
  );
}

/** Newest-first entries split into one group per WIB day. */
function groupByDay(entries: AuditLogEntry[]) {
  const groups: { day: string; entries: AuditLogEntry[] }[] = [];
  for (const entry of entries) {
    const day = dayKey(entry.createdAt);
    const last = groups.at(-1);
    if (last?.day === day) last.entries.push(entry);
    else groups.push({ day, entries: [entry] });
  }
  return groups;
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
  const dayFormat = new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeZone: "Asia/Jakarta",
  });
  const clockFormat = new Intl.DateTimeFormat(locale, {
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  });
  const todayKey = dayKey(new Date().toISOString());
  const yesterdayKey = dayKey(new Date(Date.now() - 86_400_000).toISOString());

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
        <div className="space-y-6">
          {groupByDay(entries).map((group) => (
            <section key={group.day}>
              <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.12em] text-fg-muted">
                {group.day === todayKey
                  ? tp("today")
                  : group.day === yesterdayKey
                    ? tp("yesterday")
                    : dayFormat.format(new Date(group.entries[0].createdAt))}
              </h3>
              <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
                {group.entries.map((entry) => (
                  <ActivityRow
                    key={entry.id}
                    entry={entry}
                    time={`${clockFormat.format(new Date(entry.createdAt))} WIB`}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {query.hasNextPage ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line bg-white px-5 text-sm font-medium text-fg hover:border-brand-line hover:text-brand disabled:opacity-60"
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
  const { verb, thing } = describeAction(entry.action);
  const verbLabel = tp.has(`verbs.${verb}`) ? tp(`verbs.${verb}`) : verb;
  const thingLabel = tp.has(`things.${thing}`)
    ? tp(`things.${thing}`)
    : thing.replace(/-/g, " ");
  const role = entry.actorRole?.toLowerCase();
  const roleLabel =
    role && tp.has(`roles.${role}`) ? tp(`roles.${role}`) : null;

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-subtle text-fg-2">
        <Icon name={VERB_ICONS[verb] ?? "history"} size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-fg">
          <span className="font-medium">{verbLabel}</span>{" "}
          <span className="text-fg-2">{thingLabel}</span>
        </p>
        <p className="mt-0.5 text-xs text-fg-muted">
          {tp("by", { name: entry.actorName ?? tp("unknownActor") })}
          {roleLabel ? ` (${roleLabel})` : ""}
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
