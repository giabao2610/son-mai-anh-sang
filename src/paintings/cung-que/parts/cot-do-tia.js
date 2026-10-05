// paintings/cung-que/parts/cot-do-tia.js — khối bao: một mesh cầu mặt trong với NodeMaterial gốc; fragment dò tia vào thế giới SDF rồi ghi màu, độ sâu và pháp tuyến như một vật thường.
import { BackSide, Mesh, NodeMaterial, SphereGeometry } from 'three/webgpu';
import {
  Break, Discard, Fn, If, Loop, cameraFar, cameraNear, cameraPosition, cameraViewMatrix, dot, float, max, mix, normalize,
  positionWorld, sqrt, vec2, vec3, vec4, viewZToPerspectiveDepth,
} from 'three/tsl';

/** Mỗi bước tiến bằng khoảng cách × STEP: hố và hòa khối làm SDF không chính xác, đi đủ bước là thủng hình. */
const STEP = 0.9;
/** Ngưỡng chạm theo cỡ điểm ảnh: chạm khi khoảng cách < PIXEL × t (càng xa càng cho sai nhiều hơn). */
const PIXEL = 0.0015;
/** Bước lệch khi lấy gradient (pháp tuyến). */
const NORMAL_EPS = 0.0015;

/**
 * Pháp tuyến = gradient của SDF, lấy theo bốn điểm hình tứ diện (Inigo Quilez): bốn lần gọi scene thay cho sáu.
 * Không viết thành hàm có layout: lời gọi scene đọc uniform (độ cao bay, độ hòa khối), mà uniform không được đọc trong thân hàm có
 * layout (Phụ lục A.87). Chỗ dùng bọc trong Fn().once(), nên vẫn chỉ tính một lần cho mỗi điểm ảnh.
 * @param {(p: any) => any} scene  scene(p) → vec2(khoảng cách, id)
 */
export function sdfNormal(scene) {
  return (p) => {
    const e = vec2(1, -1).mul(NORMAL_EPS);
    return normalize(
      e.xyy.mul(scene(p.add(e.xyy)).x)
        .add(e.yyx.mul(scene(p.add(e.yyx)).x))
        .add(e.yxy.mul(scene(p.add(e.yxy)).x))
        .add(e.xxx.mul(scene(p.add(e.xxx)).x)),
    );
  };
}

/**
 * Màu của một điểm chạm theo recipe (spec §19.4):
 *   mix(đất sét dưới đèn xưởng, albedo × nắng × phần không bị che, w2) + albedo × ánh nền × AO.
 * Đọc recipe LÚC BIÊN DỊCH (trong thân Fn của material), nên thấy cả các hàm mà lớp sau đã thay.
 * @param {object} recipe
 */
export const makeShade = (recipe) => (h) => {
  const albedo = recipe.albedo(h);
  const sun = albedo.mul(recipe.sun(h)).mul(recipe.visibility(h));
  return mix(recipe.clay(h), sun, recipe.sunWeight).add(albedo.mul(recipe.ambient(h)).mul(recipe.occlusion(h)));
};

/**
 * @param {{ scene: any, bounds: { center: number[], radius: number }, steps: any, shade: (h: object) => any,
 *   showBounds: any, showSteps: any, stepsColor: (k: any) => any, depthOff: any }} p
 *   steps: node int (min của núm và trần của nấc); showBounds, showSteps, depthOff: uniform 0/1 của thí nghiệm;
 *   stepsColor: bảng màu cho "Tô theo số bước" (k trong [0; 1])
 */
export function createSdfVolume({ scene, bounds, steps, shade, showBounds, showSteps, stepsColor, depthOff }) {
  const center = vec3(...bounds.center);
  const radius = float(bounds.radius);
  const normalAt = sdfNormal(scene);

  /** Hướng tia của điểm ảnh này: từ camera qua điểm trên mặt khối bao. */
  const rayDir = Fn(() => normalize(positionWorld.sub(cameraPosition))).once();

  /**
   * Dò tia MỘT lần cho mỗi điểm ảnh (Phụ lục A.84): màu, pháp tuyến và độ sâu cùng đọc kết quả này.
   * Trả vec4(t, chạm 0/1, id, số bước đã dò).
   */
  const march = Fn(() => {
    const ro = cameraPosition;
    const rd = rayDir();
    // Giao giải tích với quả cầu bao: đoạn [t0; t1] của tia nằm trong khối
    const oc = ro.sub(center);
    const b = dot(oc, rd);
    const c = dot(oc, oc).sub(radius.mul(radius));
    const h = sqrt(max(b.mul(b).sub(c), 0));
    const t = max(b.negate().sub(h), 0).toVar('sdfT'); // camera trong khối thì bắt đầu từ 0 (spec §19.4 lớp 1)
    const tEnd = b.negate().add(h).toVar('sdfEnd');
    const hit = float(0).toVar('sdfHit');
    const id = float(0).toVar('sdfId');
    const used = float(0).toVar('sdfUsed');
    Loop(steps, () => {
      const d = scene(ro.add(rd.mul(t)));
      If(d.x.lessThan(t.mul(PIXEL)), () => {
        hit.assign(1);
        id.assign(d.y);
        Break();
      });
      t.addAssign(d.x.mul(STEP));
      used.addAssign(1);
      If(t.greaterThan(tEnd), () => {
        Break();
      });
    });
    return vec4(t, hit, id, used);
  }).once();

  const pos = Fn(() => cameraPosition.add(rayDir().mul(march().x))).once();
  const normal = Fn(() => normalAt(pos())).once();

  const material = new NodeMaterial();
  material.side = BackSide;
  material.fog = false;
  material.colorNode = Fn(() => {
    const m = march();
    // Tia trượt: bỏ điểm ảnh, trừ khi đang "Hiện khối bao" (spec §19.4 lớp 1)
    If(m.y.lessThan(0.5).and(showBounds.lessThan(0.5)), () => {
      Discard();
    });
    const color = shade({ p: pos(), n: normal(), v: rayDir().negate(), id: m.z }).toVar();
    If(m.y.lessThan(0.5), () => {
      color.assign(vec3(0.12, 0.1, 0.06)); // vỏ khối bao, mờ
    });
    If(showSteps.greaterThan(0.5), () => {
      color.assign(stepsColor(m.w.div(max(float(steps), 1))));
    });
    return color;
  })();
  // Pháp tuyến ở view space: kênh normal của MRT đọc normalView = normalNode (Phụ lục A.81)
  material.normalNode = cameraViewMatrix.mul(vec4(normal(), 0)).xyz.normalize();
  // Độ sâu của điểm chạm (Phụ lục A.82). Thí nghiệm "Không ghi độ sâu" (lớp Lá đa): ghi độ sâu xa nhất
  material.depthNode = mix(viewZToPerspectiveDepth(cameraViewMatrix.mul(vec4(pos(), 1)).z, cameraNear, cameraFar), float(1), depthOff);
  material.emissiveNode = vec3(0);

  const mesh = new Mesh(new SphereGeometry(bounds.radius, 64, 32), material);
  mesh.position.set(...bounds.center);
  mesh.name = 'khoi-bao';
  return { mesh, material, hit: { pos, normal, march, rayDir } };
}
