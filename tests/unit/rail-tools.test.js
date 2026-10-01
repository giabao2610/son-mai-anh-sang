// @vitest-environment jsdom
// tests/unit/rail-tools.test.js — mục Đồ nghề + thanh trượt Dial: nút aria-pressed, mỗi lúc một công cụ, input range có aria-valuetext, ghi chú.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRailTools } from '../../src/ui/rail-tools.js';
import { createDials } from '../../src/ui/dials.js';
import t from '../../src/ui/strings.vi.js';

const content = { dials: { gio: { label: 'Giờ', notes: { daytime: 'Ban ngày: mượn 21:00.' } } } };

/** Bàn thợ giả: hai công cụ, một Dial giờ (giá trị, chữ, ghi chú theo trạng thái). */
function fakeStudio() {
  const state = { tool: null, hour: 21, note: 'daytime' };
  const fmt = (v) => `${String(Math.floor(v) % 24).padStart(2, '0')}:${String(Math.round((v % 1) * 60)).padStart(2, '0')}`;
  return {
    state,
    tools: () => [{ id: 'kinh-mai', on: state.tool === 'kinh-mai' }, { id: 'lot-lop', on: state.tool === 'lot-lop' }],
    setTool: vi.fn(async (id) => { state.tool = id; }),
    dials: () => [{ id: 'gio', min: 18, max: 29.5, step: 0.25, value: state.hour, text: fmt(state.hour), note: state.note }],
    setDial: vi.fn(async (id, v) => { state.hour = v; state.note = null; }),
  };
}

beforeEach(() => document.body.replaceChildren());

describe('createRailTools', () => {
  it('Đồ nghề: tiêu đề, mỗi công cụ một nút aria-pressed mang tên ở t.tools; bấm thì bật, bấm lại thì tắt', async () => {
    const studio = fakeStudio();
    const tools = createRailTools(document, { t, content, studio: () => studio });
    document.body.append(tools.el);
    expect(tools.el.querySelector('#rail-tools-title').textContent).toBe(t.rail.tools);
    expect(tools.el.getAttribute('aria-labelledby')).toBe('rail-tools-title');
    const buttons = [...tools.el.querySelectorAll('[data-tool]')];
    expect(buttons.map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([['Kính mài', 'false'], ['Lột lớp', 'false']]);
    buttons[0].click();
    expect(studio.setTool).toHaveBeenLastCalledWith('kinh-mai');
    await Promise.resolve();
    tools.sync();
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false']);
    buttons[0].click(); // bấm lại nút đang bật: tắt
    expect(studio.setTool).toHaveBeenLastCalledWith(null);
  });

  it('thanh giờ: input range có nhãn, aria-valuetext là chữ của format, ghi chú từ content; kéo thì setDial', async () => {
    const studio = fakeStudio();
    const tools = createRailTools(document, { t, content, studio: () => studio });
    document.body.append(tools.el);
    tools.sync();
    const input = tools.el.querySelector('input[type="range"]');
    expect([input.min, input.max, input.step, input.value]).toEqual(['18', '29.5', '0.25', '21']);
    expect(tools.el.querySelector(`label[for="${input.id}"]`).textContent).toBe('Giờ');
    expect(input.getAttribute('aria-valuetext')).toBe('21:00');
    expect(tools.el.querySelector('output').textContent).toBe('21:00');
    const note = tools.el.querySelector('.dial-note');
    expect([note.textContent, note.getAttribute('aria-live'), note.hidden]).toEqual(['Ban ngày: mượn 21:00.', 'polite', false]);
    input.value = '26.5';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(studio.setDial).toHaveBeenCalledWith('gio', 26.5);
    await Promise.resolve();
    tools.sync();
    expect(input.getAttribute('aria-valuetext')).toBe('02:30');
    expect(note.textContent).toBe(''); // kéo thanh đi rồi thì thôi ghi chú
  });

  it('điện thoại: nút nhỏ "◷ 21:00" (aria-expanded) mở ô trượt; aria-label đọc được tên và giá trị', () => {
    const studio = fakeStudio();
    const tools = createRailTools(document, { t, content, studio: () => studio });
    document.body.append(tools.el);
    tools.sync();
    const chip = tools.el.querySelector('.dial-chip');
    expect([chip.textContent, chip.getAttribute('aria-label'), chip.getAttribute('aria-controls')]).toEqual(['◷ 21:00', 'Giờ: 21:00', 'rail-dials']);
    const panel = tools.el.querySelector('#rail-dials');
    expect(panel.hasAttribute('data-open')).toBe(false);
    chip.click();
    expect([chip.getAttribute('aria-expanded'), panel.hasAttribute('data-open')]).toEqual(['true', true]);
    chip.click();
    expect(panel.hasAttribute('data-open')).toBe(false);
  });

  it('chữ của bức tải hỏng (content = null): thanh giờ vẫn chạy, nhãn là id, không có ghi chú', () => {
    const studio = fakeStudio();
    const tools = createRailTools(document, { t, content: null, studio: () => studio });
    document.body.append(tools.el);
    tools.sync();
    const input = tools.el.querySelector('input[type="range"]');
    expect(tools.el.querySelector(`label[for="${input.id}"]`).textContent).toBe('gio');
    expect(tools.el.querySelector('.dial-note').textContent).toBe('');
    expect(tools.el.querySelector('.dial-chip').getAttribute('aria-label')).toBe('gio: 21:00');
  });

  it('dựng lại cảnh sau khi mất GPU (bàn thợ mới, công cụ về tắt): nút Đồ nghề đọc lại trạng thái thật', async () => {
    let current = fakeStudio();
    const tools = createRailTools(document, { t, content, studio: () => current });
    document.body.append(tools.el);
    tools.el.querySelector('[data-tool="kinh-mai"]').click();
    await Promise.resolve();
    tools.sync();
    expect(tools.el.querySelector('[data-tool="kinh-mai"]').getAttribute('aria-pressed')).toBe('true');
    current = fakeStudio(); // cảnh mới: chưa bật công cụ nào
    tools.sync();
    expect(tools.el.querySelector('[data-tool="kinh-mai"]').getAttribute('aria-pressed')).toBe('false');
  });

  it('bức không có Dial: không có thanh trượt, không có nút nhỏ; mất GPU (studio() = null) thì sync không làm gì', () => {
    const studio = { ...fakeStudio(), dials: () => [] };
    let current = studio;
    const tools = createRailTools(document, { t, content: null, studio: () => current });
    expect(tools.el.querySelector('.dial-chip')).toBeNull();
    expect(tools.el.querySelector('input')).toBeNull();
    current = null;
    expect(() => tools.sync()).not.toThrow();
  });
});

describe('createDials', () => {
  it('ghi chú chỉ ghi lại khi chữ đổi (vùng aria-live: ghi lại cùng câu thì trình đọc màn hình đọc lại)', () => {
    const dials = createDials(document, {
      dials: [{ id: 'gio', min: 18, max: 29.5, step: 0.25, value: 21, text: '21:00', note: 'daytime' }],
      content,
      onChange: () => {},
    });
    document.body.append(dials.el);
    const note = dials.el.querySelector('.dial-note');
    const seen = new MutationObserver(() => {});
    seen.observe(note, { childList: true, characterData: true, subtree: true });
    dials.update([{ id: 'gio', min: 18, max: 29.5, step: 0.25, value: 21, text: '21:00', note: 'daytime' }]);
    expect(seen.takeRecords()).toHaveLength(0);
    seen.disconnect();
  });
});
