// lib/tsl/particles.js — bể hạt compute dùng chung (luật hai lần: đom đóm của Bức 1, thóc của Bức 4): cấp phát một lần, khởi tạo, bước, đổi số lượng, rắc theo vòng đệm.
import { Vector3 } from 'three/webgpu';
import { Fn, If, instanceIndex, instancedArray, uniform } from 'three/tsl';

/** Sàn của số phần tử được tính và vẽ: sprite có count > 1 mới có cache key riêng; về 0 hay 1 là biên dịch lại. */
export const COUNT_FLOOR = 100;
/** Hàng đợi rắc giữ tối đa chừng này nắm (bỏ nắm cũ nhất): chạm dồn lúc khung đứng không làm hàng đợi phình mãi. */
const QUEUE_MAX = 16;

/**
 * Một bể hạt trên GPU. Mỗi phần tử có hai ô vec4 `a`, `b` trong hai bộ đệm; bể không biết ý nghĩa của chúng (bức quyết).
 * - Mỗi kernel chỉ đụng hai bộ đệm: WebGL2 chạy compute bằng transform feedback, tối đa bốn bộ đệm mỗi kernel.
 * - Luật chỉ đọc và ghi CHÍNH phần tử của nó: trên WebGL2, element(i) bỏ qua i (Phụ lục A.10). Thứ cần đi giữa các phần tử, hay từ JS
 *   vào, đi qua uniform.
 * - Quy ước: mọi nhánh của init, law, spawn gán CẢ a lẫn b, để mỗi nhánh nói đủ trạng thái mới của phần tử. Nhánh không gán thì ô đó
 *   giữ giá trị cũ ở cả hai backend (WebGL2: three chép bản đọc sang bản ghi trước khi chạy luật; Phụ lục A.97), không phải ghi rác.
 * - Rắc: emit() xếp một nắm vào hàng đợi; mỗi bước lấy một nắm ra, ghi vào uniform `batch`. Phần tử nào thuộc nắm thì gọi spawn để tự
 *   khởi tạo lại, phần tử khác gọi law. Nắm nối tiếp nhau trên vòng đệm của số phần tử đang tính, nên nắm mới đè lên hạt cũ nhất.
 * - File này không đặt tên uniform: một bức có thể dựng hai bể.
 *
 * @param {object} p
 * @param {number} p.capacity   số phần tử tối đa, cấp phát MỘT lần (trần của núm số lượng)
 * @param {number} [p.count]    số phần tử được tính và vẽ lúc đầu (mặc định capacity)
 * @param {(e: { a: any, b: any, index: any }) => void} p.init   TSL: gán giá trị đầu cho a, b
 * @param {(e: { a: any, b: any, index: any }) => void} p.law    TSL: một bước của một phần tử
 * @param {((e: { a: any, b: any, index: any, k: any, batch: object }) => void) | null} [p.spawn]
 *   TSL: phần tử thứ k (uint, 0 … số hạt − 1) của nắm vừa rắc tự khởi tạo lại; thiếu thì bể không rắc được
 * @param {'webgpu'|'webgl2'} p.tier
 * @param {{ compute: (node: any) => void }} p.renderer
 */
export function createPool({ capacity, count = capacity, init, law, spawn = null, tier, renderer }) {
  const a = instancedArray(capacity, 'vec4');
  const b = instancedArray(capacity, 'vec4');
  const element = () => ({ a: a.element(instanceIndex), b: b.element(instanceIndex), index: instanceIndex });
  const clampCount = (n) => Math.max(COUNT_FLOOR, Math.min(Math.round(n), capacity));
  let active = clampCount(count);
  const ring = uniform(active, 'uint'); // vòng đệm của nắm quấn theo số phần tử đang tính
  const batch = {
    start: uniform(0, 'uint'),
    count: uniform(0, 'uint'),
    origin: uniform(new Vector3()),
    seed: uniform(0),
    still: uniform(0),
  };

  // Khởi tạo CẢ bộ đệm (theo capacity): tăng count lúc chạy thì phần tử mới đã có giá trị.
  const initNode = Fn(() => {
    init(element());
  })().compute(capacity);
  renderer.compute(initNode);
  // WebGL2: mỗi bộ đệm có HAI bản (một để đọc, một để ghi, đổi vai sau mỗi lần chạy), và kernel bước chỉ ghi [0, count). Khởi tạo lần
  // nữa để bản kia cũng đầy (Phụ lục A.29); không thì tăng count lúc chạy, phần tử mới đọc bản chưa từng được ghi.
  if (tier === 'webgl2') renderer.compute(initNode);

  const stepNode = Fn(() => {
    const e = element();
    if (!spawn) {
      law(e);
      return;
    }
    // Thứ tự trong nắm: (chỉ số − đầu nắm + vòng) mod vòng. Cộng vòng trước khi trừ để số không âm (uint).
    const k = instanceIndex.add(ring).sub(batch.start).mod(ring).toVar();
    If(k.lessThan(batch.count), () => {
      spawn({ ...e, k, batch });
    }).Else(() => {
      law(e);
    });
  })().compute(active);

  const queue = [];
  let head = 0;
  let emitted = 0;
  return {
    a,
    b,
    initNode,
    stepNode,
    batch,
    /** Số phần tử đang được tính và vẽ. */
    get count() {
      return active;
    },
    /** Đổi số phần tử được tính, và `count` của mọi vật vẽ truyền vào. Chỉ đổi SỐ: không tạo bộ đệm, không biên dịch lại. */
    setCount(n, ...objects) {
      active = clampCount(n);
      stepNode.count = active; // WebGPU tính lại số nhóm dispatch, WebGL2 vẽ ít hay nhiều đỉnh hơn
      ring.value = active;
      head %= active;
      for (const o of objects) o.count = active;
      return active;
    },
    /** Xếp một nắm vào hàng đợi; bước kế tiếp còn trống thì nó khởi tạo lại các phần tử của nắm. Trả chỗ của nắm trên vòng đệm. */
    emit({ origin, count: n, seed, still = false }) {
      if (!spawn) throw new Error('Bể hạt này không có spawn: không rắc được.');
      const size = Math.min(Math.max(Math.round(n), 0), active);
      if (size === 0) return null;
      const start = head % active;
      head = (start + size) % active;
      emitted += size;
      queue.push({ start, size, origin, seed, still });
      if (queue.length > QUEUE_MAX) queue.shift();
      return { start, size };
    },
    /**
     * Một bước của cả bể. dt = 0 (xưởng vẽ lại khung đứng yên của ?freeze) hay trọng số ≤ 0: không làm gì, nắm đang chờ vẫn chờ.
     * Mỗi bước tối đa một nắm; không có nắm thì batch.count = 0 và mọi phần tử theo law.
     */
    step(dt, w) {
      if (dt === 0 || !(w > 0)) return false;
      const next = queue.shift();
      batch.count.value = next ? next.size : 0;
      if (next) {
        batch.start.value = next.start % active; // count có thể đã giảm từ lúc emit
        batch.origin.value.set(...next.origin);
        batch.seed.value = next.seed;
        batch.still.value = next.still ? 1 : 0;
      }
      renderer.compute(stepNode);
      return true;
    },
    /** Số phần tử đã rắc còn trong vòng đệm (chưa bị nắm sau đè): không quá số đang tính. */
    emitted: () => Math.min(emitted, active),
    dispose() {
      initNode.dispose(); // gỡ pipeline compute; bộ đệm storage được giải phóng cùng renderer
      stepNode.dispose();
    },
  };
}
