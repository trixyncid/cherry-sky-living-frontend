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

export function attachmentDisplayName(url: string): string {
  try {
    const path = new URL(url).pathname;
    const name = path.split("/").filter(Boolean).pop();
    return name ?? url;
  } catch {
    return url;
  }
}
