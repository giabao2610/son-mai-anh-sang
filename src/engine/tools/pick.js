// engine/tools/pick.js — chọn một view theo chỉ số bằng chuỗi If/ElseIf trong Fn (hai công cụ học dùng chung).
import { If } from 'three/tsl';

/**
 * Gán `into` = view thứ `index` (1 → ids[0], 2 → ids[1]…); `index` là uniform, nên đổi view chỉ đổi số, không biên dịch
 * lại. Viết bằng If/ElseIf (không dùng select()): mỗi điểm ảnh chỉ đọc texture của đúng một nhánh (spec Phụ lục A.6).
 * Gọi BÊN TRONG một Fn; `into` là biến đã .toVar().
 * @param {any} index   uniform số (0 thì không gán gì)
 * @param {string[]} ids
 * @param {(id: string) => any} view   node ở không gian hiển thị của một view (views.js)
 * @param {any} into
 */
export function pickView(index, ids, view, into) {
  ids.reduce((chain, id, i) => {
    // Thân nhánh không được trả giá trị: If trong một Fn gọi ngay (inline) mà có return thì three cảnh báo.
    const take = () => {
      into.assign(view(id).rgb);
    };
    return chain ? chain.ElseIf(index.equal(i + 1), take) : If(index.equal(i + 1), take);
  }, null);
}
