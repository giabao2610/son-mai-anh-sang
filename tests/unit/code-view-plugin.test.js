// tests/unit/code-view-plugin.test.js — plugin ?code: bảng núm → dòng, theme sơn mài đủ tương phản, HTML có data-line.
import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { codeView, knobLines, lacquerTheme } from '../../plugins/vite-plugin-code-view.js';
import { PALETTE } from '../../src/engine/palette.js';

/** Độ sáng tương đối WCAG 2 của một màu '#rrggbb'. */
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('knobLines', () => {
  it('dòng (từ 1) của mọi marker // @knob; một núm có thể nằm ở nhiều dòng', () => {
    const source = [
      "const a = ctx.knob('size'); // @knob size",
      'const b = 1;',
      "const c = x.mul(ctx.knob('exposure')); // @knob exposure",
      "const d = agx(h, e); // @knob exposure",
    ].join('\n');
    expect(knobLines(source)).toEqual({ size: [1], exposure: [3, 4] });
    expect(knobLines('const x = 1;')).toEqual({});
  });
});

describe('lacquerTheme', () => {
  it('nền đen then, chữ ngà; mọi màu chữ đạt tương phản ≥ 4.5:1 trên nền', () => {
    const theme = lacquerTheme();
    expect(theme.colors['editor.background']).toBe(PALETTE.denThen);
    const colors = [theme.colors['editor.foreground'], ...theme.tokenColors.map((r) => r.settings.foreground)];
    for (const c of colors) expect(contrast(c, PALETTE.denThen), c).toBeGreaterThanOrEqual(4.5);
  });
});

describe('codeView (plugin Vite)', () => {
  const plugin = codeView();
  const file = fileURLToPath(new URL('../../src/engine/stock/phu-bong/layer.js', import.meta.url));

  it('chỉ nhận id có đúng hậu tố ?code', async () => {
    expect(await plugin.load(file)).toBeNull();
    expect(await plugin.load(`${file}?raw`)).toBeNull();
  });

  it('?code → module { html, knobs }: mỗi dòng một span có data-line, đủ số dòng, bảng núm khớp marker', async () => {
    const out = await plugin.load(`${file}?code`);
    const json = JSON.parse(out.replace(/^export default /, '').replace(/;$/, ''));
    const source = readFileSync(file, 'utf8');
    expect(json.knobs).toEqual(knobLines(source));
    expect(json.html.startsWith('<pre class="shiki son-mai"')).toBe(true);
    const lines = [...json.html.matchAll(/<span class="line" data-line="(\d+)"/g)].map((m) => Number(m[1]));
    expect(lines).toEqual(Array.from({ length: source.split('\n').length }, (_, i) => i + 1));
    expect(json.html).not.toContain('<script');
  }, 20_000);
});
