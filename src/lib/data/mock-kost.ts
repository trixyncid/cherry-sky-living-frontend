/**
 * Mock Data for Cherry Sky Living Platform
 * Contains realistic data for SKYKOST and CHERRY KOST properties
 */

import type { Kost, Facility } from '../types';

/**
 * Common Facilities
 */
export const commonFacilities: Facility[] = [
    {
        id: 'cctv',
        name: 'CCTV',
        icon: 'video_camera_front',
        category: 'security',
        isPremium: false,
    },
    {
        id: 'wifi',
        name: 'Wi-Fi',
        icon: 'wifi',
        category: 'building',
        isPremium: false,
    },
    {
        id: 'security',
        name: 'Security',
        icon: 'shield',
        category: 'security',
        isPremium: false,
    },
    {
        id: 'kitchen',
        name: 'Dapur Umum',
        nameEn: 'Shared Kitchen',
        icon: 'kitchen',
        category: 'building',
        isPremium: false,
    },
    {
        id: 'water',
        name: 'Air Gratis',
        nameEn: 'Free Water',
        icon: 'water_drop',
        category: 'service',
        isPremium: true,
    },
    {
        id: 'parking',
        name: 'Parkir Motor',
        nameEn: 'Motorcycle Parking',
        icon: 'two_wheeler',
        category: 'building',
        isPremium: false,
    },
    {
        id: 'tv',
        name: 'TV',
        icon: 'tv',
        category: 'room',
        isPremium: false,
    },
    {
        id: 'ac',
        name: 'AC',
        icon: 'ac_unit',
        category: 'room',
        isPremium: false,
    },
    {
        id: 'wardrobe',
        name: 'Lemari Baju',
        nameEn: 'Wardrobe',
        icon: 'checkroom',
        category: 'room',
        isPremium: false,
    },
    {
        id: 'desk',
        name: 'Meja Serbaguna',
        nameEn: 'Desk',
        icon: 'desk',
        category: 'room',
        isPremium: false,
    },
    {
        id: 'bed',
        name: 'Spring Bed',
        icon: 'bed',
        category: 'room',
        isPremium: false,
    },
    {
        id: 'heater',
        name: 'Water Heater',
        icon: 'hot_tub',
        category: 'room',
        isPremium: true,
    },
];

/**
 * SKYKOST Property Data
 */
export const skyKost: Kost = {
    id: 'skykost-gaharu',
    name: 'SKYKOST',
    slug: 'skykost-gaharu',
    type: 'campur',
    description: 'Kost nyaman dengan fasilitas lengkap dan internet super cepat di kawasan Gaharu',
    location: {
        address: 'Jl. Gaharu Gg. Amat Lama No. 12',
        city: 'Medan',
        district: 'Medan Area',
        nearbyLandmark: 'Dekat Kampus',
    },
    priceRange: {
        min: 1_200_000,
        max: 1_800_000,
    },
    images: [
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop', // Modern bedroom
        'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800&h=600&fit=crop', // Minimalist room
        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&h=600&fit=crop', // Cozy bedroom
        'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&h=600&fit=crop', // Student room
    ],
    thumbnail: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop',
    roomTypes: [
        {
            id: 'sky-ac-dalam',
            name: 'Sky Room AC (Kamar Mandi Dalam)',
            price: 1_800_000,
            bathroomType: 'dalam',
            capacity: '1-2 orang',
            availableCount: 2,
            totalCount: 5,
            status: 'available',
            waitlistEnabled: false,
            images: [
                'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop',
            ],
        },
        {
            id: 'sky-ac-luar',
            name: 'Sky Room AC (Kamar Mandi Luar)',
            price: 1_500_000,
            bathroomType: 'luar',
            capacity: '1-2 orang',
            availableCount: 4,
            totalCount: 8,
            status: 'available',
            waitlistEnabled: false,
            images: [
                'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800&h=600&fit=crop',
            ],
        },
        {
            id: 'standard-kipas',
            name: 'Standard Room Kipas (Kamar Mandi Dalam)',
            price: 1_200_000,
            bathroomType: 'dalam',
            capacity: '1-2 orang',
            availableCount: 1,
            totalCount: 6,
            status: 'available',
            waitlistEnabled: false,
            images: [
                'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&h=600&fit=crop',
            ],
        },
    ],
    facilities: [
        commonFacilities.find((f) => f.id === 'cctv')!,
        commonFacilities.find((f) => f.id === 'kitchen')!,
        {
            ...commonFacilities.find((f) => f.id === 'wifi')!,
            detail: '200 Mbps',
            isHighlight: true,
            isPremium: true,
        },
        commonFacilities.find((f) => f.id === 'security')!,
        commonFacilities.find((f) => f.id === 'water')!,
        commonFacilities.find((f) => f.id === 'parking')!,
        commonFacilities.find((f) => f.id === 'tv')!,
        commonFacilities.find((f) => f.id === 'ac')!,
        commonFacilities.find((f) => f.id === 'wardrobe')!,
        commonFacilities.find((f) => f.id === 'desk')!,
        commonFacilities.find((f) => f.id === 'bed')!,
        commonFacilities.find((f) => f.id === 'heater')!,
    ],
    highlights: [
        'Wi-Fi Super Cepat 200 Mbps',
        'Lokasi Strategis',
        'Air Gratis',
    ],
    totalRooms: 19,
    availableRooms: 7,
    rating: 4.5,
    reviewCount: 28,
    isFeatured: true,
    whatsappNumber: '081269175252',
    phone: '061-12345678',
    rules: [
        'Jam berkunjung: 08.00 - 21.00',
        'Dilarang membawa hewan peliharaan',
        'Tidak boleh memasak di kamar',
    ],
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-02-01'),
};

/**
 * CHERRY KOST Property Data
 */
export const cherryKost: Kost = {
    id: 'cherrykost-pembangunan',
    name: 'CHERRY KOST',
    slug: 'cherry-kost-pembangunan',
    type: 'campur',
    description: 'Kost premium dengan fasilitas laundry gratis dan dekat UMSU',
    location: {
        address: 'Jln. Pembangunan 3 No. 21',
        city: 'Medan',
        district: 'Medan Area',
        nearbyLandmark: 'Dekat UMSU',
    },
    priceRange: {
        min: 2_200_000,
        max: 2_700_000,
    },
    images: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', // Luxury bedroom
        'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&h=600&fit=crop', // Modern interior
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop', // Elegant room
        'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800&h=600&fit=crop', // Premium space
    ],
    thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
    roomTypes: [
        {
            id: 'cherry-type1',
            name: 'Tipe 1',
            price: 2_200_000,
            bathroomType: 'dalam',
            capacity: '1-2 orang',
            size: 20,
            availableCount: 3,
            totalCount: 10,
            status: 'available',
            waitlistEnabled: false,
            images: [
                'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
            ],
            description: 'Kamar standar dengan lemari 2 pintu',
        },
        {
            id: 'cherry-type2',
            name: 'Tipe 2 (Kamar Besar)',
            price: 2_700_000,
            bathroomType: 'dalam',
            capacity: '1-2 orang',
            size: 25,
            availableCount: 1,
            totalCount: 8,
            status: 'available',
            waitlistEnabled: false,
            images: [
                'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&h=600&fit=crop',
            ],
            description: 'Kamar besar dengan lemari 3 pintu',
        },
    ],
    facilities: [
        {
            id: 'wardrobe-2',
            name: 'Lemari 2 Pintu (Tipe 1)',
            nameEn: '2-Door Wardrobe (Type 1)',
            icon: 'checkroom',
            category: 'room',
            isPremium: false,
        },
        {
            id: 'wardrobe-3',
            name: 'Lemari 3 Pintu (Tipe 2)',
            nameEn: '3-Door Wardrobe (Type 2)',
            icon: 'checkroom',
            category: 'room',
            isPremium: false,
        },
        commonFacilities.find((f) => f.id === 'desk')!,
        commonFacilities.find((f) => f.id === 'bed')!,
        {
            id: 'tv-android',
            name: 'TV Android',
            icon: 'smart_display',
            category: 'room',
            isPremium: true,
        },
        {
            id: 'toilet',
            name: 'Closet Duduk',
            nameEn: 'Sitting Toilet',
            icon: 'wc',
            category: 'room',
            isPremium: false,
        },
        commonFacilities.find((f) => f.id === 'ac')!,
        {
            id: 'fridge',
            name: 'Kulkas',
            nameEn: 'Refrigerator',
            icon: 'kitchen',
            category: 'room',
            isPremium: true,
        },
        {
            id: 'lift',
            name: 'Lift',
            nameEn: 'Elevator',
            icon: 'elevator',
            category: 'building',
            isPremium: true,
        },
        commonFacilities.find((f) => f.id === 'heater')!,
        commonFacilities.find((f) => f.id === 'wifi')!,
        commonFacilities.find((f) => f.id === 'kitchen')!,
        commonFacilities.find((f) => f.id === 'water')!,
        commonFacilities.find((f) => f.id === 'cctv')!,
        commonFacilities.find((f) => f.id === 'security')!,
        {
            id: 'basement',
            name: 'Basement Parkiran',
            nameEn: 'Basement Parking',
            icon: 'garage',
            category: 'building',
            isPremium: true,
        },
        {
            id: 'laundry',
            name: 'Laundry Gratis',
            nameEn: 'Free Laundry',
            icon: 'local_laundry_service',
            category: 'service',
            isPremium: true,
            isHighlight: true,
            detail: 'Max 10x / 7kg per bulan',
        },
    ],
    highlights: [
        'Laundry Gratis 10x/bulan',
        'Dekat UMSU',
        'Lift & Basement Parking',
        'TV Android & Kulkas',
    ],
    totalRooms: 18,
    availableRooms: 4,
    rating: 4.8,
    reviewCount: 42,
    isFeatured: true,
    whatsappNumber: '081269175252',
    phone: '061-98765432',
    rules: [
        'Jam berkunjung: 07.00 - 22.00',
        'Maksimal 2 orang per kamar',
        'Laundry gratis maksimal 10x per bulan',
    ],
    createdAt: new Date('2023-03-20'),
    updatedAt: new Date('2024-02-02'),
};

/**
 * All Kost Properties
 */
export const allKosts: Kost[] = [skyKost, cherryKost];

/**
 * Get kost by ID
 */
export function getKostById(id: string): Kost | undefined {
    return allKosts.find((kost) => kost.id === id);
}

/**
 * Get kost by slug
 */
export function getKostBySlug(slug: string): Kost | undefined {
    return allKosts.find((kost) => kost.slug === slug);
}

/**
 * Get featured kosts
 */
export function getFeaturedKosts(): Kost[] {
    return allKosts.filter((kost) => kost.isFeatured);
}
