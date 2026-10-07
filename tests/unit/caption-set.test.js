// tests/unit/caption-set.test.js — chữ đi theo vật (GĐ 5): khóa của content.captions, chiếu điểm neo ra màn hình mỗi khung (GĐ 8: cả với camera trực giao), giờ theo đồng hồ cảnh.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { OrthographicCamera, PerspectiveCamera, WebGLCoordinateSystem, WebGPUCoordinateSystem } from 'three/webgpu';
import { createCaptionSet } from '../../src/engine/gpu/caption-set.js';
import { CAPTION_FADE, CAPTION_SECONDS } from '../../src/ui/captions.js';
import { fakeCaptions } from '../helpers/fake-ctx.js';

const CAPTIONS = {
  'tram-nam': { lines: ['Trăm năm trong cõi người ta', 'Chữ tài chữ mệnh khéo là ghét nhau'], source: 'Truyện Kiều', author: 'Nguyễn Du' },
  'cong-cha': { lines: ['Công cha như núi Thái Sơn', 'Nghĩa mẹ như nước trong nguồn chảy ra'], source: 'Ca dao' },
};

/** ui giả (thay cho ui/captions.js): ghi mọi lời gọi theo thứ tự. */
function fakeUi() {
  const calls = [];
  const record = (name) => (...args) => calls.push([name, ...args]);
  return { calls, show: record('show'), place: record('place'), fade: record('fade'), clear: record('clear'), dispose: record('dispose') };
}

/** Camera thật ở (0, 0, 10) nhìn về gốc tọa độ; khung 800 × 600. */
function make({ captions = CAPTIONS, debug = false } = {}) {
  const ui = fakeUi();
  const camera = new PerspectiveCamera(50, 800 / 600, 0.1, 100);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const time = { value: 2 };
  const set = createCaptionSet({ captions, ui, camera, time, size: () => ({ width: 800, height: 600 }), debug });
  return { ui, camera, time, set };
}
const ORIGIN = () => ({ x: 0, y: 0, z: 0 });
const names = (ui) => ui.calls.map(([name]) => name);
const lastPlace = (ui) => ui.calls.filter(([name]) => name === 'place').at(-1);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createCaptionSet', () => {
  it('keys lấy từ content.captions (mảng đông cứng); không có chữ (chữ tải hỏng) thì keys rỗng', () => {
    const { set } = make();
    expect(set.api.keys).toEqual(['tram-nam', 'cong-cha']);
    expect(Object.isFrozen(set.api.keys)).toBe(true);
    expect(createCaptionSet({ ui: fakeUi(), camera: new PerspectiveCamera(), time: { value: 0 }, size: () => ({ width: 1, height: 1 }) }).api.keys)
      .toEqual([]);
  });

  it('ctx.captions giả của test (fakeCaptions) cùng dạng với api thật: keys đông cứng, nên test của bức bắt được việc xáo khóa tại chỗ', () => {
    const real = make().set.api;
    const source = ['tram-nam', 'cong-cha'];
    const fake = fakeCaptions(source);
    expect(Object.keys(fake).sort()).toEqual(Object.keys(real).sort());
    expect(fake.keys).toEqual(real.keys);
    expect(Object.isFrozen(fake.keys)).toBe(true);
    expect(() => fake.keys.reverse()).toThrow(TypeError);
    expect(Object.isFrozen(source)).toBe(false); // đông cứng một bản sao, không đụng mảng của người gọi
  });

  it('khóa lạ không hiện gì; chỉ có ?debug mới cảnh báo (tiếng Việt)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const quiet = make();
    quiet.set.api.show('khong-co', ORIGIN);
    quiet.set.api.show('toString', ORIGIN); // tên trùng hàm của Object.prototype cũng là khóa lạ, không phải một bài thơ
    quiet.set.api.show('constructor', ORIGIN);
    quiet.set.step();
    expect(quiet.ui.calls).toEqual([]);
    expect(warn).not.toHaveBeenCalled();

    const loud = make({ debug: true });
    loud.set.api.show('khong-co', ORIGIN);
    expect(loud.ui.calls).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('không có chữ "khong-co"');
  });

  it('show đặt chữ ngay (chưa cần tới khung sau): điểm neo ở gốc tọa độ ra giữa khung (400, 300)', () => {
    const { ui, set } = make();
    set.api.show('tram-nam', ORIGIN);
    expect(names(ui)).toEqual(['show', 'place']);
    expect(ui.calls[0][1]).toBe(CAPTIONS['tram-nam']);
    const [, x, y, visible] = ui.calls[1];
    expect(x).toBeCloseTo(400, 6);
    expect(y).toBeCloseTo(300, 6);
    expect(visible).toBe(true);
  });

  it('điểm neo đi thì chữ đi theo: lên trên là y nhỏ đi, sang phải là x lớn hơn', () => {
    const { ui, set } = make();
    const point = { x: 0, y: 0, z: 0 };
    set.api.show('tram-nam', () => point);
    point.x = 1;
    point.y = 1;
    set.step();
    const [, x, y, visible] = lastPlace(ui);
    expect(visible).toBe(true);
    expect(x).toBeGreaterThan(400);
    expect(y).toBeLessThan(300);
  });

  it('điểm neo sau camera, ngoài khung, xa hơn far hay sát hơn near thì ẩn chữ, theo cả quy ước độ sâu của WebGL lẫn WebGPU', () => {
    const outside = {
      'sau lưng camera': { x: 0, y: 0, z: 20 }, // camera ở z = 10, nhìn về −z
      'lệch hẳn sang phải': { x: 100, y: 0, z: 0 },
      'cao hẳn lên trên': { x: 0, y: 100, z: 0 },
      'xa hơn far (100)': { x: 0, y: 0, z: -140 },
      'sát hơn near (0,1)': { x: 0, y: 0, z: 9.92 }, // trước camera 0,08: giữa camera và mặt phẳng near, vật ở đó bị cắt
    };
    // Renderer đổi camera sang quy ước của backend trước khi vẽ: z của NDC là [−1, 1] với WebGL, [0, 1] với WebGPU.
    for (const system of [WebGLCoordinateSystem, WebGPUCoordinateSystem]) {
      const { ui, camera, set } = make();
      camera.coordinateSystem = system;
      camera.updateProjectionMatrix();
      let point = ORIGIN();
      set.api.show('tram-nam', () => point);
      expect(lastPlace(ui)[3]).toBe(true);
      for (const [where, p] of Object.entries(outside)) {
        point = p;
        set.step();
        expect(lastPlace(ui)[3], `${where} (coordinateSystem ${system})`).toBe(false);
      }
      point = ORIGIN();
      set.step();
      expect(lastPlace(ui)[3]).toBe(true);
    }
  });

  it('GĐ 8: camera trực giao: neo ở điểm nhìn hiện giữa khung; neo sau lưng camera thì ẩn', () => {
    const ui = fakeUi();
    const camera = new OrthographicCamera(-4, 4, 3, -3, 0.1, 100);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    const set = createCaptionSet({ captions: CAPTIONS, ui, camera, time: { value: 2 }, size: () => ({ width: 800, height: 600 }) });
    const point = { x: 0, y: 0, z: 0 };
    set.api.show('tram-nam', () => point);
    set.step();
    const [, x, y, visible] = lastPlace(ui);
    expect(visible).toBe(true);
    expect(x).toBeCloseTo(400, 6);
    expect(y).toBeCloseTo(300, 6);
    point.z = 20;
    set.step();
    expect(lastPlace(ui)[3]).toBe(false);
  });

  it('anchor() trả null thì ẩn ở khung đó và không cảnh báo (bức nói khung này không có điểm neo); vào lại khung thì hiện', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { ui, set } = make();
    let point = null;
    set.api.show('tram-nam', () => point);
    expect(lastPlace(ui)[3]).toBe(false);
    point = ORIGIN();
    set.step();
    expect(lastPlace(ui)[3]).toBe(true);
    expect(names(ui).filter((n) => n === 'clear')).toEqual([]); // ẩn không phải gỡ: chữ còn trong vùng live
    expect(warn).not.toHaveBeenCalled();
  });

  it('camera vừa xoay mà ma trận chưa cập nhật (OrbitControls.update chỉ gọi lookAt): chiếu theo hướng mới, không trễ một khung', () => {
    const { ui, camera, set } = make();
    set.api.show('tram-nam', ORIGIN);
    camera.lookAt(5, 0, 0); // quay sang phải: gốc tọa độ trôi về bên trái khung
    set.step();
    expect(lastPlace(ui)[1]).toBeLessThan(400);
  });

  it(`hết ${CAPTION_SECONDS} giây (đồng hồ cảnh) thì clear; trước đó ${CAPTION_FADE} giây thì fade, một lần`, () => {
    const { ui, time, set } = make();
    set.api.show('tram-nam', ORIGIN); // t = 2: hiện tới t = 11, bắt đầu tan ở t = 9,8
    time.value = 2 + CAPTION_SECONDS - CAPTION_FADE - 0.1;
    set.step();
    expect(names(ui)).not.toContain('fade');
    time.value = 2 + CAPTION_SECONDS - CAPTION_FADE + 0.1;
    set.step();
    time.value += 0.5;
    set.step();
    expect(names(ui).filter((n) => n === 'fade')).toHaveLength(1);
    expect(lastPlace(ui)[3]).toBe(true); // đang tan vẫn đi theo điểm neo
    time.value = 2 + CAPTION_SECONDS;
    set.step();
    expect(names(ui).at(-1)).toBe('clear');
    const count = ui.calls.length;
    time.value += 1;
    set.step(); // đã gỡ: không còn gì để làm
    expect(ui.calls).toHaveLength(count);
  });

  it('anchor() ném lỗi thì chỉ ẩn chữ và cảnh báo một lần (không ném ra ngoài: không phải khung lỗi); số không hữu hạn, undefined cũng vậy', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { ui, set } = make();
    const boom = () => {
      throw new Error('vật đã bị gỡ');
    };
    expect(() => set.api.show('tram-nam', boom)).not.toThrow();
    expect(() => set.step()).not.toThrow();
    set.step();
    expect(ui.calls.filter(([name]) => name === 'place')).toEqual([['place', 0, 0, false], ['place', 0, 0, false], ['place', 0, 0, false]]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('tram-nam');

    warn.mockClear();
    set.api.show('cong-cha', () => ({ x: Number.NaN, y: 0, z: 0 })); // chữ mới: được cảnh báo một lần nữa
    set.step();
    expect(lastPlace(ui)).toEqual(['place', 0, 0, false]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('cong-cha');

    warn.mockClear();
    set.api.show('tram-nam', () => {}); // bức quên return: undefined là lỗi, khác null (null thì ẩn mà không báo)
    set.step();
    expect(lastPlace(ui)).toEqual(['place', 0, 0, false]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('đồng hồ đứng (?freeze) thì chữ ở lại, mỗi lần vẽ lại vẫn chiếu lại', () => {
    const { ui, set } = make();
    set.api.show('tram-nam', ORIGIN);
    for (let i = 0; i < 1000; i++) set.step();
    expect(names(ui)).not.toContain('fade');
    expect(names(ui)).not.toContain('clear');
    expect(names(ui).filter((n) => n === 'place')).toHaveLength(1001);
  });

  it('show mới thay show cũ: chữ mới, điểm neo mới, giờ tính lại từ lúc thả', () => {
    const { ui, time, set } = make();
    set.api.show('tram-nam', ORIGIN);
    time.value = 8;
    set.api.show('cong-cha', () => ({ x: 1, y: 0, z: 0 }));
    expect(ui.calls.filter(([name]) => name === 'show').map(([, poem]) => poem)).toEqual([CAPTIONS['tram-nam'], CAPTIONS['cong-cha']]);
    expect(lastPlace(ui)[1]).toBeGreaterThan(400); // đi theo điểm neo của chữ mới
    time.value = 2 + CAPTION_SECONDS + 1; // chữ cũ lẽ ra đã hết giờ; chữ mới (thả lúc t = 8) thì chưa
    set.step();
    expect(names(ui)).not.toContain('clear');
    time.value = 8 + CAPTION_SECONDS;
    set.step();
    expect(names(ui).at(-1)).toBe('clear');
  });

  it('không có chữ thì step() không làm gì; dispose gỡ vùng chữ, sau đó show và step không làm gì', () => {
    const { ui, set } = make();
    set.step();
    expect(ui.calls).toEqual([]);
    set.api.show('tram-nam', ORIGIN);
    set.dispose();
    expect(names(ui).at(-1)).toBe('dispose');
    const count = ui.calls.length;
    set.step();
    set.api.show('cong-cha', ORIGIN);
    expect(ui.calls).toHaveLength(count);
  });
});
