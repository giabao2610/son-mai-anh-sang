// @vitest-environment jsdom
// tests/unit/shell.test.js — vỏ trang: con dấu, data-state, hòa dần poster → canvas, huy hiệu, ghi chú tầng tĩnh
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mountShell } from '../../src/ui/shell.js';
import t from '../../src/ui/strings.vi.js';
import { mountPage } from '../helpers/page.js';

const meta = { slug: 'thu', title: 'Tranh thử', layers: [{ id: 'cot' }, { id: 'phu-bong' }, { id: 'lop-ba' }] };
const NOW = new Date('2026-09-28T21:00:00+07:00');

let page;
beforeEach(() => {
  page = mountPage(document);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** Canvas giả như của stage: đã nằm sẵn trong [data-stage] trước khi hòa dần. */
function addCanvas() {
  const canvas = document.createElement('canvas');
  page.stage.append(canvas);
  return canvas;
}

describe('con dấu', () => {
  it('2026-09-28 21:00 (+07) → 18 tháng Tám · Bính Ngọ', () => {
    mountShell(document, meta, { now: NOW, t });
    expect(page.seal.textContent).toBe('18 tháng Tám · Bính Ngọ');
  });

  it('can chi theo NĂM ÂM: 2026-02-16, trước Tết, vẫn là Ất Tỵ', () => {
    mountShell(document, meta, { now: new Date('2026-02-16T12:00:00+07:00'), t });
    expect(page.seal.textContent).toBe('29 tháng Chạp · Ất Tỵ');
  });
});

describe('trạng thái', () => {
  it('setState ghi body[data-state] và báo onState', () => {
    const onState = vi.fn();
    const shell = mountShell(document, meta, { now: NOW, t, onState });
    shell.setState('detecting');
    expect(document.body.dataset.state).toBe('detecting');
    expect(onState).toHaveBeenLastCalledWith('detecting');
  });

  it('stageEl là ô [data-stage]', () => {
    expect(mountShell(document, meta, { now: NOW, t }).stageEl).toBe(page.stage);
  });

  it("về 'static' thì poster hiện lại, kể cả khi đã bị ẩn sau lúc hòa dần", () => {
    const shell = mountShell(document, meta, { now: NOW, t });
    page.poster.hidden = true;
    shell.setState('static');
    expect(page.poster.hidden).toBe(false);
  });
});

describe('crossfade', () => {
  it('prefers-reduced-motion: xong ngay, không chờ transition hay đồng hồ', async () => {
    vi.stubGlobal('matchMedia', vi.fn((q) => ({ matches: q === '(prefers-reduced-motion: reduce)', media: q })));
    vi.useFakeTimers();
    const shell = mountShell(document, meta, { now: NOW, t });
    const canvas = addCanvas();
    await shell.crossfade(canvas);
    expect(canvas.hasAttribute('data-visible')).toBe(true);
    expect(page.poster.hidden).toBe(true);
  });

  it('xong khi canvas phát transitionend', async () => {
    const shell = mountShell(document, meta, { now: NOW, t });
    const canvas = addCanvas();
    const done = shell.crossfade(canvas);
    expect(canvas.hasAttribute('data-visible')).toBe(true);
    expect(page.poster.hidden).toBe(false);
    canvas.dispatchEvent(new Event('transitionend'));
    await done;
    expect(page.poster.hidden).toBe(true);
  });

  it('không có transitionend thì tự xong sau 1200 ms', async () => {
    vi.useFakeTimers();
    const shell = mountShell(document, meta, { now: NOW, t });
    let finished = false;
    shell.crossfade(addCanvas()).then(() => {
      finished = true;
    });
    await vi.advanceTimersByTimeAsync(1199);
    expect(finished).toBe(false);
    expect(page.poster.hidden).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(finished).toBe(true);
    expect(page.poster.hidden).toBe(true);
  });

  it('cảnh hỏng giữa lúc hòa (đã về static) thì hòa xong vẫn giữ poster', async () => {
    vi.useFakeTimers();
    const shell = mountShell(document, meta, { now: NOW, t });
    const done = shell.crossfade(addCanvas());
    shell.setState('static');
    await vi.advanceTimersByTimeAsync(1200);
    await done;
    expect(page.poster.hidden).toBe(false);
  });
});

describe('huy hiệu', () => {
  it('showBadge vẽ huy hiệu có data-backend', () => {
    const shell = mountShell(document, meta, { now: NOW, t });
    shell.showBadge({ tier: 'webgl2', level: 'vua' });
    expect(page.badge.hidden).toBe(false);
    expect(page.badge.dataset.backend).toBe('webgl2');
    expect(page.badge.textContent).toBe('WebGL2 · vừa');
  });

  it('chạm vào huy hiệu thì mở/đóng lời giải thích (ô live luôn có mặt, chỉ đổi chữ)', () => {
    const shell = mountShell(document, meta, { now: NOW, t });
    shell.showBadge({ tier: 'static' });
    page.badge.click();
    expect(page.badgeNote.textContent).toBe(t.badge.explain.static);
    expect(page.badge.getAttribute('aria-expanded')).toBe('true');
    shell.showBadge({ tier: 'webgl2', level: 'vua' }); // đang mở thì đổi theo tầng mới
    expect(page.badgeNote.textContent).toBe(t.badge.explain.webgl2);
    page.badge.click();
    expect(page.badgeNote.textContent).toBe('');
    expect(page.badge.getAttribute('aria-expanded')).toBe('false');
    expect(page.badgeNote.hidden).toBe(false);
    shell.showBadge({ tier: 'static' }); // đang đóng thì không tự mở
    expect(page.badgeNote.textContent).toBe('');
  });
});

describe('showNote', () => {
  it('chữ + nút tải lại + chi tiết; gọi lần hai thì thay hẳn nội dung cũ', () => {
    const shell = mountShell(document, meta, { now: NOW, t });
    shell.showNote({ text: 'Lần một', reload: true }, 'Error: hỏng\n    at x.js:1');
    expect(page.note.querySelector('p').textContent).toBe('Lần một');
    expect(page.note.querySelector('button').textContent).toBe(t.static.reload);
    expect(page.note.querySelector('pre').textContent).toContain('Error: hỏng');
    shell.showNote({ text: 'Lần hai', reload: false }, null);
    expect(page.note.querySelectorAll('p')).toHaveLength(1);
    expect(page.note.textContent).toBe('Lần hai');
    expect(page.note.querySelector('button')).toBeNull();
    expect(page.note.querySelector('pre')).toBeNull();
  });

  it('không có gì để nói thì ô ghi chú để trống (vẫn có mặt cho trình đọc màn hình)', () => {
    const shell = mountShell(document, meta, { now: NOW, t });
    shell.showNote({ text: 'x', reload: false }, null);
    shell.showNote({ text: null, reload: false }, null);
    expect(page.note.hidden).toBe(false);
    expect(page.note.childNodes).toHaveLength(0);
  });

  it('nút hành động (Dựng lại cảnh, Xem các lớp…) nằm sau chữ; bấm thì chạy action.run', () => {
    const shell = mountShell(document, meta, { now: NOW, t });
    const run = vi.fn();
    shell.showNote({ text: 'Chữ', reload: false, action: { label: 'Làm', run } });
    const [p, button] = page.note.children;
    expect([p.tagName, button.tagName, button.textContent, button.type]).toEqual(['P', 'BUTTON', 'Làm', 'button']);
    button.click();
    expect(run).toHaveBeenCalledTimes(1);
  });
});

describe('mất GPU lần đầu (showLost)', () => {
  it("data-state 'lost', poster hiện lại, gợi ý tắt; nút 'Dựng lại cảnh' dọn ghi chú rồi gọi onRebuild", () => {
    const onState = vi.fn();
    const shell = mountShell(document, meta, { now: NOW, t, onState });
    shell.setState('live');
    page.poster.hidden = true;
    shell.showHint('Chạm vào đây');
    const onRebuild = vi.fn();
    shell.showLost(onRebuild);
    expect(document.body.dataset.state).toBe('lost');
    expect(onState).toHaveBeenLastCalledWith('lost');
    expect(page.poster.hidden).toBe(false);
    expect(page.hint.textContent).toBe('');
    expect(page.note.querySelector('p').textContent).toBe(t.lost.text);
    const button = page.note.querySelector('button');
    expect(button.textContent).toBe(t.lost.rebuild);
    button.click();
    expect(onRebuild).toHaveBeenCalledTimes(1);
    expect(page.note.childNodes).toHaveLength(0);
  });

  it('đang lost thì hòa dần (của lần dựng cũ) không giấu poster, gợi ý và lời mời không hiện', async () => {
    vi.useFakeTimers();
    const shell = mountShell(document, meta, { now: NOW, t });
    const done = shell.crossfade(addCanvas());
    shell.showLost(() => {});
    await vi.advanceTimersByTimeAsync(1200);
    await done;
    expect(page.poster.hidden).toBe(false);
    shell.showHint('x');
    shell.invite(() => {});
    expect(page.hint.textContent).toBe('');
  });
});

describe('trăng SVG', () => {
  it('vẽ trăng đúng pha của "bây giờ" vào [data-moon] ngay lúc gắn vỏ', () => {
    mountShell(document, meta, { now: NOW, t });
    expect(page.moon.querySelector('.moon-lit')).not.toBeNull();
    expect(page.moon.querySelector('.moon-dark')).not.toBeNull();
  });

  it('trang không có [data-moon] (bức không có trăng) thì bỏ qua, không lỗi', () => {
    page.moon.remove();
    expect(() => mountShell(document, meta, { now: NOW, t })).not.toThrow();
  });
});


describe('?poster (GĐ 4): chỉ còn canvas để chụp poster', () => {
  it('body[data-poster]; không gợi ý, không lời mời; poster (img) vẫn là ảnh poster, không phải body', () => {
    const shell = mountShell(document, meta, { now: NOW, t, poster: true });
    expect(document.body.hasAttribute('data-poster')).toBe(true);
    shell.setState('live');
    shell.showHint('Chạm vào mặt nước');
    shell.invite(() => {});
    expect(page.hint.childNodes).toHaveLength(0);
    shell.setState('static');
    expect(page.poster.hidden).toBe(false); // vẫn đúng ảnh poster: shell không nhầm body là poster
    expect(document.body.hidden).toBe(false);
  });

  it('không có cờ thì không gắn data-poster', () => {
    mountShell(document, meta, { now: NOW, t });
    expect(document.body.hasAttribute('data-poster')).toBe(false);
  });
});

describe('gợi ý và lời mời', () => {
  it('showHint hiện chữ của bức; invite đổi thành NÚT mời có số lớp; bấm thì lời mời biến mất và gọi onOpen', () => {
    const shell = mountShell(document, meta, { now: NOW, t });
    expect(page.hint.textContent).toBe('');
    shell.showHint('Chạm vào đây');
    expect(page.hint.textContent).toBe('Chạm vào đây');
    expect(page.hint.dataset.kind).toBe('hint');
    const onOpen = vi.fn();
    shell.invite(onOpen);
    const button = page.hint.querySelector('button');
    expect(button.textContent).toBe(t.invite(3));
    expect(button.type).toBe('button');
    expect(page.hint.dataset.kind).toBe('invite');
    button.click();
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(page.hint.textContent).toBe('');
    expect(page.hint.dataset.kind).toBeUndefined();
  });

  it('về tầng tĩnh thì xóa gợi ý; gợi ý hay lời mời đến muộn cũng không hiện lại', () => {
    const shell = mountShell(document, meta, { now: NOW, t });
    shell.showHint('Chạm vào đây');
    shell.setState('static');
    expect(page.hint.textContent).toBe('');
    shell.showHint('Chạm vào đây');
    shell.invite(() => {});
    expect(page.hint.textContent).toBe('');
    expect(page.hint.hidden).toBe(false); // vùng live không bao giờ bị ẩn, chỉ để trống
  });

  it('showHint không có chữ, hoặc trang không có [data-hint], thì bỏ qua', () => {
    const shell = mountShell(document, meta, { now: NOW, t });
    shell.showHint('');
    expect(page.hint.textContent).toBe('');
    page.hint.remove();
    expect(() => shell.showHint('x')).not.toThrow();
    expect(() => shell.invite(() => {})).not.toThrow();
  });
});
