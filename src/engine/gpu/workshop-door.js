// engine/gpu/workshop-door.js — cửa vào xưởng của một bức: mở/đóng thanh lớp, lời mời, gợi ý; trang mở bằng link có công thức thì mở sẵn xưởng.
import { mountWorkshop } from '../../ui/workshop.js';

/**
 * Tách từ run.js (GĐ 9). Xưởng (thanh lớp + Sổ tay) tạo MỘT lần, sống qua các lần "Dựng lại cảnh"; cánh cửa đọc cảnh hiện tại
 * qua getStudio / getQuality (run.js đổi chúng mỗi lần dựng).
 * @param {object} p
 * @param {Window} p.win
 * @param {import('../contracts/painting.js').PaintingMeta} p.meta
 * @param {Record<string, any>} p.t
 * @param {object} p.shell   vỏ trang: invite, showHint, clearHint
 * @param {() => object | null} p.getContent   chữ của bức (tải xong sau khi cửa được tạo)
 * @param {() => any} p.getStudio   bàn thợ của cảnh đang live (null khi chưa live)
 * @param {() => any} p.getQuality   bộ điều chỉnh của cảnh đang live
 */
export function createWorkshopDoor({ win, meta, t, shell, getContent, getStudio, getQuality }) {
  let workshop = null;

  // Lời mời "{n} lớp — mài thử?" là nút vào chế độ mài; đóng thanh lớp thì lời mời quay lại (mở lại lúc nào cũng được).
  // Thanh lớp mở = người xem đang học, có khi cố ý làm chậm cảnh: bộ điều chỉnh chỉ canh quá tải nặng tới khi đóng.
  const onClose = () => {
    getQuality()?.guard(false);
    shell.invite(open);
  };
  /** Không tham số (lời mời gọi như vậy) = vào chế độ mài. */
  function open(options = { grind: true }) {
    workshop ??= mountWorkshop(win.document, { meta, content: getContent(), t, studio: getStudio, onClose });
    // Mở theo công thức (lúc live, hay người xem dán link khác): gợi ý và lời mời đang hiện không còn đúng chỗ; bấm lời mời cũ là mài hết, xóa công thức vừa áp.
    if (options.recipe) shell.clearHint();
    workshop.open(options);
    getQuality()?.guard(true);
  }

  return {
    open,
    /**
     * Việc sau khi cảnh live. rebuilt: đây là "Dựng lại cảnh" (không gợi ý lại, không mở xưởng theo link nữa).
     * @param {{ input: { onFirst: (cb: () => void) => void }, rebuilt: boolean }} p
     */
    afterLive({ input, rebuilt }) {
      // GĐ 9: trang mở bằng link có công thức (spec §21.2): thanh lớp mở sẵn, không mài, có dòng tóm tắt; không gợi ý, không lời mời.
      if (!rebuilt && getStudio()?.recipe().text) {
        open({ grind: false, recipe: true });
        return;
      }
      // Gợi ý của bức ("Chạm vào…") chỉ lúc mở trang; lần chạm đầu tiên đổi thành lời mời mài lớp.
      const content = getContent();
      if (!rebuilt && content?.hint) shell.showHint(content.hint);
      // Chạm đầu tiên: chỉ mời khi thanh lớp đang đóng (người xem có thể đã mở nó bằng link công thức).
      if (!workshop) input.onFirst(() => { if (!workshop?.isOpen) shell.invite(open); });
      // Dựng lại cảnh xong mà thanh lớp đang đóng: poster lúc mất GPU đã xóa lời mời, nên mời lại ngay.
      else if (!workshop.isOpen) shell.invite(open);
    },
    get isOpen() {
      return Boolean(workshop?.isOpen);
    },
    dispose() {
      workshop?.dispose();
    },
  };
}
