// ui/shell.js — vỏ trang của mọi bức: con dấu âm lịch, data-state, quầng trăng tiến độ, hòa dần poster → canvas, huy hiệu, ghi chú, gợi ý, lời mời, ?poster
import { lunarFromDate, canChiIndex } from '../lib/astro/lunar.js';
import { moonPhase } from '../lib/astro/moon.js';
import { renderBadge } from './badge.js';
import { drawMoon } from './moon-svg.js';
import { createMoonProgress, CROSSFADE_MS } from './moon-progress.js';

/** Lưới an toàn khi transitionend không bao giờ tới: quá chừng này mà canvas chưa báo thì coi như đã hòa xong. */
const FADE_TIMEOUT_MS = CROSSFADE_MS + 300;
/** Trạng thái có poster phủ màn hình: tầng tĩnh, và lúc mất GPU chờ "Dựng lại cảnh". */
const POSTER_STATES = ['static', 'lost'];

/**
 * Gắn vỏ trang vào HTML tĩnh của một bức. Vỏ không biết bức nào: nó chỉ tìm các ô data-* mà trang nào
 * cũng có (tests/paintings/html.test.js giữ luật đó). Chữ lấy từ `t`, không import strings.
 *
 * Ba ô có aria-live ([data-hint], [data-static], [data-badge-note]) KHÔNG bao giờ bị ẩn bằng `hidden`: chúng luôn
 * nằm trong cây trợ năng và chỉ để trống khi không có gì để nói (CSS thu chúng lại khi :empty). Một vùng live vừa
 * được bỏ `hidden` vừa được điền chữ trong cùng một nhịp thường bị VoiceOver bỏ qua, không đọc.
 * @param {Document} doc
 * @param {object} meta  PaintingMeta của bức (lời mời "{n} lớp")
 * @param {{ now: Date, t: Record<string, any>, onState?: (state: string) => void, poster?: boolean }} opts
 *   poster: cờ ?poster (GĐ 4): body[data-poster], CSS ẩn mọi UI trừ canvas; không gợi ý, không lời mời
 */
export function mountShell(doc, meta, { now, t, onState = () => {}, poster: posterMode = false }) {
  const $ = (sel) => doc.querySelector(sel);
  // img: từ GĐ 4, body cũng có thể mang data-poster (cờ ?poster), nên chỉ rõ là ảnh.
  const poster = $('img[data-poster]');
  if (posterMode) doc.body.dataset.poster = '';
  const stageEl = $('[data-stage]');
  const badge = $('[data-badge]');
  const badgeNote = $('[data-badge-note]');
  const note = $('[data-static]');
  const hint = $('[data-hint]'); // gợi ý / lời mời (trang nào không có ô này thì bỏ qua)
  const moon = $('[data-moon]'); // trăng SVG đúng pha (bức nào không có trăng thì bỏ ô này đi)

  // Con dấu: ngày âm theo giờ Việt Nam; can chi lấy theo NĂM ÂM (trước Tết vẫn là năm cũ).
  const lunar = lunarFromDate(now);
  $('[data-seal]').textContent = t.formatSeal({ ...lunar, ...canChiIndex(lunar.year) });
  if (moon) drawMoon(moon, moonPhase(now).phase);
  // Quầng tiến độ quanh trăng (GĐ 5): đi theo trạng thái và mốc tải. Bức không có trăng thì không có quầng.
  const halo = moon ? createMoonProgress(moon) : null;

  // title chỉ hiện khi rê chuột; điện thoại không có chuột, nên chạm vào huy hiệu thì mở/đóng ô giải thích.
  const badgeOpen = () => badge.getAttribute('aria-expanded') === 'true';
  badge.addEventListener('click', () => {
    const open = !badgeOpen();
    badge.setAttribute('aria-expanded', String(open));
    badgeNote.textContent = open ? badge.title : '';
  });

  /** Xóa chữ của [data-hint] (gợi ý hay lời mời); vùng aria-live ở lại, chỉ trống: không bao giờ hidden. */
  const clearHint = () => {
    if (!hint) return;
    hint.replaceChildren();
    delete hint.dataset.kind;
  };
  const showingPoster = () => POSTER_STATES.includes(doc.body.dataset.state);

  /** Đổi body[data-state] (CSS và e2e đọc) rồi báo cho boot để __sma.state luôn khớp. */
  function setState(state) {
    doc.body.dataset.state = state;
    halo?.step(state);
    if (POSTER_STATES.includes(state)) {
      poster.hidden = false; // tầng tĩnh (và lúc mất GPU) luôn có poster, kể cả khi rơi xuống sau lúc đã live
      clearHint(); // "chạm vào…" vô nghĩa khi không còn cảnh 3D
    }
    onState(state);
  }

  /**
   * Mốc tải cho quầng trăng (GĐ 5); data-state không đổi. Tên nào trong HALO_STEPS (ui/moon-progress.js) cũng được
   * chuyển cho quầng. boot.js báo mốc duy nhất không phải trạng thái: 'chunk' (code 3D đã tải xong); test khóa của boot
   * dò bằng 'loading'.
   * @param {string} name  một tên trong HALO_STEPS
   */
  function progress(name) {
    halo?.step(name);
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
        if (!showingPoster()) poster.hidden = true;
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
    if (badgeOpen()) badgeNote.textContent = badge.title; // ô giải thích đang mở thì đổi theo tầng mới
  }

  const make = (tag, text) => {
    const el = doc.createElement(tag);
    el.textContent = text;
    return el;
  };
  const button = (label, run) => {
    const el = make('button', label);
    el.type = 'button';
    el.addEventListener('click', run);
    return el;
  };

  /**
   * Điền ô ghi chú [data-static]: đoạn chữ, nút "Tải lại" nếu cần, một nút hành động (Dựng lại cảnh, Xem các lớp…),
   * chi tiết lỗi (chỉ khi ?debug). Gọi lại thì thay hẳn nội dung cũ. Không có gì để nói thì ô để trống.
   * @param {{ text: string | null, reload: boolean, action?: { label: string, run: () => void } }} content
   * @param {string | null} [detail]
   */
  function showNote({ text, reload, action }, detail = null) {
    const parts = [];
    if (text) parts.push(make('p', text));
    if (reload) parts.push(button(t.static.reload, () => doc.defaultView.location.reload()));
    if (action) parts.push(button(action.label, action.run));
    if (detail) parts.push(make('pre', detail));
    note.replaceChildren(...parts);
  }

  /** Gợi ý của bức (content.hint), hiện khi cảnh đã live. Tầng tĩnh thì thôi. */
  function showHint(text) {
    if (!hint || !text || showingPoster() || posterMode) return;
    hint.dataset.kind = 'hint';
    hint.textContent = text;
  }

  /**
   * Sau lần chạm đầu tiên: lời mời mài lớp (n = meta.layers.length) là một NÚT. Bấm thì lời mời biến mất
   * và onOpen() đưa người xem vào chế độ mài.
   * @param {() => void} [onOpen]
   */
  function invite(onOpen) {
    if (!hint || showingPoster() || posterMode) return;
    hint.dataset.kind = 'invite';
    hint.replaceChildren(button(t.invite(meta.layers.length), () => {
      clearHint();
      onOpen?.();
    }));
  }

  /**
   * Mất GPU lần đầu (GĐ 2): poster hiện lại, kèm lời giải thích và nút "Dựng lại cảnh".
   * @param {() => void} onRebuild
   */
  function showLost(onRebuild) {
    setState('lost');
    showNote({
      text: t.lost.text,
      reload: false,
      action: {
        label: t.lost.rebuild,
        run: () => {
          note.replaceChildren();
          onRebuild();
        },
      },
    });
  }

  return { stageEl, setState, progress, crossfade, showBadge, showNote, showHint, clearHint, invite, showLost };
}
