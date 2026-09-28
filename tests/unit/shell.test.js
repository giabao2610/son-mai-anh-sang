// @vitest-environment jsdom
// tests/unit/shell.test.js — vỏ trang: con dấu, data-state, hòa dần poster → canvas, huy hiệu, ghi chú tầng tĩnh
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mountShell } from '../../src/ui/shell.js';
import t from '../../src/ui/strings.vi.js';
import { mountPage } from '../helpers/page.js';

const meta = { slug: 'thu', title: 'Tranh thử', layers: [{ id: 'cot' }] };
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

  it('chạm vào huy hiệu thì mở/đóng lời giải thích', () => {
    const shell = mountShell(document, meta, { now: NOW, t });
    shell.showBadge({ tier: 'static' });
    page.badge.click();
    expect(page.badgeNote.hidden).toBe(false);
    expect(page.badgeNote.textContent).toBe(t.badge.explain.static);
    expect(page.badge.getAttribute('aria-expanded')).toBe('true');
    page.badge.click();
    expect(page.badgeNote.hidden).toBe(true);
    expect(page.badge.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('showNote', () => {
  it('chữ + nút tải lại + chi tiết; gọi lần hai thì thay hẳn nội dung cũ', () => {
    const shell = mountShell(document, meta, { now: NOW, t });
    shell.showNote({ text: 'Lần một', reload: true }, 'Error: hỏng\n    at x.js:1');
    expect(page.note.hidden).toBe(false);
    expect(page.note.querySelector('p').textContent).toBe('Lần một');
    expect(page.note.querySelector('button').textContent).toBe(t.static.reload);
    expect(page.note.querySelector('pre').textContent).toContain('Error: hỏng');
    shell.showNote({ text: 'Lần hai', reload: false }, null);
    expect(page.note.querySelectorAll('p')).toHaveLength(1);
    expect(page.note.textContent).toBe('Lần hai');
    expect(page.note.querySelector('button')).toBeNull();
    expect(page.note.querySelector('pre')).toBeNull();
  });

  it('không có gì để nói thì ô ghi chú vẫn ẩn', () => {
    const shell = mountShell(document, meta, { now: NOW, t });
    shell.showNote({ text: null, reload: false }, null);
    expect(page.note.hidden).toBe(true);
    expect(page.note.childElementCount).toBe(0);
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
