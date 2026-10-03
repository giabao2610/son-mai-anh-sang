// tests/rules/files.test.js — luật cho từng file nguồn (src/**/*.js, plugins/*.js): dòng 1 là chú thích, số dòng, API cấm, chỗ đặt móc lần vẽ.
import { afterAll, describe, expect, it } from 'vitest';
import { importedNames, listSrc, read, stripComments } from '../helpers/source.js';

const FILES = listSrc();
const SOFT_LIMIT = 250; // mục tiêu: mỗi file đọc được trong một lần
const HARD_LIMIT = 300; // quá mức này thì test hỏng
const DRAW_HOOK_FILE = 'src/engine/gpu/draws.js'; // nơi DUY NHẤT đặt móc lần vẽ của renderer (GĐ 5, Từng sợi)
const nearLimit = [];

/** Số dòng vật lý, đếm như `wc -l` (số ký tự xuống dòng). */
const lineCount = (code) => (code.match(/\n/g) ?? []).length;

/** Báo lỗi dạng "file:dòng — lý do", mỗi lỗi một dòng, để sửa được ngay. */
const report = (title, errors) => `${title}\n${errors.map((e) => `  ${e}`).join('\n')}`;

/** Số dòng (từ 1) của vị trí index. */
const lineOf = (code, index) => code.slice(0, index).split('\n').length;

/**
 * Các lời gọi pow(…) và x.pow(…) của TSL trong code (bỏ qua Math.pow): vị trí và số mũ. Đếm ngoặc để tách đối số,
 * vì cơ số hay có ngoặc lồng nhau: pow(saturate(dot(a, b)), 4).
 */
function powExponents(code) {
  const calls = [];
  for (const m of code.matchAll(/(?<!Math)(\.pow|\bpow)\s*\(/g)) {
    const args = [];
    let depth = 0;
    let last = m.index + m[0].length;
    for (let i = last; i < code.length; i++) {
      const c = code[i];
      if ('([{'.includes(c)) depth++;
      else if (')]}'.includes(c)) {
        if (depth === 0) {
          args.push(code.slice(last, i).trim());
          break;
        }
        depth--;
      } else if (c === ',' && depth === 0) {
        args.push(code.slice(last, i).trim());
        last = i + 1;
      }
    }
    calls.push({ index: m.index, exponent: m[1] === '.pow' ? args[0] : args[1] });
  }
  return calls;
}

afterAll(() => {
  if (nearLimit.length === 0) return;
  const rows = nearLimit.map(({ file, lines }) => `  ${String(lines).padStart(4)} dòng  ${file}`);
  console.log(`File dài ${SOFT_LIMIT + 1}–${HARD_LIMIT} dòng (chưa hỏng, nên tách sớm sang parts/):\n${rows.join('\n')}`);
});

describe('luật file', () => {
  it('có file để quét', () => {
    expect(FILES.length).toBeGreaterThan(0);
  });

  it('dòng 1 của mọi file là chú thích nói file làm gì', () => {
    const errors = FILES.filter((f) => !/^(\/\/|\/\*)/.test(read(f))).map((f) => `${f}:1 — dòng 1 phải là // <đường dẫn> — <file làm gì>`);
    expect(errors, report('Thiếu chú thích ở dòng 1:', errors)).toEqual([]);
  });

  it(`không file nào dài quá ${HARD_LIMIT} dòng`, () => {
    const errors = [];
    for (const file of FILES) {
      const lines = lineCount(read(file));
      if (lines > HARD_LIMIT) errors.push(`${file} — ${lines} dòng: tách phần phụ sang parts/ (xem §8.1)`);
      else if (lines > SOFT_LIMIT) nearLimit.push({ file, lines });
    }
    expect(errors, report(`File dài quá ${HARD_LIMIT} dòng:`, errors)).toEqual([]);
  });

  it('không dùng ShaderMaterial, RawShaderMaterial, onBeforeCompile, EffectComposer (dự án chỉ dùng TSL)', () => {
    const errors = [];
    for (const file of FILES) {
      const code = stripComments(read(file), file);
      for (const m of code.matchAll(/RawShaderMaterial|ShaderMaterial|onBeforeCompile|EffectComposer/g)) {
        errors.push(`${file}:${lineOf(code, m.index)} — ${m[0]}`);
      }
    }
    expect(errors, report('API bị cấm (§3):', errors)).toEqual([]);
  });

  it('không dùng Math.random (ngẫu nhiên phải có hạt giống: lib/random.js)', () => {
    const errors = [];
    for (const file of FILES) {
      const code = stripComments(read(file), file);
      for (const m of code.matchAll(/Math\s*\.\s*random\b/g)) errors.push(`${file}:${lineOf(code, m.index)} — Math.random`);
    }
    expect(errors, report('Math.random làm ?freeze không còn tất định:', errors)).toEqual([]);
  });

  it('không import time/deltaTime từ three/tsl (chuyển động đọc ctx.u.time / ctx.u.delta)', () => {
    const errors = [];
    for (const file of FILES) {
      const raw = read(file);
      const code = stripComments(raw, file);
      for (const { name, local, line } of importedNames(raw, 'three/tsl', file)) {
        if (name === 'time' || name === 'deltaTime') errors.push(`${file}:${line} — import { ${name} } from 'three/tsl'`);
        if (name === '*') {
          for (const m of code.matchAll(new RegExp(`\\b${local}\\s*\\.\\s*(time|deltaTime)\\b`, 'g'))) {
            errors.push(`${file}:${lineOf(code, m.index)} — ${local}.${m[1]}`);
          }
        }
      }
    }
    expect(errors, report('time/deltaTime của TSL chạy theo đồng hồ riêng của renderer, phá ?freeze:', errors)).toEqual([]);
  });

  it('lũy thừa 2, 3, 4 trong TSL viết bằng pow2 / pow3 / pow4 (pow của cơ số âm là NaN trên GPU thật)', () => {
    const errors = [];
    for (const file of FILES) {
      const code = stripComments(read(file), file);
      for (const { index, exponent } of powExponents(code)) {
        if (/^[234](\.0*)?$/.test(exponent ?? '')) errors.push(`${file}:${lineOf(code, index)} — pow(…, ${exponent})`);
      }
    }
    // GLSL ES và WGSL không định nghĩa pow(x, y) khi x < 0: SwiftShader vẫn ra số, còn Metal/D3D/GPU thật thường ra NaN.
    // pow2(x) = x·x đúng với mọi dấu và nhanh hơn.
    expect(errors, report('Dùng pow2/pow3/pow4 thay cho pow(…, 2|3|4):', errors)).toEqual([]);
  });

  it(`chỉ ${DRAW_HOOK_FILE} được đặt móc lần vẽ (setRenderObjectFunction, §8.2)`, () => {
    // Tự kiểm: file được miễn phải còn đó và còn đặt móc, không thì luật này im lặng đúng với một đường dẫn cũ.
    expect(FILES, `${DRAW_HOOK_FILE} không còn: sửa DRAW_HOOK_FILE theo chỗ móc mới`).toContain(DRAW_HOOK_FILE);
    expect(stripComments(read(DRAW_HOOK_FILE), DRAW_HOOK_FILE)).toMatch(/\bsetRenderObjectFunction\b/);
    const errors = [];
    for (const file of FILES.filter((f) => f !== DRAW_HOOK_FILE)) {
      const code = stripComments(read(file), file);
      for (const m of code.matchAll(/\bsetRenderObjectFunction\b/g)) errors.push(`${file}:${lineOf(code, m.index)} — setRenderObjectFunction`);
    }
    // three chỉ giữ MỘT hàm vẽ: móc thứ hai ở chỗ khác sẽ âm thầm đè móc của Từng sợi, hay bị Từng sợi đè.
    expect(errors, report(`Chỉ ${DRAW_HOOK_FILE} được gọi setRenderObjectFunction:`, errors)).toEqual([]);
  });
});
