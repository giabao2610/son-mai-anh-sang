// tests/unit/sma.test.js — window.__sma: bảng trạng thái công khai của trang
import { describe, it, expect } from 'vitest';
import { createSma } from '../../src/engine/sma.js';

const INITIAL = { state: 'poster', tier: null, backend: null, level: null, frames: 0, reason: null, error: null };

describe('createSma', () => {
  it('gắn vào win.__sma với trạng thái đầu', () => {
    const win = {};
    const sma = createSma(win);
    expect(win.__sma).toBe(sma);
    expect(sma).toMatchObject(INITIAL);
  });

  it('set() ghép từng phần, frame() đếm khung', () => {
    const sma = createSma({});
    sma.set({ state: 'live', backend: 'webgl2' });
    sma.set({ level: 'vua' });
    sma.frame();
    sma.frame();
    sma.frame();
    expect(sma).toMatchObject({ state: 'live', tier: null, backend: 'webgl2', level: 'vua', frames: 3 });
  });

  it('JSON chỉ còn dữ liệu (e2e đọc qua page.evaluate)', () => {
    const sma = createSma({});
    expect(JSON.parse(JSON.stringify(sma))).toEqual(INITIAL);
  });
});
