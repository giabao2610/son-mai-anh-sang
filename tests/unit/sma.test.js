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

describe('sma.expose (GĐ 2)', () => {
  it('gắn hàm của bàn thợ; JSON vẫn chỉ có dữ liệu', () => {
    const win = {};
    const sma = createSma(win);
    const setWeight = () => {};
    sma.expose({ layers: () => [], setWeight });
    expect(win.__sma.setWeight).toBe(setWeight);
    expect(typeof win.__sma.layers).toBe('function');
    expect(JSON.parse(JSON.stringify(sma))).toEqual(INITIAL);
  });

  it('hàm gỡ chỉ gỡ đúng các hàm đã gắn: lần dựng lại cảnh gắn hàm mới thì lần gỡ cũ không đụng tới', () => {
    const sma = createSma({});
    const unexposeOld = sma.expose({ setWeight: () => 'cũ', snapshot: () => 'cũ' });
    const fresh = () => 'mới';
    sma.expose({ setWeight: fresh });
    unexposeOld();
    expect(sma.setWeight).toBe(fresh);
    expect(sma.snapshot).toBeUndefined();
  });
});
