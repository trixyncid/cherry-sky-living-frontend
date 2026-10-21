/**
 * Utility functions for formatting and data transformation
 */

/**
 * Format number to Indonesian Rupiah currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1800000) // "Rp 1.800.000"
 * formatCurrency(1500000, { compact: true }) // "Rp 1,5 jt"
 */
export function formatCurrency(
    amount: number,
    options: { compact?: boolean; showDecimals?: boolean } = {}
): string {
    const { compact = false, showDecimals = false } = options;

    if (compact) {
        if (amount >= 1_000_000) {
            const millions = amount / 1_000_000;
            return `Rp ${millions.toFixed(millions % 1 === 0 ? 0 : 1)} jt`;
        }
        if (amount >= 1_000) {
            const thousands = amount / 1_000;
            return `Rp ${thousands.toFixed(thousands % 1 === 0 ? 0 : 1)} rb`;
        }
    }

    // Standard Indonesian number formatting with dot separators
    const formatted = new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: showDecimals ? 2 : 0,
        maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(amount);

    return `Rp ${formatted}`;
}

/**
 * Format phone number for WhatsApp link
 * Removes special characters and ensures proper format
 * @param phoneNumber - Phone number (e.g., "08123456789" or "+62-812-3456-789")
 * @returns Formatted phone number for WhatsApp (e.g., "628123456789")
 */
export function formatWhatsAppNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Convert leading 0 to 62 (Indonesia country code)
    if (cleaned.startsWith('0')) {
        return '62' + cleaned.substring(1);
    }

    // If already starts with 62, return as is
    if (cleaned.startsWith('62')) {
        return cleaned;
    }

    // Otherwise, add 62 prefix
    return '62' + cleaned;
}

/**
 * Generate WhatsApp message URL
 * @param phoneNumber - WhatsApp number
 * @param message - Pre-filled message
 * @returns WhatsApp URL
 */
export function generateWhatsAppURL(
    phoneNumber: string,
    message?: string
): string {
    const formattedNumber = formatWhatsAppNumber(phoneNumber);
    const encodedMessage = message ? encodeURIComponent(message) : '';

    return `https://wa.me/${formattedNumber}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
}

/**
 * Generate WhatsApp inquiry message for a property
 * @param propertyName - Name of the kost property
 * @param roomType - Optional room type
 * @returns Pre-filled inquiry message
 */
export function generateInquiryMessage(
    propertyName: string,
    roomType?: string
): string {
    if (roomType) {
        return `Halo kak 👋 Kamar ${roomType} di ${propertyName} masih ada? Kalau mau sewa, langkah selanjutnya gimana ya? Makasih 🙏`;
    }
    return `Halo kak 👋 Saya lagi lihat-lihat ${propertyName} nih. Boleh minta info lebih lanjut? Makasih 🙏`;
}

/**
 * Generate visit scheduling message
 * @param propertyName - Name of the kost property
 * @returns Pre-filled visit scheduling message
 */
export function generateVisitMessage(propertyName: string): string {
    return `Halo kak 👋 Saya mau main ke ${propertyName} buat lihat kamar. Kira-kira kapan bisanya ya? Makasih 🙏`;
}

/**
 * Format availability count message
 * @param count - Number of available rooms
 * @param locale - Locale for translation
 * @returns Formatted availability message
 */
export function formatAvailability(
    count: number,
    locale: 'id' | 'en' = 'id'
): string {
    if (count === 0) {
        return locale === 'id' ? 'Penuh' : 'Full';
    }
    if (count === 1) {
        return locale === 'id' ? '1 kamar tersedia' : '1 room available';
    }
    return locale === 'id'
        ? `${count} kamar tersedia`
        : `${count} rooms available`;
}

/**
 * Format room capacity for display.
 * Accepts numeric ranges from the public mapper ("1", "1–2") or legacy
 * Indonesian strings ("1-2 orang") and localizes the person unit.
 */
export function formatCapacity(
    capacity: string,
    locale: 'id' | 'en' = 'id'
): string {
    if (!capacity || capacity === '—') return capacity;

    const cleaned = capacity
        .replace(/\s*orang\s*/gi, '')
        .replace(/\s*persons?\s*/gi, '')
        .trim();

    if (!cleaned) return capacity;

    const isSingular = cleaned === '1';
    if (locale === 'en') {
        return `${cleaned} ${isSingular ? 'person' : 'persons'}`;
    }
    return `${cleaned} orang`;
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

/**
 * Generate slug from text
 * @param text - Text to convert to slug
 * @returns URL-friendly slug
 */
export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Remove consecutive hyphens
}

/**
 * Calculate percentage
 * @param value - Current value
 * @param total - Total value
 * @returns Percentage (0-100)
 */
export function calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

/**
 * Get occupancy status based on available rooms
 * @param available - Number of available rooms
 * @param total - Total number of rooms
 * @returns Status indicator
 */
export function getOccupancyStatus(
    available: number,
    total: number
): 'available' | 'almost-full' | 'full' {
    if (available === 0) return 'full';
    const percentage = calculatePercentage(available, total);
    if (percentage <= 20) return 'almost-full';
    return 'available';
}
