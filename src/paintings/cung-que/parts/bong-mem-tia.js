// paintings/cung-que/parts/bong-mem-tia.js — bóng mềm và AO lấy từ trường khoảng cách (Inigo Quilez): dò tia về phía nắng để biết tia đi sát vật tới đâu; lấy mẫu dọc pháp tuyến để đo độ che.
import { Break, Fn, If, Loop, clamp, dot, float, max, min, sqrt, vec3 } from 'three/tsl';

/** Đoạn dò bóng: bắt đầu cách mặt một chút (tránh tự che), dừng sau 3 đơn vị (cả hành tinh), hay sớm hơn ở mép khối bao. */
const T_MIN = 0.02;
const T_MAX = 3;
/** Bước dò bóng bị kẹp: không quá nhỏ (đỡ tốn ở gần mặt), không quá lớn (đỡ bỏ sót cành mảnh). */
const STEP_MIN = 0.01;
const STEP_MAX = 0.2;

/**
 * Bóng mềm: ở mỗi bước, khoảng cách h tới vật gần nhất so với quãng t đã đi cho "độ hở" k·h/t; lấy nhỏ nhất. Tia đi sát mép mà không
 * chạm thì vào nửa tối; k nhỏ thì nửa tối rộng (spec §19.4 lớp 3).
 * Ra khỏi khối bao thì không còn gì che nắng (lá, Trái Đất là mesh riêng, không đổ bóng lên SDF), nên tia dừng ở mép khối: bước bị
 * kẹp dưới 0,2, nên đi hết 3 đơn vị trong khoảng trống mất ít nhất 15 lần gọi scene.
 * Không có layout (hàm viết thẳng vào chỗ gọi): thân hàm gọi scene, mà scene đọc uniform (Phụ lục A.87).
 * @param {(p: any) => any} scene  scene(p) → vec2(khoảng cách, id)
 * @param {{ center: number[], radius: number }} bounds  khối bao (BOUNDS)
 * @returns {(p: any, n: any, l: any, k: any, steps: any) => any}  độ sáng 0–1 (0: bóng đặc)
 */
export function softShadow(scene, bounds) {
  const center = vec3(...bounds.center);
  const r2 = bounds.radius ** 2;
  return Fn(([p, n, l, k, steps]) => {
    const res = float(1).toVar();
    const t = float(T_MIN).toVar();
    const ro = p.add(n.mul(0.01));
    // Quãng tới mép khối bao theo hướng nắng: ro ở trong khối, nên phương trình luôn có nghiệm dương
    const oc = ro.sub(center);
    const b = dot(oc, l);
    const tEnd = min(b.negate().add(sqrt(max(b.mul(b).sub(dot(oc, oc)).add(r2), 0))), T_MAX);
    Loop(steps, () => {
      const h = scene(ro.add(l.mul(t))).x;
      res.assign(min(res, k.mul(h).div(t)));
      t.addAssign(clamp(h, STEP_MIN, STEP_MAX));
      If(res.lessThan(0.002).or(t.greaterThan(tEnd)), () => {
        Break();
      });
    });
    const r = clamp(res, 0, 1);
    return r.mul(r).mul(float(3).sub(r.mul(2))); // smoothstep(0, 1, r) viết tay
  });
}

/**
 * AO: `samples` điểm cách đều dọc pháp tuyến; điểm nào có khoảng cách nhỏ hơn quãng đã đi thì quanh đó có vật che. Mẫu xa nhẹ dần
 * (×0,85 mỗi mẫu).
 * Các mẫu TRẢI THẲNG bằng vòng for của JS, không phải Loop của TSL: một vòng có cận là uniform bọc hàm SDF làm cả khung chậm gấp đôi
 * trên GPU Apple, kể cả khi chỉ chạy một vòng (Phụ lục A.88). Vì vậy số mẫu cố định theo mức lúc dựng; không có nấc nào đổi nó.
 * @param {(p: any) => any} scene
 * @param {number} samples  số mẫu (budget.ao)
 * @returns {(p: any, n: any) => any}  1: không che; 0: che kín
 */
export function ambientOcclusion(scene, samples) {
  return Fn(([p, n]) => {
    let occ = float(0);
    for (let i = 0; i < samples; i += 1) {
      const hr = 0.01 + 0.03 * i;
      occ = occ.add(float(hr).sub(scene(p.add(n.mul(hr))).x).mul(0.85 ** i));
    }
    return clamp(float(1).sub(occ.mul(3)), 0, 1);
  });
}
