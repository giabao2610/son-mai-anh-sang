// e2e/painting.spec.js — E2E chung cho MỌI bức trong registry: tầng tĩnh; cảnh 3D trên WebGL2 / WebGPU; công cụ học, ?poster (GĐ 4); Từng sợi, quầng trăng (GĐ 5); Bản dịch (GĐ 9).
import { readdirSync, readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { paintings } from '../src/paintings/registry.js';
import t from '../src/ui/strings.vi.js';
import { HALO_STEPS } from '../src/ui/moon-progress.js';
import { playStepMs, playStride } from '../src/engine/tools/tung-soi.js';
import { SMOKE_TAG } from '../scripts/e2e-groups.js';
import {
  DARK, FULL, waitForSettled, waitForFrames, canvasStats, canvasRegions, twoFrames, gpuReport, collectConsole, readSma,
} from './helpers.js';

/**
 * Sợi 0 của Từng sợi (chưa vẽ vật nào: chỉ còn màu nền xóa khung, vẫn qua hậu kỳ): ngưỡng độ lệch chuẩn độ sáng của "gần như
 * một màu". Đo ở khung 10 của Bức 1, 640×400: sợi 0 có std 0,0073 trên cả WebGL2 SwiftShader, WebGPU SwiftShader và GPU thật
 * (Apple M2); chỉ còn hạt (grain 0,03) và tối góc (vignette 0,45) của Phủ bóng làm độ sáng đổi chút ít. Khung vẽ đủ có std
 * 0,13–0,135. Ngưỡng 0,02 gần gấp ba sợi 0 mà chưa tới một phần sáu khung đủ.
 */
const ONE_COLOUR_STD = 0.02;

/**
 * GĐ 9 (spec §21.8): lớp để thử Bản dịch của mỗi bức (lớp có mặt ở vật của lớp khác, hay ở quad cuối) và công thức thử (Task 7).
 * Bức 1: Sương vào shader của mọi vật qua sương mù; Bức 2: Giấy góp vào material đèn của Cốt; Bức 3: Bóng mềm vào khối bao SDF;
 * Bức 4: Bản nét ở quad cuối.
 */
const GD9 = {
  'ao-sen-dem': { layer: 'suong', recipe: 'suong:0,suong.density:0.02,gio:23' },
  'den-keo-quan': { layer: 'giay', recipe: 'giay:0,giay.dye:0.3' },
  'cung-que': { layer: 'bong-mem', recipe: 'bong-mem:0,ngay:15' },
  'dan-ga-me-con': { layer: 'ban-net', recipe: 'ban-net:0,ban-net.lineWidth:3' },
};
/** Nhãn của những nơi mà hai bản dịch khác nhau (khóa, mã đỉnh hay mã điểm ảnh), hay thiếu ở một bên: so ngắn gọn, không in cả mã. */
const changedPlaces = (a, b) => {
  const byKey = new Map(b.places.map((p) => [p.key, p]));
  const changed = a.places.filter((p) => byKey.get(p.key)?.vertex !== p.vertex || byKey.get(p.key)?.fragment !== p.fragment);
  const missing = b.places.filter((p) => !a.places.some((q) => q.key === p.key));
  return [...changed, ...missing].map((p) => p.label);
};
/** Số ảnh fragment shader ghi ra (như tests/helpers/nodes.js#countOutputs): scene pass ghi ≥ 2 (output, emissive), vẽ thẳng ra màn hình 1. */
const outputsOf = (code) => {
  const struct = /struct Output\w* \{([^}]*)\}/.exec(code);
  if (struct) return (struct[1].match(/@location\(/g) ?? []).length;
  return (code.match(/layout\( location = \d+ \) out /g) ?? []).length;
};

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

for (const { meta, page: htmlPage, lang, ciWebgpuSmoke } of paintings) {
  const smoke = ciWebgpuSmoke ? { tag: SMOKE_TAG } : {}; // bức nặng: job WebGPU của CI chỉ chạy test mang tag khói
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
      // Hai lần tải trang rồi vẽ 10 và 40 khung trên GPU phần mềm: WebGPU SwiftShader trên CI mất 50–56 giây, sát trần mặc
      // định 60 giây; có lượt 40 khung về sau hơn 30 giây chờ (frames vẫn đủ 40). Trần riêng như các test nặng khác.
      test.setTimeout(180_000);
      const { query, backend } = testInfo.project.metadata;
      const shots = [];
      for (const n of [10, 40]) {
        await page.goto(urlOf(htmlPage, query, `freeze=${n}`));
        const settled = await waitForSettled(page, { timeout: 60_000 });
        expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
        const sma = await waitForFrames(page, n, { timeout: 60_000 });
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
      // Thanh công cụ của cảnh mới đứng ngay sau thanh lớp (GĐ 5, thứ tự Tab): đi hết thanh lớp là Tab vào bảng của nó.
      await expect(page.locator('[data-rail] + [data-toolbar]')).toHaveCount(1);
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

    /** Mở cảnh đứng yên ở khung 10 (?freeze), đúng một "bây giờ": mọi ảnh sau đó so được với nhau. */
    async function still(page, testInfo, ...extra) {
      const { query } = testInfo.project.metadata;
      await page.goto(urlOf(htmlPage, query, 'freeze=10', 'at=2026-09-28T21:00', ...extra));
      const settled = await waitForSettled(page);
      expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
      await waitForFrames(page, 10);
    }
    // Kính tròn mặc định ở giữa khung, bán kính 18% cạnh ngắn (spec §7). Chừa lề quanh viền vàng lá của kính và vạch gạt.
    const LENS = {
      inside: { ...FULL, ring: { r: 0.18 * 0.8, inside: true } },
      outside: { ...FULL, ring: { r: 0.18 * 1.25, inside: false } },
      left: { x0: 0, y0: 0, x1: 0.48, y1: 1 },
      right: { x0: 0.52, y0: 0, x1: 1, y1: 1 },
      all: FULL,
    };

    test('mài về cốt (GĐ 4): mọi lớp trừ Cốt về 0 thì còn đất sét (ít màu, thấy hình khối, không điểm trong suốt); phủ lại thì như cũ', async ({
      page,
    }, testInfo) => {
      test.setTimeout(120_000);
      await still(page, testInfo);
      const base = (await canvasRegions(page)).all;
      const rest = meta.layers.slice(1).map((l) => l.id);
      for (const id of rest) await page.evaluate((layerId) => window.__sma.setWeight(layerId, 0), id);
      const clay = (await canvasRegions(page)).all;
      await page.screenshot({ path: testInfo.outputPath('mai-ve-cot.png') });
      expect(clay.chroma, 'đất sét phải gần như không màu').toBeLessThan(0.06);
      expect(clay.std, 'phải thấy hình khối (độ sáng thay đổi theo mặt khối)').toBeGreaterThan(0.04);
      expect(clay.mean, 'không đen kịt, không cháy trắng').toBeGreaterThan(0.03);
      expect(clay.mean).toBeLessThan(0.8);
      expect(clay.transparent, 'luật 3: không bao giờ trong suốt').toBe(0);
      for (const id of rest) await page.evaluate((layerId) => window.__sma.setWeight(layerId, 1), id);
      expect((await canvasRegions(page)).all.checksum, 'phủ lại mọi lớp thì phải về đúng ảnh cũ').toBe(base.checksum);
      expect(log.errors).toEqual([]);
    });

    test('Kính mài (GĐ 4): kính tròn giữa khung soi một view (trong kính khác, ngoài như cũ); gạt 50% (nửa trái khác, nửa phải như cũ); tắt thì như cũ', async ({
      page,
    }, testInfo) => {
      test.setTimeout(120_000);
      await still(page, testInfo);
      const base = await canvasRegions(page, LENS);
      await page.evaluate(() => window.__sma.setTool('kinh-mai'));
      await expect(page.locator('body')).toHaveAttribute('data-tool', 'kinh-mai');
      const lens = await canvasRegions(page, LENS);
      await page.screenshot({ path: testInfo.outputPath('kinh-tron.png') });
      expect(lens.inside.checksum, 'trong kính phải là view khác ảnh cuối').not.toBe(base.inside.checksum);
      expect(lens.outside.checksum, 'ngoài kính phải giữ nguyên ảnh cuối').toBe(base.outside.checksum);
      await page.locator('[data-toolbar] [data-shape="gat"]').click();
      await twoFrames(page);
      const wipe = await canvasRegions(page, LENS);
      await page.screenshot({ path: testInfo.outputPath('kinh-gat.png') });
      expect(wipe.left.checksum, 'bên trái vạch gạt là view').not.toBe(base.left.checksum);
      expect(wipe.right.checksum, 'bên phải vạch gạt là ảnh cuối').toBe(base.right.checksum);
      await page.evaluate(() => window.__sma.setTool(null));
      expect((await canvasRegions(page, LENS)).all.checksum, 'tắt công cụ thì về đúng ảnh cũ').toBe(base.all.checksum);
      expect(log.errors).toEqual([]);
      expect(log.warnings).toEqual([]);
    });

    test('khung hẹp như điện thoại (≤ 640px, GĐ 4): bật công cụ khi Sổ tay đang mở thì Sổ tay thu lại; tắt thì hiện lại', async ({
      page,
    }, testInfo) => {
      test.setTimeout(120_000);
      await still(page, testInfo);
      expect(page.viewportSize().width, 'viewport của e2e phải là khung hẹp').toBeLessThanOrEqual(640);
      const box = await page.locator('[data-stage] canvas').boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.8); // lần chạm đầu → lời mời
      await page.locator('[data-hint] button').click();
      const notebook = page.locator('[data-notebook]');
      await expect(notebook).toBeVisible();
      const tool = page.locator('[data-rail] [data-tool="kinh-mai"]');
      await tool.click();
      await expect(page.locator('[data-toolbar]')).toBeVisible();
      await expect(notebook, 'Sổ tay phải thu lại để chừa chỗ nhìn cảnh').toBeHidden();
      await tool.click();
      await expect(notebook).toBeVisible();
      await expect(page.locator('[data-toolbar]')).toBeHidden();
      expect(log.errors).toEqual([]);
    });

    /** Khung của phần tử trên trang (px CSS). */
    const rectOf = (locator) => locator.evaluate((el) => el.getBoundingClientRect().toJSON());
    /** Hai khung chồng lên nhau (chỉ chạm cạnh thì không). */
    const overlap = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    /** 'ok' khi nút nằm trọn trong khung nhìn và điểm giữa nó là chính nó (không tấm nào đè lên); không thì nói vì sao. */
    const hitTest = (locator) => locator.evaluate((el) => {
      const r = el.getBoundingClientRect();
      if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) return `ra ngoài khung nhìn: ${JSON.stringify(r)}`;
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return hit === el || el.contains(hit) ? 'ok' : `bị đè: ${hit?.outerHTML.slice(0, 80)}`;
    });
    /** Bật Từng sợi bằng nút của nó trên thanh lớp và chờ danh sách lần vẽ (tới lúc đó "Dệt lại" còn khóa, dòng chữ còn trống). */
    async function weave(page) {
      await page.locator('[data-rail] [data-tool="tung-soi"]').click();
      const slot = page.locator('[data-tool-slot="tung-soi"]');
      await expect.poll(async () => Number(await slot.locator('#tung-soi-range').getAttribute('max')), { timeout: 30_000 }).toBeGreaterThan(0);
      return slot;
    }

    test('máy tính 1280×800 (GĐ 5): xưởng mở, bảng công cụ ở giữa khoảng trống giữa thanh lớp và Sổ tay, không chồng lên tấm nào; "Dệt lại" và các nút của Kính mài bấm trúng được', async ({
      page,
    }, testInfo) => {
      test.setTimeout(180_000);
      await page.setViewportSize({ width: 1280, height: 800 });
      await still(page, testInfo);
      const box = await page.locator('[data-stage] canvas').boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.8); // lần chạm đầu → lời mời
      await page.locator('[data-hint] button').click();
      const rail = page.locator('[data-rail]');
      const notebook = page.locator('[data-notebook]');
      await expect(notebook).toBeVisible();
      /** Bảng của công cụ `id` ở giữa khoảng trống giữa thanh lớp và Sổ tay, không chồng lên tấm nào; Sổ tay vẫn mở (đủ chỗ). */
      const besideBoth = async (id) => {
        await expect(page.locator('body')).toHaveAttribute('data-tool', id);
        await expect(notebook, `${id}: đủ chỗ thì Sổ tay vẫn mở`).toBeVisible();
        const panel = await rectOf(page.locator(`[data-tool-slot="${id}"] .tool-panel`));
        const [left, right] = [await rectOf(rail), await rectOf(notebook)];
        const where = `${id}: bảng ${panel.left}–${panel.right}, thanh lớp tới ${left.right}, Sổ tay từ ${right.left}`;
        expect(overlap(panel, right), `${where}: chồng lên Sổ tay`).toBe(false);
        expect(overlap(panel, left), `${where}: chồng lên thanh lớp`).toBe(false);
        expect(Math.abs((panel.left + panel.right) / 2 - (left.right + right.left) / 2), `${where}: lệch khỏi giữa`).toBeLessThanOrEqual(1);
      };
      /**
       * "Dệt lại" của Từng sợi bấm trúng; `oneRow` thì thanh, số đếm và "Dệt lại" còn trên cùng một hàng. Một hàng chỉ kiểm ở
       * 1280px: ở ngưỡng 1240px hàng chỉ dư chừng 4px (450 trong 454px, chữ của macOS), mà trên Ubuntu của CI chữ dựng khác
       * (hinting) có thể rộng thêm vài px làm hàng xuống dòng, trong khi bảng vẫn dùng được.
       */
      const usable = async (slot, { oneRow = false } = {}) => {
        if (oneRow) {
          const middles = await slot.locator('.tool-row > :is(input, output, button)')
            .evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).map((r) => r.top + r.height / 2));
          expect(Math.max(...middles) - Math.min(...middles), `hàng của Từng sợi xuống dòng: ${middles.join(', ')}`).toBeLessThanOrEqual(2);
        }
        expect(await hitTest(slot.getByRole('button', { name: t.tools['tung-soi'].play })), '"Dệt lại"').toBe('ok');
      };
      let slot = await weave(page);
      await besideBoth('tung-soi');
      await usable(slot, { oneRow: true });
      await page.locator('[data-rail] [data-tool="kinh-mai"]').click();
      await besideBoth('kinh-mai');
      for (const chip of await page.locator('[data-tool-slot="kinh-mai"] .tool-panel button').all()) {
        expect(await hitTest(chip), `nút "${await chip.textContent()}" của Kính mài`).toBe('ok');
      }
      await page.locator('[data-rail] [data-tool="lot-lop"]').click();
      await besideBoth('lot-lop');
      expect(await hitTest(page.locator('[data-tool-slot="lot-lop"] input[type="range"]')), 'thanh của Lột lớp').toBe('ok');
      // Ngưỡng của tools.css (1240px): Sổ tay vẫn mở, bảng không chồng lên tấm nào và "Dệt lại" vẫn bấm trúng.
      await page.setViewportSize({ width: 1240, height: 800 });
      slot = await weave(page);
      await besideBoth('tung-soi');
      await usable(slot);
      // Khoảng trống rộng hơn bảng (1440px: 680px cho bảng 560px): bảng vẫn ở giữa, dù dòng chữ của Từng sợi dài hơn 560px.
      await page.setViewportSize({ width: 1440, height: 900 });
      await besideBoth('tung-soi');
      // Xưởng đóng (thanh lớp hidden): bảng về giữa cả khung như trước. Đóng thanh lớp thì công cụ tắt, nên bật lại qua __sma.
      await rail.locator('.rail-close').click();
      await page.evaluate(() => window.__sma.setTool('tung-soi'));
      const alone = await rectOf(slot.locator('.tool-panel'));
      expect(Math.abs((alone.left + alone.right) / 2 - 720), `bảng ${alone.left}–${alone.right} phải ở giữa khung 1440px`).toBeLessThanOrEqual(1);
      expect(log.errors).toEqual([]);
    });

    test('máy tính hẹp 1024×768 (GĐ 5): không đủ chỗ giữa thanh lớp và Sổ tay, nên bật công cụ thì Sổ tay thu lại, tắt thì hiện lại; bảng không chồng lên thanh lớp', async ({
      page,
    }, testInfo) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: 1024, height: 768 });
      await still(page, testInfo);
      const box = await page.locator('[data-stage] canvas').boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.8); // lần chạm đầu → lời mời
      await page.locator('[data-hint] button').click();
      const notebook = page.locator('[data-notebook]');
      await expect(notebook).toBeVisible();
      const slot = await weave(page);
      await expect(notebook, 'Sổ tay phải thu lại để bảng có chỗ').toBeHidden();
      const panel = await rectOf(slot.locator('.tool-panel'));
      const bar = await rectOf(page.locator('[data-toolbar]')); // khoảng trống dành cho bảng: từ sau thanh lớp tới lề phải
      const where = `bảng ${panel.left}–${panel.right}, thanh công cụ ${bar.left}–${bar.right}`;
      expect(overlap(panel, await rectOf(page.locator('[data-rail]'))), `${where}: chồng lên thanh lớp`).toBe(false);
      expect(Math.abs((panel.left + panel.right) / 2 - (bar.left + bar.right) / 2), `${where}: lệch khỏi giữa`).toBeLessThanOrEqual(1);
      expect(await hitTest(slot.getByRole('button', { name: t.tools['tung-soi'].play })), '"Dệt lại"').toBe('ok');
      await page.locator('[data-rail] [data-tool="tung-soi"]').click();
      await expect(notebook).toBeVisible();
      await expect(page.locator('[data-toolbar]')).toBeHidden();
      expect(log.errors).toEqual([]);
    });

    test('Lột lớp (GĐ 4): mỗi nấc cho ảnh khác nấc kề bên; về nấc cuối (bên phải) thì đúng ảnh cũ', async ({ page }, testInfo) => {
      test.setTimeout(180_000);
      await still(page, testInfo);
      const base = (await canvasRegions(page)).all;
      await page.evaluate(() => window.__sma.setTool('lot-lop'));
      const range = page.locator('[data-tool-slot="lot-lop"] input[type="range"]'); // Từng sợi cũng có một thanh trong [data-toolbar]
      const last = Number(await range.getAttribute('max'));
      const slide = async (v) => {
        const before = await range.getAttribute('aria-valuetext');
        await range.evaluate((el, value) => {
          el.value = String(value);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }, v);
        // View Normal phải mài (biên dịch lại) trước khi hiện: chờ tên view đổi, rồi chờ khung vẽ lại.
        await expect.poll(() => range.getAttribute('aria-valuetext'), { timeout: 60_000 }).not.toBe(before);
        await twoFrames(page);
        return (await canvasRegions(page)).all.checksum;
      };
      // Tên hai tap của Phủ bóng (engine/stock/phu-bong/content.vi.js; file đó import '?raw' nên Node không nạp được). "Trước tone" là
      // "Trước bloom" cộng ánh bloom: không có gì phát sáng (ảnh "Chỉ emissive" đen tuyền, như Bức 4 khi chưa có giấy điệp, GĐ 8) thì
      // bloom cộng đúng 0 và hai nấc phải TRÙNG nhau; có thì phải khác. Mọi cặp nấc kề bên khác phải khác nhau.
      const [TONE, BLOOM] = ['Trước tone', 'Trước bloom'];
      const shots = new Map();
      let previous = { name: t.views.final, shot: base.checksum };
      for (let v = last - 1; v >= 0; v -= 1) {
        const shot = await slide(v);
        const name = await range.getAttribute('aria-valuetext');
        shots.set(name, shot);
        if (name !== BLOOM || previous.name !== TONE) expect(shot, `nấc ${v} (${name}) giống nấc kề bên`).not.toBe(previous.shot);
        previous = { name, shot };
      }
      if (shots.has(BLOOM) && shots.has(TONE)) {
        const glows = shots.get(t.views.emissive) !== 0;
        expect(shots.get(BLOOM) === shots.get(TONE), `"${TONE}" trùng "${BLOOM}" khi và chỉ khi không có gì phát sáng`).toBe(!glows);
      }
      await page.screenshot({ path: testInfo.outputPath('lot-lop-cuoi.png') });
      expect(await slide(last), 'về nấc cuối thì phải đúng ảnh cũ').toBe(base.checksum);
      expect(log.errors).toEqual([]);
    });

    test('Normal (GĐ 4): chọn Normal trong Kính mài thì thấy "đang mài…", rồi ảnh đổi; không lỗi console', async ({ page }, testInfo) => {
      test.setTimeout(120_000);
      await still(page, testInfo);
      const base = await canvasRegions(page, LENS);
      await page.evaluate(() => window.__sma.setTool('kinh-mai'));
      // Ghi mọi chữ từng hiện trong dòng trạng thái (vùng aria-live): "đang mài…" có thể chỉ hiện vài trăm ms.
      await page.evaluate(() => {
        window.__statusLog = [];
        const status = document.querySelector('[data-tool-slot="kinh-mai"] .tool-status');
        new MutationObserver(() => window.__statusLog.push(status.textContent)).observe(status, { childList: true, characterData: true, subtree: true });
      });
      const normal = page.locator('[data-toolbar] [data-view="normal"]');
      await normal.click();
      await expect(normal).toHaveAttribute('aria-pressed', 'true', { timeout: 60_000 });
      await twoFrames(page);
      expect(await page.evaluate(() => window.__statusLog)).toContain(t.toolStatus.grinding);
      const shot = await canvasRegions(page, LENS);
      await page.screenshot({ path: testInfo.outputPath('normal.png') });
      expect(shot.inside.checksum).not.toBe(base.inside.checksum);
      expect(shot.outside.checksum).toBe(base.outside.checksum);
      expect(log.errors).toEqual([]);
      expect(log.warnings).toEqual([]);
    });

    test('Normal lúc cảnh đang chạy (GĐ 9, lỗi từ GĐ 4): biên dịch lại trong lúc giữ khung, không lỗi GPU, cảnh vẫn live', async ({
      page,
    }, testInfo) => {
      test.setTimeout(120_000);
      const { query } = testInfo.project.metadata;
      // KHÔNG ?freeze: vòng lặp chạy trong lúc biên dịch lại cả cảnh với MRT mới (spec §21.3, Phụ lục A.105).
      await page.goto(urlOf(htmlPage, query));
      const settled = await waitForSettled(page);
      expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
      await page.evaluate(() => window.__sma.setTool('kinh-mai'));
      const normal = page.locator('[data-toolbar] [data-view="normal"]');
      await normal.click();
      await expect(normal).toHaveAttribute('aria-pressed', 'true', { timeout: 60_000 });
      const after = (await readSma(page)).frames;
      await expect.poll(async () => (await readSma(page)).frames, { timeout: 60_000 }).toBeGreaterThan(after + 10);
      expect((await readSma(page)).state).toBe('live');
      expect(log.errors).toEqual([]);
      expect(log.warnings).toEqual([]);
      // Chromium báo lỗi GL của WebGL2 ("GL_INVALID_OPERATION: … missing fragment shader outputs") ở mức console.warning và không
      // khớp DEPRECATION, nên `log.errors` / `log.warnings` đều không thấy: quét thẳng toàn bộ console.
      expect(log.all.filter((line) => /GL_INVALID_|Lỗi GPU|Render pipeline creation failed|Invalid (RenderPipeline|CommandBuffer)/.test(line))).toEqual([]);
    });

    test('Bản dịch (GĐ 9) dưới ?freeze: mã của lượt vẽ cảnh và của quad cuối, đúng ngôn ngữ; dịch lại ra cùng mã; ảnh không đổi', async ({
      page,
    }, testInfo) => {
      test.setTimeout(180_000);
      const { backend } = testInfo.project.metadata;
      const layer = GD9[meta.slug].layer;
      await still(page, testInfo);
      const before = (await canvasRegions(page)).all.checksum;
      const tr = await page.evaluate((id) => window.__sma.translate(id), layer);
      expect([tr.backend, tr.language]).toEqual([backend, backend === 'webgpu' ? 'wgsl' : 'glsl']);
      expect(tr.places.some((p) => p.hits.vertex + p.hits.fragment > 0), 'không nơi nào có uniform của lớp').toBe(true);
      expect(tr.places.filter((p) => p.error).map((p) => `${p.label}: ${p.error}`)).toEqual([]);
      for (const p of tr.places.filter((x) => x.drawn && !x.post)) expect(outputsOf(p.fragment), p.label).toBeGreaterThanOrEqual(2);
      // Khung đứng yên vẽ lại không dựng lại gì: bắt lần hai ra đúng từng ký tự.
      const again = await page.evaluate((id) => window.__sma.translate(id), layer);
      expect(changedPlaces(tr, again), 'dịch lại khung đứng yên mà mã khác').toEqual([]);
      const post = await page.evaluate(() => window.__sma.translate('phu-bong'));
      expect(post.places.some((p) => p.post && /\bw_phu_bong\b/.test(p.fragment))).toBe(true);
      expect((await canvasRegions(page)).all.checksum, 'dịch xong mà khung đứng yên đổi').toBe(before);
      expect(log.errors).toEqual([]);
    });

    test('Bản dịch (GĐ 9) lúc cảnh đang chạy: bắt khung kế tiếp, hai lần liền ra cùng mã; cảnh vẽ tiếp, không lỗi GPU', smoke, async ({
      page,
    }, testInfo) => {
      test.setTimeout(180_000);
      const { query } = testInfo.project.metadata;
      const layer = GD9[meta.slug].layer;
      await page.goto(urlOf(htmlPage, query));
      expect((await waitForSettled(page)).state).toBe('live');
      const first = await page.evaluate((id) => window.__sma.translate(id), layer);
      const again = await page.evaluate((id) => window.__sma.translate(id), layer);
      expect(first.places.some((p) => p.hits.vertex + p.hits.fragment > 0), 'không nơi nào có uniform của lớp').toBe(true);
      expect(changedPlaces(first, again), 'hai lần dịch liền nhau mà mã khác').toEqual([]);
      const frames = (await readSma(page)).frames;
      await expect.poll(async () => (await readSma(page)).frames, { timeout: 60_000 }).toBeGreaterThan(frames + 10);
      expect((await readSma(page)).state).toBe('live');
      expect(log.errors).toEqual([]);
      expect(log.warnings).toEqual([]);
      // Lỗi GL của WebGL2 tới console ở mức warning (Phụ lục A.105): quét thẳng toàn bộ console như test Normal lúc cảnh đang chạy.
      expect(log.all.filter((line) => /GL_INVALID_|Lỗi GPU|Render pipeline creation failed|Invalid (RenderPipeline|CommandBuffer)/.test(line))).toEqual([]);
    });

    test('?poster (GĐ 4): ngoài canvas không có phần tử UI nào hiện (chữ, huy hiệu, thanh lớp, thanh công cụ)', async ({ page }, testInfo) => {
      await still(page, testInfo, 'poster');
      await expect(page.locator('[data-stage] canvas')).toBeVisible();
      const shown = await page.evaluate(() => [...document.body.querySelectorAll('*')]
        .filter((el) => !el.closest('[data-stage]') && el.tagName !== 'SCRIPT')
        .filter((el) => el.checkVisibility({ visibilityProperty: true, opacityProperty: true }))
        .map((el) => el.outerHTML.slice(0, 80)));
      expect(shown).toEqual([]);
      expect(log.errors).toEqual([]);
    });

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

    test('Từng sợi (GĐ 5): bật thì ảnh không đổi (nấc N); sợi 0 gần như một màu; mỗi nấc có dòng mô tả; "Dệt lại" chạy tới N; tắt thì như cũ', async ({
      page,
    }, testInfo) => {
      test.setTimeout(180_000);
      await still(page, testInfo);
      const base = (await canvasRegions(page)).all;
      await page.evaluate(() => window.__sma.setTool('tung-soi'));
      await expect(page.locator('body')).toHaveAttribute('data-tool', 'tung-soi');
      const slot = page.locator('[data-tool-slot="tung-soi"]');
      const range = slot.locator('#tung-soi-range');
      // Danh sách lần vẽ chỉ có sau khung vẽ lại đầu tiên đi qua móc; tới lúc đó thanh là 0/0 ("Đang đếm các lần vẽ…").
      await expect.poll(async () => Number(await range.getAttribute('max')), { timeout: 30_000 }).toBeGreaterThan(0);
      const n = Number(await range.getAttribute('max'));
      expect(await range.inputValue(), 'mở công cụ thì thanh đứng ở nấc cuối').toBe(String(n));
      await twoFrames(page);
      expect((await canvasRegions(page)).all.checksum, 'bật Từng sợi (nấc N: vẽ đủ) mà ảnh đổi').toBe(base.checksum);
      const text = t.tools['tung-soi'];
      /** Kéo thanh tới nấc v như người xem (sự kiện input), rồi chờ khung đứng yên vẽ lại với k = v. */
      const slide = async (v) => {
        await range.evaluate((el, value) => {
          el.value = String(value);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }, v);
        await twoFrames(page);
      };
      await slide(0);
      const bare = (await canvasRegions(page)).all;
      await page.screenshot({ path: testInfo.outputPath('tung-soi-0.png') });
      testInfo.annotations.push({ type: 'tung-soi', description: `N = ${n}; sợi 0: std ${bare.std.toFixed(4)}, đủ: std ${base.std.toFixed(4)}` });
      expect(bare.std, `sợi 0 phải gần như một màu (std độ sáng ${bare.std.toFixed(4)})`).toBeLessThan(ONE_COLOUR_STD);
      // Một màu mà là màu nền xóa khung, không phải canvas trong suốt (lúc chụp, nền trang hồng sen cũng là "một màu").
      expect(bare.transparent, 'sợi 0: canvas không bao giờ trong suốt').toBe(0);
      for (let k = 1; k <= Math.min(n, 4); k += 1) {
        await slide(k);
        // "Sợi k trên N: <nhãn vật>": tiến độ tới trình đọc màn hình qua aria-valuetext của thanh. Dòng mô tả nói về đúng vật đó.
        const prefix = text.valuetext(k, n, '');
        const valuetext = await range.getAttribute('aria-valuetext');
        expect(valuetext.startsWith(prefix) && valuetext.length > prefix.length, `nấc ${k}: aria-valuetext "${valuetext}"`).toBe(true);
        await expect(slot.locator('.tool-detail'), `nấc ${k}: dòng mô tả sợi`).toContainText(valuetext.slice(prefix.length));
      }
      const play = slot.getByRole('button', { name: text.play });
      // Ghi từng nấc "Dệt lại" đi qua (mỗi bước đổi aria-valuetext của thanh, mỗi bước một tác vụ riêng): chỉ nhìn lúc kết thúc thì
      // một lượt nhảy thẳng tới N cũng qua.
      await range.evaluate((el) => {
        window.__woven = [];
        new MutationObserver(() => window.__woven.push(Number(el.value))).observe(el, { attributeFilter: ['aria-valuetext'] });
      });
      await play.click();
      await expect(play).toHaveAttribute('aria-pressed', 'true');
      // "Dệt lại" đi 0 → N, mỗi bước playStride(N) sợi: chờ playStepMs(N) (0,6 s khi ít sợi) rồi vẽ lại khung đứng yên, mà trên
      // GPU phần mềm một lần vẽ lại có khi hơn 100 ms, máy bận thì lâu hơn nhiều. Mỗi bước cho thêm 1 s, cả lượt thêm 30 s dư.
      const stride = playStride(n);
      const steps = Math.ceil(n / stride);
      await expect.poll(async () => [await play.getAttribute('aria-pressed'), await range.inputValue()], {
        timeout: steps * (playStepMs(n) + 1000) + 30_000,
      }).toEqual(['false', String(n)]);
      // Từ sợi 0 (chỉ còn màu nền), mỗi bước thêm playStride(N) sợi, bước cuối đáp đúng N.
      const expected = [0, ...Array.from({ length: steps }, (_, i) => Math.min((i + 1) * stride, n))];
      expect(await page.evaluate(() => window.__woven), '"Dệt lại" phải đi từng bước').toEqual(expected);
      await page.evaluate(() => window.__sma.setTool(null));
      expect((await canvasRegions(page)).all.checksum, 'tắt Từng sợi thì phải về đúng ảnh cũ').toBe(base.checksum);
      expect(log.errors).toEqual([]);
      expect(log.warnings).toEqual([]);
    });

    test('quầng trăng (GĐ 5): chunk three tới chậm thì lúc loading có quầng (phần vòng 0–1); live thì đã gỡ; đích các mốc đúng thứ tự; ?static không có quầng', async ({
      page,
    }, testInfo) => {
      test.skip(!readFileSync(new URL(`../${htmlPage}`, import.meta.url), 'utf8').includes('data-moon'), 'bức không có trăng: không có quầng');
      test.setTimeout(120_000);
      const { query } = testInfo.project.metadata;
      // Chunk three tới chậm 1,5 s: trang đứng ở 'loading' đủ lâu để đọc quầng. Hạn 10 s của boot vẫn tính cả 1,5 s này.
      await page.route('**/three-*.js', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await route.continue();
      });
      // Ghi mọi ĐÍCH mà quầng nhận: ui/moon-progress.js đặt stroke-dashoffset inline = 1 − phần vòng của mốc (giá trị tính
      // được lúc đó là chỗ quầng đang bò tới). Gắn trước mọi script của trang, cho từng lần mở trang.
      await page.addInitScript(() => {
        window.__haloLog = [];
        const scratch = document.createElement('i'); // tách khai báo của một chuỗi style bằng CSSOM
        const offsetOf = (css) => {
          scratch.style.cssText = css ?? '';
          return scratch.style.strokeDashoffset;
        };
        new MutationObserver((records) => {
          records.forEach((record, i) => {
            if (!record.target.classList?.contains('moon-halo')) return;
            // Một lần gọi gom mọi lần đổi của một tác vụ (mỗi mốc đổi style hai, ba lần liền nhau): style mới của bản ghi i là
            // oldValue của bản ghi kế tiếp trên cùng phần tử, hay style hiện tại nếu không còn bản ghi nào sau nó.
            const next = records.slice(i + 1).find((r) => r.target === record.target);
            const offset = offsetOf(next ? next.oldValue : record.target.getAttribute('style'));
            if (offset !== '' && offset !== offsetOf(record.oldValue)) {
              window.__haloLog.push({ offset: Number.parseFloat(offset), t: performance.now() });
            }
          });
        }).observe(document, { subtree: true, attributeFilter: ['style'], attributeOldValue: true });
      });
      await page.goto(urlOf(htmlPage, query, 'freeze=10'));
      // Chờ tới lúc có quầng ('loading' trở đi), hay tới lúc trang đã xong: boot về tầng tĩnh (như hết hạn 10 s trên máy CI quá
      // tải) thì test báo ngay lý do, không đứng chờ tới hết giờ của test. Chunk three tới chậm 1,5 s, nên trang đi đúng đường
      // thì lần chờ này vẫn gặp 'loading' trước.
      await page.waitForFunction(() => ['loading', 'compiling', 'fading', 'live', 'static'].includes(document.body.dataset.state), null, {
        timeout: 30_000,
      });
      const early = await readSma(page);
      expect(early.state, `về tầng tĩnh: ${early.reason} · ${early.error}`).not.toBe('static');
      const loading = await page.evaluate(() => {
        const halo = document.querySelector('[data-moon] .moon-halo');
        // Giá trị TÍNH ĐƯỢC giữa lúc chuyển: quầng đang ở đâu trên đường bò từ 1 (rỗng) tới đích của mốc.
        return { state: document.body.dataset.state, crawl: halo ? Number.parseFloat(getComputedStyle(halo).strokeDashoffset) : null };
      });
      expect(loading.crawl, `lúc ${loading.state} phải có quầng`).not.toBeNull();
      expect(loading.crawl).toBeGreaterThanOrEqual(0);
      expect(loading.crawl).toBeLessThanOrEqual(1);
      const settled = await waitForSettled(page, { timeout: 60_000 });
      expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
      await expect(page.locator('[data-moon] .moon-halo'), 'live thì quầng đã tan và bị gỡ').toHaveCount(0);
      const haloLog = await page.evaluate(() => window.__haloLog);
      const trace = `__haloLog = ${JSON.stringify(haloLog)}`;
      // Đích và lúc nhận (ms từ lúc mở trang): đọc ngay được lúc khởi động mất bao lâu, so với hạn 10 s của boot.
      testInfo.annotations.push({ type: 'quang-trang', description: haloLog.map((e) => `${e.offset} @ ${Math.round(e.t)} ms`).join(' → ') });
      const offsets = haloLog.map((entry) => entry.offset);
      expect(offsets.every((v, i) => i === 0 || v <= offsets[i - 1]), `quầng không bao giờ lùi · ${trace}`).toBe(true);
      // Đích của từng mốc theo đúng thứ tự: chỉ test này kiểm dây nối progress('chunk') của boot.js trong trình duyệt thật, với
      // lần import() thật của run.js (tests/unit/boot.test.js giữ dây nối ấy trong jsdom, với loadRun giả).
      const milestones = ['loading', 'chunk', 'compiling', 'fading'];
      let matched = 0;
      for (const v of offsets) if (matched < milestones.length && Math.abs(v - (1 - HALO_STEPS[milestones[matched]].to)) <= 1e-6) matched += 1;
      expect(matched, `thiếu đích của mốc '${milestones[matched]}' · ${trace}`).toBe(milestones.length);
      // Tầng tĩnh không tải gì để chờ: không bao giờ có quầng.
      await page.goto(urlOf(htmlPage, 'static'));
      expect((await waitForSettled(page)).state).toBe('static');
      await expect(page.locator('[data-moon] .moon-halo')).toHaveCount(0);
      expect(await page.evaluate(() => window.__haloLog)).toEqual([]);
      expect(log.errors).toEqual([]);
    });
  });
}
