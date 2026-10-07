// e2e/dan-ga-me-con.spec.js — Bức 4 · Đàn Gà Mẹ Con: camera trực giao vẽ tờ tranh giữa ván tối; chữ của trang nằm trên ván tối (cả ở laptop màn thấp); độ sâu của camera trực giao; bản nét dò cạnh không thêm lượt vẽ, có nét trong (vảy lông trên mình gà mẹ, tách khỏi viền), lệch bản, không vệt mực ở mép khung, hai thí nghiệm; tranh tự khép lại (kéo rồi buông thì camera về góc của tranh). Giấy điệp ở e2e/dan-ga-me-con-giay.spec.js, Đàn gà (cử chỉ, thóc) ở e2e/dan-ga-me-con-dan-ga.spec.js, chất lượng (draw call, mức thấp, mọi thí nghiệm) ở e2e/dan-ga-me-con-chat-luong.spec.js; tiện ích và các vùng dùng chung ở e2e/dan-ga-me-con.helpers.js.
import { test, expect } from '@playwright/test';
import { waitForFrames, canvasRegions, collectConsole, twoFrames, toggleExperiment } from './helpers.js';
import {
  BOARD_BOTTOM, BOARD_TOP, FLOOR, HEN, LEFT_EDGE, PAPER_MID, SMOKE, WALL, ZOOM_ABOVE, ZOOM_BOTTOM, dragCamera, goc, layerView, open,
  sheetBox, skipWithoutWebgpu,
} from './dan-ga-me-con.helpers.js';

test.beforeEach(skipWithoutWebgpu);

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
    await layerView(page, '0', 'Depth');
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
    // Vùng sàn phải là giấy (như phép phóng to): ván tối ở đó thì hiệu số nhỏ mà không kiểm được gì (vùng lệch khỏi tờ giấy, bố cục đổi).
    expect(withInk.floor.mean, 'vùng sàn là giấy sáng, không phải ván tối').toBeGreaterThan(0.2);
    expect(Math.abs(withInk.floor.mean - without.floor.mean), 'mặt sàn không có nét').toBeLessThan(0.01);
    expect(await calls(), 'Bản nét đọc thẳng texture độ sâu: không thêm lượt vẽ').toBe(before);
    expect(before).toBeLessThanOrEqual(30);
  });
});

test.describe('Đàn Gà Mẹ Con · bản nét', () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('mài Bản nét về 0 thì giữa tờ giấy sáng hẳn lên: viền, vảy lông, mắt, cánh đều là mực của Bản nét', SMOKE, async ({ page }, testInfo) => {
    const log = collectConsole(page);
    await open(page, testInfo, 60);
    const withInk = await canvasRegions(page, { mid: PAPER_MID, hen: HEN });
    await page.screenshot({ path: testInfo.outputPath('co-net.png') });
    await page.evaluate(() => window.__sma.setWeight('ban-net', 0));
    await twoFrames(page);
    const without = await canvasRegions(page, { mid: PAPER_MID, hen: HEN });
    expect(withInk.mid.mean, `có nét ${withInk.mid.mean.toFixed(3)}, không nét ${without.mid.mean.toFixed(3)}`).toBeLessThan(without.mid.mean - 0.02);
    // Nét trong riêng (không lẫn viền): mình gà mẹ phía trên cánh không có viền hay nếp gấp nào, chỉ có vảy lông. Ở khung 640 × 400 đã nới
    // (shortFrame), DPR 1, vảy lông mảnh nên vùng chỉ sẫm chừng 0,04 (đo lại sau lượt CI đầu, SwiftShader: 0,036 WebGL2, 0,040 WebGPU);
    // không có nét trong thì không đổi gì (GĐ 8 Task 9: 0,001).
    expect(withInk.hen.mean, `vảy lông: có nét ${withInk.hen.mean.toFixed(4)}, không nét ${without.hen.mean.toFixed(4)}`).toBeLessThan(without.hen.mean - 0.005);
    expect(log.errors).toEqual([]);
  });

  test('lệch bản: misregister 6 thì viền ở mép giấy dời đi (ảnh khác lúc 0); không lỗi', async ({ page }, testInfo) => {
    const log = collectConsole(page);
    await open(page, testInfo, 30);
    await page.evaluate(() => window.__sma.restore({ knobs: { 'ban-net.misregister': 0 } })); // restore vẽ lại khung đứng yên
    const aligned = await canvasRegions(page, { edge: LEFT_EDGE });
    await page.evaluate(() => window.__sma.restore({ knobs: { 'ban-net.misregister': 6 } }));
    const shifted = await canvasRegions(page, { edge: LEFT_EDGE });
    await page.screenshot({ path: testInfo.outputPath('lech-ban-6.png') });
    expect(shifted.edge.checksum).not.toBe(aligned.edge.checksum);
    expect(log.errors).toEqual([]);
  });

  test('phóng to 2,5 lần cho tờ giấy chạm khung: không có vệt mực giả dọc mép khung (mẫu độ sâu ra ngoài khung bị bỏ)', async ({ page }, testInfo) => {
    // Mẫu ngoài khung đọc điểm ảnh ở mép (Phụ lục A.99). Không lệch bản thì mẫu dưới của hàng sát mép dưới đọc lại chính điểm giữa: mặt sàn
    // nghiêng ra góc gãy 70°, và hàng ấy thành vệt mực khi chưa bỏ cặp mẫu ngoài khung.
    // Khung 1280 × 800 (không nới theo shortFrame): ở 640 × 400 khung nhìn cao gấp 1,3, phóng 2,5 thì mép trước tờ giấy chỉ cách mép dưới
    // khung chừng 4 điểm ảnh, sát vùng đo; ở đây hàng sát mép dưới là sàn trống, xa mép giấy, như lúc chốt vùng.
    await page.setViewportSize({ width: 1280, height: 800 });
    const log = collectConsole(page);
    await open(page, testInfo, 30);
    const box = await page.locator('[data-stage] canvas').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -3000); // OrbitControls: zoom kẹp ở 2,5 (CameraSpec.zoom)
    await page.evaluate(() => window.__sma.restore({ knobs: { 'ban-net.misregister': 0 } })); // vẽ lại khung đứng yên với camera mới
    const r = await canvasRegions(page, { bottom: ZOOM_BOTTOM, above: ZOOM_ABOVE });
    await page.screenshot({ path: testInfo.outputPath('zoom-2.5.png') });
    // Hai vùng phải là giấy (chừng 0,5): ván tối ở cả hai thì hiệu số nhỏ mà không kiểm được gì (khung chưa phóng to, hay bố cục đổi).
    expect(r.above.mean, 'vùng ngay trên mép dưới là giấy sáng, không phải ván tối').toBeGreaterThan(0.2);
    expect(Math.abs(r.bottom.mean - r.above.mean), `mép dưới ${r.bottom.mean.toFixed(3)}, ngay trên ${r.above.mean.toFixed(3)}`).toBeLessThan(0.02);
    expect(log.errors).toEqual([]);
  });

  test('bật lần lượt Chỉ bản nét và Dò cạnh theo màu: ảnh đổi, không lỗi console', async ({ page }, testInfo) => {
    const log = collectConsole(page);
    await open(page, testInfo, 30);
    const before = await canvasRegions(page, { mid: PAPER_MID });
    for (const exp of ['chiNet', 'netTheoMau']) {
      await toggleExperiment(page, 'ban-net', exp, true);
      await twoFrames(page);
      const on = await canvasRegions(page, { mid: PAPER_MID });
      await page.screenshot({ path: testInfo.outputPath(`${exp}.png`) });
      expect(on.mid.checksum, exp).not.toBe(before.mid.checksum);
      await toggleExperiment(page, 'ban-net', exp, false);
    }
    expect(log.errors).toEqual([]);
  });
});

test.describe('Đàn Gà Mẹ Con · chữ trên ván tối', () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  // Điểm duyệt ảnh (Task 4): tờ giấy chiếm chừng 58% bề cao khung máy tính, nên chữ màu ngà của trang nằm trên ván tối, không trên giấy
  // sáng (spec §20.1). Laptop màn thấp (trang của 1366 × 768 chỉ còn chừng 1366 × 650): CameraSpec.shortFrame nới khung nhìn dưới 800
  // điểm ảnh CSS (spec §20.2). Gộp sáu khung vào một test, đổi cỡ trên trang đang chạy live, thì runner CI (SwiftShader) quá trần 180
  // giây (lượt CI đầu của PR #9): ở 1920 × 1080 mỗi khung vẽ lâu, mà ảnh chụp và page.evaluate phải chen giữa các khung ấy. Nên mỗi khung
  // một test, và trang đứng yên lúc chụp: mở ở khung mặc định với ?freeze như mọi test khác (khởi động và mười khung vẽ ở 640 × 400, khung
  // ẩn trong hạn 10 giây của boot không vẽ ở cỡ lớn), đổi cỡ, rồi __sma.restore vẽ lại khung đứng yên ở cỡ mới (đổi cỡ chỉ xóa nó): một
  // lần vẽ ở cỡ lớn.
  for (const [label, width, height] of [
    ['laptop màn thấp', 1366, 650],
    ['laptop màn thấp 16 : 9', 1280, 720],
    ['máy tính 16 : 10', 1280, 800],
    ['máy tính 16 : 10', 1440, 900],
    ['máy tính 16 : 9', 1920, 1080],
    ['điện thoại dọc', 390, 844],
  ]) {
    test(`${label} ${width} × ${height}: tên tranh, dải link ở trên và gợi ý, thơ ở dưới nằm trên ván tối, không đè lên tờ giấy`, async ({ page }, testInfo) => {
      const log = collectConsole(page);
      await open(page, testInfo, 10);
      const canvas = () => page.evaluate(() => {
        const c = document.querySelector('[data-stage] canvas');
        return [c.clientWidth, c.clientHeight, c.width, c.height];
      });
      const [cssWidth, , bufferWidth] = await canvas();
      const ratio = bufferWidth / cssWidth; // tỉ lệ điểm ảnh của renderer (DPR, kẹp theo mức): không đổi theo cỡ khung
      await page.setViewportSize({ width, height });
      // Đợi cả bộ đệm vẽ đổi cỡ (ResizeObserver của stage.js đã chạy), không chỉ khung CSS: vẽ lại trước lúc ấy thì đổi cỡ xóa mất ảnh.
      await expect.poll(canvas, { message: 'canvas phủ cả khung', timeout: 30_000 }).toEqual([width, height, Math.floor(width * ratio), Math.floor(height * ratio)]);
      await page.evaluate(() => window.__sma.restore({})); // vẽ lại khung đứng yên (khung 10) ở cỡ mới
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
      expect(log.errors).toEqual([]);
    });
  }
});

test.describe('Đàn Gà Mẹ Con · tranh tự khép lại', () => {
  // Đồng hồ của cảnh theo khung vẽ, mỗi khung tối đa 0,1 s: 4,2 giây cảnh (3 giây chờ, 1,2 giây về) cần ít nhất 42 khung, nên máy vẽ chậm
  // (SwiftShader trên runner CI) cần lâu: trần rộng tay hơn 60 giây mặc định.
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('kéo xoay thì góc lệch hơn 15°; buông tay rồi chờ thì camera về góc của tranh (dưới 1°)', SMOKE, async ({ page }, testInfo) => {
    const log = collectConsole(page);
    await open(page, testInfo, 0);
    await waitForFrames(page, 20, { timeout: 120_000 });
    expect(await goc(page)).toBeLessThan(1); // lúc mở trang camera đang ở góc của tranh
    await dragCamera(page, 220);
    await expect.poll(() => goc(page), { timeout: 60_000 }).toBeGreaterThan(15);
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
    await dragCamera(page, 220);
    await expect.poll(() => goc(page), { timeout: 60_000 }).toBeGreaterThan(15);
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
