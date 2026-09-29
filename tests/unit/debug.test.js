// tests/unit/debug.test.js — chế độ thợ: không có cờ ?debug thì không tải gì (người xem thường không tốn byte nào).
import { describe, it, expect, vi } from 'vitest';
import { mountDebug } from '../../src/engine/gpu/debug.js';

// Hai công cụ thật cần DOM và GPU. Bản giả giữ đúng một tác dụng phụ đã đọc trong mã nguồn:
// stats-gl 4.2.3 (dist/core.js, handleWebGPURenderer) và three r186 Inspector (init, chạy khi gán renderer.inspector)
// đều bật renderer.backend.trackTimestamp = true mà không hỏi máy có 'timestamp-query' không.
vi.mock('stats-gl', () => ({
  default: class {
    constructor() {
      this.dom = { dataset: {}, remove() {} };
    }
    async init(renderer) {
      renderer.backend.trackTimestamp = true;
    }
    update() {}
    dispose() {}
  },
}));
vi.mock('three/addons/inspector/Inspector.js', () => ({
  Inspector: class {
    constructor() {
      this.domElement = { dataset: {}, remove() {} };
    }
    dispose() {}
  },
}));

/** Renderer giả: gán inspector thì trackTimestamp bật (như r186); hasFeature theo máy. */
function fakeRenderer(timestamps) {
  const backend = { trackTimestamp: false };
  return {
    backend,
    hasFeature: (name) => name === 'timestamp-query' && timestamps,
    resolveTimestampsAsync: async () => {},
    set inspector(value) {
      backend.trackTimestamp = true;
    },
  };
}
const doc = { body: { append: vi.fn() } };

describe('mountDebug', () => {
  it('không có cờ ?debug → null, không đụng tới renderer', async () => {
    const renderer = new Proxy({}, { get: (_, key) => { throw new Error(`không được đọc renderer.${String(key)}`); } });
    expect(await mountDebug(false, renderer)).toBeNull();
  });

  it.each([['stats'], [true]])(
    '?debug (%s) trên máy không có timestamp-query → tắt đo thời gian GPU, không để WebGPU báo lỗi mỗi khung',
    async (mode) => {
      const renderer = fakeRenderer(false);
      const tool = await mountDebug(mode, renderer, doc);
      expect(renderer.backend.trackTimestamp).toBe(false);
      tool.dispose();
    },
  );

  it('máy có timestamp-query → giữ đo thời gian GPU', async () => {
    const renderer = fakeRenderer(true);
    await mountDebug('stats', renderer, doc);
    expect(renderer.backend.trackTimestamp).toBe(true);
  });
});

describe('mountDebug · Inspector', () => {
  it('dời bảng của Inspector ra body (cha của canvas là stacking context nằm dưới lớp chữ)', async () => {
    doc.body.append.mockClear();
    const tool = await mountDebug(true, fakeRenderer(true), doc);
    expect(doc.body.append).toHaveBeenCalledTimes(1);
    expect(doc.body.append.mock.calls[0][0].dataset.debug).toBe('inspector');
    tool.dispose();
  });
});
