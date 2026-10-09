// tests/unit/sma.test.js — window.__sma: bảng trạng thái công khai của trang
import { describe, it, expect } from 'vitest';
import { createSma, studioApi } from '../../src/engine/sma.js';

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

describe('studioApi (GĐ 4): các hàm của bàn thợ mà __sma lộ ra', () => {
  it('luôn đọc bàn thợ HIỆN TẠI; chưa có bàn thợ (mất GPU) thì trả null hay mảng rỗng, không ném', async () => {
    let studio = null;
    const api = studioApi(() => studio);
    expect([api.layers(), api.snapshot(), api.quality(), api.stats(), api.setWeight('x', 0)]).toEqual([[], null, null, null, undefined]);
    expect([api.tools(), api.setTool('kinh'), api.dials(), api.setDial('gio', 27)]).toEqual([[], undefined, [], undefined]);
    studio = {
      layers: () => [{ id: 'cot', name: 'Cốt', knobs: [] }],
      weight: () => ({ value: 1, target: 1 }),
      stats: () => ({ gpuMs: 4 }),
      quality: () => ({ gpu: true, locked: ['dpr=1.5'] }),
      tools: () => [{ id: 'kinh', on: false }],
    };
    expect(api.layers()).toEqual([{ id: 'cot', name: 'Cốt', weight: 1 }]);
    expect(api.stats().gpuMs).toBe(4);
    expect(api.quality().locked).toEqual(['dpr=1.5']);
    expect(api.tools()).toEqual([{ id: 'kinh', on: false }]);
  });

  it('translate(id) (GĐ 9): Bản dịch của một lớp qua bàn thợ, trả đúng Promise (page.evaluate chờ được); chưa có bàn thợ thì null', async () => {
    let studio = null;
    const api = studioApi(() => studio);
    expect(api.translate('hai')).toBeNull();
    const asked = [];
    studio = {
      translation: async (layerId) => {
        asked.push(layerId);
        return { language: 'glsl', places: [] };
      },
    };
    await expect(api.translate('hai')).resolves.toEqual({ language: 'glsl', places: [] });
    expect(asked).toEqual(['hai']);
  });

  it('readouts(id) (GĐ 5): số đo riêng của một lớp, đọc qua bàn thợ; chưa có bàn thợ thì mảng rỗng', () => {
    let studio = null;
    const api = studioApi(() => studio);
    expect(api.readouts('hai')).toEqual([]);
    const asked = [];
    studio = {
      readouts: (layerId) => {
        asked.push(layerId);
        return [{ id: 'dinh', value: 42, unit: 'đỉnh' }];
      },
    };
    expect(api.readouts('hai')).toEqual([{ id: 'dinh', value: 42, unit: 'đỉnh' }]);
    expect(asked).toEqual(['hai']);
  });
});
