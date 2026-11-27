"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import { useLeaveGuard } from "@/features/admin/hooks/use-leave-guard";
import {
  showApiError,
  showApiSuccess,
} from "@/features/admin/lib/show-api-error";
import { TenantAttachmentsList } from "@/features/tenant/components/tenant-attachments-list";
import { useTenantLeaseMutations } from "@/features/tenant/hooks/use-tenant-queries";
import { exceedsUploadLimit, shrinkImageForUpload } from "@/lib/image-shrink";
import { tenantKeys } from "@/lib/query/keys";
import type { Lease } from "@/lib/types/admin";

/** Matches the backend rules (lib/image-process.ts, lib/video-upload.ts). */
const PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];
const VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/3gpp",
];
const ACCEPT = [...PHOTO_TYPES, ...VIDEO_TYPES].join(",");
const VIDEO_MAX_BYTES = 300 * 1024 * 1024;

function isVideoFile(file: File) {
  return VIDEO_TYPES.includes(file.type);
}

/** Photos are downscaled first; the 4 MB limit applies to the result. */
function isAcceptable(file: File) {
  if (isVideoFile(file)) return file.size <= VIDEO_MAX_BYTES;
  return PHOTO_TYPES.includes(file.type) && !exceedsUploadLimit(file);
}

/**
 * Unit inspection: the tenant photographs the room's condition (or uploads a
 * signed checklist) so move-in / move-out and deposit questions have a record.
 */
export function TenantLeaseInspection({ lease }: { lease: Lease }) {
  const tp = useTranslations("tenant.pages.leases.inspection");
  const qc = useQueryClient();
  const { uploadInspection, uploadInspectionVideo } = useTenantLeaseMutations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
    /** 0–100 while a video is uploading. */
    percent: number | null;
  } | null>(null);

  const files = (lease.attachments ?? []).filter(
    (a) => a.kind === "inspection",
  );

  async function handleFiles(list: FileList | null) {
    if (!list?.length) return;
    const picked = await Promise.all(
      Array.from(list).map((file) =>
        isVideoFile(file) ? file : shrinkImageForUpload(file),
      ),
    );
    const valid = picked.filter(isAcceptable);
    const skipped = picked.length - valid.length;
    if (skipped > 0) {
      showApiError(null, tp("skipped", { count: skipped }));
    }
    if (valid.length === 0) return;

    let uploaded = 0;
    let firstError: unknown = null;
    setProgress({ done: 0, total: valid.length, percent: null });
    for (const file of valid) {
      try {
        if (isVideoFile(file)) {
          setProgress((p) => (p ? { ...p, percent: 0 } : p));
          await uploadInspectionVideo.mutateAsync({
            leaseId: lease.id,
            file,
            onProgress: (fraction) =>
              setProgress((p) =>
                p ? { ...p, percent: Math.round(fraction * 100) } : p,
              ),
          });
        } else {
          await uploadInspection.mutateAsync({ leaseId: lease.id, file });
        }
        uploaded += 1;
      } catch (err) {
        firstError ??= err;
      }
      setProgress((p) => (p ? { ...p, done: p.done + 1, percent: null } : p));
    }
    setProgress(null);
    void qc.invalidateQueries({ queryKey: tenantKeys.leases.all() });

    if (uploaded > 0) showApiSuccess(tp("uploaded", { count: uploaded }));
    if (firstError) {
      showApiError(
        firstError,
        tp("failed", { count: valid.length - uploaded }),
      );
    }
  }

  const busy = progress !== null;
  // A big video upload is lost if the tenant navigates away mid-way.
  useLeaveGuard(busy, tp("leaveWarning"));

  return (
    <div className="space-y-4">
      {/* Stacked on phones so the text isn't squeezed into a narrow column. */}
      <div className="flex flex-col items-stretch gap-3 rounded-2xl bg-subtle p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 flex-1 text-sm text-fg-2">
          {files.length > 0
            ? tp("count", { count: files.length })
            : tp("prompt")}
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-md bg-brand px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <Icon
            name={busy ? "progress_activity" : "add_a_photo"}
            size={18}
            className={busy ? "animate-spin" : undefined}
          />
          {busy
            ? progress.percent !== null
              ? tp("uploadingVideo", {
                  current: progress.done + 1,
                  total: progress.total,
                  percent: progress.percent,
                })
              : tp("uploading", {
                  done: progress.done,
                  total: progress.total,
                })
            : tp("upload")}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 ? (
        <TenantAttachmentsList
          attachments={files.map((a) => ({
            ...a,
            kindLabel: tp("kindLabel"),
          }))}
        />
      ) : null}

      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-fg-muted">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        {tp("rules")}
      </p>
    </div>
  );
}
