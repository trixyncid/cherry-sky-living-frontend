import type { Property, UnitType } from "@/lib/types/admin";

export type AdminAttachmentItem = {
  id: string;
  url: string;
  createdAt?: string;
  /** Document type value (leases), for changing it after upload. */
  kind?: string;
  kindLabel?: string;
  contentType?: string | null;
};

export function isPdfAttachment(
  item: Pick<AdminAttachmentItem, "url" | "contentType">,
): boolean {
  if (item.contentType?.toLowerCase().includes("pdf")) return true;
  return /\.pdf(?:$|\?)/i.test(item.url);
}

export function isVideoAttachment(
  item: Pick<AdminAttachmentItem, "url" | "contentType">,
): boolean {
  if (item.contentType?.toLowerCase().startsWith("video/")) return true;
  return /\.(?:mp4|mov|m4v|webm|3gp)(?:$|\?)/i.test(item.url);
}

export function countPropertyAttachments(property: Property): number {
  if (property._count?.propertyAttachments != null) {
    return property._count.propertyAttachments;
  }
  return property.propertyAttachments?.length ?? 0;
}

export function countUnitTypeAttachments(unitType: UnitType): number {
  if (unitType._count?.unitTypeAttachments != null) {
    return unitType._count.unitTypeAttachments;
  }
  return unitType.unitTypeAttachments?.length ?? 0;
}

/**
 * The original file name from a storage URL. Keys look like
 * `<timestamp>-<uuid>-<name>`; the prefix keeps keys unique but means
 * nothing to people, so it's dropped.
 */
export function attachmentDisplayName(url: string): string {
  try {
    const path = new URL(url).pathname;
    const last = path.split("/").filter(Boolean).pop();
    if (!last) return url;
    const name = decodeURIComponent(last).replace(
      /^\d{10,}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i,
      "",
    );
    return name || last;
  } catch {
    return url;
  }
}
