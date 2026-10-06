// tests/paintings/ao-sen-dem/vang-la-ma.test.js — mã shader của đom đóm (compute khởi tạo, compute bước, material của Sprite) giống từng ký tự bản ghi TRƯỚC khi rút bể hạt lên lib/tsl/particles.js (spec §20.7); số id của node trong tên được thay bằng '#' kèm thứ tự xuất hiện.
import { describe, it, expect } from 'vitest';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
import { buildPainting } from '../../helpers/fake-ctx.js';
import { compileCompute, compileMaterial } from '../../helpers/nodes.js';

/**
 * Tên mang số id của node. id tăng theo thứ tự node được tạo trong cả lần chạy test, nên đổi khi code dựng node theo thứ tự khác mà mã
 * không đổi. GLSL: NodeBuffer_<id>, buffer<id> (GLSLNodeBuilder); WGSL: NodeBuffer_<id>, và kiểu NodeBuffer_<id>Struct của nó
 * (WGSLNodeBuilder#_getWGSLStructBinding ghép tên với 'Struct', nên sau số không có ranh giới từ). Chỉ thêm tên vào đây khi đã đọc
 * trong mã nguồn của three rằng số trong tên là id của node.
 * Mỗi id thành '#' kèm thứ tự lần đầu nó xuất hiện trong mã (#0, #1…), không phải một '#' chung: hai bộ đệm vẫn phân biệt được, nên
 * một câu lệnh đọc hay ghi nhầm bộ đệm thì mã khác bản ghi.
 */
const normalize = (code) => {
  const order = new Map();
  return code.replace(/\b(NodeBuffer_|buffer)(\d+)/g, (_, name, id) => {
    if (!order.has(id)) order.set(id, order.size);
    return `${name}#${order.get(id)}`;
  });
};
const fixture = (backend, name) => `./__fixtures__/vang-la/${backend}-${name}.txt`;

describe.each(['webgpu', 'webgl2'])('Vàng lá: mã shader của đom đóm không đổi khi rút bể hạt (%s)', (backend) => {
  const built = buildPainting(painting, meta, { tier: backend });
  const calls = built.ctx.renderer.compute.mock.calls;
  const init = calls[0][0]; // lần compute đầu là khởi tạo, chạy ngay lúc dựng lớp
  built.layers['vang-la'].update(1 / 60, 1); // một bước: lần compute cuối là kernel bước
  const step = calls.at(-1)[0];
  const sprite = built.layers['vang-la'].objects.find((o) => o.name === 'dom-dom');

  it.each([['init', init], ['step', step]])('compute %s', async (name, node) => {
    const { code, problems } = compileCompute(node, backend);
    expect(problems).toEqual([]);
    expect(code.length).toBeGreaterThan(200);
    await expect(normalize(code)).toMatchFileSnapshot(fixture(backend, name));
  });

  it('material của Sprite (vertex và fragment)', async () => {
    const { vertexShader, fragmentShader, problems } = compileMaterial(sprite, built.ctx, backend);
    expect(problems).toEqual([]);
    await expect(normalize(`${vertexShader}\n// ---- fragment ----\n${fragmentShader}`)).toMatchFileSnapshot(fixture(backend, 'sprite'));
  });
});
