// ui/translation-view.js — khung Bản dịch trong tab Chỉnh (GĐ 9): chọn nơi lớp có mặt, đỉnh hay điểm ảnh, dòng trạng thái, mã đã tô màu, sáng dòng theo núm.
import { h } from './dom.js';
import { shaderHtml } from './shader-text.js';

const STAGES = ['vertex', 'fragment'];

/**
 * Không biết three: nhận Translation của bàn thợ (engine/contracts/runtime.js, spec §21.3) qua show(). Mã vẽ vào `view`, tức khung cuộn
 * mà code JS cũng dùng; code-view.js chuyển qua lại giữa hai thứ và gọi hide() mỗi khi khung về tay nó.
 *
 * Vùng aria-live `.tr-status` luôn nằm trong cây và không có tổ tiên nào hidden: chữ điền cùng nhịp với lúc bỏ hidden thì VoiceOver bỏ
 * qua. Chỉ ô Vật, hai nút và dòng nhắc ẩn (cho tới khi có gì để chọn); dòng trạng thái rỗng thì CSS thu lại bằng :empty.
 * @param {Document} doc
 * @param {{ t: Record<string, any>, view: HTMLElement }} p   view: khung cuộn của code-view.js
 */
export function createTranslationView(doc, { t, view }) {
  const tt = t.translation;
  const select = h(doc, 'select', { 'data-tr-place': '' });
  const stages = STAGES.map((stage) => h(doc, 'button', {
    type: 'button', 'data-tr-stage': stage, 'aria-pressed': 'false', text: tt[stage],
  }));
  const status = h(doc, 'p', { class: 'tr-status', 'aria-live': 'polite' });
  const hint = h(doc, 'p', { class: 'tr-hint', hidden: true });
  const controls = h(doc, 'div', { class: 'tr-controls', hidden: true },
    h(doc, 'label', { class: 'tr-place' }, tt.object, select),
    h(doc, 'div', { class: 'tr-stages', role: 'group', 'aria-label': tt.stages }, stages));
  const el = h(doc, 'div', { class: 'tr-head', 'data-translation': '' }, controls, status, hint);

  let tr = null; // Translation đang hiện
  let layerName = '';
  let place = null; // nơi đang xem
  let stage = 'fragment';
  let lit = null; // núm đang rê (id): nhớ qua lần đổi nơi và lần dịch lại
  let painted = null; // HTML đang nằm trong view (null: view không phải của khung này)
  let listed = ''; // danh sách nơi đang nằm trong ô Vật

  /** Ghi dòng trạng thái; cùng một câu thì không ghi lại (vài trình đọc màn hình đọc lại câu cũ). */
  const say = (text) => {
    if (status.textContent !== text) status.textContent = text;
  };
  const uniforms = () => (tr ? [tr.uniforms.weight, ...Object.values(tr.uniforms.knobs)].filter(Boolean) : []);
  /**
   * Vẽ HTML vào view khi nó khác lần trước. Dịch lại cho mã y hệt (đổi một núm uniform: mã không đổi) thì khung, vị trí cuộn và vùng
   * chọn chữ của người xem được giữ nguyên.
   */
  const paint = (html) => {
    if (html === painted) return;
    view.innerHTML = html; // mã do three sinh; shaderHtml đã escape từng token
    painted = html;
  };

  /**
   * Bề cao khung mã mà người xem THẤY. Tab Chỉnh dài hơn màn hình laptop (bảy núm cộng đầu khung Bản dịch), nên khung hay thò xuống dưới
   * đáy Sổ tay: dòng sáng đặt ở 1/3 CẢ khung thì nằm đúng chỗ bị cắt. Không đo được (khung ẩn, không có layout) thì lấy cả khung.
   */
  const visibleHeight = () => {
    const panel = view.closest('[role="tabpanel"]');
    const frame = view.getBoundingClientRect();
    const seen = panel ? Math.min(frame.bottom, panel.getBoundingClientRect().bottom) - frame.top : 0;
    return seen > 0 ? Math.min(seen, view.clientHeight) : view.clientHeight;
  };

  /** Sáng các dòng có uniform của một núm (null: tắt); cuộn RIÊNG khung mã tới dòng đầu, như code-view.js. Trả số dòng đã sáng. */
  const light = (knobId) => {
    lit = knobId;
    for (const line of view.querySelectorAll('.line.is-lit')) line.classList.remove('is-lit');
    const name = knobId && tr ? tr.uniforms.knobs[knobId] : null;
    if (typeof name !== 'string') return 0; // núm 'js', 'rebuild' hay id lạ: không có uniform
    const rows = new Set([...view.querySelectorAll('.u-layer')].filter((u) => u.dataset.u === name).map((u) => u.closest('.line')));
    for (const row of rows) row.classList.add('is-lit');
    const [first] = rows;
    if (first) view.scrollTop = Math.max(0, first.offsetTop - visibleHeight() / 3);
    return rows.size;
  };

  /** Vẽ nơi và phần đang chọn. top: mã khác hẳn (đổi nơi, đổi phần) thì cuộn về đầu; dịch lại thì giữ chỗ đang cuộn. */
  const draw = (top) => {
    const none = place.error || place.drawn === false; // đọc hỏng hay khung ấy không vẽ vật: không có mã
    const out = none ? null : shaderHtml(place[stage], { uniforms: uniforms() });
    paint(out ? out.html : '');
    if (top) view.scrollTop = 0;
    for (const b of stages) {
      b.setAttribute('aria-pressed', String(b.dataset.trStage === stage));
      b.disabled = !place[b.dataset.trStage];
    }
    if (place.error) say(tt.failed);
    else if (out) say(tt.status({ language: tr.language, backend: tr.backend, lines: out.lines, hits: out.hits, layer: layerName }));
    else say(tt.notDrawn);
    light(lit);
  };

  /**
   * Chọn nơi thứ i. kept: dịch lại, người xem đứng nguyên chỗ (giữ phần Đỉnh/Điểm ảnh đã chọn); không thì về mặc định, là phần
   * có nhiều dòng của lớp hơn, bằng nhau thì Điểm ảnh. Phần không có mã (null) thì rơi về phần còn mã.
   */
  const open = (i, kept) => {
    place = tr.places[i];
    select.value = String(i);
    const want = kept ? stage : place.hits.vertex > place.hits.fragment ? 'vertex' : 'fragment';
    stage = place[want] ? want : STAGES.find((s) => place[s]) ?? want;
    draw(!kept);
  };

  select.addEventListener('change', () => open(Number(select.value), false));
  for (const b of stages) {
    b.addEventListener('click', () => {
      stage = b.dataset.trStage;
      draw(true);
    });
  }

  return {
    el,
    /**
     * Hiện một Translation. keep: key của nơi đang xem. Có keep (dịch lại sau một thay đổi) và nơi ấy còn thì đứng nguyên chỗ: cùng nơi,
     * cùng phần, cùng núm đang sáng; không thì bắt đầu lại từ nơi đầu tiên.
     * @param {import('../engine/contracts/runtime.js').Translation} translation
     * @param {{ layerName?: string, keep?: string | null }} [options]
     */
    show(translation, { layerName: name = '', keep = null } = {}) {
      tr = translation;
      layerName = name;
      const names = tr.places.map((p) => `${p.key}\u0000${p.label}`).join('\u0001');
      if (names !== listed) {
        // Chỉ dựng lại ô chọn khi danh sách đổi: dựng lại lúc người xem đang mở ô thì danh sách thả xuống đóng mất.
        select.replaceChildren(...tr.places.map((p, i) => h(doc, 'option', { value: String(i), text: p.label })));
        listed = names;
      }
      const any = tr.places.length > 0;
      const note = !any ? '' : tr.jsOnly ? tt.jsOnly : tr.uniforms.weight ? tt.weightHint(tr.uniforms.weight) : '';
      hint.textContent = note;
      hint.hidden = !note;
      controls.hidden = !any;
      if (!any) {
        place = null;
        paint('');
        say(tt.jsOnly);
        return;
      }
      const at = keep === null ? -1 : tr.places.findIndex((p) => p.key === keep);
      open(Math.max(0, at), at >= 0);
    },
    /** Đang chờ khung vẽ kế tiếp (người xem vừa bấm "Bản dịch"): xóa khung, giấu ô chọn, dòng trạng thái là "Đang dịch…". */
    pending() {
      tr = null;
      place = null;
      view.textContent = '';
      painted = null;
      controls.hidden = true;
      hint.hidden = true;
      say(tt.translating);
    },
    failed() {
      say(tt.failed);
    },
    light,
    /** key của nơi đang xem (code-view.js giữ chỗ khi dịch lại). */
    get key() {
      return place?.key ?? null;
    },
    /**
     * Khung view về tay code-view.js (code JS, hay lớp khác): giấu ô chọn, dòng nhắc, xóa dòng trạng thái, quên nơi, núm và cả danh sách
     * nơi: ô chọn ẩn mà còn giữ nơi của lớp cũ thì lớp mới mở ra với dữ liệu của lớp cũ trong cây.
     */
    hide() {
      controls.hidden = true;
      hint.hidden = true;
      say('');
      select.replaceChildren();
      listed = '';
      tr = null;
      place = null;
      lit = null;
      painted = null;
    },
  };
}
