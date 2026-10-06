// tests/unit/particles.test.js — bể hạt dùng chung (lib/tsl/particles.js, GĐ 8): cấp phát một lần; sàn của count; không bước khi dt = 0 hay trọng số 0; WebGL2 khởi tạo hai lần; vòng đệm của emit; hàng đợi có trần; dịch được ở hai backend.
import { describe, it, expect, vi } from 'vitest';
import { float, vec3, vec4 } from 'three/tsl';
import { COUNT_FLOOR, createPool } from '../../src/lib/tsl/particles.js';
import { compileCompute } from '../helpers/nodes.js';

const init = ({ a, b }) => {
  a.assign(vec4(0));
  b.assign(vec4(0));
};
const law = ({ a, b }) => {
  a.assign(vec4(a.xyz.add(b.xyz), a.w));
  b.assign(b);
};
const spawn = ({ a, b, k, batch }) => {
  a.assign(vec4(batch.origin, float(k)));
  b.assign(vec4(vec3(0, 1, 0), batch.seed));
};
const make = (options = {}) => {
  const renderer = { compute: vi.fn() };
  const pool = createPool({ capacity: 1000, count: 300, init, law, spawn, tier: 'webgpu', renderer, ...options });
  return { renderer, pool };
};
const ORIGIN = [0, 0, 0];

describe('createPool', () => {
  it('cấp phát MỘT lần theo capacity: hai bộ đệm vec4; đổi count không tạo bộ đệm mới', () => {
    const { pool } = make();
    const a = pool.a.value;
    expect([a.count, pool.b.value.count, a.itemSize]).toEqual([1000, 1000, 4]);
    pool.setCount(900);
    expect(pool.a.value).toBe(a);
  });

  it('setCount: sàn COUNT_FLOOR (100), trần capacity; đổi count của compute bước và của mọi vật vẽ truyền vào', () => {
    const { pool } = make();
    const sprite = { count: 0 };
    expect(pool.setCount(5, sprite)).toBe(COUNT_FLOOR);
    expect(sprite.count).toBe(100);
    expect(pool.setCount(5000, sprite)).toBe(1000);
    expect([pool.count, pool.stepNode.count, sprite.count]).toEqual([1000, 1000, 1000]);
  });

  it('khởi tạo ngay lúc dựng: WebGPU một lần, WebGL2 hai lần (cả hai bản ping-pong có dữ liệu, Phụ lục A.29)', () => {
    expect(make().renderer.compute).toHaveBeenCalledTimes(1);
    expect(make({ tier: 'webgl2' }).renderer.compute).toHaveBeenCalledTimes(2);
  });

  it('step: không chạy khi dt = 0 (update(0, t) của ?freeze) hay trọng số ≤ 0; có thì chạy đúng một compute bước', () => {
    const { pool, renderer } = make();
    renderer.compute.mockClear();
    expect(pool.step(0, 1)).toBe(false);
    expect(pool.step(1 / 60, 0)).toBe(false);
    expect(renderer.compute).not.toHaveBeenCalled();
    expect(pool.step(1 / 60, 1)).toBe(true);
    expect(renderer.compute).toHaveBeenCalledExactlyOnceWith(pool.stepNode);
  });

  it('emit: nắm nối tiếp trên vòng đệm của số phần tử đang tính, quấn qua cuối; nắm lớn hơn bể thì cắt; mỗi bước một nắm', () => {
    const { pool } = make();
    expect(pool.emit({ origin: ORIGIN, count: 120, seed: 1 })).toEqual({ start: 0, size: 120 });
    expect(pool.emit({ origin: ORIGIN, count: 120, seed: 2 })).toEqual({ start: 120, size: 120 });
    expect(pool.emit({ origin: ORIGIN, count: 120, seed: 3 })).toEqual({ start: 240, size: 120 }); // 240 + 120 quấn về 60
    expect(pool.emit({ origin: ORIGIN, count: 999, seed: 4 })).toEqual({ start: 60, size: 300 });
    pool.step(1 / 60, 1);
    expect([pool.batch.start.value, pool.batch.count.value, pool.batch.seed.value]).toEqual([0, 120, 1]);
    pool.step(1 / 60, 1);
    expect([pool.batch.start.value, pool.batch.seed.value]).toEqual([120, 2]);
    for (let i = 0; i < 3; i += 1) pool.step(1 / 60, 1);
    expect(pool.batch.count.value).toBe(0); // hết hàng đợi: không phần tử nào khởi tạo lại
    expect(pool.emitted()).toBe(300); // số phần tử đã rắc còn trong vòng đệm: không quá số đang tính
  });

  it('chạm dồn lúc khung đứng: hàng đợi giữ tối đa 16 nắm (bỏ nắm cũ nhất); đổi count giữa chừng thì đầu nắm vẫn trong vòng', () => {
    const { pool } = make();
    for (let i = 0; i < 40; i += 1) pool.emit({ origin: ORIGIN, count: 10, seed: i });
    pool.setCount(100);
    pool.step(1 / 60, 1);
    expect(pool.batch.seed.value).toBe(24); // 40 − 16
    expect(pool.batch.start.value).toBeLessThan(100);
  });

  it('bể không có spawn thì không rắc được (lỗi tiếng Việt); nắm 0 hạt không vào hàng đợi', () => {
    expect(() => make({ spawn: null }).pool.emit({ origin: ORIGIN, count: 10, seed: 1 })).toThrow(/spawn/);
    expect(make().pool.emit({ origin: ORIGIN, count: 0, seed: 1 })).toBeNull();
  });

  it.each(['webgpu', 'webgl2'])('%s: compute bước dịch được, có nhánh rắc (phép chia lấy dư trên chỉ số) đọc đầu và cỡ của nắm', (backend) => {
    const { pool } = make({ tier: backend });
    // Hộp màu không đặt tên uniform (một bức có thể dựng hai bể): test đặt tên để tìm hai uniform của nắm trong mã sinh ra.
    pool.batch.start.setName('batchStart');
    pool.batch.count.setName('batchCount');
    const { code, problems, uniforms } = compileCompute(pool.stepNode, backend);
    expect(problems).toEqual([]);
    expect(code).toMatch(/%/);
    expect(uniforms).toEqual(expect.arrayContaining(['batchStart', 'batchCount']));
  });
});
