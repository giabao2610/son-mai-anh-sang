import { describe, it, expect, vi } from 'vitest';
import { createDisposer } from '../../src/engine/gpu/disposer.js';

describe('createDisposer', () => {
  it('closed là false trước khi closeAll()', () => {
    expect(createDisposer().closed).toBe(false);
  });

  it('add() trả lại đúng hàm đã nhận', () => {
    const d = createDisposer();
    const fn = () => {};
    expect(d.add(fn)).toBe(fn);
  });

  it('gỡ theo thứ tự NGƯỢC với lúc đăng ký', () => {
    const d = createDisposer();
    const order = [];
    d.add(() => order.push('stage'));
    d.add(() => order.push('lop'));
    d.add(() => order.push('pipeline'));
    d.closeAll();
    expect(order).toEqual(['pipeline', 'lop', 'stage']);
    expect(d.closed).toBe(true);
  });

  it('closeAll() gọi nhiều lần chỉ gỡ một lần', () => {
    const d = createDisposer();
    const fn = vi.fn();
    d.add(fn);
    d.closeAll();
    d.closeAll();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('một hàm gỡ ném lỗi thì ghi log.error rồi gỡ tiếp phần còn lại', () => {
    const log = { error: vi.fn() };
    const d = createDisposer({ log });
    const first = vi.fn();
    d.add(first);
    d.add(() => {
      throw new Error('hỏng');
    });
    d.closeAll();
    expect(first).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(d.closed).toBe(true);
  });

  it('mặc định ghi lỗi ra console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const d = createDisposer();
    d.add(() => {
      throw new Error('hỏng');
    });
    d.closeAll();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('add() sau khi đã đóng thì chạy hàm NGAY (phần khởi động xong trễ tự dọn)', () => {
    const log = { error: vi.fn() };
    const d = createDisposer({ log });
    d.closeAll();
    const late = vi.fn();
    expect(d.add(late)).toBe(late);
    expect(late).toHaveBeenCalledTimes(1);
    d.add(() => {
      throw new Error('muộn và hỏng');
    });
    expect(log.error).toHaveBeenCalledTimes(1);
  });

  it('hàm được add() trong lúc đang gỡ cũng chạy ngay', () => {
    const d = createDisposer();
    const inner = vi.fn();
    d.add(() => d.add(inner));
    d.closeAll();
    expect(inner).toHaveBeenCalledTimes(1);
  });

  it('add() với thứ không phải hàm thì ném TypeError', () => {
    expect(() => createDisposer().add(null)).toThrow(TypeError);
  });
});
