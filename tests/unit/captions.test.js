// @vitest-environment jsdom
// tests/unit/captions.test.js — chữ đi theo vật (GĐ 5): một vùng aria-live phủ lên canvas, mỗi lúc một dòng thơ kèm nguồn, đặt theo điểm neo.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mountCaptions } from '../../src/ui/captions.js';

const KIEU = { lines: ['Trăm năm trong cõi người ta', 'Chữ tài chữ mệnh khéo là ghét nhau'], source: 'Truyện Kiều', author: 'Nguyễn Du' };
const CA_DAO = { lines: ['Công cha như núi Thái Sơn', 'Nghĩa mẹ như nước trong nguồn chảy ra'], source: 'Ca dao' };

let stage;
let captions;
let layout;
beforeEach(() => {
  document.body.innerHTML = '<div data-stage><canvas></canvas></div>';
  stage = document.querySelector('[data-stage]');
  captions = mountCaptions(document, stage);
  // jsdom không tính bố cục (mọi cỡ là 0): giả vùng chữ rộng 640 px (cỡ canvas), mỗi dòng chữ 200 × 60 px.
  layout = {
    room: vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(640),
    width: vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(200),
    height: vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(60),
  };
});
afterEach(() => {
  vi.restoreAllMocks();
});

const region = () => stage.querySelector('[data-captions]');
const caption = () => region().querySelector('.caption');

describe('mountCaptions', () => {
  it('vùng live có aria-live="polite", nằm trong [data-stage] sau canvas, không bao giờ hidden, rỗng lúc đầu', () => {
    const el = region();
    expect(el.classList.contains('captions')).toBe(true);
    expect(el.getAttribute('aria-live')).toBe('polite');
    expect(el.previousElementSibling.tagName).toBe('CANVAS');
    expect(el.hidden).toBe(false);
    expect(el.childElementCount).toBe(0);
    expect(el.textContent).toBe('');
  });

  it('show vẽ từng dòng và nguồn (kèm " · tác giả" khi có), như thơ của lớp trong Sổ tay', () => {
    captions.show(KIEU);
    const p = caption();
    expect(p.tagName).toBe('P');
    expect([...p.querySelectorAll('.caption-line')].map((s) => s.textContent)).toEqual(KIEU.lines);
    const cite = p.querySelector('.caption-cite');
    expect(cite.querySelector('cite').textContent).toBe('Truyện Kiều');
    expect(cite.textContent).toBe('Truyện Kiều · Nguyễn Du');

    captions.show(CA_DAO);
    expect(caption().querySelector('.caption-cite').textContent).toBe('Ca dao'); // không có tác giả: chỉ nguồn
  });

  it('show hiện mờ dần: chốt style khi chữ đã vào trang mà chưa có data-shown, rồi mới gắn data-shown', () => {
    const seen = [];
    const original = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
      if (el.classList?.contains('caption')) seen.push({ attached: el.isConnected, shown: el.hasAttribute('data-shown') });
      return original(el, pseudo);
    });
    captions.show(KIEU);
    expect(seen).toEqual([{ attached: true, shown: false }]);
    expect(caption().hasAttribute('data-shown')).toBe(true);
  });

  it('show lần hai thay dòng cũ: mỗi lúc một dòng', () => {
    captions.show(KIEU);
    captions.show(CA_DAO);
    expect(region().querySelectorAll('.caption')).toHaveLength(1);
    expect(region().textContent).toContain('Công cha như núi Thái Sơn');
    expect(region().textContent).not.toContain('Trăm năm');
  });

  it('place đặt transform (chữ nằm trên điểm neo, căn giữa); ra ngoài khung thì chữ mang data-away, không bao giờ hidden', () => {
    captions.show(KIEU);
    captions.place(120, 80, true);
    expect(caption().style.transform).toBe('translate(120px, 80px) translate(-50%, -100%)');
    expect(caption().hasAttribute('data-away')).toBe(false);
    captions.place(0, 0, false);
    expect(caption().hasAttribute('data-away')).toBe(true);
    // hidden gỡ chữ khỏi cây trợ năng (vào lại khung là đọc lại cả câu) và hủy transition (chữ hiện lại không mờ dần).
    expect(caption().hidden).toBe(false);
    expect(caption().hasAttribute('data-shown')).toBe(true); // vào lại khung thì [data-shown] cho chữ mờ dần hiện ra
    expect(caption().style.transform).toBe('translate(120px, 80px) translate(-50%, -100%)'); // transform cũ để nguyên
    expect(region().hidden).toBe(false);
    expect(region().textContent).toContain('Trăm năm'); // chữ vẫn trong vùng live, chỉ không hiện
    captions.place(300.5, 200.25, true);
    expect(caption().hasAttribute('data-away')).toBe(false);
    expect(caption().hidden).toBe(false);
    expect(caption().style.transform).toBe('translate(300.5px, 200.25px) translate(-50%, -100%)');
  });

  it('place chạy mỗi khung: data-away chỉ được ghi khi đổi, và hidden thì không bao giờ', () => {
    captions.show(KIEU);
    const observer = new MutationObserver(() => {});
    observer.observe(caption(), { attributes: true, attributeFilter: ['data-away', 'hidden'] });
    for (let i = 0; i < 3; i++) captions.place(0, 0, false);
    for (let i = 0; i < 3; i++) captions.place(10, 10, true);
    expect(observer.takeRecords().map((r) => r.attributeName)).toEqual(['data-away', 'data-away']); // ra một lần, vào một lần
    observer.disconnect();
  });

  it('điểm neo sát mép thì chữ dừng ở mép, vẫn ở trên điểm neo (chữ không tràn ra ngoài màn hình); cỡ chữ chỉ đo lúc show', () => {
    captions.show(KIEU); // chữ 200 × 60 px trong vùng rộng 640 px
    const reads = layout.width.mock.calls.length + layout.height.mock.calls.length;
    captions.place(30, 200, true); // sát mép trái: tâm chữ dừng ở nửa bề ngang của chữ
    expect(caption().style.transform).toBe('translate(100px, 200px) translate(-50%, -100%)');
    captions.place(630, 200, true); // sát mép phải
    expect(caption().style.transform).toBe('translate(540px, 200px) translate(-50%, -100%)');
    captions.place(320, 20, true); // sát mép trên: đáy chữ dừng ở đúng chiều cao của chữ, đầu chữ chạm mép
    expect(caption().style.transform).toBe('translate(320px, 60px) translate(-50%, -100%)');
    expect(layout.width.mock.calls.length + layout.height.mock.calls.length).toBe(reads); // place() chạy mỗi khung: không đo chữ lại
    layout.room.mockReturnValue(150); // vùng hẹp hơn chữ (max-width 90vw nên không xảy ra): đặt chữ giữa vùng
    captions.place(30, 200, true);
    expect(caption().style.transform).toBe('translate(75px, 200px) translate(-50%, -100%)');
  });

  it('chữ không xuống dưới chân khung (gợi ý / lời mời, rồi thơ): main.frame vẽ đè lên vùng chữ; chân khung chỉ đo lúc show', () => {
    // Chân khung như index.html: gợi ý ở hàng giữa, rồi footer.foot với thơ, trăng và con dấu. jsdom không tính bố cục: giả khung
    // của từng ô (toạ độ của trang); vùng chữ bắt đầu ở y 20 của trang, nên đáy chữ tính trong vùng là top − 20. Đáy các ô của
    // chân trang thẳng hàng (align-items: flex-end): thơ hai câu thấp hơn con dấu, nên mép trên của chân trang là của con dấu.
    document.body.insertAdjacentHTML('beforeend', '<main class="frame">'
      + '<p class="hint" data-hint aria-live="polite">Bức tranh này có 6 lớp — mài thử?</p>'
      + '<footer class="foot"><figure class="poem"><blockquote data-poem><p>Công cha như núi Thái Sơn</p>'
      + '<p>Nghĩa mẹ như nước trong nguồn chảy ra</p></blockquote><figcaption><cite>Ca dao</cite></figcaption></figure>'
      + '<div class="marks"><svg data-moon viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true"></svg>'
      + '<span class="dau" data-seal>18 tháng Tám · Bính Ngọ</span></div></footer></main>');
    const rect = (top, height) => () => ({ top, height, bottom: top + height, left: 0, right: 640, width: 640, x: 0, y: top });
    const spy = (sel, top, height) => vi.spyOn(document.querySelector(sel), 'getBoundingClientRect').mockImplementation(rect(top, height));
    const hint = spy('[data-hint]', 520, 28);
    const poem = spy('[data-poem]', 574, 70);
    const moon = spy('[data-moon]', 628, 40);
    const seal = spy('[data-seal]', 564, 104);
    vi.spyOn(region(), 'getBoundingClientRect').mockImplementation(rect(20, 800));

    captions.show(KIEU); // chữ 200 × 60 px
    captions.place(320, 700, true); // điểm neo dưới thơ: đáy chữ dừng ở mép trên của lời mời, chữ vẫn ở trên điểm neo
    expect(caption().style.transform).toBe('translate(320px, 500px) translate(-50%, -100%)');
    captions.place(100, 520, true); // vẫn đi theo điểm neo sang ngang
    expect(caption().style.transform).toBe('translate(100px, 500px) translate(-50%, -100%)');
    captions.place(320, 300, true); // điểm neo trên chân khung: chữ đứng ngay trên nó như thường
    expect(caption().style.transform).toBe('translate(320px, 300px) translate(-50%, -100%)');
    // Đo cả bốn ô, mỗi ô một lần; place() chạy mỗi khung: không đo lại.
    expect([hint, poem, moon, seal].map((s) => s.mock.calls.length)).toEqual([1, 1, 1, 1]);

    // Gợi ý trống (thanh lớp đang mở) hay bị gỡ khỏi bố cục (?poster: display none) thì cao 0: không tính. Còn lại chân trang:
    // chân khung là mép trên cao nhất (của con dấu), không phải mép trên của ô gặp đầu tiên trong trang (thơ).
    hint.mockImplementation(rect(0, 0));
    captions.show(CA_DAO);
    captions.place(320, 700, true);
    expect(caption().style.transform).toBe('translate(320px, 544px) translate(-50%, -100%)');

    // Màn quá thấp (chân khung còn cao hơn chính chữ): giữ cả câu trong vùng, dù chữ phải đè lên chân khung.
    seal.mockImplementation(rect(60, 104));
    poem.mockImplementation(rect(70, 70));
    moon.mockImplementation(rect(124, 40));
    captions.show(KIEU);
    captions.place(320, 700, true);
    expect(caption().style.transform).toBe('translate(320px, 60px) translate(-50%, -100%)');
  });

  it('fade gắn data-fading; clear làm rỗng vùng mà vùng vẫn còn; chưa có chữ thì place, fade, clear không làm gì', () => {
    captions.place(10, 10, true);
    captions.fade();
    captions.clear();
    expect(region().childElementCount).toBe(0);
    captions.show(KIEU);
    captions.fade();
    expect(caption().hasAttribute('data-fading')).toBe(true);
    captions.clear();
    expect(region().childElementCount).toBe(0);
    expect(region().isConnected).toBe(true);
    expect(region().hidden).toBe(false);
  });

  it('dispose gỡ vùng khỏi trang', () => {
    captions.show(KIEU);
    captions.dispose();
    expect(region()).toBeNull();
    expect(stage.querySelector('canvas')).not.toBeNull();
  });
});
