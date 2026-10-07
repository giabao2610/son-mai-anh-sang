// tests/unit/particles.test.js — bể hạt dùng chung (lib/tsl/particles.js, GĐ 8): cấp phát một lần; sàn của count; không bước khi dt = 0 hay trọng số 0 (nắm chờ vẫn chờ); WebGL2 khởi tạo hai lần; vòng đệm của emit; hàng đợi có trần; emitted đếm lúc rắc thật; emit chép origin; clear bỏ nắm chờ; dispose hai lần; dịch được ở hai backend.
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

  it('nắm đang chờ thì chờ khi dt = 0 (update(0, t) của ?freeze) hay trọng số ≤ 0, rồi rắc ở bước thật đầu tiên', () => {
    const { pool, renderer } = make();
    pool.emit({ origin: ORIGIN, count: 50, seed: 3 });
    renderer.compute.mockClear();
    pool.step(0, 1);
    pool.step(1 / 60, 0);
    pool.step(1 / 60, -1);
    expect(renderer.compute).not.toHaveBeenCalled();
    expect(pool.emitted(), 'chưa rắc').toBe(0);
    pool.step(1 / 60, 1);
    expect([pool.batch.count.value, pool.batch.seed.value, pool.emitted()]).toEqual([50, 3, 50]);
  });

  it('emitted() đếm lúc nắm ra khỏi hàng đợi (rắc thật), không lúc xếp: nắm bị trần hàng đợi bỏ không tính; không quá số đang tính', () => {
    const { pool } = make();
    for (let i = 0; i < 20; i += 1) pool.emit({ origin: ORIGIN, count: 10, seed: i });
    expect(pool.emitted(), 'mới xếp hàng, chưa rắc').toBe(0);
    for (let i = 0; i < 30; i += 1) pool.step(1 / 60, 1);
    expect(pool.emitted(), '16 nắm còn trong hàng đợi (4 nắm cũ nhất bị bỏ), mỗi nắm 10 hạt').toBe(160);
    for (let i = 0; i < 40; i += 1) pool.emit({ origin: ORIGIN, count: 100, seed: i });
    for (let i = 0; i < 20; i += 1) pool.step(1 / 60, 1);
    expect(pool.emitted(), 'vòng đệm 300: không quá số đang tính').toBe(300);
  });

  it('emit chép origin ngay: người gọi sửa mảng của mình sau đó thì nắm đang chờ vẫn rơi ở chỗ cũ', () => {
    const { pool } = make();
    const origin = [1, 2, 3];
    pool.emit({ origin, count: 10, seed: 1 });
    origin[0] = 99;
    pool.step(1 / 60, 1);
    expect(pool.batch.origin.value.toArray()).toEqual([1, 2, 3]);
  });

  it('clear() bỏ mọi nắm đang chờ: bật lại không bung ra, không tính vào emitted; nắm sau vẫn bắt đầu ở đầu nắm chờ cũ nhất (đè hạt cũ nhất)', () => {
    const { pool } = make();
    pool.emit({ origin: ORIGIN, count: 100, seed: 1 });
    pool.step(1 / 60, 1);
    pool.emit({ origin: ORIGIN, count: 120, seed: 2 });
    pool.emit({ origin: ORIGIN, count: 30, seed: 3 });
    pool.clear();
    for (let i = 0; i < 5; i += 1) pool.step(1 / 60, 1);
    expect(pool.batch.count.value, 'không nắm nào rắc thêm').toBe(0);
    expect(pool.emitted()).toBe(100);
    expect(pool.emit({ origin: ORIGIN, count: 10, seed: 4 })).toEqual({ start: 100, size: 10 });
  });

  it('dispose() gỡ hai compute node; gọi hai lần vẫn an toàn', () => {
    const { pool } = make();
    const gone = [];
    pool.initNode.addEventListener('dispose', () => gone.push('init'));
    pool.stepNode.addEventListener('dispose', () => gone.push('step'));
    pool.dispose();
    expect(() => pool.dispose()).not.toThrow();
    expect(gone.slice(0, 2)).toEqual(['init', 'step']);
  });

  it('số không hữu hạn (NaN, vô cực, thiếu) cho setCount, emit hay count lúc dựng: RangeError tiếng Việt, bể giữ nguyên trạng thái', () => {
    const { pool } = make();
    const sprite = { count: 300 };
    for (const n of [NaN, Infinity, undefined]) {
      expect(() => pool.setCount(n, sprite), `setCount(${n})`).toThrow(RangeError);
      expect(() => pool.emit({ origin: ORIGIN, count: n, seed: 1 }), `emit count ${n}`).toThrow(/hữu hạn/);
    }
    expect([pool.count, pool.stepNode.count, sprite.count]).toEqual([300, 300, 300]);
    expect(pool.emit({ origin: ORIGIN, count: 10, seed: 1 }), 'vòng đệm không bị NaN').toEqual({ start: 0, size: 10 });
    pool.step(1 / 60, 1);
    expect([pool.batch.start.value, pool.batch.count.value, pool.emitted()]).toEqual([0, 10, 10]);
    expect(() => make({ count: NaN }), 'count lúc dựng').toThrow(RangeError);
  });

  it('capacity dưới COUNT_FLOOR (hay không phải số) thì không dựng: sàn 100 của count sẽ vượt bể', () => {
    expect(() => make({ capacity: 50, count: 50 })).toThrow(RangeError);
    expect(() => make({ capacity: 50, count: 50 })).toThrow(/100/);
    expect(() => make({ capacity: NaN })).toThrow(RangeError);
    expect(make({ capacity: COUNT_FLOOR, count: COUNT_FLOOR }).pool.count).toBe(COUNT_FLOOR);
  });

  it('sau dispose(): step và emit không làm gì (không compute lại node đã gỡ, không xếp nắm)', () => {
    const { pool, renderer } = make();
    pool.emit({ origin: ORIGIN, count: 10, seed: 1 });
    pool.dispose();
    renderer.compute.mockClear();
    expect(pool.step(1 / 60, 1)).toBe(false);
    expect(pool.emit({ origin: ORIGIN, count: 10, seed: 2 })).toBeNull();
    expect(pool.step(1 / 60, 1)).toBe(false);
    expect(renderer.compute).not.toHaveBeenCalled();
    expect(pool.emitted()).toBe(0);
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
