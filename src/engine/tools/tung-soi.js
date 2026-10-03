// engine/tools/tung-soi.js — công cụ Từng sợi: dệt lại khung hình từng lần vẽ (draw call) một, theo đúng thứ tự GPU nhận; chỉ nhìn api.draws.
import { h } from '../../ui/dom.js';

export const id = 'tung-soi';
export const STEP_MS = 600; // mỗi sợi khi "Dệt lại"
export const MAX_PLAY_MS = 12000; // cả lượt không quá chừng này: nhiều sợi thì đi nhanh hơn
export const POLL_MS = 250; // đọc lại danh sách lần vẽ khi đang xem đủ khung
const FRAME_MS = 16; // một bước không nhanh hơn một khung

/**
 * Số sợi mỗi bước của "Dệt lại" cho n sợi. Spec §7: cả lượt không quá chừng 12 giây. Bước không ngắn hơn một khung, nên quá
 * 750 sợi mà vẫn đi từng sợi một thì lượt dài ra (tắt instancing có thể ra chừng 1 200 sợi: 19 giây): mỗi bước đi nhiều sợi.
 */
export function playStride(n) {
  return Math.max(1, Math.ceil((n * FRAME_MS) / MAX_PLAY_MS));
}

/** Một bước của "Dệt lại" cho n sợi (ms): 0,6 giây mỗi sợi; nhiều sợi thì các bước chia nhau chừng 12 giây, không nhanh hơn một khung. */
export function playStepMs(n) {
  return Math.min(STEP_MS, Math.max(FRAME_MS, (MAX_PLAY_MS * playStride(n)) / Math.max(1, n)));
}

/**
 * Lột lớp cho thấy các bước SAU lượt vẽ cảnh (bloom, tone); Từng sợi cho thấy chính lượt vẽ cảnh được làm ra thế nào (spec §7).
 * Sợi là một lần vẽ của lượt vẽ cảnh. Thanh ở nấc k thì móc lần vẽ (engine/gpu/draws.js) chỉ cho k lần vẽ đầu đi qua: nấc N (lúc
 * mở) là ảnh không đổi gì, nấc 0 chỉ còn màu nền xóa khung (vẫn qua hậu kỳ). Bóng đổ và phản chiếu vẽ ở lượt riêng nên luôn đủ.
 * Không overlay, không giữ cử chỉ nào (chạm và chạm hai lần vẫn tới bức), không biết có bức nào: chỉ đọc DrawInfo.
 *
 * Thanh hiện một BẢN CHỤP list() + counts() của cùng một khung vẽ đủ:
 * - đang xem đủ khung (k = N, không "Dệt lại"): mỗi POLL_MS chụp lại, thanh theo N mới (camera kéo làm vật ra khỏi khung, thí
 *   nghiệm thêm hàng trăm Mesh) mà vẫn đứng ở nấc cuối;
 * - rời khung đủ thì chụp lại ĐÚNG LÚC gọi limit(): k sợi đầu trên thanh là đúng k lần vẽ mà móc giữ lại. Từ đó móc không ghi
 *   nữa (list đứng yên), và bản chụp cũng đứng yên tới khi người xem về nấc N.
 * @param {import('../contracts/runtime.js').ToolApi} api
 * @returns {import('../contracts/runtime.js').ToolInstance}
 */
export function mount(api) {
  const { t, draws } = api;
  const text = t.tools[id];
  const doc = api.el.ownerDocument;
  const win = doc.defaultView;
  // Xưởng chưa có móc lần vẽ: ném lỗi. toolbox.js bắt lỗi của từng mount(), bỏ riêng công cụ này kèm cảnh báo, nên các công cụ
  // khác vẫn gắn được và thanh lớp không có nút Từng sợi mở ra một bảng trống.
  if (!draws) throw new Error('Từng sợi cần móc lần vẽ của xưởng (ToolApi.draws), mà hộp đồ nghề không có: không gắn công cụ này.');

  const range = h(doc, 'input', { type: 'range', id: 'tung-soi-range', min: '0', max: '0', step: '1', value: '0' });
  // <output> ngầm là role status (aria-live polite): "Dệt lại" ghi k/N mỗi bước (40 ms với 300 sợi) sẽ làm ngập hàng đợi của
  // trình đọc màn hình. Tiến độ tới người nghe qua aria-valuetext của thanh.
  const shown = h(doc, 'output', { for: 'tung-soi-range', class: 'tool-value', 'aria-live': 'off' });
  const button = h(doc, 'button', {
    type: 'button', 'aria-pressed': 'false', disabled: true, text: text.play, onclick: () => (play ? stopPlay() : startPlay()),
  });
  const detail = h(doc, 'p', { class: 'tool-detail' });
  const summary = h(doc, 'p', { class: 'tool-summary' });
  api.el.append(h(doc, 'div', { class: 'tool-panel', role: 'group', 'aria-label': text.name },
    h(doc, 'div', { class: 'tool-row' }, h(doc, 'label', { for: 'tung-soi-range', text: text.label }), range, shown, button),
    detail, summary, h(doc, 'p', { class: 'tool-note', text: text.note })));

  let on = false;
  let poll = 0;
  let snap = { draws: [], counts: null }; // khung đang hiện trên thanh
  let k = 0; // nấc: chỉ k lần vẽ đầu của snap được vẽ
  let play = null; // lượt "Dệt lại" đang chạy ({ timer }); null là không chạy

  const total = () => snap.draws.length;
  const following = () => play === null && k >= total(); // đang xem đủ khung: thanh theo khung mới
  const take = () => {
    snap = { draws: draws.list(), counts: draws.counts() };
  };
  /** Ghi chỉ khi đổi: lượt đọc mỗi POLL_MS không làm trình đọc màn hình đọc lại thanh. */
  const put = (el, value) => {
    if (el.textContent !== value) el.textContent = value;
  };
  const describe = (info) => (info.nested > 0 ? `${text.detail(info)} ${text.nested(info.nested)}` : text.detail(info));
  const sync = () => {
    const n = total();
    const info = snap.draws[k - 1]; // sợi đang xem là lần vẽ thứ k: lần vẽ CUỐI trong k lần đầu
    if (range.max !== String(n)) range.max = String(n); // max trước value: trình duyệt kẹp value theo max
    if (range.value !== String(k)) range.value = String(k);
    const valuetext = n === 0 ? text.counting : text.valuetext(k, n, info?.label);
    if (range.getAttribute('aria-valuetext') !== valuetext) range.setAttribute('aria-valuetext', valuetext);
    if (button.disabled !== (n === 0)) button.disabled = n === 0; // đang đếm: chưa có sợi nào để dệt
    put(shown, n === 0 ? '' : text.step(k, n));
    put(detail, n === 0 ? text.counting : k === 0 ? text.empty : describe(info));
    put(summary, n === 0 ? '' : text.summary(snap.counts));
  };
  /** Xem v sợi đầu: móc chỉ vẽ v lần đầu (nấc N: vẽ đủ, móc ghi lại mỗi khung); ?freeze thì vẽ lại đúng khung N. */
  const view = (v) => {
    k = Math.min(v, total());
    draws.limit(k >= total() ? null : k);
    sync();
    return api.redraw();
  };
  const refresh = () => {
    if (following()) {
      take();
      k = total();
    }
    sync();
  };

  const stopPlay = () => {
    if (!play) return;
    win.clearTimeout(play.timer);
    play = null;
    button.setAttribute('aria-pressed', 'false');
  };
  /** Vẽ lại khung hỏng (lỗi trong khung): "Dệt lại" dừng, không kẹt ở trạng thái đang chạy. */
  const warn = (err) => {
    stopPlay();
    console.warn('Từng sợi: vẽ lại khung hỏng:', err);
  };
  /**
   * Hẹn bước kế tiếp SAU KHI khung trước đã vẽ xong: lần vẽ lại chậm của ?freeze không làm các bước dồn lại. Mỗi bước đi
   * playStride(N) sợi (bản chụp đứng yên suốt lượt nên N không đổi); bước cuối đáp đúng nấc N.
   */
  const next = (mine) => {
    if (play !== mine) return; // đã dừng (bấm lại, kéo thanh, tắt công cụ) trong lúc chờ vẽ
    mine.timer = win.setTimeout(() => {
      const n = total();
      const to = Math.min(k + playStride(n), n);
      const last = to === n;
      if (last) stopPlay(); // tới nấc N: ảnh đủ, thanh lại theo khung mới
      view(to).then(() => last || next(mine), warn);
    }, playStepMs(total()));
  };
  const startPlay = () => {
    if (following()) take(); // rời khung đủ: chụp đúng danh sách mà limit() sắp cắt
    if (total() === 0) return;
    const mine = { timer: 0 };
    play = mine;
    button.setAttribute('aria-pressed', 'true');
    view(0).then(() => next(mine), warn);
  };
  range.addEventListener('input', () => {
    if (following()) take();
    stopPlay(); // kéo thanh thì "Dệt lại" dừng
    view(Number(range.value)).catch(warn);
  });

  /** Tắt (hay gỡ): bỏ giới hạn rồi gỡ móc, cảnh vẽ đủ như chưa có gì. false nếu vốn đã tắt. */
  const off = () => {
    if (!on) return false;
    on = false;
    stopPlay();
    win.clearInterval(poll);
    draws.limit(null);
    draws.stop();
    return true;
  };

  return {
    activate(value) {
      if (!value) {
        if (off()) api.redraw().catch(warn);
        return;
      }
      if (on) return;
      on = true;
      draws.start(); // khung vẽ kế tiếp được ghi; tới lúc đó list() còn rỗng
      snap = { draws: [], counts: null };
      k = 0;
      sync(); // "Đang đếm các lần vẽ…"
      poll = win.setInterval(refresh, POLL_MS);
      // ?freeze: vòng lặp đã dừng, chỉ có khung vẽ lại này đi qua móc. Thanh hiện danh sách ngay khi khung đó được ghi.
      api.redraw().then(() => on && refresh(), warn);
    },
    dispose() {
      off();
    },
  };
}
