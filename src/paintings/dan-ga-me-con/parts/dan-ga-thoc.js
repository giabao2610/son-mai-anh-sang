// paintings/dan-ga-me-con/parts/dan-ga-thoc.js — của lớp Đàn gà: luật của hạt thóc cho bể hạt lib/tsl/particles.js (khởi tạo, rắc, rơi nảy lăn, bị mổ), mảng mỏ của mười gà con, và Sprite vẽ thóc.
import { Sprite, SpriteNodeMaterial, Vector4 } from 'three/webgpu';
import {
  Fn, If, clamp, color, cos, exp, float, hash, hue, instanceIndex, length, max, mix, sin, smoothstep, sqrt, step, uint, uniformArray, uv,
  vec2, vec3, vec4, vertexStage,
} from 'three/tsl';

/**
 * Số của thóc (spec §20.4 lớp 5, §20.5), đơn vị cảnh 10 cm. Nắm gọn chừng 0,4 quanh chỗ rơi (nửa số hạt; gần hết trong 0,55), vì mỏ của các
 * con đứng quanh trên vòng bán kính 1 chạm sàn trong chừng 0,5 quanh đó. tests/paintings/dan-ga-me-con/dan-ga-thoc.test.js có bản JS của
 * luật dưới đây (đo nắm và phần bị ăn), khóa với mã thật của bước compute bằng bản ghi: đổi luật thì test đỏ, sửa bản JS rồi mới ghi lại.
 */
export const GRAIN = Object.freeze({
  size: [0.08, 0.04], // dài, rộng
  radius: 0.02, // tâm hạt nằm cao chừng này khi nằm trên sàn
  drop: 3, // nắm rắc tay văng ra từ tầm tay
  kick: 1, // nhúm gà mẹ bới văng lên thấp, chừng 10 cm: rơi nhanh nên nhúm gọn hơn nắm rắc tay
  hand: 0.15, // các hạt rời tay trong một đĩa bán kính chừng này
  spread: 1.2, // tốc độ ngang tối đa khi văng: chạm sàn lần đầu trong chừng 0,45 quanh chỗ rắc (0,26 giây sau)
  lift: 1.5, // tốc độ hất lên tối đa khi văng
  scuff: 0.5, // mỗi lần rơi xuống mặt giấy, vận tốc ngang còn chừng này phần: giấy hãm hạt
  settle: 1, // nảy lên chậm hơn chừng này (đơn vị/s) thì thôi nảy
  friction: 6, // vận tốc ngang khi lăn giảm theo e^(−friction · dt)
  rest: 0.05, // trên sàn mà chậm hơn chừng này thì nằm yên
  life: 30, // nằm chừng này giây không ai ăn thì nhỏ dần
  fade: 2,
  eat: 0.2, // mỏ đang mổ cách hạt dưới chừng này (đo trên mặt sàn) thì hạt bị ăn: chín mười hai chỗ mổ mỗi nắm phủ được nắm thóc
  reach: 0.3, // khi cả đầu mỏ lẫn hạt thấp hơn chừng này
  pile: 0.35, // bán kính nhúm nằm yên (lúc mở trang)
});
/** Trọng lực (đơn vị/s²): Trái Đất 9,81 m/s²; trăng 1,62 m/s², như lá rơi của Bức 3. Núm 'gravity' chọn (thứ tự là chỉ số của núm). */
export const GRAVITY = Object.freeze({ traiDat: 98.1, trang: 16.2 });
/** Mười mỏ: mười gà con. Gà mẹ ngậm con ong nên không mổ. */
export const BEAKS = 10;

/** Mảng mỏ (uniformArray vec4): xyz = đầu mỏ, w = 1 khi đang mổ (đáy nhịp). Lớp ghi mỗi khung; three tải lại ở mỗi lần compute. */
export const createBeaks = () => uniformArray(Array.from({ length: BEAKS }, () => new Vector4(0, -10, 0, 0)), 'vec4').setName('danGaBeaks');

/** Khởi tạo cả bể: lúc sinh −1 là ô trống. Gán cả a lẫn b: mỗi nhánh nói đủ trạng thái của phần tử (quy ước của bể, Phụ lục A.97). */
export const initGrain = ({ a, b, index }) => {
  a.assign(vec4(0, -10, 0, -1));
  b.assign(vec4(0, 0, 0, hash(index)));
};

/**
 * Phần tử thứ k của nắm vừa rắc tự khởi tạo lại. Nắm thường: văng từ `batch.origin` (y là độ cao văng: tầm tay khi rắc, thấp khi mẹ bới),
 * tỏa hình nón. Nắm nằm yên (`still`): nằm sẵn trên sàn trong một đĩa quanh điểm rắc. hash nhận số nguyên (đổi sang uint), nên ba số ngẫu
 * nhiên lấy ở ba chỉ số liền nhau.
 * @param {{ time: any }} p  đồng hồ của cảnh (ctx.u.time): lúc sinh của hạt
 */
export function makeSpawn({ time }) {
  return ({ a, b, k, batch }) => {
    const base = k.mul(3).add(uint(batch.seed).mul(7919));
    const [r1, r2, r3] = [0, 1, 2].map((j) => hash(base.add(j)));
    const ang = r1.mul(Math.PI * 2);
    const disc = vec3(cos(ang), 0, sin(ang)).mul(sqrt(r2)); // điểm đều trong đĩa đơn vị (r2 ≥ 0)
    const thrown = batch.origin.add(disc.mul(GRAIN.hand));
    const lying = vec3(batch.origin.x, GRAIN.radius, batch.origin.z).add(disc.mul(GRAIN.pile));
    const velocity = disc.mul(GRAIN.spread).add(vec3(0, r3.mul(GRAIN.lift), 0));
    a.assign(vec4(mix(thrown, lying, batch.still), time));
    b.assign(vec4(mix(velocity, vec3(0), batch.still), r3));
  };
}

/**
 * Một bước của một hạt. a = (vị trí, lúc sinh), b = (vận tốc, hạt giống); lúc sinh âm là ô trống hay hạt đã bị ăn. Mỗi hạt chỉ đọc và
 * ghi chính nó; mỏ gà đến qua uniform (spec §20.7). Luôn gán cả a lẫn b.
 * - Đang bay mà chạm sàn là một lần rơi: nảy (`bounce`), vận tốc ngang còn GRAIN.scuff phần. Đang nằm trên sàn (lăn) thì chạm sàn mỗi khung
 *   do trọng lực: chỉ kẹp lại, không nảy, không hãm thêm. Nảy thấp hơn trọng lực của một khung thì tự tắt, nên nhịp khung chậm (10 khung/
 *   giây) hạt vẫn nằm yên được.
 * - Lăn chậm dần theo e^(−friction · dt), chậm hẳn thì nằm yên: thôi tích phân, nhưng vẫn kiểm mỏ.
 * @param {{ dt: any, gravity: any, bounce: any, beaks: any, floor: { x: number[], z: number[] } }} p
 */
export function makeLaw({ dt, gravity, bounce, beaks, floor }) {
  const [x0, x1] = floor.x;
  const [z0, z1] = floor.z;
  return ({ a, b }) => {
    const p = a.xyz.toVar();
    const v = b.xyz.toVar();
    const born = a.w.toVar();
    If(born.greaterThanEqual(0), () => {
      const air = p.y.greaterThan(GRAIN.radius + 1e-3).toVar();
      If(length(v).greaterThan(0).or(air), () => {
        v.y.subAssign(gravity.mul(dt));
        p.addAssign(v.mul(dt));
        If(p.y.lessThan(GRAIN.radius), () => {
          p.y.assign(GRAIN.radius);
          If(air, () => {
            v.y.assign(v.y.abs().mul(bounce)); // nảy
            v.x.mulAssign(GRAIN.scuff);
            v.z.mulAssign(GRAIN.scuff);
            If(v.y.lessThan(GRAIN.settle), () => {
              v.y.assign(0);
            });
          }).Else(() => {
            v.y.assign(0);
          });
        });
        If(p.y.lessThanEqual(GRAIN.radius + 1e-3), () => {
          const keep = exp(dt.mul(-GRAIN.friction)); // lăn chậm dần
          v.x.mulAssign(keep);
          v.z.mulAssign(keep);
          If(v.y.equal(0).and(length(v.xz).lessThan(GRAIN.rest)), () => {
            v.assign(vec3(0));
          });
        });
        // Mép sàn: dội lại
        If(p.x.lessThan(x0).or(p.x.greaterThan(x1)), () => {
          p.x.assign(clamp(p.x, x0, x1));
          v.x.assign(v.x.negate().mul(bounce));
        });
        If(p.z.lessThan(z0).or(p.z.greaterThan(z1)), () => {
          p.z.assign(clamp(p.z, z0, z1));
          v.z.assign(v.z.negate().mul(bounce));
        });
      });
      // Mỏ đang mổ trúng thì hạt bị ăn: lúc sinh về −1 (Sprite thu hạt về 0; ô thành trống, nắm sau dùng lại). Hạt đang bay thì không.
      for (let i = 0; i < BEAKS; i += 1) {
        const m = beaks.element(i);
        const hit = m.w.greaterThan(0.5).and(m.y.lessThan(GRAIN.reach)).and(p.y.lessThan(GRAIN.reach));
        If(hit.and(length(m.xz.sub(p.xz)).lessThan(GRAIN.eat)), () => {
          born.assign(-1);
        });
      }
    });
    a.assign(vec4(p, born));
    b.assign(vec4(v, b.w));
  };
}

/**
 * Sprite vẽ cả bể: vị trí đọc thẳng bộ đệm (toAttribute). Hạt dẹt 0,08 × 0,04, có sàn theo điểm ảnh (`pixel`: đơn vị cảnh của một điểm
 * ảnh, Cốt đặt mỗi khung), nên trên điện thoại vẫn thấy (§20.11). Xoay theo hạt giống. Hạt bị ăn hay ô trống thu về 0; nằm quá 30 giây
 * thì nhỏ dần. Không ghi độ sâu (Bản nét không vẽ viền quanh hạt), vẫn bị gà che; transparent để vẽ sau mọi vật đục.
 * Màu qua recipe.fill (thóc là vàng hòe khi có Bản màu, đất sét khi không). `lane` (thí nghiệm "Tô theo luồng"): mỗi hạt một màu theo
 * luồng GPU giữ nó, tính ở vertex.
 * @param {{ pool: object, recipe: object, time: any, pixel: any, lane: any, w: any }} p
 */
export function createGrainSprite({ pool, recipe, time, pixel, lane, w }) {
  const material = new SpriteNodeMaterial({ transparent: true, depthWrite: false });
  const a = pool.a.toAttribute();
  const b = pool.b.toAttribute();
  const alive = step(0, a.w).mul(float(1).sub(smoothstep(GRAIN.life, GRAIN.life + GRAIN.fade, time.sub(a.w))));
  material.positionNode = a.xyz;
  material.scaleNode = vec2(max(GRAIN.size[0], pixel.mul(2.5)), max(GRAIN.size[1], pixel.mul(1.5))).mul(alive);
  material.rotationNode = b.w.mul(Math.PI * 2);
  const s = { kind: 'thoc', part: float(-1), n: vec3(0, 1, 0), uv: uv(), pos: a.xyz, pigment: float(-1) };
  const laneColor = vertexStage(hue(color(1, 0.35, 0.1), float(instanceIndex).mul(2.39996)));
  material.colorNode = Fn(() => mix(recipe.fill(s), laneColor, lane))();
  material.opacityNode = float(1).sub(smoothstep(0.38, 0.5, uv().sub(0.5).length())).mul(w);
  material.emissiveNode = vec3(0);
  const sprite = new Sprite(material);
  sprite.frustumCulled = false; // vị trí nằm trong bộ đệm
  return sprite;
}
