// tests/unit/quality.test.js — chọn mức, ngân sách của bức, và bộ điều chỉnh có trễ chạy trên chuỗi khung giả.
import { describe, expect, it } from 'vitest';
import { DEFAULT_LEVELS, FRAME_BUDGET_MS, LEVELS, TUNER, budgetFor, createTuner, isMobile, pickLevel } from '../../src/engine/quality.js';
import { MAX_FPS, createFrameCap } from '../../src/engine/gpu/clock.js';
import { mulberry32 } from '../../src/lib/random.js';

const UA = {
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
  // iPadOS 13+ tự xưng là Mac: chỉ phân biệt được nhờ màn hình cảm ứng.
  ipadOs: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
  mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
  windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
};

describe('mức chất lượng', () => {
  it('ba mức theo thứ tự từ cao xuống thấp; mức mặc định của xưởng chỉ có dpr', () => {
    expect(LEVELS).toEqual(['cao', 'vua', 'thap']);
    expect(DEFAULT_LEVELS).toEqual({ cao: { dpr: 2 }, vua: { dpr: 1.5 }, thap: { dpr: 1.25 } });
  });

  it('pickLevel theo bảng §10: WebGPU cao/vừa, WebGL2 vừa/thấp', () => {
    expect(pickLevel({ tier: 'webgpu', mobile: false })).toBe('cao');
    expect(pickLevel({ tier: 'webgpu', mobile: true })).toBe('vua');
    expect(pickLevel({ tier: 'webgl2', mobile: false })).toBe('vua');
    expect(pickLevel({ tier: 'webgl2', mobile: true })).toBe('thap');
  });

  it('pickLevel với tầng lạ thì ném lỗi (tầng tĩnh không bao giờ chọn mức)', () => {
    expect(() => pickLevel({ tier: 'static', mobile: false })).toThrow('static');
  });
});

describe('isMobile', () => {
  it('Android và iPhone là điện thoại', () => {
    expect(isMobile({ userAgent: UA.android, maxTouchPoints: 5 })).toBe(true);
    expect(isMobile({ userAgent: UA.iphone, maxTouchPoints: 5 })).toBe(true);
  });

  it('iPadOS (UA Macintosh + cảm ứng) tính là điện thoại; Mac và Windows thì không', () => {
    expect(isMobile({ userAgent: UA.ipadOs, maxTouchPoints: 5 })).toBe(true);
    expect(isMobile({ userAgent: UA.mac, maxTouchPoints: 0 })).toBe(false);
    expect(isMobile({ userAgent: UA.windows, maxTouchPoints: 10 })).toBe(false);
  });

  it('thiếu thông tin thì coi là desktop', () => {
    expect(isMobile()).toBe(false);
    expect(isMobile({})).toBe(false);
  });
});

describe('budgetFor', () => {
  it('bức không khai báo quality → mức mặc định của xưởng', () => {
    expect(budgetFor('cao')).toEqual({ dpr: 2 });
    expect(budgetFor('thap', {})).toEqual({ dpr: 1.25 });
  });

  it('ghép số của bức lên mức mặc định, bức ghi đè được dpr', () => {
    const quality = { levels: { cao: { leaves: 1200, reflection: 0.5 }, vua: { dpr: 1.25, leaves: 800 } }, ladder: ['dpr'] };
    expect(budgetFor('cao', quality)).toEqual({ dpr: 2, leaves: 1200, reflection: 0.5 });
    expect(budgetFor('vua', quality)).toEqual({ dpr: 1.25, leaves: 800 });
    expect(budgetFor('thap', quality)).toEqual({ dpr: 1.25 });
  });

  it('trả object mới: sửa kết quả không làm hỏng mức mặc định', () => {
    const b = budgetFor('cao');
    b.dpr = 99;
    expect(DEFAULT_LEVELS.cao.dpr).toBe(2);
  });

  it('mức lạ thì ném lỗi', () => {
    expect(() => budgetFor('sieu')).toThrow('sieu');
  });
});

const DESKTOP = FRAME_BUDGET_MS.desktop;

/**
 * Cho bộ điều chỉnh "chạy" `seconds` giây. Khoảng giữa hai khung lấy từ gapFor(số nấc đang áp, i): như máy thật,
 * hạ nấc thì khung nhanh lên. Thang giả có `steps` nấc; 'down' / 'up' / 'reset' đổi `applied` như ladder.js.
 * Trả mọi quyết định kèm thời điểm (giây).
 */
function run(tuner, { seconds, gapFor, ladder, from = 0 }) {
  const actions = [];
  let t = from;
  for (let i = 0; t < from + seconds * 1000; i++) {
    t += gapFor(ladder.applied, i);
    const action = tuner.sample(t, ladder);
    if (!action) continue;
    actions.push({ at: +(t / 1000).toFixed(2), action });
    if (action === 'down') ladder.applied += 1;
    else if (action === 'up') ladder.applied -= 1;
    else ladder.applied = 0;
  }
  return { actions, end: t };
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
    const { actions } = run(tuner, { seconds: 60, gapFor: (k) => Math.max(25 - k * 4.5, 16), ladder });
    expect(kinds(actions)).toEqual(['down', 'down', 'up', 'down']);
    expect(actions[0].at).toBeGreaterThanOrEqual(5.9);
    expect(actions[0].at).toBeLessThan(6.2);
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

  it('khóa nhịp 30 fps (tiết kiệm pin): hạ hết thang, không nhanh hơn → trả lại hết, thôi hạ; hết khóa thì chạy lại', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 3 };
    let gap = 1000 / 30;
    const first = run(tuner, { seconds: 60, gapFor: () => gap, ladder });
    expect(kinds(first.actions)).toEqual(['down', 'down', 'down', 'reset']);
    expect(ladder.applied).toBe(0);
    expect(tuner.state().capped).toBe(true);
    // Cắm sạc: về 60 fps, hết khóa (không còn nấc nào để nâng). Rồi máy thật sự chậm (40 fps): lại hạ được.
    gap = DESKTOP;
    expect(run(tuner, { seconds: 10, gapFor: () => gap, ladder, from: first.end }).actions).toEqual([]);
    expect(tuner.state().capped).toBe(false);
    const again = run(tuner, { seconds: 6, gapFor: () => 25, ladder, from: first.end + 10_000 });
    expect(kinds(again.actions)).toEqual(['down']);
  });

  it('hết khóa nhịp trên màn 59,94 Hz, hay khi mỗi cửa sổ rớt một khung: thoát "bị khóa nhịp", rồi chậm thật thì lại hạ', () => {
    const idles = { '59,94 Hz': () => 1000 / 59.94, '60 Hz rớt 1 khung / 2 s': (k, i) => (i % 120 === 60 ? 2 * DESKTOP : DESKTOP) };
    for (const [name, idle] of Object.entries(idles)) {
      const tuner = createTuner({ budgetMs: DESKTOP });
      const ladder = { applied: 0, steps: 3 };
      const locked = run(tuner, { seconds: 60, gapFor: () => 1000 / 30, ladder });
      expect(kinds(locked.actions), name).toEqual(['down', 'down', 'down', 'reset']);
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
      const locked = run(tuner, { seconds: 60, gapFor: () => 1000 / 30, ladder });
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
    const locked = run(tuner, { seconds: 60, gapFor: () => 1000 / 30, ladder });
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
    const locked = run(tuner, { seconds: 60, gapFor: () => 1000 / 30, ladder });
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
    tuner.guard(false);
    const closed = run(tuner, { seconds: 10, gapFor: () => 50, ladder, from: open.end });
    expect(kinds(closed.actions)).toEqual(['reset']);
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
