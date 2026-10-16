---
name: Cherry Sky Living Identity
colors:
  surface: '#faf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#faf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f1'
  surface-container: '#efeeeb'
  surface-container-high: '#e9e8e5'
  surface-container-highest: '#e3e2e0'
  on-surface: '#1a1c1a'
  on-surface-variant: '#51443c'
  inverse-surface: '#2f312f'
  inverse-on-surface: '#f2f1ee'
  outline: '#83746b'
  outline-variant: '#d5c3b8'
  surface-tint: '#8a1a12'
  primary: '#71130d'
  on-primary: '#ffffff'
  primary-container: '#8a1a12'
  on-primary-container: '#ffe3d1'
  inverse-primary: '#f4bb92'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#415167'
  on-tertiary: '#ffffff'
  tertiary-container: '#596980'
  on-tertiary-container: '#dbe9ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc5'
  primary-fixed-dim: '#f4bb92'
  on-primary-fixed: '#301400'
  on-primary-fixed-variant: '#653d1e'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#faf9f6'
  on-background: '#1a1c1a'
  surface-variant: '#e3e2e0'
typography:
  h1:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
  h2:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  h3:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin: 32px
---

## Brand & Style

The design system is anchored in a **Corporate Modern** aesthetic with a distinctive "Boutique Hospitality" influence. It targets property owners and managers who value efficiency but demand a premium, high-fidelity experience that reflects the quality of their real estate assets. 

The visual language communicates reliability and warmth. By blending the organic tone of the logo's warm browns with a rigorous, professional slate and off-white infrastructure, the UI avoids the sterile "SaaS" look in favor of something more sophisticated and tactile. The interface should feel spacious, calm, and highly organized, evoking the feeling of a well-managed physical property.

## Colors

> **Updated 2026-10-16 — palette follows the logo.** The brand colour is the logo's cherry red **`#71130d`** (hover `#8a1a12`, pressed `#5c0f0a`). It is used for primary buttons, active navigation, arrow badges and label dots. Dark sections (hero, page heroes, how it works, footer) use deep wine **`#1c0b0a`** with a cherry-tinted photo grade. Tints: blush `#e8bfb9` / `#f3dedb`; light canvas `#f7f3f2`. Body text stays near-black `#141414`; status colours (green available, red full, amber awaiting) are unchanged. The older brown/rust references below are historical.


The palette is driven by the logo’s core DNA. The **Primary Brown** is used for high-impact touchpoints—active states, primary buttons, and key brand elements—providing a sense of stability and earthiness. **Secondary Black** provides strong contrast for headers and primary navigation, ensuring the UI feels grounded.

The background utilizes a clean **Off-White** to reduce eye strain, while **Slate Gray** is reserved for secondary text and borders. Status indicators follow a standard but refined semantic pattern:
- **Vacant/Paid:** Emeral and Forest greens suggest "Go" and "Clear."
- **Occupied:** A calm blue indicates active status.
- **Unpaid:** A sharp red for immediate attention.

## Typography

This design system utilizes **Plus Jakarta Sans** for all levels of the hierarchy. This typeface was chosen for its modern, geometric construction and its friendly, open apertures which maintain high legibility in data-dense dashboard environments.

Headlines should use a tighter line height and heavier weights to establish clear section breaks. Body text leverages a generous 1.6 line height to ensure property descriptions and lease details are easily digestible. Labels and status chips utilize a slightly increased letter spacing and semi-bold weight to ensure visibility even at smaller scales.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for the main content container (max-width 1440px) to maintain a premium, editorial feel, while the sidebar remains fixed to the viewport. An 8px baseline rhythm is applied across the entire system.

- **Grid:** A 12-column system with 24px gutters.
- **Margins:** 32px outer margins ensure content has room to breathe on desktop views.
- **Density:** High density is used within data tables, while "Room" or "Property" cards utilize generous padding (md-lg) to emphasize the high-fidelity nature of the property photos and details.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layers**. Instead of harsh borders, surfaces are separated by subtle shifts in elevation.

- **Base Layer:** Off-white background.
- **Surface Layer (Cards/Containers):** Pure white with a very soft, diffused shadow (Blur: 20px, Opacity: 4%, Color: Secondary Black).
- **Interactive Layer (Hover states):** An increased shadow spread and a slight 2px lift transition.
- **Overlay Layer (Modals/Popovers):** A more pronounced shadow with a subtle tint of the primary brown in the shadow color to maintain brand warmth.

## Shapes

The shape language is consistently **Rounded**, reflecting the welcoming nature of the hospitality industry. Standard UI elements like input fields and small buttons use a 12px radius, while larger containers like property cards and dashboard modules utilize a 16px radius. This softening of the corners balances the professional slate tones, making the dashboard feel accessible and premium rather than purely utilitarian.

## Components

### Buttons & Inputs
Primary buttons use the Primary Brown with white text. Hover states should darken the brown slightly. Inputs use the 12px radius with a Slate Gray border that thickens and changes to Brown on focus.

### Status Chips
Chips are used for "Vacant," "Occupied," "Paid," and "Unpaid." These feature a low-opacity background of the status color with high-contrast text of the same hue (e.g., light green background with dark green text) for maximum accessibility and a modern look.

### Property Cards
Cards are the cornerstone of the system. They feature a top-heavy image area, 16px rounded corners, and a white background. Information is grouped using the typography hierarchy defined in Section 3, with status chips positioned in the top-right corner of the image.

### Navigation Sidebar
The sidebar uses a dark theme (Secondary Black) to contrast with the light content area. Active nav items are indicated by a Primary Brown vertical pill on the leading edge and a shift in text color to white.

### Data Tables
Tables should avoid vertical borders. Horizontal dividers should be 1px Slate Gray at 10% opacity. Headers must be in `label-sm` style for clear categorization.