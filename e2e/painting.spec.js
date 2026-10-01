// e2e/painting.spec.js — E2E chung cho MỌI bức trong registry: tầng tĩnh, và cảnh 3D trên WebGL2 / WebGPU.
import { readdirSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { paintings } from '../src/paintings/registry.js';
import { DARK, waitForSettled, waitForFrames, canvasStats, gpuReport, collectConsole, readSma } from './helpers.js';

/**
 * URL tương đối (không có '/' đầu) để giữ base '/son-mai-anh-sang/' của baseURL.
 * page 'index.html' → './?a&b'; page 'tranh/x/index.html' → './tranh/x/?a&b'.
 */
function urlOf(page, ...parts) {
  const dir = page.replace(/index\.html$/, '');
  const query = parts.map((p) => p.replace(/^\?/, '')).filter(Boolean).join('&');
  return `./${dir}${query ? `?${query}` : ''}`;
}

/**
 * Tên MỌI file chunk three trong bản build (dist/assets/three-<hash>.js). Đọc từ đĩa để kiểm "không tải three"
 * không thể đúng rỗng: nếu đổi cách đặt tên chunk mà không ai để ý, test báo ngay thay vì lặng lẽ qua.
 * Lấy tất cả (không chỉ file đầu): three bị tách làm hai chunk thì kiểm cả hai.
 */
function threeChunks() {
  const files = readdirSync(new URL('../dist/assets/', import.meta.url));
  return files.filter((f) => /^three-[\w-]+\.js$/.test(f));
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
      const chunks = threeChunks();
      expect(chunks, 'dist/assets không có three-*.js: kiểm này sẽ đúng rỗng').not.toEqual([]);
      expect(requests.filter((url) => chunks.some((c) => url.endsWith(`/${c}`)))).toEqual([]);
    });

    test('?static → Sổ tay chỉ đọc: nút "Xem N lớp" mở thanh lớp (đủ tên lớp) và chữ Hiểu; vẫn không tải three', async ({ page }) => {
      const requests = [];
      page.on('request', (req) => requests.push(req.url()));
      await page.goto(urlOf(htmlPage, 'static'));
      expect((await waitForSettled(page)).state).toBe('static');
      await page.locator('[data-static] button').click();
      const rail = page.locator('[data-rail]');
      await expect(rail).toBeVisible();
      const names = (await rail.locator('.rail-name').allTextContents()).map((s) => s.normalize('NFC'));
      meta.layers.forEach((layer, i) => expect(names[i]).toContain(layer.name.normalize('NFC')));
      await expect(rail.locator('[role="switch"]')).toHaveCount(0); // chỉ đọc: không bật/tắt lớp
      await expect(page.locator('[data-notebook] .nb-understand')).not.toBeEmpty();
      const chunks = threeChunks();
      expect(requests.filter((url) => chunks.some((c) => url.endsWith(`/${c}`)))).toEqual([]);
      expect(log.errors).toEqual([]);
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
        expect(stats.dark, `freeze=${n}: quá ít điểm tối`).toBeGreaterThan(DARK);
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

    test('mất context WebGL: lần đầu → poster + "Dựng lại cảnh"; bấm → live lại, giữ trạng thái; lần hai → tranh tĩnh', async ({
      page,
    }, testInfo) => {
      const { query, backend } = testInfo.project.metadata;
      test.skip(backend !== 'webgl2', 'chỉ WebGL mô phỏng được mất context (WEBGL_lose_context)');
      test.setTimeout(120_000);
      await page.goto(urlOf(htmlPage, query));
      const settled = await waitForSettled(page);
      expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
      // Mở rồi đóng thanh lớp: lời mời quay lại. Lúc mất GPU poster xóa lời mời; dựng lại xong phải mời lại.
      const box = await page.locator('[data-stage] canvas').boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.8);
      await page.locator('[data-hint] button').click();
      await page.locator('[data-rail] .rail-close').click();
      await expect(page.locator('[data-hint] button')).toBeVisible();
      const second = meta.layers[1].id;
      await page.evaluate((id) => window.__sma.setWeight(id, 0), second); // trạng thái để restore() đem về
      const lose = () => page.evaluate(() => {
        const gl = document.querySelector('[data-stage] canvas').getContext('webgl2');
        gl.getExtension('WEBGL_lose_context').loseContext();
      });
      await lose();
      await page.waitForFunction(() => window.__sma.state === 'lost');
      await expect(page.locator('[data-stage] canvas')).toHaveCount(0);
      await expect(page.locator(posterImg)).toBeVisible();
      await page.locator('[data-static] button').click(); // "Dựng lại cảnh"
      await page.waitForFunction(() => ['live', 'static'].includes(window.__sma.state), null, { timeout: 60_000 });
      let sma = await readSma(page);
      expect(sma.state, `dựng lại hỏng: ${sma.reason} · ${sma.error}`).toBe('live');
      await expect(page.locator('[data-stage] canvas')).toHaveCount(1); // renderer và canvas MỚI
      const weights = await page.evaluate(() => window.__sma.layers());
      expect(weights.find((l) => l.id === second).weight, 'restore(snapshot) phải đem trọng số cũ về').toBe(0);
      await expect(page.locator('[data-hint] button'), 'thanh lớp đang đóng thì dựng lại xong phải mời lại').toBeVisible();
      await lose();
      await page.waitForFunction(() => window.__sma.state === 'static');
      sma = await readSma(page);
      expect(sma.reason).toBe('device-lost');
      await expect(page.locator('[data-stage] canvas')).toHaveCount(0);
      await expect(page.locator(posterImg)).toBeVisible();
    });

    test('mài từng lớp: __sma.setWeight(id, 0) thì ảnh khác; đặt lại 1 thì về đúng ảnh cũ (cùng khung ?freeze)', async ({
      page,
    }, testInfo) => {
      const { query } = testInfo.project.metadata;
      test.setTimeout(120_000);
      await page.goto(urlOf(htmlPage, query, 'freeze=10', 'at=2026-09-28T21:00'));
      const settled = await waitForSettled(page);
      expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
      await waitForFrames(page, 10);
      const base = await canvasStats(page);
      const layers = await page.evaluate(() => window.__sma.layers());
      expect(layers.map((l) => l.id)).toEqual(meta.layers.map((l) => l.id));
      for (const { id } of layers.slice(1)) {
        await page.evaluate((layerId) => window.__sma.setWeight(layerId, 0), id);
        const off = await canvasStats(page);
        expect(off.checksum, `tắt lớp "${id}" mà ảnh không đổi`).not.toBe(base.checksum);
        await page.evaluate((layerId) => window.__sma.setWeight(layerId, 1), id);
      }
      const again = await canvasStats(page);
      expect(again.checksum, 'bật lại mọi lớp thì phải về đúng ảnh cũ').toBe(base.checksum);
      expect((await readSma(page)).frames, 'vẽ lại không được tiến đồng hồ').toBe(10);
      expect(log.errors).toEqual([]);
      expect(log.warnings).toEqual([]);
    });

    test('hạ hết mọi nấc bằng __sma.degrade(): vẫn vẽ, có sáng có tối, không lỗi; nâng lại hết thì về đúng ảnh cũ', async ({
      page,
    }, testInfo) => {
      const { query } = testInfo.project.metadata;
      test.setTimeout(120_000);
      await page.goto(urlOf(htmlPage, query, 'freeze=10', 'at=2026-09-28T21:00'));
      const settled = await waitForSettled(page);
      expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
      await waitForFrames(page, 10);
      const base = await canvasStats(page);
      // ?freeze: không có bộ điều chỉnh (ảnh tất định), nhưng hạ/nâng tay vẫn được và vẽ lại đúng khung 10.
      let steps = 0;
      while (await page.evaluate(() => window.__sma.degrade())) steps += 1;
      const quality = await page.evaluate(() => window.__sma.quality());
      expect(quality.steps).toHaveLength(steps);
      await expect(page.locator('[data-badge]')).toHaveAttribute('data-steps', String(steps));
      const low = await canvasStats(page);
      await page.screenshot({ path: testInfo.outputPath('ha-het-nac.png') });
      expect(low.bright, 'hạ hết nấc: quá ít điểm sáng').toBeGreaterThan(0.02);
      expect(low.dark, 'hạ hết nấc: quá ít điểm tối').toBeGreaterThan(DARK);
      while (await page.evaluate(() => window.__sma.upgrade()));
      await expect(page.locator('[data-badge]')).toHaveAttribute('data-steps', '0');
      const again = await canvasStats(page);
      expect(again.checksum, 'nâng lại hết nấc thì phải về đúng ảnh cũ').toBe(base.checksum);
      expect((await readSma(page)).frames, 'hạ/nâng nấc không được tiến đồng hồ').toBe(10);
      expect(log.errors).toEqual([]);
      expect(log.warnings).toEqual([]);
    });

    test('Sổ tay: lời mời → chế độ mài; tab Chỉnh của lớp đầu tiên có núm; rê chuột lên núm thì dòng code sáng', async ({
      page,
    }, testInfo) => {
      const { query } = testInfo.project.metadata;
      test.setTimeout(120_000);
      await page.goto(urlOf(htmlPage, query));
      expect((await waitForSettled(page)).state).toBe('live');
      const box = await page.locator('[data-stage] canvas').boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.8); // lần chạm đầu → lời mời
      await page.locator('[data-hint] button').click();
      await expect(page.locator('[data-rail]')).toBeVisible();
      const notebook = page.locator('[data-notebook]');
      let found = false;
      for (const layer of meta.layers) {
        await page.locator(`[data-rail] [data-layer="${layer.id}"] .rail-name`).click();
        await notebook.locator('[data-tab="chinh"]').click();
        // Tweakpane tải lần đầu (import động): chờ ô núm xong ('ready'), hoặc biết lớp không có núm ('empty').
        await expect(notebook.locator('[data-knobs]')).toHaveAttribute('data-state', /^(ready|empty)$/);
        if ((await notebook.locator('[data-knobs]').getAttribute('data-state')) === 'empty') continue;
        const knob = notebook.locator('[data-knob]').first();
        await expect(notebook.locator('.code-view [data-line]').first()).toBeAttached();
        await knob.hover();
        await expect(notebook.locator('.code-view .is-lit').first()).toBeVisible();
        found = true;
        break;
      }
      test.skip(!found, 'bức không có lớp nào có núm');
      expect(log.errors).toEqual([]);
    });

    for (const [flag, name] of [['debug', 'inspector'], ['debug=stats', 'stats']]) {
      test(`?${flag} → công cụ thợ "${name}" hiện, cảnh vẫn chạy, không lỗi console`, async ({ page }, testInfo) => {
        const { query } = testInfo.project.metadata;
        await page.goto(urlOf(htmlPage, query, flag, 'freeze=20'));
        const settled = await waitForSettled(page);
        expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
        await expect(page.locator(`[data-debug="${name}"]`)).toBeAttached();
        const sma = await waitForFrames(page, 20);
        expect(sma.state).toBe('live');
        expect(log.errors).toEqual([]);
      });
    }

    // Review Focus #5 · giảm chuyển động: CSS bỏ transition nên không có transitionend để chờ, và crossfade
    // phải xong ngay. Chỉ kiểm "tới live" thì chưa đủ, vì lưới an toàn 1200 ms của shell cũng đưa tới live.
    // Nên đo lúc body[data-state] đổi: fading → live dưới 600 ms (đường ngay ≈ 0 ms, lưới an toàn ≈ 1200 ms).
    test('giảm chuyển động → live ngay sau fading (dưới 600 ms), poster ẩn, canvas hiện ngay', async ({
      page,
    }, testInfo) => {
      const { query } = testInfo.project.metadata;
      // Ghi mọi lần body[data-state] đổi vào window.__stateLog, kèm performance.now(). Gắn lúc DOMContentLoaded
      // (ghi luôn trạng thái lúc đó) là đủ sớm: 'fading' chỉ đến sau khi tải chunk three và biên dịch shader.
      await page.addInitScript(() => {
        window.__stateLog = [];
        const push = (state) => window.__stateLog.push({ state, t: performance.now() });
        document.addEventListener('DOMContentLoaded', () => {
          const { body } = document;
          push(body.dataset.state);
          // Một lần gọi có thể gom nhiều lần đổi: trạng thái mới của bản ghi i là oldValue của bản ghi i + 1.
          new MutationObserver((records) => {
            records.forEach((_, i) => push(i + 1 < records.length ? records[i + 1].oldValue : body.dataset.state));
          }).observe(body, { attributeFilter: ['data-state'], attributeOldValue: true });
        });
      });
      // Đặt TRƯỚC khi mở trang: run.js và shell.js đọc matchMedia lúc khởi động.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(urlOf(htmlPage, query, 'freeze=10'));
      // Giả lập phải có hiệu lực trong trang, nếu không test này chỉ lặp lại test freeze.
      expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
      const settled = await waitForSettled(page);
      expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
      const stateLog = await page.evaluate(() => window.__stateLog);
      const at = (state) => stateLog.find((entry) => entry.state === state)?.t;
      const trace = `__stateLog = ${JSON.stringify(stateLog)}`;
      expect(at('fading'), `không ghi được 'fading' · ${trace}`).toBeDefined();
      expect(at('live'), `không ghi được 'live' · ${trace}`).toBeDefined();
      const fadeMs = at('live') - at('fading');
      expect(fadeMs, `fading → live quá lâu: crossfade đã chờ transition/lưới an toàn · ${trace}`).toBeLessThan(600);
      await expect(page.locator('[data-poster]')).toBeHidden();
      const canvas = page.locator('[data-stage] canvas');
      await expect(canvas).toHaveAttribute('data-visible', '');
      expect(await canvas.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');
      expect(log.errors).toEqual([]);
    });
  });
}
