// @vitest-environment jsdom
// tests/unit/static.test.js — tầng tĩnh theo lý do: chữ đúng lý do, gọi nhiều lần vẫn an toàn
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isChunkError, staticNote, showStatic } from '../../src/engine/static.js';
import { createSma } from '../../src/engine/sma.js';
import { mountShell } from '../../src/ui/shell.js';
import t from '../../src/ui/strings.vi.js';
import { mountPage } from '../helpers/page.js';

const entry = { meta: { slug: 'thu', title: 'Tranh thử', layers: [{ id: 'cot' }] } };

describe('isChunkError', () => {
  it.each([
    'Failed to fetch dynamically imported module: https://x/assets/run-abc.js', // Chrome
    'error loading dynamically imported module: https://x/assets/run-abc.js', // Firefox
    'Importing a module script failed.', // Safari
    'Unable to preload CSS for /assets/index-abc.css', // Vite
  ])('nhận ra lỗi tải chunk: %s', (message) => {
    expect(isChunkError(new TypeError(message))).toBe(true);
    expect(isChunkError(message)).toBe(true);
  });

  it('lỗi khác thì không', () => {
    expect(isChunkError(new Error('boom'))).toBe(false);
    expect(isChunkError(null)).toBe(false);
  });
});

describe('staticNote', () => {
  it('chữ theo lý do; mọi lý do lỗi khác dùng chung một câu', () => {
    expect(staticNote('flag', t)).toEqual({ text: null, reload: false });
    expect(staticNote('no-gpu', t)).toEqual({ text: t.static.noGpu, reload: false });
    expect(staticNote('chunk-load', t)).toEqual({ text: t.static.chunkLoad, reload: true });
    expect(staticNote('timeout', t)).toEqual({ text: t.static.timeout, reload: true });
    for (const reason of ['frame-errors', 'gpu-error', 'device-lost', 'error']) {
      expect(staticNote(reason, t)).toEqual({ text: t.static.error, reload: false });
    }
  });
});

describe('showStatic', () => {
  let page;
  let shell;
  let sma;
  beforeEach(() => {
    page = mountPage(document);
    sma = createSma({});
    shell = mountShell(document, entry.meta, {
      now: new Date('2026-09-28T21:00:00+07:00'),
      t,
      onState: (s) => sma.set({ state: s }),
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("'flag': chỉ poster, thơ, con dấu; huy hiệu 'static'; không ghi chú", () => {
    showStatic(entry, shell, { reason: 'flag', t, sma });
    expect(sma).toMatchObject({ state: 'static', reason: 'flag', error: null });
    expect(document.body.dataset.state).toBe('static');
    expect(page.badge.dataset.backend).toBe('static');
    expect(page.note.querySelector('p')).toBeNull(); // không có lời giải thích, chỉ có nút mở Sổ tay
    expect(page.seal.textContent).toBe('18 tháng Tám · Bính Ngọ');
  });

  it('có công thức (GĐ 9): thêm câu giải thích, kể cả lý do "flag" vốn không có chữ; không có thì như cũ', () => {
    const recipe = { entries: [{ key: 'suong', value: '0' }], problems: [] };
    showStatic(entry, shell, { reason: 'flag', t, sma, recipe });
    expect(page.note.querySelector('p').textContent).toBe(t.recipe.staticNote);
    showStatic(entry, shell, { reason: 'no-gpu', t, sma, recipe });
    expect(page.note.querySelector('p').textContent).toBe(`${t.static.noGpu} ${t.recipe.staticNote}`);
    showStatic(entry, shell, { reason: 'error', t, sma, recipe: { entries: [], problems: ['x'] } });
    expect(page.note.querySelector('p').textContent).toBe(`${t.static.error} ${t.static.debugHint}`);
  });

  it("'no-gpu': hướng dẫn bật tăng tốc phần cứng, không nút, không gợi ý ?debug", () => {
    showStatic(entry, shell, { reason: 'no-gpu', t, sma });
    expect(page.note.querySelector('p').textContent).toBe(t.static.noGpu);
    expect([...page.note.querySelectorAll('button')].map((b) => b.textContent)).toEqual([t.notebook.openStatic(1)]);
  });

  it("'chunk-load': lời nhắc tải lại kèm nút", () => {
    const error = new TypeError('Failed to fetch dynamically imported module: x');
    showStatic(entry, shell, { reason: 'chunk-load', error, t, sma });
    expect(page.note.querySelector('p').textContent).toBe(t.static.chunkLoad);
    // Chunk vừa hỏng thì chunk của Sổ tay cũng hỏng: chỉ có nút tải lại.
    expect([...page.note.querySelectorAll('button')].map((b) => b.textContent)).toEqual([t.static.reload]);
    expect(sma.error).toBe('Failed to fetch dynamically imported module: x');
  });

  it("'timeout': mạng chậm, kèm nút tải lại, không gợi ý ?debug", () => {
    showStatic(entry, shell, { reason: 'timeout', error: new Error('quá hạn'), t, sma });
    expect(page.note.querySelector('p').textContent).toBe(t.static.timeout);
    expect(page.note.querySelector('button').textContent).toBe(t.static.reload);
    expect(sma).toMatchObject({ reason: 'timeout', error: 'quá hạn' });
  });

  it('lỗi runtime, không ?debug: báo lỗi kèm gợi ý ?debug, không in chi tiết', () => {
    showStatic(entry, shell, { reason: 'frame-errors', error: new Error('3 khung lỗi'), t, sma });
    expect(page.note.querySelector('p').textContent).toBe(`${t.static.error} ${t.static.debugHint}`);
    expect(page.note.querySelector('pre')).toBeNull();
    expect(sma).toMatchObject({ reason: 'frame-errors', error: '3 khung lỗi' });
  });

  it('lỗi runtime, có ?debug: in message và stack, bỏ gợi ý', () => {
    showStatic(entry, shell, { reason: 'error', error: new Error('createLayer hỏng'), debug: true, t, sma });
    expect(page.note.querySelector('p').textContent).toBe(t.static.error);
    const detail = page.note.querySelector('pre').textContent;
    expect(detail).toContain('createLayer hỏng');
    expect(detail).toContain('static.test.js'); // có stack
  });

  it('gọi lại cùng lý do thì không làm gì thêm; lý do khác thì cập nhật', () => {
    const showNote = vi.spyOn(shell, 'showNote');
    showStatic(entry, shell, { reason: 'no-gpu', t, sma });
    showStatic(entry, shell, { reason: 'no-gpu', t, sma });
    expect(showNote).toHaveBeenCalledTimes(1);
    showStatic(entry, shell, { reason: 'frame-errors', error: new Error('3 khung lỗi'), t, sma });
    expect(showNote).toHaveBeenCalledTimes(2);
    expect(sma).toMatchObject({ reason: 'frame-errors', error: '3 khung lỗi' });
    expect(page.note.querySelectorAll('p')).toHaveLength(1);
  });

  it('rơi về tĩnh sau khi đã live: poster hiện lại', () => {
    shell.setState('live');
    page.poster.hidden = true;
    showStatic(entry, shell, { reason: 'device-lost', t, sma });
    expect(page.poster.hidden).toBe(false);
    expect(sma.state).toBe('static');
  });
});

describe('Sổ tay chỉ đọc ở tầng tĩnh (GĐ 2)', () => {
  const meta = {
    slug: 'thu',
    title: 'Tranh thử',
    layers: [{ id: 'cot', name: 'Cốt', files: ['x.js'] }, { id: 'lop-hai', name: 'Lớp hai', files: ['y.js'] }],
  };
  const content = { hint: 'x', layers: { cot: { understand: 'Đất sét.', learned: ['Một điều'], readMore: [], knobs: {} } } };

  it('nút "Xem N lớp" mở thanh lớp (tên lớp, không công tắc) và Sổ tay trang Cốt; bấm lần hai không dựng thêm', async () => {
    mountPage(document);
    const sma = createSma({});
    const shell = mountShell(document, meta, { now: new Date('2026-09-28T21:00:00+07:00'), t, onState: (s) => sma.set({ state: s }) });
    const load = vi.fn(async () => ({ default: content }));
    showStatic({ meta, content: { vi: load } }, shell, { reason: 'flag', t, sma });
    const button = document.querySelector('[data-static] button');
    expect(button.textContent).toBe(t.notebook.openStatic(2));
    button.click();
    await vi.waitFor(() => expect(document.querySelector('[data-rail]')?.hidden).toBe(false));
    const rail = document.querySelector('[data-rail]');
    expect([...rail.querySelectorAll('.rail-name')].map((b) => b.textContent)).toEqual(['1Cốt', '2Lớp hai']);
    expect(rail.querySelector('[role="switch"]')).toBeNull();
    const notebook = document.querySelector('[data-notebook]');
    expect(notebook.hidden).toBe(false);
    expect(notebook.querySelector('.nb-understand').textContent).toBe('Đất sét.');
    button.click();
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(1));
    expect(document.querySelectorAll('[data-rail]')).toHaveLength(1);
  });

  it('chữ tải hỏng → cảnh báo, Sổ tay vẫn mở và báo thiếu chữ', async () => {
    mountPage(document);
    const sma = createSma({});
    const shell = mountShell(document, meta, { now: new Date('2026-09-28T21:00:00+07:00'), t, onState: (s) => sma.set({ state: s }) });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const load = vi.fn(async () => {
      throw new Error('mất mạng');
    });
    showStatic({ meta, content: { vi: load } }, shell, { reason: 'flag', t, sma });
    document.querySelector('[data-static] button').click();
    await vi.waitFor(() => expect(document.querySelector('[data-notebook]')?.hidden).toBe(false));
    expect(document.querySelector('[data-notebook] .nb-missing').textContent).toBe(t.notebook.contentMissing);
    expect(warn).toHaveBeenCalledWith('Không tải được chữ của bức (vi):', expect.any(Error));
    warn.mockRestore();
  });

  it('chunk của Sổ tay tải hỏng (trang vừa deploy) → ghi chú thành lời mời tải lại có nút, kèm cảnh báo', async () => {
    mountPage(document);
    const sma = createSma({});
    const shell = mountShell(document, meta, { now: new Date('2026-09-28T21:00:00+07:00'), t, onState: (s) => sma.set({ state: s }) });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const chunkError = new TypeError('Failed to fetch dynamically imported module: workshop-abc.js');
    showStatic({ meta }, shell, { reason: 'no-gpu', t, sma, loadWorkshop: () => Promise.reject(chunkError) });
    document.querySelector('[data-static] button').click();
    await vi.waitFor(() => expect(document.querySelector('[data-static] p').textContent).toBe(t.static.chunkLoad));
    expect([...document.querySelectorAll('[data-static] button')].map((b) => b.textContent)).toEqual([t.static.reload]);
    expect(warn).toHaveBeenCalledWith('Không mở được Sổ tay:', chunkError);
    warn.mockRestore();
  });
});
