// tests/unit/tuner.test.js — bộ điều chỉnh có trễ chạy trên chuỗi khung giả: đường nhịp (GĐ 3) và đường tải khi đo được ms GPU (GĐ 4).
import { describe, expect, it } from 'vitest';
import { FRAME_BUDGET_MS, TUNER, createTuner } from '../../src/engine/tuner.js';
import { MAX_FPS, createFrameCap } from '../../src/engine/gpu/clock.js';
import { mulberry32 } from '../../src/lib/random.js';

const DESKTOP = FRAME_BUDGET_MS.desktop;

/**
 * Cho bộ điều chỉnh "chạy" `seconds` giây. Khoảng giữa hai khung lấy từ gapFor(số nấc đang áp, i): như máy thật,
 * hạ nấc thì khung nhanh lên. Thang giả có `steps` nấc; 'down' / 'up' / 'reset' đổi `applied` như ladder.js.
 * GĐ 4: gpuFor(k, i) là ms GPU của khung i, nhưng cứ `gpuEvery` khung mới có một mẫu về (gpu-timer không chờ, mẫu đến
 * trễ và thưa); cpuFor(k, i) là ms CPU của khung i. Thiếu thì máy "không đo được": đường nhịp như GĐ 3.
 * Sau GĐ 5: 'skip' là khung không được vẽ (bộ điều chỉnh đang thử ngừng vẽ): thang giữ nguyên, không có ms CPU hay GPU, và khoảng
 * tới khung sau lấy từ idleFor(k, i), nhịp rAF khi máy không có việc gì. Mặc định 60 Hz: máy là nút cổ chai, không vẽ thì
 * trình duyệt gọi rAF theo màn hình. Trình duyệt khóa nhịp (tiết kiệm pin) thì idleFor là chính nhịp bị khóa.
 * Trả mọi quyết định (trừ 'skip') kèm thời điểm (giây), và số khung bị bỏ.
 */
function run(tuner, { seconds, gapFor, idleFor = () => DESKTOP, ladder, from = 0, gpuFor = null, cpuFor = null, gpuEvery = 4 }) {
  const actions = [];
  let t = from;
  let skips = 0;
  let skipped = false;
  for (let i = 0; t < from + seconds * 1000; i++) {
    t += skipped ? idleFor(ladder.applied, i) : gapFor(ladder.applied, i);
    const action = tuner.sample(t, ladder);
    skipped = action === 'skip';
    if (skipped) {
      skips += 1;
      continue;
    }
    if (action) {
      actions.push({ at: +(t / 1000).toFixed(2), action });
      if (action === 'down') ladder.applied += 1;
      else if (action === 'up') ladder.applied -= 1;
      else ladder.applied = 0;
    }
    // Như scene.js: vẽ xong khung mới biết ms CPU của nó; mẫu GPU về sau vài khung.
    if (cpuFor) tuner.cpu(cpuFor(ladder.applied, i));
    if (gpuFor && i % gpuEvery === 0) tuner.gpu(gpuFor(ladder.applied, i));
  }
  return { actions, end: t, skips };
}
const kinds = (actions) => actions.map((a) => a.action);

describe('createTuner (bộ điều chỉnh có trễ)', () => {
  it('ngân sách: 60 khung/giây trên máy tính, 45 trên điện thoại', () => {
    expect(FRAME_BUDGET_MS.desktop).toBeCloseTo(16.667, 3);
    expect(FRAME_BUDGET_MS.mobile).toBeCloseTo(22.222, 3);
  });

  it('60 fps đều: không làm gì; không bao giờ nâng quá mức ban đầu (chưa hạ nấc nào)', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    expect(run(tuner, { seconds: 60, gapFor: () => DESKTOP, ladder: { applied: 0, steps: 4 } }).actions).toEqual([]);
    const fast = createTuner({ budgetMs: DESKTOP });
    expect(run(fast, { seconds: 60, gapFor: () => 1000 / 120, ladder: { applied: 0, steps: 4 } }).actions).toEqual([]);
  });

  it('40 fps: 2 giây khởi động + 2 cửa sổ quá tải thì hạ; đủ nhanh thì thử nâng MỘT lần, chậm lại thì hạ và khóa', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 4 };
    // Máy giả: mỗi nấc bớt 4,5 ms; 2 nấc là về 16 ms (đủ 60 fps, không rớt khung nên trông như còn dư).
    const { actions, skips } = run(tuner, { seconds: 60, gapFor: (k) => Math.max(25 - k * 4.5, 16), ladder });
    expect(kinds(actions)).toEqual(['down', 'down', 'up', 'down']);
    expect(actions[0].at).toBeGreaterThanOrEqual(5.9);
    expect(actions[0].at).toBeLessThan(6.2); // sau lần thử ngừng vẽ: 6 khung ở 60 Hz, chừng 0,1 giây
    expect(skips, 'thử trước lần hạ đầu của mỗi đợt hạ (lúc mới live, và sau lần nâng)').toBe(12);
    expect(ladder.applied).toBe(2);
    expect(tuner.state().locked).toEqual([1]);
  });

  it('màn 60 Hz không rớt khung thì nâng lại sau 5 cửa sổ (0,7 × ngân sách không bao giờ tới được ở 60 Hz)', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 2, steps: 4 };
    const { actions } = run(tuner, { seconds: 24, gapFor: () => DESKTOP, ladder });
    expect(kinds(actions)).toEqual(['up', 'up']);
    expect(actions[0].at).toBeGreaterThanOrEqual(11.9);
    expect(actions[0].at).toBeLessThan(12.2);
  });

  it('có rớt khung (mỗi cửa sổ một khung 33 ms) thì không nâng, dù trung bình vẫn gần 16,7 ms', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 1, steps: 4 };
    const { actions } = run(tuner, { seconds: 40, gapFor: (k, i) => (i % 100 === 50 ? 2 * DESKTOP : DESKTOP), ladder });
    expect(actions).toEqual([]);
  });

  it('nâng một nấc rồi phải hạ lại ngay đúng nấc đó: khóa, không nâng nấc ấy nữa (không dao động)', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 1, steps: 4 };
    // Máy giả chỉ chạy nổi 60 fps khi đã hạ 1 nấc.
    const { actions } = run(tuner, { seconds: 90, gapFor: (k) => (k >= 1 ? DESKTOP : 25), ladder });
    expect(kinds(actions)).toEqual(['up', 'down']);
    expect(tuner.state().locked).toEqual([0]);
    expect(ladder.applied).toBe(1);
  });

  it('khóa nhịp 30 fps (tiết kiệm pin): trước lần hạ đầu thử ngừng vẽ 6 khung; không vẽ mà vẫn 33 ms → "bị khóa nhịp" ngay, không hạ nấc nào', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 3 };
    let gap = 1000 / 30;
    // 2 giây khởi động + 2 cửa sổ quá tải, rồi 6 khung không vẽ (0,2 giây): trình duyệt vẫn gọi rAF mỗi 33 ms.
    const early = run(tuner, { seconds: 6.5, gapFor: () => gap, idleFor: () => gap, ladder });
    expect([early.actions, early.skips, tuner.state().capped]).toEqual([[], 6, true]);
    const rest = run(tuner, { seconds: 60, gapFor: () => gap, idleFor: () => gap, ladder, from: early.end });
    expect([rest.actions, rest.skips], 'đã biết nhịp bị khóa: không hạ, không thử lại').toEqual([[], 0]);
    expect(ladder.applied).toBe(0);
    // Cắm sạc: về 60 fps, hết khóa. Rồi máy thật sự chậm (40 fps, không vẽ thì về 60 Hz): thử, rồi hạ được.
    gap = DESKTOP;
    const plugged = run(tuner, { seconds: 10, gapFor: () => gap, ladder, from: rest.end });
    expect(plugged.actions).toEqual([]);
    expect(tuner.state().capped).toBe(false);
    const again = run(tuner, { seconds: 6, gapFor: () => 25, ladder, from: plugged.end });
    expect([kinds(again.actions), again.skips]).toEqual([['down'], 6]);
  });

  it('khóa 30 fps mà máy còn chậm hơn nhịp ấy (50 ms): mốc "nhịp bị khóa" là nhịp đo lúc không vẽ (33 ms), nên vẫn hạ về lại nhịp ấy', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 3 };
    const cap = 1000 / 30;
    // Tiết kiệm pin còn hạ xung nhịp GPU: ở nấc 0 khung mất 50 ms, chậm hơn cả nhịp bị khóa; hạ một nấc là về lại 33 ms.
    const gapFor = (k) => (k === 0 ? 50 : cap);
    const first = run(tuner, { seconds: 14, gapFor, idleFor: () => cap, ladder });
    expect([kinds(first.actions), first.skips, tuner.state().capped, ladder.applied]).toEqual([['down'], 6, true, 1]);
    // Về lại đúng nhịp bị khóa 5 cửa sổ: trả thử nấc ấy; quá tải lại ngay thì hạ lại và khóa nó (như lúc bị khóa ở GĐ 3).
    const later = run(tuner, { seconds: 30, gapFor, idleFor: () => cap, ladder, from: first.end });
    expect([kinds(later.actions), later.skips, ladder.applied, tuner.state().locked]).toEqual([['up', 'down'], 0, 1, [0]]);
  });

  it('điện thoại (ngân sách 22,2 ms) ở Low Power Mode của iPhone (khóa 30 fps): cũng vào "bị khóa nhịp" sau lần thử, không hạ nấc nào', () => {
    const tuner = createTuner({ budgetMs: FRAME_BUDGET_MS.mobile });
    const ladder = { applied: 0, steps: 3 };
    const { actions, skips } = run(tuner, { seconds: 30, gapFor: () => 1000 / 30, idleFor: () => 1000 / 30, ladder });
    expect([actions, skips, tuner.state().capped]).toEqual([[], 6, true]);
  });

  it('thử ngừng vẽ mà nhịp nhanh lên (máy là nút cổ chai) thì hạ; hạ hết thang mà không nhanh hơn thì vẫn trả lại hết (lưới an toàn của luật 2)', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 3 };
    // Khung nào cũng 33 ms dù hạ nấc nào (phần việc chậm không nằm trong thang), mà không vẽ thì rAF về 60 Hz: lần thử nói "máy
    // không kịp", nên hạ như cũ; hạ hết rồi vẫn không nhanh hơn 10% thì luật cũ trả lại hết.
    const { actions, skips } = run(tuner, { seconds: 60, gapFor: () => 1000 / 30, ladder });
    expect(kinds(actions)).toEqual(['down', 'down', 'down', 'reset']);
    expect(skips, 'chỉ thử trước lần hạ đầu của đợt hạ').toBe(6);
    expect(tuner.state().capped).toBe(true);
  });

  it('lần thử bị ngắt (khoảng > 250 ms giữa chừng: tab ẩn, debugger) thì bỏ, không kết luận; đo lại hai cửa sổ rồi thử lại', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 3 };
    const cap = 1000 / 30;
    let idleTicks = 0;
    // Khung thứ ba sau khi ngừng vẽ tới trễ 400 ms: lần thử đầu bỏ dở (3 khung đã bỏ), khung ấy vẽ như thường.
    const idleFor = () => ((idleTicks += 1) === 3 ? 400 : cap);
    const first = run(tuner, { seconds: 7, gapFor: () => cap, idleFor, ladder });
    expect([first.actions, first.skips, tuner.state().capped]).toEqual([[], 3, false]);
    const later = run(tuner, { seconds: 6, gapFor: () => cap, idleFor, ladder, from: first.end });
    expect([later.actions, later.skips, tuner.state().capped]).toEqual([[], 6, true]);
  });

  it('hết khóa nhịp trên màn 59,94 Hz, hay khi mỗi cửa sổ rớt một khung: thoát "bị khóa nhịp", rồi chậm thật thì lại hạ', () => {
    const idles = { '59,94 Hz': () => 1000 / 59.94, '60 Hz rớt 1 khung / 2 s': (k, i) => (i % 120 === 60 ? 2 * DESKTOP : DESKTOP) };
    for (const [name, idle] of Object.entries(idles)) {
      const tuner = createTuner({ budgetMs: DESKTOP });
      const ladder = { applied: 0, steps: 3 };
      const locked = run(tuner, { seconds: 60, gapFor: () => 1000 / 30, idleFor: () => 1000 / 30, ladder });
      expect([locked.actions, tuner.state().capped], name).toEqual([[], true]);
      const unlocked = run(tuner, { seconds: 10, gapFor: idle, ladder, from: locked.end });
      expect(unlocked.actions, name).toEqual([]);
      expect(tuner.state().capped, name).toBe(false);
      const slow = run(tuner, { seconds: 6, gapFor: () => 25, ladder, from: unlocked.end });
      expect(kinds(slow.actions), name).toEqual(['down']);
    }
  });

  it('đang "bị khóa nhịp" mà quá tải thật (chậm hẳn hơn nhịp bị khóa) thì vẫn hạ về lại nhịp ấy, kể cả khi Sổ tay mở', () => {
    for (const guarding of [false, true]) {
      const tuner = createTuner({ budgetMs: DESKTOP });
      const ladder = { applied: 0, steps: 3 };
      const locked = run(tuner, { seconds: 60, gapFor: () => 1000 / 30, idleFor: () => 1000 / 30, ladder });
      expect(tuner.state().capped).toBe(true);
      tuner.guard(guarding);
      // Người xem kéo 200.000 đom đóm: khung 50 ms (20 fps). Hạ một nấc là về lại nhịp bị khóa 33 ms: dừng ở đó.
      // (Phản ứng đầu tiên; trả lại nấc sau đó do hai test dưới giữ.)
      const heavy = run(tuner, { seconds: 12, gapFor: (k) => (k === 0 ? 50 : 1000 / 30), ladder, from: locked.end });
      expect(kinds(heavy.actions), `canh: ${guarding}`).toEqual(['down']);
      expect(tuner.state().capped).toBe(true);
    }
  });

  it('đang "bị khóa nhịp": hạ vì quá tải thật, người xem trả núm về thì trả lại nấc (vẫn khóa); Sổ tay còn mở thì chờ', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 3 };
    const locked = run(tuner, { seconds: 60, gapFor: () => 1000 / 30, idleFor: () => 1000 / 30, ladder });
    expect(tuner.state().capped).toBe(true);
    tuner.guard(true);
    const heavy = run(tuner, { seconds: 8, gapFor: (k) => (k === 0 ? 100 : 1000 / 30), ladder, from: locked.end });
    expect(kinds(heavy.actions)).toEqual(['down']);
    // Người xem trả số đom đóm về: nấc vừa hạ không còn cần nữa.
    const open = run(tuner, { seconds: 20, gapFor: () => 1000 / 30, ladder, from: heavy.end });
    expect(open.actions).toEqual([]);
    tuner.guard(false);
    const closed = run(tuner, { seconds: 20, gapFor: () => 1000 / 30, ladder, from: open.end });
    expect(kinds(closed.actions)).toEqual(['up']);
    expect(ladder.applied).toBe(0);
    expect(tuner.state().capped).toBe(true);
  });

  it('đang "bị khóa nhịp": trả lại nấc mà quá tải lại ngay thì hạ lại và khóa nấc ấy (không dao động)', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 3 };
    const locked = run(tuner, { seconds: 60, gapFor: () => 1000 / 30, idleFor: () => 1000 / 30, ladder });
    const heavy = run(tuner, { seconds: 60, gapFor: (k) => (k === 0 ? 100 : 1000 / 30), ladder, from: locked.end });
    expect(kinds(heavy.actions)).toEqual(['down', 'up', 'down']);
    expect(tuner.state().locked).toEqual([0]);
    expect(ladder.applied).toBe(1);
    // Cắm sạc, núm đã trả về: hết khóa nhịp thì quên các nấc khóa trong lúc bị khóa, trả lại được như trước.
    const unplugged = run(tuner, { seconds: 20, gapFor: () => DESKTOP, ladder, from: heavy.end });
    expect(kinds(unplugged.actions)).toEqual(['up']);
    expect(ladder.applied).toBe(0);
    expect(tuner.state()).toMatchObject({ capped: false, locked: [] });
  });

  it('mốc "lúc bắt đầu hạ" không dùng lại mốc cũ: hạ ở 25 ms rồi nâng về hết; sau đó Sổ tay mở hạ từ 50 ms còn 38 ms → đóng Sổ tay vẫn giữ nấc', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 4 };
    const first = run(tuner, { seconds: 8, gapFor: (k) => (k === 0 ? 25 : DESKTOP), ladder });
    expect(kinds(first.actions)).toEqual(['down']);
    const idle = run(tuner, { seconds: 14, gapFor: () => DESKTOP, ladder, from: first.end });
    expect(kinds(idle.actions)).toEqual(['up']);
    tuner.guard(true);
    const heavy = (k) => 50 - k * 3; // thí nghiệm nặng: mỗi nấc bớt 3 ms, hạ hết còn 38 ms
    const open = run(tuner, { seconds: 20, gapFor: heavy, ladder, from: idle.end });
    expect(kinds(open.actions)).toEqual(['down', 'down', 'down', 'down']);
    tuner.guard(false); // đóng Sổ tay, thí nghiệm vẫn bật: hạ đã giúp (50 → 38 ms), không được trả lại
    const closed = run(tuner, { seconds: 30, gapFor: heavy, ladder, from: open.end });
    expect(closed.actions).toEqual([]);
    expect(ladder.applied).toBe(4);
    expect(tuner.state().capped).toBe(false);
  });

  it('bắt đầu hạ lúc Sổ tay mở (quá tải nặng), hạ hết mà không nhanh hơn: đóng Sổ tay thì trả lại hết như luật khóa nhịp', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 3 };
    tuner.guard(true);
    const open = run(tuner, { seconds: 16, gapFor: () => 50, ladder });
    expect(kinds(open.actions)).toEqual(['down', 'down', 'down']);
    expect(open.skips, 'Sổ tay mở: người xem đang xem cảnh, không ngừng vẽ để thử').toBe(0);
    tuner.guard(false);
    const closed = run(tuner, { seconds: 10, gapFor: () => 50, ladder, from: open.end });
    expect(kinds(closed.actions)).toEqual(['reset']);
    expect(closed.skips).toBe(0);
    expect(tuner.state().capped).toBe(true);
  });

  it('khoảng giữa hai khung > 250 ms (tab ẩn, debugger) thì bỏ cả cửa sổ đang đo', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    // 40 fps nhưng cứ 1,5 giây lại có một khoảng 400 ms: không cửa sổ nào đo xong, nên không quyết gì.
    const { actions } = run(tuner, { seconds: 40, gapFor: (k, i) => (i % 60 === 59 ? 400 : 25), ladder: { applied: 0, steps: 4 } });
    expect(actions).toEqual([]);
  });

  it('canh (Sổ tay mở): chậm vừa phải thì để yên (số đo trung thực), quá tải nặng thì vẫn hạ, không bao giờ nâng', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 1, steps: 4 };
    tuner.guard(true);
    expect(tuner.state().guarding).toBe(true);
    const slow = run(tuner, { seconds: 20, gapFor: () => 25, ladder }); // 40 fps: người xem đang thử, để yên
    expect(slow.actions).toEqual([]);
    const idle = run(tuner, { seconds: 20, gapFor: () => DESKTOP, ladder, from: slow.end }); // dư mà không nâng
    expect(idle.actions).toEqual([]);
    const heavy = run(tuner, { seconds: 7, gapFor: () => 50, ladder, from: idle.end }); // 20 fps: máy bị ép quá sức
    expect(kinds(heavy.actions)).toEqual(['down']);
    tuner.guard(false);
    const normal = run(tuner, { seconds: 7, gapFor: () => 25, ladder, from: heavy.end });
    expect(kinds(normal.actions)).toEqual(['down']);
    expect(normal.actions[0].at - heavy.end / 1000).toBeGreaterThanOrEqual(5.9); // đổi chế độ: khởi động lại
  });

  it('điện thoại 45 fps (ngân sách 22,2 ms): không quá tải, cũng không dư (có rớt khung) → để yên', () => {
    const tuner = createTuner({ budgetMs: FRAME_BUDGET_MS.mobile });
    const pattern = [1000 / 60, 1000 / 60, 1000 / 30]; // trung bình 22,2 ms
    const { actions } = run(tuner, { seconds: 60, gapFor: (k, i) => pattern[i % 3], ladder: { applied: 1, steps: 4 } });
    expect(actions).toEqual([]);
  });

  it('màn 120 Hz dư nhiều (< 0,7 × ngân sách): nâng lần lượt từng nấc', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 2, steps: 4 };
    const { actions } = run(tuner, { seconds: 30, gapFor: () => 1000 / 120, ladder });
    expect(kinds(actions)).toEqual(['up', 'up']);
    expect(ladder.applied).toBe(0);
  });

  it('sau bộ chặn 60 khung/giây (như run.js): màn 72/75/85/144 Hz, nhịp lệch ±0,3 ms, máy rảnh thì nâng lại hết', () => {
    // Nhịp sau bộ chặn không đều (75 Hz: 26,7 + 13,3 + 13,3 + 13,3 ms) mà không rớt khung nào.
    for (const hz of [60, 72, 75, 85, 90, 120, 144, 165]) {
      const tuner = createTuner({ budgetMs: DESKTOP });
      const cap = createFrameCap();
      const jitter = mulberry32(hz);
      const ladder = { applied: 3, steps: 4 };
      for (let i = 1; i < hz * 60; i++) {
        const ms = (i * 1000) / hz + (jitter() - 0.5) * 0.6;
        if (!cap.ready(ms)) continue;
        const action = tuner.sample(ms, ladder);
        if (action === 'up') ladder.applied -= 1;
        else if (action) ladder.applied = action === 'down' ? ladder.applied + 1 : 0;
      }
      expect(ladder.applied, `${hz} Hz`).toBe(0);
    }
  });

  it('nhịp của bộ chặn khung là nhịp mà bộ điều chỉnh dùng để đếm khung rớt', () => {
    expect(TUNER.frameMs).toBeCloseTo(1000 / MAX_FPS, 9);
  });
});

/** Nhịp rAF của một máy có GPU bận `gpuMs` mỗi khung, trên màn 60 Hz có vsync: kịp 16,7 ms thì 60 fps, không thì 30 fps. */
const vsync = (gpuMs) => (gpuMs <= DESKTOP ? DESKTOP : 2 * DESKTOP);

describe('createTuner · đường tải (GĐ 4: đo được ms GPU)', () => {
  it('máy chưa có mẫu GPU nào: state().gpu = false; có mẫu hữu hạn > 0 thì true; mẫu vô lý bị bỏ', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    expect(tuner.state()).toEqual({ guarding: false, capped: false, locked: [], gpu: false });
    for (const bad of [0, -1, Number.NaN, Infinity, undefined]) tuner.gpu(bad);
    expect(tuner.state().gpu).toBe(false);
    tuner.gpu(4.2);
    expect(tuner.state().gpu).toBe(true);
  });

  it('laptop yếu (GPU 20 ms, nhịp 33 ms như bị khóa 30 fps): hạ nấc tới khi kịp 60 fps; không bao giờ "reset"', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 4 };
    const gpu = (k) => 20 - k * 3; // mỗi nấc bớt 3 ms GPU: 20 → 17 → 14
    const { actions } = run(tuner, { seconds: 60, gapFor: (k) => vsync(gpu(k)), gpuFor: gpu, ladder });
    expect(kinds(actions)).toEqual(['down', 'down']);
    expect(actions[0].at).toBeGreaterThanOrEqual(5.9);
    expect(actions[0].at).toBeLessThan(6.2);
    expect(ladder.applied).toBe(2);
    expect(tuner.state()).toMatchObject({ capped: false, gpu: true });
    // Cùng nhịp 33 ms mà KHÔNG đo được GPU (đường nhịp của GĐ 3): hạ hết thang, không nhanh hơn thì trả lại hết.
    const blind = createTuner({ budgetMs: DESKTOP });
    const rhythm = run(blind, { seconds: 60, gapFor: () => 2 * DESKTOP, ladder: { applied: 0, steps: 4 } });
    expect(kinds(rhythm.actions)).toEqual(['down', 'down', 'down', 'down', 'reset']);
  });

  it('khóa 30 fps mà GPU chỉ 5 ms (tiết kiệm pin): vào "bị khóa nhịp" ngay ở cửa sổ đầu, không hạ nấc nào; cắm sạc thì hết khóa', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 4 };
    const first = run(tuner, { seconds: 4.2, gapFor: () => 2 * DESKTOP, gpuFor: () => 5, ladder });
    expect(first.actions).toEqual([]);
    expect(tuner.state().capped).toBe(true);
    const later = run(tuner, { seconds: 60, gapFor: () => 2 * DESKTOP, gpuFor: () => 5, ladder, from: first.end });
    expect(later.actions).toEqual([]);
    const plugged = run(tuner, { seconds: 4, gapFor: () => DESKTOP, gpuFor: () => 5, ladder, from: later.end });
    expect(plugged.actions).toEqual([]);
    expect(tuner.state().capped).toBe(false);
  });

  it('GPU 6 ms trên màn 75 Hz, 60,1 Hz, hay lúc đang bị khóa 30 fps: nâng lại hết các nấc', () => {
    // 75 Hz qua bộ chặn 60 khung/giây (như run.js): nhịp lệch đều 26,7 + 13,3 + 13,3 + 13,3 ms.
    const at75 = createTuner({ budgetMs: DESKTOP });
    const cap = createFrameCap();
    const ladder75 = { applied: 2, steps: 4 };
    let n = 0;
    for (let i = 1; i < 75 * 40; i++) {
      const ms = (i * 1000) / 75;
      if (!cap.ready(ms)) continue;
      const action = at75.sample(ms, ladder75);
      if (action === 'up') ladder75.applied -= 1;
      else if (action) ladder75.applied += action === 'down' ? 1 : -ladder75.applied;
      if (n++ % 4 === 0) at75.gpu(6);
    }
    expect(ladder75.applied, '75 Hz').toBe(0);
    for (const [name, gap] of [['60,1 Hz', 1000 / 60.1], ['khóa 30 fps', 2 * DESKTOP]]) {
      const tuner = createTuner({ budgetMs: DESKTOP });
      const ladder = { applied: 2, steps: 4 };
      const { actions } = run(tuner, { seconds: 30, gapFor: () => gap, gpuFor: () => 6, ladder });
      expect(kinds(actions), name).toEqual(['up', 'up']);
    }
  });

  it('tải = max(trung vị ms GPU, trung bình ms CPU): JS bận 20 ms thì vẫn là quá tải dù GPU nhàn', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 4 };
    const { actions } = run(tuner, { seconds: 7, gapFor: () => 25, gpuFor: () => 4, cpuFor: () => 20, ladder });
    expect(kinds(actions)).toEqual(['down']);
    expect(tuner.state().capped).toBe(false);
  });

  it('cửa sổ dưới 3 mẫu GPU (mẫu về thưa): đi đường nhịp như GĐ 3', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 3 };
    // 30 fps: 60 khung mỗi cửa sổ 2 giây, mỗi 60 khung một mẫu GPU → 1 mẫu mỗi cửa sổ.
    const { actions } = run(tuner, { seconds: 60, gapFor: () => 2 * DESKTOP, gpuFor: () => 5, gpuEvery: 60, ladder });
    expect(kinds(actions)).toEqual(['down', 'down', 'down', 'reset']);
    expect(tuner.state()).toMatchObject({ capped: true, gpu: true });
  });

  it('chế độ canh dùng tải: nhịp 50 ms mà máy nhàn thì để yên; tải > 2,2 × ngân sách thì hạ; không bao giờ nâng', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 1, steps: 4 };
    tuner.guard(true);
    const idle = run(tuner, { seconds: 20, gapFor: () => 50, gpuFor: () => 10, ladder });
    expect(idle.actions, 'đường nhịp sẽ hạ ở đây (50 ms > 2,2 × ngân sách)').toEqual([]);
    const heavy = run(tuner, { seconds: 5, gapFor: () => 50, gpuFor: () => 40, ladder, from: idle.end });
    expect(kinds(heavy.actions)).toEqual(['down']);
    const spare = run(tuner, { seconds: 20, gapFor: () => DESKTOP, gpuFor: () => 3, ladder, from: heavy.end });
    expect(spare.actions).toEqual([]);
    expect(ladder.applied).toBe(2);
  });

  it('nâng một nấc mà quá tải lại ngay (đường tải): hạ lại và khóa nấc ấy, không dao động', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 4 };
    const gpu = (k) => (k === 0 ? 18 : 9); // chỉ nấc đầu là nặng
    const { actions } = run(tuner, { seconds: 60, gapFor: (k) => vsync(gpu(k)), gpuFor: gpu, ladder });
    expect(kinds(actions)).toEqual(['down', 'up', 'down']);
    expect(tuner.state().locked).toEqual([0]);
    expect(ladder.applied).toBe(1);
  });
});

describe('createTuner · đường nhịp: mốc "lúc bắt đầu hạ" đo lại sau mỗi lần nâng (GĐ 4)', () => {
  it('hạ 2 nấc ở 25 ms, nâng 1 nấc (chưa về hết); Sổ tay mở hạ từ 47 ms còn 38 ms → đóng Sổ tay vẫn giữ nấc, không "reset"', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 4 };
    const slow = run(tuner, { seconds: 12, gapFor: (k) => (k < 2 ? 25 : DESKTOP), ladder });
    expect(kinds(slow.actions)).toEqual(['down', 'down']);
    const idle = run(tuner, { seconds: 16, gapFor: () => DESKTOP, ladder, from: slow.end });
    expect(kinds(idle.actions)).toEqual(['up']);
    expect(ladder.applied).toBe(1);
    tuner.guard(true);
    const heavy = (k) => 50 - k * 3; // thí nghiệm nặng: 47 ms ở nấc 1, hạ hết còn 38 ms
    const open = run(tuner, { seconds: 20, gapFor: heavy, ladder, from: idle.end });
    expect(kinds(open.actions)).toEqual(['down', 'down', 'down']);
    tuner.guard(false);
    const closed = run(tuner, { seconds: 30, gapFor: heavy, ladder, from: open.end });
    expect(closed.actions, 'GĐ 3 so với mốc cũ 25 ms nên tưởng nhịp bị khóa và trả lại hết').toEqual([]);
    expect(ladder.applied).toBe(4);
    expect(tuner.state()).toMatchObject({ capped: false, locked: [] });
  });
});
