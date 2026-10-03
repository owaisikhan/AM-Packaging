// Colour helpers shared by the contrast checks (WCAG relative luminance).
export function parseColor(c) {
  const m = String(c).match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
  return { r: v[0], g: v[1], b: v[2], a: v[3] ?? 1 };
}

function luminance({ r, g, b }) {
  const f = (x) => {
    x /= 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
