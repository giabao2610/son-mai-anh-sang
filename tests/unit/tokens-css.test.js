import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PALETTE, cssVarName } from '../../src/engine/palette.js';

const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');

// Mọi khai báo dạng `--ten-bien: #RRGGBB;` trong tokens.css → { '--ten-bien': '#RRGGBB' }.
const declared = Object.fromEntries(
  [...css.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{6})\s*;/g)].map(([, name, hex]) => [name, hex]),
);

describe('styles/tokens.css khớp engine/palette.js', () => {
  it('các biến màu nằm trong khối :root', () => {
    expect(css).toMatch(/:root\s*\{/);
  });

  it.each(Object.entries(PALETTE))('%s có trong tokens.css với đúng mã %s', (token, hex) => {
    const name = cssVarName(token);
    expect(declared[name], `tokens.css thiếu ${name}`).toBeDefined();
    expect(declared[name].toUpperCase()).toBe(hex.toUpperCase());
  });

  it('tokens.css không có màu nào mà bảng màu không biết', () => {
    const known = Object.keys(PALETTE).map(cssVarName);
    expect(Object.keys(declared).filter((name) => !known.includes(name))).toEqual([]);
  });
});
