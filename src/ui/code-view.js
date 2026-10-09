// ui/code-view.js — code thật của một lớp: HTML đã tô màu lúc build (plugin ?code), đổi file theo tab, sáng dòng theo núm, và nút "Bản dịch" (GĐ 9) chuyển qua mã shader thật.
import { h } from './dom.js';
import { createTranslationView } from './translation-view.js';

// import.meta.glob chỉ được dùng ở file này, và luôn kèm ?code (tests/rules/imports.test.js giữ). Glob KHÔNG eager:
// mỗi file thành một chunk riêng, chỉ tải khi Sổ tay mở tab Chỉnh của lớp đó. _mau là tranh mẫu, không deploy.
// Lớp dùng chung: mọi file code của nó (GĐ 4: Phủ bóng có layer, display, lut), trừ meta và chữ.
// Hộp màu (GĐ 8): file lib/tsl mà lớp kê trong files, như bể hạt của Vàng lá.
const FILES = import.meta.glob(
  [
    '../paintings/*/layers/*.js', '../paintings/*/parts/*.js', '../engine/stock/*/*.js', '../lib/tsl/*.js',
    '!../paintings/_mau/**', '!../engine/stock/*/meta.js', '!../engine/stock/*/content.*.js',
  ],
  { query: '?code', import: 'default' },
);

/**
 * File (đường dẫn tính từ src/, như LayerMeta.files) có code sống không.
 * Test hợp đồng dùng hàm này để bắt file của lớp nằm ngoài glob (Sổ tay sẽ không hiện được).
 * @param {string} file  ví dụ 'paintings/<slug>/layers/l1-cot.js'
 */
export function hasCode(file) {
  return Object.hasOwn(FILES, `../${file}`);
}

/**
 * Code đã tô màu của một file: { html, knobs: { knobId: [dòng] } }, hoặc null nếu file nằm ngoài glob.
 * @param {string} file
 * @returns {Promise<{ html: string, knobs: Record<string, number[]> } | null>}
 */
export function loadCode(file) {
  const load = FILES[`../${file}`];
  return load ? load() : Promise.resolve(null);
}

const basename = (file) => file.slice(file.lastIndexOf('/') + 1);

const REFRESH_MS = 300; // kéo một núm gửi hàng chục thay đổi: dịch lại một lần, 300 ms sau thay đổi cuối

/**
 * Khung code của MỘT lớp: hàng nút tên file (cộng nút "Bản dịch" nếu cảnh có bàn thợ) + khung chứa <pre> của Shiki.
 * light(knobId) chuyển sang file có marker `// @knob <knobId>` rồi làm sáng đúng những dòng đó. Bấm "Bản dịch" thì cùng khung ấy hiện mã
 * shader thật (translation-view.js); bấm tên một file thì về code JS. Hai chế độ không bao giờ hiện cùng lúc: `mode`.
 * @param {Document} doc
 * @param {{ t: Record<string, any>, load?: typeof loadCode }} opts  load: test thay bằng bộ nạp giả
 */
export function createCodeView(doc, { t, load = loadCode }) {
  const win = doc.defaultView;
  const el = doc.createElement('div');
  el.className = 'code';
  const bar = doc.createElement('div');
  bar.className = 'code-files';
  const view = doc.createElement('div');
  view.className = 'code-view';
  view.tabIndex = 0; // cuộn được bằng bàn phím
  const tr = createTranslationView(doc, { t, view });
  el.append(bar, tr.el, view);

  let files = []; // [{ file, code, button }]
  let current = null;
  let request = 0; // lần nạp hay lần dịch mới nhất: bỏ kết quả của lần cũ về muộn
  let mode = 'js'; // 'js' | 'translation'
  let layer = { id: null, name: '', translate: null }; // lớp đang mở và hàm dịch của nó (null: tầng không có bản dịch)
  let toTranslation = null; // nút "Bản dịch" của lớp đang mở
  let timer = null; // lần dịch lại đang chờ

  const stopTimer = () => {
    win.clearTimeout(timer);
    timer = null;
  };

  const showFile = (entry) => {
    stopTimer();
    mode = 'js';
    tr.hide(); // trả khung view lại cho code JS
    current = entry;
    // HTML do plugin sinh lúc build từ file trong repo (Shiki đã escape): tin được.
    if (entry.code) view.innerHTML = entry.code.html;
    else view.textContent = t.notebook.codeMissing;
    for (const f of files) f.button.setAttribute('aria-pressed', String(f === entry));
    toTranslation?.setAttribute('aria-pressed', 'false');
  };

  /**
   * Dịch bằng bàn thợ. fresh: người xem vừa bấm "Bản dịch" (xóa khung, bắt đầu lại); không thì là dịch lại sau một thay đổi, và khung
   * cũ ở nguyên tới khi có kết quả mới (xóa nó ở mỗi nhịp kéo núm thì khung nhấp nháy và Đỉnh/Điểm ảnh về mặc định). Kết quả chỉ được
   * dùng khi VẪN là lần dịch mới nhất (`request`) và người xem VẪN ở Bản dịch (`mode`): showFile không tăng `request`, nên chỉ xét
   * `request` thì kết quả về muộn sau một cú bấm tên file vẫn đè lên code JS.
   */
  const translate = async (fresh) => {
    stopTimer();
    const mine = ++request;
    mode = 'translation';
    for (const f of files) f.button.setAttribute('aria-pressed', 'false');
    toTranslation.setAttribute('aria-pressed', 'true');
    if (fresh) tr.pending();
    const latest = () => mine === request && mode === 'translation';
    try {
      const result = await layer.translate(layer.id);
      if (latest()) tr.show(result, { layerName: layer.name, keep: fresh ? null : tr.key });
    } catch (err) {
      console.warn('Sổ tay: không dịch được:', err);
      if (latest()) tr.failed();
    }
  };

  return {
    el,
    /**
     * Nạp mọi file của lớp (song song) rồi hiện file đầu. Gọi lại trước khi xong thì lần cũ bị bỏ.
     * `translate(layerId)` (có bàn thợ) thêm nút "Bản dịch" ở cuối hàng nút, và hàng nút hiện kể cả khi lớp chỉ có một file.
     * @param {string[]} fileList
     * @param {{ layerId?: string | null, layerName?: string, translate?: ((layerId: string) => Promise<any>) | null }} [options]
     */
    async show(fileList, { layerId = null, layerName = '', translate: run = null } = {}) {
      const mine = ++request;
      stopTimer();
      mode = 'js';
      tr.hide();
      view.textContent = t.notebook.loading;
      const codes = await Promise.all(fileList.map((f) => load(f).catch((err) => {
        console.warn(`Không tải được code của ${f}:`, err);
        return null;
      })));
      if (mine !== request) return;
      layer = { id: layerId, name: layerName, translate: run };
      files = fileList.map((file, i) => {
        const button = doc.createElement('button');
        button.type = 'button';
        button.textContent = basename(file);
        button.title = file;
        return { file, code: codes[i], button };
      });
      for (const f of files) f.button.addEventListener('click', () => showFile(f));
      toTranslation = run
        ? h(doc, 'button', { type: 'button', 'data-code-translate': '', 'aria-pressed': 'false', text: t.translation.button, onclick: () => translate(true) })
        : null;
      bar.replaceChildren(...files.map((f) => f.button), ...(toTranslation ? [toTranslation] : []));
      bar.hidden = files.length < 2 && !run;
      if (files.length > 0) showFile(files[0]);
    },
    /** Làm sáng các dòng của một núm (null thì tắt hết). Trả số dòng đã sáng. Đang ở Bản dịch thì sáng dòng của uniform, không đổi chế độ. */
    light(knobId) {
      if (mode === 'translation') return tr.light(knobId);
      for (const line of view.querySelectorAll('.is-lit')) line.classList.remove('is-lit');
      const hit = knobId ? files.find((f) => f.code?.knobs?.[knobId]) : null;
      if (!hit) return 0;
      if (hit !== current) showFile(hit);
      const lit = hit.code.knobs[knobId].map((n) => view.querySelector(`[data-line="${n}"]`)).filter(Boolean);
      for (const line of lit) line.classList.add('is-lit');
      // Cuộn RIÊNG khung code (CSS đặt nó position: relative, nên offsetTop của dòng tính từ khung). Không dùng
      // scrollIntoView: nó cuộn cả Sổ tay, kéo núm đang rê ra khỏi con trỏ và khung code trượt vào chỗ núm.
      if (lit[0]) view.scrollTop = Math.max(0, lit[0].offsetTop - view.clientHeight / 3);
      return lit.length;
    },
    /**
     * Một núm hay thí nghiệm vừa áp xong: đang ở Bản dịch thì dịch lại (núm 'rebuild' và thí nghiệm có thể đổi material, nên mã đổi),
     * chờ 300 ms sau lần gọi cuối. Đang ở code JS thì không làm gì.
     */
    refresh() {
      if (mode !== 'translation') return;
      stopTimer();
      timer = win.setTimeout(() => {
        timer = null;
        if (mode === 'translation') translate(false);
      }, REFRESH_MS);
    },
  };
}
