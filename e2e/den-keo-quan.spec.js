// e2e/den-keo-quan.spec.js — tương tác và hình ảnh riêng của Bức 2: bóng hình nhân chạy trên vách, mài lớp, cử chỉ, chất lượng, thí nghiệm.
import { test, expect } from '@playwright/test';
import {
  waitForSettled, waitForFrames, canvasRegions, gpuReport, collectConsole, readSma, tapAt, swipeAt,
} from './helpers.js';

const AT = 'at=2026-09-28T21:00';
// Vùng vách sau (tỉ lệ khung 640×400 của e2e), gần hết bề rộng giữa hai cột: bóng đoàn quân phủ vùng này ở mọi khung. Chốt lại
// theo bố cục cuối.
const WALL = { x0: 0.15, y0: 0.15, x1: 0.85, y1: 0.85 };
// Trần ngay trên đèn (vầng sáng qua miệng đèn, vành chóp và bóng chong chóng), sàn ngay dưới đèn (đế che). Tỉ lệ khung 640×400;
// chốt lại theo bố cục cuối.
const CEILING = { x0: 0.3, y0: 0, x1: 0.7, y1: 0.07 };
const FLOOR = { x0: 0.35, y0: 0.93, x1: 0.65, y1: 1 };
// Dải sàn sát chân vách sau: tia từ lửa tới đây đi DƯỚI dải hình nhân, trên đế (cách trục 1,45–1,98 m), nên không có bóng hình nhân.
const FLOOR_RING = { x0: 0.4, y0: 0.885, x1: 0.6, y1: 0.905 };
// Góc xa đèn: chân vách trái và sàn sát vách (cách ngọn lửa 2,5–3,2 m). Tỉ lệ khung 640×400.
const FAR = { x0: 0, y0: 0.55, x1: 0.1, y1: 1 };
// Sàn bên trái, ngoài vùng tối dưới đế đèn. Tỉ lệ khung 640×400.
const FLOOR_FAR = { x0: 0.02, y0: 0.9, x1: 0.22, y1: 1 };
// Giữa tấm giấy quay về camera, tránh hai nan tre (tre vàng dưới đèn xưởng cũng là điểm ấm). Tỉ lệ khung 640×400.
const LANTERN_BOX = { x0: 0.477, y0: 0.45, x1: 0.508, y1: 0.56 };
// Vách sau, hai bên vạch bóng của nan tre bên phải: sau tấm vàng lá (giữa đèn và vạch) và sau tấm đỏ son (giữa vạch và cột phải).
const GOLD_ZONE = { x0: 0.56, y0: 0.2, x1: 0.64, y1: 0.8 };
const RED_ZONE = { x0: 0.68, y0: 0.2, x1: 0.8, y1: 0.8 };
/** Độ ngả đỏ của một vùng: R / G của màu trung bình (không phụ thuộc độ sáng). */
const redness = (region) => region.rgb[0] / Math.max(region.rgb[1], 1);

let log;
test.beforeEach(async ({ page }, testInfo) => {
  log = collectConsole(page);
  const { kind, backend } = testInfo.project.metadata;
  if (kind === 'static') return;
  if (backend === 'webgpu') {
    await page.goto('./tranh/den-keo-quan/?static');
    test.skip(!(await gpuReport(page)).webgpu, 'Không có WebGPU adapter trong môi trường này');
  }
});
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;
  const sma = await readSma(page).catch(() => null);
  await testInfo.attach('sma.txt', { body: JSON.stringify(sma, null, 2), contentType: 'text/plain' });
  await testInfo.attach('console.txt', { body: log.all.join('\n') || '(console trống)', contentType: 'text/plain' });
});

/** Mở Bức 2 ở ?freeze=frames (cùng ?at), chờ live rồi chờ đủ khung. `extra` là chuỗi query thêm, bắt đầu bằng '&'. */
async function open(page, testInfo, frames, extra = '') {
  const { query } = testInfo.project.metadata;
  await page.goto(`./tranh/den-keo-quan/?${query.replace(/^\?/, '')}&${AT}&freeze=${frames}${extra}`);
  const settled = await waitForSettled(page, { timeout: 60_000 });
  expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
  return waitForFrames(page, frames, { timeout: 120_000 });
}
const wallOf = async (page) => (await canvasRegions(page, { wall: WALL })).wall;
/**
 * Đứng yên mọi thứ trừ trống: lửa thôi nhấp nháy, Phủ bóng về 0 (hạt của nó đổi theo từng khung). Gọi page.emulateMedia({ reducedMotion })
 * trước open để camera không thở. Hai khung khác nhau thì chỉ còn trống và chong chóng quay làm ảnh đổi.
 */
async function onlyDrum(page) {
  await page.evaluate(() => window.__sma.restore({ knobs: { 'ngon-nen.flicker': 0 } }));
  await page.evaluate(() => window.__sma.setWeight('phu-bong', 0)); // vẽ lại khung đứng yên
}

/**
 * Bật/tắt một thí nghiệm như người xem. Bấm Tab (lần tương tác đầu, không chạm canvas: chạm là thổi nến; phím bổ trợ đứng một mình
 * như Shift thì input.js bỏ qua) cho lời mời hiện ra,
 * vào chế độ mài, phủ lại mọi lớp về 1 (chế độ mài đưa chúng về 0), mở trang Phá của lớp rồi bấm nút. KHÔNG thêm hàm nào vào __sma:
 * GĐ 6 không đổi JS của xưởng (spec §18.6).
 */
async function toggleExperiment(page, layerId, expId, on) {
  if ((await page.locator('[data-rail]').count()) === 0 || !(await page.locator('[data-rail]').isVisible())) {
    await page.keyboard.press('Tab');
    await page.locator('[data-hint] button').click();
    for (const { id } of await page.evaluate(() => window.__sma.layers())) await page.evaluate((l) => window.__sma.setWeight(l, 1), id);
  }
  await page.locator(`[data-rail] [data-layer="${layerId}"] .rail-name`).click();
  const notebook = page.locator('[data-notebook]');
  await notebook.locator('[data-tab="pha"]').click();
  const button = notebook.locator(`[data-experiment="${expId}"]`);
  if ((await button.getAttribute('aria-pressed')) !== String(on)) await button.click();
  await expect(button).toHaveAttribute('aria-pressed', String(on));
}

test.describe('Đèn Kéo Quân · bóng trên vách', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('đoàn quân in bóng lên vách sau và chạy theo thời gian (do trống quay); cùng khung thì giống hệt; mài Kéo quân về 0 thì vách sáng lên', async ({ page }, testInfo) => {
    test.setTimeout(300_000);
    await page.emulateMedia({ reducedMotion: 'reduce' }); // camera không thở (trống vẫn quay, chậm còn một nửa)
    const frame = async (n) => {
      await open(page, testInfo, n);
      await onlyDrum(page);
      return wallOf(page);
    };
    const a = await frame(60);
    const again = await frame(60);
    expect(again.checksum, 'cùng ?at&freeze phải ra cùng ảnh').toBe(a.checksum);
    const b = await frame(120);
    expect(b.checksum, 'khung 60 và 120 phải khác: trống đã quay (hạt và nhấp nháy đã tắt)').not.toBe(a.checksum);
    await page.evaluate(() => window.__sma.setWeight('keo-quan', 0));
    const flat = await wallOf(page);
    // So cùng một vùng trước/sau khi mài: node bóng không được dùng thì hai ảnh như nhau. Không dùng độ lệch chuẩn: chiếc đèn (khối
    // tối, tương phản mạnh) nằm trong vùng và chi phối nó, nên tỉ lệ dao động quanh 0,8 theo vị trí của đoàn quân.
    expect(flat.mean, 'hết bóng thì vách sáng hơn rõ').toBeGreaterThan(b.mean * 1.05);
    expect(log.errors).toEqual([]);
  });

  test('nửa tối theo cỡ lửa: "Nguồn sáng là một điểm" làm mép bóng trên vách gắt hơn (độ lệch chuẩn tăng)', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await open(page, testInfo, 60);
    const soft = await wallOf(page);
    await toggleExperiment(page, 'keo-quan', 'pointLight', true); // vẽ lại khung đứng yên (?freeze), cùng thời điểm
    const hard = await wallOf(page);
    expect(hard.std).toBeGreaterThan(soft.std);
    expect(log.errors).toEqual([]);
  });

  test('trần có vầng sáng mang bóng chong chóng xoay; sàn ngay dưới đèn tối vì đế che (mài Kéo quân về 0 thì sáng lên)', async ({ page }, testInfo) => {
    test.setTimeout(240_000);
    await page.emulateMedia({ reducedMotion: 'reduce' }); // camera không thở: trần đổi chỉ vì chong chóng quay
    await open(page, testInfo, 60);
    await onlyDrum(page);
    const a = await canvasRegions(page, { ceiling: CEILING, under: FLOOR });
    await open(page, testInfo, 75);
    await onlyDrum(page);
    const b = await canvasRegions(page, { ceiling: CEILING });
    expect(b.ceiling.checksum, 'chong chóng quay: trần đổi giữa hai khung').not.toBe(a.ceiling.checksum);
    // So cùng một vùng: góc sàn xa đèn vốn tối hơn vì luật nghịch đảo bình phương, nên không so hai vùng khác nhau.
    await page.evaluate(() => window.__sma.setWeight('keo-quan', 0));
    const c = await canvasRegions(page, { under: FLOOR });
    expect(a.under.mean, 'đế che: sàn dưới đèn tối hơn khi chưa mài Kéo quân').toBeLessThan(c.under.mean * 0.8);
    expect(log.errors).toEqual([]);
  });

  test('nửa tối lớn (penumbra 2) không làm tối oan dải sàn sát chân vách, nơi tia đi dưới dải hình nhân', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await open(page, testInfo, 60);
    const sharp = (await canvasRegions(page, { ring: FLOOR_RING })).ring;
    await page.evaluate(() => window.__sma.restore({ knobs: { 'keo-quan.penumbra': 2 } })); // restore vẽ lại khung đứng yên
    const soft = (await canvasRegions(page, { ring: FLOOR_RING })).ring;
    // Đo lúc sửa (GPU thật): 0,79 khi mip cao lẫn vạch đất vào hàng mép bị kẹp của mặt nạ; 0,93 khi có cửa sổ ngoài dải.
    expect(soft.mean).toBeGreaterThan(sharp.mean * 0.88);
    expect(log.errors).toEqual([]);
  });

  test('núm figures và sides dựng lại mặt nạ (texture có mip) và đèn trên GPU: bóng đổi, không lỗi', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await open(page, testInfo, 60);
    const before = await wallOf(page);
    await page.evaluate(() => window.__sma.restore({ knobs: { 'cot.figures': 10, 'cot.sides': 8 } }));
    const after = await wallOf(page);
    expect(after.checksum).not.toBe(before.checksum);
    expect(await page.evaluate(() => window.__sma.state)).toBe('live');
    expect(log.errors).toEqual([]);
  });

  test('node bóng tự viết không vẽ shadow map nào: draw call ở mức cao không có phần bóng', async ({ page }, testInfo) => {
    await open(page, testInfo, 30, '&level=cao');
    const { drawCalls } = await page.evaluate(() => window.__sma.stats());
    expect(drawCalls).toBeLessThanOrEqual(30); // cube shadow map sẽ thêm ≥ 6 × số vật đổ bóng; trần chung của bức là 45
  });

  test('mức thấp chạy được: live, không lỗi console, draw call như mức cao (chỉ ít điểm ảnh và ít tầng noise hơn)', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await open(page, testInfo, 30, '&level=thap');
    expect(await page.evaluate(() => window.__sma.level)).toBe('thap');
    const { drawCalls } = await page.evaluate(() => window.__sma.stats());
    expect(drawCalls).toBeLessThanOrEqual(30);
    expect(log.errors).toEqual([]);
  });
});

test.describe('Đèn Kéo Quân · ngọn nến', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('"Ánh sáng không suy giảm": góc xa đèn sáng lên rõ (luật nghịch đảo bình phương bị bỏ)', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await open(page, testInfo, 60);
    const before = (await canvasRegions(page, { far: FAR })).far;
    await toggleExperiment(page, 'ngon-nen', 'noDecay', true); // vẽ lại khung đứng yên, cùng thời điểm
    const after = (await canvasRegions(page, { far: FAR })).far;
    expect(after.mean).toBeGreaterThan(before.mean * 1.3);
    expect(log.errors).toEqual([]);
  });

  test('"Tắt nhấp nháy": hai khung khác nhau giống hệt ở vùng vách; còn nhấp nháy thì khác', async ({ page }, testInfo) => {
    test.setTimeout(420_000);
    await page.emulateMedia({ reducedMotion: 'reduce' }); // camera không thở: giữa hai khung chỉ còn ngọn nến đổi
    const still = async (frames, steady) => {
      await open(page, testInfo, frames);
      if (steady) await toggleExperiment(page, 'ngon-nen', 'steady', true);
      // Bóng đoàn quân (trống quay) và hạt của Phủ bóng (đổi theo khung) cũng đổi giữa hai khung: mài về 0, chỉ còn ánh nến.
      for (const id of ['keo-quan', 'phu-bong']) await page.evaluate((l) => window.__sma.setWeight(l, 0), id);
      return wallOf(page);
    };
    const [a, b] = [await still(60, false), await still(90, false)];
    expect(b.checksum, 'nến nhấp nháy: khung 60 và 90 phải khác').not.toBe(a.checksum);
    const [c, d] = [await still(60, true), await still(90, true)];
    expect(d.checksum, 'tắt nhấp nháy: khung 60 và 90 giống hệt').toBe(c.checksum);
    expect(log.errors).toEqual([]);
  });
});

test.describe('Đèn Kéo Quân · gian nhà', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('gạch bát có màu: sàn đậm sắc hơn rõ khi Gian nhà = 1 so với đất sét (Gian nhà = 0)', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await open(page, testInfo, 60);
    const painted = (await canvasRegions(page, { floor: FLOOR_FAR })).floor;
    await page.evaluate(() => window.__sma.setWeight('gian-nha', 0));
    const clay = (await canvasRegions(page, { floor: FLOOR_FAR })).floor;
    expect(painted.chroma).toBeGreaterThan(clay.chroma * 1.2);
    expect(log.errors).toEqual([]);
  });
});

test.describe('Đèn Kéo Quân · giấy', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('giấy sáng lên từ bên trong (điểm ấm) và nhuộm màu ánh sáng ra vách theo tấm; mài Giấy về 0 thì hết cả hai', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await open(page, testInfo, 60);
    const regions = { lantern: LANTERN_BOX, gold: GOLD_ZONE, red: RED_ZONE };
    const lit = await canvasRegions(page, regions);
    await page.evaluate(() => window.__sma.setWeight('giay', 0));
    const bare = await canvasRegions(page, regions);
    expect(lit.lantern.warm, 'giấy sáng: có điểm ấm').toBeGreaterThan(0);
    expect(bare.lantern.warm, 'giấy là đất sét: không điểm ấm').toBe(0);
    // So SẮC, không so độ sắc tuyệt đối: giấy nhuộm làm vách tối đi, nên (max − min) giảm dù màu đậm hơn. Cùng một khung (cùng bóng
    // hình nhân), không có giấy thì hai vùng cùng một ánh nến; có giấy thì vùng sau tấm đỏ son ngả đỏ hơn hẳn vùng sau tấm vàng lá.
    // Đo lúc làm (khung 60, cả hai backend): 0,27 khi có giấy, 0,05 khi không.
    const gap = (r) => redness(r.red) - redness(r.gold);
    expect(gap(lit), 'ánh sáng mang màu tấm giấy nó đi qua').toBeGreaterThan(gap(bare) + 0.1);
    expect(log.errors).toEqual([]);
  });

  test('"Giấy trong suốt" lộ trống bên trong; tắt Ngọn nến thì đèn chỉ còn là giấy và đất, không phát sáng', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await open(page, testInfo, 60);
    const before = (await canvasRegions(page, { lantern: LANTERN_BOX })).lantern;
    await toggleExperiment(page, 'giay', 'clear', true);
    const clear = (await canvasRegions(page, { lantern: LANTERN_BOX })).lantern;
    expect(clear.checksum, 'thấy trống và hình nhân bên trong').not.toBe(before.checksum);
    await page.evaluate(() => window.__sma.setWeight('ngon-nen', 0));
    const dark = (await canvasRegions(page, { lantern: LANTERN_BOX })).lantern;
    expect(dark.warm, 'không có ánh nến thì giấy trong suốt cũng không sáng').toBe(0);
    expect(log.errors).toEqual([]);
  });
});

test.describe('Đèn Kéo Quân · Shadow map thật', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  /** Chờ thêm n khung của vòng lặp: draw call chỉ được đo ở khung của vòng lặp, không ở lần vẽ lại khung đứng yên (?freeze). */
  async function moreFrames(page, n) {
    const frames = await page.evaluate(() => window.__sma.frames);
    await waitForFrames(page, frames + n, { timeout: 120_000 });
  }
  const drawCalls = (page) => page.evaluate(() => window.__sma.stats().drawCalls);

  test('bật: thêm ít nhất 6 lượt vẽ bóng, cảnh vẫn live, vách vẫn có bóng hình nhân (trống cắt hình trong lượt vẽ bóng); tắt: draw call về như cũ', async ({ page }, testInfo) => {
    test.setTimeout(300_000);
    const { query } = testInfo.project.metadata;
    await page.goto(`./tranh/den-keo-quan/?${query.replace(/^\?/, '')}&${AT}`);
    const settled = await waitForSettled(page, { timeout: 60_000 });
    expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
    await toggleExperiment(page, 'keo-quan', 'shadowMap', false); // mở Sổ tay ở trang Phá, chưa bật gì
    await moreFrames(page, 10);
    const off = await drawCalls(page);
    const gobo = await wallOf(page);
    await toggleExperiment(page, 'keo-quan', 'shadowMap', true); // lần bật đầu: dựng đèn thứ hai, biên dịch lại một lần
    await moreFrames(page, 10);
    expect(await page.evaluate(() => window.__sma.state)).toBe('live');
    expect(await drawCalls(page), 'cube shadow map: 6 mặt × số vật đổ bóng').toBeGreaterThanOrEqual(off + 6);
    const real = await wallOf(page);
    expect(real.std, 'vách có bóng hình nhân, không phải một vành tối liền').toBeGreaterThan(gobo.std * 0.7);
    await toggleExperiment(page, 'keo-quan', 'shadowMap', false);
    await moreFrames(page, 10);
    expect(await drawCalls(page), 'tắt: không vẽ bóng nữa').toBe(off);
    expect(log.errors).toEqual([]);
  });

  test('mức thấp: Sổ tay › Kéo quân › Phá không có "Shadow map thật"', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await open(page, testInfo, 30, '&level=thap');
    await toggleExperiment(page, 'keo-quan', 'naive', false); // mở trang Phá của Kéo quân, không đổi gì
    await expect(page.locator('[data-notebook] [data-experiment="shadowMap"]')).toHaveCount(0);
    expect(log.errors).toEqual([]);
  });
});

test.describe('Đèn Kéo Quân · cử chỉ', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  /** Mở Bức 2 KHÔNG đóng băng: đồng hồ của cảnh chạy thật. Mọi lần chờ dùng số đo, không chờ cứng theo giây (đồng hồ của cảnh trên
   * GPU phần mềm có thể chậm hơn đồng hồ tường). */
  async function live(page, testInfo) {
    const { query } = testInfo.project.metadata;
    await page.goto(`./tranh/den-keo-quan/?${query.replace(/^\?/, '')}&${AT}`);
    const settled = await waitForSettled(page, { timeout: 60_000 });
    expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
  }
  /** Chờ tới khi số đo `id` của lớp `layer` thỏa `op` so với `value`. */
  const until = (page, layer, id, op, value, timeout) => page.waitForFunction(([l, i, o, v]) => {
    const r = window.__sma.readouts(l).find((x) => x.id === i)?.value;
    return typeof r === 'number' && (o === '>' ? r > v : r < v);
  }, [layer, id, op, value], { timeout });

  test('chạm thì thổi nến: lửa ngả rồi đứng lại', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await live(page, testInfo);
    await tapAt(page, 0.5, 0.5);
    await until(page, 'ngon-nen', 'lean', '>', 2, 10_000);
    await until(page, 'ngon-nen', 'lean', '<', 0.5, 30_000);
    expect(log.errors).toEqual([]);
  });

  test('giữ thì trống dừng, thả thì quay lại; vuốt thì quay nhanh hơn tốc độ thường', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await live(page, testInfo);
    const box = await page.locator('[data-stage] canvas').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.6);
    await page.mouse.down();
    await until(page, 'keo-quan', 'rpm', '<', 0.3, 15_000);
    await page.mouse.up();
    await until(page, 'keo-quan', 'rpm', '>', 3, 30_000);
    await swipeAt(page, 0.3, 0.6, { dx: 220 });
    await until(page, 'keo-quan', 'rpm', '>', 9, 10_000);
    expect(log.errors).toEqual([]);
  });
});
