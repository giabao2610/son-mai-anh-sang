// @vitest-environment jsdom
// tests/unit/badge.test.js — huy hiệu tầng: chữ, data-backend, lời giải thích
import { describe, it, expect, beforeEach } from 'vitest';
import { renderBadge } from '../../src/ui/badge.js';
import t from '../../src/ui/strings.vi.js';

describe('renderBadge', () => {
  let el;
  beforeEach(() => {
    document.body.innerHTML = '<button data-badge hidden type="button"></button>';
    el = document.querySelector('[data-badge]');
  });

  it('webgl2 + vừa: chữ, data-backend, title, aria-label, hiện ra', () => {
    renderBadge(el, { tier: 'webgl2', level: 'vua' }, t);
    expect(el.textContent).toBe('WebGL2 · vừa');
    expect(el.dataset.backend).toBe('webgl2');
    expect(el.title).toBe(t.badge.explain.webgl2);
    expect(el.getAttribute('aria-label')).toContain('WebGL2 · vừa');
    expect(el.getAttribute('aria-label')).toContain(t.badge.explain.webgl2);
    expect(el.hidden).toBe(false);
  });

  it('tầng tĩnh không có mức: chỉ "Tranh tĩnh"', () => {
    renderBadge(el, { tier: 'static' }, t);
    expect(el.textContent).toBe('Tranh tĩnh');
    expect(el.dataset.backend).toBe('static');
    expect(el.title).toBe(t.badge.explain.static);
  });

  it('bộ điều chỉnh đang hạ nấc: ghi thêm "hạ n nấc", data-steps, lời giải thích nói vì sao', () => {
    renderBadge(el, { tier: 'webgpu', level: 'cao', steps: 2 }, t);
    expect(el.textContent).toBe('WebGPU · cao · hạ 2 nấc');
    expect(el.dataset.steps).toBe('2');
    expect(el.title).toBe(`${t.badge.explain.webgpu} ${t.badge.stepsExplain(2)}`);
    renderBadge(el, { tier: 'webgpu', level: 'cao', steps: 0 }, t);
    expect(el.textContent).toBe('WebGPU · cao');
    expect(el.dataset.steps).toBe('0');
    expect(el.title).toBe(t.badge.explain.webgpu);
  });

  it('có nấc bị khóa chống dao động (GĐ 4): lời giải thích nói thật là nấc đó giữ tới khi tải lại trang, không hứa chi tiết trở lại', () => {
    renderBadge(el, { tier: 'webgpu', level: 'cao', steps: 3, locked: 1 }, t);
    expect(el.textContent).toBe('WebGPU · cao · hạ 3 nấc');
    expect(el.dataset.locked).toBe('1');
    expect(el.title).toBe(`${t.badge.explain.webgpu} ${t.badge.lockedExplain(3, 1)}`);
    expect(el.title).not.toContain(t.badge.stepsExplain(3));
    // Hết nấc đang hạ (trả lại hết khi nhịp bị khóa) thì không còn gì để nói về khóa.
    renderBadge(el, { tier: 'webgpu', level: 'cao', steps: 0, locked: 1 }, t);
    expect(el.title).toBe(t.badge.explain.webgpu);
    expect(el.dataset.locked).toBe('0');
  });

  it('vẽ lại thì thay hẳn chữ cũ, không cộng dồn', () => {
    renderBadge(el, { tier: 'webgpu', level: 'cao' }, t);
    expect(el.textContent).toBe('WebGPU · cao');
    renderBadge(el, { tier: 'static' }, t);
    expect(el.textContent).toBe('Tranh tĩnh');
    expect(el.dataset.backend).toBe('static');
  });
});
