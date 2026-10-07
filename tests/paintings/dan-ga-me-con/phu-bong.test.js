// tests/paintings/dan-ga-me-con/phu-bong.test.js — Phủ bóng của Bức 4 ghi đè mặc định của lớp dùng chung bằng spread (spec §15 a, §20.4 lớp 6): đúng ba núm chốt ở lượt màu, id có thật trong lớp dùng chung, giá trị hợp lệ; còn lại và module dùng chung giữ nguyên.
import { describe, it, expect } from 'vitest';
import * as stock from '../../../src/engine/stock/phu-bong/layer.js';
import { layers } from '../../../src/paintings/dan-ga-me-con/painting.js';

/** Số chốt ở lượt màu (GĐ 8 Task 11, spec §20.3): đổi số nào ở painting.js thì đổi cả ở đây, lý do ghi trong commit. */
const CHOT = { toneMapping: 'aces', exposure: 1.2, bloomStrength: 0.5 };
/** Khóa RIÊNG của object: `in` đi cả chuỗi prototype, nên núm tên `toString` sẽ "có" trong mọi object. */
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

describe('Phủ bóng của Bức 4: ghi đè mặc định của lớp dùng chung', () => {
  const phuBong = layers.find((m) => m.id === stock.id);

  it('là lớp cuối, bản sao của module dùng chung: cùng id, cùng createLayer', () => {
    expect(layers.at(-1)).toBe(phuBong);
    expect(phuBong).not.toBe(stock);
    expect(Object.keys(phuBong).sort()).toEqual(Object.keys(stock).sort());
    expect(phuBong.createLayer).toBe(stock.createLayer);
  });

  it('mọi id được ghi đè có thật trong lớp dùng chung, và giá trị hợp lệ với núm (không bị kẹp hay bỏ khi chuẩn hóa)', () => {
    for (const [id, value] of Object.entries(CHOT)) {
      const knob = stock.knobs.find((k) => k.id === id);
      expect(knob, `Phủ bóng không có núm "${id}"`).toBeDefined();
      if (knob.kind === 'select') expect(knob.options).toContain(value);
      else expect([value >= knob.min, value <= knob.max], `${id} = ${value} ngoài [${knob.min}, ${knob.max}]`).toEqual([true, true]);
    }
  });

  it('đúng ba núm chốt mang số mới (chỉ đổi value); núm khác là chính núm của lớp dùng chung; module dùng chung không bị sửa', () => {
    expect(phuBong.knobs.map((k) => k.id)).toEqual(stock.knobs.map((k) => k.id));
    phuBong.knobs.forEach((knob, i) => {
      if (own(CHOT, knob.id)) expect(knob, knob.id).toEqual({ ...stock.knobs[i], value: CHOT[knob.id] });
      else expect(knob, knob.id).toBe(stock.knobs[i]);
    });
    // Ba bức kia lắp chính module này: ghi đè của Bức 4 không được lọt sang chúng.
    const value = (id) => stock.knobs.find((k) => k.id === id).value;
    expect([value('toneMapping'), value('exposure'), value('bloomStrength')]).toEqual(['agx', 1, 1]);
  });
});
