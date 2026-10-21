/**
 * Hand-off for files picked on a "new" form: the record is created, then the
 * edit page (a different route) picks the files up and uploads them. Lives in
 * memory for the browser tab — client navigation keeps it, a reload doesn't.
 */
export type PendingUpload = { file: File; kind?: string };

const handoffs = new Map<string, PendingUpload[]>();

export function stashPendingUploads(key: string, files: PendingUpload[]) {
  if (files.length > 0) handoffs.set(key, files);
}

export function takePendingUploads(key: string): PendingUpload[] {
  const files = handoffs.get(key) ?? [];
  handoffs.delete(key);
  return files;
}
