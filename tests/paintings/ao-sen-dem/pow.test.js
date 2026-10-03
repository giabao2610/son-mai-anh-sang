// tests/paintings/ao-sen-dem/pow.test.js — mọi pow trong vật liệu của Bức 1 có cơ số không âm (pow của số âm là NaN trên GPU thật).
import { describe, it, expect } from 'vitest';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
import { buildPainting } from '../../helpers/fake-ctx.js';
import { nodesOf } from '../../helpers/nodes.js';

/**
 * Bỏ lớp VarNode mà TSL tự bọc quanh abs(), oneMinus(), pow()… (biến "intent", r186) hoặc .toConst(): giá trị
 * không đổi sau khi gán. Biến .toVar() thường thì giữ nguyên, vì có thể bị gán lại (addAssign) trong Fn.
 */
const unwrap = (node) => (node?.isVarNode && (node.intent || node.readOnly) ? unwrap(node.node) : node);

/** Node chắc chắn nằm trong [0, 1]: hằng trong khoảng, smoothstep, hoặc kẹp về khoảng con của [0, 1]. */
function inUnit(input) {
  const node = unwrap(input);
  if (node?.isConstNode) return node.value >= 0 && node.value <= 1;
  if (!node?.isMathNode) return false;
  if (node.method === 'smoothstep') return true;
  return node.method === 'clamp' && inUnit(node.bNode) && inUnit(node.cNode);
}

/** Node chắc chắn ≥ 0. Không chứng minh được thì coi như có thể âm. */
function nonNegative(input) {
  const node = unwrap(input);
  if (node?.isConstNode) return node.value >= 0;
  if (!node?.isMathNode) return false;
  const { method, aNode, bNode } = node;
  if (['abs', 'exp', 'length', 'smoothstep'].includes(method)) return true;
  if (method === 'clamp') return nonNegative(bNode);
  if (method === 'max') return nonNegative(aNode) || nonNegative(bNode);
  if (method === 'oneMinus') return inUnit(aNode);
  return false;
}

describe('pow trong vật liệu của Bức 1', () => {
  it('cơ số của mọi pow chắc chắn không âm (saturate, abs, exp…), ở mức cao và mức thấp: GLSL/WGSL không định nghĩa pow của số âm', () => {
    const errors = [];
    // Mức thấp dựng vật liệu khác mức cao: phản chiếu giả (parts/mat-nuoc-gia.js) có pow(…, SHARPNESS) của riêng nó.
    for (const options of [{}, { level: 'thap', budget: { reflection: 0 } }]) {
      const level = options.level ?? 'cao';
      const { ctx } = buildPainting(painting, meta, { until: 'vang-la', ...options });
      let pows = 0;
      ctx.scene.traverse((object) => {
        for (const material of [object.material].flat().filter(Boolean)) {
          for (const [slot, root] of Object.entries(material)) {
            if (!slot.endsWith('Node') || !root?.isNode) continue;
            for (const node of nodesOf(root)) {
              if (!node.isMathNode || node.method !== 'pow') continue;
              pows += 1;
              if (!nonNegative(node.aNode)) errors.push(`${level} · ${object.name || object.type} · ${material.type}.${slot}: pow(${unwrap(node.aNode).method ?? unwrap(node.aNode).type}(…), …)`);
            }
          }
        }
      });
      expect(pows, `${level}: không tìm thấy pow nào, test sẽ đúng rỗng`).toBeGreaterThan(0);
    }
    expect([...new Set(errors)]).toEqual([]);
  });
});
