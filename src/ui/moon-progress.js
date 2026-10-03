// ui/moon-progress.js — quầng trăng tiến độ: vòng quầng mảnh quanh trăng SVG nhích theo mốc tải phần 3D; chỉ DOM + CSS transition.

const NS = 'http://www.w3.org/2000/svg';
/**
 * Ease-out dài: phần lớn quãng đi trong mấy giây đầu, phần đuôi chậm dần. Hết số giây của một mốc mà mốc sau chưa tới
 * thì quầng đứng yên ở đích của mốc đó, nên số giây phải đủ dài cho mạng chậm (kiểm bằng Slow 4G, spec §12).
 */
const EASE_OUT = 'cubic-bezier(0.15, 0.6, 0.25, 1)';
/**
 * Canvas hòa dần trong 900 ms (shell.css, `[data-stage] canvas`; tests/unit/shell-css.test.js giữ hai số khớp nhau):
 * ở 'fading' quầng đầy rồi tan hết trong đúng quãng đó. ui/shell.js tính lưới an toàn của crossfade() từ số này.
 */
export const CROSSFADE_MS = 900;

/**
 * Mốc → phần vòng quầng đích và số giây bò tới đó (đường cong ease-out: nhanh lúc đầu, chậm dần; đi được 90% đường sau
 * nửa số giây). Số giây chốt theo thời gian đo được của từng chặng (GĐ 5, Mac M2 có GPU thật, rồi SwiftShader thay cho máy
 * yếu), tính từ mốc này tới mốc sau:
 *
 *   chặng (ms)                    M2 ấm   M2 lạnh   Fast 4G   Slow 4G   WebGPU SwiftShader   WebGL2 SwiftShader
 *   loading → chunk             24 – 45   30 – 60       700      3390                   30              35 – 60
 *   chunk → compiling           33 – 44        45       265       820          1840 – 1950          1320 – 1360
 *   compiling: compileAsync   137 – 154       155       150       160            840 – 910            360 – 390
 *   khung ẩn, rồi 'fading'    115 – 127       125       125       130                  135                  940
 *
 * ("ấm": trình duyệt đã có cache, mở lại trong cùng tab hay ở tab mới; "lạnh": trình duyệt mới, không cache;
 * SwiftShader đo ở lần mở trang đầu của trình duyệt. Fast/Slow 4G: hai mức giả lập mạng của DevTools, trên M2.) Trang
 * thật lần đầu sau deploy (CDN chưa có file) mất 9,2 giây, gần hết ở chặng đầu. Nên chặng đầu bò lâu bằng hạn 10 giây
 * của boot (BOOT_DEADLINE_MS của engine/boot.js; tests/unit/boot.test.js giữ hai số khớp nhau), để quầng không đứng hẳn
 * trước lúc quá hạn. Có điều ease-out dồn quãng vào nửa đầu: từ giây thứ 7 tới lúc rơi về tranh tĩnh, quầng chỉ nhích
 * thêm chừng 0,012 vòng (1,5px trên trăng 40px), mắt gần như không thấy. 'chunk' bò 4 giây và 'compiling' bò 3 giây,
 * gấp 2 và 3,3 lần chặng chậm nhất đo được, nên mốc sau tới khi quầng còn đang bò. Máy nhanh thì cả vòng chạy chưa tới
 * một giây.
 *
 * Số giây chỉ có tác dụng khi trình duyệt còn vẽ khung. Transition của stroke-dashoffset tính trên luồng chính
 * (compositor chỉ chạy hộ vài thuộc tính như opacity, transform): luồng chính bận thì quầng đứng yên, rảnh ra mới nhảy
 * tới chỗ đáng lẽ đã tới. Quầng bò khi trang chỉ đang chờ: chờ mạng (loading, chunk), chờ GPU (xin adapter WebGPU,
 * compileAsync). Nó đứng yên trong việc đồng bộ. Máy nào cũng có hai việc như vậy: dựng cảnh (40–60 ms, trên M2 cũng
 * như SwiftShader) và khung ẩn (dòng cuối của bảng). WebGL2 còn tạo context ngay sau 'chunk': trên WebGL2
 * SwiftShader getContext chặn 1,25 giây, quầng nằm gần 0 (0,003 – 0,012) rồi nhảy lên gần nửa vòng (0,475 – 0,486).
 * Mốc 'chunk' được đặt trong cùng tác vụ đó, và transition của nó lấy giờ bắt đầu từ khung trước lúc chặn, nên khung đầu
 * tiên sau đó coi như nó đã bò 1,25 trong 4 giây: 31% thời gian là 77% quãng theo đường ease-out, 0,01 + 0,61 · 0,77 ≈ 0,48.
 * Rồi compileAsync chặn chừng 0,2 giây và khung ẩn chừng 0,95 giây: quầng đứng ở chừng 0,59 gần 1,2 giây trước 'fading'.
 * Trên WebGPU SwiftShader, lúc xin adapter (1,8 giây) luồng chính rảnh mà khung vẫn thưa, có khi cách nhau 0,4 giây:
 * quầng đi giật. Cũng vì vậy mà không có mốc nào giữa compileAsync và 'fading': run.js vẽ khung ẩn rồi đặt 'fading' liền
 * trong một tác vụ, nên một đích đặt trước khung ẩn bị 'fading' thay trước khi trình duyệt kịp vẽ khung nào.
 */
export const HALO_STEPS = Object.freeze({
  loading: Object.freeze({ to: 0.45, seconds: 10 }),
  chunk: Object.freeze({ to: 0.62, seconds: 4 }),
  compiling: Object.freeze({ to: 0.9, seconds: 3 }),
  fading: Object.freeze({ to: 1, seconds: 0.3 }),
});

/**
 * Gắn quầng tiến độ vào trăng (spec §8.5). Quầng là một <circle pathLength="1"> có stroke-dasharray `1 2` (shell.css
 * nói vì sao), nên stroke-dashoffset = 1 − phần vòng. JS chỉ đặt dashoffset đích kèm transition inline; không có vòng
 * requestAnimationFrame nào. Mốc tới giữa chừng thì trình duyệt cho transition mới đi tiếp từ chỗ đang đứng. Người xem
 * xin giảm chuyển động: shell.css bỏ transition bằng !important (thắng style inline), quầng nhảy thẳng tới từng mốc.
 *
 * `step` nhận mọi trạng thái của vỏ trang cùng mốc 'chunk' (không phải trạng thái). Chỉ 'loading' vẽ
 * vòng mới (spec §4.1: quầng hiện từ `loading`; "Dựng lại cảnh" cũng đi lại từ đó), nên phần 3D đến muộn báo mốc sau
 * khi trang đã về tĩnh thì không vẽ lại quầng. Tên khác trong HALO_STEPS cho vòng đang có bò tới đích; ở 'fading' vòng
 * đầy rồi tan cùng lúc canvas hòa dần. 'live' (lúc đó quầng đã tan hết), 'static' và 'lost' gỡ quầng; 'poster',
 * 'detecting'… thì bỏ qua.
 *
 * Gắn sau drawMoon, một lần cho mỗi svg. drawMoon vẽ lại thì thay hẳn nội dung svg, gỡ luôn quầng: `step` nhìn chính
 * vòng (còn trên trang không), nên các mốc sau bỏ qua và 'loading' kế tiếp vẽ vòng mới.
 * @param {SVGSVGElement} svg  <svg data-moon> đã có trăng (drawMoon)
 * @returns {{ step: (name: string) => void, dispose: () => void }}  dispose gỡ quầng và thôi nhận mốc (không dùng lại được)
 */
export function createMoonProgress(svg) {
  const doc = svg.ownerDocument;
  let halo = null; // <circle class="moon-halo">; null trước 'loading' và sau khi gỡ (drawMoon vẽ lại thì nó rời trang)
  let target = 0; // phần vòng mà vòng đang có bò tới; chỉ đọc khi vòng còn trên trang
  let disposed = false;

  const remove = () => {
    halo?.remove();
    halo = null;
  };

  /**
   * Vòng rỗng mới, vẽ trên trăng. Đọc style ngay sau khi gắn để trình duyệt "chốt" dashoffset 1: không có bước
   * này, tạo vòng và đặt đích rơi vào cùng một lần tính style, và mốc đầu tiên nhảy thẳng thay vì bò.
   */
  const restart = () => {
    remove();
    halo = doc.createElementNS(NS, 'circle');
    halo.setAttribute('class', 'moon-halo');
    // Trên trăng, bán kính là 1,05 và nét dày 0,09: mép trong 1,005 ngay ngoài đĩa trăng (bán kính 1), mép ngoài 1,095 vẫn
    // trong viewBox ±1,1. Chrome đo pathLength của hình rất nhỏ quá thô (mỗi phần tư vòng thành một dây cung, chu vi
    // 4·r·√2 ≈ 0,9·2πr): vòng r 1,05 không bao giờ khép, lúc rỗng vẫn ló một cung. Vẽ ở toạ độ riêng lớn gấp 100 rồi thu
    // lại thì đo đúng. Nét cũng tính theo toạ độ riêng: shell.css đặt stroke-width 9, trên trăng còn 0,09.
    halo.setAttribute('r', '105');
    halo.setAttribute('pathLength', '1');
    // Vòng tròn SVG bắt đầu ở 3 giờ: xoay để nét mọc từ đỉnh, theo chiều kim đồng hồ; scale thu toạ độ riêng về lại.
    halo.setAttribute('transform', 'rotate(-90) scale(0.01)');
    halo.style.strokeDashoffset = '1';
    svg.append(halo);
    void doc.defaultView?.getComputedStyle(halo).strokeDashoffset;
  };

  /** @param {string} name  trạng thái của vỏ trang, hoặc mốc 'chunk' */
  function step(name) {
    if (disposed) return;
    // Object.hasOwn là ES2022 (Safari 15.4, Chrome 93): đường nhẹ phải chạy cả trên máy cũ hơn, chính là máy cần tầng tĩnh.
    if (Object.prototype.hasOwnProperty.call(HALO_STEPS, name)) {
      const { to, seconds } = HALO_STEPS[name];
      if (!halo?.isConnected) {
        // Không còn vòng trên trang (chưa tới 'loading', đã gỡ, hay drawMoon vẽ lại): chỉ 'loading' vẽ vòng mới.
        if (name !== 'loading') return;
        restart();
      } else if (to < target) {
        return; // mốc tới muộn: vòng không bao giờ lùi
      }
      target = to;
      let transition = `stroke-dashoffset ${seconds}s ${EASE_OUT}`;
      if (name === 'fading') {
        // Đầy trong `seconds` đầu rồi tan trong phần còn lại của lúc canvas hòa dần (run.js đặt 'fading' rồi gọi
        // crossfade() ngay): quầng và poster cùng đi hết một lúc. Chặn dưới ở 0: một thời lượng âm làm trình duyệt
        // bỏ cả khai báo transition, quầng không bò cũng không tan.
        const fill = Math.round(seconds * 1000);
        transition += `, opacity ${Math.max(0, CROSSFADE_MS - fill)}ms ease-out ${fill}ms`;
        halo.style.opacity = '0';
      }
      halo.style.transition = transition;
      halo.style.strokeDashoffset = (1 - to).toFixed(4);
    } else if (name === 'live' || name === 'static' || name === 'lost') {
      // 'live' chỉ tới khi crossfade() xong, nên quầng đã tan hết: gỡ hẳn khỏi trang (giảm chuyển động thì không có
      // transition nào để chờ). 'static', 'lost': poster phủ lại màn hình, quầng biến mất ngay, không tan.
      remove();
    }
  }

  function dispose() {
    disposed = true;
    remove();
  }

  return { step, dispose };
}
