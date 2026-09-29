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
    expect(page.note.childNodes).toHaveLength(0);
    expect(page.seal.textContent).toBe('18 tháng Tám · Bính Ngọ');
  });

  it("'no-gpu': hướng dẫn bật tăng tốc phần cứng, không nút, không gợi ý ?debug", () => {
    showStatic(entry, shell, { reason: 'no-gpu', t, sma });
    expect(page.note.hidden).toBe(false);
    expect(page.note.textContent).toBe(t.static.noGpu);
    expect(page.note.querySelector('button')).toBeNull();
  });

  it("'chunk-load': lời nhắc tải lại kèm nút", () => {
    const error = new TypeError('Failed to fetch dynamically imported module: x');
    showStatic(entry, shell, { reason: 'chunk-load', error, t, sma });
    expect(page.note.querySelector('p').textContent).toBe(t.static.chunkLoad);
    expect(page.note.querySelector('button').textContent).toBe(t.static.reload);
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
