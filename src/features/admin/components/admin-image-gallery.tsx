"use client";

import { useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";
import { Icon } from "@/components/shared/Icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AdminDeleteDialog } from "@/features/admin/crud/admin-delete-dialog";
import {
  type AttachmentQueue,
  isPdfFile,
  type QueuedFile,
} from "@/features/admin/hooks/use-attachment-queue";
import {
  type AdminAttachmentItem,
  attachmentDisplayName,
  isPdfAttachment,
  isVideoAttachment,
} from "@/features/admin/lib/attachments";
import { formatDate } from "@/features/admin/lib/format";
import { exceedsUploadLimit, shrinkImageForUpload } from "@/lib/image-shrink";
import { cn } from "@/lib/utils";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const DOCUMENT_ACCEPT = `${IMAGE_ACCEPT},application/pdf`;

export type AttachmentKindOption = { value: string; label: string };

/**
 * Photos / documents of a record. Files can be added any time:
 * - new record (queue.deferred): they wait and upload when the form is saved
 * - existing record: they upload as soon as they're added
 * Failed uploads stay with a Retry button.
 */
export function AdminImageGallery({
  attachments,
  queue,
  onDelete,
  error,
  allowPdf = false,
  kindOptions,
  onKindChange,
  camera = false,
}: {
  attachments: AdminAttachmentItem[];
  queue: AttachmentQueue;
  onDelete: (id: string) => Promise<void>;
  error?: string | null;
  /** When true, accepts PDF in addition to images (lease agreements / proofs). */
  allowPdf?: boolean;
  /** Per-file document type picker (leases). */
  kindOptions?: AttachmentKindOption[];
  /** Change the type of an uploaded file (shows a menu on its tile). */
  onKindChange?: (id: string, kind: string) => Promise<void>;
  /** Show a "Take photo" button on phones (receipts). */
  camera?: boolean;
}) {
  const t = useTranslations("admin.attachments");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const dragCount = useRef(0);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [preview, setPreview] = useState<AdminAttachmentItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminAttachmentItem | null>(
    null,
  );
  const [deletePending, setDeletePending] = useState(false);

  const accept = allowPdf ? DOCUMENT_ACCEPT : IMAGE_ACCEPT;
  // Documents and receipts read better as a list with names and types;
  // photo galleries (buildings, room types) keep the tile grid.
  const documentMode = allowPdf || !!kindOptions;
  const displayError = localError ?? error;
  const queued = queue.items;
  const hasPhotos = attachments.length > 0 || queued.length > 0;
  const waiting = queued.filter((it) => it.status === "pending").length;

  function openPicker() {
    inputRef.current?.click();
  }

  function resetInputs() {
    if (inputRef.current) inputRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const allowed = files.filter((file) => isAllowedFile(file, allowPdf));
    resetInputs();
    if (allowed.length === 0) {
      setLocalError(allowPdf ? t("invalidTypeWithPdf") : t("invalidType"));
      return;
    }

    // Phone photos are downscaled first; the size limit applies afterwards.
    const prepared = await Promise.all(allowed.map(shrinkImageForUpload));
    if (prepared.some(exceedsUploadLimit)) {
      setLocalError(t("tooLarge"));
      return;
    }

    setLocalError(null);
    queue.add(prepared);
  }

  function onDragEnter(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
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
    // biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop target; keyboard users use the file picker button inside
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "relative rounded-2xl transition-colors",
        dragActive && "bg-brand/8",
      )}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple
        className="sr-only"
        aria-label={t("dropTitle")}
        onChange={(event) => void handleFiles(event.target.files ?? [])}
      />
      {camera ? (
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => void handleFiles(event.target.files ?? [])}
        />
      ) : null}

      {hasPhotos && documentMode ? (
        <div className="space-y-2">
          {queued.map((item) => (
            <QueuedDocumentRow
              key={item.id}
              item={item}
              kindOptions={kindOptions}
              onKindChange={(kind) => queue.setKind(item.id, kind)}
              onRemove={() => queue.remove(item.id)}
              onRetry={() => queue.retry(item.id)}
            />
          ))}
          {attachments.map((item) => (
            <DocumentRow
              key={item.id}
              item={item}
              kindOptions={onKindChange ? kindOptions : undefined}
              onKindChange={
                onKindChange ? (kind) => onKindChange(item.id, kind) : undefined
              }
              onPreview={() => setPreview(item)}
              onDelete={() => setDeleteTarget(item)}
            />
          ))}
          <button
            type="button"
            onClick={openPicker}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-dashed border-line-strong text-sm font-medium text-brand transition-colors hover:border-brand hover:bg-brand-tint"
          >
            <Icon name="add" size={18} />
            {t("addDocument")}
          </button>
        </div>
      ) : hasPhotos ? (
        <div className="grid grid-cols-2 gap-2.5">
          <AddTile onClick={openPicker} compact allowPdf={allowPdf} />
          {queued.map((item) => (
            <QueuedPhoto
              key={item.id}
              item={item}
              kindOptions={kindOptions}
              onKindChange={(kind) => queue.setKind(item.id, kind)}
              onRemove={() => queue.remove(item.id)}
              onRetry={() => queue.retry(item.id)}
            />
          ))}
          {attachments.map((item) => (
            <PhotoTile
              key={item.id}
              kindOptions={onKindChange ? kindOptions : undefined}
              onKindChange={
                onKindChange ? (kind) => onKindChange(item.id, kind) : undefined
              }
              item={item}
              onPreview={() => setPreview(item)}
              onDelete={() => setDeleteTarget(item)}
            />
          ))}
        </div>
      ) : (
        <AddTile
          onClick={openPicker}
          allowPdf={allowPdf}
          documentMode={documentMode}
        />
      )}

      {camera ? (
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-panel text-sm font-medium text-fg transition-colors hover:bg-hover sm:hidden"
        >
          <Icon name="photo_camera" size={18} />
          {t("takePhoto")}
        </button>
      ) : null}

      {queue.deferred && waiting > 0 ? (
        <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-fg-muted">
          <Icon name="schedule" size={14} className="mt-px shrink-0" />
          {t("deferredHint", { count: waiting })}
        </p>
      ) : null}

      {dragActive ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-brand bg-subtle/88 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-1 text-brand">
            <Icon name="download" size={28} />
            <p className="text-sm font-semibold">{t("dropActive")}</p>
          </div>
        </div>
      ) : null}

      {displayError ? (
        <p className="mt-3 text-xs text-danger">{displayError}</p>
      ) : null}

      <Dialog
        open={preview !== null}
        onOpenChange={(open) => !open && setPreview(null)}
      >
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl [&>button]:bg-white/90 [&>button]:text-fg-2 [&>button]:hover:bg-white">
          {preview ? (
            <>
              <div
                className={cn(
                  "relative bg-ink",
                  isPdfAttachment(preview) ? "h-[70dvh]" : "aspect-[4/3]",
                )}
              >
                {isPdfAttachment(preview) ? (
                  // The PDF itself, readable in place (signed, short-lived link).
                  // Browsers that can't show PDFs inline (some Android phones)
                  // render the fallback inside <object> instead.
                  <object
                    data={preview.url}
                    type="application/pdf"
                    aria-label={attachmentDisplayName(preview.url)}
                    className="size-full bg-white"
                  >
                    <div className="flex size-full flex-col items-center justify-center gap-3 bg-subtle px-6 text-center">
                      <Icon
                        name="picture_as_pdf"
                        size={44}
                        className="text-brand"
                      />
                      <p className="text-sm text-fg-2">{t("pdfNoInline")}</p>
                      <a
                        href={preview.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-btn-primary inline-flex h-10 items-center gap-1.5 rounded-md px-4 text-sm font-medium"
                      >
                        <Icon name="open_in_new" size={16} />
                        {t("openNewTab")}
                      </a>
                    </div>
                  </object>
                ) : isVideoAttachment(preview) ? (
                  // biome-ignore lint/a11y/useMediaCaption: tenant-recorded room footage; no captions exist
                  <video
                    key={preview.url}
                    src={preview.url}
                    controls
                    playsInline
                    className="size-full object-contain"
                  />
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
                  <DialogTitle className="truncate text-sm font-semibold text-fg">
                    {attachmentDisplayName(preview.url)}
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 text-xs text-fg-muted">
                    {[
                      preview.kindLabel,
                      preview.createdAt ? formatDate(preview.createdAt) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || t("view")}
                  </DialogDescription>
                </div>
                <div className="flex shrink-0 gap-2">
                  <a
                    href={preview.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-xs font-semibold text-fg-2 transition-colors hover:bg-hover"
                  >
                    <Icon name="open_in_new" size={16} />
                    {t("openNewTab")}
                  </a>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(preview)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-danger/20 bg-danger/8 px-3 text-xs font-semibold text-danger transition-colors hover:bg-danger/14"
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
        itemName={deleteTarget ? attachmentDisplayName(deleteTarget.url) : ""}
        onConfirm={confirmDelete}
        pending={deletePending}
      />
    </div>
  );
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

function AddTile({
  onClick,
  compact = false,
  disabled = false,
  allowPdf = false,
  documentMode = false,
}: {
  onClick: () => void;
  compact?: boolean;
  disabled?: boolean;
  allowPdf?: boolean;
  documentMode?: boolean;
}) {
  const t = useTranslations("admin.attachments");

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line-strong bg-subtle text-brand transition-all hover:border-brand hover:bg-brand-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-60",
        compact ? "aspect-[4/3] px-3 py-4" : "min-h-[13.5rem] px-5 py-8",
      )}
    >
      <span
        className={cn(
          "mb-2 flex items-center justify-center rounded-full bg-brand/10 text-brand transition-transform group-hover:scale-105",
          compact ? "size-10" : "mb-3 size-12",
        )}
      >
        <Icon
          name={documentMode ? "upload_file" : "add_photo_alternate"}
          size={compact ? 20 : 24}
        />
      </span>
      <span className={cn("font-semibold", compact ? "text-xs" : "text-sm")}>
        {compact
          ? t("addMore")
          : documentMode
            ? t("dropTitleDocument")
            : t("dropTitle")}
      </span>
      <span
        className={cn(
          "mt-0.5 text-fg-muted",
          compact
            ? "text-xs leading-tight"
            : "mt-1 max-w-[16rem] text-xs leading-relaxed",
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
  item,
  kindOptions,
  onKindChange,
  onRemove,
  onRetry,
}: {
  item: QueuedFile;
  kindOptions?: AttachmentKindOption[];
  onKindChange: (kind: string) => void;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const t = useTranslations("admin.attachments");
  const uploading = item.status === "uploading";
  const failed = item.status === "failed";
  const needsKind = !!kindOptions && !item.kind;

  return (
    <div
      className={cn(
        "relative aspect-[4/3] overflow-hidden rounded-2xl bg-hover ring-2 ring-offset-2 ring-offset-transparent",
        failed ? "ring-danger" : "ring-brand/60",
      )}
    >
      {item.isPdf ? (
        <div className="flex size-full flex-col items-center justify-center gap-1 bg-brand-soft/60 text-brand">
          <Icon name="description" size={28} />
          <span className="max-w-[90%] truncate px-2 text-xs font-medium">
            {item.file.name}
          </span>
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={item.previewUrl}
          alt={item.file.name}
          className="size-full object-cover"
        />
      )}

      {!uploading ? (
        <span
          className={cn(
            "absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold text-white",
            failed ? "bg-danger" : needsKind ? "bg-ink" : "bg-brand",
          )}
        >
          {failed
            ? t("failedBadge")
            : needsKind
              ? t("chooseKindBadge")
              : t("pendingBadge")}
        </span>
      ) : null}

      {uploading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-ink/45 text-white">
          <span className="size-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <span className="text-xs font-semibold">{t("uploading")}</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-full bg-white/92 text-fg-2 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-danger"
          aria-label={t("removeFromQueue")}
          title={t("removeFromQueue")}
        >
          <Icon name="close" size={16} />
        </button>
      )}

      {failed ? (
        <div className="absolute inset-x-2 bottom-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={onRetry}
            title={item.error || t("failedBadge")}
            className="inline-flex h-7 items-center gap-1 rounded-full bg-white px-2.5 text-xs font-semibold text-danger shadow-sm hover:bg-danger-soft"
          >
            <Icon name="refresh" size={14} />
            {t("retry")}
          </button>
        </div>
      ) : kindOptions && !uploading ? (
        <KindPicker
          options={kindOptions}
          value={item.kind}
          onChange={onKindChange}
        />
      ) : null}
    </div>
  );
}

function PhotoTile({
  item,
  onPreview,
  onDelete,
  kindOptions,
  onKindChange,
}: {
  item: AdminAttachmentItem;
  onPreview: () => void;
  onDelete: () => void;
  kindOptions?: AttachmentKindOption[];
  onKindChange?: (kind: string) => Promise<void>;
}) {
  const t = useTranslations("admin.attachments");
  const name = attachmentDisplayName(item.url);
  const pdf = isPdfAttachment(item);
  const video = !pdf && isVideoAttachment(item);

  return (
    <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-hover shadow-sm">
      <button
        type="button"
        onClick={onPreview}
        className="size-full"
        aria-label={t("view")}
      >
        {pdf ? (
          <div className="flex size-full flex-col items-center justify-center gap-1 bg-brand-soft/50 text-brand transition-transform duration-300 group-hover:scale-[1.04]">
            <Icon name="description" size={28} />
            <span className="max-w-[90%] truncate px-2 text-xs font-medium">
              {name}
            </span>
          </div>
        ) : video ? (
          <span className="relative block size-full">
            <video
              src={`${item.url}#t=0.1`}
              preload="metadata"
              muted
              playsInline
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-white drop-shadow">
              <Icon name="play_circle" size={36} />
            </span>
          </span>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.url}
            alt={name}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        )}
      </button>
      {item.kindLabel && kindOptions && onKindChange ? (
        <KindMenu
          label={item.kindLabel}
          value={item.kind}
          options={kindOptions}
          onChange={onKindChange}
        />
      ) : item.kindLabel ? (
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-ink/70 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
          {item.kindLabel}
        </span>
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" />
      <div className="absolute right-2 top-2 flex gap-1.5">
        <button
          type="button"
          onClick={onPreview}
          className="pointer-events-auto flex size-9 items-center justify-center rounded-full bg-white/92 text-fg-2 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
          aria-label={t("view")}
        >
          <Icon name="zoom_in" size={16} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="pointer-events-auto flex size-9 items-center justify-center rounded-full bg-white/92 text-danger shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
          aria-label={t("remove")}
        >
          <Icon name="delete" size={16} />
        </button>
      </div>
    </div>
  );
}

/**
 * Document type choice on a waiting file: one button per type until chosen,
 * then a chip showing the choice that reopens the options.
 */
function KindPicker({
  options,
  value,
  onChange,
}: {
  options: AttachmentKindOption[];
  value?: string;
  onChange: (kind: string) => void;
}) {
  const t = useTranslations("admin.attachments");
  const name = useId();
  const [editing, setEditing] = useState(false);
  const chosen = options.find((option) => option.value === value);

  if (chosen && !editing) {
    return (
      <button
        type="button"
        title={t("changeKind")}
        onClick={() => setEditing(true)}
        className="absolute bottom-2 left-2 inline-flex max-w-[calc(100%-1rem)] items-center gap-0.5 rounded-full bg-white/95 py-1 pl-2.5 pr-1.5 text-xs font-semibold text-brand shadow-sm backdrop-blur-sm hover:bg-white"
      >
        <span className="truncate">{chosen.label}</span>
        <Icon name="expand_more" size={14} />
      </button>
    );
  }

  return (
    <fieldset
      // min-w-0: fieldsets don't shrink by default and would widen the tile.
      className="absolute inset-x-1.5 bottom-1.5 flex min-w-0 flex-wrap gap-1 rounded-xl bg-white/95 p-1 shadow-sm ring-2 ring-brand/50 backdrop-blur-sm"
    >
      <legend className="sr-only">{t("whatIsThis")}</legend>
      {options.map((option) => {
        const checked = value === option.value;
        return (
          <label
            key={option.value}
            className={cn(
              "flex h-6 min-w-0 flex-auto cursor-pointer items-center justify-center rounded-md px-1.5 text-[10.5px] font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40",
              checked
                ? "bg-brand text-white"
                : "bg-hover text-fg-2 hover:bg-brand-soft hover:text-brand",
            )}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={checked}
              onChange={() => {
                setEditing(false);
                onChange(option.value);
              }}
            />
            <span className="truncate">{option.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}

/** Type chip on an uploaded file; opens a small menu to correct it. */
function KindMenu({
  label,
  value,
  options,
  onChange,
  inline = false,
}: {
  label: string;
  value?: string;
  options: AttachmentKindOption[];
  onChange: (kind: string) => Promise<void>;
  /** In a row (document list) rather than over a photo tile. */
  inline?: boolean;
}) {
  const t = useTranslations("admin.attachments");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function choose(kind: string) {
    setOpen(false);
    if (kind === value) return;
    setSaving(true);
    try {
      await onChange(kind);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={saving}
          title={t("changeKind")}
          className={cn(
            "inline-flex items-center gap-0.5 text-xs font-semibold transition-colors disabled:opacity-60",
            inline
              ? "rounded-md text-brand hover:underline"
              : "absolute bottom-2 left-2 z-10 rounded-full bg-ink/75 py-0.5 pl-2 pr-1 text-white backdrop-blur-sm hover:bg-ink",
          )}
        >
          {saving ? t("saving") : label}
          <Icon name="expand_more" size={14} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        sideOffset={6}
        className="w-auto min-w-40 rounded-xl border-line p-1"
      >
        <p className="px-2.5 pb-1 pt-1.5 text-xs font-semibold text-fg-muted">
          {t("changeKind")}
        </p>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => void choose(option.value)}
            className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-fg hover:bg-hover"
          >
            {option.label}
            {option.value === value ? (
              <Icon name="check" size={14} className="text-brand" />
            ) : null}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/** Small square preview: the photo itself, or a PDF/video icon. */
function DocumentThumb({
  src,
  pdf,
  video,
  alt,
}: {
  src?: string;
  pdf: boolean;
  video?: boolean;
  alt: string;
}) {
  if (pdf) {
    return (
      <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-md bg-brand-soft text-brand">
        <Icon name="picture_as_pdf" size={24} />
      </span>
    );
  }
  if (video) {
    return (
      <span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-ink text-white">
        <Icon name="play_circle" size={26} />
      </span>
    );
  }
  return (
    // biome-ignore lint/performance/noImgElement: signed private file URL
    <img
      src={src}
      alt={alt}
      className="size-14 shrink-0 rounded-md bg-hover object-cover"
    />
  );
}

/** Type choice as a full-width row of buttons that wraps instead of clipping. */
function KindChoice({
  options,
  value,
  onChange,
}: {
  options: AttachmentKindOption[];
  value?: string;
  onChange: (kind: string) => void;
}) {
  const t = useTranslations("admin.attachments");
  const name = useId();
  return (
    <fieldset className="mt-2.5 min-w-0">
      <legend className="mb-1.5 text-xs font-medium text-fg-2">
        {t("whatIsThis")}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                "inline-flex h-8 cursor-pointer items-center rounded-md border px-2.5 text-xs font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40",
                checked
                  ? "border-brand bg-brand text-white"
                  : "border-line-strong bg-white text-fg-2 hover:border-brand hover:text-brand",
              )}
            >
              <input
                type="radio"
                name={name}
                className="sr-only"
                checked={checked}
                onChange={() => onChange(option.value)}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** A file picked but not uploaded yet: name, preview, type choice, status. */
function QueuedDocumentRow({
  item,
  kindOptions,
  onKindChange,
  onRemove,
  onRetry,
}: {
  item: QueuedFile;
  kindOptions?: AttachmentKindOption[];
  onKindChange: (kind: string) => void;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const t = useTranslations("admin.attachments");
  const uploading = item.status === "uploading";
  const failed = item.status === "failed";
  const needsKind = !!kindOptions && !item.kind;

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        failed
          ? "border-danger/40 bg-danger-soft"
          : needsKind
            ? "border-brand-line bg-brand-tint"
            : "border-line bg-white",
      )}
    >
      <div className="flex items-center gap-3">
        <DocumentThumb
          src={item.previewUrl}
          pdf={item.isPdf}
          alt={item.file.name}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-fg">
            {item.file.name}
          </p>
          <p
            className={cn(
              "text-xs",
              failed
                ? "text-danger"
                : needsKind
                  ? "text-brand"
                  : "text-fg-muted",
            )}
          >
            {uploading
              ? t("uploading")
              : failed
                ? item.error || t("failedBadge")
                : needsKind
                  ? t("chooseKindBadge")
                  : t("pendingBadge")}
          </p>
        </div>
        {uploading ? (
          <span className="size-5 shrink-0 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
        ) : failed ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-md border border-danger/40 bg-white px-3 text-xs font-medium text-danger hover:bg-danger-soft"
          >
            <Icon name="refresh" size={14} />
            {t("retry")}
          </button>
        ) : (
          <button
            type="button"
            onClick={onRemove}
            className="flex size-9 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-hover hover:text-danger"
            aria-label={t("removeFromQueue")}
            title={t("removeFromQueue")}
          >
            <Icon name="close" size={18} />
          </button>
        )}
      </div>
      {kindOptions && !uploading ? (
        <KindChoice
          options={kindOptions}
          value={item.kind}
          onChange={onKindChange}
        />
      ) : null}
    </div>
  );
}

/** An uploaded document: open it, see its type and date, change type, remove. */
function DocumentRow({
  item,
  onPreview,
  onDelete,
  kindOptions,
  onKindChange,
}: {
  item: AdminAttachmentItem;
  onPreview: () => void;
  onDelete: () => void;
  kindOptions?: AttachmentKindOption[];
  onKindChange?: (kind: string) => Promise<void>;
}) {
  const t = useTranslations("admin.attachments");
  const name = attachmentDisplayName(item.url);
  const pdf = isPdfAttachment(item);
  const video = !pdf && isVideoAttachment(item);

  return (
    <div className="flex gap-3 rounded-lg border border-line bg-white p-3">
      <button
        type="button"
        onClick={onPreview}
        className="shrink-0 self-start rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        aria-label={t("viewNamed", { name })}
      >
        <DocumentThumb src={item.url} pdf={pdf} video={video} alt={name} />
      </button>
      {/* Text first, actions underneath: the column can be narrow. */}
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onPreview}
          className="line-clamp-2 break-all text-left text-sm font-medium text-fg hover:text-brand"
        >
          {name}
        </button>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-fg-muted">
          {item.kindLabel && kindOptions && onKindChange ? (
            <KindMenu
              label={item.kindLabel}
              value={item.kind}
              options={kindOptions}
              onChange={onKindChange}
              inline
            />
          ) : item.kindLabel ? (
            <span className="font-medium text-brand">{item.kindLabel}</span>
          ) : null}
          {item.createdAt ? <span>{formatDate(item.createdAt)}</span> : null}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={onPreview}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-line-strong px-2.5 text-xs font-medium text-fg hover:bg-hover"
          >
            <Icon name="visibility" size={15} />
            {t("view")}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-medium text-fg-muted hover:bg-danger-soft hover:text-danger"
            aria-label={t("removeNamed", { name })}
          >
            <Icon name="delete" size={15} />
            {t("remove")}
          </button>
        </div>
      </div>
    </div>
  );
}
