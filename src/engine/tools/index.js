// engine/tools/index.js — các công cụ học của xưởng, theo thứ tự trên mục "Đồ nghề". Thêm một công cụ = thêm một dòng.
import * as kinhMai from './kinh-mai.js';
import * as lotLop from './lot-lop.js';

/** @type {import('../contracts/runtime.js').Tool[]} */
export const tools = [kinhMai, lotLop];
