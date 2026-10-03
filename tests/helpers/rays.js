// tests/helpers/rays.js — tia của cử chỉ cho test của bức: setup() của bức tự giao tia này với mặt phẳng y = 0.
import { Ray, Vector3 } from 'three/webgpu';

/** Tia thẳng đứng từ trên cao xuống điểm (x, z) của mặt nước (mặt phẳng y = 0). */
export const down = (x, z) => new Ray(new Vector3(x, 10, z), new Vector3(0, -1, 0));
