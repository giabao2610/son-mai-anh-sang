// e2e/painting.spec.js — E2E chung cho MỌI bức trong registry: tầng tĩnh, và cảnh 3D trên WebGL2 / WebGPU.
import { test, expect } from '@playwright/test';
import { paintings } from '../src/paintings/registry.js';
import { waitForSettled, waitForFrames, canvasStats, gpuReport, collectConsole, readSma } from './helpers.js';

/**
 * URL tương đối (không có '/' đầu) để giữ base '/son-mai-anh-sang/' của baseURL.
 * page 'index.html' → './?a&b'; page 'tranh/x/index.html' → './tranh/x/?a&b'.
 */
function urlOf(page, ...parts) {
  const dir = page.replace(/index\.html$/, '');
  const query = parts.map((p) => p.replace(/^\?/, '')).filter(Boolean).join('&');
  return `./${dir}${query ? `?${query}` : ''}`;
}

let log;
test.beforeEach(({ page }) => {
  log = collectConsole(page);
});
// Khi hỏng: đính kèm __sma và toàn bộ console vào e2e/.results (cùng ảnh chụp + trace do config bật).
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;
  const sma = await readSma(page).catch(() => null);
  await testInfo.attach('sma.txt', { body: JSON.stringify(sma, null, 2), contentType: 'text/plain' });
  await testInfo.attach('console.txt', { body: log.all.join('\n') || '(console trống)', contentType: 'text/plain' });
});

for (const { meta, page: htmlPage, lang } of paintings) {
  const posterImg = `img[src$="${meta.poster.src.replace(/^\//, '')}"]`;

  test.describe(`${meta.title} · tầng tĩnh`, () => {
    test.beforeEach(({}, testInfo) => {
      test.skip(testInfo.project.metadata.kind !== 'static', 'chỉ chạy ở project static');
    });

    test('không có GPU thật → tranh tĩnh, lý do no-gpu', async ({ page }) => {
      await page.goto(urlOf(htmlPage));
      const sma = await waitForSettled(page);
      expect(sma.state).toBe('static');
      expect(sma.reason).toBe('no-gpu');
    });

    test('?static → poster, thơ, con dấu; không canvas; không tải chunk three', async ({ page }) => {
      const requests = [];
      page.on('request', (req) => requests.push(req.url()));
      await page.goto(urlOf(htmlPage, 'static'));
      const sma = await waitForSettled(page);
      expect(sma.state).toBe('static');
      expect(sma.reason).toBe('flag');
      await expect(page.locator(posterImg)).toBeVisible();
      await expect(page.locator('[data-poem]')).toBeVisible();
      const poem = (await page.locator('[data-poem]').textContent()).normalize('NFC');
      expect(poem).toContain(meta.poem.lines[0].normalize('NFC'));
      await expect(page.locator('[data-seal]')).toBeVisible();
      await expect(page.locator('[data-seal]')).not.toBeEmpty();
      await expect(page.locator('canvas')).toHaveCount(0);
      expect(requests.filter((url) => /\/three-[\w-]+\.js/.test(url))).toEqual([]);
    });

    test('?static&at=… → con dấu đúng ngày âm', async ({ page }) => {
      test.skip(lang !== 'vi', 'chuỗi con dấu mẫu là tiếng Việt');
      await page.goto(urlOf(htmlPage, 'static', 'at=2026-09-28T21:00'));
      await waitForSettled(page);
      await expect(page.locator('[data-seal]')).toHaveText('18 tháng Tám · Bính Ngọ');
    });
  });

  test.describe(`${meta.title} · 3D`, () => {
    test.beforeEach(async ({ page }, testInfo) => {
      const { kind, backend } = testInfo.project.metadata;
      test.skip(kind !== '3d', 'chỉ chạy ở project 3D');
      if (backend === 'webgpu') {
        // Adapter chỉ hỏi được trên một trang thật (cần secure context): mở trang tĩnh rồi hỏi.
        await page.goto(urlOf(htmlPage, 'static'));
        const gpu = await gpuReport(page);
        testInfo.annotations.push({ type: 'gpu', description: JSON.stringify(gpu) });
        test.skip(!gpu.webgpu, 'Không có WebGPU adapter trong môi trường này');
      }
    });

    test('?freeze=10 và ?freeze=40: live, đúng số khung, đúng backend, có sáng có tối, hai ảnh khác nhau', async ({
      page,
    }, testInfo) => {
      const { query, backend } = testInfo.project.metadata;
      const shots = [];
      for (const n of [10, 40]) {
        await page.goto(urlOf(htmlPage, query, `freeze=${n}`));
        const settled = await waitForSettled(page);
        expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
        const sma = await waitForFrames(page, n);
        expect(sma.state, `về tầng tĩnh sau khi live: ${sma.reason} · ${sma.error}`).toBe('live');
        expect(sma.frames).toBe(n);
        expect(sma.backend).toBe(backend);
        await expect(page.locator('[data-badge]')).toHaveAttribute('data-backend', backend);
        const stats = await canvasStats(page);
        await page.screenshot({ path: testInfo.outputPath(`freeze-${n}.png`) });
        expect(stats.bright, `freeze=${n}: quá ít điểm sáng`).toBeGreaterThan(0.02);
        expect(stats.dark, `freeze=${n}: quá ít điểm tối`).toBeGreaterThan(0.1);
        shots.push(stats);
      }
      const still = 'khung 10 và khung 40 giống hệt nhau: cảnh không chuyển động theo ctx.u.time';
      expect(shots[0].checksum, still).not.toBe(shots[1].checksum);
      expect(log.errors).toEqual([]);
      expect(log.warnings).toEqual([]);
    });

    test('đổi kích thước khung nhìn → canvas đổi theo, cảnh vẫn chạy', async ({ page }, testInfo) => {
      const { query } = testInfo.project.metadata;
      await page.goto(urlOf(htmlPage, query));
      const settled = await waitForSettled(page);
      expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
      const sizes = () => page.evaluate(() => {
        const stage = document.querySelector('[data-stage]');
        const canvas = stage.querySelector('canvas');
        return {
          stage: [stage.clientWidth, stage.clientHeight],
          css: [canvas.clientWidth, canvas.clientHeight],
          buffer: [canvas.width, canvas.height],
          dpr: window.devicePixelRatio,
        };
      });
      const before = await sizes();
      await page.setViewportSize({ width: 480, height: 320 });
      await expect.poll(async () => {
        const s = await sizes();
        return s.css[0] === s.stage[0] && s.css[1] === s.stage[1] && s.css[0] !== before.css[0];
      }).toBe(true);
      const after = await sizes();
      // deviceScaleFactor = 1 (config) thấp hơn mọi trần budget.dpr, nên bộ đệm vẽ = kích thước CSS × dpr.
      expect(after.buffer).toEqual(after.css.map((v) => Math.floor(v * after.dpr)));
      const sma = await waitForFrames(page, settled.frames + 5);
      expect(sma.state).toBe('live');
      expect(log.errors).toEqual([]);
    });

    test('mất context WebGL → tranh tĩnh (device-lost), canvas gỡ, poster hiện lại', async ({ page }, testInfo) => {
      const { query, backend } = testInfo.project.metadata;
      test.skip(backend !== 'webgl2', 'chỉ WebGL mô phỏng được mất context (WEBGL_lose_context)');
      await page.goto(urlOf(htmlPage, query));
      const settled = await waitForSettled(page);
      expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
      await page.evaluate(() => {
        const gl = document.querySelector('[data-stage] canvas').getContext('webgl2');
        gl.getExtension('WEBGL_lose_context').loseContext();
      });
      await page.waitForFunction(() => window.__sma.state === 'static');
      const sma = await readSma(page);
      expect(sma.reason).toBe('device-lost');
      await expect(page.locator('[data-stage] canvas')).toHaveCount(0);
      await expect(page.locator(posterImg)).toBeVisible();
    });

    // Review Focus #5 · giảm chuyển động: CSS bỏ transition nên không có transitionend để chờ.
    // tests/unit/shell.test.js giữ "crossfade xong ngay"; ở đây kiểm trang thật: tới live, poster ẩn, canvas hiện ngay.
    test('giảm chuyển động → tới live (không kẹt ở fading), poster ẩn, canvas hiện ngay', async ({
      page,
    }, testInfo) => {
      const { query } = testInfo.project.metadata;
      // Đặt TRƯỚC khi mở trang: run.js và shell.js đọc matchMedia lúc khởi động.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(urlOf(htmlPage, query, 'freeze=10'));
      // Giả lập phải có hiệu lực trong trang, nếu không test này chỉ lặp lại test freeze.
      expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
      const settled = await waitForSettled(page);
      expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
      await expect(page.locator('[data-poster]')).toBeHidden();
      const canvas = page.locator('[data-stage] canvas');
      await expect(canvas).toHaveAttribute('data-visible', '');
      expect(await canvas.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');
      expect(log.errors).toEqual([]);
    });
  });
}
