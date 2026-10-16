"use client";

/**
 * DotSeek design tokens for canvas charts: read once from the CSS custom
 * properties (charts can't use var() directly), so charts match the admin UI.
 */
export type Palette = {
  brand: string;
  brandStrong: string;
  info: string;
  success: string;
  warning: string;
  neutral: string;
  text: string;
  muted: string;
  subtle: string;
  border: string;
  borderStrong: string;
  surface: string;
  elevated: string;
  sunken: string;
  font: string;
};

let cached: Palette | null = null;

export function palette(): Palette {
  if (cached) return cached;
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  cached = {
    brand: v("--ds-color-brand", "#ecf15e"),
    brandStrong: v("--ds-color-brand-strong", "#dfe53b"),
    info: v("--ds-color-info", "#7aa2ff"),
    success: v("--ds-color-success", "#34d399"),
    warning: v("--ds-color-warning", "#f5a524"),
    neutral: v("--ds-color-chart-neutral", "#6b7280"),
    text: v("--ds-color-text", "#f5f5f5"),
    muted: v("--ds-color-text-muted", "#a3a3a3"),
    subtle: v("--ds-color-text-subtle", "#737373"),
    border: v("--ds-color-border", "#1f2125"),
    borderStrong: v("--ds-color-border-strong", "#2a2c30"),
    surface: v("--ds-color-surface", "#121316"),
    elevated: v("--ds-color-surface-elevated", "#1a1c20"),
    sunken: v("--ds-color-surface-sunken", "#0d0e11"),
    font: getComputedStyle(document.body).fontFamily || "sans-serif",
  };
  return cached;
}

/** rgba() from a hex token, for soft fills and fades. */
export function alpha(hex: string, a: number) {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return hex;
  return `rgba(${parseInt(m[1]!, 16)}, ${parseInt(m[2]!, 16)}, ${parseInt(m[3]!, 16)}, ${a})`;
}

/** Shared tooltip look: elevated surface, hairline border, soft shadow. */
export function tooltipBase(p: Palette) {
  return {
    backgroundColor: p.elevated,
    borderColor: p.borderStrong,
    borderWidth: 1,
    padding: [10, 12],
    textStyle: { color: p.text, fontFamily: p.font, fontSize: 12 },
    extraCssText: "border-radius: 10px; box-shadow: 0 14px 34px rgba(0,0,0,.42);",
    confine: true,
    enterable: false,
    transitionDuration: 0.15,
  };
}
