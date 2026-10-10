// @vitest-environment jsdom
// tests/unit/recipe-panel.test.js — mục Công thức của thanh lớp: dòng tóm tắt, "Về nguyên bản", nút chép link (và ô link khi chép hỏng).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRecipePanel } from '../../src/ui/recipe-panel.js';
import t from '../../src/ui/strings.vi.js';

const content = { dials: { gio: { label: 'Giờ' } } };

function fakeStudio(text = 'suong:0,gio:23') {
  const studio = {
    text,
    counts: { layers: 1, knobs: 2, dials: ['gio'] },
    recipe: () => ({ text: studio.text, counts: studio.counts }),
    dials: () => [{ id: 'gio', text: '23:00' }],
    reset: vi.fn(async () => { studio.text = ''; }),
  };
  return studio;
}

function mount(studio, win = window) {
  document.body.replaceChildren();
  const panel = createRecipePanel(document, { t, content, studio: () => studio, win });
  document.body.append(panel.summary, panel.section);
  const $ = (sel) => document.querySelector(sel);
  return { panel, $, status: $('.rail-recipe-status'), field: $('.rail-recipe-link'), text: $('.rail-recipe-text') };
}

function stubClipboard(writeText) {
  Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: writeText ? { writeText } : undefined });
}

beforeEach(() => {
  vi.useFakeTimers();
  window.history.replaceState(null, '', '/son-mai-anh-sang/?force3d');
});
afterEach(() => {
  vi.useRealTimers();
  stubClipboard(undefined);
});

describe('recipe-panel · tóm tắt', () => {
  it('show(): viết tóm tắt theo t.recipe.summary; Dial ghi nhãn của bức và text của bàn thợ', () => {
    const { panel, text, $ } = mount(fakeStudio());
    panel.show();
    expect(text.textContent).toBe('Công thức trong link: 1 lớp đã mài · 2 núm đã chỉnh · Giờ 23:00');
    expect($('[data-recipe-reset]').hidden).toBe(false);
  });

  it('phần bằng 0 bị bỏ', () => {
    const studio = fakeStudio('gio:23');
    studio.counts = { layers: 0, knobs: 0, dials: ['gio'] };
    const { panel, text } = mount(studio);
    panel.show();
    expect(text.textContent).toBe('Công thức trong link: Giờ 23:00');
  });

  it('sync() cập nhật khi chuỗi đổi; chuỗi về rỗng thì tự ẩn; chưa show() thì không viết gì', () => {
    const studio = fakeStudio();
    const { panel, text, $ } = mount(studio);
    panel.sync();
    expect(text.textContent).toBe('');
    panel.show();
    studio.text = 'suong:0';
    studio.counts = { layers: 1, knobs: 0, dials: [] };
    panel.sync();
    expect(text.textContent).toBe('Công thức trong link: 1 lớp đã mài');
    studio.text = '';
    panel.sync();
    expect(text.textContent).toBe('');
    expect($('[data-recipe-reset]').hidden).toBe(true);
  });

  it('"Về nguyên bản" gọi reset() rồi ẩn', async () => {
    const studio = fakeStudio();
    const { panel, text, $ } = mount(studio);
    panel.show();
    $('[data-recipe-reset]').click();
    await vi.advanceTimersByTimeAsync(0);
    expect(studio.reset).toHaveBeenCalledTimes(1);
    expect(text.textContent).toBe('');
    expect($('[data-recipe-reset]').hidden).toBe(true);
  });

  it('vùng aria-live không bao giờ có hidden', () => {
    const { panel, text, status } = mount(fakeStudio());
    for (const step of [() => {}, () => panel.show(), () => panel.hide()]) {
      step();
      expect(text.hasAttribute('hidden')).toBe(false);
      expect(status.hasAttribute('hidden')).toBe(false);
      expect(text.getAttribute('aria-live')).toBe('polite');
      expect(status.getAttribute('aria-live')).toBe('polite');
    }
  });
});

describe('recipe-panel · chép link', () => {
  it('chép origin + pathname + #r=…, KHÔNG có query string; báo "Đã chép link", tự xóa sau 4 giây', async () => {
    const writeText = vi.fn(async () => {});
    stubClipboard(writeText);
    const { $, status } = mount(fakeStudio());
    $('[data-recipe-copy]').click();
    await vi.advanceTimersByTimeAsync(0);
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/son-mai-anh-sang/#r=suong:0,gio:23`);
    expect(status.textContent).toBe(t.recipe.copied);
    await vi.advanceTimersByTimeAsync(3999);
    expect(status.textContent).toBe(t.recipe.copied);
    await vi.advanceTimersByTimeAsync(1);
    expect(status.textContent).toBe('');
  });

  it('chép hỏng: cuộn dải thanh lớp tới ô link (scrollIntoView nearest, không cuộn trang theo chiều dọc ép cả khối); chép được thì không cuộn', async () => {
    const { $, field } = mount(fakeStudio());
    const scroll = vi.fn();
    field.scrollIntoView = scroll;
    stubClipboard(vi.fn(async () => {}));
    $('[data-recipe-copy]').click();
    await vi.advanceTimersByTimeAsync(0);
    expect(scroll).not.toHaveBeenCalled();
    stubClipboard(undefined);
    $('[data-recipe-copy]').click();
    await vi.advanceTimersByTimeAsync(0);
    expect(scroll).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
  });

  it('công thức rỗng: link không có #r=', async () => {
    const writeText = vi.fn(async () => {});
    stubClipboard(writeText);
    const { $ } = mount(fakeStudio(''));
    $('[data-recipe-copy]').click();
    await vi.advanceTimersByTimeAsync(0);
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/son-mai-anh-sang/`);
  });

  it.each([
    ['writeText ném lỗi', () => stubClipboard(vi.fn(async () => { throw new Error('bị chặn'); }))],
    ['không có clipboard', () => stubClipboard(undefined)],
  ])('chép hỏng (%s): ô link chỉ đọc hiện ra, chứa link, đã chọn; dòng trạng thái copyFailed', async (_n, setup) => {
    setup();
    const { $, status, field } = mount(fakeStudio());
    expect(field.hidden).toBe(true);
    const select = vi.spyOn(field, 'select');
    $('[data-recipe-copy]').click();
    await vi.advanceTimersByTimeAsync(0);
    expect(field.hidden).toBe(false);
    expect(field.readOnly).toBe(true);
    expect(field.value).toBe(`${window.location.origin}/son-mai-anh-sang/#r=suong:0,gio:23`);
    expect(select).toHaveBeenCalled();
    expect(status.textContent).toBe(t.recipe.copyFailed);
    expect(field.getAttribute('aria-label')).toBe(t.recipe.linkLabel);
  });
});
