// tests/paintings/ao-sen-dem/anh-trang-drift.test.js — đường trôi của hoa đăng (hàm thuần): nở, trôi về lối trăng, chìm, vòng đệm N + 1 ô, thứ tự thơ.
import { describe, it, expect } from 'vitest';
import {
  DRIFT,
  createLanternSlots,
  driftDirection,
  lanternAt,
  verseOrder,
} from '../../../src/paintings/ao-sen-dem/parts/anh-trang-drift.js';
import { mulberry32, randRange } from '../../../src/lib/random.js';

const POND = 60; // POND_RADIUS của shared.js: mặc định của createLanternSlots
const SOUTH = { x: 0, z: -1 }; // trăng ở chính nam: lối trăng chạy dọc trục z, từ camera (z = 32) ra xa
const vn = (s) => new Date(`${s}+07:00`);
// Khóa của mười hai cặp câu thơ (spec §5).
const KEYS = [
  'den-khoe', 'trang-khoe', 'thuyen-ve', 'gio-dua', 'mit-mu', 'trang-bao-nhieu',
  'thach-luu', 'chen-ruou', 'guong-nga', 'ao-thu', 'lung-giau', 'nuoc-biec',
];

/** Thả MỘT đèn vào một vòng đệm mới và trả ô của nó. Mặc định hướng trôi theo trăng ở chính nam. */
function releaseOne({ x = 0, z = 0, t = 0, dir = driftDirection(x, z, SOUTH), phase } = {}) {
  const ring = createLanternSlots(4);
  return ring.slots[ring.release({ x, z, t, dir, key: 'den-khoe', phase })];
}

/** Số đèn đang nổi (còn sống, chưa bắt đầu chìm) ở thời điểm t. */
const afloat = (ring, t) => ring.slots.filter((s) => {
  const l = lanternAt(s, t);
  return l.alive && l.sink === 0;
}).length;

/** Quãng đi dọc theo hướng trôi và độ lệch ngang so với chỗ thả. */
function offset(slot, l) {
  const [ox, oz] = [l.x - slot.x, l.z - slot.z];
  return { along: ox * slot.dx + oz * slot.dz, across: Math.abs(oz * slot.dx - ox * slot.dz) };
}

describe('lanternAt: một ngọn hoa đăng theo thời gian', () => {
  it('lúc thả: đúng chỗ thả, búp còn khép, chưa sáng; sáng dần rồi 1,5 giây sau nở đủ', () => {
    const slot = releaseOne({ x: -6, z: 10, t: 5, phase: 1 }); // pha khác 0: lúc thả không lệch là nhờ thừa số đà của lượn ngang
    const start = lanternAt(slot, 5);
    expect(start).toMatchObject({ alive: true, open: 0, glow: 0, sink: 0 });
    expect([start.x, start.z]).toEqual([-6, 10]);
    const kindling = lanternAt(slot, 5 + DRIFT.glowIn / 2);
    expect(kindling.glow).toBeGreaterThan(0);
    expect(kindling.glow).toBeLessThan(1);
    expect(lanternAt(slot, 5 + DRIFT.glowIn).glow).toBe(1);
    const opening = lanternAt(slot, 5 + DRIFT.open / 2).open;
    expect(opening).toBeGreaterThan(0);
    expect(opening).toBeLessThan(1);
    expect(lanternAt(slot, 5 + DRIFT.open).open).toBe(1);
    expect(lanternAt(slot, 5 + 30).open).toBe(1);
  });

  it('đi theo hướng trôi: sau 20 giây đã ra xa chỗ thả theo dir, quãng đường khớp tốc độ; lúc đầu rất chậm (khởi đầu mềm)', () => {
    const slot = releaseOne({ x: -6, z: 10 });
    const { along, across } = offset(slot, lanternAt(slot, 20));
    expect(along).toBeGreaterThan(DRIFT.speed * (20 - DRIFT.ease)); // đà lấy xong thì trôi đều
    expect(along).toBeLessThan(DRIFT.speed * 20);
    expect(across).toBeLessThanOrEqual(DRIFT.sway); // chỉ lượn nhẹ hai bên đường trôi
    expect(offset(slot, lanternAt(slot, 1)).along).toBeLessThan(DRIFT.speed * 0.25);
    const later = offset(slot, lanternAt(slot, 50)).along - offset(slot, lanternAt(slot, 40)).along;
    expect(later).toBeCloseTo(DRIFT.speed * 10, 2);
  });

  it('xoay chậm theo DRIFT.spin; mỗi lần thả một pha riêng (lệch góc vàng), truyền phase thì dùng đúng phase đó', () => {
    const slot = releaseOne({ phase: 1 });
    expect(slot.phase).toBe(1);
    expect(lanternAt(slot, 0).yaw).toBe(1);
    expect(lanternAt(slot, 10).yaw).toBeCloseTo(1 + DRIFT.spin * 10, 9);
    const ring = createLanternSlots(4);
    const phases = [0, 1, 2].map((k) => ring.slots[ring.release({ x: k, z: 0, t: k, dir: [0, -1], key: null })].phase);
    expect(new Set(phases).size).toBe(3);
    expect(phases[1] - phases[0]).toBeCloseTo(Math.PI * (3 - Math.sqrt(5)), 9);
  });

  it('tất định: cùng t thì cùng kết quả, gọi theo thứ tự nào cũng vậy; trước lúc thả hay ô trống thì không có đèn', () => {
    const slot = releaseOne({ x: 3, z: -4, t: 10 });
    const first = lanternAt(slot, 37.25);
    lanternAt(slot, 80);
    lanternAt(slot, 11);
    expect(lanternAt(slot, 37.25)).toEqual(first);
    expect(lanternAt(slot, 9.99)).toMatchObject({ alive: false, glow: 0 });
    const ring = createLanternSlots(3);
    for (const s of ring.slots) expect(lanternAt(s, 0)).toMatchObject({ alive: false, glow: 0 });
    expect(ring.alive(0)).toBe(0);
  });

  it('tới vùng mép (còn cách bờ DRIFT.margin) thì chìm dần trong DRIFT.sink giây rồi tắt; sau khi chìm độ sáng 0', () => {
    const slot = releaseOne({ x: 0, z: -40, dir: [0, -1] }); // trôi thẳng ra mép xa
    const edge = slot.edgeAt;
    expect(edge).toBeGreaterThan(DRIFT.open);
    expect(edge).toBeLessThan(DRIFT.life);
    const atEdge = lanternAt(slot, edge);
    expect(Math.hypot(atEdge.x, atEdge.z)).toBeCloseTo(POND - DRIFT.margin, 1);
    expect(lanternAt(slot, edge - 0.01)).toMatchObject({ alive: true, sink: 0, glow: 1 });
    const sinking = lanternAt(slot, edge + DRIFT.sink / 2);
    expect(sinking.alive).toBe(true);
    expect(sinking.sink).toBeCloseTo(0.5, 6);
    expect(sinking.glow).toBeCloseTo(0.5, 6); // tắt dần theo độ chìm
    expect(lanternAt(slot, edge + DRIFT.sink + 0.01)).toMatchObject({ alive: false, glow: 0, sink: 1 });
  });

  it('quá DRIFT.life giây thì chìm dù chưa tới mép', () => {
    // Thả gần bờ phía camera, trôi ngang qua cả ao: 106 đơn vị mới tới vùng mép bên kia, lâu hơn DRIFT.life với mọi tốc độ ≤ 1,1.
    const slot = releaseOne({ x: 0, z: 50, t: 10, dir: [0, -1] });
    expect(slot.edgeAt).toBeGreaterThan(10 + DRIFT.life);
    expect(lanternAt(slot, 10 + DRIFT.life - 0.01)).toMatchObject({ alive: true, sink: 0 });
    expect(lanternAt(slot, 10 + DRIFT.life + DRIFT.sink / 2).sink).toBeCloseTo(0.5, 6);
    expect(lanternAt(slot, 10 + DRIFT.life + DRIFT.sink + 0.01)).toMatchObject({ alive: false, glow: 0 });
  });

  it('thả sát bờ mà hướng ra ngoài: chìm ngay từ lúc thả', () => {
    const slot = releaseOne({ x: 0, z: -58, t: 2, dir: [0, -1] });
    expect(slot.edgeAt).toBe(2);
    expect(lanternAt(slot, 2 + DRIFT.sink / 2).sink).toBeCloseTo(0.5, 6);
    expect(lanternAt(slot, 2 + DRIFT.sink + 0.01).alive).toBe(false);
  });

  it('biên độ lượn cộng quãng trôi trong lúc chìm nhỏ hơn DRIFT.margin: chỉnh tốc độ thì đèn vẫn chìm hẳn trước khi chạm bờ', () => {
    expect(DRIFT.sway + DRIFT.speed * DRIFT.sink).toBeLessThan(DRIFT.margin);
  });

  it('ở trong ao suốt đời đèn: lúc nổi không ra quá vùng mép (cộng biên độ lượn), lúc chìm vẫn chưa chạm bờ', () => {
    let maxAfloat = 0;
    let maxAlive = 0;
    let sinkingSeen = 0;
    for (const moon of [SOUTH, { x: -0.34, z: -0.94 }, { x: 0.34, z: -0.94 }]) {
      for (let r = 0; r <= POND - DRIFT.margin; r += 14) {
        for (let a = 0; a < 6; a++) {
          const [x, z] = [r * Math.cos(a), r * Math.sin(a)];
          const slot = releaseOne({ x, z, dir: driftDirection(x, z, moon) });
          for (let t = 0; t <= DRIFT.life + DRIFT.sink; t += 0.25) {
            const l = lanternAt(slot, t);
            if (!l.alive) break;
            const d = Math.hypot(l.x, l.z);
            maxAlive = Math.max(maxAlive, d);
            if (l.sink === 0) maxAfloat = Math.max(maxAfloat, d);
            else sinkingSeen++;
          }
        }
      }
    }
    expect(sinkingSeen).toBeGreaterThan(0);
    expect(maxAfloat).toBeLessThanOrEqual(POND - DRIFT.margin + DRIFT.sway);
    expect(maxAlive).toBeLessThan(POND);
  });
});

describe('driftDirection: hướng về một điểm xa trên lối trăng', () => {
  it('là vector đơn vị, với mọi chỗ thả và mọi hướng trăng', () => {
    for (const [x, z] of [[-20, 10], [15, -5], [0, 0], [40, -30], [-50, -20]]) {
      for (const moon of [SOUTH, { x: -0.3, y: 0.2, z: -0.93 }, { x: 0.33, z: -0.94 }]) {
        const [dx, dz] = driftDirection(x, z, moon);
        expect(Math.hypot(dx, dz)).toBeCloseTo(1, 12);
      }
    }
  });

  it('trăng ở chính nam: thả bên trái lối trăng thì trôi sang phải và ra xa, bên phải thì sang trái', () => {
    const [lx, lz] = driftDirection(-20, 10, SOUTH);
    expect(lx).toBeGreaterThan(0);
    expect(lz).toBeLessThan(0);
    expect(driftDirection(20, 10, SOUTH)[0]).toBeLessThan(0);
    expect(driftDirection(0, 10, SOUTH)).toEqual([0, -1]); // đứng trên lối trăng thì trôi thẳng ra xa
  });

  it('nhắm đúng điểm cách camera (0, 32) một đoạn reach theo phương vị trăng; chỉ dùng x, z của trăng', () => {
    const azimuth = 0.3;
    const [sin, cos] = [Math.sin(azimuth), Math.cos(azimuth)];
    /** (đích − chỗ thả) song song và cùng chiều với hướng trôi. */
    const expectAims = ([dx, dz], [x, z], [tx, tz]) => {
      expect((tx - x) * dz - (tz - z) * dx).toBeCloseTo(0, 9);
      expect((tx - x) * dx + (tz - z) * dz).toBeGreaterThan(0);
    };
    const moon = { x: sin, y: 0.2, z: -cos };
    const dir = driftDirection(-10, 0, moon);
    expectAims(dir, [-10, 0], [100 * sin, 32 - 100 * cos]);
    expectAims(driftDirection(-10, 0, moon, { origin: [0, 20], reach: 30 }), [-10, 0], [30 * sin, 20 - 30 * cos]);
    const longer = driftDirection(-10, 0, { x: 2 * sin, z: -2 * cos }); // độ dài của vector trăng không đổi gì
    expect(longer[0]).toBeCloseTo(dir[0], 12);
    expect(longer[1]).toBeCloseTo(dir[1], 12);
  });

  it('đích nằm ngoài ao (reach 100): thả ở đâu trong ao cũng trôi ra xa người xem, không trôi ngược về phía camera', () => {
    // Camera đứng ở z = 32 nhìn về −z. Đích trong ao (reach 80 thì đích ở z = −48) làm đèn thả xa hơn đích quay đầu về camera.
    for (const moon of [SOUTH, { x: -0.34, z: -0.94 }, { x: 0.34, z: -0.94 }]) {
      for (let x = -POND; x <= POND; x += 6) {
        for (let z = -POND; z <= POND; z += 6) {
          if (Math.hypot(x, z) > POND) continue;
          expect(driftDirection(x, z, moon)[1], `(${x}, ${z})`).toBeLessThan(0);
        }
      }
    }
  });

  it('thả đúng điểm đích thì trôi theo phương vị trăng; trăng ở đỉnh đầu (x = z = 0) vẫn ra vector đơn vị', () => {
    expect(driftDirection(0, -68, SOUTH)).toEqual([0, -1]);
    const [dx, dz] = driftDirection(5, 5, { x: 0, y: 1, z: 0 });
    expect(Math.hypot(dx, dz)).toBeCloseTo(1, 12);
  });
});

describe('createLanternSlots: vòng đệm N + 1 ô', () => {
  it('thả quá sức chứa: đèn nổi lâu nhất chìm sớm (sinkAt = t), đèn mới vào ô thừa; alive(t) đếm cả đèn đang chìm', () => {
    const ring = createLanternSlots(2);
    expect(ring.capacity).toBe(2);
    expect(ring.slots).toHaveLength(3);
    const dir = [0, -1];
    const a = ring.release({ x: 0, z: 0, t: 0, dir, key: 'den-khoe' });
    const b = ring.release({ x: 5, z: 0, t: 1, dir, key: 'trang-khoe' });
    expect(ring.alive(1.5)).toBe(2);
    expect(ring.slots[b].key).toBe('trang-khoe');
    const c = ring.release({ x: -5, z: 0, t: 2, dir, key: 'thuyen-ve' }); // lần thả thứ capacity + 1
    expect(new Set([a, b, c]).size).toBe(3); // vào ô thừa, không đè đèn đang chìm
    expect(ring.slots[a].sinkAt).toBe(2);
    expect(ring.slots[b].sinkAt).toBe(Infinity);
    expect(afloat(ring, 2.01)).toBe(2);
    expect(ring.alive(2.01)).toBe(3);
    expect(lanternAt(ring.slots[a], 2.01).sink).toBeGreaterThan(0);
    expect(ring.alive(2 + DRIFT.sink + 0.01)).toBe(2);
    const d = ring.release({ x: 0, z: 5, t: 6, dir, key: null }); // đèn của ô a đã chìm hẳn: ô được dùng lại
    expect(d).toBe(a);
    expect(ring.slots[b].sinkAt).toBe(6); // b giờ là đèn nổi lâu nhất
    expect(ring.slots[d]).toMatchObject({ t0: 6, key: null, sinkAt: Infinity });
  });

  it('đèn thả ở vùng mép mà hướng ra ngoài (chìm ngay) không tính là đèn nổi: không bắt đèn nào chìm theo', () => {
    const ring = createLanternSlots(2);
    const a = ring.release({ x: 0, z: 0, t: 0, dir: [0, -1], key: null });
    const b = ring.release({ x: 5, z: 0, t: 1, dir: [0, -1], key: null });
    const c = ring.release({ x: 0, z: -58, t: 2, dir: [0, -1], key: null });
    expect(ring.slots[c].edgeAt).toBe(2);
    expect([ring.slots[a].sinkAt, ring.slots[b].sinkAt]).toEqual([Infinity, Infinity]);
    expect(afloat(ring, 2.01)).toBe(2);
    expect(ring.alive(2.01)).toBe(3);
  });

  it('chuỗi thả bất kỳ: số đèn nổi không bao giờ quá capacity, số đèn sống không quá capacity + 1', () => {
    const ring = createLanternSlots(4);
    const rng = mulberry32(5);
    let t = 0;
    let fullSeen = 0;
    for (let k = 0; k < 300; k++) {
      t += rng() * rng() * 6; // phần lớn thả sát nhau, thỉnh thoảng cách xa
      const [x, z] = [randRange(rng, -30, 30), randRange(rng, -30, 20)];
      ring.release({ x, z, t, dir: driftDirection(x, z, SOUTH), key: null });
      const later = t + 0.001; // lần thả vừa ép một đèn chìm: 1 ms sau đèn đó đã chìm một chút
      expect(afloat(ring, later)).toBeLessThanOrEqual(4);
      expect(ring.alive(later)).toBeLessThanOrEqual(5);
      expect(ring.alive(later)).toBe(ring.slots.filter((s) => lanternAt(s, later).alive).length);
      if (ring.alive(later) === 5) fullSeen++;
    }
    expect(fullSeen).toBeGreaterThan(0);
  });

  it('thả dồn dập (10 lần trong 1 giây): không lỗi; hết ô trống thì dùng lại ô có đèn chìm lâu nhất', () => {
    const ring = createLanternSlots(2);
    const used = [];
    for (let k = 0; k < 10; k++) {
      const t = k * 0.1;
      const states = ring.slots.map((s) => lanternAt(s, t));
      const free = states.some((l) => !l.alive);
      const longest = states.reduce((best, l, i) => (l.alive && l.sink > (states[best]?.sink ?? 0) ? i : best), -1);
      const i = ring.release({ x: k, z: 0, t, dir: [0, -1], key: null });
      if (!free) expect(i).toBe(longest);
      used.push(i);
      expect(afloat(ring, t + 0.001)).toBeLessThanOrEqual(2);
    }
    expect(used).toEqual([0, 1, 2, 0, 1, 2, 0, 1, 2, 0]);
  });

  it('đồng hồ đứng (?freeze): nhiều lần thả cùng một t vẫn xoay vòng theo thứ tự thả', () => {
    const ring = createLanternSlots(2);
    const used = Array.from({ length: 7 }, (_, k) => ring.release({ x: k, z: 0, t: 0, dir: [0, -1], key: null }));
    expect(used).toEqual([0, 1, 2, 0, 1, 2, 0]);
    expect(afloat(ring, 0.01)).toBe(2);
    expect(ring.alive(0)).toBe(3);
  });

  it('capacity phải là số nguyên ≥ 1 (budget.lanterns): sai thì báo lỗi ngay lúc dựng', () => {
    expect(() => createLanternSlots(0)).toThrow(/capacity/);
    expect(() => createLanternSlots(undefined)).toThrow(/capacity/);
    expect(() => createLanternSlots(2.5)).toThrow(/capacity/);
  });
});

describe('verseOrder: thứ tự thơ của một đêm', () => {
  it('là một hoán vị của các khóa, mảng gốc giữ nguyên; keys rỗng → []', () => {
    const order = verseOrder(KEYS, vn('2026-10-02T21:00'));
    expect([...order].sort()).toEqual([...KEYS].sort());
    expect(order).not.toBe(KEYS);
    expect(KEYS[0]).toBe('den-khoe');
    expect(verseOrder([], vn('2026-10-02T21:00'))).toEqual([]);
    expect(verseOrder(['ao-thu'], vn('2026-10-02T21:00'))).toEqual(['ao-thu']);
  });

  it('cả một đêm (từ 12 giờ trưa tới 12 giờ trưa hôm sau, giờ Việt Nam) một thứ tự: đêm của bức 18:00 → 05:30 không đổi giữa chừng', () => {
    const night = verseOrder(KEYS, vn('2026-10-02T18:00'));
    for (const at of ['2026-10-02T12:00', '2026-10-02T23:59', '2026-10-03T00:01', '2026-10-03T05:30', '2026-10-03T11:59']) {
      expect(verseOrder(KEYS, vn(at)), at).toEqual(night);
    }
    // 06:00 và 08:00 ngày 3/10 giờ Việt Nam là 23:00 ngày 2/10 và 01:00 ngày 3/10 giờ UTC: ngày UTC đổi, đêm thì không.
    expect(verseOrder(KEYS, vn('2026-10-03T06:00'))).toEqual(verseOrder(KEYS, vn('2026-10-03T08:00')));
  });

  it('khác đêm thì khác thứ tự (ở các cặp đêm đã chọn), kể cả hai phút quanh 12 giờ trưa giờ Việt Nam', () => {
    const nights = ['2026-09-28', '2026-09-29', '2026-10-02', '2026-12-31'].map((d) => verseOrder(KEYS, vn(`${d}T21:00`)));
    for (let i = 0; i < nights.length; i++) {
      for (let j = i + 1; j < nights.length; j++) expect(nights[i]).not.toEqual(nights[j]);
    }
    expect(verseOrder(KEYS, vn('2026-10-03T11:59'))).not.toEqual(verseOrder(KEYS, vn('2026-10-03T12:01')));
  });
});
