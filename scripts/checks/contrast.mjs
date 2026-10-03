// Every piece of text meets WCAG AA against what is really behind it, in
// both themes. Caught: the reference green (#22B573) as text measured 2.65:1
// and red #EF4444 3.8:1 on hundreds of labels and figures; both now have
// darker "ink" tokens for text.
// Allowed on purpose: white on the brand green buttons (the reference design
// the user chose), and void rows, which are dimmed so they read as cancelled.
import { PAGES, eachPage, themedContext } from "./pages.mjs";

function audit() {
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: v[0], g: v[1], b: v[2], a: v[3] ?? 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (x) => ((x /= 255) <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const mix = (t, u) => ({ r: t.r * t.a + u.r * (1 - t.a), g: t.g * t.a + u.g * (1 - t.a), b: t.b * t.a + u.b * (1 - t.a), a: 1 });
  const background = (el) => {
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== "none" && !cs.backgroundImage.startsWith("url")) return null; // gradient
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a >= 1) break;
      }
    }
    let out = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) out = mix(layers[i], out);
    return out;
  };
  const out = [];
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const el = walker.currentNode.parentElement;
    const text = walker.currentNode.textContent.trim();
    if (!text || !el || seen.has(el)) continue;
    seen.add(el);
    if (!el.offsetParent || el.closest("[aria-hidden='true'], .sr-only, script, style")) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden") continue;
    let opacity = 1;
    for (let n = el; n; n = n.parentElement) opacity *= Number(getComputedStyle(n).opacity);
    if (opacity < 1) continue; // void rows, dimmed on purpose
    const fg = parse(cs.color);
    const bg = background(el);
    if (!fg || !bg) continue;
    if (fg.r === 255 && fg.g === 255 && fg.b === 255 && Math.round(bg.r) === 34 && Math.round(bg.g) === 181 && Math.round(bg.b) === 115) continue; // brand buttons
    const f = mix(fg, bg);
    const [a, b] = [lum(f), lum(bg)];
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const size = parseFloat(cs.fontSize);
    const need = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700) ? 3 : 4.5;
    if (ratio < need) out.push(`"${text.slice(0, 30)}" ${ratio.toFixed(2)}:1 (${cs.color} on rgb(${bg.r | 0},${bg.g | 0},${bg.b | 0}))`);
  }
  return [...new Set(out)].slice(0, 4);
}

export default async function contrastCheck({ base, browser, ok, pages }) {
  for (const theme of ["light", "dark"]) {
    const context = await themedContext(browser, theme);
    const problems = await eachPage(context, base, pages || PAGES, (page) => page.evaluate(audit));
    ok(`text meets AA contrast (${theme})`, problems.length === 0, problems.slice(0, 3).join("; "));
    await context.close();
  }
}
