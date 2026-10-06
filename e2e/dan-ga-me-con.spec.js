// e2e/dan-ga-me-con.spec.js — Bức 4 · Đàn Gà Mẹ Con: camera trực giao vẽ tờ tranh giữa ván tối; chữ của trang nằm trên ván tối; độ sâu của camera trực giao; bản nét dò cạnh không thêm lượt vẽ; tranh tự khép lại (kéo rồi buông thì camera về góc của tranh); (Task 4–9) các lớp, cử chỉ, chất lượng.
import { test, expect } from '@playwright/test';
import { STAGE_ONLY, waitForSettled, waitForFrames, canvasRegions, collectConsole, gpuReport, twoFrames } from './helpers.js';

/** Tag của test khói: nếu CI bật ciWebgpuSmoke cho Bức 4 (Task 13), job WebGPU chỉ chạy các test này. */
const SMOKE = { tag: '@khoi' };
/**
 * Vùng (phần của canvas 640 × 400), chốt theo ảnh thật (GPU thật và SwiftShader; chốt lại sau điểm duyệt ảnh, Task 4: khung cao 13,2, vách
 * thấp 4,5). Khung nhìn 21,12 × 13,2 đơn vị; tờ giấy từ y 0,184 tới 0,765, x từ 0,169 tới 0,831; vách tới y 0,362, sàn phẳng từ y 0,557.
 * BOARD_TOP, BOARD_BOTTOM: ván tối trên và dưới tờ giấy. WALL: vách giấy, không có gà. HEN: mình gà mẹ, phía trên cánh và dưới con trèo
 * lưng (chỉ có màu vàng hòe, không nếp gấp nào). LEFT_EDGE: mép trái tờ giấy (nửa ván, nửa giấy): viền của Bản nét nằm ở đây. FLOOR: mặt
 * sàn trống phía trước bên trái, nghiêng so với camera: không có nét nào.
 */
const BOARD_TOP = { x0: 0.25, y0: 0.01, x1: 0.75, y1: 0.08 };
const BOARD_BOTTOM = { x0: 0.25, y0: 0.93, x1: 0.75, y1: 0.99 };
const WALL = { x0: 0.25, y0: 0.21, x1: 0.4, y1: 0.33 };
const HEN = { x0: 0.455, y0: 0.46, x1: 0.495, y1: 0.495 };
const LEFT_EDGE = { x0: 0.15, y0: 0.3, x1: 0.19, y1: 0.7 };
const FLOOR = { x0: 0.18, y0: 0.65, x1: 0.24, y1: 0.745 };

/**
 * Khung tờ giấy trên trang (px CSS), đo trên điểm ảnh của canvas (đã ẩn chữ): hàng có hơn 15% điểm ảnh sáng (giấy, gà) thuộc tờ giấy; cột
 * sáng ở hơn 30% số hàng ấy cũng vậy. Ván tối (màu xóa của canvas) không bao giờ sáng.
 */
async function sheetBox(page) {
  const canvas = page.locator('[data-stage] canvas');
  const box = await canvas.boundingBox();
  const png = await canvas.screenshot({ style: STAGE_ONLY });
  return page.evaluate(async ({ b64, at }) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = new OffscreenCanvas(img.width, img.height);
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, img.width, img.height).data;
    const bright = (x, y) => {
      const i = (y * img.width + x) * 4;
      return 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2] > 0.25 * 255;
    };
    const rows = [];
    const cols = new Array(img.width).fill(0);
    for (let y = 0; y < img.height; y++) {
      let n = 0;
      for (let x = 0; x < img.width; x++) if (bright(x, y)) { n += 1; cols[x] += 1; }
      if (n > 0.15 * img.width) rows.push(y);
    }
    const xs = cols.flatMap((n, x) => (n > 0.3 * rows.length ? [x] : []));
    const k = at.width / img.width;
    return { left: at.x + xs[0] * k, right: at.x + (xs.at(-1) + 1) * k, top: at.y + rows[0] * k, bottom: at.y + (rows.at(-1) + 1) * k };
  }, { b64: png.toString('base64'), at: box });
}

async function open(page, testInfo, frames, extra = '') {
  const query = testInfo.project.metadata.query ?? '';
  const freeze = frames ? `&freeze=${frames}` : '';
  await page.goto(`./tranh/dan-ga-me-con/?${query.replace(/^\?/, '')}${freeze}${extra}`);
  const settled = await waitForSettled(page, { timeout: 60_000 });
  expect(settled.state, `về tĩnh: ${settled.reason}`).toBe('live');
  if (frames) await waitForFrames(page, frames, { timeout: 120_000 });
}

/** Lột lớp về nấc "Depth" (nấc đầu bên trái), như e2e của Bức 3. */
async function depthView(page) {
  await page.evaluate(() => window.__sma.setTool('lot-lop'));
  const range = page.locator('[data-tool-slot="lot-lop"] input[type="range"]');
  await range.evaluate((el) => {
    el.value = '0';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(range).toHaveAttribute('aria-valuetext', 'Depth');
  await twoFrames(page);
}

test.beforeEach(async ({ page }, testInfo) => {
  const { kind, backend } = testInfo.project.metadata;
  if (kind !== '3d' || backend !== 'webgpu') return;
  await page.goto('./tranh/dan-ga-me-con/?static');
  test.skip(!(await gpuReport(page)).webgpu, 'Không có WebGPU adapter trong môi trường này');
});

test.describe('Đàn Gà Mẹ Con · khung', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('góc nhìn của tranh: camera trực giao vẽ tờ giấy giữa khung, hai dải ván tối ở trên và dưới; gà mẹ in màu vàng hòe', SMOKE, async ({ page }, testInfo) => {
    const log = collectConsole(page);
    await open(page, testInfo, 30);
    const r = await canvasRegions(page, { top: BOARD_TOP, bottom: BOARD_BOTTOM, wall: WALL, hen: HEN });
    await page.screenshot({ path: testInfo.outputPath('khung.png') });
    expect(r.top.mean, 'ván trên tối').toBeLessThan(0.08);
    expect(r.bottom.mean, 'ván dưới tối').toBeLessThan(0.08);
    expect(r.wall.mean, 'tờ giấy sáng hơn hẳn ván').toBeGreaterThan(r.top.mean + 0.15);
    // Bản màu (Task 4): mình gà mẹ có màu (đất sét chỉ chừng 0,05), và là màu vàng: đỏ, lục hơn hẳn lam.
    expect(r.hen.chroma, 'gà mẹ in màu').toBeGreaterThan(0.15);
    const [red, green, blue] = r.hen.rgb;
    expect(red - blue, `vàng hòe: ${r.hen.rgb.map(Math.round)}`).toBeGreaterThan(40);
    expect(green - blue, `vàng hòe: ${r.hen.rgb.map(Math.round)}`).toBeGreaterThan(20);
    expect(log.errors).toEqual([]);
  });

  test('độ sâu của camera trực giao: view Depth có độ dốc; gà (gần) sáng hơn vách (xa), không phải một bóng trắng', SMOKE, async ({ page }, testInfo) => {
    // Lỗi cũ (công thức phối cảnh trên độ sâu trực giao, Phụ lục A.89): mọi vật trắng như nhau, gà và vách bằng nhau.
    await open(page, testInfo, 30);
    await depthView(page);
    const r = await canvasRegions(page, { hen: HEN, wall: WALL });
    await page.screenshot({ path: testInfo.outputPath('depth.png') });
    expect(r.hen.mean, 'gà gần hơn vách').toBeGreaterThan(r.wall.mean + 0.02);
    expect(r.wall.mean, 'vách không trắng tinh').toBeLessThan(0.97);
  });

  test('Bản nét: viền đen ở mép tờ giấy, mặt sàn nghiêng không có nét; tắt Bản nét thì mất viền, mà số draw call không đổi', async ({ page }, testInfo) => {
    await open(page, testInfo, 0);
    await waitForFrames(page, 30, { timeout: 120_000 });
    const calls = () => page.evaluate(() => window.__sma.stats().drawCalls);
    const withInk = await canvasRegions(page, { edge: LEFT_EDGE, floor: FLOOR });
    await page.screenshot({ path: testInfo.outputPath('ban-net.png') });
    const before = await calls();
    await page.evaluate(() => window.__sma.setWeight('ban-net', 0));
    await twoFrames(page);
    await twoFrames(page);
    const without = await canvasRegions(page, { edge: LEFT_EDGE, floor: FLOOR });
    expect(withInk.edge.mean, 'có viền thì mép giấy tối hơn').toBeLessThan(without.edge.mean - 0.01);
    // Mẫu độ sâu lệch nửa điểm ảnh (đọc kiểu nearest) làm mặt sàn nghiêng thành sọc mực (Task 1): mẫu phải đối xứng, sàn không đổi.
    expect(Math.abs(withInk.floor.mean - without.floor.mean), 'mặt sàn không có nét').toBeLessThan(0.01);
    expect(await calls(), 'Bản nét đọc thẳng texture độ sâu: không thêm lượt vẽ').toBe(before);
    expect(before).toBeLessThanOrEqual(30);
  });
});

test.describe('Đàn Gà Mẹ Con · chữ trên ván tối', () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  // Điểm duyệt ảnh (Task 4): tờ giấy chiếm chừng 58% bề cao khung máy tính, nên chữ màu ngà của trang nằm trên ván tối, không trên giấy
  // sáng (spec §20.1). Khung đổi cỡ thì vẽ lại ở khung kế: chạy live, vì khung đã dừng (?freeze) chỉ bị xóa khi đổi cỡ.
  test('tên tranh, dải link ở trên và gợi ý, thơ ở dưới nằm trên ván tối, không đè lên tờ giấy: máy tính 16 : 10, 16 : 9, điện thoại dọc', async ({ page }, testInfo) => {
    const log = collectConsole(page);
    await open(page, testInfo, 0);
    for (const [width, height] of [[1280, 800], [1440, 900], [1920, 1080], [390, 844]]) {
      await page.setViewportSize({ width, height });
      await expect.poll(() => page.evaluate((w) => document.querySelector('[data-stage] canvas').clientWidth === w, width)).toBe(true);
      const frames = await page.evaluate(() => window.__sma.frames);
      await waitForFrames(page, frames + 3, { timeout: 120_000 });
      const sheet = await sheetBox(page);
      const text = await page.evaluate(() => Object.fromEntries(['header', '[data-hint]', '.poem'].map((sel) => {
        const r = document.querySelector(sel).getBoundingClientRect();
        return [sel, { top: r.top, bottom: r.bottom }];
      })));
      const at = `${width}×${height}: tờ giấy y ${Math.round(sheet.top)}–${Math.round(sheet.bottom)}`;
      expect(sheet.top, `${at}, tên tranh và dải link tới ${Math.round(text.header.bottom)}`).toBeGreaterThan(text.header.bottom + 2);
      expect(sheet.bottom, `${at}, gợi ý từ ${Math.round(text['[data-hint]'].top)}`).toBeLessThan(text['[data-hint]'].top - 2);
      expect(sheet.bottom, `${at}, thơ từ ${Math.round(text['.poem'].top)}`).toBeLessThan(text['.poem'].top - 2);
      expect([sheet.left > 0, sheet.right < width, sheet.top > 0, sheet.bottom < height], `${at}: cả tờ giấy trong khung`).toEqual([true, true, true, true]);
    }
    expect(log.errors).toEqual([]);
  });
});

test.describe('Đàn Gà Mẹ Con · tranh tự khép lại', () => {
  // Đồng hồ của cảnh theo khung vẽ, mỗi khung tối đa 0,1 s: 4,2 giây cảnh (3 giây chờ, 1,2 giây về) cần ít nhất 42 khung, nên máy vẽ chậm
  // (SwiftShader trên runner CI) cần lâu: trần rộng tay hơn 60 giây mặc định.
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });
  /** Số đo `goc` của Cốt: độ lệch của camera khỏi góc nhìn của tranh. */
  const goc = (page) => page.evaluate(() => Number(window.__sma.readouts('cot').find((r) => r.id === 'goc')?.value));
  /** Kéo ngang trên vách giấy (không chạm gà): OrbitControls xoay camera. */
  async function dragCamera(page) {
    const box = await page.locator('[data-stage] canvas').boundingBox();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.25);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.5 + 220, box.y + box.height * 0.25, { steps: 6 });
    await page.mouse.up();
  }

  test('kéo xoay thì góc lệch hơn 15°; buông tay rồi chờ thì camera về góc của tranh (dưới 1°)', SMOKE, async ({ page }, testInfo) => {
    const log = collectConsole(page);
    await open(page, testInfo, 0);
    await waitForFrames(page, 20, { timeout: 120_000 });
    expect(await goc(page)).toBeLessThan(1); // lúc mở trang camera đang ở góc của tranh
    await dragCamera(page);
    await expect.poll(() => goc(page), { timeout: 15_000 }).toBeGreaterThan(15);
    // Quán tính của OrbitControls tắt theo giây của cảnh (home.js), nên về tới nơi rồi camera không trôi đi nữa, kể cả khi máy vẽ chậm.
    await expect.poll(() => goc(page), { timeout: 90_000 }).toBeLessThan(1);
    await twoFrames(page);
    expect(await goc(page), 'về rồi thì ở lại').toBeLessThan(1);
    expect(log.errors).toEqual([]);
  });

  test('giảm chuyển động: buông tay thì camera đứng yên, đủ 3 giây cảnh thì về MỘT bước (không lượn qua các góc ở giữa)', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, testInfo, 0);
    await waitForFrames(page, 20, { timeout: 120_000 });
    await dragCamera(page);
    await expect.poll(() => goc(page), { timeout: 15_000 }).toBeGreaterThan(15);
    // Giảm chuyển động thì OrbitControls không có quán tính: vài khung sau, mọi cú dời của con trỏ đã áp xong và góc đứng yên ở chỗ
    // buông (không thì mẫu đầu chưa phải điểm đi). Năm khung của cảnh chỉ tốn tối đa 0,5 giây cảnh trong 3 giây chờ.
    const frames = await page.evaluate(() => window.__sma.frames);
    await page.waitForFunction((n) => window.__sma.frames >= n + 5, frames, { timeout: 60_000 });
    // Ghi `goc` ở MỖI khung rAF của trang, từ đây tới lúc về tới nơi.
    await page.evaluate(() => {
      const samples = [];
      window.__gocSamples = samples;
      const tick = () => {
        samples.push(Number(window.__sma.readouts('cot').find((r) => r.id === 'goc')?.value));
        window.__gocRaf = requestAnimationFrame(tick);
      };
      tick();
    });
    await expect.poll(() => goc(page), { timeout: 90_000 }).toBeLessThan(1);
    const samples = await page.evaluate(() => {
      cancelAnimationFrame(window.__gocRaf);
      return window.__gocSamples;
    });
    const first = samples[0];
    expect(first, 'mẫu đầu là điểm đi').toBeGreaterThan(15);
    // Về một bước: mọi mẫu hoặc còn ở chỗ cũ (≥ mẫu đầu − 1°), hoặc đã ở nhà (≤ 1°); không mẫu nào lượn ở giữa.
    const between = samples.filter((g) => g < first - 1 && g > 1);
    expect(between, `góc lượn giữa đường: ${samples.join(', ')}`).toEqual([]);
    expect(samples.at(-1)).toBeLessThanOrEqual(1);
  });
});
