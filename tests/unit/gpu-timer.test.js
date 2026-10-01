// tests/unit/gpu-timer.test.js — ms GPU mỗi khung trên renderer giả: không hỏi chồng, cộng render + compute, bỏ số vô lý (kể cả lâu hơn nhịp khung), mẻ không có nhịp để so thì bỏ mẫu, hỏng 3 lần thì tắt.
import { describe, it, expect, vi } from 'vitest';
import { createGpuTimer } from '../../src/engine/gpu/gpu-timer.js';

/** Renderer giả: resolveTimestampsAsync trả Promise do test giữ, để quyết lúc nào kết quả về và về số gì. */
function fakeRenderer({ track = true } = {}) {
  const calls = [];
  const renderer = {
    backend: { trackTimestamp: track },
    info: { compute: { frameCalls: 0 } },
    resolveTimestampsAsync: vi.fn((type) => new Promise((resolve, reject) => calls.push({ type, resolve, reject }))),
  };
  /** Trả kết quả cho mọi lời hỏi đang chờ: { render, compute } (số, hoặc Error để reject). */
  const answer = async ({ render, compute = 0 }) => {
    for (const c of calls.splice(0)) {
      const v = c.type === 'render' ? render : compute;
      if (v instanceof Error) c.reject(v);
      else c.resolve(v);
    }
    await new Promise((r) => setTimeout(r, 0)); // để then/finally của timer chạy xong
  };
  return { renderer, calls, answer };
}

describe('createGpuTimer', () => {
  it('máy không đo được (trackTimestamp tắt sau init): không bao giờ hỏi, không có số', () => {
    const { renderer } = fakeRenderer({ track: false });
    const timer = createGpuTimer(renderer);
    timer.poll();
    timer.poll();
    expect(renderer.resolveTimestampsAsync).not.toHaveBeenCalled();
    expect(timer.ms).toBeNull();
    expect(timer.available).toBe(false);
  });

  it('hỏi sau mỗi khung nhưng KHÔNG hỏi chồng: lần hỏi trước chưa về thì bỏ qua', async () => {
    const { renderer, answer } = fakeRenderer();
    const timer = createGpuTimer(renderer);
    timer.poll();
    timer.poll();
    timer.poll();
    expect(renderer.resolveTimestampsAsync).toHaveBeenCalledTimes(1);
    expect(renderer.resolveTimestampsAsync).toHaveBeenCalledWith('render');
    await answer({ render: 4.5 });
    timer.poll();
    expect(renderer.resolveTimestampsAsync).toHaveBeenCalledTimes(2);
  });

  it('cộng render + compute; chỉ hỏi compute khi có compute từ lần hỏi trước (không cộng số cũ của three)', async () => {
    const { renderer, answer } = fakeRenderer();
    const seen = [];
    const timer = createGpuTimer(renderer, { onSample: (ms) => seen.push(ms) });
    const types = () => renderer.resolveTimestampsAsync.mock.calls.map((c) => c[0]);
    let t = 0;
    timer.poll((t += 16)); // lần hỏi đầu: chưa có nhịp để so, mẫu bị bỏ
    await answer({ render: 1 });
    renderer.info.compute.frameCalls = 1; // khung này có chạy compute
    timer.poll((t += 16));
    expect(types()).toEqual(['render', 'render', 'compute']);
    await answer({ render: 4, compute: 0.5 });
    expect(seen).toEqual([4.5]);
    expect(timer.ms).toBe(4.5);
    expect(timer.available).toBe(true);
    renderer.info.compute.frameCalls = 0; // lớp dùng compute đã tắt: three sẽ trả lại số cũ nếu hỏi
    timer.poll((t += 16));
    await answer({ render: 3, compute: 0.5 });
    expect(seen).toEqual([4.5, 3]);
    expect(types()).toEqual(['render', 'render', 'compute', 'render']);
  });

  it('compute chạy ở khung đang chờ kết quả cũng được tính vào lần hỏi sau', async () => {
    const { renderer, answer } = fakeRenderer();
    const timer = createGpuTimer(renderer);
    timer.poll(); // khung 1: không compute
    renderer.info.compute.frameCalls = 1;
    timer.poll(); // khung 2: có compute, nhưng lần hỏi của khung 1 chưa về
    renderer.info.compute.frameCalls = 0;
    await answer({ render: 4 });
    timer.poll(); // khung 3: không compute, nhưng khung 2 có
    expect(renderer.resolveTimestampsAsync.mock.calls.map((c) => c[0])).toEqual(['render', 'render', 'compute']);
  });

  it('số vô lý (≤ 0, không hữu hạn, không phải số) hay bị reject: bỏ mẫu đó; một mẫu tốt thì đếm lại từ đầu', async () => {
    const { renderer, answer } = fakeRenderer();
    const onSample = vi.fn();
    const timer = createGpuTimer(renderer, { onSample });
    let t = 0;
    const frame = () => timer.poll((t += 1000 / 60));
    for (const bad of [{ render: 0 }, { render: Number.NaN }]) {
      frame(); // số vô lý là hỏng, kể cả ở lần hỏi đầu
      await answer(bad);
    }
    frame();
    await answer({ render: 5 });
    for (const bad of [{ render: undefined }, { render: new Error('mapAsync hỏng') }]) {
      frame();
      await answer(bad);
    }
    expect(onSample.mock.calls).toEqual([[5]]);
    expect(timer.available).toBe(true); // hai lần hỏng liền sau mẫu tốt: chưa đủ ba
    frame();
    expect(renderer.resolveTimestampsAsync).toHaveBeenCalledTimes(6);
  });

  it('hỏng 3 lần liền: tắt đo GPU cho phiên này (bộ điều chỉnh và Sổ tay chạy như GĐ 3), báo onStop đúng một lần', async () => {
    const { renderer, answer } = fakeRenderer();
    const onStop = vi.fn();
    const timer = createGpuTimer(renderer, { onStop });
    for (const bad of [{ render: -1 }, { render: Infinity }, { render: new Error('x') }]) {
      timer.poll();
      await answer(bad);
    }
    timer.poll();
    expect(renderer.resolveTimestampsAsync).toHaveBeenCalledTimes(3);
    expect(timer.available).toBe(false);
    expect(timer.ms).toBeNull();
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('số lâu hơn hẳn nhịp khung của mẻ (GPU Apple báo các pass chồng nhau, three cộng lại): số vô lý; 3 lần liền thì thôi đo', async () => {
    const { renderer, answer } = fakeRenderer();
    const onSample = vi.fn();
    const onStop = vi.fn();
    const timer = createGpuTimer(renderer, { onSample, onStop });
    let t = 0;
    timer.poll((t += 1000 / 60)); // lần hỏi đầu: chưa có nhịp để so, nên không có trần: mẫu bị bỏ, không tính là hỏng
    await answer({ render: 160 });
    expect([onSample.mock.calls, timer.ms, timer.available]).toEqual([[], null, false]);
    for (let i = 0; i < 3; i++) {
      expect(onStop, `sau ${i} lần vô lý`).not.toHaveBeenCalled();
      timer.poll((t += 1000 / 60));
      await answer({ render: 160 }); // 16 pass × 10 ms trong một khung 16,7 ms
    }
    expect(onSample).not.toHaveBeenCalled(); // Sổ tay chưa bao giờ hiện 160 ms
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(timer.available).toBe(false);
  });

  it('máy nặng lên đột ngột chỉ lệch một mẫu: mẻ sau đã đo theo nhịp mới, không thôi đo', async () => {
    const { renderer, answer } = fakeRenderer();
    const onSample = vi.fn();
    const timer = createGpuTimer(renderer, { onSample });
    let t = 0;
    timer.poll((t += 1000 / 60)); // lần hỏi đầu: mẫu bị bỏ
    await answer({ render: 10 });
    timer.poll((t += 1000 / 60));
    await answer({ render: 10 });
    timer.poll((t += 1000 / 60)); // khung đầu sau khi bật thí nghiệm nặng: GPU bận 30 ms, nhịp cũ 16,7 ms → vô lý
    await answer({ render: 30 });
    for (let i = 0; i < 2; i++) {
      timer.poll((t += 1000 / 30)); // trình duyệt đã đợi GPU: nhịp 33 ms
      await answer({ render: 30 });
    }
    expect(onSample.mock.calls).toEqual([[10], [30], [30]]);
    expect(timer.available).toBe(true);
  });

  it('mẻ gồm nhiều khung (lần hỏi trước về chậm): trần theo nhịp trung bình của cả mẻ', async () => {
    const { renderer, answer } = fakeRenderer();
    const onSample = vi.fn();
    const timer = createGpuTimer(renderer, { onSample });
    let t = 0;
    timer.poll((t += 10)); // lần hỏi đầu: mẫu bị bỏ
    await answer({ render: 1 });
    timer.poll((t += 10));
    for (let i = 0; i < 3; i++) timer.poll((t += 10)); // lần hỏi trước chưa về: ba khung 10 ms dồn vào mẻ sau
    await answer({ render: 8 });
    timer.poll((t += 50)); // mẻ: 4 khung trong 80 ms, trung bình 20 ms, trần 30 ms
    await answer({ render: 25 });
    expect(onSample.mock.calls).toEqual([[8], [25]]);
  });

  it('mẻ dài hơn một lần nghẽn (lúc hòa dần không hỏi, tab ẩn: nhịp trung bình > 250 ms): không có trần đáng tin, bỏ mẫu và không tính là hỏng', async () => {
    const { renderer, answer } = fakeRenderer();
    const onSample = vi.fn();
    const onStop = vi.fn();
    const timer = createGpuTimer(renderer, { onSample, onStop });
    let t = 0;
    timer.poll((t += 16)); // lần hỏi đầu: bỏ
    await answer({ render: 5 });
    timer.poll((t += 900)); // mẻ một khung dài 900 ms: trần sẽ là 1350 ms, chặn được gì đâu
    await answer({ render: 160 });
    expect([onSample.mock.calls, onStop.mock.calls.length, timer.ms]).toEqual([[], 0, null]);
    timer.poll((t += 16));
    await answer({ render: 6 });
    expect(onSample.mock.calls).toEqual([[6]]);
  });

  it('?debug tắt trackTimestamp giữa chừng (máy không có timestamp-query): thôi hỏi, không để three cảnh báo', () => {
    const { renderer } = fakeRenderer();
    const timer = createGpuTimer(renderer);
    renderer.backend.trackTimestamp = false;
    timer.poll();
    expect(renderer.resolveTimestampsAsync).not.toHaveBeenCalled();
  });

  it('dispose: kết quả về muộn không còn được báo', async () => {
    const { renderer, answer } = fakeRenderer();
    const onSample = vi.fn();
    const timer = createGpuTimer(renderer, { onSample });
    timer.poll();
    timer.dispose();
    await answer({ render: 4 });
    timer.poll();
    expect(onSample).not.toHaveBeenCalled();
    expect(renderer.resolveTimestampsAsync).toHaveBeenCalledTimes(1);
  });
});
