// paintings/dan-ga-me-con/parts/dan-ga-ke.js — kế hoạch của một gà con: ghép các pha (chờ, chạy, quay tại chỗ, lùi vào, mổ, về nhà, núp) thành chuỗi cho ba việc, về nhà, tới nắm thóc và núp mẹ; vị trí, hướng, đầu nối liền ở mọi mối nối; không import three.
import { FLOCK, endOf, facing, hide, move, peck, rest, stay } from './dan-ga-pha.js';
import { pathLength } from './dan-ga-duong.js';

/**
 * @param {{ homes: { at: [number, number], heading: number }[], hen: [number, number],
 *   speed: { run: number, walk: number } }} o
 * @param {ReturnType<import('./dan-ga-duong.js').createRouter>} router
 */
export function createPlanner({ homes, hen, speed }, router) {
  /**
   * Các pha của một chuyến đi, tốc độ trung bình v, theo hành trình jy (dan-ga-duong.js#journey) từ trạng thái `from`. Đi ra khỏi chỗ sát
   * mẹ rồi chạy là MỘT chuyến (xuất phát êm: tăng tốc từ từ chứ không vọt ra). Chỗ đến sát mẹ thì dừng ở điểm dừng ngoài vòng cấm, quay hẳn
   * sang `face` ngay đó (mỏ quét ở xa mẹ) rồi lùi vào, mặt vẫn hướng ra ngoài: không bao giờ tới chỗ núp mà mặt hướng vào mẹ.
   */
  function trip(jy, t, from, goal, face, v) {
    const phases = [];
    let now = from;
    let at = t;
    const add = (ph) => {
      phases.push(ph);
      now = endOf(ph);
      at = ph.t1;
    };
    const go = (pts, v, keep = null) => {
      if (pathLength(pts) > 1e-6) add(move(pts, at, v, now, goal, keep));
    };
    go(jy.lead ? [...jy.lead, ...jy.run.slice(1)] : jy.run, v);
    if (jy.tuck) {
      add(stay(now, at, at + FLOCK.turn, goal, face));
      go(jy.tuck, speed.walk, face);
    }
    return { phases, end: now, t1: at };
  }
  /** Đi bộ về nhà rồi nghỉ, lượn quanh nhà. */
  function homeward(i, from, t) {
    const home = homes[i].at;
    const tr = trip(router.journey(from.at, home), t, from, 'home', homes[i].heading, speed.walk);
    return [...tr.phases, rest(home, tr.t1, tr.end, homes[i].heading)];
  }
  /**
   * Phản xạ, chạy tới chỗ đứng `spot` quanh nắm thóc `look` theo hành trình jy, mổ FLOCK.peck giây nhìn về nắm, rồi về nhà. `already`: đang
   * đứng ở chỗ đó (nhúm lúc mở trang): vẫn chờ phản xạ, để các con bắt đầu mổ lệch nhịp nhau, không cúi đầu cùng lúc như máy.
   */
  function forage(i, from, t, jy, spot, look, rand, already) {
    const react = FLOCK.react[0] + rand() * (FLOCK.react[1] - FLOCK.react[0]);
    const wait = stay(from, t, t + react, 'food');
    const phases = [wait];
    let now = endOf(wait);
    let at = wait.t1;
    if (!already) {
      const tr = trip(jy, at, now, 'food', facing(spot, look), speed.run);
      phases.push(...tr.phases);
      now = tr.end;
      at = tr.t1;
    }
    const eat = peck(spot, at, now, rand, look);
    return [...phases, eat, ...homeward(i, endOf(eat), eat.t1)];
  }
  /** Chạy về chỗ núp (sau 0,1 s), rồi đứng quay ra ngoài, lưng về phía mẹ, đầu ngó nghiêng (FLOCK.peek). */
  function shelter(from, t, slot, jy) {
    const out = facing(hen, slot);
    const wait = stay(from, t, t + 0.1, 'hide');
    const tr = trip(jy, wait.t1, endOf(wait), 'hide', out, speed.run);
    return [wait, ...tr.phases, hide(slot, tr.t1, tr.end, out)];
  }
  return { homeward, forage, shelter };
}
