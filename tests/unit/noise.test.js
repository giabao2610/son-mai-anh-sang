// tests/unit/noise.test.js — lib/tsl/noise.js: fbm dựng được đồ thị node trong Node, kiểm số tầng.
import { describe, it, expect } from 'vitest';
import { vec3 } from 'three/tsl';
import { fbm } from '../../src/lib/tsl/noise.js';

describe('fbm', () => {
  it('trả về node float cho 1 đến 5 tầng', () => {
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
});
