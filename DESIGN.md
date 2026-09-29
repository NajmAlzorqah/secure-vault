# Flip7 Design System — Secure Vault

## Overview

Flip7 is a retro-playful, teal-coral-gold design system. Inspired by vintage packaging and tactile game components, it blends retro warmth with modern high-assurance security UX. The visual language is bold, joyful, and tactile: every element feels like a precision game piece you want to tap, with pill-shaped controls, cream-colored input surfaces, and radiant colored glow elevations.

---

## Colors

### Core Palette
- **Primary Teal** (`#2BA8A2`): Main UI, primary interactive buttons, avatars, progress indicators
- **Primary Light** (`#3CC4BD`): Hover states, lighter accents, active glows
- **Primary Dark** (`#1E8C86`): Deep backgrounds, text on light surfaces
- **Primary BG** (`#E8F6F5`): Subtle teal tint for backgrounds and pill chips
- **Accent Gold** (`#FFD23F`): High-priority CTAs, copy password highlights, master badges
- **Accent Light** (`#FFE47A`): Soft gold tints, active states
- **Accent Dark** (`#E6B800`): Gold hover states, depth
- **Coral** (`#EF6C4A`): Destructive actions, warnings, critical audit triggers, emergency alerts
- **Coral Light** (`#FF8A6A`): Soft coral tints, warning badges
- **Coral Dark** (`#D45233`): Coral depth, hover states
- **Cream** (`#FFF8E7`): Card backgrounds, input surfaces, formula badges
- **Sky Blue** (`#5DADE2`): Informational states, policy rules, metadata tags
- **Surface Base** (`#EFF8F7`): Page background in light mode
- **Surface Card** (`#FFFFFF`): Card background in light mode
- **Success** (`#27AE60`): Positive states, password strength passes
- **Error** (`#E74C3C`): Error states

### Dark Mode Adaptation
- **Dark Background**: `#0B1B1A` (Deepest Teal Night)
- **Dark Card / Popover**: `#122A28` (Deep Teal Card Surface)
- **Dark Primary**: `#3CC4BD` (Vibrant Light Teal for dark contrast)
- **Dark Text Primary**: `#EFF8F7` (Crisp light surface text)
- **Dark Text Muted**: `#7FA7A4` (Muted teal-gray)
- **Dark Input Surface**: `#163331` with cream-accented focus

---

## Typography

- **Headline Style**: System font stack (`Geist Sans`, `IBM Plex Sans Arabic`, `Inter`), extra-bold (800), generous letter-spacing (`tracking-wider` / `0.04em`)
- **Body Font**: `-apple-system, BlinkMacSystemFont, "Geist Sans", "IBM Plex Sans Arabic", "Inter", sans-serif`
- **Display**: 36px / 2.25rem extra-bold
- **h1**: 24px / 1.5rem extra-bold
- **h2**: 18px / 1.125rem extra-bold
- **h3**: 16px / 1rem bold
- **body**: 14px / 0.875rem medium
- **sm**: 12px / 0.75rem medium
- **xs**: 10px / 0.625rem medium

---

## Spacing

Base unit: **4px (0.25rem)**
- **xs**: 4px (0.25rem)
- **sm**: 8px (0.5rem)
- **md**: 12px (0.75rem)
- **lg**: 16px (1rem)
- **xl**: 24px (1.5rem)

---

## Border Radius

- **sm** (`8px`): Small tags, micro badges
- **md** (`12px`): Inputs, form controls
- **lg** (`16px`): Dialogs, modal containers
- **xl** (`24px`): Feature cards, credential panels
- **round** (`9999px`): Pill buttons, badge chips, status indicators

---

## Elevation — Colored Glow System

- **shadow-sm**: `0 2px 8px rgba(0, 0, 0, 0.08)`
- **shadow-md**: `0 4px 16px rgba(0, 0, 0, 0.12)`
- **shadow-lg**: `0 8px 32px rgba(0, 0, 0, 0.16)`
- **shadow-card**: `0 4px 20px rgba(43, 168, 162, 0.10)`
- **shadow-teal-glow**: `0 4px 20px rgba(43, 168, 162, 0.35)`
- **shadow-coral-glow**: `0 4px 20px rgba(239, 108, 74, 0.35)`
- **shadow-accent-glow**: `0 4px 20px rgba(255, 210, 63, 0.40)`
- **shadow-sky-glow**: `0 4px 16px rgba(93, 173, 226, 0.30)`
- **shadow-focus**: `0 0 0 4px rgba(43, 168, 162, 0.25)`

---

## Components

### Buttons
Pill shape (`rounded-full`), minimum 36px-40px height, tactile bounce response (`transition-all active:scale-95 duration-150`).
- **Primary Teal Action**: Background `#2BA8A2`, text `#FFFFFF`, shadow `shadow-teal-glow`.
- **Accent Gold CTA**: Background `#FFD23F`, text `#4D3D00` (deep contrast), shadow `shadow-accent-glow`.
- **Destructive Coral**: Background `#EF6C4A`, text `#FFFFFF`, shadow `shadow-coral-glow`.
- **Outline / Ghost**: Cream or transparent base, teal border, hover tint.

### Inputs & Form Controls
- Cream background (`#FFF8E7` in light mode, `#163331` in dark mode)
- Pill or rounded-xl shape (`rounded-xl` / `rounded-full`)
- Colored focus ring with teal glow (`shadow-focus`)

### Cards (Credential & Audit Items)
White background (`#FFFFFF`), `rounded-2xl`, `shadow-card`, 4px colored left accent bar:
- **Default**: Teal-light left border (`border-l-4 border-l-[#3CC4BD]`)
- **Highlighted**: Gold left border (`border-l-4 border-l-[#FFD23F]`) with golden ambient glow
- **Warning / Alert**: Coral left border (`border-l-4 border-l-[#EF6C4A]`)

### Section Titles & Dividers
- Bold headline typography
- Dashed bottom border (`border-dashed border-primary/20`) for playful tactile rhythm

---

## Do's and Don'ts

1. **Do** use colored glow shadows for interactive and elevated elements.
2. **Do** use pill-shaped (`rounded-full`) buttons consistently.
3. **Do** use cream (`#FFF8E7`) for input surfaces in light mode.
4. **Don't** use washed-out gray text on colored backgrounds; use deep contrast tones (e.g. `#133A38`) or crisp white.
5. **Do** use left-border color accents on cards for state communication (teal = standard, gold = elevated, coral = danger).
6. **Do** use dashed borders for section dividers to keep the playful, crafted aesthetic alive.
7. **Don't** make micro-interaction animations longer than 200ms.
