// tests/paintings/ao-sen-dem/tha-hoa-dang.test.js — chạm hai lần lên nước thả hoa đăng (GĐ 5): đèn ở chỗ chạm, trôi về lối trăng lúc thả, mang câu thơ kế tiếp của đêm nay.
import { describe, it, expect } from 'vitest';
import { Ray, Vector3 } from 'three/webgpu';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import content from '../../../src/paintings/ao-sen-dem/content.vi.js';
import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
import { DRIFT, driftDirection, lanternAt, verseOrder } from '../../../src/paintings/ao-sen-dem/parts/anh-trang-drift.js';
import { POND_RADIUS, moonDirection, setup } from '../../../src/paintings/ao-sen-dem/shared.js';
import { NOW, buildPainting, fakeCaptions, makeEngineCtx } from '../../helpers/fake-ctx.js';
import { down } from '../../helpers/rays.js';

describe('chạm hai lần: thả hoa đăng mang một cặp câu thơ (GĐ 5)', () => {
  /** Ô của vòng đệm có đèn thả lúc t. */
  const releasedAt = (shared, t) => shared.lanterns.slots.find((s) => s.t0 === t);
  /** Tia từ chỗ đứng của camera ngước lên trời: không bao giờ cắt mặt nước. */
  const sky = () => new Ray(new Vector3(0, 6, 32), new Vector3(0, 0.3, -1).normalize());

  it('chạm hai lần trên ao: một hoa đăng thả đúng chỗ, lúc ctx.u.time (số đo lanterns 0 → 1); chữ là khóa đầu của verseOrder(keys, NOW) và neo theo đèn', () => {
    const keys = Object.keys(content.captions);
    const { ctx, setup: s, shared, layers } = buildPainting(painting, meta, { until: 'anh-trang', captions: fakeCaptions(keys) });
    const layer = layers['anh-trang'];
    const lanterns = () => layer.readouts.find((r) => r.id === 'lanterns').get();
    expect(lanterns()).toBe(0);
    ctx.u.time.value = 2.5;
    s.onGesture({ kind: 'double-tap', ray: down(3, 4) });
    layer.update(1 / 60, 2.5);
    const slot = releasedAt(shared, 2.5);
    expect(slot).toMatchObject({ x: 3, z: 4 });
    expect(lanterns()).toBe(1);
    expect(ctx.captions.show).toHaveBeenCalledTimes(1);
    const [key, anchor] = ctx.captions.show.mock.calls[0];
    expect(key).toBe(verseOrder(keys, NOW)[0]);
    expect(slot.key).toBe(key);
    // Lúc thả: điểm neo ở ngay trên chỗ chạm. Về sau: đi theo đèn (cùng công thức với lớp Ánh trăng), không đứng lại.
    const start = anchor();
    expect([start.x, start.z]).toEqual([3, 4]);
    expect(start.y).toBeGreaterThan(0);
    ctx.u.time.value = 12.5;
    const later = anchor();
    const drifted = lanternAt(slot, 12.5);
    expect([later.x, later.z]).toEqual([drifted.x, drifted.z]);
    expect(Math.hypot(later.x - 3, later.z - 4)).toBeGreaterThan(1);
    expect(later.y).toBe(start.y);
    // Đèn chìm hẳn: anchor() trả null, chữ ẩn đi (không phải lỗi).
    ctx.u.time.value = 2.5 + DRIFT.life + DRIFT.sink + 1;
    expect(anchor()).toBeNull();
  });

  it('đèn trôi về lối trăng nhìn từ chỗ đứng của camera, theo trăng LÚC THẢ; kéo thanh giờ sau đó không đổi đường (§4.2)', () => {
    const s = setup(makeEngineCtx(meta));
    s.shared.hour.value = 27; // kéo thanh tới 03:00 rồi mới thả: trăng đã sang phải
    s.update(1 / 60, 0);
    s.onGesture({ kind: 'double-tap', ray: down(3, 4) });
    const slot = s.shared.lanterns.slots.find((q) => q.seq === 0);
    // Gốc là chỗ đứng của camera trong painting.js (shared.js dùng gốc mặc định của driftDirection): dời camera mà quên
    // dời gốc theo thì test này hỏng.
    const [cx, , cz] = painting.camera.position;
    const [dx, dz] = driftDirection(3, 4, new Vector3(...moonDirection(27)), { origin: [cx, cz] });
    expect(slot.dx).toBeCloseTo(dx, 9);
    expect(slot.dz).toBeCloseTo(dz, 9);
    s.shared.hour.value = 19; // kéo tiếp: đèn đã thả giữ đường cũ
    s.update(1 / 60, 1);
    expect(slot.dx).toBeCloseTo(dx, 9);
    expect(slot.dz).toBeCloseTo(dz, 9);
  });

  it('mỗi lần thả là câu kế tiếp của đêm nay, neo vào đèn của chính nó; hết danh sách thì quay lại đầu', () => {
    const keys = ['mot', 'hai', 'ba'];
    const ctx = makeEngineCtx(meta, { captions: fakeCaptions(keys) });
    const s = setup(ctx);
    const spots = [[-10, 10], [-4, 12], [2, 8], [8, 14]];
    spots.forEach(([x, z], k) => {
      ctx.u.time.value = k;
      s.onGesture({ kind: 'double-tap', ray: down(x, z) });
    });
    const order = verseOrder(keys, NOW);
    const { calls } = ctx.captions.show.mock;
    expect(calls.map(([key]) => key)).toEqual([...order, order[0]]);
    spots.forEach(([x, z], k) => {
      ctx.u.time.value = k; // đúng lúc thả: điểm neo ở ngay chỗ chạm
      const at = calls[k][1]();
      expect([at.x, at.z], `lần thả ${k + 1}`).toEqual([x, z]);
    });
  });

  it('chạm hai lần lên trời hay ngoài ao: không thả đèn, không có chữ, không tốn câu nào của danh sách', () => {
    // Ba khóa cho hai lần trượt: nếu mỗi lần trượt tốn một câu thì lần thả thật ra order[2]. Với hai khóa, tốn hai câu
    // lại vòng về đúng order[0] và test không thấy gì.
    const keys = ['mot', 'hai', 'ba'];
    const ctx = makeEngineCtx(meta, { captions: fakeCaptions(keys) });
    const s = setup(ctx);
    s.onGesture({ kind: 'double-tap', ray: sky() });
    s.onGesture({ kind: 'double-tap', ray: down(POND_RADIUS + 1, 0) });
    expect(s.shared.lanterns.slots.every((slot) => slot.t0 === -Infinity)).toBe(true);
    expect(s.shared.lanterns.alive(ctx.u.time.value)).toBe(0);
    expect(ctx.captions.show).not.toHaveBeenCalled();
    s.onGesture({ kind: 'double-tap', ray: down(0, 10) });
    expect(ctx.captions.show.mock.calls.map(([key]) => key)).toEqual([verseOrder(keys, NOW)[0]]);
  });

  it('không có chữ (keys rỗng, như khi chữ tải hỏng): đèn vẫn được thả, không gọi show', () => {
    const ctx = makeEngineCtx(meta, { captions: fakeCaptions([]) });
    const s = setup(ctx);
    ctx.u.time.value = 1;
    s.onGesture({ kind: 'double-tap', ray: down(-2, 6) });
    expect(releasedAt(s.shared, 1)).toMatchObject({ x: -2, z: 6, key: null });
    expect(s.shared.lanterns.alive(1)).toBe(1);
    expect(ctx.captions.show).not.toHaveBeenCalled();
  });

  it('hai lần chạm vẫn là hai "tap" (gợn sóng, đom đóm tản) như cũ; "double-tap" theo sau chỉ thả đèn, không thêm gợn', () => {
    const ctx = makeEngineCtx(meta, { captions: fakeCaptions(['mot']) });
    const s = setup(ctx);
    ctx.u.time.value = 2;
    s.onGesture({ kind: 'tap', ray: down(3, 4) });
    expect(s.shared.ripples.slots[0].toArray()).toEqual([3, 4, 2, 1]);
    expect(s.shared.attract.strength.value).toBeLessThan(0);
    expect(s.shared.lanterns.alive(2)).toBe(0); // một lần chạm: chưa có đèn, chưa có chữ
    expect(ctx.captions.show).not.toHaveBeenCalled();
    ctx.u.time.value = 2.25;
    // gesture.js phát lần chạm hai thành 'tap' rồi 'double-tap', cùng chỗ.
    s.onGesture({ kind: 'tap', ray: down(4, 4) });
    s.onGesture({ kind: 'double-tap', ray: down(4, 4) });
    expect(s.shared.ripples.slots.filter((v) => v.w > 0).map((v) => v.toArray())).toEqual([[3, 4, 2, 1], [4, 4, 2.25, 1]]);
    expect(releasedAt(s.shared, 2.25)).toMatchObject({ x: 4, z: 4 }); // đèn hiện giữa vòng gợn thứ hai
    expect(ctx.captions.show).toHaveBeenCalledTimes(1);
  });

  it('content.vi.js: mười hai cặp câu của spec §5 theo đúng thứ tự, mỗi mục hai dòng có nguồn; gợi ý nhắc chạm hai lần', () => {
    expect(Object.keys(content.captions)).toEqual([
      'den-khoe', 'trang-khoe', 'thuyen-ve', 'gio-dua', 'mit-mu', 'trang-bao-nhieu',
      'thach-luu', 'chen-ruou', 'guong-nga', 'ao-thu', 'lung-giau', 'nuoc-biec',
    ]);
    for (const [key, poem] of Object.entries(content.captions)) {
      expect(poem.lines, key).toHaveLength(2);
      expect(poem.source, key).toBeTruthy();
    }
    expect(content.hint).toBe('Chạm vào mặt nước · chạm hai lần để thả hoa đăng');
  });
});
