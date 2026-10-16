"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/shared/Icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminDeleteDialog } from "@/features/admin/crud/admin-delete-dialog";
import {
  attachmentDisplayName,
  isPdfAttachment,
  type AdminAttachmentItem,
} from "@/features/admin/lib/attachments";
import { formatDate } from "@/features/admin/lib/format";
import { cn } from "@/lib/utils";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const DOCUMENT_ACCEPT = `${IMAGE_ACCEPT},application/pdf`;
const MAX_BYTES = 5 * 1024 * 1024;

type QueuedTile = {
  id: string;
  file: File;
  previewUrl: string;
  isPdf: boolean;
};

export function AdminImageGallery({
  attachments,
  onUpload,
  onDelete,
  disabled = false,
  disabledTitle,
  disabledHint,
  error,
  allowPdf = false,
}: {
  attachments: AdminAttachmentItem[];
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  disabled?: boolean;
  disabledTitle?: string;
  disabledHint?: string;
  error?: string | null;
  /** When true, accepts PDF in addition to images (lease agreements / proofs). */
  allowPdf?: boolean;
}) {
  const t = useTranslations("admin.attachments");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCount = useRef(0);
  const [dragActive, setDragActive] = useState(false);
  const [queued, setQueued] = useState<QueuedTile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [preview, setPreview] = useState<AdminAttachmentItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminAttachmentItem | null>(
    null,
  );
  const [deletePending, setDeletePending] = useState(false);

  const accept = allowPdf ? DOCUMENT_ACCEPT : IMAGE_ACCEPT;
  const queuedRef = useRef(queued);
  queuedRef.current = queued;

  useEffect(() => {
    return () => {
      queuedRef.current.forEach((item) => {
        if (!item.isPdf) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const displayError = localError ?? error;
  const hasPhotos = attachments.length > 0 || queued.length > 0;

  function openPicker() {
    if (disabled || uploading) return;
    inputRef.current?.click();
  }

  function resetInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFiles(fileList: FileList | File[]) {
    if (disabled || uploading) return;
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const allowed = files.filter((file) => isAllowedFile(file, allowPdf));
    if (allowed.length === 0) {
      setLocalError(allowPdf ? t("invalidTypeWithPdf") : t("invalidType"));
      resetInput();
      return;
    }

    const oversized = allowed.find((file) => file.size > MAX_BYTES);
    if (oversized) {
      setLocalError(t("tooLarge"));
      resetInput();
      return;
    }

    setLocalError(null);
    const tiles: QueuedTile[] = allowed.map((file) => {
      const isPdf = isPdfFile(file);
      return {
        id: crypto.randomUUID(),
        file,
        previewUrl: isPdf ? "" : URL.createObjectURL(file),
        isPdf,
      };
    });
    setQueued((current) => [...current, ...tiles]);
    resetInput();
  }

  function removeQueued(id: string) {
    setQueued((current) => {
      const target = current.find((item) => item.id === id);
      if (target && !target.isPdf) URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  function clearQueue() {
    queued.forEach((item) => {
      if (!item.isPdf) URL.revokeObjectURL(item.previewUrl);
    });
    setQueued([]);
  }

  async function handleUpload() {
    if (disabled || uploading || queued.length === 0) return;

    setLocalError(null);
    setUploading(true);
    try {
      await onUpload(queued.map((item) => item.file));
      queued.forEach((item) => {
        if (!item.isPdf) URL.revokeObjectURL(item.previewUrl);
      });
      setQueued([]);
    } catch {
      // Parent reports the error; keep the selection so the user can retry.
    } finally {
      setUploading(false);
    }
  }

  function onDragEnter(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (disabled || uploading) return;
    dragCount.current += 1;
    setDragActive(true);
  }

  function onDragLeave(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragCount.current -= 1;
    if (dragCount.current <= 0) {
      dragCount.current = 0;
      setDragActive(false);
    }
  }

  function onDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragCount.current = 0;
    setDragActive(false);
    if (disabled || uploading) return;
    void handleFiles(event.dataTransfer.files);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      await onDelete(deleteTarget.id);
      setDeleteTarget(null);
      if (preview?.id === deleteTarget.id) setPreview(null);
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "relative rounded-2xl transition-colors",
        dragActive && !disabled && "bg-ferrugem/8",
      )}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple
        disabled={disabled || uploading}
        className="sr-only"
        aria-label={t("dropTitle")}
        onChange={(event) => void handleFiles(event.target.files ?? [])}
      />

      {disabled ? (
        <LockedDropzone title={disabledTitle} hint={disabledHint} />
      ) : hasPhotos ? (
        <div className="grid grid-cols-2 gap-2.5">
          <AddTile
            onClick={openPicker}
            compact
            disabled={uploading}
            allowPdf={allowPdf}
          />
          {queued.map((item) => (
            <QueuedPhoto
              key={item.id}
              src={item.previewUrl}
              name={item.file.name}
              isPdf={item.isPdf}
              uploading={uploading}
              onRemove={() => removeQueued(item.id)}
            />
          ))}
          {attachments.map((item) => (
            <PhotoTile
              key={item.id}
              item={item}
              onPreview={() => setPreview(item)}
              onDelete={() => setDeleteTarget(item)}
            />
          ))}
        </div>
      ) : (
        <AddTile onClick={openPicker} allowPdf={allowPdf} />
      )}

      {queued.length > 0 && !disabled ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs leading-relaxed text-[#83746b]">
            {t("queueHint", { count: queued.length })}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={clearQueue}
              className="glass-control inline-flex h-9 flex-1 items-center justify-center rounded-xl px-3 text-xs font-semibold text-[#51443c] transition-colors hover:bg-white/80 disabled:opacity-50"
            >
              {t("clearQueue")}
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => void handleUpload()}
              className="admin-btn-primary inline-flex h-9 flex-[1.4] items-center justify-center rounded-xl px-3 text-xs font-semibold disabled:opacity-60"
            >
              {uploading
                ? t("uploading")
                : t("uploadSelected", { count: queued.length })}
            </button>
          </div>
        </div>
      ) : null}

      {dragActive && !disabled && !uploading ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-[#71130d] bg-[#faf9f6]/88 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-1 text-[#71130d]">
            <Icon name="download" size={28} />
            <p className="text-sm font-semibold">{t("dropActive")}</p>
          </div>
        </div>
      ) : null}

      {displayError ? (
        <p className="mt-3 text-xs text-[#ba1a1a]">{displayError}</p>
      ) : null}

      <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl [&>button]:bg-white/90 [&>button]:text-[#51443c] [&>button]:hover:bg-white">
          {preview ? (
            <>
              <div className="relative aspect-[4/3] bg-[#1a1c1a]">
                {isPdfAttachment(preview) ? (
                  <div className="flex size-full flex-col items-center justify-center gap-3 text-white">
                    <Icon name="description" size={48} />
                    <p className="max-w-sm truncate px-4 text-sm font-medium">
                      {attachmentDisplayName(preview.url)}
                    </p>
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={preview.url}
                    alt={attachmentDisplayName(preview.url)}
                    className="size-full object-contain"
                  />
                )}
              </div>
              <div className="flex items-start justify-between gap-3 px-5 pb-5">
                <div className="min-w-0">
                  <DialogTitle className="truncate text-sm font-semibold text-[#1a1c1a]">
                    {attachmentDisplayName(preview.url)}
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 text-xs text-[#83746b]">
                    {preview.createdAt ? formatDate(preview.createdAt) : t("view")}
                  </DialogDescription>
                </div>
                <div className="flex shrink-0 gap-2">
                  <a
                    href={preview.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#e3e2e0] bg-white px-3 text-xs font-semibold text-[#51443c] transition-colors hover:bg-[#efeeeb]"
                  >
                    <Icon name="open_in_new" size={16} />
                    {t("view")}
                  </a>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(preview)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#ba1a1a]/20 bg-[#ba1a1a]/8 px-3 text-xs font-semibold text-[#ba1a1a] transition-colors hover:bg-[#ba1a1a]/14"
                  >
                    <Icon name="delete" size={16} />
                    {t("remove")}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <AdminDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemName={
          deleteTarget ? attachmentDisplayName(deleteTarget.url) : ""
        }
        onConfirm={confirmDelete}
        pending={deletePending}
      />
    </div>
  );
}

function isPdfFile(file: File) {
  if (file.type === "application/pdf" || file.type === "application/x-pdf") {
    return true;
  }
  return /\.pdf$/i.test(file.name);
}

function isAllowedFile(file: File, allowPdf: boolean) {
  if (IMAGE_ACCEPT.split(",").includes(file.type)) return true;
  if (allowPdf && isPdfFile(file)) return true;
  if (!file.type) {
    if (/\.(jpe?g|png|webp|gif)$/i.test(file.name)) return true;
    if (allowPdf && /\.pdf$/i.test(file.name)) return true;
  }
  return false;
}

function LockedDropzone({
  title,
  hint,
}: {
  title?: string;
  hint?: string;
}) {
  const t = useTranslations("admin.attachments");
  return (
    <div className="flex min-h-[13.5rem] flex-col items-center justify-center rounded-2xl border border-dashed border-[#d5c3b8]/80 bg-[#faf9f6]/60 px-5 py-8 text-center">
      <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-white/80 text-[#83746b] shadow-sm">
        <Icon name="lock" size={22} />
      </span>
      <p className="text-sm font-semibold text-[#51443c]">
        {title ?? t("lockedTitle")}
      </p>
      <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-[#83746b]">
        {hint ?? t("lockedHint")}
      </p>
    </div>
  );
}

function AddTile({
  onClick,
  compact = false,
  disabled = false,
  allowPdf = false,
}: {
  onClick: () => void;
  compact?: boolean;
  disabled?: boolean;
  allowPdf?: boolean;
}) {
  const t = useTranslations("admin.attachments");

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d5c3b8] bg-white/40 text-ferrugem transition-all hover:border-ferrugem hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ferrugem/25 disabled:cursor-not-allowed disabled:opacity-60",
        compact ? "aspect-[4/3] px-3 py-4" : "min-h-[13.5rem] px-5 py-8",
      )}
    >
      <span
        className={cn(
          "mb-2 flex items-center justify-center rounded-full bg-ferrugem/10 text-ferrugem transition-transform group-hover:scale-105",
          compact ? "size-10" : "mb-3 size-12",
        )}
      >
        <Icon name="add_photo_alternate" size={compact ? 20 : 24} />
      </span>
      <span className={cn("font-semibold", compact ? "text-xs" : "text-sm")}>
        {compact ? t("addMore") : t("dropTitle")}
      </span>
      <span
        className={cn(
          "mt-0.5 text-[#83746b]",
          compact ? "text-[11px] leading-tight" : "mt-1 max-w-[16rem] text-xs leading-relaxed",
        )}
      >
        {compact
          ? t("addMoreHint")
          : allowPdf
            ? t("dropHintWithPdf")
            : t("dropHint")}
      </span>
    </button>
  );
}

function QueuedPhoto({
  src,
  name,
  isPdf,
  uploading,
  onRemove,
}: {
  src: string;
  name: string;
  isPdf: boolean;
  uploading: boolean;
  onRemove: () => void;
}) {
  const t = useTranslations("admin.attachments");

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#efeeeb] ring-2 ring-ferrugem/70 ring-offset-2 ring-offset-transparent">
      {isPdf ? (
        <div className="flex size-full flex-col items-center justify-center gap-1 bg-ferrugem-soft/60 text-ferrugem">
          <Icon name="description" size={28} />
          <span className="max-w-[90%] truncate px-2 text-[11px] font-medium">
            {name}
          </span>
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={src} alt={name} className="size-full object-cover" />
      )}
      <span className="absolute left-2 top-2 rounded-full bg-[#71130d] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
        {t("queuedBadge")}
      </span>
      {uploading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-[#1a1c1a]/45 text-white">
          <span className="size-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <span className="text-[11px] font-semibold">{t("uploading")}</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/92 text-[#51443c] shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-[#ba1a1a]"
          aria-label={t("removeFromQueue")}
        >
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  );
}

function PhotoTile({
  item,
  onPreview,
  onDelete,
}: {
  item: AdminAttachmentItem;
  onPreview: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("admin.attachments");
  const name = attachmentDisplayName(item.url);
  const pdf = isPdfAttachment(item);

  return (
    <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#efeeeb] shadow-sm">
      <button
        type="button"
        onClick={onPreview}
        className="size-full"
        aria-label={t("view")}
      >
        {pdf ? (
          <div className="flex size-full flex-col items-center justify-center gap-1 bg-ferrugem-soft/50 text-ferrugem transition-transform duration-300 group-hover:scale-[1.04]">
            <Icon name="description" size={28} />
            <span className="max-w-[90%] truncate px-2 text-[11px] font-medium">
              {name}
            </span>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.url}
            alt={name}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        )}
      </button>
      {item.kindLabel ? (
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-[#1a1c1a]/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
          {item.kindLabel}
        </span>
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1a1c1a]/55 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" />
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          onClick={onPreview}
          className="pointer-events-auto flex size-8 items-center justify-center rounded-full bg-white/92 text-[#51443c] shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
          aria-label={t("view")}
        >
          <Icon name="zoom_in" size={16} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="pointer-events-auto flex size-8 items-center justify-center rounded-full bg-white/92 text-[#ba1a1a] shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
          aria-label={t("remove")}
        >
          <Icon name="delete" size={16} />
        </button>
      </div>
    </div>
  );
}
