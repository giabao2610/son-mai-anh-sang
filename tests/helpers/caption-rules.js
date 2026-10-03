// tests/helpers/caption-rules.js — luật của content.captions (GĐ 5, chữ đi theo vật): test hợp đồng áp cho mọi bức, captions-rule.test.js tự kiểm.
import { KEBAB } from './kebab.js';

export const CAPTION_MAX_CHARS = 60; // một dòng chữ đi theo vật vừa một hàng trên điện thoại

const filled = (v) => typeof v === 'string' && v.trim() !== '';

/**
 * Lỗi của content.captions (GĐ 5, chữ đi theo vật), mỗi lỗi một câu; [] khi hợp lệ hay khi bức không có captions.
 * Khóa kebab-case không dấu (code của bức chỉ chứa khóa); mỗi mục 1–2 dòng không rỗng, mỗi dòng tối đa
 * CAPTION_MAX_CHARS ký tự (đếm theo ký tự, không theo đơn vị UTF-16); có nguồn; tác giả có thì không rỗng.
 * @param {unknown} captions
 * @returns {string[]}
 */
export function captionErrors(captions) {
  if (captions === undefined) return [];
  if (captions === null || typeof captions !== 'object' || Array.isArray(captions)) return ['captions phải là { khóa: { lines, source, author? } }'];
  const errors = [];
  for (const [key, poem] of Object.entries(captions)) {
    if (!KEBAB.test(key)) errors.push(`khóa "${key}" phải là kebab-case không dấu`);
    const { lines, source, author } = poem ?? {};
    if (!Array.isArray(lines) || lines.length < 1 || lines.length > 2) errors.push(`"${key}": lines phải có 1–2 dòng`);
    else {
      for (const line of lines) {
        if (!filled(line)) errors.push(`"${key}": có dòng rỗng`);
        else if ([...line].length > CAPTION_MAX_CHARS) {
          errors.push(`"${key}": dòng dài ${[...line].length} ký tự (tối đa ${CAPTION_MAX_CHARS}): "${line}"`);
        }
      }
    }
    if (!filled(source)) errors.push(`"${key}": thiếu source (nguồn là bắt buộc, như thơ của meta)`);
    if (author !== undefined && !filled(author)) errors.push(`"${key}": author có thì không được rỗng`);
  }
  return errors;
}
