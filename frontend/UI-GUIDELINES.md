# UI/UX & Frontend Conventions — Attendance Monitoring System

This document defines the visual system, interaction patterns, and code structure for the frontend.
Follow it consistently across all pages and components. Treat it the same way the backend CLAUDE.md
treats layered architecture: these are conventions, not suggestions — deviate only when there's a
clear reason, and say why.

Stack this assumes: React 19, react-router 7, TanStack Query 5, axios, zod, react-hook-form,
Tailwind CSS 4, daisyUI 5.

---

## 1. Color System

Primary is Royal Blue (`#0056FF`). Everything else is built to sit quietly around it — cool,
low-saturation, analogous hues — so the UI doesn't compete with itself. The one exception is the
semantic state colors (success/warning/error/info), which stay close to conventional
green/amber/red/sky so they're recognizable at a glance without needing to be read.

| Role            | Hex       | Used for                                              |
|------------------|-----------|--------------------------------------------------------|
| `primary`        | `#0056FF` | Primary actions, links, active nav, focus rings        |
| `primary-content` | `#FFFFFF` | Text/icons on primary                                  |
| `secondary`      | `#4C5FD6` | Secondary buttons, less-emphasized interactive elements |
| `accent`         | `#14B8A6` | Sparing highlights — badges, small callouts, tags       |
| `neutral`        | `#334155` | Dark UI chrome (e.g. sidebars, footers) when needed     |
| `base-100`       | `#FFFFFF` | Page/card background                                    |
| `base-200`       | `#F3F5FA` | Subtle section backgrounds, table stripes                |
| `base-300`       | `#E4E8F1` | Borders, dividers                                        |
| `base-content`   | `#1E2433` | Default body text (near-navy, not pure black)            |
| `info`           | `#38BDF8` | Informational banners/badges                             |
| `success`        | `#16A34A` | Success toasts, confirmed states                         |
| `warning`        | `#D97706` | Warnings, "needs attention" states                       |
| `error`          | `#DC2626` | Errors, destructive action confirmation                  |

daisyUI 5 theme block (`src/index.css` or wherever Tailwind is configured):

```css
@plugin "daisyui" {
  themes: false;
}

@plugin "daisyui/theme" {
  name: "attendance";
  default: true;
  color-scheme: light;
  --color-primary: #0056FF;
  --color-primary-content: #FFFFFF;
  --color-secondary: #4C5FD6;
  --color-secondary-content: #FFFFFF;
  --color-accent: #14B8A6;
  --color-accent-content: #FFFFFF;
  --color-neutral: #334155;
  --color-neutral-content: #F3F5FA;
  --color-base-100: #FFFFFF;
  --color-base-200: #F3F5FA;
  --color-base-300: #E4E8F1;
  --color-base-content: #1E2433;
  --color-info: #38BDF8;
  --color-success: #16A34A;
  --color-warning: #D97706;
  --color-error: #DC2626;
  --radius-box: 0.75rem;
  --radius-field: 0.5rem;
  --radius-selector: 0.375rem;
}
```

Dark theme (`attendance-dark`) — same hue relationships, inverted for a dark base. Primary is
lifted slightly (`#3B7BFF` instead of `#0056FF`) since saturated royal blue loses contrast against
a dark background; semantic colors are lifted the same way for the same reason.

```css
@plugin "daisyui/theme" {
  name: "attendance-dark";
  default: false;
  color-scheme: dark;
  --color-primary: #3B7BFF;
  --color-primary-content: #FFFFFF;
  --color-secondary: #7C8AF0;
  --color-secondary-content: #0F1420;
  --color-accent: #2DD4C4;
  --color-accent-content: #0F1420;
  --color-neutral: #CBD5E1;
  --color-neutral-content: #1E2433;
  --color-base-100: #10131C;
  --color-base-200: #171B26;
  --color-base-300: #232838;
  --color-base-content: #E6E9F2;
  --color-info: #5FC9FB;
  --color-success: #34D372;
  --color-warning: #F0A93B;
  --color-error: #F0605C;
  --radius-box: 0.75rem;
  --radius-field: 0.5rem;
  --radius-selector: 0.375rem;
}
```

Wire both themes into daisyUI's config (`themes: attendance --default, attendance-dark --prefersdark;`
in the `@plugin "daisyui"` block) so it also respects the OS-level `prefers-color-scheme`, and add a
theme toggle control using daisyUI's `data-theme` swap pattern rather than hand-rolled CSS variables.

Rules:
- Never hardcode hex values in components. Use Tailwind/daisyUI semantic classes (`bg-primary`,
  `text-error`, `border-base-300`) so both themes stay correct from one place.
- `accent` is a highlight color, not a workhorse — if more than ~10% of a screen is accent-colored,
  that's a sign it's being overused.
- Test every new component in both themes before considering it done — the most common miss is a
  hardcoded light-mode assumption (e.g. a fixed white card background) that breaks in dark mode.

### Typography
Use **Roboto** as the primary UI typeface (via `@fontsource/roboto` or a self-hosted woff2, not a
runtime Google Fonts `<link>` — keeps it under your control and avoids a render-blocking external
request). Fall back to the system stack if it fails to load:
`font-family: "Roboto", system-ui, sans-serif;`. Reserve a monospace fallback (`ui-monospace`) for
IDs, timestamps, or tabular/RFID data. Keep a small type scale (e.g. `text-xs` → `text-2xl`) —
resist introducing one-off font sizes. Roboto ships in a few weights (400/500/700 cover nearly
everything needed) — only pull in the weights actually used, to keep the font payload small.

---

## 2. Interaction Pattern: Toast vs. Modal vs. Banner

Pick based on **stakes and persistence**, not habit. Decision order:

| Situation | Pattern | Why |
|---|---|---|
| Confirms a completed, low-risk action (saved, updated, record synced) | **Toast** | Transient, doesn't block the user, auto-dismisses (~4s) |
| Background/system feedback (e.g. "Reconnecting...", "Export ready") | **Toast** (or persistent variant if action-required) | Non-blocking |
| Destructive or irreversible action (delete record, remove user, bulk actions) | **Modal** (confirmation) | Forces a deliberate decision before it happens |
| Multi-field forms, detail views that need full attention | **Modal** or dedicated page — modal if it's a quick, contained task; page if it's long/complex | Modals shouldn't become mini-pages |
| Page- or section-level state the user should keep seeing until resolved (e.g. "Your session will expire soon", "3 unsynced records") | **Banner** (alert) | Persistent until dismissed or resolved, doesn't block interaction |
| Field-level validation error | **Inline error text** under the field | Fastest feedback loop, tied to react-hook-form |
| Request-level error (network failure, 500) not tied to a specific field | **Toast (error variant)** or inline banner if it blocks the whole view | Depends on whether the rest of the page is still usable |

Rule of thumb: **toast = "it happened," modal = "confirm before it happens," banner = "this is still true."**

---

## 3. UI States

Every data-driven view must explicitly handle: **loading, success, empty, and error.** Don't let
any of these fall through to a blank screen.

- **Loading**
  - Full page/section initial load → skeleton screens matching the eventual layout (preferred over
    spinners — reduces layout shift and feels faster).
  - Inline actions (submitting a form, button-triggered fetch) → spinner inside the button, button
    disabled while pending.
  - Use TanStack Query's distinction: `isPending` (no data yet) drives skeletons;
    `isFetching && !isPending` (background refetch) drives a subtle indicator only — don't
    re-skeleton a screen that already has data.

- **Success**
  - Mutations: toast confirmation (see §2) + let TanStack Query's cache invalidation/optimistic
    update handle the UI reflecting the new state.
  - Prefer optimistic updates for low-risk, high-frequency actions (e.g. marking attendance);
    reconcile/rollback on error.

- **Error**
  - Field-level → inline, next to the field, from zod/react-hook-form validation.
  - Request-level, page still usable → toast.
  - Request-level, page unusable without the data → inline error state in place of the content,
    with a clear message and a retry action. Don't just show a toast and leave a blank section.

- **Empty**
  - Treat empty state as a real design case, not an afterthought — brief explanation of why it's
    empty and, where relevant, a primary action to resolve it (e.g. "No attendance records yet" +
    "Add a student").

---

## 4. Component Architecture

Mirror the backend's "layer must earn its place" philosophy on the frontend: don't introduce a
layer of abstraction until it's reused or the component is doing too much.

```
src/
  components/
    ui/            # Dumb, reusable primitives — Button, Modal, Toast, Banner, Input,
                    # Badge, Skeleton, EmptyState. No business logic, no data fetching.
    [feature]/      # Feature-composed components (e.g. attendance/, students/)
                    # These use ui/ primitives + hooks, and can hold local UI state.
  hooks/            # Custom hooks wrapping TanStack Query (useAttendanceRecords, useCreateStudent)
                    # — components should not call axios/react-query directly.
  lib/              # api client (axios instance), zod schemas, utilities
  pages/            # Route-level components (react-router), compose feature components
```

Principles:
- **Reusable over duplicated.** If a UI pattern (card, table row, form field group) appears twice,
  extract it into `components/ui/` before a third use, not after.
- **Composition over configuration bloat.** Prefer children/slots over components with 15 boolean
  props trying to cover every case.
- **Data fetching lives in hooks, not components.** A page component should read like: call a hook,
  branch on loading/error/empty/success, render. Keep axios calls out of component bodies.
- **One schema, two jobs.** Reuse the same zod schema for both the form (via
  `@hookform/resolvers`) and for validating/typing API responses where the shapes match — don't
  hand-write a parallel TS interface next to a zod schema for the same data.
- **Co-locate what changes together.** A feature's components, its hook, and its schema can live
  near each other; don't force premature separation into far-apart folders.

---

## 5. Accessibility baseline (non-negotiable, not a nice-to-have)

- All interactive elements reachable and operable by keyboard; visible focus ring (daisyUI's
  default focus styles are fine — don't strip them with `outline-none` without a replacement).
- Color is never the only signal for state — pair error/success color with an icon or text, not
  color alone (matters for RFID scan feedback especially — fast glance, not a color read).
- Respect `prefers-reduced-motion` for any transitions/animations added beyond daisyUI defaults.

---

## 6. Responsive & Adaptive Design (this app ships as a PWA — treat mobile as a first-class target, not a shrink-down)

This will be installed to a phone home screen and run in a standalone window. Small-screen and
touch behaviour are therefore requirements, not a final polish pass. Two distinct ideas, both apply:

- **Responsive** — the *same* layout fluidly reflows to the viewport (flex/grid, relative units,
  wrapping). This is the default and covers most of the UI.
- **Adaptive** — at a breakpoint we *swap the pattern itself* because the responsive version stops
  working (e.g. a top nav bar becomes a bottom tab bar; a wide data table becomes a stack of cards).
  Reach for this only when reflowing the same markup would produce something cramped or unusable.

### Mobile-first
Write the base (unprefixed) styles for the smallest screen, then enhance upward with Tailwind's
`sm: md: lg: xl:` prefixes. Don't start desktop-wide and patch downward — that's how horizontal
scroll and clipped content sneak in.

Breakpoints (Tailwind defaults — don't invent new ones): `sm` 640, `md` 768, `lg` 1024, `xl` 1280.
Rules of thumb: **base** = phone portrait, **`md`** = tablet / large phone landscape, **`lg`+** =
desktop. Most layout switches happen at `md` and `lg`.

### Layout rules
- **The page body never scrolls horizontally.** Wide content (tables, code, long token strings,
  wide flex rows) must either wrap, truncate, or scroll *inside its own* `overflow-x-auto` container.
- Prefer fluid constraints over fixed widths: `w-full` + `max-w-*`, `min-w-0` on flex children that
  contain truncatable text (the classic fix for "flexbox won't let my text ellipsis"), relative
  units over `px` widths.
- Grids collapse by column count, not by hiding content:
  `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`. Don't `hidden` real data away on mobile — if it
  matters on desktop it matters on mobile; move it, don't delete it.

### Adaptive patterns we standardize on
- **Primary navigation (`AppShell`)** — horizontal top-nav on `md`+; on mobile it collapses to a
  bottom tab bar (thumb-reachable) or a drawer. Nav is `AppShell`'s job; individual pages don't
  re-solve it.
- **Data tables** — fine on desktop; below `md`, render each row as a stacked card (label/value
  pairs) rather than forcing a 6-column table through a 375px viewport. The horizontal-scroll
  `overflow-x-auto` wrapper is the acceptable interim fallback, not the target for primary tables.
- **Modals** — center dialog on desktop; on mobile prefer full-width (or a bottom sheet) with the
  action buttons reachable without scrolling past the content.
- **Multi-column forms** — single column on mobile (`grid-cols-1`), pair up at `sm`/`md`.

### Touch & PWA specifics
- **Touch targets ≥ 44×44px** for anything tappable (buttons, nav items, icon buttons, table-row
  actions). daisyUI's default `btn` meets this; `btn-xs`/`btn-sm` icon-only controls usually don't —
  give them padding or a larger hit area on touch.
- Respect **safe-area insets** for standalone mode (notches / home indicators): pad fixed top/bottom
  chrome with `env(safe-area-inset-*)` (Tailwind arbitrary values, e.g.
  `pb-[env(safe-area-inset-bottom)]`) so a bottom tab bar isn't under the home indicator.
- The viewport meta must allow user zoom (accessibility) — never `maximum-scale=1` /
  `user-scalable=no`.
- Don't depend on hover for essential info (no hover on touch): anything revealed on `:hover` must
  also be reachable on tap/focus.

### Verification
Check every screen at **375px (phone), 768px (tablet), 1280px (desktop)** in *both* themes before
calling it done. Fastest check: DevTools device toolbar, or resize the window narrow and confirm
(a) no horizontal scrollbar on `<body>`, (b) nav is reachable, (c) no content is clipped or
overlapping.

---


# Background Decoration Design Guide

## Objective

Create a premium, modern SaaS background similar to Linear, Stripe Dashboard, Framer, Microsoft Fluent, and Vercel.

The decoration should add visual depth without distracting from the primary content. The user should notice the UI first, and the background second.

---

# Overall Principles

The background is composed of multiple subtle decorative layers.

It must never feel busy or illustrative.

Avoid obvious graphics, icons, or patterns.

The composition should feel organic and elegant.

Opacity should remain low throughout.

All decorative elements should use the application's primary color palette.

---

# Layer 1 — Mesh Gradient

Use a multi-point gradient instead of a simple linear gradient.

Avoid a flat color.

Example palette:

- Primary Blue
- Royal Blue
- Indigo
- Slight Purple Tint

The gradient should smoothly blend between colors.

Do not use hard transitions.

---

# Layer 2 — Organic Gradient Blobs

Place several large organic shapes throughout the background.

Characteristics:

- irregular curves
- soft edges
- large scale
- semi-transparent
- heavily blurred

Opacity:

5%–12%

Size:

250px–700px

Placement:

- partially off-screen
- overlapping each other
- behind the content
- never centered perfectly

These blobs create depth rather than becoming focal points.

---

# Layer 3 — Ambient Glow

Some blobs should emit a soft glow.

Characteristics:

- radial gradient
- large blur radius
- subtle brightness

Opacity:

5%–10%

Purpose:

Create a luminous feeling without appearing neon.

---

# Layer 4 — Floating Orbs

Scatter a few circular decorative elements.

Characteristics:

- perfect circles
- soft radial gradients
- blurred
- varying sizes

Suggested sizes:

16px
24px
40px
72px

Opacity:

8%–20%

Do not place more than 5–7 orbs on a single screen.

---

# Layer 5 — Dot Grid Pattern

Introduce one or two dot matrices.

Example:

•••••
•••••
•••••

Characteristics:

- 4px dots
- generous spacing
- very low opacity

Opacity:

5%–10%

Do not use more than two grids.

Keep them away from important text.

---

# Layer 6 — Soft Rings (Optional)

Use subtle outlined circles.

Characteristics:

- no fill
- thin stroke
- heavily transparent

Opacity:

5%

These help create additional depth.

---

# Layer 7 — Glass Shapes (Optional)

Add one or two translucent rounded shapes.

Characteristics:

- frosted appearance
- very subtle blur
- low opacity

Never overpower the content.

---

# Motion (Optional)

Decorative elements may animate slowly.

Examples:

- floating vertically
- drifting horizontally
- slow rotation
- breathing scale

Duration:

20–40 seconds

Animation must be barely noticeable.

---

# Composition Rules

The decoration should always follow an asymmetrical layout.

Avoid symmetry.

Avoid placing decorative elements directly behind headings.

Leave generous breathing room around content.

Negative space is intentional.

The decoration should naturally guide the eye toward the content.

---

# Color Rules

Decorative elements should only use colors derived from the application's theme.

Avoid introducing unrelated colors.

Allowed:

- lighter primary
- darker primary
- white
- transparent white

Avoid:

- red
- green
- orange
- yellow

unless they are part of the application's color palette.

---

# Blur

Most decorative elements should be blurred.

Recommended blur:

20px–120px

Sharp shapes should be avoided.

---

# Shadows

Shadows should be extremely soft.

No harsh shadows.

No black shadows.

Use colored shadows derived from the primary color.

Example:

rgba(primaryColor, 0.15)

---

# Noise Texture

Apply a very subtle noise layer over the entire background.

Opacity:

1–3%

Purpose:

Prevent gradients from appearing flat.

---

# Accessibility

Background decoration must never reduce readability.

Maintain high contrast for all text.

Decorative elements should remain behind all interactive components.

---

# Inspiration

The visual language should resemble:

- Linear
- Stripe Dashboard
- Framer
- Vercel
- Microsoft Fluent Design
- Arc Browser
- Notion (marketing pages)

The result should feel premium, calm, modern, and spacious.

Avoid flashy effects.

The background should support the interface, not compete with it.

Component: BackgroundDecoration

Purpose:
Provide a consistent decorative backdrop across authentication pages, dashboards, onboarding screens, empty states, and marketing sections.

Variants:
- Authentication
- Dashboard
- Landing Page
- Empty State
- Modal (minimal)

All variants should follow the same visual language while adjusting the density of decorative elements based on the available space.