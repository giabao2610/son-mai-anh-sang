// scripts/poster.js — chụp poster (WebP ≤ 150 KB) và ảnh og (JPEG 1200×630) của một bức từ chính cảnh 3D, trên GPU thật.
//
// Chạy trên máy có GPU thật (WebGPU), sau khi build:  npm run build && node scripts/poster.js <slug>
// Script tự mở `vite preview`, mở trang ở ?at=<capture.at>&freeze=<capture.freeze>&poster&level=cao, chờ đúng khung đó,
// chụp khung hình, rồi mã hóa NGAY TRONG TRANG (canvas 2D → toBlob), nên không cần thêm gói npm nào (không sharp).
// Ảnh ghi vào public/ theo meta.poster.src và meta.og. CI không chạy script này: ảnh được commit vào repo (spec §8.7).
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { paintings } from '../src/paintings/registry.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const PORT = 4274;
const BASE = `http://127.0.0.1:${PORT}/son-mai-anh-sang/`;
/** Giới hạn cỡ file (spec §10): poster WebP ≤ 150 KB, og JPEG ≤ 200 KB. */
export const LIMITS = Object.freeze({ poster: 150 * 1024, og: 200 * 1024 });
export const OG = Object.freeze({ width: 1200, height: 630, quality: 0.85 });
/** Chất lượng WebP thử lần lượt, từ cao xuống: lấy mức cao nhất mà file vẫn ≤ giới hạn. */
export const QUALITIES = Object.freeze([0.92, 0.88, 0.84, 0.8, 0.76, 0.72, 0.68, 0.64, 0.6, 0.55, 0.5, 0.45, 0.4]);

/**
 * URL chụp poster của một dòng registry (tương đối với BASE): đúng thời điểm và khung của meta.poster.capture, ẩn mọi UI,
 * ép mức cao (ảnh đẹp nhất, không phụ thuộc máy chụp là điện thoại hay máy yếu).
 * @param {{ meta: import('../src/engine/contracts/painting.js').PaintingMeta, page: string }} row
 */
export function captureUrl({ meta, page }) {
  const capture = meta.poster.capture;
  if (!capture) throw new Error(`Bức "${meta.slug}" chưa có meta.poster.capture: không biết chụp lúc nào`);
  const dir = page.replace(/index\.html$/, '');
  return `${dir}?at=${capture.at}&freeze=${capture.freeze}&poster&level=cao`;
}

/**
 * Vùng cắt ở GIỮA ảnh, đúng tỉ lệ của khung đích, lớn nhất có thể (rồi mới thu về cỡ đích): og 1200×630 từ poster 1600×1000.
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function centerCrop(width, height, targetWidth, targetHeight) {
  const scale = Math.min(width / targetWidth, height / targetHeight);
  const w = Math.round(targetWidth * scale);
  const h = Math.round(targetHeight * scale);
  return { x: Math.round((width - w) / 2), y: Math.round((height - h) / 2), width: w, height: h };
}

/**
 * Chọn chất lượng cao nhất mà file vẫn ≤ giới hạn. `sizeAt(q)` mã hóa thử và trả số byte.
 * @param {(q: number) => Promise<number>} sizeAt
 * @param {number} limit
 * @returns {Promise<number>}  chất lượng đã chọn
 */
export async function pickQuality(sizeAt, limit, qualities = QUALITIES) {
  for (const q of qualities) if ((await sizeAt(q)) <= limit) return q;
  throw new Error(`Ở chất lượng thấp nhất (${qualities.at(-1)}) ảnh vẫn quá ${Math.round(limit / 1024)} KB`);
}

/**
 * Chờ `vite preview` trả lời (tối đa 30 giây). Server đã dừng (chưa build, cổng bận, thiếu npx) thì báo ngay kèm lý do,
 * không chờ hết giờ: lỗi của chính vite đã in ra stderr.
 * @param {string} url
 * @param {() => string | null} stopped  lý do server không còn chạy, hay null khi vẫn chạy
 */
export async function waitForServer(url, stopped = () => null, { tries = 60, everyMs = 500 } = {}) {
  for (let i = 0; i < tries; i += 1) {
    const why = stopped();
    if (why) throw new Error(`vite preview ${why}: đã chạy npm run build chưa, hay cổng ${PORT} đang bận?`);
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // chưa mở cổng
    }
    await new Promise((resolve) => setTimeout(resolve, everyMs));
  }
  throw new Error(`vite preview không trả lời ở ${url}`);
}

/** Đóng Chromium rồi tắt vite preview: LUÔN tắt server, kể cả khi đóng trình duyệt hỏng (cổng 4274 không kẹt lại). */
export async function shutdown(browser, server) {
  try {
    await browser?.close();
  } catch (err) {
    console.warn(`Không đóng được Chromium: ${err.message}`);
  } finally {
    server.kill();
  }
}

async function main(slug) {
  const row = paintings.find((p) => p.meta.slug === slug);
  if (!row) throw new Error(`Không có bức "${slug}" trong registry. Có: ${paintings.map((p) => p.meta.slug).join(', ')}`);
  const { poster, og } = row.meta;
  if (!og) throw new Error(`Bức "${slug}" chưa có meta.og (đường dẫn ảnh og trong public/)`);
  // stderr của vite in thẳng ra (cổng bận, thiếu dist/); thiếu npx thì spawn báo 'error': bắt lấy để nói lý do.
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], {
    cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'],
  });
  let spawnError = null;
  server.on('error', (err) => {
    spawnError = err;
  });
  const stopped = () => {
    if (spawnError) return `không chạy được (${spawnError.message})`;
    return server.exitCode === null ? null : `đã dừng (mã ${server.exitCode})`;
  };
  let browser = null;
  try {
    browser = await chromium.launch({ channel: 'chromium' }); // Chromium đầy đủ: dùng GPU thật của máy
    await waitForServer(BASE, stopped);
    const page = await browser.newPage({ viewport: { width: poster.width, height: poster.height }, deviceScaleFactor: 1 });
    await page.goto(BASE + captureUrl(row));
    const freeze = poster.capture.freeze;
    await page.waitForFunction((n) => window.__sma?.state === 'static' || window.__sma?.frames >= n, freeze, { timeout: 120_000 });
    const sma = await page.evaluate(() => ({ state: window.__sma.state, backend: window.__sma.backend, frames: window.__sma.frames }));
    if (sma.state !== 'live' || sma.backend !== 'webgpu') {
      throw new Error(`Cần WebGPU trên GPU thật để chụp poster; trang đang ở ${sma.state} / ${sma.backend}`);
    }
    // Chụp khung hình (?poster đã ẩn mọi UI), rồi mã hóa trong trang bằng canvas 2D: WebP cho poster, JPEG cho og.
    const b64 = (await page.screenshot({ type: 'png' })).toString('base64');
    /** Cắt vùng `area` của ảnh chụp, thu về `size`, mã hóa `type` ở chất lượng `quality`; trả các byte của file. */
    const encode = async (type, quality, area, size) => Buffer.from(await page.evaluate(async (p) => {
      const img = new Image();
      img.src = `data:image/png;base64,${p.b64}`;
      await img.decode();
      const canvas = document.createElement('canvas');
      [canvas.width, canvas.height] = p.size;
      canvas.getContext('2d').drawImage(img, p.area.x, p.area.y, p.area.width, p.area.height, 0, 0, p.size[0], p.size[1]);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, p.type, p.quality));
      return [...new Uint8Array(await blob.arrayBuffer())];
    }, { b64, type, quality, area, size }));
    const full = { x: 0, y: 0, width: poster.width, height: poster.height };
    const posterSize = [poster.width, poster.height];
    const q = await pickQuality(async (quality) => (await encode('image/webp', quality, full, posterSize)).length, LIMITS.poster);
    const webp = await encode('image/webp', q, full, posterSize);
    const jpeg = await encode('image/jpeg', OG.quality, centerCrop(poster.width, poster.height, OG.width, OG.height), [OG.width, OG.height]);
    if (jpeg.length > LIMITS.og) throw new Error(`og.jpg ${Math.round(jpeg.length / 1024)} KB, quá ${LIMITS.og / 1024} KB`);
    for (const [file, bytes] of [[`${ROOT}public${poster.src}`, webp], [`${ROOT}public/${og}`, jpeg]]) {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, bytes);
    }
    console.log(`Đã chụp ở khung ${sma.frames} (${sma.backend}): public${poster.src} (${Math.round(webp.length / 1024)} KB, WebP q ${q}), `
      + `public/${og} (${Math.round(jpeg.length / 1024)} KB)`);
  } finally {
    await shutdown(browser, server);
  }
}

// import.meta.main (Node ≥ 24.2): so import.meta.url với process.argv[1] thì lệch khi gọi thiếu đuôi .js hay qua symlink, và script
// lặng lẽ không làm gì mà vẫn thoát 0 (review cuối GĐ 7). Khi được import (test, vite.config.js) thì false.
if (import.meta.main) {
  main(process.argv[2]).catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
}
