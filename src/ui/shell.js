// ui/shell.js — vỏ trang của mọi bức: con dấu âm lịch, data-state, hòa dần poster → canvas, huy hiệu, ghi chú tầng tĩnh
import { lunarFromDate, canChiIndex } from '../lib/astro/lunar.js';
import { moonPhase } from '../lib/astro/moon.js';
import { renderBadge } from './badge.js';
import { drawMoon } from './moon-svg.js';

/** Transition CSS dài 900 ms. Lưới an toàn: quá 1200 ms mà chưa có transitionend thì coi như đã hòa xong. */
const FADE_TIMEOUT_MS = 1200;

/**
 * Gắn vỏ trang vào HTML tĩnh của một bức. Vỏ không biết bức nào: nó chỉ tìm các ô data-* mà trang nào
 * cũng có (tests/paintings/html.test.js giữ luật đó). Chữ lấy từ `t`, không import strings.
 * @param {Document} doc
 * @param {object} meta  PaintingMeta của bức (GĐ 1 dùng cho lời mời "{n} lớp")
 * @param {{ now: Date, t: Record<string, any>, onState?: (state: string) => void }} opts
 */
export function mountShell(doc, meta, { now, t, onState = () => {} }) {
  const $ = (sel) => doc.querySelector(sel);
  const poster = $('[data-poster]');
  const stageEl = $('[data-stage]');
  const badge = $('[data-badge]');
  const badgeNote = $('[data-badge-note]');
  const note = $('[data-static]');
  const moon = $('[data-moon]'); // trăng SVG đúng pha (bức nào không có trăng thì bỏ ô này đi)

  // Con dấu: ngày âm theo giờ Việt Nam; can chi lấy theo NĂM ÂM (trước Tết vẫn là năm cũ).
  const lunar = lunarFromDate(now);
  $('[data-seal]').textContent = t.formatSeal({ ...lunar, ...canChiIndex(lunar.year) });
  if (moon) drawMoon(moon, moonPhase(now).phase);

  // title chỉ hiện khi rê chuột; điện thoại không có chuột, nên chạm vào huy hiệu thì mở/đóng ô giải thích.
  badge.addEventListener('click', () => {
    badgeNote.textContent = badge.title;
    badgeNote.hidden = !badgeNote.hidden;
    badge.setAttribute('aria-expanded', String(!badgeNote.hidden));
  });

  /** Đổi body[data-state] (CSS và e2e đọc) rồi báo cho boot để __sma.state luôn khớp. */
  function setState(state) {
    doc.body.dataset.state = state;
    if (state === 'static') poster.hidden = false; // tầng tĩnh luôn có poster, kể cả khi rơi xuống sau lúc đã live
    onState(state);
  }

  /**
   * Hòa dần từ poster sang canvas (canvas đã nằm trong stageEl với opacity 0). Xong thì ẩn poster.
   * @param {HTMLCanvasElement} canvas
   * @returns {Promise<void>}
   */
  function crossfade(canvas) {
    return new Promise((resolve) => {
      let timer;
      const finish = () => {
        clearTimeout(timer);
        canvas.removeEventListener('transitionend', onEnd);
        // Cảnh có thể hỏng ngay giữa lúc hòa (đã về tầng tĩnh): khi đó poster phải ở lại.
        if (doc.body.dataset.state !== 'static') poster.hidden = true;
        resolve();
      };
      const onEnd = (event) => {
        if (event.target === canvas) finish();
      };
      // Đọc style trước khi đổi: trình duyệt "chốt" opacity 0 hiện tại, nên thêm data-visible chắc chắn sinh transition.
      void doc.defaultView?.getComputedStyle(canvas).opacity;
      canvas.setAttribute('data-visible', '');
      // Người xem xin giảm chuyển động: CSS bỏ transition, nên không có transitionend để chờ.
      if (doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        finish();
        return;
      }
      canvas.addEventListener('transitionend', onEnd);
      timer = setTimeout(finish, FADE_TIMEOUT_MS);
    });
  }

  /** @param {{ tier: 'webgpu' | 'webgl2' | 'static', level?: string | null }} info */
  function showBadge(info) {
    renderBadge(badge, info, t);
    badgeNote.textContent = badge.title; // ô giải thích đang mở thì đổi theo tầng mới
  }

  const make = (tag, text) => {
    const el = doc.createElement(tag);
    el.textContent = text;
    return el;
  };

  /**
   * Điền ô ghi chú [data-static]: đoạn chữ, nút "Tải lại" nếu cần, chi tiết lỗi (chỉ khi ?debug).
   * Gọi lại thì thay hẳn nội dung cũ. Không có gì để nói thì ô vẫn ẩn.
   * @param {{ text: string | null, reload: boolean }} content
   * @param {string | null} [detail]
   */
  function showNote({ text, reload }, detail = null) {
    const parts = [];
    if (text) parts.push(make('p', text));
    if (reload) {
      const button = make('button', t.static.reload);
      button.type = 'button';
      button.addEventListener('click', () => doc.defaultView.location.reload());
      parts.push(button);
    }
    if (detail) parts.push(make('pre', detail));
    note.replaceChildren(...parts);
    note.hidden = parts.length === 0;
  }

  return { stageEl, setState, crossfade, showBadge, showNote };
}
