---
name: cocraft-ui
description: >-
  Design and build dark-mode web applications, landing pages, and agentic workspace interfaces
  matching the CoCraft design system. Features deep obsidian/zinc surfaces, topographic contour textures,
  warm amber accents, Bricolage Grotesque typography, survey-map registration marks, dashed waypoint routes,
  and dual-surface canvas/doc layouts. Use when the user asks to build, restyle, or extend interfaces
  with the CoCraft aesthetic.
---

# CoCraft Design System & UI Skill

The **CoCraft UI** design system is an expedition-inspired, survey-map design language crafted for serious developer tools, AI agentic apps, and productivity platforms. It replaces generic AI tropes (purple gradients, glossy blobs, excessive glows, emoji bullet points) with a tactile, technical, and purposeful cartographic visual identity.

---

## 🎨 Visual Identity & Principles

1. **Dark-Only Deep Obsidian Palette**: Never build a blinding white or muddy gray interface. Use rich, warm obsidian (`#0c0c0e` / `oklch(0.13 0.004 285)`) with subtle alpha borders (`border-white/6`, `border-white/10`).
2. **Solid Amber Accent**: Use warm amber (`oklch(0.74 0.16 55)` / `#f59e0b`) as the solitary accent color. Never use multi-color gradient text. Accentuate single, purposeful words with solid amber.
3. **Cartographic / Survey Map Motifs**:
   - **Topographic Contours (`topo-bg`)**: Background elevation contours masked by radial gradients that glow amber in the center and fade to deep obsidian at the edges.
   - **Survey Frames (`survey-frame`)**: Amber corner registration crosshairs framing hero videos, dashboards, and product mockups.
   - **Numbered Monospace Eyebrows**: Technical section indicators (e.g. `01 · SURFACES`, `02 · THE ROUTE`, `03 · PRICING`) with rotated diamond markers.
   - **Waypoint Trail Routes**: Connected step-by-step instructions styled as waypoints on a dashed survey trail.
4. **Distinctive Typography**:
   - **Headings (h1–h3)**: `Bricolage Grotesque` (`font-heading` / `--font-display`) with optical sizing for punchy, bold character.
   - **Body**: Clean neutral sans-serif (`Geist Sans`).
   - **Technical Meta & Labels**: Monospace (`Geist Mono`).
5. **Quiet Chrome, Rich Content**: Navigation and toolbars stay minimal and quiet (glassmorphic translucent black `bg-background/70 backdrop-blur-md`), letting the live whiteboard canvas and documentation take center stage.

---

## 📐 Color Tokens & Tailwind Classes

| Token | OKLCH / Hex Value | Purpose |
|---|---|---|
| **Background** | `oklch(0.13 0.004 285)` / `#0c0c0e` | Main page and app background |
| **Card Surface** | `oklch(0.17 0.005 285)` / `#141416` | Cards, side panels, and drawers |
| **Primary Accent** | `oklch(0.74 0.16 55)` / `#f59e0b` | Brand accent, active states, key CTAs |
| **Foreground Text** | `oklch(0.97 0.002 285)` / `#fafafa` | Primary headings and high-contrast text |
| **Muted Text** | `oklch(0.65 0.01 285)` / `#a1a1aa` | Secondary body text and labels |
| **Subtle Border** | `border-white/6` to `border-white/10` | Quiet, elegant borders without visual noise |
| **Glass Surface** | `bg-white/2` or `bg-white/3` | Pill switchers and card backdrops |

---

## 🧩 Reusable CoCraft Components (React / Tailwind)

### 1. Survey Section Eyebrow (`SectionLabel`)
```tsx
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-primary/80">
      <span className="size-1.5 rotate-45 border border-primary/70" />
      {children}
    </p>
  );
}
```

### 2. Waypoint Steps Connected by a Trail (`Step`)
```tsx
export function Step({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* Waypoint on a dashed trail */}
      <div className="flex items-center gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-primary/60 font-mono text-[10px] text-primary">
          {number}
        </span>
        <span className="h-px flex-1 border-t border-dashed border-white/15" />
      </div>
      <h3 className="mt-4 font-medium text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
```

### 3. Survey Frame Registration Marks (CSS / Component)
```css
/* Corner crosshairs around framed elements */
.survey-frame {
  position: relative;
}
.survey-frame::before,
.survey-frame::after {
  content: "";
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: oklch(0.74 0.16 55 / 0.6);
  pointer-events: none;
}
.survey-frame::before {
  top: -6px;
  left: -6px;
  border-top: 2px solid;
  border-left: 2px solid;
}
.survey-frame::after {
  bottom: -6px;
  right: -6px;
  border-bottom: 2px solid;
  border-right: 2px solid;
}
```

### 4. Pill Switcher (Personal / Team, Monthly / Annual)
```tsx
export function PillSwitcher<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (val: T) => void;
}) {
  return (
    <div className="mx-auto mb-8 flex w-fit rounded-full border border-white/10 bg-white/3 p-1">
      {options.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => onSelect(value)}
          className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
            selected === value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
```

### 5. Hero Header with Bricolage Grotesque
```tsx
export function HeroHeadline({
  eyebrow,
  leadingText,
  accentWord,
  trailingText,
  subtitle,
}: {
  eyebrow: string;
  leadingText: string;
  accentWord: string;
  trailingText: string;
  subtitle: string;
}) {
  return (
    <div className="mx-auto max-w-4xl text-center">
      <p className="mb-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-primary/80">
        <span className="size-1.5 rotate-45 border border-primary/70" />
        {eyebrow}
      </p>
      <h1 className="font-heading text-4xl font-semibold tracking-tight md:text-6xl text-foreground">
        {leadingText} <span className="text-primary">{accentWord}</span> {trailingText}
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
}
```

---

## 🚫 What NOT to Do (Anti-Patterns)

- ❌ **No Purple/Pink Gradient Text**: Never use `bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent`. Use solid amber (`text-primary`) on selected key terms.
- ❌ **No Floating Glow Blobs**: Avoid blurry radial divs (`blur-3xl bg-purple-500/20`) floating in empty space. Use structured SVG contours (`topo-bg`).
- ❌ **No Emoji Overload**: Avoid `✨ New Feature! 🚀` badges. Use technical monospace tags with diamond markers (`01 · SURFACES`).
- ❌ **No Muddy Light Mode**: The CoCraft aesthetic is strictly dark-mode first.
- ❌ **No Thick Clunky Borders**: Avoid `border-2 border-gray-700`. Use translucent `border border-white/10` or `border-white/6`.
