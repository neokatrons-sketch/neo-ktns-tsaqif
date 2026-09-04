# Neo KTNS Frontend Design System

**Product:** Premium custom embroidered polo e-commerce  
**Direction:** Editorial fashion, precision, custom craftsmanship, youthful confidence  
**Design dials:** Variance 4/10 · Motion 2/10 · Density 3/10

This file adapts UI/UX Pro Max guidance to the existing Neo KTNS brand and working customer flows. Brand and usability requirements override decorative recommendations.

## Foundations

### Palette

| Role | Light | Dark |
| --- | --- | --- |
| Background | `#F6F4EF` | `#091724` |
| Primary surface | `#FFFDF8` | `#0F2238` |
| Raised surface | `#FFFFFF` | `#142B43` |
| Foreground | `#0F2238` | `#F6F4EF` |
| Muted text | `#5D6873` | `#B8BEC4` |
| Border | `#DCD8CE` | `#2A4054` |
| Brand copper | `#B56A3C` | `#B56A3C` |
| Accessible copper text | `#95502D` | `#D59666` |
| Primary CTA surface | `#A65A32` | `#A65A32` |
| Sparse accent | `#C5A46D` | `#C5A46D` |

No unrelated accent colors. The accessible copper tones are contrast-safe tonal derivatives of Warm Copper, not additional accent hues. Warm Copper remains the visual anchor; Muted Gold is decorative and sparse.

### Typography

- Display: Cormorant Garamond, weight 500–600, tight editorial leading.
- Interface/body: Geist, weight 400–700, minimum 16px for primary body copy.
- Maximum two primary families. Mono is reserved for small technical labels only.
- Avoid all-caps body copy and excessive tracking.

### Spacing and shape

- Section rhythm: `64 / 80 / 112px` across mobile, tablet, desktop.
- Primary content width: `72rem`; reading width: `40rem`.
- Touch targets: at least `44px` high with `8px` between adjacent controls.
- Small controls: `10–14px` radius. Major product imagery only: `24–32px` radius.
- Prefer whitespace and dividers over repeated rounded cards.

## Layout pattern

Use a hero-centric fashion-commerce structure:

1. Dominant static product hero with one primary action.
2. Product identity and proof rail.
3. Color study.
4. Three-step ordering path.
5. Direct embroidery placement.
6. Material/craftsmanship.
7. Size guidance and group ordering.
8. FAQ and final CTA.

The product must remain visually dominant. Do not create sections only to fill space.

## Glass material

Use restrained glass only for floating navigation, configurator price summary, checkout summary, sticky actions, and dialogs:

- subtle transparency over a stable brand-colored surface;
- `12–18px` blur;
- one low-contrast border;
- minimal shadow;
- always verify readable contrast.

Do not use lens distortion, liquid morphing, neon glow, or glass on every section.

## Interaction and accessibility

- Native buttons for selectable chips with `aria-pressed`.
- Visible 2px Warm Copper focus ring; never remove focus without replacement.
- Keep focused controls clear of the sticky header/action bar using scroll padding.
- Hover/focus transitions: `150–240ms`; no layout-shifting scale effects.
- Respect `prefers-reduced-motion`; core content is visible without animation.
- Form labels remain visible. Errors sit beside the affected field and use `role="alert"` or `aria-live`.
- Images use `next/image`, meaningful alt text, reserved aspect ratio, and lazy loading below the fold.

## Component rules

- Primary button: solid Warm Copper, Off White text, strong contrast.
- Secondary button: quiet glass or thin brand border.
- Tertiary action: text only with a directional icon.
- Cards only when grouping improves comprehension. Avoid card grids for ordinary prose.
- Icons: Lucide outline only; no emoji or mixed icon families.
- Direct-placement UX remains primary. Package name appears only as secondary inferred information.

## Responsive rules

- Mobile-first and content-driven heights.
- No horizontal scrolling at 320px.
- Recompose hierarchy for mobile; do not merely stack desktop cards.
- Sticky actions account for safe-area insets and never obscure keyboard focus.
- Verify 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 layouts.

## Forbidden patterns

- Video-scroll, frame sequences, heavy parallax, or mandatory autoplay media.
- Generic SaaS dashboard surfaces.
- Decorative gradients/glows that compete with the product.
- Excessive rounded rectangles, nested cards, duplicate copy, or tiny helper text.
- Marketplace thumbnail grids, package-first customer UX, or invented product details.
- Backend, schema, pricing, checkout, upload, WhatsApp, authentication, or order-flow changes.

## Pre-delivery checklist

- Product and primary CTA are obvious in the first viewport.
- No emoji icons or mixed icon systems.
- Contrast, focus, keyboard, aria state, and touch targets pass review.
- Both themes feel intentional rather than inverted.
- No horizontal overflow or sticky-content obstruction.
- Static imagery is optimized WebP/AVIF with dimensions reserved.
- Configurator, direct placements, pricing, multi-item, promo, upload, checkout, WhatsApp, and admin layout regressions pass.
