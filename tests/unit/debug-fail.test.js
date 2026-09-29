// tests/unit/debug-fail.test.js — chế độ thợ tải hỏng (mạng, chunk cũ sau deploy): openDebug trả null, không ném lỗi.
import { describe, it, expect, vi } from 'vitest';
import { openDebug } from '../../src/engine/gpu/debug.js';

// Cả hai công cụ đều "tải hỏng": import() ném lỗi như khi chunk không còn trên máy chủ.
vi.mock('stats-gl', () => {
  throw new Error('Failed to fetch dynamically imported module: main-abc.js');
});
vi.mock('three/addons/inspector/Inspector.js', () => {
  throw new Error('Failed to fetch dynamically imported module: Inspector-abc.js');
});

describe('openDebug', () => {
  it.each([['stats'], [true]])('?debug (%s) tải hỏng → cảnh báo rồi trả null, cảnh vẫn chạy', async (mode) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(openDebug(mode, {}, { body: { append() {} } })).resolves.toBeNull();
    expect(warn).toHaveBeenCalledWith('Không mở được công cụ ?debug:', expect.any(Error));
    warn.mockRestore();
  });

  it('không có cờ → null, không tải gì', async () => {
    await expect(openDebug(false, {})).resolves.toBeNull();
  });
});
