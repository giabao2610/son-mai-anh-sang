// tests/unit/ladder.test.js — thang nấc: 'dpr' nở theo DPR thật, nấc của lớp lấy từ degrade, áp và gỡ như ngăn xếp.
import { describe, it, expect, vi } from 'vitest';
import { DPR_FLOOR, DPR_STEP, createLadder, dprSteps } from '../../src/engine/gpu/ladder.js';

/** Sân khấu giả: nhớ trần DPR đang đặt; DPR thật của máy là `device`. */
function fakeStage(device) {
  let max = Infinity;
  return {
    dpr: () => Math.min(device, max),
    setDpr: vi.fn((v) => {
      max = v;
    }),
  };
}

/** Lớp giả có các nấc ghi lại lời gọi vào `log`. */
function layer(id, stepIds, log) {
  return { id, layer: { degrade: stepIds.map((s) => ({ id: s, apply: () => log.push(`+${id}.${s}`), revert: () => log.push(`-${id}.${s}`) })) } };
}

describe('dprSteps', () => {
  it('mỗi nấc bớt 0,25, dừng ở sàn 1', () => {
    expect([DPR_STEP, DPR_FLOOR]).toEqual([0.25, 1]);
    expect(dprSteps(2)).toEqual([1.75, 1.5, 1.25, 1]);
    expect(dprSteps(1.5)).toEqual([1.25, 1]);
    expect(dprSteps(1.25)).toEqual([1]);
    expect(dprSteps(1)).toEqual([]);
    expect(dprSteps(0.9)).toEqual([]); // trang đang thu nhỏ: DPR dưới 1 thì không hạ nữa
  });
});

describe('createLadder', () => {
  it("thiếu ladder thì chỉ có 'dpr'; màn DPR 1 thì thang rỗng", () => {
    expect(createLadder({ layers: [], stage: fakeStage(2), dpr: 2 }).steps).toBe(4);
    expect(createLadder({ layers: [], stage: fakeStage(1), dpr: 2 }).steps).toBe(0);
  });

  it("'dpr' tính từ DPR THẬT: máy 1,5 ở mức trần 2 có 2 nấc; gỡ nấc đầu thì trả đúng trần của mức", () => {
    const stage = fakeStage(1.5);
    const ladder = createLadder({ layers: [], stage, dpr: 2 });
    expect(ladder.steps).toBe(2);
    ladder.down();
    ladder.down();
    expect(stage.setDpr.mock.calls.map((c) => c[0])).toEqual([1.25, 1]);
    expect(ladder.ids()).toEqual(['dpr=1.25', 'dpr=1']);
    ladder.up();
    ladder.up();
    expect(stage.setDpr.mock.calls.map((c) => c[0])).toEqual([1.25, 1, 1.25, 2]);
  });

  it('nấc của lớp theo đúng thứ tự thang; mục không có lớp hay lớp không đưa nấc đó thì bỏ qua', () => {
    const log = [];
    const layers = [layer('mat-nuoc', ['phan-chieu'], log), layer('anh-trang', [], log), layer('phu-bong', ['bloom'], log)];
    const ladder = createLadder({
      ladder: ['dpr', 'phu-bong.bloom', 'anh-trang.bong', 'khong-co.gi', 'mat-nuoc.phan-chieu'],
      layers,
      stage: fakeStage(1),
      dpr: 1.25,
    });
    expect(ladder.steps).toBe(2);
    while (ladder.down());
    expect(log).toEqual(['+phu-bong.bloom', '+mat-nuoc.phan-chieu']);
    expect(ladder.ids()).toEqual(['phu-bong.bloom', 'mat-nuoc.phan-chieu']);
  });

  it('áp và gỡ như ngăn xếp; hết thang hay hết nấc thì trả false; reset gỡ hết theo thứ tự ngược', () => {
    const log = [];
    const ladder = createLadder({ ladder: ['a.x', 'b.y', 'c.z'], layers: [layer('a', ['x'], log), layer('b', ['y'], log), layer('c', ['z'], log)], stage: fakeStage(1), dpr: 1 });
    expect(ladder.up()).toBe(false);
    expect([ladder.down(), ladder.down(), ladder.applied]).toEqual([true, true, 2]);
    expect(ladder.up()).toBe(true);
    expect([ladder.down(), ladder.down(), ladder.down()]).toEqual([true, true, false]);
    ladder.reset();
    expect(ladder.applied).toBe(0);
    expect(log).toEqual(['+a.x', '+b.y', '-b.y', '+b.y', '+c.z', '-c.z', '-b.y', '-a.x']);
  });
});
