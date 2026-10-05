// scripts/e2e-groups.js — ma trận nhóm e2e cho CI (spec §19.9): mỗi bức một nhóm (lọc test theo "{tên bức} · "), cộng nhóm "chung" cho test không thuộc bức nào. Chạy trực tiếp thì in một dòng groups=<JSON> cho $GITHUB_OUTPUT.
import { pathToFileURL } from 'node:url';
import { paintings } from '../src/paintings/registry.js';

/** Thoát ký tự đặc biệt của regex trong tên bức. */
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Nhóm của một bức bắt mọi test có "{tên bức} · " trong tên (spec của bức, và e2e chung lặp qua registry đặt tên describe như thế);
 * nhóm "chung" lấy phần còn lại. Thêm bức vào registry là thêm một nhóm: không phải sửa workflow.
 * @returns {{ id: string, grep: string, grepInvert: string }[]}
 */
export function groups(list = paintings) {
  const prefixes = list.map(({ meta }) => `${escape(meta.title)} · `);
  return [
    ...list.map(({ meta }, i) => ({ id: meta.slug, grep: prefixes[i], grepInvert: '' })),
    { id: 'chung', grep: '', grepInvert: prefixes.join('|') },
  ];
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) console.log(`groups=${JSON.stringify(groups())}`);
