"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/shared/Icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatIdr } from "@/features/admin/lib/format";
import {
  type AdminTask,
  type AdminTaskKind,
  useAdminTasks,
} from "@/features/admin/lib/nav-state";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** Rows shown per group before "View all". */
const PER_GROUP = 4;

const GROUPS: {
  kind: AdminTaskKind;
  key: "payments" | "renewals" | "renewalLeases";
  icon: string;
  viewAll: string;
}[] = [
  {
    kind: "payment",
    key: "payments",
    icon: "rate_review",
    viewAll: "/admin/leases",
  },
  {
    kind: "renewal",
    key: "renewals",
    icon: "autorenew",
    viewAll: "/admin/lease-renewals",
  },
  {
    kind: "renewalLease",
    key: "renewalLeases",
    icon: "post_add",
    viewAll: "/admin/lease-renewals",
  },
];

/**
 * Top-bar bell: how many things wait for the landlord (payments to approve,
 * renewal requests, approved renewals without a new lease) and a short list
 * linking to each one.
 */
export function AdminNotifications({ className }: { className?: string }) {
  const t = useTranslations("admin.notifications");
  const tasks = useAdminTasks();
  const [open, setOpen] = useState(false);
  const total = tasks.total;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn("relative", className)}
          aria-label={
            total > 0 ? t("buttonLabelCount", { count: total }) : t("title")
          }
        >
          <Icon name="notifications" size={20} filled={total > 0} />
          {total > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold leading-none text-white tabular-nums ring-2 ring-panel">
              {total > 99 ? "99+" : total}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(23rem,calc(100vw-1.5rem))] rounded-2xl border-line bg-white p-0 shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <p className="text-sm font-semibold text-fg">{t("title")}</p>
          {total > 0 ? (
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand tabular-nums">
              {t("toDo", { count: total })}
            </span>
          ) : null}
        </div>

        {total === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-success-soft text-success">
              <Icon name="task_alt" size={22} />
            </span>
            <p className="text-sm font-medium text-fg">{t("emptyTitle")}</p>
            <p className="text-xs text-fg-muted">{t("emptyHint")}</p>
          </div>
        ) : (
          <div className="max-h-[min(28rem,70vh)] overflow-y-auto py-1">
            {GROUPS.map((group) => {
              const items = tasks[group.key];
              if (items.length === 0) return null;
              return (
                <section key={group.key} className="px-2 py-1.5">
                  <div className="flex items-center justify-between px-2 pb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
                      {t(`groups.${group.key}`)}{" "}
                      <span className="tabular-nums">({items.length})</span>
                    </p>
                    {items.length > PER_GROUP ? (
                      <Link
                        href={group.viewAll}
                        onClick={() => setOpen(false)}
                        className="text-xs font-medium text-brand hover:underline"
                      >
                        {t("viewAll")}
                      </Link>
                    ) : null}
                  </div>
                  <ul>
                    {items.slice(0, PER_GROUP).map((task) => (
                      <li key={task.id}>
                        <TaskRow
                          task={task}
                          icon={group.icon}
                          onNavigate={() => setOpen(false)}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function TaskRow({
  task,
  icon,
  onNavigate,
}: {
  task: AdminTask;
  icon: string;
  onNavigate: () => void;
}) {
  const t = useTranslations("admin.notifications");
  const detail =
    task.kind === "payment"
      ? t("paymentDetail", {
          n: task.sequence ?? 1,
          amount: formatIdr(task.amount ?? 0),
        })
      : task.kind === "renewal"
        ? t("renewalDetail")
        : t("renewalLeaseDetail");

  return (
    <Link
      href={task.href}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-hover"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
        <Icon name={icon} size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-fg">
          {task.tenant}
          <span className="font-normal text-fg-muted"> · {task.unit}</span>
        </span>
        <span className="block truncate text-xs text-fg-muted">{detail}</span>
      </span>
      <Icon name="chevron_right" size={18} className="shrink-0 text-fg-muted" />
    </Link>
  );
}
