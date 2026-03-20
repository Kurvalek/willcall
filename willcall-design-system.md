# willcall design system

> A living design system spec for willcall — the concert check-in and history-tracking app.
> Use this file as a reference when building components in v0 or Cursor.

---

## Brand DNA

**Aesthetic:** Minimal, monochrome, analog warmth. Zine culture meets modern product design. Punk/edgy-but-cute. The app should feel like a well-designed show flyer that happens to be interactive.

**Personality:** Enthusiastic concert insider — funny, casual, edgy. Never cheesy, never corporate.

**Core principle:** Let the music do the talking. The UI stays black, white, and transparent — album art, venue photos, and concert imagery provide all the color.

---

## Color System

### Base Palette

```css
:root {
  /* Core — monochrome only */
  --wc-black: #0A0A0A;
  --wc-white: #FAFAFA;
  --wc-gray-50: #F5F5F5;
  --wc-gray-100: #E5E5E5;
  --wc-gray-200: #D4D4D4;
  --wc-gray-300: #A3A3A3;
  --wc-gray-400: #737373;
  --wc-gray-500: #525252;
  --wc-gray-600: #404040;
  --wc-gray-700: #262626;
  --wc-gray-800: #171717;
  --wc-gray-900: #0A0A0A;

  /* Semantic */
  --wc-bg: var(--wc-black);
  --wc-bg-elevated: var(--wc-gray-800);
  --wc-bg-surface: var(--wc-gray-700);
  --wc-text-primary: var(--wc-white);
  --wc-text-secondary: var(--wc-gray-300);
  --wc-text-muted: var(--wc-gray-400);
  --wc-border: var(--wc-gray-700);
  --wc-border-subtle: var(--wc-gray-800);

  /* Functional — used sparingly */
  --wc-error: #EF4444;
  --wc-success: #22C55E;
  --wc-link: var(--wc-white); /* links are white + underline, not blue */
}
```

### Color Rules

1. **No brand color.** The brand is black and white. Period.
2. **Color comes from content.** Album art, venue photos, artist images — these are the only sources of color in the UI.
3. **Dynamic color extraction** (future): Pull a dominant color from concert/album imagery for subtle accent tinting on profile pages or event cards. This is additive, never required.
4. **Dark mode is the only mode.** willcall is a dark-first app. No light theme planned.

---

## Typography

### Font Stack

```css
:root {
  --wc-font-display: 'Plus Jakarta Sans', sans-serif;
  --wc-font-body: 'Plus Jakarta Sans', sans-serif;
  --wc-font-mono: 'JetBrains Mono', monospace; /* stats, counts, dates */
}
```

**Plus Jakarta Sans** is used for everything — display and body. The wordmark uses a custom-modified version with a hooked "w." The monospace face is reserved for numerical data, dates, and stats to give them a utilitarian concert-ticket feel.

### Type Scale

```css
:root {
  --wc-text-xs: 0.75rem;     /* 12px — fine print, metadata */
  --wc-text-sm: 0.875rem;    /* 14px — secondary labels, captions */
  --wc-text-base: 1rem;      /* 16px — body text */
  --wc-text-lg: 1.125rem;    /* 18px — emphasized body */
  --wc-text-xl: 1.25rem;     /* 20px — section headers */
  --wc-text-2xl: 1.5rem;     /* 24px — page sub-headers */
  --wc-text-3xl: 1.875rem;   /* 30px — page headers */
  --wc-text-4xl: 2.25rem;    /* 36px — hero/display */
  --wc-text-5xl: 3rem;       /* 48px — big moments */
}
```

### Type Rules

1. **All caps for labels and categories** — sparingly. Use `letter-spacing: 0.05em` with all-caps.
2. **No bold headlines.** Headings use size and spacing to create hierarchy, not weight. `font-weight: 500` (medium) is the heaviest anything gets outside the wordmark.
3. **Body text is 400 weight.** Clean and readable.
4. **Monospace for data.** Show counts ("47 shows"), dates ("Mar 20, 2026"), and stats always render in `--wc-font-mono`.

---

## Spacing & Layout

### Spacing Scale

```css
:root {
  --wc-space-1: 0.25rem;   /* 4px */
  --wc-space-2: 0.5rem;    /* 8px */
  --wc-space-3: 0.75rem;   /* 12px */
  --wc-space-4: 1rem;      /* 16px */
  --wc-space-5: 1.25rem;   /* 20px */
  --wc-space-6: 1.5rem;    /* 24px */
  --wc-space-8: 2rem;      /* 32px */
  --wc-space-10: 2.5rem;   /* 40px */
  --wc-space-12: 3rem;     /* 48px */
  --wc-space-16: 4rem;     /* 64px */
  --wc-space-20: 5rem;     /* 80px */
}
```

### Layout Principles

1. **Generous whitespace.** Let things breathe. When in doubt, add more space.
2. **Content width:** `max-width: 480px` for mobile-first single-column layouts. Profile and feed views are narrow and focused.
3. **Edge-to-edge images.** Concert photos and album art bleed to the edges — no padding on image containers.
4. **Grid for collections.** 2-column grid for concert cards on mobile, 3-column on tablet+.

---

## Borders & Dividers

### The Borderless Philosophy

```css
/* Inputs — no visible border, just background shift */
.wc-input {
  background: var(--wc-bg-elevated);
  border: 1px solid transparent;
  border-radius: 0; /* sharp corners by default */
  padding: var(--wc-space-3) var(--wc-space-4);
  color: var(--wc-text-primary);
  font-size: var(--wc-text-base);
  transition: border-color 0.2s ease;
}

.wc-input:focus {
  border-color: var(--wc-gray-500);
  outline: none;
}

.wc-input::placeholder {
  color: var(--wc-text-muted);
}
```

### Rules

1. **No borders on inputs by default.** Empty fields sit quietly on the background. A subtle border appears on focus only.
2. **No card borders.** Cards are defined by background color shifts (elevated surfaces) or by their content (images).
3. **Dividers are rare.** Use spacing to separate sections. If you absolutely need a divider, use a 1px line at `var(--wc-gray-800)` — nearly invisible.
4. **Sharp corners everywhere.** `border-radius: 0` is the default. The only exception is avatar circles and pill-shaped tags.

---

## Glass & Transparency Effects

### Liquid Glass

The signature willcall surface treatment. Used for floating menus, navigation overlays, and modal backdrops.

```css
.wc-glass {
  background: rgba(10, 10, 10, 0.6);
  backdrop-filter: blur(24px) saturate(1.2);
  -webkit-backdrop-filter: blur(24px) saturate(1.2);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.wc-glass-light {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px) saturate(1.1);
  -webkit-backdrop-filter: blur(20px) saturate(1.1);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.wc-glass-heavy {
  background: rgba(10, 10, 10, 0.8);
  backdrop-filter: blur(40px) saturate(1.3);
  -webkit-backdrop-filter: blur(40px) saturate(1.3);
  border: 1px solid rgba(255, 255, 255, 0.04);
}
```

### Glass Rules

1. **Glass sits on top of imagery.** The effect only works when there's colorful content behind it (album art, venue photos, gradients). On flat dark backgrounds, use `--wc-bg-elevated` instead.
2. **Navigation bar is always glass.** The bottom nav / top bar floats over content with `wc-glass`.
3. **Modals and sheets** use `wc-glass-heavy` — more opaque, heavier blur.
4. **Saturation boost is subtle.** The `saturate()` filter makes colors behind the glass slightly more vivid, which helps the glass feel alive when overlaying concert imagery.
5. **The ultra-thin white border** (6–8% opacity) gives the glass shape definition without looking like a "real" border.

---

## Components

### Buttons

```css
/* Primary — white on black, the main CTA */
.wc-btn {
  background: var(--wc-white);
  color: var(--wc-black);
  font-family: var(--wc-font-display);
  font-size: var(--wc-text-sm);
  font-weight: 500;
  letter-spacing: 0.02em;
  padding: var(--wc-space-3) var(--wc-space-6);
  border: none;
  border-radius: 0;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.wc-btn:hover {
  opacity: 0.85;
}

.wc-btn:active {
  opacity: 0.7;
}

/* Ghost — transparent with subtle border */
.wc-btn-ghost {
  background: transparent;
  color: var(--wc-text-primary);
  border: 1px solid var(--wc-gray-600);
  padding: var(--wc-space-3) var(--wc-space-6);
  border-radius: 0;
  font-size: var(--wc-text-sm);
  font-weight: 400;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.wc-btn-ghost:hover {
  border-color: var(--wc-gray-400);
  background: rgba(255, 255, 255, 0.04);
}

/* Text — no border, no background */
.wc-btn-text {
  background: none;
  border: none;
  color: var(--wc-text-secondary);
  font-size: var(--wc-text-sm);
  padding: var(--wc-space-2);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.wc-btn-text:hover {
  color: var(--wc-text-primary);
}
```

### Button Rules

1. **One primary CTA per view.** White button = the thing you most want the user to do.
2. **Ghost for secondary actions.** "Edit profile," "View all," etc.
3. **Text buttons for tertiary/destructive.** "Cancel," "Remove," "Sign out."
4. **No rounded buttons.** Everything is sharp-cornered. Pill shapes are only for tags.
5. **No icons in primary buttons.** Keep CTAs text-only for clarity. Icons go in icon buttons (see below).

### Icon Buttons

```css
.wc-icon-btn {
  background: none;
  border: none;
  color: var(--wc-text-secondary);
  padding: var(--wc-space-2);
  cursor: pointer;
  transition: color 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.wc-icon-btn:hover {
  color: var(--wc-text-primary);
}
```

Use Lucide icons at 20px default size. Stroke width 1.5.

---

### Cards

```css
/* Base concert card */
.wc-card {
  background: var(--wc-bg-elevated);
  border: none;
  border-radius: 0;
  overflow: hidden;
  transition: transform 0.2s ease;
}

.wc-card:hover {
  transform: translateY(-2px);
}

/* Card with image — image bleeds to edges */
.wc-card-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  display: block;
}

.wc-card-body {
  padding: var(--wc-space-3) var(--wc-space-4) var(--wc-space-4);
}

.wc-card-title {
  font-size: var(--wc-text-base);
  font-weight: 500;
  color: var(--wc-text-primary);
  margin: 0 0 var(--wc-space-1);
}

.wc-card-meta {
  font-family: var(--wc-font-mono);
  font-size: var(--wc-text-xs);
  color: var(--wc-text-muted);
  letter-spacing: 0.02em;
}
```

### Card Rules

1. **No borders, no shadows, no rounded corners.**
2. **Image-first.** The concert photo is the card. The text metadata sits underneath.
3. **Square images** (`aspect-ratio: 1/1`) for grid layouts. `16:9` for featured/hero cards.
4. **Minimal metadata.** Artist name + venue + date. That's it on the card face.

---

### Tags / Pills

The one exception to the "no rounded corners" rule.

```css
.wc-tag {
  display: inline-flex;
  align-items: center;
  background: var(--wc-gray-700);
  color: var(--wc-text-secondary);
  font-family: var(--wc-font-mono);
  font-size: var(--wc-text-xs);
  padding: var(--wc-space-1) var(--wc-space-3);
  border-radius: 9999px;
  letter-spacing: 0.02em;
}
```

Used for: genres, years, venue types, "was there" badges.

---

### Navigation (Floating Glass Bar)

```css
.wc-nav {
  position: fixed;
  bottom: var(--wc-space-4);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--wc-space-6);
  padding: var(--wc-space-3) var(--wc-space-6);

  /* Glass effect */
  background: rgba(10, 10, 10, 0.6);
  backdrop-filter: blur(24px) saturate(1.2);
  -webkit-backdrop-filter: blur(24px) saturate(1.2);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--wc-space-4); /* intentional rounding — nav is a floating island */
}

.wc-nav-item {
  color: var(--wc-text-muted);
  transition: color 0.15s ease;
  padding: var(--wc-space-2);
}

.wc-nav-item.active {
  color: var(--wc-text-primary);
}
```

### Navigation Rules

1. **Floating island at the bottom.** Not anchored to the edge — it floats with rounded corners and glass blur.
2. **Icons only** in the nav bar. No text labels. Keep it compact.
3. **Active state = white.** Inactive = muted gray. No underlines, no indicators.
4. **3–5 items max.** Home, Search, Add, Profile is the likely set.

---

### Modals & Bottom Sheets

```css
.wc-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 50;
}

.wc-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 85vh;
  overflow-y: auto;

  /* Heavy glass */
  background: rgba(10, 10, 10, 0.85);
  backdrop-filter: blur(40px) saturate(1.3);
  -webkit-backdrop-filter: blur(40px) saturate(1.3);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--wc-space-4) var(--wc-space-4) 0 0;
  padding: var(--wc-space-6);
}

.wc-sheet-handle {
  width: 36px;
  height: 4px;
  background: var(--wc-gray-500);
  border-radius: 2px;
  margin: 0 auto var(--wc-space-6);
}
```

---

## Motion & Animation

### Easing

```css
:root {
  --wc-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --wc-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --wc-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Transitions

```css
/* Default micro-interaction */
--wc-transition-fast: 150ms var(--wc-ease-out);
--wc-transition-base: 200ms var(--wc-ease-out);
--wc-transition-slow: 350ms var(--wc-ease-out);

/* Sheets and modals */
--wc-transition-sheet: 400ms var(--wc-ease-out);
```

### Animation Rules

1. **Fast and subtle.** Nothing should feel sluggish or over-animated.
2. **Sheets slide up.** Modals fade in. Cards lift on hover.
3. **No bouncy animations.** The spring easing is reserved for the check-in confirmation moment only — a satisfying micro-celebration.
4. **Page transitions:** simple crossfade, ~200ms. No sliding pages.
5. **Stagger lists:** When a list of concerts loads, stagger each card's fade-in by 30–50ms.

---

## Iconography

**Library:** Lucide React
**Size:** 20px default, 24px for nav
**Stroke width:** 1.5
**Style:** Outlined only. No filled icons. Matches the minimal line-art aesthetic.

---

## Imagery

### Concert Photos

1. **Always edge-to-edge.** No padding around photos.
2. **Slight desaturation** on grid views: `filter: saturate(0.85)` — lets the grid feel cohesive. Full saturation on detail views.
3. **Fallback gradient** when no image is available:

```css
.wc-image-fallback {
  background: linear-gradient(
    135deg,
    var(--wc-gray-800) 0%,
    var(--wc-gray-700) 100%
  );
}
```

### Avatars

```css
.wc-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%; /* the one circle in the system */
  object-fit: cover;
  border: 2px solid var(--wc-gray-700);
}

.wc-avatar-lg {
  width: 80px;
  height: 80px;
}
```

---

## Tailwind Configuration

If using Tailwind (which you are), extend the config:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        wc: {
          black: '#0A0A0A',
          white: '#FAFAFA',
          gray: {
            50: '#F5F5F5',
            100: '#E5E5E5',
            200: '#D4D4D4',
            300: '#A3A3A3',
            400: '#737373',
            500: '#525252',
            600: '#404040',
            700: '#262626',
            800: '#171717',
            900: '#0A0A0A',
          },
        },
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        none: '0',
      },
      backdropBlur: {
        glass: '24px',
        'glass-heavy': '40px',
      },
    },
  },
};
```

---

## Tailwind Utility Classes (Quick Reference)

```
/* Surfaces */
.bg-wc-black          — base background
.bg-wc-gray-800       — elevated surface
.bg-wc-gray-700       — interactive surface

/* Text */
.text-wc-white        — primary text
.text-wc-gray-300     — secondary text
.text-wc-gray-400     — muted text

/* Glass (apply as custom classes or inline) */
.wc-glass             — standard glass panel
.wc-glass-heavy       — modal/sheet glass

/* Typography */
.font-display          — Plus Jakarta Sans
.font-mono             — JetBrains Mono (dates, stats)
```

---

## Do / Don't

### Do

- Let images bring the color
- Use generous whitespace
- Keep inputs clean and borderless
- Use glass effects over imagery
- Use monospace for data and stats
- Keep navigation floating and transparent
- Make the check-in moment feel special (spring animation)

### Don't

- Add a brand color or accent color
- Put borders on inputs or cards
- Round corners on anything except avatars, tags, and the nav island
- Use filled icons
- Add shadows (glass replaces shadows in this system)
- Use a light theme
- Over-animate — keep it fast and quiet
- Use bold for headings (medium weight max)

---

## Component Inventory (Build Order)

1. **Input** — borderless text field with focus state
2. **Button** — primary, ghost, text, icon variants
3. **Card** — concert card with image + metadata
4. **Tag** — pill-shaped genre/year labels
5. **Avatar** — circular, two sizes
6. **Navigation** — floating glass bar
7. **Bottom Sheet** — glass modal
8. **Concert List Item** — horizontal layout for search results
9. **Profile Header** — avatar + stats + bio
10. **Check-in Button** — the hero interaction, with spring animation

---

## Static app (`app.html`)

The concert-search POC serves a single-page UI from **`app.html`**. The `:root` **CSS variables** (`--wc-*`), **glass utilities** (`.wc-glass`, `.wc-glass-light`, `.wc-glass-heavy`), **`.wc-overlay`**, **`.wc-sheet`**, buttons, cards, and related helpers in that file are the implementation of this spec — **keep them aligned** when you change this document.

---

*Last updated: March 2026*
*Stack: Next.js · Supabase · Tailwind CSS · Vercel*
