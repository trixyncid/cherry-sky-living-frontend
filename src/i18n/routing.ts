import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: ['id', 'en'],

    // Used when no locale is in the URL (home, /admin, /tenant, …)
    defaultLocale: 'id',

    // Do not pick English from Accept-Language / NEXT_LOCALE — this product is ID-first.
    localeDetection: false,

    // Always show locale prefix to avoid routing issues
    localePrefix: 'always'
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
    createNavigation(routing);
