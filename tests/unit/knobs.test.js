// @vitest-environment jsdom
// tests/unit/knobs.test.js — núm Tweakpane của một lớp: đủ kiểu núm, nhãn từ content, onChange/onHover, 'rebuild' chỉ khi thả tay.
import { describe, it, expect, vi } from 'vitest';
import { appliesNow, mountKnobs } from '../../src/ui/knobs.js';

const knobs = [
  { id: 'size', kind: 'number', via: 'uniform', min: 0, max: 1, step: 0.01 },
  { id: 'count', kind: 'number', via: 'rebuild', min: 100, max: 2000, step: 50 },
  { id: 'tone', kind: 'select', via: 'uniform', options: ['none', 'agx'] },
  { id: 'rim', kind: 'color', via: 'uniform' },
  { id: 'wire', kind: 'bool', via: 'rebuild' },
];
const values = { size: 0.5, count: 800, tone: 'agx', rim: '#f2d48a', wire: false };
const labels = { size: 'Cỡ', tone: { label: 'Tone', options: { none: 'Không', agx: 'AgX' } } };

function mount() {
  const container = document.createElement('div');
  document.body.append(container);
  const onChange = vi.fn();
  const onHover = vi.fn();
  const pane = mountKnobs(container, { knobs, values, labels, onChange, onHover });
  const blade = (id) => container.querySelector(`[data-knob="${id}"]`);
  return { container, pane, onChange, onHover, blade };
}

describe('appliesNow', () => {
  it("núm 'rebuild' chỉ áp khi thả tay; 'uniform' và 'js' áp cả trong lúc kéo", () => {
    expect(appliesNow({ via: 'rebuild' }, false)).toBe(false);
    expect(appliesNow({ via: 'rebuild' }, true)).toBe(true);
    expect(appliesNow({ via: 'uniform' }, false)).toBe(true);
    expect(appliesNow({ via: 'js' }, false)).toBe(true);
  });
});

describe('mountKnobs', () => {
  it('mọi ô nhập của Tweakpane (ô số, ô chọn, ô màu, ô đánh dấu) có aria-label là nhãn của núm (axe: luật label, GĐ 4)', () => {
    const { container } = mount();
    const inputs = [...container.querySelectorAll('[data-knob] input, [data-knob] select')];
    expect(inputs.length).toBeGreaterThanOrEqual(knobs.length);
    for (const input of inputs) expect(input.getAttribute('aria-label'), input.outerHTML.slice(0, 60)).toBeTruthy();
    expect(container.querySelector('[data-knob="size"] input').getAttribute('aria-label')).toBe('Cỡ');
  });

  it('nút ô màu của núm màu (mở bảng chọn màu) có aria-label là nhãn của núm (axe: luật button-name, sau GĐ 9)', () => {
    const { container } = mount();
    const buttons = [...container.querySelectorAll('[data-knob] button')];
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) expect(button.getAttribute('aria-label'), button.outerHTML.slice(0, 60)).toBeTruthy();
    expect(container.querySelector('[data-knob="rim"] button').getAttribute('aria-label')).toBe('rim');
  });

  it('mỗi núm một blade có data-knob; nhãn từ content, thiếu thì dùng id', () => {
    const { blade, pane } = mount();
    for (const { id } of knobs) expect(blade(id), id).not.toBeNull();
    expect(blade('size').textContent).toContain('Cỡ');
    expect(blade('count').textContent).toContain('count');
    expect(blade('tone').textContent).toContain('Tone');
    expect([...blade('tone').querySelectorAll('option')].map((o) => o.textContent)).toEqual(['Không', 'AgX']);
    pane.dispose();
  });

  it('rê chuột / focus → onHover(id); rời ra → onHover(null)', () => {
    const { blade, onHover, pane } = mount();
    blade('size').dispatchEvent(new Event('pointerenter'));
    expect(onHover).toHaveBeenLastCalledWith('size');
    blade('size').dispatchEvent(new Event('pointerleave'));
    expect(onHover).toHaveBeenLastCalledWith(null);
    blade('tone').dispatchEvent(new Event('focusin', { bubbles: true }));
    expect(onHover).toHaveBeenLastCalledWith('tone');
    pane.dispose();
  });

  it('đổi giá trị → onChange(id, giá trị) và sáng dòng; refresh() đọc lại giá trị từ bàn thợ', () => {
    const { blade, onChange, onHover, pane } = mount();
    const select = blade('tone').querySelector('select');
    select.selectedIndex = 0; // Tweakpane đặt value của <option> là chỉ số, nhãn là chữ trong content
    select.dispatchEvent(new Event('change'));
    expect(onChange).toHaveBeenLastCalledWith('tone', 'none');
    expect(onHover).toHaveBeenLastCalledWith('tone');
    pane.refresh({ tone: 'agx' });
    expect(select.selectedIndex).toBe(1);
    pane.dispose();
  });

  it('refresh() chỉ đọc lại giá trị, không phải người xem đổi núm: không gọi onChange (kể cả khi giá trị khác)', () => {
    const { onChange, pane } = mount();
    // Tweakpane phát 'change' khi refresh() thấy giá trị khác. Núm áp hỏng thì Sổ tay refresh về giá trị cũ: nếu coi
    // đó là một lần sửa, lớp sẽ dựng lại thêm một lần và dòng báo lỗi bị xóa ngay trước khi kịp hiện.
    pane.refresh({ size: 0.25, count: 400, tone: 'none', rim: '#000000', wire: true });
    expect(onChange).not.toHaveBeenCalled();
    pane.dispose();
  });

  it("núm 'rebuild': onChange ngay khi đổi xong (checkbox là một lần thả tay)", () => {
    const { blade, onChange, pane } = mount();
    const box = blade('wire').querySelector('input[type="checkbox"]');
    box.checked = true;
    box.dispatchEvent(new Event('change'));
    expect(onChange).toHaveBeenLastCalledWith('wire', true);
    pane.dispose();
  });

  it('số hiện đủ chữ số thập phân theo bước của núm (bước 0.0001 → 4 chữ số)', () => {
    const container = document.createElement('div');
    const pane = mountKnobs(container, {
      knobs: [{ id: 'bias', kind: 'number', via: 'js', min: -0.005, max: 0.005, step: 0.0001 }],
      values: { bias: -0.0005 },
      onChange: () => {},
    });
    expect(container.querySelector('[data-knob="bias"] input').value).toBe('-0.0005');
    pane.dispose();
  });

  it('dispose() gỡ pane khỏi container', () => {
    const { container, pane } = mount();
    pane.dispose();
    expect(container.querySelector('[data-knob]')).toBeNull();
  });
});
