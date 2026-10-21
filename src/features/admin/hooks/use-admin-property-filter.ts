"use client";

import { useEffect } from "react";
import { useAdminShell } from "@/features/admin/components/admin-shell-context";
import { useProperties } from "@/features/admin/hooks/use-admin-queries";
import { usePropertyFilterStore } from "@/features/admin/lib/property-filter-store";

/**
 * The admin-wide property filter ("" = All properties). Defaults to All,
 * follows the user from page to page and is remembered per browser.
 * A link with ?propertyId=… (e.g. a property card) selects that property.
 */
export function useAdminPropertyFilter() {
  const { properties } = useAdminShell();
  const { isFetched } = useProperties();
  const propertyId = usePropertyFilterStore((s) => s.propertyId);
  const hydrated = usePropertyFilterStore((s) => s.hydrated);
  const hydrate = usePropertyFilterStore((s) => s.hydrate);
  const setPropertyId = usePropertyFilterStore((s) => s.setPropertyId);

  useEffect(() => {
    if (!usePropertyFilterStore.getState().hydrated) hydrate();
    const fromUrl = new URLSearchParams(window.location.search).get(
      "propertyId",
    );
    if (fromUrl) setPropertyId(fromUrl);
  }, [hydrate, setPropertyId]);

  // A saved property that no longer exists falls back to All.
  useEffect(() => {
    if (
      isFetched &&
      propertyId &&
      !properties.some((p) => p.id === propertyId)
    ) {
      setPropertyId("");
    }
  }, [isFetched, propertyId, properties, setPropertyId]);

  return {
    propertyId,
    setPropertyId,
    /** False until the saved choice has been read (first load only). */
    ready: hydrated,
  };
}
