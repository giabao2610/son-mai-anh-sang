// tests/paintings/contract.test.js — hợp đồng của mọi bức (registry + tranh mẫu _mau): meta, thứ tự lớp, marker, chữ, runtime.
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { paintings } from '../../src/paintings/registry.js';
import { mergePalette } from '../../src/engine/palette.js';
import { hasCode } from '../../src/ui/code-view.js';
import { NOW, buildPainting } from '../helpers/fake-ctx.js';
import { ALL } from '../helpers/paintings.js';
import { svgColors } from '../helpers/svg.js';
import { jpegSize, webpSize } from '../helpers/image.js';
import { KEBAB } from '../helpers/kebab.js';
import { captionErrors } from '../helpers/caption-rules.js';
import { read, staticClosure } from '../helpers/source.js';
import { parseAt } from '../../src/engine/flags.js';
import { pass } from 'three/tsl';
import { buildFinalNode, linearDepth, makeMRT } from '../../src/engine/gpu/pipeline.js';

const SRC = resolve(import.meta.dirname, '../../src');
const MARKER = /\/\/\s*@knob\s+([A-Za-z0-9_]+)/g;
const MAX_WORDS = 150;

/** Tập id núm có marker `// @knob <id>` trong các file (đường dẫn tính từ src/). */
function markersIn(files) {
  const ids = new Set();
  for (const file of files) {
    for (const m of readFileSync(resolve(SRC, file), 'utf8').matchAll(MARKER)) ids.add(m[1]);
  }
  return ids;
}


describe.each(ALL.map((p) => [p.meta.slug, p]))('Bức "%s"', (slug, row) => {
  const { meta, entry, langs } = row;
  // Module nặng nạp qua cửa vào nhẹ, đúng đường mà trình duyệt đi.
  const loadPainting = async () => ({ entry, painting: await entry.load() });

  it('slug trùng tên thư mục, registry dùng đúng meta.js của thư mục đó; chỉ tranh mẫu được bắt đầu bằng "_"', async () => {
    if (row.deployed) expect(slug, 'slug phải là kebab-case không dấu').toMatch(KEBAB);
    else expect(slug.slice(1), 'tranh mẫu: "_" rồi kebab-case').toMatch(KEBAB);
    expect(existsSync(resolve(SRC, 'paintings', slug)), `thiếu thư mục src/paintings/${slug}/`).toBe(true);
    const { default: own } = await import(`../../src/paintings/${slug}/meta.js`);
    expect(own, `phải dùng src/paintings/${slug}/meta.js`).toBe(meta);
  });

  it('thơ có nguồn (cả bức và từng lớp có thơ riêng)', () => {
    expect(meta.poem.lines.length, 'poem.lines rỗng').toBeGreaterThan(0);
    expect(meta.poem.source, 'poem.source là bắt buộc').toBeTruthy();
    for (const layer of meta.layers.filter((l) => l.poem)) {
      expect(layer.poem.source, `thơ của lớp "${layer.id}" thiếu source`).toBeTruthy();
    }
  });

  it('lớp đầu là Cốt; id lớp duy nhất và kebab-case', () => {
    expect(meta.layers[0].id, 'layers[0] phải là Cốt').toBe('cot');
    const ids = meta.layers.map((l) => l.id);
    expect(new Set(ids).size, `id lớp bị trùng: ${ids.join(', ')}`).toBe(ids.length);
    for (const id of ids) expect(id, `id lớp "${id}" phải là kebab-case không dấu`).toMatch(KEBAB);
  });

  it('file của lớp tồn tại trong src/, mỗi file thuộc tối đa một lớp, và Sổ tay hiện được (glob ?code)', () => {
    const owner = new Map();
    for (const layer of meta.layers) {
      expect(layer.files.length, `lớp "${layer.id}" chưa khai báo files`).toBeGreaterThan(0);
      for (const file of layer.files) {
        expect(existsSync(resolve(SRC, file)), `lớp "${layer.id}": không thấy src/${file}`).toBe(true);
        expect(owner.get(file), `src/${file} thuộc cả lớp "${owner.get(file)}" và "${layer.id}"`).toBeUndefined();
        owner.set(file, layer.id);
        // Tranh mẫu không deploy nên cố ý nằm ngoài glob của ui/code-view.js.
        if (row.deployed) expect(hasCode(file), `src/${file} nằm ngoài glob ?code của ui/code-view.js`).toBe(true);
      }
    }
  });

  it('files của lớp (GĐ 5) kê đủ mọi file trong parts/ mà file lớp import tĩnh, thẳng hay qua part khác: Sổ tay hiện đủ code', () => {
    const parts = `src/paintings/${slug}/parts/`;
    for (const layer of meta.layers) {
      for (const file of layer.files.filter((f) => f.startsWith(`paintings/${slug}/layers/`))) {
        // Chỉ đi qua parts/: shared.js cũng import part, nhưng nó là của cả bức, không thuộc lớp nào. Cùng với luật "mỗi
        // file thuộc tối đa một lớp", part là của riêng một lớp: lớp khác cần gì của nó thì nhận qua shared.
        const start = `src/${file}`;
        const reached = staticClosure(start, (rel) => (rel === start || rel.startsWith(parts) ? read(rel) : null))
          .filter((f) => f.startsWith(parts))
          .map((f) => f.slice('src/'.length)); // đường dẫn tính từ src/, như files
        const missing = reached.filter((f) => !layer.files.includes(f));
        expect(missing, `lớp "${layer.id}": ${file} import (thẳng hay qua part khác) mà files chưa kê`).toEqual([]);
      }
    }
  });

  it('files của lớp (GĐ 8) chỉ kê file lib/tsl/ mà lớp thật sự import (thẳng hay qua part): Sổ tay không hiện code lớp không dùng', () => {
    const parts = `src/paintings/${slug}/parts/`;
    for (const layer of meta.layers) {
      const libs = layer.files.filter((f) => f.startsWith('lib/'));
      if (libs.length === 0) continue;
      const reached = new Set(layer.files.filter((f) => f.startsWith(`paintings/${slug}/layers/`)).flatMap((file) => {
        const start = `src/${file}`;
        return staticClosure(start, (rel) => (rel === start || rel.startsWith(parts) ? read(rel) : null));
      }));
      for (const lib of libs) {
        expect(lib, `lớp "${layer.id}": chỉ kê được file trong lib/tsl/`).toMatch(/^lib\/tsl\/[\w-]+\.js$/);
        expect(reached.has(`src/${lib}`), `lớp "${layer.id}" kê src/${lib} mà không import nó`).toBe(true);
      }
    }
  });

  it('poster (GĐ 4): capture đọc được (at theo ?at, freeze nguyên dương); file WebP đúng cỡ và ≤ 150 KB; og 1200×630, ≤ 200 KB', () => {
    const { capture } = meta.poster;
    if (capture) {
      expect(parseAt(capture.at), `poster.capture.at "${capture.at}" không đọc được như ?at`).not.toBeNull();
      expect(Number.isInteger(capture.freeze) && capture.freeze > 0, 'poster.capture.freeze phải là số nguyên dương').toBe(true);
    }
    if (!row.deployed) return; // tranh mẫu không có file trong public/
    const PUBLIC = resolve(SRC, '../public');
    if (meta.poster.src.endsWith('.webp')) {
      const file = readFileSync(PUBLIC + meta.poster.src);
      expect(webpSize(file), 'cỡ poster phải đúng meta.poster').toEqual({ width: meta.poster.width, height: meta.poster.height });
      expect(file.length, 'poster ≤ 150 KB').toBeLessThanOrEqual(150 * 1024);
    }
    if (meta.og) {
      expect(existsSync(resolve(PUBLIC, meta.og)), `thiếu public/${meta.og}`).toBe(true);
      expect(jpegSize(readFileSync(resolve(PUBLIC, meta.og)))).toEqual({ width: 1200, height: 630 });
      expect(statSync(resolve(PUBLIC, meta.og)).size, 'og ≤ 200 KB').toBeLessThanOrEqual(200 * 1024);
    }
  });

  it('painting.js: cùng id lớp, cùng thứ tự với meta; module lớp và camera đúng hình dạng', async () => {
    const { entry, painting } = await loadPainting();
    expect(entry.meta, 'index.js phải export meta của chính bức').toBe(meta);
    expect(painting.layers.map((m) => m.id)).toEqual(meta.layers.map((l) => l.id));
    for (const m of painting.layers) {
      expect(Array.isArray(m.knobs), `lớp "${m.id}" thiếu export const knobs`).toBe(true);
      expect(typeof m.createLayer, `lớp "${m.id}" thiếu createLayer`).toBe('function');
    }
    const cam = painting.camera;
    expect(cam.position).toHaveLength(3);
    expect(cam.target).toHaveLength(3);
    expect(['perspective', 'ortho'], `CameraSpec.kind "${cam.kind}"`).toContain(cam.kind ?? 'perspective');
    if (cam.kind === 'ortho') {
      expect(cam.height, 'camera trực giao cần height > 0').toBeGreaterThan(0);
      if (cam.minWidth !== undefined) expect(cam.minWidth).toBeGreaterThan(0);
      if (cam.zoom) expect(0 < cam.zoom[0] && cam.zoom[0] <= cam.zoom[1], `zoom ${cam.zoom}`).toBe(true);
      if (cam.shortFrame) expect(cam.shortFrame.below > 0 && cam.shortFrame.maxGrow >= 1, 'shortFrame: below > 0, maxGrow ≥ 1').toBe(true);
    } else {
      expect(cam.shortFrame, 'shortFrame chỉ dành cho camera trực giao (camera phối cảnh bỏ qua nó)').toBeUndefined();
      expect(cam.fov, 'camera phối cảnh cần fov > 0').toBeGreaterThan(0);
      expect(cam.distance[0]).toBeLessThanOrEqual(cam.distance[1]);
    }
    for (const [lo, hi] of [cam.azimuth, cam.polar]) expect(lo).toBeLessThanOrEqual(hi);
    if (cam.home) expect(cam.home.after > 0 && cam.home.duration > 0, 'home: after, duration > 0').toBe(true);
  });

  it('marker // @knob trong file của mỗi lớp khớp đúng knobs của lớp đó', async () => {
    const { painting } = await loadPainting();
    meta.layers.forEach((layer, i) => {
      const expected = new Set(painting.layers[i].knobs.map((k) => k.id));
      expect(markersIn(layer.files), `marker của lớp "${layer.id}"`).toEqual(expected);
    });
  });

  describe('runtime: dựng như run.js trong Node (renderer giả)', () => {
    for (const level of ['cao', 'thap']) {
      it(`mức ${level}: mỗi lớp có dispose và objects; mọi NodeMaterial có emissiveNode; gỡ ngược thì scene trống`, async () => {
        const { painting } = await loadPainting();
        const { ctx, built } = buildPainting(painting, meta, { level });
        for (const { id, layer } of built) {
          expect(typeof layer.dispose, `lớp "${id}" thiếu dispose`).toBe('function');
          if (layer.objects) {
            expect(Array.isArray(layer.objects), `objects của "${id}" phải là mảng`).toBe(true);
            for (const o of layer.objects) expect(o?.isObject3D, `objects của "${id}" có thứ không phải Object3D`).toBe(true);
          }
        }
        ctx.scene.traverse((o) => {
          for (const m of [o.material].flat().filter(Boolean)) {
            if (m.isNodeMaterial) expect(m.emissiveNode, `${o.type} · ${m.type} thiếu emissiveNode (luật 8)`).toBeTruthy();
          }
        });
        for (const { layer } of [...built].reverse()) {
          layer.dispose();
          layer.dispose(); // gọi 2 lần vẫn an toàn
        }
        expect(ctx.scene.children, 'dispose phải gỡ mọi thứ lớp đã thêm vào scene').toHaveLength(0);
      });
    }

    it('núm js/rebuild áp được giá trị của chính nó; thí nghiệm bật rồi tắt được; số đo trả số hoặc chuỗi', async () => {
      const { painting } = await loadPainting();
      const { built } = buildPainting(painting, meta);
      for (const { id, module, layer, knobs } of built) {
        for (const knob of module.knobs.filter((k) => (k.via ?? 'uniform') !== 'uniform')) {
          await knobs.set(knob.id, knobs.get(knob.id)); // lỗi (nếu có) làm test hỏng kèm stack của onKnob
        }
        for (const exp of layer.experiments ?? []) {
          await exp.toggle(true);
          await exp.toggle(false);
        }
        for (const r of layer.readouts ?? []) expect(['number', 'string'], `${id}.${r.id}`).toContain(typeof r.get());
      }
    });
  });

  it('quality (nếu có): đủ ba mức; ladder chỉ gồm dpr và nấc có thật của các lớp (ở mức cao); nấc gỡ ra thì số đo như cũ', async () => {
    const { painting } = await loadPainting();
    if (!painting.quality) return;
    expect(Object.keys(painting.quality.levels).sort(), 'quality.levels phải có cao, vua, thap').toEqual(['cao', 'thap', 'vua']);
    // Ba mức cùng bộ khóa (GĐ 4): thiếu một khóa ở một mức thì lớp lặng lẽ lấy số mặc định của nó, không ai hay.
    const keys = Object.fromEntries(Object.entries(painting.quality.levels).map(([level, l]) => [level, Object.keys(l).sort()]));
    expect(keys.vua, 'quality.levels.vua phải có cùng khóa với cao').toEqual(keys.cao);
    expect(keys.thap, 'quality.levels.thap phải có cùng khóa với cao').toEqual(keys.cao);
    const { ladder } = painting.quality;
    expect(new Set(ladder).size, `ladder có mục trùng: ${ladder.join(', ')}`).toBe(ladder.length);
    const { built } = buildPainting(painting, meta, { level: 'cao' });
    for (const entry of ladder.filter((e) => e !== 'dpr')) {
      const dot = entry.indexOf('.');
      const b = built.find((x) => x.id === entry.slice(0, dot));
      expect(b, `ladder "${entry}": bức không có lớp "${entry.slice(0, dot)}"`).toBeTruthy();
      const step = b.layer.degrade?.find((s) => s.id === entry.slice(dot + 1));
      expect(step, `ladder "${entry}": lớp không đưa nấc này ở mức cao`).toBeTruthy();
      const read = () => (b.layer.readouts ?? []).map((r) => r.get());
      const before = read();
      step.apply();
      step.revert();
      expect(read(), `nấc "${entry}" gỡ ra thì số đo phải về như cũ`).toEqual(before);
    }
  });

  it('Dial (nếu có): id kebab-case, không trùng; min < max; format ra chuỗi; có nhãn; mọi khóa note() trả ra đều có chữ', async () => {
    const { painting } = await loadPainting();
    // Ban đêm và ban ngày: note() có thể khác nhau (Bức 1 ghi chú 'daytime' khi mượn giờ).
    for (const now of [NOW, new Date('2026-09-28T12:00:00+07:00')]) {
      const { setup } = buildPainting(painting, meta, { now });
      const dials = setup?.dials ?? [];
      const ids = dials.map((d) => d.id);
      expect(new Set(ids).size, `Dial trùng id: ${ids.join(', ')}`).toBe(ids.length);
      for (const dial of dials) {
        expect(dial.id, `id Dial "${dial.id}"`).toMatch(KEBAB);
        expect(dial.min, `Dial "${dial.id}": min < max`).toBeLessThan(dial.max);
        expect(dial.uniform?.isNode, `Dial "${dial.id}" thiếu uniform`).toBe(true);
        if (dial.format) for (const v of [dial.min, dial.max]) expect(typeof dial.format(v), `format(${v})`).toBe('string');
        for (const lang of langs) {
          const { default: content } = await entry.content[lang]();
          const text = content.dials?.[dial.id];
          expect(text?.label, `${lang}: thiếu content.dials["${dial.id}"].label`).toBeTruthy();
          for (const v of [dial.uniform.value, dial.min, dial.max]) {
            const before = dial.uniform.value;
            dial.uniform.value = v;
            const key = dial.note?.() ?? null;
            dial.uniform.value = before;
            if (key !== null) expect(text.notes?.[key], `${lang}: thiếu chữ ghi chú "${dial.id}.${key}"`).toBeTruthy();
          }
        }
      }
    }
  });

  describe('chữ (content) theo từng ngôn ngữ', () => {
    const palette = new Set(Object.values(mergePalette(meta.palette)).map((h) => h.toUpperCase()));

    it('bức có chữ tiếng Việt', () => {
      expect(langs).toContain('vi');
    });

    it.each(langs)('%s: mỗi lớp đủ Hiểu (≤ 150 chữ), "Bạn vừa học", "Đọc thêm" (https), nhãn núm/thí nghiệm/số đo', async (lang) => {
      const { default: content } = await entry.content[lang]();
      const { built } = buildPainting(await entry.load(), meta);
      expect(typeof content.hint, 'thiếu hint').toBe('string');
      for (const { id, module, layer } of built) {
        const text = content.layers?.[id];
        expect(text, `thiếu content.layers["${id}"]`).toBeTruthy();
        const words = text.understand.trim().split(/\s+/).length;
        expect(words, `Hiểu của "${id}" dài ${words} chữ`).toBeLessThanOrEqual(MAX_WORDS);
        expect(text.learned.length, `"${id}" thiếu "Bạn vừa học"`).toBeGreaterThan(0);
        for (const { title, url } of text.readMore) {
          expect(title, `"${id}": Đọc thêm thiếu tiêu đề`).toBeTruthy();
          expect(url, `"${id}": ${url}`).toMatch(/^https:\/\//);
        }
        for (const knob of module.knobs) {
          const label = text.knobs?.[knob.id];
          expect(typeof label === 'string' ? label : label?.label, `nhãn núm "${id}.${knob.id}"`).toBeTruthy();
          if (knob.kind === 'select') {
            for (const o of knob.options) expect(label?.options?.[o], `nhãn lựa chọn "${id}.${knob.id}.${o}"`).toBeTruthy();
          }
        }
        for (const exp of layer.experiments ?? []) {
          const e = text.experiments?.[exp.id];
          expect(e?.label && e?.explain, `nhãn + lời giải thích của thí nghiệm "${id}.${exp.id}"`).toBeTruthy();
        }
        for (const r of layer.readouts ?? []) expect(text.readouts?.[r.id], `nhãn số đo "${id}.${r.id}"`).toBeTruthy();
      }
    });

    it.each(langs)('%s: mọi tap mà các lớp ghi trong build/display có nhãn ở content.layers[id].taps (GĐ 4)', async (lang) => {
      const { default: content } = await entry.content[lang]();
      const { ctx, built } = buildPainting(await entry.load(), meta);
      const scenePass = pass(ctx.scene, ctx.camera);
      scenePass.setMRT(makeMRT());
      // Độ sâu như pipeline.js dựng (theo loại camera): lớp nào lấy mẫu texture độ sâu (.sample) cần đúng texture, không phải công thức.
      const depth = linearDepth(scenePass, ctx.camera);
      const channel = (name) => (name === 'depth' ? depth : scenePass.getTextureNode(name));
      const taps = [];
      buildFinalNode({ color: channel('output'), channel, layers: built, weight: ctx.weight, taps });
      for (const { layerId, tapId } of taps) {
        expect(content.layers?.[layerId]?.taps?.[tapId], `nhãn tap "${layerId}:${tapId}"`).toBeTruthy();
      }
    });

    it.each(langs)('%s: chữ đi theo vật (GĐ 5, nếu có): khóa kebab-case; mỗi mục 1–2 dòng không rỗng (≤ 60 ký tự), có nguồn', async (lang) => {
      const { default: content } = await entry.content[lang]();
      const errors = captionErrors(content.captions);
      expect(errors, `content.captions (${lang}):\n${errors.join('\n')}`).toEqual([]);
    });

    it.each(langs)('%s: sơ đồ (nếu có) là SVG có <title>, chỉ dùng màu của bảng sơn mài', async (lang) => {
      const { default: content } = await entry.content[lang]();
      for (const [id, text] of Object.entries(content.layers ?? {})) {
        if (!text.diagram) continue;
        expect(text.diagram.trimStart().startsWith('<svg'), `sơ đồ của "${id}"`).toBe(true);
        expect(text.diagram, `sơ đồ của "${id}" thiếu <title>`).toMatch(/<title[\s>]/);
        expect([...svgColors(text.diagram)].filter((c) => !palette.has(c)), `màu lạ trong sơ đồ của "${id}"`).toEqual([]);
      }
    });
  });
});

describe('tranh mẫu _mau', () => {
  it('không nằm trong registry (không deploy) nhưng test hợp đồng vẫn kiểm nó', () => {
    expect(paintings.map((p) => p.meta.slug)).not.toContain('_mau');
    expect(ALL.map((p) => p.meta.slug)).toContain('_mau');
  });

  it('không bức nào trong registry bắt đầu bằng "_" (thư mục "_" là không deploy)', () => {
    expect(paintings.filter((p) => p.meta.slug.startsWith('_'))).toEqual([]);
  });
});
