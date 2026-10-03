// @vitest-environment jsdom
// tests/unit/moon-progress.test.js — quầng trăng tiến độ: vòng quầng trong <svg data-moon> nhích theo mốc tải, đầy rồi tan lúc hòa dần, gỡ khi live hay về tĩnh.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMoonProgress } from '../../src/ui/moon-progress.js';
import { drawMoon } from '../../src/ui/moon-svg.js';

let svg;
let progress;
beforeEach(() => {
  document.body.innerHTML = '<svg data-moon viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true"></svg>';
  svg = document.querySelector('[data-moon]');
  drawMoon(svg, 2);
  progress = createMoonProgress(svg);
});
afterEach(() => {
  vi.restoreAllMocks();
});

const halo = () => svg.querySelector('.moon-halo');
/** stroke-dashoffset ĐÍCH (style inline) của quầng: 1 là vòng rỗng, 0 là vòng đầy; transition CSS bò tới đó. */
const offset = () => Number(halo().style.strokeDashoffset);

/**
 * Ghi dashoffset của quầng mỗi lần style bị buộc tính lại (getComputedStyle): đó là giá trị trình duyệt "chốt"
 * trước khi đổi. Thiếu bước chốt, tạo vòng và đặt đích rơi vào cùng một lần tính style, nên không có transition.
 */
function watchFlush() {
  const seen = [];
  const original = window.getComputedStyle.bind(window);
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
    if (el.classList?.contains('moon-halo')) seen.push(el.style.strokeDashoffset);
    return original(el, pseudo);
  });
  return seen;
}

describe('createMoonProgress', () => {
  it("chưa tới 'loading' ('poster', 'detecting') thì không có quầng", () => {
    progress.step('poster');
    progress.step('detecting');
    expect(halo()).toBeNull();
    expect(svg.childElementCount).toBe(2); // chỉ có trăng: đĩa tối + phần sáng
  });

  it("'loading' tạo vòng có pathLength 1, dashoffset đích 0,55 và transition 10s (bằng hạn 10 giây của boot)", () => {
    const flushed = watchFlush();
    progress.step('loading');
    const ring = halo();
    expect(ring.getAttribute('pathLength')).toBe('1');
    // Bán kính 1,05 trên trăng, vẽ ở toạ độ riêng gấp 100 rồi thu lại (ui/moon-progress.js nói vì sao).
    expect(ring.getAttribute('r')).toBe('105');
    expect(ring.getAttribute('transform')).toBe('rotate(-90) scale(0.01)'); // nét bắt đầu ở đỉnh, đi theo chiều kim đồng hồ
    expect(svg.lastElementChild).toBe(ring); // vẽ sau trăng, nằm trên cùng
    // Vòng mới được chốt ở trạng thái rỗng TRƯỚC khi đặt đích, nên mốc đầu tiên cũng bò chứ không nhảy.
    expect(flushed).toEqual(['1']);
    expect(offset()).toBeCloseTo(0.55, 4);
    expect(ring.style.transition).toBe('stroke-dashoffset 10s cubic-bezier(0.15, 0.6, 0.25, 1)');
  });

  it('các mốc sau đi tiếp đúng đích: chunk 0,38 → compiling 0,1 → fading 0', () => {
    progress.step('loading');
    const ring = halo();
    for (const [name, target, seconds] of [['chunk', 0.38, 4], ['compiling', 0.1, 3], ['fading', 0, 0.3]]) {
      progress.step(name);
      expect(halo(), name).toBe(ring); // vẫn vòng cũ: transition mới đi tiếp từ chỗ đang đứng
      expect(offset(), name).toBeCloseTo(target, 4);
      expect(ring.style.transition, name).toMatch(new RegExp(`^stroke-dashoffset ${seconds}s `));
    }
  });

  it("mốc tới muộn không kéo vòng lùi ('chunk' sau 'compiling' giữ đích của compiling)", () => {
    progress.step('loading');
    progress.step('compiling');
    progress.step('chunk');
    expect(offset()).toBeCloseTo(0.1, 4);
    expect(halo().style.transition).toMatch(/^stroke-dashoffset 3s /); // transition của compiling không bị thay
  });

  it("'fading' làm quầng đầy rồi tan cùng lúc hòa dần; 'live' gỡ quầng; 'loading' sau đó vẽ lại từ vòng rỗng", () => {
    for (const name of ['loading', 'chunk', 'compiling']) progress.step(name);
    const ring = halo();
    progress.step('fading');
    expect(halo()).toBe(ring);
    expect(offset()).toBe(0); // vòng đầy…
    expect(ring.style.opacity).toBe('0'); // …và tan ngay trong lúc canvas hòa dần, không đợi tới 'live'
    // Đầy trong 0,3 giây rồi tan 600 ms: hết đúng 900 ms, cùng lúc canvas hòa dần xong (shell.css).
    expect(ring.style.transition).toBe('stroke-dashoffset 0.3s cubic-bezier(0.15, 0.6, 0.25, 1), opacity 600ms ease-out 300ms');

    progress.step('live'); // crossfade() chỉ xong sau 900 ms hòa dần: quầng đã tan hết, gỡ hẳn khỏi trang
    expect(halo()).toBeNull();

    const flushed = watchFlush();
    progress.step('loading');
    expect(svg.querySelectorAll('.moon-halo')).toHaveLength(1);
    expect(flushed).toEqual(['1']);
    expect(offset()).toBeCloseTo(0.55, 4);
    expect(halo().style.opacity).toBe(''); // vòng mới, hiện rõ
  });

  it("'static' và 'lost' gỡ quầng ngay; 'loading' sau đó vẽ lại từ vòng rỗng", () => {
    for (const name of ['static', 'lost']) {
      progress.step('loading');
      progress.step('compiling');
      progress.step(name);
      expect(halo(), name).toBeNull();
    }
    // "Dựng lại cảnh" đi lại từ 'loading': vòng mới không còn nhớ đích 0,9 của lần dựng trước.
    const flushed = watchFlush();
    progress.step('loading');
    expect(flushed).toEqual(['1']);
    expect(offset()).toBeCloseTo(0.55, 4);
  });

  it("chỉ 'loading' vẽ vòng mới: mốc đến muộn sau khi quầng đã gỡ không vẽ lại", () => {
    progress.step('chunk'); // chưa tới 'loading'
    expect(halo()).toBeNull();
    progress.step('loading');
    progress.step('static');
    // "Dựng lại cảnh" quá hạn: trang đã về tĩnh mà phần 3D đến muộn vẫn báo tiếp. Quầng kẹt ở 90% trên tranh tĩnh là sai.
    for (const name of ['compiling', 'fading']) {
      progress.step(name);
      expect(halo(), name).toBeNull();
    }
  });

  it("svg bị thay nội dung giữa lúc tải (drawMoon vẽ lại): mốc sau không vẽ lại quầng, 'loading' vẽ vòng mới từ vòng rỗng", () => {
    progress.step('loading');
    svg.replaceChildren(); // như drawMoon vẽ lại: thay hẳn nội dung svg, gỡ luôn quầng
    expect(() => progress.step('chunk')).not.toThrow();
    expect(halo()).toBeNull(); // chỉ 'loading' vẽ vòng mới
    // 'chunk' không ghi đích vào vòng đã rời trang, nên 'loading' sau đó không bị coi là mốc tới muộn.
    const flushed = watchFlush();
    progress.step('loading');
    expect(halo()).not.toBeNull();
    expect(flushed).toEqual(['1']); // vòng mới chốt ở trạng thái rỗng rồi mới bò
    expect(offset()).toBeCloseTo(0.55, 4);
  });

  it("dispose gỡ quầng và thôi nhận mốc: kể cả 'loading' về sau cũng không vẽ lại", () => {
    progress.step('loading');
    progress.dispose();
    expect(halo()).toBeNull();
    progress.step('loading');
    expect(halo()).toBeNull();
  });
});
