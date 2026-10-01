// ui/code-view.js — code thật của một lớp: HTML đã tô màu lúc build (plugin ?code), đổi file theo tab, sáng dòng theo núm.

// import.meta.glob chỉ được dùng ở file này, và luôn kèm ?code (tests/rules/imports.test.js giữ). Glob KHÔNG eager:
// mỗi file thành một chunk riêng, chỉ tải khi Sổ tay mở tab Chỉnh của lớp đó. _mau là tranh mẫu, không deploy.
// Lớp dùng chung: mọi file code của nó (GĐ 4: Phủ bóng có layer, display, lut), trừ meta và chữ.
const FILES = import.meta.glob(
  [
    '../paintings/*/layers/*.js', '../paintings/*/parts/*.js', '../engine/stock/*/*.js',
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

/**
 * Khung code của MỘT lớp: hàng nút tên file + khung chứa <pre> của Shiki.
 * light(knobId) chuyển sang file có marker `// @knob <knobId>` rồi làm sáng đúng những dòng đó.
 * @param {Document} doc
 * @param {{ t: Record<string, any>, load?: typeof loadCode }} opts  load: test thay bằng bộ nạp giả
 */
export function createCodeView(doc, { t, load = loadCode }) {
  const el = doc.createElement('div');
  el.className = 'code';
  const bar = doc.createElement('div');
  bar.className = 'code-files';
  const view = doc.createElement('div');
  view.className = 'code-view';
  view.tabIndex = 0; // cuộn được bằng bàn phím
  el.append(bar, view);

  let files = []; // [{ file, code, button }]
  let current = null;
  let request = 0; // lần nạp mới nhất: bỏ kết quả của lần nạp cũ về muộn

  const showFile = (entry) => {
    current = entry;
    // HTML do plugin sinh lúc build từ file trong repo (Shiki đã escape): tin được.
    if (entry.code) view.innerHTML = entry.code.html;
    else view.textContent = t.notebook.codeMissing;
    for (const f of files) f.button.setAttribute('aria-pressed', String(f === entry));
  };

  return {
    el,
    /** Nạp mọi file của lớp (song song) rồi hiện file đầu. Gọi lại trước khi xong thì lần cũ bị bỏ. */
    async show(fileList) {
      const mine = ++request;
      view.textContent = t.notebook.loading;
      const codes = await Promise.all(fileList.map((f) => load(f).catch((err) => {
        console.warn(`Không tải được code của ${f}:`, err);
        return null;
      })));
      if (mine !== request) return;
      files = fileList.map((file, i) => {
        const button = doc.createElement('button');
        button.type = 'button';
        button.textContent = basename(file);
        button.title = file;
        return { file, code: codes[i], button };
      });
      for (const f of files) f.button.addEventListener('click', () => showFile(f));
      bar.replaceChildren(...files.map((f) => f.button));
      bar.hidden = files.length < 2;
      if (files.length > 0) showFile(files[0]);
    },
    /** Làm sáng các dòng của một núm (null thì tắt hết). Trả số dòng đã sáng. */
    light(knobId) {
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
  };
}
