import { GeoShapeUtil, ArrowShapeUtil, type Editor, type TLGeoShape, type TLArrowShape } from "tldraw";

// Excalidraw-style rich fill colors for dark mode and light mode.
// On dark mode canvases, shapes feature a crisp white/light outline
// with a colored interior fill (semi/solid), matching Excalidraw's signature aesthetic.
export const EXCALIDRAW_DARK_FILLS: Record<string, string> = {
  blue: "rgba(30, 64, 175, 0.40)",
  "light-blue": "rgba(14, 116, 144, 0.40)",
  green: "rgba(20, 83, 45, 0.45)",
  "light-green": "rgba(22, 101, 52, 0.40)",
  orange: "rgba(154, 52, 18, 0.40)",
  yellow: "rgba(142, 85, 3, 0.40)",
  violet: "rgba(88, 28, 135, 0.40)",
  "light-violet": "rgba(107, 33, 168, 0.40)",
  red: "rgba(153, 27, 27, 0.40)",
  "light-red": "rgba(185, 28, 28, 0.40)",
  grey: "rgba(51, 65, 85, 0.45)",
  black: "rgba(15, 23, 42, 0.70)",
  white: "rgba(255, 255, 255, 0.12)",
};

export const EXCALIDRAW_LIGHT_FILLS: Record<string, string> = {
  blue: "rgba(219, 234, 254, 0.85)",
  "light-blue": "rgba(224, 242, 254, 0.85)",
  green: "rgba(220, 252, 231, 0.85)",
  "light-green": "rgba(240, 253, 244, 0.85)",
  orange: "rgba(255, 237, 213, 0.85)",
  yellow: "rgba(254, 249, 195, 0.85)",
  violet: "rgba(243, 232, 255, 0.85)",
  "light-violet": "rgba(250, 245, 255, 0.85)",
  red: "rgba(254, 226, 226, 0.85)",
  "light-red": "rgba(255, 241, 242, 0.85)",
  grey: "rgba(241, 245, 249, 0.85)",
  black: "rgba(226, 232, 240, 0.85)",
  white: "#ffffff",
};

export const CustomGeoShapeUtil = GeoShapeUtil.configure({
  getCustomDisplayValues(_editor: Editor, shape: TLGeoShape, _theme: unknown, colorMode: "dark" | "light") {
    const isDark = colorMode === "dark";
    const color = shape.props.color ?? "blue";
    const fill = shape.props.fill ?? "solid";

    // Crisp outline: in dark mode, crisp white (#f8fafc); in light mode, clean dark slate (#1e293b).
    const strokeColor = isDark ? "#f8fafc" : "#1e293b";

    // Fill color: internal color fill like Excalidraw, rather than outline-only color.
    const fillColor =
      fill === "none"
        ? "transparent"
        : isDark
        ? (EXCALIDRAW_DARK_FILLS[color] ?? "rgba(51, 65, 85, 0.45)")
        : (EXCALIDRAW_LIGHT_FILLS[color] ?? "rgba(241, 245, 249, 0.85)");

    const labelColor = isDark ? "#f8fafc" : "#0f172a";

    return {
      strokeColor,
      strokeWidth: 2,
      strokeRoundness: 6,
      fillColor,
      patternFillFallbackColor: fillColor,
      labelColor,
    };
  },
});

export const CustomArrowShapeUtil = ArrowShapeUtil.configure({
  getCustomDisplayValues(_editor: Editor, _shape: TLArrowShape, _theme: unknown, colorMode: "dark" | "light") {
    const isDark = colorMode === "dark";
    return {
      strokeColor: isDark ? "#cbd5e1" : "#475569",
      strokeWidth: 2,
      labelColor: isDark ? "#f8fafc" : "#0f172a",
    };
  },
});
