# Pulse Hub Implementation Spec (V2 — Normative)

> **Purpose:** This is the single source of truth for building any Pulse Hub screen. It merges the visual intent of `design-spec.md` with the concrete implementation reality of the `acist-pro-mockup` Next.js codebase, and **resolves every conflict with a binding decision.** If a token appears here, it is canonical. If it doesn't, it isn't.
>
> **Stack:** Next.js · Tailwind v4 (CSS-first, no `tailwind.config.*`) · Inter via `next/font/google` · `culori` for runtime color interpolation · `framer-motion` for transitions · `lucide-react` for icons.
>
> **Canvas:** Fixed `1280×800` body, scaled to viewport via `BodyScaler`. All values below are absolute pixels at 1× scale.

---

## 0. Project Bootstrap

**This section is Step 0.** Before building any screen, the fixed-resolution scaling frame must be in place. Every Pulse Hub app renders at exactly `1280×800` and scales proportionally to fit the browser window, centered on a near-black background.

### 0.1 Dependencies

```bash
# Start from a fresh Next.js app with Tailwind v4
npx create-next-app@latest pulse-hub --typescript --tailwind --app --src-dir=false
cd pulse-hub

# Required runtime dependencies
npm install culori framer-motion lucide-react

# Inter font is loaded via next/font/google (no install needed)
```

### 0.2 BodyScaler Component

Create `components/BodyScaler.tsx` — a Client Component that returns `null` and only handles resize math. It applies CSS `transform: scale()` directly to `document.body` so that Radix UI portals (which append to `document.body`) are not broken by a scaled wrapper `<div>`.

```tsx
"use client";

import { useEffect } from "react";

export function BodyScaler() {
  useEffect(() => {
    function scale() {
      const s = Math.min(window.innerWidth / 1280, window.innerHeight / 800);
      document.body.style.transform = `scale(${s})`;
    }
    scale();
    window.addEventListener("resize", scale);
    return () => window.removeEventListener("resize", scale);
  }, []);

  return null;
}
```

### 0.3 Root Layout

Update `app/layout.tsx`. The `<html>` tag is the centering frame. The `<body>` tag is the fixed 1280×800 canvas. `BodyScaler` is rendered inside `<body>` alongside `{children}`.

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { BodyScaler } from "@/components/BodyScaler";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = { title: "Pulse Hub" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-neutral-950"
    >
      <body
        className={`${inter.variable} relative h-[800px] w-[1280px] shrink-0 origin-center overflow-hidden bg-background shadow-2xl font-sans antialiased`}
      >
        <BodyScaler />
        {children}
      </body>
    </html>
  );
}
```

### 0.4 globals.css — Minimal ACIST Overrides

The Tailwind v4 CSS-first config lives in `app/globals.css`. Keep the default `@theme` block that `create-next-app` generates (it powers shadcn compatibility), but add the Inter font-family override and force dark mode:

```css
/* At the top of the @theme block, add: */
--font-sans: var(--font-inter), 'Inter', ui-sans-serif, system-ui, sans-serif;
```

```html
<!-- On the <html> tag in layout.tsx, add class="dark" alongside the other classes -->
```

**Do not** define custom ACIST color variables in `globals.css`. All medical UI colors are applied as arbitrary Tailwind classes directly in component code (see §1). This is a deliberate choice — it guarantees exact shades independent of theme state and makes the spec the single source of truth for color values.

### 0.5 Verification

After bootstrap, `npm run dev` should show a black page with a `1280×800` shadowed rectangle centered in the viewport. Resizing the browser window should scale the rectangle proportionally without scrollbars.

---

## 1. Palette

Use arbitrary Tailwind classes (`bg-[#...]`, `text-[#...]`, `border-[#...]`) for all medical UI surfaces. The shadcn/ui semantic variables (`--background`, `--foreground`, etc.) exist in `globals.css` for framework compatibility but **must not** be referenced in any Pulse Hub screen code — they are generic light/dark defaults unrelated to the ACIST design language.

### 1.1 Backgrounds

| Token | Value | Usage Rule |
|:------|:------|:-----------|
| `base` | `#0A0A0F` | App shell root. Applied once on the outermost container. |
| `chrome` | `#1C1B22` | Header bar, sidebar rail. Structural framing surfaces. |
| `card` | `#111118` | Hero zone cards, data modules. All primary content panels. |
| `track` | `#000000` | Linear gauge track backgrounds. Hard black for maximum fill contrast. |

**Hero Anchor Gradient** — The design spec defines a `#0A0A0F → #16161C` vertical gradient for primary data zones. **Decision: DEFERRED.** Current implementation uses solid `card` (`#111118`). The gradient is aspirational polish — implement it only after pixel-accuracy on layout and data hierarchy is locked. When implemented, apply as `background: linear-gradient(to bottom, #0A0A0F, #16161C)` on hero zone card interiors, replacing `bg-[#111118]`.

### 1.2 Borders & Separators

| Token | Value | Usage Rule |
|:------|:------|:-----------|
| `separator` | `#2A2A35` | 1px structural borders. Header bottom-rule, sidebar divider, shell outline. Full opacity. |
| `separator-subtle` | `#2A2A35` at 50% | Card outlines. Use `border-[#2a2a35]/50`. |
| `track-border` | `#3A3A45` | Gauge track outlines, decorative sub-rules inside cards. |

### 1.3 Text

| Token | Tailwind Class | Hex | Usage Rule |
|:------|:---------------|:----|:-----------|
| `text-primary` | `text-white` | `#FFFFFF` | All values, titles, hero numerals. Any data the clinician reads first. |
| `text-secondary` | `text-[#C8C8D0]` | `#C8C8D0` | Labels, units, descriptive text above/beside values. |
| `text-tertiary` | `text-[#8888A0]` | `#8888A0` | Metadata, timestamps, disabled/off-state text. |

**Decision: OVERRIDE Tailwind grays.** The V1 codebase drifted to `text-gray-400` / `text-gray-500` / `text-gray-300` (Tailwind neutral scale). These do not match the design spec's blue-tinted neutrals. **All new code must use the exact hex values above.** Existing code should be migrated on contact.

### 1.4 Accent & Status Colors

| Token | Value | Usage Rule |
|:------|:------|:-----------|
| `interactive` | `#00B4D8` | All interactive affordances: nav actions, toggle on-states, text links, icon buttons. |
| `interactive-hover` | `#00D4FF` | Hover/press state for interactive elements. Apply via `hover:text-[#00d4ff]` or `hover:bg-[#00d4ff]`. |
| `action` | `#0077CC` | Primary action buttons (Arm, Confirm). Solid background, white text. |
| `action-hover` | `#0088DD` | Hover state for action buttons. |
| `ready` | `#00CC66` | "Ready" state banner text and indicators. |
| `warning` | `#E6A817` | Warning/confirm states. Also the endpoint of the base gauge ramp. |
| `injecting` | `#9933CC` | Injecting state. Use exact token, not Tailwind purple approximations. |
| `injecting-gradient` | `#7C3AED → #9933CC` | Injecting state fill for gauges/surfaces where a gradient is needed. |

**Decision: OVERRIDE code approximations.** The V1 codebase used `#9333ea` (Tailwind violet-600) and `#1a3a5c` (desaturated navy) as approximations. **Use the spec-defined hex values above.** The visual difference is subtle but matters for brand consistency across screens.

### 1.5 Gauge Color Ramps

Runtime-generated via `culori` in `oklch` space. These are not static tokens — they are interpolation anchors.

```ts
import { interpolate } from "culori";

// Base ramp: 0% → 100% of target volume
const baseRamp = interpolate(["#78bd4f", "#b8d968", "#f0a03a"], "oklch");

// Overage ramp: 100% → max overage
const overageRamp = interpolate(["#f0a03a", "#ef4444"], "oklch");

// Usage: baseRamp(t) where t ∈ [0, 1]
```

| Ramp | Start | Mid | End | Meaning |
|:-----|:------|:----|:----|:--------|
| Base | `#78BD4F` (green) | `#B8D968` (yellow-green) | `#F0A03A` (amber) | Volume fill approaching target. |
| Overage | `#F0A03A` (amber) | — | `#EF4444` (red) | Volume exceeding target. |

---

## 2. Typography

**Font:** Inter, all weights. Loaded via `next/font/google`, applied as `font-sans` at body scope.

**Tabular figures:** Every numeric element must include `tabular-nums` (OpenType `tnum`) to prevent layout shift during value changes.

### 2.1 Type Scale

| Role | Size | Weight | Class Recipe | Notes |
|:-----|:-----|:-------|:-------------|:------|
| **Hero Numeral** | `120px` | Bold (700) | `font-bold leading-none text-white tabular-nums` + `style={{ fontSize: "120px" }}` | The signature. Must be readable from across a cath lab (~3m). |
| **Large Operational** | `48px` | Bold (700) | `text-5xl font-bold text-white tabular-nums` | Secondary operational values (lower center zone). |
| **Telemetry Value** | `36px` | Semibold (600) | `text-4xl font-semibold text-white tabular-nums` | Right-rail telemetry stack, gauge readouts. |
| **Status Banner** | `36px` | Semibold (600) | `text-4xl font-semibold` + status color | "Ready: Large Injection" etc. Color determined by state. |
| **Primary Label** | `18px` | Regular (400) | `text-lg text-[#C8C8D0]` | Labels above values. |
| **Interactive Label** | `18px` | Medium (500) | `text-lg font-medium text-[#00b4d8]` | Clickable text actions. |
| **Unit (inline)** | `14px` | Regular (400) | `text-sm text-[#C8C8D0]` | Parenthetical units inside labels: `"Flow Rate (mL/s)"`. |
| **Unit (beside value)** | `18–20px` | Regular (400) | `text-lg text-[#C8C8D0]` or `text-xl text-[#C8C8D0]` | Units baseline-aligned next to large numerals. |
| **Metadata** | `14px` | Regular (400) | `text-sm text-[#8888A0]` | Timestamps, history entries, tertiary info. |

**Decision: Hero numeral target is `120px`, not `100px`.** The V1 codebase used `100px` to fit the dual-card layout within the `312px` hero band. If `120px` causes overflow, the correct fix is to reduce card padding or adjust the hero band height — not to shrink the number. The "squint test" (Principle 3) demands that hero numerals dominate. For screens where only one hero value exists, use `140px`.

### 2.2 Label–Value Relationship

Labels **always sit above** their value. The pattern is:

```
LABEL (unit)        ← text-lg text-[#C8C8D0], unit in text-sm
120.0               ← hero/operational numeral
```

Never place labels beside values at the same vertical position. Never let units float detached from their label or value.

---

## 3. Layout

### 3.1 Global Frame

```tsx
<html className="flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-neutral-950">
  <body className="relative h-[800px] w-[1280px] shrink-0 origin-center overflow-hidden font-sans antialiased">
    <BodyScaler />  {/* sets transform: scale(min(vw/1280, vh/800)) */}
    {children}
  </body>
</html>
```

### 3.2 Shell Partitioning

```
┌─────────────────────────────────────────────────┐
│  HEADER  (bg-chrome, px-6 py-4, border-b)       │
├────┬────────────────────────────────────────────┤
│ S  │  MAIN (p-6)                                 │
│ I  │ ┌──────────────────────┬──────────┐         │
│ D  │ │  HERO ZONE           │ TELEM.   │  upper  │
│ E  │ │  (flex-1)            │ (w-56)   │  band   │
│ B  │ ├──────────────────────┼──────────┤         │
│ A  │ │  GAUGE / ACTIONS     │ ACTION   │  lower  │
│ R  │ │  (max-w-[760px])     │ (w-56)   │  band   │
│    │ └──────────────────────┴──────────┘         │
│w-20│                                              │
└────┴────────────────────────────────────────────┘
```

| Region | Key Classes | Size |
|:-------|:------------|:-----|
| Shell outer | `rounded-md border border-[#2a2a35] bg-[#0a0a0f] font-sans` | 1280×800 |
| Header | `flex items-center justify-between border-b border-[#2a2a35] bg-[#1C1B22] px-6 py-4` | full width × ~56px |
| Sidebar | `flex w-20 flex-col items-center border-r border-[#2a2a35]/50 bg-[#1C1B22] py-6` | 80px wide |
| Main | `flex min-w-0 flex-1 flex-col p-6` | remaining space |
| Upper hero band | `h-[312px]`, hero zone is `flex-1`, telemetry rail is `w-56` (224px) | |
| Lower band | gauge zone is `w-full max-w-[760px] min-w-0`, action rail is `w-56 shrink-0` | |

### 3.3 Spacing System

Base unit is 4px (Tailwind default scale). Macro rhythm is **24px** (`p-6`, `gap-6`, `mb-6`).

| Context | Token | Value |
|:--------|:------|:------|
| Chassis padding (header, sidebar, main) | `p-6` / `px-6 py-4` / `py-6` | 24px / 24×16 / 24px |
| Major region gaps | `gap-6` | 24px |
| Telemetry stack spacing | `gap-5` | 20px |
| Row internals | `gap-3` or `gap-4` | 12px or 16px |
| Card internal padding | `p-6` | 24px |
| Action pill vertical padding | `py-2.5` | 10px |

### 3.4 The "Anchor, Don't Box" Tension

The design spec says to avoid 4-sided containers and prefer L-brackets and negative space. **Decision: Cards in the hero zone are an accepted exception.** Rounded-corner bordered cards (`rounded-xl border-[#2a2a35]/50`) are retained for hero data blocks because they provide the scannability needed at 120px type scales. However, the **telemetry stack** (right rail) and **lower gauge zone** should avoid boxing — use bottom-rules (`h-0.5 bg-[#3a3a45]`) and negative space instead.

Rule of thumb: if a region contains a hero numeral, it gets a card. If it contains secondary/tertiary data, it uses open spacing with subtle separators.

---

## 4. State Model

The UI has discrete operational states. Each state determines the status banner text, status color, and which gauge ramp is active.

| State | Banner Text | Banner Color | Gauge Behavior | Accent Notes |
|:------|:------------|:-------------|:---------------|:-------------|
| **Standby** | `"Standby"` | `text-[#8888A0]` | Static, no fill animation | Neutral. |
| **Armed** | `"Armed: {InjectionType}"` | `text-[#E6A817]` | Pulsing glow on gauge | Warning color signals confirmation needed. |
| **Ready** | `"Ready: {InjectionType}"` | `text-[#00CC66]` | Base ramp active, fill tracks volume | Ready green. |
| **Injecting** | `"Injecting"` | `text-[#9933CC]` | Fill animates in real time, overage ramp activates past 100% | Purple replaces green/amber. |
| **Complete** | `"Injection Complete"` | `text-[#00B4D8]` | Fill frozen, "Target Reached" overlay if ≥100% | Interactive cyan signals return to observation. |
| **Error / Alert** | `"{ErrorMessage}"` | `text-[#EF4444]` | Gauge may flash or show error state | Red. Reserved for system faults. |

### 4.1 Transition Rules

State transitions are driven by the protocol layer, not the UI. The UI is a pure renderer of state. When state changes:

1. **Banner** updates text and color immediately (no fade).
2. **Gauge fill** animates via `framer-motion` with `duration: 0.3s`, `ease: "easeOut"`.
3. **Gauge color** interpolates through the ramp — never jumps discretely between colors.
4. **Hero numerals** update in place with `tabular-nums` preventing layout shift. No animation on the numbers themselves.

### 4.2 Gauge Fill Color Logic

```ts
function getGaugeColor(percent: number): string {
  if (percent <= 100) {
    // 0–100%: green → yellow-green → amber
    return formatHex(baseRamp(percent / 100));
  } else {
    // 100%+: amber → red
    const overage = Math.min((percent - 100) / 30, 1); // clamp at 130%
    return formatHex(overageRamp(overage));
  }
}
```

---

## 5. Component Recipes

These are composable rules, not frozen snippets. Each recipe defines the **structure** and **tokens** for a pattern. Adapt content but preserve the token grammar.

### 5.1 Hero Data Block

The primary data display. Used for flow rate, volume, or any single critical value.

```
Structure:
┌─────────────────────────────────────────┐
│  LABEL (unit)                    [▲][▼] │
│                                         │
│       120.0                             │
│                                         │
│  ─────────────────────────────────────  │ ← decorative sub-rule
└─────────────────────────────────────────┘
```

| Element | Tokens |
|:--------|:-------|
| Container | `flex min-w-0 flex-1 flex-col rounded-xl border border-[#2a2a35]/50 bg-[#111118] p-6` |
| Label | `text-lg text-[#C8C8D0]` with unit in `text-sm` |
| Value | `font-bold leading-none text-white tabular-nums` + `fontSize: "120px"` |
| Chevron buttons | `p-1 text-[#00b4d8] hover:text-[#00d4ff]` wrapping icon at `h-10 w-10 strokeWidth={1.5}` |
| Sub-rule | `mt-2 h-0.5 rounded-full bg-[#3a3a45]` |

### 5.2 Telemetry Row

A secondary data pair (e.g., pressure systolic/diastolic). Used in the right-rail stack.

```
Structure:
LABEL
  36    mmHg     24    mmHg
```

| Element | Tokens |
|:--------|:-------|
| Label | `text-lg text-[#C8C8D0]` |
| Value group | `flex items-baseline gap-4` |
| Each value | `text-4xl font-semibold text-white tabular-nums` |
| Each unit | `text-sm text-[#C8C8D0]` (inline after value) |

### 5.3 Linear Gauge

Horizontal volume/progress tracking. No vertical tanks. No skeuomorphic fills.

```
Structure:
┌──────────────────────────────────────────────────┐
│ ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└──────────────────────────────────────────────────┘
              36%  ← floating readout above
```

| Element | Tokens |
|:--------|:-------|
| Track | `relative h-12 rounded-full border border-[#3a3a45] bg-[#000000]` |
| Fill | `absolute inset-y-0 left-0 rounded-full` + `style={{ width: fillPercent, background: gaugeColor }}` |
| Overage fill | `absolute inset-y-1 left-full ml-1 rounded-l-md rounded-r-full` + overage ramp color |
| Percent readout | `absolute -translate-x-1/2 text-4xl font-semibold tabular-nums` + state-driven color |
| "Target Reached" overlay | `pointer-events-none absolute inset-0 flex items-center justify-center` → `text-sm font-semibold tracking-wide text-black` |

### 5.4 Status Banner

Top of the main content area. Shows current operational state plus disarm action.

| Element | Tokens |
|:--------|:-------|
| Container | `mb-6 flex items-center gap-4` |
| Status text | `text-4xl font-semibold` + state color from §4 |
| Disarm action | `flex items-center gap-2 text-[#00b4d8] hover:text-[#00d4ff]` → icon `h-5 w-5` + `text-lg` label |

### 5.5 Action Button (Pill)

Used for Purge, Refill, and other modal actions in the lower zone.

| Element | Tokens |
|:--------|:-------|
| Button | `rounded-lg px-4 py-3 text-lg font-semibold text-white` + context-specific background |
| Purge | `bg-[#0077CC] hover:bg-[#0088DD]` |
| Refill | `bg-[#9933CC] hover:bg-[#aa44dd]` |
| Minimum hit area | `min-h-[48px] min-w-[48px]` (see §6) |

### 5.6 Sidebar Icon Button

Vertical navigation rail. Icon-only buttons.

| Element | Tokens |
|:--------|:-------|
| Button | `p-3` wrapping icon at `h-7 w-7` → computed ~52×52px hit area. |
| Active state | `text-[#00b4d8]` |
| Inactive state | `text-[#8888A0] hover:text-[#C8C8D0]` |

---

## 6. Touch Targets

**Minimum: 48×48px.** This is a hard constraint for a gloved-hand cath lab environment.

### 6.1 Compliant Patterns (preserve as-is)

| Control | Mechanism | Hit Box |
|:--------|:----------|:--------|
| Sidebar icon buttons | `p-3` + `h-7 w-7` icon | ~52×52 ✓ |
| Hero chevron steppers | `p-1` + `h-10 w-10` icon | 48×48 ✓ |
| Contrast drag surface | Full-width on `h-12` track | 48px height ✓ |

### 6.2 Remediation Required

These controls are below 48px in the V1 codebase. **All new code must apply the fix.** Existing code should be patched on contact.

| Control | Current Size | Fix |
|:--------|:-------------|:----|
| X-ray sync switch | 28×56 | Wrap in `min-h-[48px]` container or increase switch height to `h-12 w-14`. |
| Top menu icon button | ~28×28 | Add `p-2.5` padding or wrap in `min-h-[48px] min-w-[48px] flex items-center justify-center`. |
| Top tab text buttons (LCA/RCA/LV-Aorta) | Variable, <48 height | Add `py-3` and `min-h-[48px]`. |
| Disarm / operator text actions | Variable, <48 height | Add `py-2` and `min-h-[48px]`. |
| Purge / Refill pills | ~40–44px | Change `py-2.5` → `py-3` to guarantee ≥48px. |

---

## 7. Principles (Ranked)

These are in priority order. When two principles conflict, the higher-ranked one wins.

1. **Size = Importance.** Primary data must be 4–5× larger than anything else. If you squint, only the critical numbers survive. This overrides aesthetic preferences about spacing or balance.

2. **Visual Hierarchy (Hero vs. Telemetry).** Hero zone (center-left) is for the 1–2 most critical operational values. Telemetry stack (right rail) is for everything else. Data must not "wander" across the center.

3. **Touch Target Compliance.** 48×48px minimum, no exceptions. This overrides visual density preferences.

4. **Linear over Skeuomorphic.** All progress/volume tracking uses horizontal linear gauges. No vertical tanks, circular gauges, or beaker icons.

5. **Anchor, Don't Box (with exceptions).** Prefer negative space and 1px rules over 4-sided containers. Exception: hero data blocks use cards for scannability (see §3.4).

6. **Interactive Gravity.** Cyan interactive elements cluster at edges/bottom. The hero zone is observation-only — no controls inside the value area (chevron steppers are at the card edge, not overlapping the numeral).

---

## 8. File Map

These are the files that matter for any Pulse Hub repo. In a fresh project, §0 creates the first three. In the existing `acist-pro-mockup` repo, they already exist.

| File | Role |
|:-----|:-----|
| `components/BodyScaler.tsx` | Viewport scaling. Created in §0.2. Do not modify unless changing the fixed resolution. |
| `app/layout.tsx` | HTML/body frame, Inter font loading, `BodyScaler` mount. Created in §0.3. |
| `app/globals.css` | Tailwind v4 `@theme` source. Shadcn defaults live here. **Do not add ACIST color tokens here** — use arbitrary classes in component code. |
| `app/page.tsx` | Main screen composition. All medical UI lives here (or in components imported by it). |
| This file (`design-spec-code-v2.md`) | The single source of truth. Supersedes `design-spec.md` for all implementation decisions. |

---

## 9. Checklist: Building a New Screen

When an agent is tasked with creating a new Pulse Hub screen:

- [ ] **Bootstrap is in place** — `BodyScaler` component exists, `layout.tsx` has the fixed `1280×800` body with centering `<html>`, and `npm run dev` shows a scaled centered rectangle (§0).
- [ ] Canvas is `1280×800`. All layout is absolute at this size.
- [ ] Shell uses `base` / `chrome` / `card` background tokens from §1.1. No shadcn variables.
- [ ] Text colors are exact hex values from §1.3. No `text-gray-*` Tailwind classes.
- [ ] All numbers use `tabular-nums`.
- [ ] Hero numeral is `120px` bold (or `140px` for single-value screens).
- [ ] Labels sit above values, with units parenthetical or baseline-aligned.
- [ ] Interactive elements use `interactive` cyan, not blue or teal approximations.
- [ ] Every tappable element is ≥48×48px.
- [ ] Gauges are horizontal linear, using the `culori` oklch ramp from §1.5.
- [ ] State model from §4 is wired — banner text, colors, and gauge behavior respond to state.
- [ ] No vertical tanks, circular gauges, or skeuomorphic fills.
- [ ] Right rail is `w-56` (224px) for telemetry. Hero zone is `flex-1`.
