// tests/unit/gesture.test.js — phân loại cử chỉ: chạm, giữ, vuốt, kéo (của camera), hai ngón.
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
