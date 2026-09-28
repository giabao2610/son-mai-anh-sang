// tests/unit/debug.test.js — chế độ thợ: không có cờ ?debug thì không tải gì (người xem thường không tốn byte nào).
import { describe, it, expect } from 'vitest';
import { mountDebug } from '../../src/engine/gpu/debug.js';

describe('mountDebug', () => {
  it('không có cờ ?debug → null, không đụng tới renderer', async () => {
    const renderer = new Proxy({}, { get: (_, key) => { throw new Error(`không được đọc renderer.${String(key)}`); } });
    expect(await mountDebug(false, renderer)).toBeNull();
  });
});
