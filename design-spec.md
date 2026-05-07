# Pulse Hub Design Language (V2 - Refined)

A dark-mode medical instrument aesthetic — **aviation glass cockpit meets cath lab.** Every screen built for Pulse Hub should feel like it belongs on the same device as the ACIST Pro, without copying its layout.

---

## 🎨 Palette

### Backgrounds
Near-black with a cool blue undertone. Depth is created through **Surface Anchoring** rather than physical layering.

| Role            | Hex         | Notes                                                                 |
|:----------------|:------------|:----------------------------------------------------------------------|
| **Base** | `#0A0A0F`   | Deepest layer.                                                        |
| **Hero Anchor** | *Gradient* | `#0A0A0F` to `#16161C` (Vertical). Used only for primary data zones. |
| **Subtle Sep.** | `#2A2A35`   | Used for 1px bottom-rules or L-brackets.                              |

### Text
High-contrast data vs. low-contrast metadata.

| Role                 | Hex         |
|:---------------------|:------------|
| **Primary (values)** | `#FFFFFF`   |
| **Secondary (labels)**| `#C8C8D0`   |
| **Tertiary (meta)** | `#8888A0`   |

### Accents
Cyan is the universal interactive color. Status colors appear only for system state.

| Role                 | Hex         |
|:---------------------|:------------|
| **Interactive** | `#00B4D8`   |
| **Action Button** | `#0077CC`   |
| **Ready** | `#00CC66`   |
| **Warning/Confirm** | `#E6A817`   |
| **Injecting** | `#9933CC`   |

---

## 🔡 Typography

**Inter** — all weights. Tabular figures (`'tnum'`) on all numbers.

* **Hero Numerals:** `120–140px`, **Bold**. The defining signature — oversized enough to read from across a cath lab.
* **Labels:** `16–22px`, **Regular**. Labels sit *above* the value or are integrated into the string (e.g., "LABEL (unit)").
* **Units:** `14–18px`, baseline-aligned with the value or tucked into the label. Never float units in isolation.

---

## 💎 Principles

1.  **Anchor, Don't Box.**
    Avoid 4-sided containers. Group data using **Negative Space** and 1px "L-brackets" or bottom-rules. Primary data should appear to "float" on the Hero Anchor gradient.

2.  **Visual Hierarchy (Hero vs. Telemetry).**
    * **Hero Zone:** (Center-Left) Reserved for the two most critical operational values.
    * **Telemetry Stack:** (Right Rail) Secondary data, toggles, and history are stacked vertically. This prevents data from "wandering" across the center of the screen.

3.  **Size = Importance.**
    Primary data should be **4–5× larger** than anything else. If you squint, only the critical numbers should survive.

4.  **Linear over Skeuomorphic.**
    All progress or volume tracking must use **horizontal linear gauges**. Avoid vertical "tank" or "beaker" icons which consume excessive vertical space.

5.  **Interactive Gravity.**
    Interactive elements (Cyan) should be clustered at the edges or bottom of the screen to keep the "Hero Zone" purely for observation.

---

## 🛠 Environment Constraints

* **Canvas:** 1423×800, landscape, touch.
* **Touch Targets:** 48×48px minimum.
* **Lighting:** Optimized for dimmed cath lab. Dark background prevents wash-out under surgical lights.
