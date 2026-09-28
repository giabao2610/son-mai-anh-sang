// tests/unit/boot.test.js — khởi động: cờ URL → dò tầng → tranh tĩnh, hoặc tải phần 3D trong hạn 10 giây
// Cố ý chạy ở môi trường node mặc định (dòng 1 không khai báo jsdom): ở node, Vitest biến đổi file kiểu SSR,
// nên import('./gpu/run.js') trong boot.js được phép trỏ tới file chưa có (Task 15 mới tạo). DOM tự dựng bằng JSDOM.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { boot } from '../../src/engine/boot.js';
import t from '../../src/ui/strings.vi.js';
import { mountPage } from '../helpers/page.js';

const entry = { meta: { slug: 'thu', title: 'Tranh thử', layers: [{ id: 'cot' }] }, load: vi.fn() };

/** WebGL2 giả của SwiftShader: có WEBGL_debug_renderer_info, nhưng tên renderer là phần mềm. */
function swiftShaderGl() {
  return {
    getExtension: (name) =>
      name === 'WEBGL_debug_renderer_info'
        ? { UNMASKED_RENDERER_WEBGL: 0x9246 }
        : name === 'WEBGL_lose_context'
          ? { loseContext() {} }
          : null,
    getParameter: () => 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)',
  };
}

/** Cửa sổ giả, chỉ có thứ boot đọc: location.search, isSecureContext, navigator (không có gpu), document. */
function fakeWin({ search = '', gl = null } = {}) {
  return {
    location: { search },
    isSecureContext: true,
    navigator: {},
    document: { createElement: () => ({ getContext: () => gl }) },
  };
}

const webglWin = (extra = '') => fakeWin({ search: `?webgl&force3d${extra}`, gl: swiftShaderGl() });

let doc;
let page;
beforeEach(() => {
  doc = new JSDOM('<!doctype html><html><body></body></html>').window.document;
  page = mountPage(doc);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('boot', () => {
  it('(a) ?static → tầng tĩnh lý do "flag", không tải phần 3D', async () => {
    const win = fakeWin({ search: '?static' });
    const loadRun = vi.fn();
    await boot(entry, { lang: 'vi', t, win, doc, loadRun });
    expect(loadRun).not.toHaveBeenCalled();
    expect(win.__sma).toMatchObject({ state: 'static', tier: 'static', reason: 'flag' });
    expect(doc.body.dataset.state).toBe('static');
    expect(page.badge.dataset.backend).toBe('static');
    expect(page.note.hidden).toBe(true);
  });

  it('(b2) đọc window ném lỗi (trình duyệt lạ, extension chặn) → vẫn về tầng tĩnh, không ném ra ngoài', async () => {
    const win = fakeWin();
    Object.defineProperty(win, 'navigator', { get() { throw new Error('bị chặn'); } });
    const loadRun = vi.fn();
    await boot(entry, { t, win, doc, loadRun });
    expect(loadRun).not.toHaveBeenCalled();
    expect(win.__sma).toMatchObject({ state: 'static', tier: 'static', reason: 'no-gpu' });
  });

  it('(b) không có GPU → tầng tĩnh lý do "no-gpu" kèm hướng dẫn', async () => {
    const win = fakeWin();
    const loadRun = vi.fn();
    await boot(entry, { t, win, doc, loadRun });
    expect(loadRun).not.toHaveBeenCalled();
    expect(win.__sma).toMatchObject({ state: 'static', tier: 'static', reason: 'no-gpu' });
    expect(page.note.textContent).toBe(t.static.noGpu);
  });

  it('(c) ?webgl&force3d trên SwiftShader → webgl2; run nhận đủ { tier, flags, now, lang, t, sma, onFail }', async () => {
    const win = webglWin('&at=2026-09-28T21:00');
    const handle = { dispose: vi.fn() };
    const run = vi.fn(async () => handle);
    const loadRun = vi.fn(async () => ({ run }));
    await boot(entry, { lang: 'vi', t, win, doc, loadRun });
    expect(loadRun).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledTimes(1);
    const [gotEntry, shell, opts] = run.mock.calls[0];
    expect(gotEntry).toBe(entry);
    expect(shell.stageEl).toBe(page.stage);
    expect(opts).toMatchObject({ tier: 'webgl2', lang: 'vi', t, sma: win.__sma });
    expect(opts.flags).toMatchObject({ webgl: true, force3d: true, static: false });
    expect(opts.now.toISOString()).toBe('2026-09-28T14:00:00.000Z');
    expect(opts.onFail).toBeTypeOf('function');
    expect(win.__sma).toMatchObject({ state: 'loading', tier: 'webgl2', reason: null });
    expect(page.seal.textContent).toBe('18 tháng Tám · Bính Ngọ');
    expect(handle.dispose).not.toHaveBeenCalled();
  });

  it('(d) tải chunk lỗi → tầng tĩnh "chunk-load" kèm nút tải lại', async () => {
    const win = webglWin();
    const loadRun = () =>
      Promise.reject(new TypeError('Failed to fetch dynamically imported module: https://x/assets/run-abc.js'));
    await boot(entry, { t, win, doc, loadRun });
    expect(win.__sma).toMatchObject({ state: 'static', tier: 'webgl2', reason: 'chunk-load' });
    expect(page.note.querySelector('button').textContent).toBe(t.static.reload);
  });

  it('(e) run treo quá 10 s → "timeout"; xong muộn thì bị dispose và không kéo được poster đi', async () => {
    vi.useFakeTimers();
    const win = webglWin();
    const handle = { dispose: vi.fn() };
    let finishLate;
    const run = (_entry, shell) =>
      new Promise((resolve) => {
        finishLate = async () => {
          await shell.crossfade(doc.createElement('canvas'));
          shell.setState('live');
          shell.showBadge({ tier: 'webgl2', level: 'vua' });
          resolve(handle);
        };
      });
    const booted = boot(entry, { t, win, doc, loadRun: async () => ({ run }) });
    await vi.advanceTimersByTimeAsync(9_999);
    expect(win.__sma.state).toBe('loading');
    await vi.advanceTimersByTimeAsync(1);
    await booted;
    expect(win.__sma).toMatchObject({ state: 'static', reason: 'timeout' });
    await finishLate();
    await vi.advanceTimersByTimeAsync(0);
    expect(handle.dispose).toHaveBeenCalledTimes(1);
    expect(win.__sma.state).toBe('static');
    expect(page.poster.hidden).toBe(false);
    expect(page.badge.dataset.backend).toBe('static');
  });

  it('(f) onFail sau khi đã live → tầng tĩnh với đúng lý do đó', async () => {
    const win = webglWin();
    let onFail;
    const run = async (_entry, shell, opts) => {
      onFail = opts.onFail;
      shell.setState('live');
      return { dispose: vi.fn() };
    };
    await boot(entry, { t, win, doc, loadRun: async () => ({ run }) });
    expect(win.__sma.state).toBe('live');
    onFail('frame-errors', new Error('3 khung lỗi liên tiếp'));
    expect(win.__sma).toMatchObject({ state: 'static', reason: 'frame-errors', error: '3 khung lỗi liên tiếp' });
    expect(page.badge.dataset.backend).toBe('static');
    expect(page.note.querySelector('p').textContent).toBe(`${t.static.error} ${t.static.debugHint}`);
  });

  it('(g) báo cùng một lỗi hai lần vẫn an toàn: một ghi chú, giữ lỗi đầu', async () => {
    const win = webglWin();
    let onFail;
    const run = async (_entry, _shell, opts) => {
      onFail = opts.onFail;
      return { dispose() {} };
    };
    await boot(entry, { t, win, doc, loadRun: async () => ({ run }) });
    onFail('gpu-error', new Error('validation'));
    onFail('gpu-error', new Error('validation lần 2'));
    expect(win.__sma).toMatchObject({ state: 'static', reason: 'gpu-error', error: 'validation' });
    expect(page.note.querySelectorAll('p')).toHaveLength(1);
  });

  it('?debug: lỗi lúc dựng cảnh → lý do "error", in chi tiết vào ghi chú', async () => {
    const win = webglWin('&debug');
    const run = async () => {
      throw new Error('createLayer hỏng');
    };
    await boot(entry, { t, win, doc, loadRun: async () => ({ run }) });
    expect(win.__sma).toMatchObject({ state: 'static', reason: 'error', error: 'createLayer hỏng' });
    expect(page.note.querySelector('pre').textContent).toContain('createLayer hỏng');
  });
});
