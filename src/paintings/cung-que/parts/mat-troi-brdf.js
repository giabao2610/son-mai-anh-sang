// paintings/cung-que/parts/mat-troi-brdf.js — BRDF của bụi trăng (Lommel–Seeliger, cộng phần bừng khi nắng ở sau lưng người nhìn) và của mặt Lambert, viết bằng TSL.
import { acos, clamp, dot, exp, float, max } from 'three/tsl';

/** Bề rộng (rad) của phần bừng quanh góc pha 0. */
const SURGE_WIDTH = 0.1;

/** Mặt Lambert: sáng theo cos góc tới; tối dần ra mép như quả bóng thạch cao. */
export const lambert = (n, l) => max(dot(n, l), 0);

/**
 * Bụi trăng: f = 2·μ0/(μ0 + μ) · (1 + B0·e^(−g/w)). Hệ số 2 để giữa đĩa sáng bằng mặt Lambert. Không tối dần ra mép: trăng rằm là
 * một đĩa phẳng sáng đều; nắng ở sau lưng người nhìn (g gần 0) thì bừng sáng (spec §19.4 lớp 2).
 * @param {any} n pháp tuyến; l hướng nắng; v hướng về người nhìn (đều chuẩn hóa); surge độ bừng B0 (uniform)
 */
export function regolith(n, l, v, surge) {
  const mu0 = max(dot(n, l), 0);
  const mu = max(dot(n, v), 0);
  const ls = mu0.mul(2).div(max(mu0.add(mu), 1e-4));
  const g = acos(clamp(dot(l, v), -1, 1));
  return ls.mul(float(1).add(surge.mul(exp(g.div(SURGE_WIDTH).negate()))));
}
