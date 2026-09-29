// tests/unit/noise.test.js — lib/tsl/noise.js: fbm (số tầng là số JS hoặc node) và curl dựng được đồ thị node trong Node.
import { describe, it, expect } from 'vitest';
import { uniform, vec3 } from 'three/tsl';
import { MAX_OCTAVES, curl, fbm } from '../../src/lib/tsl/noise.js';

describe('fbm', () => {
  it('trả về node float cho 1 đến 5 tầng', () => {
    expect(MAX_OCTAVES).toBe(5);
    for (let octaves = 1; octaves <= 5; octaves++) {
      const node = fbm(vec3(1, 2, 3), { octaves });
      expect(node.isNode).toBe(true);
    }
  });

  it('số tầng ngoài 1–5 hoặc không nguyên thì ném RangeError tiếng Việt', () => {
    for (const octaves of [0, 6, 2.5]) {
      expect(() => fbm(vec3(0), { octaves })).toThrow(/octaves phải là số nguyên từ 1 đến 5/);
    }
  });

  it('số tầng là node (uniform của núm): dựng vòng lặp thật; đổi giá trị uniform không đổi node', () => {
    const octaves = uniform(3);
    const node = fbm(vec3(1, 2, 3), { octaves });
    expect(node.isNode).toBe(true);
    octaves.value = 1; // chỉ đổi giá trị: node giữ nguyên, nên shader không phải biên dịch lại
    expect(fbm(vec3(1, 2, 3), { octaves: uniform(0) }).isNode).toBe(true); // số tầng 0 không ném (node không kiểm lúc dựng)
  });
});

describe('curl', () => {
  it('trả về node vec3; bước sai phân chỉnh được', () => {
    expect(curl(vec3(1, 2, 3)).isNode).toBe(true);
    expect(curl(vec3(1, 2, 3), { epsilon: 0.05 }).isNode).toBe(true);
  });
});
