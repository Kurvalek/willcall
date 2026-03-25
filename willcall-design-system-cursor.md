# willcall Design System — Cursor Rules

> Source of truth: Figma file `jZtDnaWiMojrTzcHC1ikCv`
> Stack: Next.js · Supabase · Tailwind CSS · Vercel
> Last synced: March 2026

---

## Brand

willcall is a concert check-in and history-tracking app. The aesthetic is warm, sharp, intentional — zine culture meets modern product design. Punk/edgy-but-cute. Never cheesy, never corporate.

---

## Color Tokens

All colors come from Figma variables. Use the Tailwind `wc-` prefix.

### Base Palette

```
black:       #1F1E1D    — primary text, primary buttons, nav icons
near-black:  #2C2928    — avatar backgrounds
gray-600:    #5C5955    — secondary text
gray-400:    #A8A49C    — muted text, placeholders
gray-300:    #D1CEC7    — borders, dashed outlines, hover underlines
gray-200:    #E5E2DB    — subtle backgrounds
gray-100:    #F0EDE7    — lightest gray
cream:       #F5F3EE    — page background (all non-profile pages)
white:       #FFFFFF    — card fills, nav background
```

### Profile Colors (user-selectable, profile page background only)

```
cream:       #F5F3EE    — default profile background
yellow:      #EEE9B1
pink:        #FC98BC
lavender:    #D5D6EB
orange:      #FC6C2E    — also used for error states
blue:        #7ABFE8
gray:        #A5A49F
green:       #A8C9AA
```

### Semantic Mapping

```
bg:             cream (#F5F3EE)         — page background, all non-profile pages
bg-card:        white at 80% opacity    — card / container surfaces (rgba(255,255,255,0.8))
bg-input:       white at 60% opacity    — input fields (rgba(255,255,255,0.6))
text-primary:   black (#1F1E1D)         — headings, body text
text-secondary: gray-600 (#5C5955)      — supporting text, descriptions
text-muted:     gray-400 (#A8A49C)      — metadata, placeholders, captions
border:         black at 8% opacity     — card and input borders (rgba(0,0,0,0.08))
border-card:    black at 6% opacity     — lighter card borders (rgba(0,0,0,0.06))
error:          orange (#FC6C2E)        — error underlines and messages
success:        #4CAF50                 — connected status
```

### Color Rules

1. Warm cream (#F5F3EE) is the universal background — NOT pure white
2. Black (#1F1E1D) is the only action color — all buttons are black, no gradients
3. Profile page is the ONLY page with a colored background
4. Cards are semi-transparent white — they pick up the background color beneath them
5. No gradients anywhere in the system

---

## Typography

### Fonts

```
display + body:  'Plus Jakarta Sans', sans-serif
monospace:       'JetBrains Mono', monospace    — stats, dates, metadata labels
```

### Type Scale

```
page-title:      30px, ExtraBold (800), line-height 1.2
section-header:  20px, Bold (700), line-height 1.3
stat-value:      24px, ExtraBold (800), line-height 1.1
body-large:      18px, Bold (700), line-height 1.4    — user names
body-default:    16px, Regular (400), line-height 1.5  — body text
body-small:      14px, SemiBold (600), line-height 1.4 — button labels
body-small-reg:  14px, Regular (400), line-height 1.4  — descriptions
caption:         12px, Regular (400), line-height 1.4  — dates, venues
label:           11px, Medium (500), line-height 1.3   — stat labels, mono labels
```

### Typography Rules

- Bold (700) and ExtraBold (800) for headings
- Stat numbers use 800 weight
- Body text is 400 weight
- Button labels use 600 (SemiBold)
- JetBrains Mono for mono labels (section numbers, stat labels in design system)

---

## Spacing

```
space-1:   4px    (0.25rem)
space-2:   8px    (0.5rem)
space-3:   12px   (0.75rem)
space-4:   16px   (1rem)
space-5:   20px   (1.25rem)
space-6:   24px   (1.5rem)
space-8:   32px   (2rem)
space-10:  40px   (2.5rem)
space-12:  48px   (3rem)
space-16:  64px   (4rem)
```

---

## Border Radius

**One value: 4px. Everywhere. No exceptions.**

Buttons, cards, inputs, avatars, thumbnails, tags, tabs, menus, color swatches — all use `rounded` which maps to `4px` in the Tailwind config.

Do NOT use rounded-md, rounded-lg, rounded-full, or any other radius value.

---

## Components

### Buttons

**Primary (black)**
```
bg: black (#1F1E1D)
text: white
font: 14px SemiBold (600)
padding: 12px vertical, 24px horizontal
radius: 4px
hover: lighten to near-black (#2C2928)
active: opacity 0.7, scale 0.98
disabled: bg gray-300, text gray-600
```
"Search", "I was there", "I'm going" are ALL the same component — just different labels.

**Ghost (outlined)**
```
bg: transparent
border: 1px solid black (#1F1E1D)
text: black
font: 14px Medium (500)
padding: 10px vertical, 20px horizontal
radius: 4px
hover: bg becomes black, text becomes white (inverts)
disabled: border gray-300, text gray-400
```

**Add (subtle fill)**
```
bg: rgba(26,26,26,0.08) — 8% black
border: none
text: gray-600 (#5C5955)
font: 16px Medium (500)
padding: 16px vertical, full width
radius: 4px
hover: bg rgba(26,26,26,0.14) — 14% black
disabled: bg rgba(26,26,26,0.04), text gray-400
```

**Text (link-style)**
```
bg: none
border: none
text: gray-600, underlined
font: 14px Regular (400)
hover: text becomes black
disabled: text gray-400, no underline
```

### Inputs — Invisible Field

The input has NO background, NO border, NO visible container at rest. Just placeholder text.

```
bg: transparent
border: none, except bottom — starts transparent
padding: 14px top, 15px bottom, 0 left/right
border-radius: 0 (no radius on inputs — they're invisible)
font: 16px Regular (400)
placeholder color: gray-400 (#A8A49C)
caret-color: black

States:
  default:   bottom border transparent, placeholder visible
  hover:     bottom border gray-300 (#D1CEC7)
  focus:     bottom border black (#1F1E1D)
  filled:    bottom border gray-300, text color black
  error:     bottom border orange (#FC6C2E), error message below in orange 12px
  disabled:  bottom border transparent, placeholder gray-600, cursor not-allowed
```

Search inputs are always paired with a primary button to the right, 12px gap.

### Cards

```
bg: rgba(255,255,255,0.8) — 80% white
border: 1px solid rgba(0,0,0,0.06)
radius: 4px
no shadows
```

On the profile page, the semi-transparent white lets the user's selected background color show through.

### Show List Item

```
layout: horizontal, 12px gap
container: card styles (80% white, 1px border, 4px radius)
padding: 12px
thumbnail: 52x52px, 4px radius
artist name: 14px Bold (700), black
date: 12px Regular, gray-400
venue: 12px Regular, gray-400, prefix with 📍
```

### Stats Bar

```
layout: horizontal row, equal distribution
container: card styles (80% white, border, 4px radius)
stat value: 24px ExtraBold (800), black
stat label: 11px Regular, gray-400
cell padding: 12px vertical, 8px horizontal
```

### Avatars — SQUARE

```
shape: square with 4px radius — NOT circles
default: 44x44px, bg near-black (#2C2928), white initials 14px SemiBold
large: 72x72px, white initials 20px SemiBold
upload state: 64x64px, bg gray-200, 2px dashed border gray-300, camera icon
```

### Tags / Chips

```
bg: rgba(255,255,255,0.8)
border: 1px solid rgba(0,0,0,0.08)
text: gray-600, 14px Regular
padding: 8px vertical, 16px horizontal
radius: 4px
hover: bg rgba(0,0,0,0.04)
```

### Tabs (Segmented Control)

```
container: 80% white, 1px border, 4px radius, 3px internal padding
active tab: white bg, subtle shadow, SemiBold text, 2px internal radius
inactive tab: transparent, gray-600 text, Medium weight
tab padding: 10px vertical, 16px horizontal
```

### Bottom Navigation

```
position: fixed bottom, edge-to-edge (NOT floating)
bg: white
border-top: 1px solid rgba(0,0,0,0.08)
padding: 12px top, 8px bottom
4 items: Home, Search, Trending, Add
icons: 24px, stroke 1.75, outlined only
inactive: gray-400 / active: black
"+" button: 44x44 square, 4px radius, bg black, icon white
```

### FAB Action Menu

```
bg: white
radius: 4px
shadow: 0 8px 32px rgba(0,0,0,0.12)
padding: 20px horizontal, 24px vertical
items: icon (40x40, 4px radius) + label (16px SemiBold)
gap: 20px between items
```

---

## Page Backgrounds

```
Home / Discover:      cream (#F5F3EE)
Profile:              user-selected color (cream default)
My Crowd:             cream
Settings:             cream
Check-in modal:       cream
Add Past Shows modal: cream
```

---

## Do / Don't

### Do
- Use warm cream (#F5F3EE) as base background
- Use 4px radius on everything
- Use semi-transparent white (80%) for card surfaces
- Bold (700/800) for headings and stats
- Black for all action buttons — one color, no gradients
- Square avatars with 4px radius
- Invisible inputs — no bg, no border at rest
- Ghost buttons have a visible black border — inputs don't
- Add buttons use 8% black fill, no outline
- 📍 for venue locations

### Don't
- Use gradients on any element
- Use rounded/pill shapes on anything
- Use circular avatars
- Put visible backgrounds or borders on inputs at rest
- Use dashed borders on buttons
- Use pure white (#FFF) as a page background
- Use different border-radius values for different components
- Use dark mode — the app is light-only
- Float the bottom nav — it's edge-anchored
- Use shadows on cards — semi-transparent bg is the depth mechanism
