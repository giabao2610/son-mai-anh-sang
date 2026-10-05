// scripts/e2e-groups.js — ma trận nhóm e2e cho CI (spec §19.9): mỗi bức một nhóm (lọc test theo "{tên bức} · "), cộng nhóm "chung" cho test không thuộc bức nào. Chạy trực tiếp thì in một dòng groups=<JSON> cho $GITHUB_OUTPUT.
import { paintings } from '../src/paintings/registry.js';

/** Tag của test khói (Playwright `{ tag }`): bức có ciWebgpuSmoke thì job e2e WebGPU của CI chỉ chạy các test mang tag này. */
export const SMOKE_TAG = '@khoi';

/** Thoát ký tự đặc biệt của regex trong tên bức. */
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Nhóm của một bức bắt mọi test có "{tên bức} · " trong tên (spec của bức, và e2e chung lặp qua registry đặt tên describe như thế);
 * nhóm "chung" lấy phần còn lại. Thêm bức vào registry là thêm một nhóm: không phải sửa workflow.
 * webgpuGrep: mẫu lọc của job e2e WebGPU. Bằng grep, trừ bức có ciWebgpuSmoke: chỉ test mang SMOKE_TAG (Playwright khớp --grep với
 * chuỗi gồm cả tên test lẫn tag).
 * @returns {{ id: string, grep: string, grepInvert: string, webgpuGrep: string }[]}
 */
export function groups(list = paintings) {
  const prefixes = list.map(({ meta }) => `${escape(meta.title)} · `);
  return [
    ...list.map(({ meta, ciWebgpuSmoke }, i) => ({
      id: meta.slug, grep: prefixes[i], grepInvert: '', webgpuGrep: ciWebgpuSmoke ? `${prefixes[i]}.*${SMOKE_TAG}` : prefixes[i],
    })),
    { id: 'chung', grep: '', grepInvert: prefixes.join('|'), webgpuGrep: '' },
  ];
}

// import.meta.main (Node ≥ 24.2): so import.meta.url với process.argv[1] thì lệch khi gọi thiếu đuôi .js hay qua symlink, và script
// lặng lẽ không làm gì mà vẫn thoát 0 (review cuối GĐ 7). Khi được import (test, vite.config.js) thì false.
if (import.meta.main) console.log(`groups=${JSON.stringify(groups())}`);
