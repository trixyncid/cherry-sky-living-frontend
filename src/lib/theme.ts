/**
 * Cherry Sky Living design tokens — plum-navy (structure), cherry (intent),
 * white (surfaces). CSS source of truth: --adm-* tokens in app/globals.css.
 */

export const colors = {
  primary: "#b3263e",
  primaryContainer: "#962033",
  onPrimary: "#ffffff",
  onPrimaryContainer: "#fbe9ec",
  inversePrimary: "#f6c9d0",

  secondary: "#5f5e5e",
  secondaryContainer: "#e2dfde",
  onSecondaryContainer: "#636262",

  tertiary: "#415167",
  tertiaryContainer: "#596980",
  onTertiaryContainer: "#dbe9ff",

  surface: "#ffffff",
  surfaceContainer: "#f1eff4",
  surfaceContainerHighest: "#e7e4ec",
  onSurface: "#1b1526",
  onSurfaceVariant: "#463d52",
  inverseSurface: "#161026",
  inverseOnSurface: "#f4f1f6",
  outline: "#6e657a",
  outlineVariant: "#d6d1de",

  background: "#ffffff",
  onBackground: "#1b1526",
  card: "#ffffff",

  error: "#b42318",
  errorContainer: "#ffdad6",
  onErrorContainer: "#93000a",

  whatsapp: "#25D366",
  gold: "#d4af37",

  status: {
    vacant: "#059669",
    occupied: "#ba1a1a",
    unpaid: "#dc2626",
    paid: "#047857",
    waitingForReview: "#d97706",
  },
} as const;

export const spacing = {
  base: 8,
  xs: 4,
  sm: 12,
  md: 24,
  lg: 40,
  xl: 64,
  gutter: 24,
  margin: 32,
  mobileNavbar: "56px",
  bottomNav: "64px",
  safeAreaTop: "env(safe-area-inset-top)",
  safeAreaBottom: "env(safe-area-inset-bottom)",
  mobileContentPadding: "5rem",
} as const;

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  navbar: 100,
  sidebar: 110,
  bottomNav: 90,
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
  contentMax: "1440px",
} as const;

export const typography = {
  fontFamily: {
    display: ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "sans-serif"],
    body: ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "sans-serif"],
  },
  fontSize: {
    h1: "2.25rem",
    h2: "1.5rem",
    h3: "1.25rem",
    bodyLg: "1.125rem",
    bodyMd: "1rem",
    labelSm: "0.875rem",
    caption: "0.75rem",
  },
} as const;

export const borderRadius = {
  sm: "0.25rem",
  DEFAULT: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.5rem",
  full: "9999px",
} as const;

export const shadows = {
  card: "0 4px 20px rgb(22 16 38 / 5%)",
  cardHover: "0 10px 30px rgb(22 16 38 / 10%)",
  modal: "0 16px 48px rgb(22 16 38 / 14%)",
} as const;

export const animation = {
  duration: {
    fast: "150ms",
    normal: "300ms",
    slow: "500ms",
  },
  timing: {
    ease: "ease",
    easeIn: "ease-in",
    easeOut: "ease-out",
    easeInOut: "ease-in-out",
  },
} as const;

export type Theme = typeof colors & typeof spacing & typeof zIndex;
