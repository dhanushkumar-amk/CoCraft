// BlockNote's built-in "dark" theme ships its own (brownish) palette, not ours — override with
// the app's actual tokens from globals.css so the doc panel matches the rest of the UI exactly.
export const cocraftDarkTheme = {
  colors: {
    editor: { text: "oklch(0.98 0 0)", background: "oklch(0.12 0 0)" },
    menu: { text: "oklch(0.98 0 0)", background: "oklch(0.17 0 0)" },
    tooltip: { text: "oklch(0.98 0 0)", background: "oklch(0.17 0 0)" },
    hovered: { text: "oklch(0.98 0 0)", background: "oklch(0.24 0 0)" },
    selected: { text: "oklch(0.98 0 0)", background: "oklch(0.32 0 0)" },
    disabled: { text: "oklch(0.72 0 0)", background: "oklch(0.24 0 0)" },
    shadow: "oklch(0 0 0 / 30%)",
    border: "oklch(1 0 0 / 10%)",
    sideMenu: "oklch(0.72 0 0)",
    highlights: {
      gray: { text: "oklch(0.85 0 0)", background: "oklch(0.28 0 0)" },
      brown: { text: "oklch(0.88 0.05 45)", background: "oklch(0.32 0.05 45)" },
      red: { text: "oklch(0.92 0.15 25)", background: "oklch(0.35 0.14 25)" },
      orange: { text: "oklch(0.92 0.15 65)", background: "oklch(0.35 0.14 65)" },
      yellow: { text: "oklch(0.95 0.16 95)", background: "oklch(0.38 0.14 95)" },
      green: { text: "oklch(0.92 0.15 145)", background: "oklch(0.35 0.14 145)" },
      blue: { text: "oklch(0.92 0.15 240)", background: "oklch(0.35 0.14 240)" },
      purple: { text: "oklch(0.92 0.15 290)", background: "oklch(0.35 0.14 290)" },
      pink: { text: "oklch(0.92 0.15 340)", background: "oklch(0.35 0.14 340)" },
    },
  },
  borderRadius: 8,
  fontFamily: "var(--font-geist-sans)",
};

export const outpostDarkTheme = cocraftDarkTheme;
