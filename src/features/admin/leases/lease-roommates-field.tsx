"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar } from "@/features/admin/operations/ops-kit";
import { TenantCombobox } from "@/features/admin/users/tenant-combobox";
import { contactSummary } from "@/lib/phone";
import type { TenantUser, UnitUserRef } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

export type RoommateEntry = Pick<UnitUserRef, "id" | "name"> &
  Partial<Pick<UnitUserRef, "email" | "phoneNumber">>;

type LeaseRoommatesFieldProps = {
  /** Primary tenant; hidden from the picker and counted toward capacity. */
  primaryUserId: string;
  roommates: RoommateEntry[];
  /** Total people the unit fits, primary included. */
  capacity: number;
  onAdd: (tenant: RoommateEntry) => void;
  onRemove: (userId: string) => void;
  /** A save is in flight (edit mode saves each change immediately). */
  pending?: boolean;
  disabled?: boolean;
  /** Ask before removing (edit mode, where removal saves immediately). */
  confirmRemove?: boolean;
};

/**
 * Roommates sharing a unit with the primary tenant. Shows how full the room
 * is, lists who's in it, and offers a picker (with quick-create) while there's
 * space. Billing and renewal stay with the primary tenant.
 */
export function LeaseRoommatesField({
  primaryUserId,
  roommates,
  capacity,
  onAdd,
  onRemove,
  pending = false,
  disabled = false,
  confirmRemove = false,
}: LeaseRoommatesFieldProps) {
  const tp = useTranslations("admin.pages.leases.roommates");
  const tc = useTranslations("admin.crud");
  const [removing, setRemoving] = useState<RoommateEntry | null>(null);
  const people = (primaryUserId ? 1 : 0) + roommates.length;
  const maxRoommates = Math.max(capacity - 1, 0);
  const full = roommates.length >= maxRoommates;
  const excludeIds = [primaryUserId, ...roommates.map((r) => r.id)].filter(
    Boolean,
  );

  if (maxRoommates === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line bg-subtle/80 px-4 py-3 text-sm text-fg-muted">
        {tp("singleRoom")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1" aria-hidden>
          {Array.from({ length: capacity }, (_, i) => (
            <Icon
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size seat row
              key={i}
              name="person"
              size={18}
              className={i < people ? "text-brand" : "text-line-strong"}
            />
          ))}
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold",
            full ? "bg-brand-tint text-brand" : "bg-subtle text-fg-2",
          )}
        >
          {tp("occupancy", { count: people, capacity })}
        </span>
      </div>

      {roommates.length > 0 ? (
        <ul className="space-y-2">
          {roommates.map((r) => {
            const contact = r.email ? contactSummary(r as UnitUserRef) : null;
            return (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-2"
              >
                <Avatar name={r.name} seed={r.id} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">
                    {r.name}
                  </p>
                  <p className="truncate text-xs text-fg-muted">
                    {contact || tp("roommateLabel")}
                  </p>
                </div>
                {!disabled ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      confirmRemove ? setRemoving(r) : onRemove(r.id)
                    }
                    aria-label={tp("remove", { name: r.name })}
                    title={tp("remove", { name: r.name })}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-40"
                  >
                    <Icon name="close" size={18} />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {disabled ? null : full ? (
        <p className="text-xs text-fg-muted">{tp("roomFull")}</p>
      ) : !primaryUserId ? (
        <p className="rounded-2xl border border-dashed border-line bg-subtle/80 px-4 py-3 text-sm text-fg-muted">
          {tp("selectTenantFirst")}
        </p>
      ) : (
        <TenantCombobox
          value=""
          excludeIds={excludeIds}
          placeholder={pending ? tp("saving") : tp("add")}
          onChange={(userId, tenant?: TenantUser) => {
            if (!userId || pending) return;
            onAdd(
              tenant
                ? {
                    id: tenant.id,
                    name: tenant.name,
                    email: tenant.email,
                    phoneNumber: tenant.phoneNumber,
                  }
                : { id: userId, name: "—" },
            );
          }}
        />
      )}

      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-fg-muted">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        {tp("hint")}
      </p>

      <Dialog
        open={removing != null}
        onOpenChange={(open) => !open && setRemoving(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tp("removeTitle")}</DialogTitle>
            <DialogDescription>
              {tp("removeConfirm", { name: removing?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRemoving(null)}
            >
              {tc("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (removing) onRemove(removing.id);
                setRemoving(null);
              }}
            >
              {tp("removeAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
