// tests/paintings/dan-ga-me-con/ban-net.test.js — Lớp 3 · Bản nét: viền đọc thẳng texture độ sâu của camera trực giao (không qua công thức phối cảnh), lấy mẫu đúng tâm điểm ảnh; có tap truoc-net; chỉ chạy với camera trực giao.
import { describe, it, expect } from 'vitest';
import { NoToneMapping, PerspectiveCamera, SRGBColorSpace } from 'three/webgpu';
import meta from '../../../src/paintings/dan-ga-me-con/meta.js';
import * as painting from '../../../src/paintings/dan-ga-me-con/painting.js';
import { createPipeline } from '../../../src/engine/gpu/pipeline.js';
import { buildPainting } from '../../helpers/fake-ctx.js';
import { nodesOf } from '../../helpers/nodes.js';

const fakeRenderer = { toneMapping: NoToneMapping, outputColorSpace: SRGBColorSpace };
const pipelineOf = ({ ctx, built }) => createPipeline({ renderer: fakeRenderer, scene: ctx.scene, camera: ctx.camera, layers: built, weight: ctx.weight });
/**
 * Dựng tới Bản nét (bỏ Phủ bóng): Phủ bóng bọc màu trong một Fn và FXAA vẽ chuỗi phía trước ra một RTT, nên cả nodesOf lẫn
 * buildFinalPass đều không thấy bên trong. Không có Phủ bóng thì ảnh cuối là renderOutput(màu của Bản nét).
 */
const upToInk = (options) => buildPainting(painting, meta, { until: 'ban-net', ...options });

describe('l3-ban-net (Bức 4)', () => {
  it('post đọc texture độ sâu của scene pass (camera trực giao), không có node độ sâu kiểu phối cảnh; tap truoc-net là màu trước khi có nét', () => {
    const built = upToInk();
    const p = pipelineOf(built);
    const ids = new Set(nodesOf(p.views.node('final')).map((n) => n.id));
    expect(ids.has(p.scenePass.getTextureNode('depth').id)).toBe(true);
    expect(ids.has(p.scenePass.getLinearDepthNode().id)).toBe(false);
    expect(p.views.list().map((v) => v.id)).toContain('ban-net:truoc-net');
    p.dispose();
  });

  it('đọc texture độ sâu đúng chín lần mỗi điểm ảnh (lưới 3×3, ngân sách §20.8): điểm giữa đọc một lần, dùng chung cho bốn hướng', () => {
    const built = upToInk();
    const p = pipelineOf(built);
    const depth = p.scenePass.getTextureNode('depth');
    const samples = nodesOf(p.views.node('final')).filter((n) => n.isTextureNode && n.uvNode && n.getBase?.() === depth);
    expect(samples).toHaveLength(9);
    p.dispose();
  });

  it('camera phối cảnh: báo lỗi tiếng Việt lúc dựng, không vẽ nét sai', () => {
    expect(() => buildPainting(painting, meta, { camera: new PerspectiveCamera() })).toThrow(/camera trực giao/);
  });
});
