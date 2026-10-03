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

/** Mốc → phần vòng quầng đích và số giây bò tới đó (đường cong ease-out: nhanh lúc đầu, chậm dần). */
export const HALO_STEPS = Object.freeze({
  loading: Object.freeze({ to: 0.45, seconds: 6 }),
  chunk: Object.freeze({ to: 0.62, seconds: 3 }),
  compiling: Object.freeze({ to: 0.9, seconds: 4 }),
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
    // Trên trăng, bán kính là 1,04: ngay ngoài đĩa trăng (bán kính 1), nét vẫn nằm trong viewBox ±1,1. Chrome đo pathLength
    // của hình rất nhỏ quá thô (mỗi phần tư vòng thành một dây cung, chu vi 4·r·√2 ≈ 0,9·2πr): vòng r 1,04 không bao giờ
    // khép, lúc rỗng vẫn ló một cung. Vẽ ở toạ độ riêng lớn gấp 100 rồi thu lại thì đo đúng. Nét cũng tính theo toạ độ
    // riêng: shell.css đặt stroke-width 7, trên trăng còn 0,07.
    halo.setAttribute('r', '104');
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
