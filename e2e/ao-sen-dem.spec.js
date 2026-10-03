// e2e/ao-sen-dem.spec.js — tương tác riêng của Bức 1: chạm, giữ, vuốt (sương xoáy) mặt nước; thả hoa đăng; thanh giờ; chế độ mài; chất lượng; CPU vs GPU; trăng SVG.
import { test, expect } from '@playwright/test';
import {
  DARK, waitForSettled, waitForFrames, canvasStats, canvasRegions, gpuReport, collectConsole, readSma, twoFrames, doubleTapAt,
} from './helpers.js';
import meta from '../src/paintings/ao-sen-dem/meta.js';
import captions from '../src/paintings/ao-sen-dem/content.captions.vi.js';
import { DRIFT, verseOrder } from '../src/paintings/ao-sen-dem/parts/anh-trang-drift.js';
import { GESTURE } from '../src/engine/gpu/gesture.js';
import { parseAt } from '../src/engine/flags.js';

const AT = 'at=2026-09-28T21:00';
const N = 90; // số khung của mỗi lần chạy; vòng gợn kịp lan trong ~1 giây đồng hồ của cảnh
const TAP_AFTER = 15; // chạm sau khung này
const HOLD_FRAMES = 25; // giữ tay chừng này khung (rồi thêm 400 ms) trước khi thả
// Điểm chạm: giữa ngang, 80% chiều cao khung — mặt nước ngay trước camera, trên lối trăng.
const WATER = { x: 0.5, y: 0.8 };
// Chỗ thả hoa đăng thứ hai (GĐ 5): vẫn trên mặt nước, lệch trái về phía đèn ở bờ.
const ELSEWHERE = { x: 0.35, y: 0.78 };
/** Số hoa đăng đang trôi (số đo 'lanterns' của lớp Ánh trăng, như Sổ tay đọc). */
const lanternCount = (page) => page.evaluate(() => window.__sma.readouts('anh-trang').find((r) => r.id === 'lanterns')?.value);
// Gợi ý của Bức 1 (content.hint, GĐ 5). Chép lại ở đây vì content.vi.js import sơ đồ bằng ?raw, mà Node của Playwright không
// đọc được; tests/paintings/ao-sen-dem/tha-hoa-dang.test.js giữ content.hint đúng bằng chuỗi này.
const HINT = 'Chạm vào mặt nước · chạm hai lần để thả hoa đăng';

let log;
test.beforeEach(async ({ page }, testInfo) => {
  log = collectConsole(page);
  const { kind, backend } = testInfo.project.metadata;
  if (kind === 'static') return;
  if (backend === 'webgpu') {
    await page.goto('./?static');
    test.skip(!(await gpuReport(page)).webgpu, 'Không có WebGPU adapter trong môi trường này');
  }
});
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;
  const sma = await readSma(page).catch(() => null);
  await testInfo.attach('sma.txt', { body: JSON.stringify(sma, null, 2), contentType: 'text/plain' });
  await testInfo.attach('console.txt', { body: log.all.join('\n') || '(console trống)', contentType: 'text/plain' });
});

/**
 * Mở cảnh ở ?freeze=N, (tùy chọn) chạm hoặc GIỮ tay trên mặt nước sau khung TAP_AFTER, chờ đủ N khung rồi đo canvas.
 * Giữ = nhấn xuống, đợi thêm HOLD_FRAMES khung (dài hơn 350 ms giữ của gesture.js), rồi mới thả.
 */
async function run(page, testInfo, { tap = false, hold = false }) {
  const { query } = testInfo.project.metadata;
  await page.goto(`./?${query.replace(/^\?/, '')}&${AT}&freeze=${N}`);
  const settled = await waitForSettled(page, { timeout: 60_000 });
  expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
  let tappedAt = null;
  if (tap || hold) {
    await page.waitForFunction((n) => window.__sma.frames >= n, TAP_AFTER, { timeout: 60_000 });
    const box = await page.locator('[data-stage] canvas').boundingBox();
    const [x, y] = [box.x + box.width * WATER.x, box.y + box.height * WATER.y];
    if (tap) await page.mouse.click(x, y);
    else {
      await page.mouse.move(x, y);
      await page.mouse.down();
      const from = (await readSma(page)).frames;
      await page.waitForFunction((n) => window.__sma.frames >= n, from + HOLD_FRAMES, { timeout: 60_000 });
      await page.waitForTimeout(400); // bảo đảm quá holdMs theo đồng hồ tường, kể cả khi khung chạy nhanh
      await page.mouse.up();
    }
    tappedAt = (await readSma(page)).frames;
  }
  const sma = await waitForFrames(page, N, { timeout: 120_000 });
  expect(sma.frames).toBe(N);
  return { stats: await canvasStats(page), tappedAt };
}

test.describe('Ao Sen Đêm · chạm mặt nước', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('cùng ?at&freeze: không chạm thì hai lần giống hệt; chạm một lần thì ảnh khác', async ({ page }, testInfo) => {
    test.setTimeout(300_000); // ba lần chạy × 90 khung trên GPU phần mềm
    const a = await run(page, testInfo, { tap: false });
    const b = await run(page, testInfo, { tap: false });
    expect(b.stats.checksum, 'hai lần chạy cùng ?at&freeze phải cho cùng một ảnh (§8.7)').toBe(a.stats.checksum);
    const c = await run(page, testInfo, { tap: true });
    expect(c.tappedAt, 'cú chạm đến quá muộn: vòng gợn không kịp lan').toBeLessThan(N - 30);
    await page.screenshot({ path: testInfo.outputPath('cham-mat-nuoc.png') });
    expect(c.stats.checksum, 'chạm mặt nước mà ảnh không đổi: gợn sóng không chạy').not.toBe(a.stats.checksum);
    expect(log.errors).toEqual([]);
  });

  test('giữ tay trên mặt nước: đom đóm tụ lại rồi bung ra, ảnh khác lần không chạm (cùng ?at&freeze)', async ({ page }, testInfo) => {
    test.setTimeout(300_000);
    const a = await run(page, testInfo, {});
    const held = await run(page, testInfo, { hold: true });
    expect(held.tappedAt, 'thả tay quá muộn: đom đóm không kịp bung').toBeLessThan(N - 5);
    expect(held.stats.checksum, 'giữ tay mà ảnh không đổi: cử chỉ giữ không tới được bức').not.toBe(a.stats.checksum);
    expect(log.errors).toEqual([]);
  });

  /**
   * Cảnh đứng yên ở khung 30, chỉ bật Cốt + Sương, rồi vuốt (nhanh) hoặc kéo CHẬM cùng một đường đi 120 px trên mặt nước. Kéo nào
   * cũng xoay camera (OrbitControls tự cập nhật khi rê), nên ép vẽ lại một lần rồi mới chụp: hai ảnh cùng một camera đã xoay.
   * Trả kèm `ms`: thời lượng nét từ pointerdown tới pointerup, đo lúc handler chạy như gesture.js đo. Mỗi sự kiện chuột của Playwright
   * phải đợi một nhịp khung mới tới trang, mà trên GPU phần mềm nhịp đó mất vài chục tới vài trăm ms: nét dài ra tùy máy.
   */
  async function stillStroke(page, testInfo, kind) {
    const { query } = testInfo.project.metadata;
    await page.goto(`./?${query.replace(/^\?/, '')}&${AT}&freeze=30`);
    const settled = await waitForSettled(page, { timeout: 60_000 });
    expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
    await waitForFrames(page, 30);
    // Các lớp khác về 0 trong CÙNG một nhịp: một lần vẽ lại chứ không phải năm. Rồi đợi GPU vẽ xong: Chromium giao pointermove
    // theo nhịp khung, nên GPU phần mềm còn dồn việc vẽ thì cú vuốt bị giãn quá 300 ms và thành một cú kéo.
    const others = meta.layers.map((l) => l.id).filter((id) => !['cot', 'suong'].includes(id));
    await page.evaluate((ids) => Promise.all(ids.map((id) => window.__sma.setWeight(id, 0))), others);
    await twoFrames(page);
    await twoFrames(page);
    const box = await page.locator('[data-stage] canvas').boundingBox();
    const [x, y] = [box.x + box.width * WATER.x, box.y + box.height * WATER.y];
    await page.evaluate(() => {
      window.__stroke = {};
      const stamp = (name) => () => { window.__stroke[name] = performance.now(); };
      window.addEventListener('pointerdown', stamp('down'), { capture: true, once: true });
      window.addEventListener('pointerup', stamp('up'), { capture: true, once: true });
    });
    await page.mouse.move(x - 60, y);
    await page.mouse.down();
    if (kind === 'swipe') await page.mouse.move(x + 60, y); // một bước: ít sự kiện nhất, nét ngắn nhất
    else {
      // Bước đầu vượt ngay ngưỡng chạm (GESTURE.tapPx): cử chỉ thành "kéo" ngay. Bước đầu dưới ngưỡng thì cử chỉ còn "chờ", và bước kế
      // tới trễ quá GESTURE.holdMs (máy CI chậm) là thành "giữ": input.js tắt camera giữa chừng, hai cú kéo cho hai ảnh khác nhau.
      await page.mouse.move(x - 48, y);
      for (let i = 1; i <= 18; i += 1) {
        await page.mouse.move(x - 48 + i * 6, y);
        await page.waitForTimeout(40); // cả cú kéo dài hơn GESTURE.swipeMs: không phải vuốt
      }
    }
    await page.mouse.up();
    const ms = await page.evaluate(() => window.__stroke.up - window.__stroke.down);
    await page.evaluate(() => window.__sma.setWeight('suong', 1)); // ép vẽ lại khung 30 (trọng số không đổi)
    return { ...(await canvasStats(page)), ms };
  }

  test('vuốt trên mặt nước làm sương xoáy (GĐ 4): chỉ Cốt + Sương, cảnh đứng yên; vuốt khác một cú kéo chậm cùng đường đi', async ({
    page,
  }, testInfo) => {
    // Giảm chuyển động tắt quán tính (damping) của camera: kéo chậm và vuốt cùng đường đi thì xoay camera y hệt nhau. Chỉ cú vuốt
    // sinh cử chỉ 'swipe' → shared.swirl → sương xoáy (ở khung đứng yên, góc xoáy lớn nhất). Hai cú kéo chậm phải cho cùng một
    // ảnh (phép so công bằng), cú vuốt thì khác.
    test.setTimeout(300_000); // tới năm nét (hai cú kéo, tối đa ba cú vuốt) trên GPU phần mềm
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const a = await stillStroke(page, testInfo, 'drag');
    const b = await stillStroke(page, testInfo, 'drag');
    expect(Math.min(a.ms, b.ms), 'cú kéo chậm tới trang nhanh như một cú vuốt').toBeGreaterThan(GESTURE.swipeMs);
    expect(b.checksum, 'hai cú kéo chậm như nhau phải cho cùng một ảnh').toBe(a.checksum);
    // Nét chỉ là vuốt nếu tới tay gesture.js trong GESTURE.swipeMs (chừa 25 ms: hai bên đo ở hai handler khác nhau). Máy CI có lúc giao
    // sự kiện chậm hơn thế: nét thành cú kéo và phép so vô nghĩa, nên vuốt lại trên trang mới (tối đa ba lần) thay vì báo nhầm.
    const fast = GESTURE.swipeMs - 25;
    let swiped = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      swiped = await stillStroke(page, testInfo, 'swipe');
      if (swiped.ms <= fast) break;
      testInfo.annotations.push({ type: 'vuot-cham', description: `lần ${attempt}: nét tới trang trong ${Math.round(swiped.ms)} ms` });
    }
    expect(swiped.ms, `môi trường quá chậm: ba lần vuốt đều tới trang sau hơn ${fast} ms`).toBeLessThanOrEqual(fast);
    await page.screenshot({ path: testInfo.outputPath('suong-xoay.png') });
    expect(swiped.checksum, 'vuốt mà sương không xoáy (ảnh giống cú kéo chậm)').not.toBe(a.checksum);
    expect(log.errors).toEqual([]);
  });

  test('gợi ý của bức (content.hint) khi live; chạm lần đầu thì thành lời mời mài lớp', async ({ page }, testInfo) => {
    const { query } = testInfo.project.metadata;
    await page.goto(`./?${query.replace(/^\?/, '')}&${AT}`);
    expect((await waitForSettled(page, { timeout: 60_000 })).state).toBe('live');
    const hint = page.locator('[data-hint]');
    await expect(hint).toHaveText(HINT);
    const box = await page.locator('[data-stage] canvas').boundingBox();
    await page.mouse.click(box.x + box.width * WATER.x, box.y + box.height * WATER.y);
    await expect(hint).toHaveText(/^Bức tranh này có \d+ lớp — mài thử\?$/);
  });
});

test.describe('Ao Sen Đêm · thả hoa đăng (GĐ 5)', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  // Đêm 16 tháng Chín âm lịch, trăng gần tròn (sáng 99,6%): đêm của poster (meta.poster.capture). Dáng đèn tính thẳng theo tuổi
  // của nó trên đồng hồ CẢNH (?freeze: khung j là giây j/60). Chạm hai lần khi đã vẽ k khung thì đèn ra đời ở khung k + 1, nên tới
  // khung LANTERN_N nó đã (LANTERN_N − k − 1)/60 giây tuổi, mà búp cần DRIFT.open (1,5 giây) để nở đủ; nến sáng đủ sau DRIFT.glowIn
  // (0,5 giây). Nên chạm muộn nhất ở khung LATEST_TAP. Chạm sau khi ?freeze đã dừng thì đồng hồ không chạy nữa: đèn mãi là búp khép.
  // LANTERN_N chỉ vừa đủ, vì trên CI mỗi khung đắt (xem release()). Chạm rơi vào khung 15–16 (SwiftShader), 17–18 (GPU thật).
  const NIGHT = '2026-10-25T21:00';
  const LANTERN_N = 120;
  const LATEST_TAP = LANTERN_N - 1 - DRIFT.open * 60; // 29: tới khung LANTERN_N đèn vừa đúng DRIFT.open giây tuổi
  const SKY = { x: 0.5, y: 0.12 };
  // Quanh chỗ thả: tới khung LANTERN_N đèn mới trôi chưa tới nửa đơn vị (vài px), vũng sáng của nó loang trên nước bên dưới.
  const AROUND = { x0: WATER.x - 0.06, y0: WATER.y - 0.1, x1: WATER.x + 0.06, y1: WATER.y + 0.08 };
  // Số điểm sáng ấm (canvasRegions().warm: R > 150, G > 110, R − B > 40) trong AROUND ở khung 640×400, đo lúc viết test: có đèn
  // 1384 (WebGL2 SwiftShader, mức vừa), 1469 (WebGPU SwiftShader), 1468–1475 (GPU thật, Apple M2); hai lần chạm thường 19–44 (đom
  // đóm, ánh trăng trên gợn). Ánh nến và vũng sáng màu ngà: R − B của các điểm có đèn từ 41 tới 60 (giữa 53–54), nên ngưỡng
  // R − B > 60 không bắt được điểm nào. Phải hơn phép so WARM_MARGIN điểm: 500 chừa dư cả hai phía (số có đèn hạ chừng 60% vẫn
  // qua; số không đèn phải tăng hơn hai mươi lần mới làm hỏng).
  const WARM_MARGIN = 500;
  // Thứ tự thơ của đêm (shared.js): lần thả đầu mang câu [0], lần hai câu [1]. Hai file này không import gì nặng, Node đọc được.
  const verses = verseOrder(Object.keys(captions), parseAt(NIGHT));

  /** Chữ một mục của content.captions sẽ hiện ra: mỗi câu một .caption-line, rồi dòng nguồn "tên bài · tác giả" (ui/captions.js). */
  const verseOf = (key) => {
    const { lines, source, author } = captions[key];
    return { lines: lines.map((l) => l.normalize('NFC')), cite: (author ? `${source} · ${author}` : source).normalize('NFC') };
  };
  /** Chữ đang hiện trong vùng chữ; textContent của cả dòng dính các câu vào nhau, nên đọc từng phần. */
  const shownVerse = (page) => page.evaluate(() => {
    const caption = document.querySelector('[data-captions] .caption');
    if (!caption) return null;
    const lines = [...caption.querySelectorAll('.caption-line')].map((el) => el.textContent.normalize('NFC'));
    return { lines, cite: caption.querySelector('.caption-cite').textContent.normalize('NFC') };
  });

  /**
   * Mở cảnh đêm NIGHT ở ?freeze=LANTERN_N, chạm hai lần lên nước sau khung TAP_AFTER, chờ đủ khung rồi đo vùng quanh chỗ chạm.
   * gapMs mặc định là hai lần chạm sát nhau (thả một hoa đăng); 600 ms (quá GESTURE.doubleMs) là hai lần chạm thường.
   * Trần chờ tính theo máy chậm nhất: WebGPU SwiftShader trên CI vẽ một khung mất 0,75–0,82 giây (WebGL2 SwiftShader chừng 0,33),
   * nên từ lúc chạm tới khung LANTERN_N (chừng 105 khung) mất chừng 85 giây, cả một lần release() chừng 105 giây. Trần gấp đôi.
   */
  async function release(page, testInfo, { gapMs } = {}) {
    const { query } = testInfo.project.metadata;
    await page.goto(`./?${query.replace(/^\?/, '')}&at=${NIGHT}&freeze=${LANTERN_N}`);
    const settled = await waitForSettled(page, { timeout: 60_000 });
    expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
    await page.waitForFunction((n) => window.__sma.frames >= n, TAP_AFTER, { timeout: 60_000 });
    const tappedAt = await doubleTapAt(page, WATER.x, WATER.y, { gapMs });
    const sma = await waitForFrames(page, LANTERN_N, { timeout: 180_000 });
    expect(sma.frames).toBe(LANTERN_N);
    return { tappedAt, around: (await canvasRegions(page, { around: AROUND })).around };
  }

  test('chạm hai lần lên nước (phát ngay trong trang): hoa đăng sáng ở chỗ chạm, câu đầu của đêm; lần hai chỗ khác: hai đèn, câu kế; trên trời: không gì', async ({
    page,
  }, testInfo) => {
    test.setTimeout(420_000); // hai lần release() (chừng 105 giây mỗi lần trên CI) và ba lần vẽ lại khung đứng yên: trần gấp đôi
    // Phép so: cùng hai lần chạm mà cách nhau 600 ms là hai lần chạm thường: có gợn, không có đèn, không có chữ.
    const plain = await release(page, testInfo, { gapMs: 600 });
    expect(await lanternCount(page), 'hai lần chạm cách 600 ms mà vẫn thả đèn').toBe(0);
    await expect(page.locator('[data-captions] .caption')).toHaveCount(0);
    const lit = await release(page, testInfo);
    await page.screenshot({ path: testInfo.outputPath('hoa-dang.png') });
    // Ghi trước mọi phép kiểm: hỏng ở đâu cũng còn số để so với các số đo ở WARM_MARGIN.
    testInfo.annotations.push({
      type: 'hoa-dang',
      description: `chạm ở khung ${lit.tappedAt}; điểm sáng ấm quanh chỗ chạm: có đèn ${lit.around.warm}, không đèn ${plain.around.warm}`,
    });
    expect(lit.tappedAt, 'chạm hai lần quá muộn: tới khung cuối búp chưa kịp nở đủ').toBeLessThanOrEqual(LATEST_TAP);
    expect(await lanternCount(page)).toBe(1);
    const caption = page.locator('[data-captions] .caption');
    await expect(caption).toBeVisible();
    await expect(caption).toHaveAttribute('data-shown', '');
    await expect(caption, 'điểm neo của chữ (ngọn đèn) phải ở trong khung').not.toHaveAttribute('data-away');
    expect(await shownVerse(page)).toEqual(verseOf(verses[0]));
    expect(lit.around.warm, 'quanh chỗ thả không thấy đèn sáng').toBeGreaterThan(plain.around.warm + WARM_MARGIN);
    // Lần hai ở chỗ khác (khung đã dừng: cử chỉ tới thì vẽ lại khung LANTERN_N).
    await doubleTapAt(page, ELSEWHERE.x, ELSEWHERE.y);
    await expect.poll(() => lanternCount(page)).toBe(2);
    await expect.poll(() => shownVerse(page)).toEqual(verseOf(verses[1]));
    // Trên trời: tia từ camera không cắt mặt nước, bức bỏ qua cử chỉ.
    await doubleTapAt(page, SKY.x, SKY.y);
    await twoFrames(page);
    expect(await lanternCount(page)).toBe(2);
    expect(await shownVerse(page)).toEqual(verseOf(verses[1]));
    expect(log.errors).toEqual([]);
  });
});

test.describe('Ao Sen Đêm · thanh giờ (GĐ 4)', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('__sma.setDial("gio", 27) ở cùng khung thì ảnh khác (trăng, bóng, trời); về 21:00 thì đúng ảnh cũ', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const { query } = testInfo.project.metadata;
    await page.goto(`./?${query.replace(/^\?/, '')}&${AT}&freeze=20`);
    const settled = await waitForSettled(page, { timeout: 60_000 });
    expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
    await waitForFrames(page, 20);
    expect(await page.evaluate(() => window.__sma.dials())).toEqual([
      { id: 'gio', min: 18, max: 29.5, step: 0.25, value: 21, text: '21:00', note: null },
    ]);
    const base = await canvasStats(page);
    await page.evaluate(() => window.__sma.setDial('gio', 27));
    const late = await canvasStats(page);
    await page.screenshot({ path: testInfo.outputPath('gio-03h00.png') });
    expect(late.checksum, 'kéo sang 03:00 mà ảnh không đổi').not.toBe(base.checksum);
    expect((await page.evaluate(() => window.__sma.dials()))[0].text).toBe('03:00');
    await page.evaluate(() => window.__sma.setDial('gio', 21));
    expect((await canvasStats(page)).checksum, 'về 21:00 thì phải đúng ảnh cũ').toBe(base.checksum);
    expect((await readSma(page)).frames, 'kéo thanh giờ không được tiến đồng hồ').toBe(20);
    expect(log.errors).toEqual([]);
  });
});

test.describe('Ao Sen Đêm · chế độ mài', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  const weights = (page) => page.evaluate(() => Object.fromEntries(window.__sma.layers().map((l) => [l.id, l.weight])));

  test('lời mời là nút: vào chế độ mài (về đất sét), phủ lại từng lớp, đóng thanh lớp thì đủ lớp', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const { query } = testInfo.project.metadata;
    await page.goto(`./?${query.replace(/^\?/, '')}&${AT}`);
    expect((await waitForSettled(page, { timeout: 60_000 })).state).toBe('live');
    const box = await page.locator('[data-stage] canvas').boundingBox();
    await page.mouse.click(box.x + box.width * WATER.x, box.y + box.height * WATER.y);
    await page.locator('[data-hint] button').click();
    // Mọi lớp trừ Cốt mờ dần về 0 (tween theo đồng hồ của cảnh).
    await expect.poll(async () => Object.entries(await weights(page)).every(([id, w]) => (id === 'cot' ? w === 1 : w === 0)), {
      timeout: 30_000,
    }).toBe(true);
    const notebook = page.locator('[data-notebook]');
    await expect(notebook.locator('h2')).toHaveText('Cốt');
    await page.locator('[data-rail] .rail-next').click();
    await expect(notebook.locator('h2')).toHaveText('Ánh trăng');
    await expect.poll(async () => (await weights(page))['anh-trang'], { timeout: 30_000 }).toBe(1);
    await expect(page.locator('[data-rail] .rail-next')).toHaveText(/Sương$/);
    await page.locator('[data-rail] .rail-close').click();
    await expect(page.locator('[data-rail]')).toBeHidden();
    await expect.poll(async () => Object.values(await weights(page)).every((w) => w === 1), { timeout: 30_000 }).toBe(true);
    expect(log.errors).toEqual([]);
  });
});

test.describe('Ao Sen Đêm · chất lượng', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  /** Mở cảnh ở một mức ép bằng ?level, chờ N khung, trả __sma.stats() và ảnh. */
  async function atLevel(page, testInfo, level) {
    const { query } = testInfo.project.metadata;
    await page.goto(`./?${query.replace(/^\?/, '')}&${AT}&level=${level}&freeze=30`);
    const settled = await waitForSettled(page, { timeout: 60_000 });
    expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
    const sma = await waitForFrames(page, 30, { timeout: 120_000 });
    expect(sma.level).toBe(level);
    return { stats: await page.evaluate(() => window.__sma.stats()), image: await canvasStats(page) };
  }

  test('mức cao: tổng draw call mỗi khung ≤ 45 (spec §10; bóng tĩnh không vẽ lại mỗi khung)', async ({ page }, testInfo) => {
    const { stats } = await atLevel(page, testInfo, 'cao');
    expect(stats.drawCalls).toBeGreaterThan(10);
    expect(stats.drawCalls).toBeLessThanOrEqual(45);
    expect(log.errors).toEqual([]);
  });

  test('mức cao có hoa đăng (GĐ 5): hai đèn trôi không thêm draw call nào (chung InstancedMesh với đèn ở bờ), vẫn ≤ 45', async ({
    page,
  }, testInfo) => {
    const { query, backend } = testInfo.project.metadata;
    test.skip(backend !== 'webgpu', 'spec §12: draw call của mức cao đo trên WebGPU');
    test.setTimeout(180_000); // N khung ở mức cao: chừng 85 giây trên WebGPU SwiftShader của CI
    await page.goto(`./?${query.replace(/^\?/, '')}&${AT}&level=cao&freeze=${N}`);
    const settled = await waitForSettled(page, { timeout: 60_000 });
    expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
    await page.waitForFunction((n) => window.__sma.frames >= n, TAP_AFTER, { timeout: 60_000 });
    const before = (await page.evaluate(() => window.__sma.stats())).drawCalls;
    await doubleTapAt(page, WATER.x, WATER.y);
    // Thả cả hai đèn khi vòng lặp còn chạy: stats() là số đo của khung vòng lặp vẽ sau cùng (vẽ lại lúc đứng yên không đo).
    const tappedAt = await doubleTapAt(page, ELSEWHERE.x, ELSEWHERE.y);
    expect(tappedAt, 'thả đèn sau khi ?freeze đã dừng: khung cuối không có đèn').toBeLessThan(N - 5);
    const sma = await waitForFrames(page, N, { timeout: 120_000 });
    expect(sma.level).toBe('cao');
    expect(await lanternCount(page)).toBe(2);
    const { drawCalls } = await page.evaluate(() => window.__sma.stats());
    testInfo.annotations.push({ type: 'draw-call', description: `trước khi thả ${before}, có hai đèn ${drawCalls}` });
    expect(drawCalls).toBeGreaterThan(10);
    expect(drawCalls).toBeLessThanOrEqual(45);
    // Khung TAP_AFTER và khung N vẽ cùng những vật (bóng tĩnh chỉ vẽ ở khung đầu; ?freeze không có bộ điều chỉnh hạ nấc), chỉ khác
    // hai đèn: mỗi đèn là một instance nữa của InstancedMesh đèn ở bờ (đổi count), vũng sáng nằm trong shader của mặt nước.
    expect(drawCalls, 'đèn thả ra thêm draw call: đèn phải chung InstancedMesh với đèn ở bờ').toBe(before);
    expect(log.errors).toEqual([]);
  });

  test('?level=thap: phản chiếu giả, không bóng; vẫn có sáng có tối, ít draw call hơn mức cao', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const low = await atLevel(page, testInfo, 'thap');
    await page.screenshot({ path: testInfo.outputPath('muc-thap.png') });
    expect(low.image.bright).toBeGreaterThan(0.02);
    expect(low.image.dark).toBeGreaterThan(DARK);
    await expect(page.locator('[data-badge]')).toContainText('thấp');
    const high = await atLevel(page, testInfo, 'cao');
    expect(low.stats.drawCalls, 'mức thấp không vẽ cảnh lần hai cho phản chiếu').toBeLessThan(high.stats.drawCalls);
    expect(log.errors).toEqual([]);
  });

  test('Sổ tay › Vàng lá › Phá: bật rồi tắt "CPU vs GPU" thì hai cột Tắt / Bật đều có số', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const { query } = testInfo.project.metadata;
    await page.goto(`./?${query.replace(/^\?/, '')}&${AT}`);
    expect((await waitForSettled(page, { timeout: 60_000 })).state).toBe('live');
    const box = await page.locator('[data-stage] canvas').boundingBox();
    await page.mouse.click(box.x + box.width * WATER.x, box.y + box.height * WATER.y);
    await page.locator('[data-hint] button').click();
    await page.evaluate(() => window.__sma.setWeight('vang-la', 1)); // chế độ mài đưa mọi lớp về 0: phủ lại Vàng lá
    await page.locator('[data-rail] [data-layer="vang-la"] .rail-name').click();
    const notebook = page.locator('[data-notebook]');
    await notebook.locator('[data-tab="pha"]').click();
    const button = notebook.locator('[data-experiment="cpu"]');
    const bars = notebook.locator('[data-compare]');
    await expect(bars.locator('[data-side="off"] .nb-compare-value')).toContainText('ms', { timeout: 30_000 });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(bars.locator('[data-side="on"] .nb-compare-value')).toContainText('ms', { timeout: 30_000 });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await page.screenshot({ path: testInfo.outputPath('cpu-vs-gpu.png') });
    expect(log.errors).toEqual([]);
  });
});

test.describe('Ao Sen Đêm · chữ của bức tải hỏng', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  // Review Focus #3: vừa deploy, HTML cũ trỏ tới chunk chữ đã bị xóa. Cảnh 3D không phụ thuộc chữ.
  test('content.vi-*.js lỗi → cảnh vẫn live, không có gợi ý, không vỡ', async ({ page }, testInfo) => {
    const { query } = testInfo.project.metadata;
    await page.route(/content\.vi-[\w-]+\.js$/, (route) => route.abort());
    await page.goto(`./?${query.replace(/^\?/, '')}&${AT}&freeze=20`);
    const settled = await waitForSettled(page, { timeout: 60_000 });
    expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
    const sma = await waitForFrames(page, 20);
    expect(sma.state).toBe('live');
    await expect(page.locator('[data-hint]')).toBeHidden();
    // Sổ tay vẫn mở được (chữ thiếu thì báo một dòng), và các núm vẫn chạy vì chúng đến từ code, không từ chữ.
    const box = await page.locator('[data-stage] canvas').boundingBox();
    await page.mouse.click(box.x + box.width * WATER.x, box.y + box.height * WATER.y);
    await page.locator('[data-hint] button').click();
    await expect(page.locator('[data-notebook] .nb-missing')).toBeVisible();
  });
});

test.describe('Ao Sen Đêm · tầng tĩnh', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== 'static', 'chỉ chạy ở project static');
  });

  test('?static&at=… → trăng SVG đúng pha đêm 18 tháng Tám (trăng tàn, sáng bên trái)', async ({ page }) => {
    await page.goto(`./?static&${AT}`);
    await waitForSettled(page);
    const d = await page.locator('[data-moon] .moon-lit').getAttribute('d');
    // Sau rằm: nửa vòng ngoài đi qua bên TRÁI (sweep 0), phần sáng lớn hơn nửa đĩa.
    expect(d).toMatch(/^M0 -1A1 1 0 0 0 0 1A/);
    await expect(page.locator('[data-moon]')).toBeVisible();
    await expect(page.locator('[data-hint]')).toBeHidden();
  });
});
