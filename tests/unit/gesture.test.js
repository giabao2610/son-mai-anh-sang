// tests/unit/gesture.test.js — phân loại cử chỉ: chạm, chạm hai lần, giữ, vuốt, kéo (của camera), hai ngón.
import { describe, it, expect } from 'vitest';
import { GESTURE, createGestureTracker } from '../../src/engine/gpu/gesture.js';

const p = (x, y, t, id = 1) => ({ id, x, y, t });
const kinds = (events) => events.map((e) => e.kind);

describe('createGestureTracker', () => {
  it('chạm: xuống rồi lên nhanh, gần như không lệch → tap tại điểm chạm xuống', () => {
    const g = createGestureTracker();
    expect(g.down(p(100, 100, 0))).toEqual([]);
    expect(g.move(p(103, 102, 50))).toEqual([]);
    expect(g.up(p(103, 102, 120))).toEqual([{ kind: 'tap', x: 100, y: 100 }]);
    expect(g.state).toBe('idle');
  });

  it('giữ: đủ holdMs mà chưa lệch → hold-start; di → hold-move; thả → hold-end', () => {
    const g = createGestureTracker();
    g.down(p(10, 10, 0));
    expect(g.poll(GESTURE.holdMs - 1)).toEqual([]);
    expect(g.poll(GESTURE.holdMs)).toEqual([{ kind: 'hold-start', x: 10, y: 10 }]);
    expect(g.poll(GESTURE.holdMs + 100)).toEqual([]); // chỉ bắt đầu một lần
    expect(g.move(p(40, 60, 500))).toEqual([{ kind: 'hold-move', x: 40, y: 60 }]);
    expect(g.up(p(40, 60, 700))).toEqual([{ kind: 'hold-end', x: 40, y: 60 }]);
  });

  it('thả tay sau holdMs mà chưa kịp poll (máy bận): vẫn là một lần giữ, không phải chạm', () => {
    const g = createGestureTracker();
    g.down(p(10, 10, 0));
    expect(g.up(p(12, 10, GESTURE.holdMs + 50))).toEqual([
      { kind: 'hold-start', x: 10, y: 10 },
      { kind: 'hold-end', x: 12, y: 10 },
    ]);
    expect(g.state).toBe('idle');
  });

  it('kéo (lệch quá tapPx) là của camera: không phát cử chỉ nào, cũng không thành giữ', () => {
    const g = createGestureTracker();
    g.down(p(0, 0, 0));
    expect(g.move(p(GESTURE.tapPx + 1, 0, 100))).toEqual([]);
    expect(g.state).toBe('drag');
    expect(g.poll(1000)).toEqual([]);
    expect(g.up(p(200, 0, 1500))).toEqual([]);
  });

  it('vuốt: kéo nhanh và đủ xa → swipe kèm vận tốc (px/giây)', () => {
    const g = createGestureTracker();
    g.down(p(0, 0, 0));
    g.move(p(30, 0, 50));
    const [swipe] = g.up(p(100, -50, 200));
    expect(swipe).toEqual({ kind: 'swipe', x: 100, y: -50, velocity: { x: 500, y: -250 } });
  });

  it('ngón thứ hai chạm xuống (chụm để zoom) thì hủy; đang giữ thì kết thúc giữ', () => {
    const g = createGestureTracker();
    g.down(p(0, 0, 0, 1));
    expect(g.down(p(50, 50, 10, 2))).toEqual([]);
    expect(g.up(p(0, 0, 100, 1))).toEqual([]); // không thành tap
    expect(g.up(p(50, 50, 120, 2))).toEqual([]);
    expect(g.state).toBe('idle');

    g.down(p(0, 0, 1000, 1));
    g.poll(1000 + GESTURE.holdMs);
    expect(kinds(g.down(p(9, 9, 1500, 2)))).toEqual(['hold-end']);
  });

  it('cancel (mất con trỏ) giữa lúc giữ → hold-end; lúc khác → không gì', () => {
    const g = createGestureTracker();
    g.down(p(5, 5, 0));
    expect(g.cancel()).toEqual([]);
    g.down(p(5, 5, 100));
    g.poll(100 + GESTURE.holdMs);
    expect(kinds(g.cancel())).toEqual(['hold-end']);
    expect(g.state).toBe('idle');
  });

  it('mất pointerup giữa lúc giữ: chạm xuống lại → hold-end ở chỗ giữ cuối, rồi là cử chỉ mới', () => {
    const g = createGestureTracker();
    g.down(p(10, 10, 0));
    g.poll(GESTURE.holdMs);
    g.move(p(20, 30, 500));
    // pointerup bị mất (thả chuột ngoài cửa sổ, trình duyệt nuốt sự kiện): lần chạm sau khép cái giữ cũ lại.
    expect(g.down(p(80, 80, 2000))).toEqual([{ kind: 'hold-end', x: 20, y: 30 }]);
    expect(g.state).toBe('pending');
    expect(g.up(p(80, 80, 2100))).toEqual([{ kind: 'tap', x: 80, y: 80 }]);
  });

  it('mất pointerup, lần chạm sau có id mới nhưng là con trỏ chính → không kẹt ở "hai ngón"', () => {
    const g = createGestureTracker();
    g.down(p(10, 10, 0, 1));
    g.poll(GESTURE.holdMs);
    expect(g.down({ ...p(80, 80, 2000, 7), primary: true })).toEqual([{ kind: 'hold-end', x: 10, y: 10 }]);
    expect(g.up(p(80, 80, 2100, 7))).toEqual([{ kind: 'tap', x: 80, y: 80 }]);
    expect(g.state).toBe('idle');
  });

  it('hold-end ở chỗ ngón giữ đang đứng, dù kết thúc bằng ngón thứ hai hay cancel', () => {
    const g = createGestureTracker();
    g.down(p(10, 10, 0, 1));
    g.poll(GESTURE.holdMs);
    g.move(p(20, 20, 400, 1));
    expect(g.down(p(300, 300, 500, 2))).toEqual([{ kind: 'hold-end', x: 20, y: 20 }]);

    const h = createGestureTracker();
    h.down(p(10, 10, 0));
    h.poll(GESTURE.holdMs);
    h.move(p(40, 15, 400));
    expect(h.cancel()).toEqual([{ kind: 'hold-end', x: 40, y: 15 }]);
  });

  it('ngưỡng tùy chỉnh được', () => {
    const g = createGestureTracker({ holdMs: 50 });
    g.down(p(0, 0, 0));
    expect(kinds(g.poll(50))).toEqual(['hold-start']);
  });
});

describe('createGestureTracker · chạm hai lần (GĐ 5)', () => {
  /** Một lần chạm trọn: xuống ở (x, y) lúc t, nhấc ngón tại chỗ sau 50 ms. Trả loại các cử chỉ lúc nhấc ngón. */
  const tap = (g, x, y, t, id = 1) => {
    g.down(p(x, y, t, id));
    return kinds(g.up(p(x, y, t + 50, id)));
  };

  it('chạm hai lần nhanh và gần → tap, tap, double-tap (double-tap ở chỗ chạm thứ hai, ngay sau tap của nó)', () => {
    const g = createGestureTracker();
    g.down(p(100, 100, 0));
    expect(g.up(p(100, 100, 80))).toEqual([{ kind: 'tap', x: 100, y: 100 }]);
    // Ngón tay chạm lần hai là một con trỏ mới (pointerId khác; chuột thì giữ id): cặp chạm không xét id.
    g.down(p(110, 105, 200, 2));
    expect(g.up(p(111, 106, 260, 2))).toEqual([
      { kind: 'tap', x: 110, y: 105 },
      { kind: 'double-tap', x: 110, y: 105 },
    ]);
    expect(g.state).toBe('idle');
  });

  it('lần chạm hai xuống quá doubleMs sau lúc nhấc ngón đầu → chỉ hai tap (đúng doubleMs vẫn tính)', () => {
    const late = createGestureTracker();
    expect(tap(late, 50, 50, 0)).toEqual(['tap']); // nhấc ngón lúc 50
    expect(tap(late, 50, 50, 50 + GESTURE.doubleMs + 1)).toEqual(['tap']);

    // Đo từ lúc nhấc ngón, không phải lúc chạm xuống: lần hai đến 350 ms sau lần chạm đầu vẫn thành cặp.
    const edge = createGestureTracker();
    tap(edge, 50, 50, 0);
    expect(tap(edge, 50, 50, 50 + GESTURE.doubleMs)).toEqual(['tap', 'double-tap']);
  });

  it('lần chạm hai cách chỗ chạm đầu quá doublePx → chỉ hai tap (đo từ chỗ chạm xuống; đúng doublePx vẫn tính)', () => {
    const far = createGestureTracker();
    far.down(p(0, 0, 0));
    far.move(p(6, 0, 30)); // ngón trượt nhẹ (chưa quá tapPx): lần chạm vẫn ở chỗ chạm xuống (0, 0)
    far.up(p(6, 0, 60));
    expect(tap(far, GESTURE.doublePx + 1, 0, 120)).toEqual(['tap']); // cách (6, 0) chưa tới doublePx, cách (0, 0) thì quá

    const edge = createGestureTracker();
    tap(edge, 0, 0, 0);
    expect(tap(edge, 0, GESTURE.doublePx, 120)).toEqual(['tap', 'double-tap']);

    // Lần hai cũng đo từ chỗ chạm XUỐNG: xuống cách đúng doublePx rồi trượt ra thêm (chưa quá tapPx) trước khi nhấc vẫn thành cặp.
    const slide = createGestureTracker();
    tap(slide, 0, 0, 0);
    slide.down(p(GESTURE.doublePx, 0, 120, 2));
    slide.move(p(GESTURE.doublePx + 6, 0, 140, 2));
    expect(kinds(slide.up(p(GESTURE.doublePx + 6, 0, 160, 2)))).toEqual(['tap', 'double-tap']);
  });

  it('chạm ba lần liền → chỉ một double-tap: cặp tính lại từ đầu, lần ba là tap thường (lần bốn mới thành cặp)', () => {
    const g = createGestureTracker();
    expect([tap(g, 30, 30, 0), tap(g, 30, 30, 100), tap(g, 30, 30, 200), tap(g, 30, 30, 300)]).toEqual([
      ['tap'],
      ['tap', 'double-tap'],
      ['tap'],
      ['tap', 'double-tap'],
    ]);
  });

  it('lần chạm hai thành giữ → không có double-tap; thành kéo → không gì, và lần chạm đầu bị quên', () => {
    const held = createGestureTracker();
    tap(held, 20, 20, 0);
    held.down(p(20, 20, 100));
    expect(kinds(held.poll(100 + GESTURE.holdMs))).toEqual(['hold-start']);
    expect(kinds(held.up(p(20, 20, 600)))).toEqual(['hold-end']);

    // Máy bận, chưa kịp poll: nhấc ngón sau holdMs vẫn là một lần giữ, không phải lần chạm hai.
    const busy = createGestureTracker();
    tap(busy, 20, 20, 0);
    busy.down(p(20, 20, 100));
    expect(kinds(busy.up(p(20, 20, 100 + GESTURE.holdMs)))).toEqual(['hold-start', 'hold-end']);

    // Ngưỡng giữ ngắn hơn doubleMs: chạm ngay sau cái giữ, đúng chỗ cũ, cũng không ghép với 'tap' trước cái giữ.
    const quick = createGestureTracker({ holdMs: 100 });
    tap(quick, 20, 20, 0);
    quick.down(p(20, 20, 60));
    expect(kinds(quick.poll(160))).toEqual(['hold-start']);
    quick.up(p(20, 20, 170));
    expect(tap(quick, 20, 20, 200)).toEqual(['tap']);

    // Như trên nhưng chưa kịp poll (máy bận): cái giữ muộn cũng xóa 'tap' lẻ.
    const lateHold = createGestureTracker({ holdMs: 100 });
    tap(lateHold, 20, 20, 0);
    lateHold.down(p(20, 20, 60));
    expect(kinds(lateHold.up(p(20, 20, 170)))).toEqual(['hold-start', 'hold-end']);
    expect(tap(lateHold, 20, 20, 200)).toEqual(['tap']);

    const dragged = createGestureTracker();
    tap(dragged, 20, 20, 0);
    dragged.down(p(20, 20, 100));
    dragged.move(p(20 + GESTURE.tapPx + 1, 20, 120));
    expect(dragged.up(p(20 + GESTURE.tapPx + 1, 20, 160))).toEqual([]);
    // Lần chạm đầu đã bị quên: chạm ngay sau cú kéo, đúng chỗ cũ, cũng không ghép với nó.
    expect(tap(dragged, 20, 20, 200)).toEqual(['tap']);
  });

  it('ngón thứ hai, cancel, mất pointerup giữa hai lần chạm → lần chạm đầu bị quên: lần sau chỉ là tap', () => {
    const pinch = createGestureTracker();
    tap(pinch, 20, 20, 0);
    pinch.down(p(20, 20, 100, 1));
    pinch.down(p(80, 80, 110, 2)); // chụm hai ngón để zoom
    pinch.up(p(80, 80, 150, 2));
    pinch.up(p(20, 20, 160, 1));
    expect(tap(pinch, 20, 20, 200)).toEqual(['tap']);

    const left = createGestureTracker();
    tap(left, 20, 20, 0);
    left.cancel(); // rời trang (blur, pointercancel) giữa hai lần chạm
    expect(tap(left, 20, 20, 100)).toEqual(['tap']);

    const lost = createGestureTracker();
    tap(lost, 20, 20, 0);
    lost.down(p(20, 20, 100)); // pointerup của lần chạm này không bao giờ tới
    expect(tap(lost, 20, 20, 200)).toEqual(['tap']);
  });

  it('ngưỡng mặc định 300 ms, 24 px; doubleMs và doublePx tùy chỉnh được', () => {
    expect(GESTURE).toMatchObject({ doubleMs: 300, doublePx: 24 });
    const g = createGestureTracker({ doubleMs: 500, doublePx: 60 });
    tap(g, 0, 0, 0);
    // Lần hai đến 450 ms sau lúc nhấc ngón, cách 50 px: quá ngưỡng mặc định cả hai phía, vẫn trong ngưỡng riêng.
    expect(tap(g, 50, 0, 500)).toEqual(['tap', 'double-tap']);
  });
});
