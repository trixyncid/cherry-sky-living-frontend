import { create } from "zustand";

/** Saved admin-wide property filter. "" = All properties. */
const STORAGE_KEY = "admin.propertyFilter";

type PropertyFilterState = {
  propertyId: string;
  hydrated: boolean;
  hydrate: () => void;
  setPropertyId: (id: string) => void;
};

/**
 * One property filter shared by every admin page, kept in memory across
 * client navigation and saved per browser so it survives reloads.
 */
export const usePropertyFilterStore = create<PropertyFilterState>((set) => ({
  propertyId: "",
  hydrated: false,
  hydrate: () => {
    let stored = "";
    try {
      stored = window.localStorage.getItem(STORAGE_KEY) ?? "";
    } catch {
      // Private mode / blocked storage: fall back to All properties.
    }
    set({ propertyId: stored, hydrated: true });
  },
  setPropertyId: (id) => {
    set({ propertyId: id, hydrated: true });
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Ignore quota / private-mode failures.
    }
  },
}));
