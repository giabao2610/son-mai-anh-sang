// engine/tools/pick.js — chọn một view theo chỉ số bằng chuỗi If/ElseIf trong Fn (hai công cụ học dùng chung).
import { If, isolate } from 'three/tsl';

/**
 * Gán `into` = view thứ `index` (1 → ids[0], 2 → ids[1]…); `index` là uniform, nên đổi view chỉ đổi số, không biên dịch
 * lại. Viết bằng If/ElseIf (không dùng select()): mỗi điểm ảnh chỉ đọc texture của đúng một nhánh (spec Phụ lục A.6).
 * Mỗi view bọc trong isolate() KHÔNG có cache cha (GĐ 8, Phụ lục A.95): nhiều view chứa cùng một texture (màu của scene pass nằm
 * trong mọi tap), mà three r186 dựng thân của mỗi nhánh thêm một lần ở cache cha, nên biến texture gán ở nhánh đầu bị nhánh sau đọc
 * lại khi chưa gán: ảnh đen. Không có cache cha thì nhánh nào cũng tự đọc texture của nó; thuộc tính, varying, uniform vẫn dùng chung
 * (cache toàn cục).
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
      into.assign(isolate(view(id)).setParent(false).rgb);
    };
    return chain ? chain.ElseIf(index.equal(i + 1), take) : If(index.equal(i + 1), take);
  }, null);
}
