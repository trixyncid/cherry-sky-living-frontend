"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminShell } from "@/features/admin/components/admin-shell-context";
import { useProperties } from "@/features/admin/hooks/use-admin-queries";
import {
  readStoredPropertyId,
  writeStoredPropertyId,
} from "@/features/admin/lib/admin-property-scope";

/**
 * Property-scoped admin context: defaults to the last-used property (or the
 * first property), with "" = explicit "All properties" inventory mode.
 * Selecting a concrete property persists it for create flows and next visit.
 */
export function useAdminPropertyScope() {
  const { properties } = useAdminShell();
  const { isFetched } = useProperties();
  const [propertyId, setPropertyIdState] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isFetched || ready) return;

    // A link like ?propertyId=… (e.g. from a property card) wins.
    const fromUrl = new URLSearchParams(window.location.search).get(
      "propertyId",
    );
    const stored = readStoredPropertyId();
    if (fromUrl && properties.some((p) => p.id === fromUrl)) {
      setPropertyIdState(fromUrl);
      writeStoredPropertyId(fromUrl);
    } else if (stored && properties.some((p) => p.id === stored)) {
      setPropertyIdState(stored);
    } else if (properties[0]) {
      setPropertyIdState(properties[0].id);
    } else {
      setPropertyIdState("");
    }
    setReady(true);
  }, [isFetched, properties, ready]);

  const setPropertyId = useCallback((id: string) => {
    setPropertyIdState(id);
    if (id) writeStoredPropertyId(id);
  }, []);

  return {
    propertyId,
    setPropertyId,
    ready,
    /** Cross-property inventory mode (explicit "All"). */
    isAll: ready && propertyId === "",
    isScoped: ready && propertyId !== "",
  };
}
