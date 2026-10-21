/**
 * Core Type Definitions for Cherry Sky Living Platform
 */

export type BathroomType = "dalam" | "luar" | "bersama";
export type RoomStatus = "available" | "rented" | "reserved" | "full";
export type PropertyType = "putra" | "putri" | "campur";
export type FacilityCategory = "room" | "building" | "service" | "security";

/**
 * Pricing package for a room type (e.g. 7-day, 30-day rent)
 */
export interface RoomTypePricing {
  id: string;
  durationDays: number;
  price: number;
}

/**
 * Room Type Interface
 * Represents different room configurations within a kost property
 */
export interface RoomType {
  id: string;
  name: string;
  price: number;
  pricings?: RoomTypePricing[];
  /** Present when known; public API does not currently expose bathroom type. */
  bathroomType?: BathroomType;
  /** Occupancy range from unit maxOccupancy (e.g. "1" or "1–2"), or "—". */
  capacity: string;
  size?: number; // in square meters
  availableCount: number;
  totalCount: number;
  status: RoomStatus;
  waitlistEnabled: boolean;
  images: string[];
  description?: string;
}

/**
 * Facility Interface
 * Represents amenities and facilities available
 */
export interface Facility {
  id: string;
  name: string;
  nameEn?: string;
  icon: string; // Icon name or identifier
  category: FacilityCategory;
  isPremium: boolean;
  isHighlight?: boolean; // Featured facility (e.g., 200Mbps WiFi, Free Laundry)
  detail?: string; // Additional details (e.g., "Max 10x/month")
}

/**
 * Location Interface
 */
export interface Location {
  address: string;
  city: string;
  district?: string;
  nearbyLandmark?: string; // e.g., "Dekat UMSU"
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Kost Property Interface
 * Main property entity representing a boarding house
 */
export interface Kost {
  id: string;
  name: string;
  slug: string;
  /** Present when known; public API does not currently expose property gender/type. */
  type?: PropertyType;
  description: string;
  location: Location;
  priceRange: {
    min: number;
    max: number;
  };
  images: string[];
  thumbnail: string;
  roomTypes: RoomType[];
  facilities: Facility[];
  highlights: string[]; // Special features to emphasize
  totalRooms: number;
  availableRooms: number;
  rating?: number;
  reviewCount?: number;
  isFeatured: boolean;
  whatsappNumber: string;
  /** Refundable deposit (Rp) set by the owner; undefined when not set. */
  deposit?: number;
  phone?: string;
  rules?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Flattened unit type result for public search listings
 */
export interface SearchUnitTypeResult {
  id: string;
  propertyId: string;
  name: string;
  propertyName: string;
  address: string;
  city: string;
  images: string[];
  thumbnail: string;
  availableCount: number;
  totalCount: number;
  pricings: RoomTypePricing[];
  minPrice: number;
  whatsappNumber: string;
  /** The property's refundable deposit (Rp), when set. */
  deposit?: number;
  size?: number;
  description?: string;
}

/**
 * Search Filter State
 */
export interface SearchFilters {
  location?: string;
  city?: string;
  propertyId?: string;
  unitTypeId?: string;
  priceMin?: number;
  priceMax?: number;
  availability?: "available" | "all";
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  sortBy?: "property-asc" | "price-asc" | "price-desc" | "newest";
  page?: number;
  pageSize?: number;
}

/**
 * Component Prop Interfaces
 */
export interface KostCardProps {
  kost: Kost;
  variant?: "default" | "compact" | "featured";
  showCTA?: boolean;
  onCTAClick?: () => void;
}

export interface RoomTypeCardProps {
  roomType: RoomType;
  kostName: string;
  whatsappNumber: string;
  onBookClick?: () => void;
}

export interface FacilityListProps {
  facilities: Facility[];
  variant?: "grid" | "list" | "compact";
  showCategory?: boolean;
  highlightPremium?: boolean;
}

export interface WhatsAppButtonProps {
  phoneNumber: string;
  message?: string;
  variant?: "default" | "icon" | "compact";
  className?: string;
  label?: string;
}

/**
 * Skeleton Loading Props
 */
export interface SkeletonCardProps {
  variant?: "kost" | "room" | "facility";
  count?: number;
}
