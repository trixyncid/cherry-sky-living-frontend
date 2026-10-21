"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/features/admin/lib/errors";
import {
  type PendingUpload,
  takePendingUploads,
} from "@/features/admin/lib/pending-uploads";

export type QueuedFileStatus = "pending" | "uploading" | "failed";

export type QueuedFile = {
  id: string;
  file: File;
  previewUrl: string;
  isPdf: boolean;
  /** Document type (leases); editable until the file is uploading. */
  kind?: string;
  status: QueuedFileStatus;
  error?: string;
};

export type UploadResult = {
  succeeded: number;
  failed: number;
  firstError?: unknown;
};

type Options = {
  /** Uploads one file. null = the record doesn't exist yet (files wait). */
  upload: ((file: File, kind?: string) => Promise<unknown>) | null;
  /** Pick up files handed over from the "new" page (see pending-uploads). */
  handoffKey?: string;
  /** Initial document type for a newly added file. */
  defaultKind?: (file: File) => string | undefined;
  /**
   * Files need a document type before they upload: they wait until one is
   * picked (choosing it on an existing record uploads the file).
   */
  requireKind?: boolean;
  onSettled?: (result: UploadResult) => void;
};

export function isPdfFile(file: File) {
  if (file.type === "application/pdf" || file.type === "application/x-pdf") {
    return true;
  }
  return /\.pdf$/i.test(file.name);
}

function toQueued(entries: PendingUpload[]): QueuedFile[] {
  return entries.map(({ file, kind }) => {
    const isPdf = isPdfFile(file);
    return {
      id: crypto.randomUUID(),
      file,
      previewUrl: isPdf ? "" : URL.createObjectURL(file),
      isPdf,
      kind,
      status: "pending",
    };
  });
}

function revoke(item: QueuedFile) {
  if (!item.isPdf && item.previewUrl) URL.revokeObjectURL(item.previewUrl);
}

/**
 * Files attached to a form, before and while they upload.
 * - No record yet (`upload` null): files wait, then `takeAll()` hands them
 *   to the edit page after the record is created.
 * - Existing record: files upload as soon as they are added; failures stay
 *   in the queue with a retry.
 * - With `requireKind`, a file waits until its document type is chosen.
 */
export function useAttachmentQueue(options: Options) {
  const [items, setItems] = useState<QueuedFile[]>([]);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const canUpload = options.upload !== null;

  const run = useCallback(async (targets: QueuedFile[]) => {
    const upload = optionsRef.current.upload;
    if (!upload || targets.length === 0) return;
    const ids = new Set(targets.map((t) => t.id));
    setItems((current) =>
      current.map((it) =>
        ids.has(it.id) ? { ...it, status: "uploading", error: undefined } : it,
      ),
    );

    const results = await Promise.allSettled(
      targets.map((it) => upload(it.file, it.kind)),
    );
    const done = new Set<string>();
    const failed = new Map<string, string>();
    let firstError: unknown;
    results.forEach((result, i) => {
      const target = targets[i];
      if (!target) return;
      if (result.status === "fulfilled") done.add(target.id);
      else {
        firstError ??= result.reason;
        failed.set(target.id, getErrorMessage(result.reason, ""));
      }
    });

    setItems((current) =>
      current.flatMap((it) => {
        if (done.has(it.id)) {
          revoke(it);
          return [];
        }
        if (failed.has(it.id)) {
          return [
            { ...it, status: "failed" as const, error: failed.get(it.id) },
          ];
        }
        return [it];
      }),
    );
    optionsRef.current.onSettled?.({
      succeeded: done.size,
      failed: failed.size,
      firstError,
    });
  }, []);

  const addEntries = useCallback(
    (entries: PendingUpload[]) => {
      const added = toQueued(entries);
      if (added.length === 0) return;
      setItems((current) => [...current, ...added]);
      if (optionsRef.current.upload) {
        const ready = optionsRef.current.requireKind
          ? added.filter((it) => it.kind)
          : added;
        void run(ready);
      }
    },
    [run],
  );

  const add = useCallback(
    (files: File[]) =>
      addEntries(
        files.map((file) => ({
          file,
          kind: optionsRef.current.defaultKind?.(file),
        })),
      ),
    [addEntries],
  );

  const retry = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((it) => it.id === id);
      if (item && item.status === "failed") void run([item]);
    },
    [run],
  );

  const remove = useCallback((id: string) => {
    setItems((current) =>
      current.filter((it) => {
        if (it.id !== id || it.status === "uploading") return true;
        revoke(it);
        return false;
      }),
    );
  }, []);

  const setKind = useCallback(
    (id: string, kind: string) => {
      const item = itemsRef.current.find((it) => it.id === id);
      if (!item || item.status === "uploading") return;
      const next = { ...item, kind };
      setItems((current) => current.map((it) => (it.id === id ? next : it)));
      // Choosing the type is what releases a waiting file on an existing record.
      if (
        optionsRef.current.upload &&
        optionsRef.current.requireKind &&
        item.status === "pending"
      ) {
        void run([next]);
      }
    },
    [run],
  );

  /** Hand over every waiting file (create flow) and clear the queue. */
  const takeAll = useCallback((): PendingUpload[] => {
    const taken = itemsRef.current.map(({ file, kind }) => ({ file, kind }));
    itemsRef.current.forEach(revoke);
    setItems([]);
    return taken;
  }, []);

  // Edit page: upload files handed over from the create page.
  useEffect(() => {
    if (!canUpload || !options.handoffKey) return;
    const handed = takePendingUploads(options.handoffKey);
    if (handed.length > 0) addEntries(handed);
  }, [canUpload, options.handoffKey, addEntries]);

  useEffect(() => () => itemsRef.current.forEach(revoke), []);

  return {
    items,
    add,
    retry,
    remove,
    setKind,
    takeAll,
    /** Files wait for the record to be saved. */
    deferred: !canUpload,
    uploading: items.some((it) => it.status === "uploading"),
    /** Files still waiting for their document type. */
    needsKind: !!options.requireKind && items.some((it) => !it.kind),
    /** Anything not on the server yet (waiting, uploading or failed). */
    hasUnsent: items.length > 0,
  };
}

export type AttachmentQueue = ReturnType<typeof useAttachmentQueue>;
