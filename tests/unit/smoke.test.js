import { describe, it, expect } from 'vitest';
import { REVISION } from 'three';
import viteConfig from '../../vite.config.js';

describe('khung dự án', () => {
  it('cài đúng three r186 (ghim cứng 0.186.1)', () => {
    expect(REVISION).toBe('186');
  });

  it('test mặc định chạy trong Node, không có DOM', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
  });

  it('vite.config.js: base của GitHub Pages, target es2022, chunk three chỉ gồm three/build', () => {
    expect(viteConfig.base).toBe('/son-mai-anh-sang/');
    expect(viteConfig.build.target).toBe('es2022');
    const group = viteConfig.build.rolldownOptions.output.codeSplitting.groups.find((g) => g.name === 'three');
    const inThreeChunk = (path) => group.test.test(path);
    expect(inThreeChunk('/repo/node_modules/three/build/three.webgpu.js')).toBe(true);
    expect(inThreeChunk('C:\\repo\\node_modules\\three\\build\\three.core.js')).toBe(true);
    // Addon tải lười (Inspector chỉ dùng khi ?debug) KHÔNG được bị kéo vào chunk three tải ngay.
    expect(inThreeChunk('/repo/node_modules/three/examples/jsm/inspector/Inspector.js')).toBe(false);
  });
});
