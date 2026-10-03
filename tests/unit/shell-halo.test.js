// @vitest-environment jsdom
// tests/unit/shell-halo.test.js — vỏ trang nối quầng trăng tiến độ (GĐ 5): setState và progress(mốc) cho quầng trong [data-moon] nhích; trang không có trăng thì thôi.
import { describe, it, expect, beforeEach } from 'vitest';
import { mountShell } from '../../src/ui/shell.js';
import { HALO_STEPS } from '../../src/ui/moon-progress.js';
import t from '../../src/ui/strings.vi.js';
import { mountPage } from '../helpers/page.js';

const meta = { slug: 'thu', title: 'Tranh thử', layers: [{ id: 'cot' }, { id: 'phu-bong' }, { id: 'lop-ba' }] };
const NOW = new Date('2026-09-28T21:00:00+07:00');

let page;
beforeEach(() => {
  page = mountPage(document);
});

const halo = () => page.moon.querySelector('.moon-halo');
const offset = () => Number(halo().style.strokeDashoffset);

describe('vỏ trang · quầng trăng tiến độ (GĐ 5)', () => {
  it("setState('loading') vẽ quầng trong [data-moon]; progress('chunk') cho quầng đi tiếp; về tĩnh thì gỡ", () => {
    const shell = mountShell(document, meta, { now: NOW, t });
    shell.setState('detecting');
    expect(halo()).toBeNull();
    shell.setState('loading');
    expect(offset()).toBeCloseTo(1 - HALO_STEPS.loading.to, 4);
    shell.progress('chunk');
    expect(offset()).toBeCloseTo(1 - HALO_STEPS.chunk.to, 4);
    expect(document.body.dataset.state).toBe('loading'); // mốc không phải trạng thái
    shell.setState('static');
    expect(halo()).toBeNull();
  });

  it('trang không có [data-moon] thì progress không làm gì (không ném)', () => {
    page.moon.remove();
    const shell = mountShell(document, meta, { now: NOW, t });
    expect(() => {
      shell.setState('loading');
      shell.progress('chunk');
    }).not.toThrow();
    expect(document.querySelector('.moon-halo')).toBeNull();
  });
});
