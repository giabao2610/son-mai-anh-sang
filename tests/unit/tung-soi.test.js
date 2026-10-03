// @vitest-environment jsdom
// tests/unit/tung-soi.test.js — Từng sợi: thanh 0 → N lần vẽ (mở là ở N), aria-valuetext có nhãn vật, "Dệt lại", N đổi giữa chừng, tắt thì gỡ móc.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BoxGeometry, Mesh, MeshStandardNodeMaterial, PerspectiveCamera } from 'three/webgpu';
import * as tungSoi from '../../src/engine/tools/tung-soi.js';
import { tools } from '../../src/engine/tools/index.js';
import { createDrawProbe } from '../../src/engine/gpu/draws.js';
import { createToolbox } from '../../src/engine/gpu/toolbox.js';
import t from '../../src/ui/strings.vi.js';

const { POLL_MS, STEP_MS, MAX_PLAY_MS, playStepMs, playStride } = tungSoi;
const text = t.tools['tung-soi'];

/** Ba lần vẽ của lượt vẽ cảnh, như draws.js ghi: mặt nước kéo theo hai lần vẽ lồng (phản chiếu); một vật không thuộc lớp nào. */
const DRAWS = [
  { layerId: 'cot', layer: 'Cốt', name: 'la-noi', label: 'Lá nổi', kind: 'InstancedMesh', instances: 1200, triangles: 9600, material: 'MeshStandardNodeMaterial', nested: 0 },
  { layerId: 'mat-nuoc', layer: 'Mặt nước', name: 'mat-nuoc', label: 'Mặt nước', kind: 'Mesh', instances: 1, triangles: 2, material: 'MeshStandardNodeMaterial', nested: 2 },
  { layerId: null, layer: null, name: null, label: 'Sprite', kind: 'Sprite', instances: 1, triangles: 2, material: 'SpriteNodeMaterial', nested: 0 },
];
/** n lần vẽ khác nhau (thí nghiệm "Tắt instancing" làm lá nổi thành hàng trăm sợi). */
const many = (n) => Array.from({ length: n }, (_, i) => ({ ...DRAWS[0], name: `v${i}`, label: `Vật ${i}` }));

/** ToolApi giả với móc lần vẽ giả. setList(): khung mới có danh sách khác (camera kéo, thí nghiệm thêm vật). */
function fakeApi() {
  let list = DRAWS;
  const el = document.createElement('div');
  document.body.append(el);
  return {
    el,
    t,
    views: () => [],
    requireView: vi.fn(async () => {}),
    redraw: vi.fn(async () => {}),
    draws: { start: vi.fn(), stop: vi.fn(), limit: vi.fn(), list: () => list, counts: () => ({ scene: 3, reflection: 2, other: 24 }) },
    setList: (next) => {
      list = next;
    },
  };
}
const parts = (el) => ({
  range: el.querySelector('input[type="range"]'),
  shown: el.querySelector('output'),
  play: el.querySelector('button'),
  detail: el.querySelector('.tool-detail'),
  summary: el.querySelector('.tool-summary'),
  note: el.querySelector('.tool-note'),
});
const slide = (range, v) => {
  range.value = String(v);
  range.dispatchEvent(new Event('input', { bubbles: true }));
};
/** Gắn và bật công cụ, rồi chờ một nhịp đọc: thanh đã có danh sách của khung. */
async function opened(api = fakeApi()) {
  const tool = tungSoi.mount(api);
  tool.activate(true);
  await vi.advanceTimersByTimeAsync(POLL_MS);
  return { api, tool, ...parts(api.el) };
}

beforeEach(() => {
  document.body.replaceChildren();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe('Từng sợi', () => {
  it('Đồ nghề có Từng sợi sau Kính mài và Lột lớp (tools/index.js); công cụ nào cũng có tên trong t.tools', () => {
    expect(tools.map((x) => x.id)).toEqual(['kinh-mai', 'lot-lop', 'tung-soi']);
    for (const tool of tools) expect(typeof t.tools[tool.id]?.name, tool.id).toBe('string');
  });

  it('bật công cụ thì gọi draws.start; sau một nhịp đọc, thanh có max = số sợi và đứng ở nấc cuối (ảnh không đổi)', async () => {
    const api = fakeApi();
    const tool = tungSoi.mount(api);
    const { range, shown, detail, summary } = parts(api.el);
    expect(api.draws.start).not.toHaveBeenCalled(); // móc chỉ gắn khi công cụ bật: lúc khác cảnh không tốn gì
    expect(api.el.querySelector(`label[for="${range.id}"]`).textContent).toBe(text.label);
    expect([tool.overlay, tool.onGesture]).toEqual([undefined, undefined]); // không phủ gì lên ảnh; chạm vẫn tới bức
    tool.activate(true);
    tool.activate(true); // bật lại khi đang bật: không gắn móc lần nữa, không thêm lượt đọc
    expect(api.draws.start).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(1);
    expect(api.redraw).toHaveBeenCalledTimes(1); // ?freeze: vẽ lại khung N để móc ghi được nó
    expect([detail.textContent, summary.textContent]).toEqual([text.counting, '']); // chưa có khung nào được ghi
    await vi.advanceTimersByTimeAsync(0); // khung vẽ lại đó đã được ghi: thanh có danh sách ngay, không chờ nhịp đọc
    expect([range.max, range.value]).toEqual(['3', '3']);
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.min, range.max, range.step, range.value]).toEqual(['0', '3', '1', '3']);
    expect(shown.textContent).toBe('3/3');
    expect(api.draws.limit).not.toHaveBeenCalled(); // nấc N: không giới hạn gì
  });

  it('đang đếm (móc chưa ghi khung nào): "Dệt lại" bị khóa (disabled), không làm gì; danh sách tới thì nút mở và thanh hiện ở nấc cuối', async () => {
    const api = fakeApi();
    api.setList([]);
    const { range, play, detail } = await opened(api);
    expect(play.disabled).toBe(true);
    play.click();
    expect([play.getAttribute('aria-pressed'), range.max, detail.textContent]).toEqual(['false', '0', text.counting]);
    expect(api.draws.limit).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(1); // chỉ còn lượt đọc
    api.setList(DRAWS);
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.max, range.value, range.getAttribute('aria-valuetext'), play.disabled]).toEqual(['3', '3', 'Sợi 3 trên 3: Sprite', false]);
    // Danh sách rỗng lại ngay trước khi bấm (nút còn mở vì chưa tới nhịp đọc): bấm thì chụp lại danh sách rỗng và không chạy.
    api.setList([]);
    play.click();
    expect([play.getAttribute('aria-pressed'), vi.getTimerCount()]).toEqual(['false', 1]);
    expect(api.draws.limit).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([play.disabled, detail.textContent]).toEqual([true, text.counting]);
  });

  it('aria-valuetext và dòng mô tả nói về sợi đang xem (sợi k là lần vẽ thứ k); nấc 0 thì nói chưa vẽ gì; ô số k/N không tự đọc', async () => {
    const { range, shown, detail } = await opened();
    // <output> ngầm là role status (aria-live polite): "Dệt lại" 40 ms một bước sẽ làm ngập hàng đợi của trình đọc màn hình.
    // Tiến độ tới người nghe qua aria-valuetext của thanh.
    expect(shown.getAttribute('aria-live')).toBe('off');
    expect(range.getAttribute('aria-valuetext')).toBe('Sợi 3 trên 3: Sprite');
    slide(range, 1);
    expect([range.getAttribute('aria-valuetext'), shown.textContent]).toEqual(['Sợi 1 trên 3: Lá nổi', '1/3']);
    // Nhãn vật · lớp · loại × số bản · số tam giác; số viết kiểu Việt (dấu chấm ngăn hàng nghìn).
    expect(detail.textContent).toBe('Lá nổi · lớp Cốt · InstancedMesh × 1.200 · 9.600 tam giác.');
    slide(range, 0);
    expect([range.getAttribute('aria-valuetext'), shown.textContent]).toEqual(['Sợi 0 trên 3: chưa vẽ gì', '0/3']);
    expect(detail.textContent).toBe(text.empty);
  });

  it('kéo về nấc k < N gọi limit(k) và vẽ lại; về nấc N gọi limit(null)', async () => {
    const { api, range } = await opened();
    api.redraw.mockClear();
    slide(range, 2);
    expect(api.draws.limit).toHaveBeenLastCalledWith(2);
    slide(range, 0);
    expect(api.draws.limit).toHaveBeenLastCalledWith(0);
    slide(range, 3);
    expect(api.draws.limit).toHaveBeenLastCalledWith(null);
    expect(api.redraw).toHaveBeenCalledTimes(3); // ?freeze: mỗi lần đổi sợi vẽ lại đúng khung N
  });

  it('sợi của mặt nước có câu về ảnh phản chiếu; vật không thuộc lớp nào ghi "không thuộc lớp nào"', async () => {
    const { range, detail } = await opened();
    slide(range, 2);
    expect(text.nested(2)).toBe('Trước khi vẽ vật này, GPU vẽ lại 2 lần cho ảnh phản chiếu.');
    expect(detail.textContent).toBe(`Mặt nước · lớp Mặt nước · Mesh · 2 tam giác. ${text.nested(2)}`);
    slide(range, 3);
    expect(detail.textContent).toBe('Sprite · không thuộc lớp nào · Sprite · 2 tam giác.');
  });

  it('"Dệt lại" đi từ 0 tới N theo playStepMs rồi tự dừng (aria-pressed về false); bấm lại khi đang chạy thì dừng; kéo thanh cũng dừng', async () => {
    const { api, range, play } = await opened();
    const step = playStepMs(3);
    expect(play.getAttribute('aria-pressed')).toBe('false');
    play.click();
    expect([play.getAttribute('aria-pressed'), range.value]).toEqual(['true', '0']);
    expect(api.draws.limit).toHaveBeenLastCalledWith(0);
    await vi.advanceTimersByTimeAsync(step - 1);
    expect(range.value).toBe('0');
    await vi.advanceTimersByTimeAsync(1);
    expect(range.value).toBe('1');
    expect(api.draws.limit).toHaveBeenLastCalledWith(1);
    await vi.advanceTimersByTimeAsync(step);
    expect([range.value, play.getAttribute('aria-pressed')]).toEqual(['2', 'true']);
    await vi.advanceTimersByTimeAsync(step);
    expect([range.value, play.getAttribute('aria-pressed')]).toEqual(['3', 'false']); // tới N: ảnh đủ, tự dừng
    expect(api.draws.limit).toHaveBeenLastCalledWith(null);
    const limits = api.draws.limit.mock.calls.length;
    await vi.advanceTimersByTimeAsync(10 * step);
    expect(api.draws.limit).toHaveBeenCalledTimes(limits);

    play.click(); // bấm lại khi đang chạy: dừng ở sợi đang xem
    await vi.advanceTimersByTimeAsync(step);
    play.click();
    expect([range.value, play.getAttribute('aria-pressed')]).toEqual(['1', 'false']);
    await vi.advanceTimersByTimeAsync(10 * step);
    expect(range.value).toBe('1');

    play.click(); // kéo thanh cũng dừng
    expect(range.value).toBe('0');
    slide(range, 2);
    expect(play.getAttribute('aria-pressed')).toBe('false');
    await vi.advanceTimersByTimeAsync(10 * step);
    expect(range.value).toBe('2');
  });

  it('"Dệt lại" với nhiều sợi đi nhanh hơn: mỗi bước playStepMs(N), cả lượt chừng MAX_PLAY_MS', async () => {
    const api = fakeApi();
    api.setList(many(300));
    const { range, play } = await opened(api);
    const step = playStepMs(300); // 40 ms: vẫn 0,6 giây mỗi sợi thì 300 sợi mất 3 phút
    expect([range.max, playStride(300)]).toEqual(['300', 1]); // từng sợi một
    play.click();
    await vi.advanceTimersByTimeAsync(step);
    expect(range.value).toBe('1');
    await vi.advanceTimersByTimeAsync(MAX_PLAY_MS - 2 * step);
    expect([range.value, play.getAttribute('aria-pressed')]).toEqual(['299', 'true']);
    await vi.advanceTimersByTimeAsync(step);
    expect([range.value, play.getAttribute('aria-pressed')]).toEqual(['300', 'false']); // tới N đúng lúc MAX_PLAY_MS
  });

  it('"Dệt lại" với hơn 750 sợi: mỗi bước đi playStride(N) sợi, bước cuối đáp đúng N, cả lượt vẫn chừng MAX_PLAY_MS', async () => {
    const api = fakeApi();
    api.setList(many(1200)); // "Tắt instancing": chừng 1 200 sợi lá
    const { range, play } = await opened(api);
    const step = playStepMs(1200);
    expect([playStride(1200), step]).toEqual([2, 20]); // từng sợi một, mỗi bước 16 ms, thì mất 19 giây
    play.click();
    await vi.advanceTimersByTimeAsync(step);
    expect(range.value).toBe('2');
    await vi.advanceTimersByTimeAsync(MAX_PLAY_MS - 2 * step);
    expect([range.value, play.getAttribute('aria-pressed')]).toEqual(['1198', 'true']);
    await vi.advanceTimersByTimeAsync(step);
    expect([range.value, play.getAttribute('aria-pressed')]).toEqual(['1200', 'false']); // tới N đúng lúc MAX_PLAY_MS

    // N không chia hết cho bước: 1 998 + 3 vượt N, nên bước cuối đi 2 sợi và đáp đúng nấc N (limit(null)).
    api.setList(many(2000));
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.max, playStride(2000), playStepMs(2000)]).toEqual(['2000', 3, 18]);
    api.draws.limit.mockClear();
    play.click();
    await vi.advanceTimersByTimeAsync(Math.ceil(2000 / 3) * 18); // 667 bước: 12 006 ms
    expect(api.draws.limit.mock.calls.map(([v]) => v).slice(0, 3)).toEqual([0, 3, 6]);
    expect(api.draws.limit.mock.calls.map(([v]) => v).slice(-3)).toEqual([1995, 1998, null]);
    expect([range.value, play.getAttribute('aria-pressed')]).toEqual(['2000', 'false']);
  });

  it('?freeze: bước kế tiếp chỉ hẹn giờ khi khung trước đã vẽ lại xong (vẽ lại chậm không dồn bước); vẽ lại hỏng thì dừng', async () => {
    const { api, range, play } = await opened();
    const step = playStepMs(3);
    let finish = null;
    api.redraw.mockImplementation(() => new Promise((resolve) => {
      finish = resolve;
    }));
    play.click();
    await vi.advanceTimersByTimeAsync(10 * step);
    expect(range.value).toBe('0');
    finish();
    await vi.advanceTimersByTimeAsync(step);
    expect(range.value).toBe('1');
    await vi.advanceTimersByTimeAsync(10 * step); // khung của sợi 1 chưa vẽ xong: không có bước nào nữa
    expect(range.value).toBe('1');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    api.redraw.mockImplementation(async () => {
      throw new Error('khung hỏng');
    });
    finish(); // khung của sợi 1 vẽ xong; sợi 2 vẽ lại hỏng
    await vi.advanceTimersByTimeAsync(step);
    expect([range.value, play.getAttribute('aria-pressed')]).toEqual(['2', 'false']);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('tắt công cụ: dừng chạy, limit(null) rồi stop(); gọi hai lần vẫn an toàn; bật lại thì đếm lại từ đầu', async () => {
    const { api, tool, range, play, detail } = await opened();
    play.click();
    await vi.advanceTimersByTimeAsync(playStepMs(3));
    api.redraw.mockClear();
    tool.activate(false);
    expect(play.getAttribute('aria-pressed')).toBe('false');
    expect(api.draws.limit).toHaveBeenLastCalledWith(null);
    expect(api.draws.stop).toHaveBeenCalledTimes(1);
    // limit(null) TRƯỚC stop(): bỏ giới hạn rồi mới gỡ móc
    expect(api.draws.limit.mock.invocationCallOrder.at(-1)).toBeLessThan(api.draws.stop.mock.invocationCallOrder[0]);
    expect(api.redraw).toHaveBeenCalledTimes(1); // ?freeze: khung N vẽ lại đủ
    expect(vi.getTimerCount()).toBe(0); // không còn lượt đọc (setInterval) hay bước "Dệt lại" nào hẹn giờ
    const limits = api.draws.limit.mock.calls.length;
    tool.activate(false);
    tool.dispose();
    await vi.advanceTimersByTimeAsync(10 * playStepMs(3)); // không còn "Dệt lại" hay lượt đọc nào chạy
    expect([api.draws.stop.mock.calls.length, api.draws.limit.mock.calls.length]).toEqual([1, limits]);
    tool.activate(true);
    expect([api.draws.start.mock.calls.length, detail.textContent]).toEqual([2, text.counting]);
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect(range.value).toBe('3');
    // Gỡ khi đang bật (gỡ cảnh): gỡ móc, không vẽ lại.
    api.redraw.mockClear();
    tool.dispose();
    expect(api.draws.stop).toHaveBeenCalledTimes(2);
    expect(api.redraw).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0); // "Dựng lại cảnh": lượt đọc cũ không giữ móc và DOM cũ sống tiếp
  });

  it('playStepMs và playStride: 11 sợi → 600 ms; 300 sợi → 40 ms; quá 750 sợi thì mỗi bước đi nhiều sợi; 0 hay 1 sợi không chia cho 0', () => {
    expect([STEP_MS, playStepMs(11), playStride(11)]).toEqual([600, 600, 1]);
    expect([playStepMs(300), playStride(300)]).toEqual([40, 1]);
    expect(300 * playStepMs(300)).toBe(MAX_PLAY_MS); // nhiều sợi thì đi nhanh hơn: cả lượt chừng 12 giây
    expect([playStepMs(0), playStepMs(1), playStride(0), playStride(1)]).toEqual([600, 600, 1, 1]);
    // 750 sợi là vừa chạm đáy 16 ms (một khung) mỗi bước; thêm một sợi nữa thì mỗi bước phải đi hai sợi.
    expect([750, 751, 1200, 5000].map(playStride)).toEqual([1, 2, 2, 7]);
    for (const n of [300, 750, 751, 1200, 5000]) {
      const step = playStepMs(n);
      const whole = Math.ceil(n / playStride(n)) * step; // bước cuối có thể đi ít sợi hơn: vẫn tính một bước
      expect(step, `${n} sợi`).toBeGreaterThanOrEqual(16); // không nhanh hơn một khung
      expect(whole, `${n} sợi`).toBeGreaterThanOrEqual(MAX_PLAY_MS);
      expect(whole, `${n} sợi`).toBeLessThan(MAX_PLAY_MS + step); // chừng 12 giây: dư nhiều nhất một bước
    }
  });

  it('tóm tắt khung đọc counts(); ghi chú tĩnh nói vì sao bóng và phản chiếu luôn đủ', async () => {
    const { summary, note } = await opened();
    expect(summary.textContent).toBe('Khung này: lượt vẽ cảnh 3 · phản chiếu 2 · các lượt khác (bóng, bloom, hậu kỳ) 24 draw call.');
    expect(note.textContent).toBe(text.note);
  });

  it('số sợi đổi giữa chừng: đang xem đủ khung thì thanh theo N mới; đang dừng ở sợi k < N hay đang "Dệt lại" thì giữ nguyên k, max và dòng mô tả', async () => {
    const { api, range, play, detail } = await opened();
    const single = (i) => ({ ...DRAWS[0], name: 'la-rieng', label: `Lá riêng ${i}`, kind: 'Mesh', instances: 1, triangles: 8 });
    api.setList([...DRAWS, single(1), single(2)]); // thí nghiệm "Tắt instancing": thêm Mesh
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.max, range.value, range.getAttribute('aria-valuetext')]).toEqual(['5', '5', 'Sợi 5 trên 5: Lá riêng 2']);
    api.setList(DRAWS.slice(0, 2)); // camera kéo làm vật ra khỏi khung
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.max, range.value]).toEqual(['2', '2']);

    // Dừng ở sợi 1: móc không ghi khi đang giới hạn, nên thanh giữ danh sách cũ dù list() có trả gì đi nữa.
    slide(range, 1);
    const held = detail.textContent;
    api.setList(DRAWS);
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.max, range.value, detail.textContent]).toEqual(['2', '1', held]);
    slide(range, 2); // về N: lại theo khung mới
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.max, range.value]).toEqual(['3', '3']);

    play.click();
    api.setList([...DRAWS, single(1)]);
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.max, range.value]).toEqual(['3', '0']);
    await vi.advanceTimersByTimeAsync(3 * playStepMs(3)); // "Dệt lại" xong ở N = 3, rồi thanh theo khung mới
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.max, range.value, play.getAttribute('aria-pressed')]).toEqual(['4', '4', 'false']);
  });

  it('rời khung đủ ngay sau khi khung đổi (chưa tới nhịp đọc): thanh chụp lại đúng danh sách mà limit() sắp cắt', async () => {
    const { api, range, play } = await opened();
    // Camera dời: three sắp lại vật đục theo độ sâu, và một vật mới vào khung. limit(1) giữ lần vẽ đầu của danh sách MỚI.
    api.setList([DRAWS[2], DRAWS[0], DRAWS[1], { ...DRAWS[0], name: 'la-dung', label: 'Lá đứng' }]);
    slide(range, 1);
    expect(api.draws.limit).toHaveBeenLastCalledWith(1);
    expect([range.max, range.value, range.getAttribute('aria-valuetext')]).toEqual(['4', '1', 'Sợi 1 trên 4: Sprite']);
    slide(range, 4);
    await vi.advanceTimersByTimeAsync(POLL_MS);
    api.setList(DRAWS);
    play.click(); // "Dệt lại" cũng rời khung đủ
    expect([range.max, range.value]).toEqual(['3', '0']);
  });

  it('danh sách co lại giữa hai nhịp đọc rồi người xem kéo quá N mới: thanh kẹp về N, vẽ đủ (limit(null)), không ném lỗi', async () => {
    const api = fakeApi();
    api.setList(many(30));
    const { range, shown, detail } = await opened(api);
    api.setList(many(10)); // camera kéo: hai mươi vật ra khỏi khung, chưa tới nhịp đọc
    const errors = vi.fn((event) => event.preventDefault()); // lỗi trong trình nghe 'input' tới window, không tới slide()
    window.addEventListener('error', errors);
    slide(range, 25);
    window.removeEventListener('error', errors);
    expect(errors.mock.calls.map(([event]) => event.message)).toEqual([]);
    expect(api.draws.limit).toHaveBeenLastCalledWith(null);
    expect([range.max, range.value, shown.textContent, range.getAttribute('aria-valuetext')]).toEqual(['10', '10', '10/10', 'Sợi 10 trên 10: Vật 9']);
    expect(detail.textContent).toBe('Vật 9 · lớp Cốt · InstancedMesh × 1.200 · 9.600 tam giác.');
  });

  it('nhịp đọc mà khung không đổi thì không ghi gì vào DOM, cả lúc đang đếm: trình đọc màn hình không đọc lại thanh hay các dòng chữ', async () => {
    const api = fakeApi();
    api.setList([]);
    await opened(api);
    const seen = new MutationObserver(() => {});
    seen.observe(api.el, { subtree: true, childList: true, characterData: true, attributes: true });
    const changes = () => seen.takeRecords().map((r) => `${r.type} ${r.target.nodeName}`);
    vi.advanceTimersByTime(8 * POLL_MS); // đang đếm: móc chưa ghi khung nào
    expect(changes()).toEqual([]);
    api.setList(DRAWS); // khung đổi thì có ghi: bộ quan sát thấy được
    vi.advanceTimersByTime(POLL_MS);
    expect(changes()).toContain('childList OUTPUT');
    vi.advanceTimersByTime(8 * POLL_MS); // đang xem đủ khung, khung vẫn ba sợi đó
    expect(changes()).toEqual([]);
    seen.disconnect();
  });

  it('móc thật (draws.js, renderer giả): mở là N lần vẽ của khung; nấc k chỉ vẽ k vật đầu và danh sách đứng yên; về N thì theo khung mới', async () => {
    const renderer = {
      info: { render: { drawCalls: 0 } },
      fn: null,
      getRenderObjectFunction() {
        return this.fn;
      },
      setRenderObjectFunction(f) {
        this.fn = f;
      },
      renderObject: vi.fn(function () {
        this.info.render.drawCalls += 1;
      }),
    };
    const camera = new PerspectiveCamera();
    const box = (name) => Object.assign(new Mesh(new BoxGeometry(), new MeshStandardNodeMaterial()), { name });
    const objects = [box('a'), box('b'), box('c')];
    const draws = createDrawProbe({ renderer, camera, layers: [{ id: 'cot', layer: { objects } }], meta: { layers: [{ id: 'cot', name: 'Cốt' }] } });
    /** Một khung như scene.js: begin → mọi vật qua hàm vẽ hiện tại (móc, khi đã gắn) → end. */
    const frame = () => {
      draws.begin();
      for (const o of objects) (renderer.fn ?? renderer.renderObject).call(renderer, o, null, camera, o.geometry, o.material, null, null, null, null);
      draws.end();
    };
    const api = { ...fakeApi(), draws, redraw: vi.fn(async () => frame()) };
    const tool = tungSoi.mount(api);
    const { range, detail } = parts(api.el);
    tool.activate(true);
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.max, range.value, detail.textContent]).toEqual(['3', '3', 'c · lớp Cốt · Mesh · 12 tam giác.']);
    renderer.renderObject.mockClear();
    slide(range, 1);
    expect(renderer.renderObject.mock.calls.map(([o]) => o.name)).toEqual(['a']);
    objects.push(box('d'));
    frame();
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.max, range.value]).toEqual(['3', '1']);
    slide(range, 3);
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.max, range.value]).toEqual(['4', '4']);
    tool.activate(false);
    expect(renderer.fn).toBeNull(); // trả hàm vẽ cũ
  });

  it('xưởng chưa có móc (api.draws null): gắn hỏng bằng lỗi tiếng Việt, hộp đồ nghề bỏ công cụ này (không còn nút mở ra bảng trống)', () => {
    expect(() => tungSoi.mount({ ...fakeApi(), draws: null })).toThrow('ToolApi.draws');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const views = { list: () => [], require: vi.fn(async () => {}), setOverlays: () => [] };
    const toolbox = createToolbox({ tools: [tungSoi], views, doc: document, t, draws: null });
    expect(toolbox.list()).toEqual([]); // thanh lớp vẽ mục "Đồ nghề" từ danh sách này: không có nút Từng sợi
    expect(document.querySelector('[data-tool-slot="tung-soi"]')).toBeNull();
    expect(warn).toHaveBeenCalledWith('Công cụ "tung-soi" gắn không được, bỏ công cụ này:', expect.any(Error));
    warn.mockRestore();
    toolbox.dispose();
  });
});
