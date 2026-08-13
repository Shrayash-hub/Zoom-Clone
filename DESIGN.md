# DESIGN.md — Zoom Workplace App UI Reference

> Source: Extracted from app.zoom.us/wc/home + live screenshots.
> This is the **web app** design, NOT the marketing site.

---

## CSS Variables (globals.css)
```css
:root {
  /* Colors */
  --color-bg:            #f4f4f4;   /* App background / sidebar */
  --color-surface:       #ffffff;   /* Main content area, cards */
  --color-surface-hover: #f0f0f0;   /* Nav item hover */
  --color-surface-active:#e8edf5;   /* Active/selected state */
  --color-border:        #e0e0e0;   /* Card borders, dividers */
  --color-primary:       #0e71eb;   /* Primary CTA, active icons */
  --color-primary-hover: #0848cc;   /* Button hover */
  --color-primary-soft:  #eaf1fd;   /* Light blue tint backgrounds */
  --color-text-primary:  #131619;   /* Main text */
  --color-text-secondary:#5b6475;   /* Muted/secondary text */
  --color-text-on-primary:#ffffff;  /* Text on blue buttons */
  --color-icon-default:  #696b6e;   /* Inactive nav icons */
  --color-icon-active:   #0e71eb;   /* Active nav icons */
  --color-success:       #1e8e5a;
  --color-warning:       #a96800;
  --color-danger:        #de2828;

  /* Meeting action button colors */
  --color-action-new:    #f47216;   /* Orange - New Meeting icon bg */
  --color-action-join:   #0e71eb;   /* Blue - Join icon bg */
  --color-action-schedule:#0e71eb;  /* Blue - Schedule icon bg */

  /* Typography */
  --font-primary: 'Almaden Sans', system-ui, -apple-system, Arial, sans-serif;
  --font-size-xs:   12px;
  --font-size-sm:   13px;
  --font-size-md:   14px;
  --font-size-lg:   16px;
  --font-size-xl:   18px;
  --font-size-2xl:  28px;
  --font-size-clock:56px;

  /* Spacing */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  24px;
  --space-6:  32px;
  --space-7:  48px;

  /* Radius */
  --radius-sm:  8px;
  --radius-md:  12px;
  --radius-lg:  16px;
  --radius-xl:  24px;
  --radius-full: 999px;

  /* Shadows */
  --shadow-card: 0 1px 4px rgba(0,0,0,0.08);
  --shadow-modal: 0 8px 24px rgba(0,0,0,0.12);

  /* Motion */
  --duration-fast:   150ms;
  --duration-base:   300ms;
  --easing:          ease-in-out;

  /* Layout */
  --sidebar-width:   65px;
  --topbar-height:   48px;
}
```

---

## Layout

### Shell
```
┌─────────────────────────────────────────────────────┐
│                    TOPBAR (48px)                    │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ SIDEBAR  │           MAIN CONTENT                   │
│  (65px)  │                                          │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

### Sidebar
- Width: 65px, fixed left, full height
- Background: `var(--color-bg)`
- Right border: `1px solid var(--color-border)`
- Nav items: icon (20px) + label (12px) stacked, centered
- Active item: icon + label in `var(--color-primary)`
- Inactive: icon + label in `var(--color-icon-default)`
- Hover: background `var(--color-surface-hover)`, border-radius `var(--radius-sm)`
- Settings icon pinned to bottom

### Topbar
- Height: 48px
- Background: `var(--color-surface)`
- Bottom border: `1px solid var(--color-border)`
- Left: "zoom Workplace" logo (small zoom icon + text)
- Center-left: back/forward arrows + history icon
- Center: search bar (rounded pill, `var(--color-bg)` bg, placeholder "Search Ctrl+K")
- Right: "Upgrade" button (primary) + user avatar circle (green online dot)

---

## Components

### Buttons
```css
/* Primary */
background: var(--color-primary);
color: var(--color-text-on-primary);
border-radius: var(--radius-full);
min-height: 36px;
padding: 0 16px;
font-size: var(--font-size-md);
font-weight: 600;
border: none;

/* Hover */
background: var(--color-primary-hover);

/* Secondary */
background: var(--color-surface);
color: var(--color-text-primary);
border: 1px solid var(--color-border);
border-radius: var(--radius-full);

/* Secondary Hover */
background: var(--color-surface-hover);
```

### Action Icon Buttons (Home page)
- Rounded square icon (48x48px), border-radius: `var(--radius-xl)`
- New Meeting: orange gradient bg `var(--color-action-new)`, camera icon
- Join: blue bg `var(--color-action-join)`, plus icon
- Schedule: blue bg `var(--color-action-schedule)`, calendar icon
- Label below icon: 13px, `var(--color-text-primary)`

### Cards
```css
background: var(--color-surface);
border: 1px solid var(--color-border);
border-radius: var(--radius-lg);
box-shadow: var(--shadow-card);
padding: var(--space-4);
```

### Inputs
```css
background: var(--color-surface);
border: 1px solid var(--color-border);
border-radius: var(--radius-md);
min-height: 40px;
padding: 8px 12px;
font-size: var(--font-size-md);
color: var(--color-text-primary);

/* Focus */
border-color: var(--color-primary);
box-shadow: 0 0 0 3px rgba(14, 113, 235, 0.15);
outline: none;
```

### Meeting List Item (Meetings tab)
- Selected: blue bg `var(--color-primary)`, white text, border-radius `var(--radius-md)`
- Unselected: transparent bg, hover `var(--color-surface-hover)`
- Shows: meeting ID (bold), title below

### Modal
```css
background: var(--color-surface);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-modal);
padding: var(--space-5);
max-width: 520px;
width: 100%;
```
- Overlay: `rgba(0,0,0,0.4)` backdrop

### Disabled / "Coming Soon" States
For UI elements that are visually present but not yet fully functional (e.g. advanced meeting controls or chat):
- Add `aria-disabled="true"`
- Inline styles: `opacity: 0.5` and `cursor: not-allowed`
- Trigger the `<ComingSoonToast />` component on click instead of performing an action

---

## Home Dashboard
- Clock: `var(--font-size-clock)`, weight 300, `var(--color-text-primary)`, centered
- Date: `var(--font-size-lg)`, `var(--color-text-secondary)`, centered
- Action buttons row: 3 icon buttons centered, ~100px apart
- Sections below: white cards with section headers

---

## Typography
| Use | Size | Weight | Color |
|-----|------|--------|-------|
| Clock | 56px | 300 | text-primary |
| Page title | 28px | 700 | text-primary |
| Section title | 18px | 600 | text-primary |
| Card title | 16px | 600 | text-primary |
| Body | 14px | 400 | text-primary |
| Secondary/muted | 13px | 400 | text-secondary |
| Nav label | 12px | 400 | icon-default/active |
| Meeting ID | 16px | 700 | inherit |

---

## Zoom Logo
- Small "zoom" wordmark in top-left of topbar
- Below it: "Workplace" in smaller weight
- Use a blue zoom camera icon (🎥 substitute with SVG)
