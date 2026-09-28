// @vitest-environment jsdom
// tests/unit/moon-svg.test.js — trăng SVG đúng pha: hướng phần sáng, đường ranh sáng/tối, vẽ vào <svg data-moon>.
import { describe, it, expect } from 'vitest';
import { drawMoon, moonPath } from '../../src/ui/moon-svg.js';

/** Đọc lại hai cung của path: [sweep nửa vòng ngoài, bán trục ngang của đường ranh, sweep đường ranh]. */
function arcs(d) {
  const m = /^M0 -1A1 1 0 0 ([01]) 0 1A([\d.]+) 1 0 0 ([01]) 0 -1Z$/.exec(d);
  expect(m, d).not.toBeNull();
  return { outer: Number(m[1]), rx: Number(m[2]), inner: Number(m[3]) };
}

describe('moonPath', () => {
  it('trăng tròn (π): cả đĩa sáng; trăng mới (0): phần sáng không có diện tích', () => {
    // Cung ngoài đi từ trên xuống, đường ranh đi từ dưới lên: CÙNG cờ sweep nghĩa là hai cung ở hai phía.
    const full = arcs(moonPath(Math.PI));
    expect(full.rx).toBeCloseTo(1, 4);
    expect(full.outer).toBe(full.inner); // hai nửa vòng ở hai phía → đủ vòng tròn
    const dark = arcs(moonPath(0));
    expect(dark.rx).toBeCloseTo(1, 4);
    expect(dark.outer).not.toBe(dark.inner); // đường ranh quay về trùng nửa vòng ngoài → diện tích 0
  });

  it('thượng huyền (π/2) sáng nửa PHẢI, hạ huyền (3π/2) sáng nửa TRÁI, đường ranh thẳng', () => {
    const first = arcs(moonPath(Math.PI / 2));
    expect([first.outer, first.rx]).toEqual([1, 0]);
    const last = arcs(moonPath((3 * Math.PI) / 2));
    expect([last.outer, last.rx]).toEqual([0, 0]);
  });

  it('trăng khuyết: đường ranh lồi về phía sáng; trăng gần tròn: lồi về phía tối', () => {
    expect(arcs(moonPath(0.8)).inner).toBe(0); // lưỡi liềm đầu tháng
    expect(arcs(moonPath(2.4)).inner).toBe(1); // trăng già hơn nửa, đang lên
    expect(arcs(moonPath(4.0)).inner).toBe(0); // trăng hơn nửa, đang tàn
    expect(arcs(moonPath(5.6)).inner).toBe(1); // lưỡi liềm cuối tháng
  });

  it('pha ngoài [0, 2π) được quy về trong khoảng', () => {
    expect(moonPath(Math.PI / 2 + Math.PI * 2)).toBe(moonPath(Math.PI / 2));
    expect(moonPath(-Math.PI / 2)).toBe(moonPath((3 * Math.PI) / 2));
  });
});

describe('drawMoon', () => {
  it('vẽ một đĩa tối và phần sáng; gọi lại thì thay nội dung cũ', () => {
    document.body.innerHTML = '<svg data-moon viewBox="-1.1 -1.1 2.2 2.2"></svg>';
    const svg = document.querySelector('[data-moon]');
    drawMoon(svg, 1);
    drawMoon(svg, 2);
    expect([...svg.children].map((el) => el.getAttribute('class'))).toEqual(['moon-dark', 'moon-lit']);
    expect(svg.querySelector('path').getAttribute('d')).toBe(moonPath(2));
  });
});
