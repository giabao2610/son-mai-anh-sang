// tests/paintings/objects.test.js — tên vật (GĐ 5) của mọi bức: vật trong layer.objects có name kebab-case, không trùng trong lớp, có nhãn; không nhãn thừa.
import { describe, it, expect } from 'vitest';
import { buildPainting } from '../helpers/fake-ctx.js';
import { KEBAB } from '../helpers/kebab.js';
import { ALL } from '../helpers/paintings.js';

/** RegExp.test(undefined) thử chuỗi "undefined" (khớp kebab-case), nên phải xét kiểu trước. */
const validName = (name) => typeof name === 'string' && KEBAB.test(name);
/** InstancedMesh của r186 không đặt type riêng: type vẫn là 'Mesh'. */
const kindOf = (o) => (o.isInstancedMesh ? 'InstancedMesh' : o.type);

/**
 * Dựng bức như run.js ở mức cao và mức thấp; mỗi lớp được xem lúc vừa dựng và lúc từng thí nghiệm đang bật (thí nghiệm
 * thêm được vật, như Group lá rời của "Tắt instancing"). Lần xem nào cũng vậy: vật nào cũng có name kebab-case không dấu,
 * và không hai vật nào của một lớp cùng tên. Lỗi của một vật ghi lúc nó xuất hiện lần đầu (vật có từ lúc dựng thì không
 * ghi gì, vật do thí nghiệm thêm thì ghi tên thí nghiệm ấy, kể cả khi nó còn ở lại sau khi tắt), nên dù lần xem nào cũng
 * gặp, mỗi lỗi chỉ hiện một lần. Cuối dòng lỗi ghi các mức đã gặp nó, như "(mức thap)": lỗi chỉ có ở mức thấp thì dựng
 * bức ở mức cao (mức mặc định) để xem sẽ không thấy.
 * @returns {Promise<{ names: Map<string, Set<string>>, errors: string[] }>}  names: id lớp → mọi tên hợp lệ đã gặp
 */
async function collectNames(painting, meta) {
  const names = new Map();
  const errors = new Map(); // lỗi → các mức đã gặp nó: cùng một lỗi ở cả hai mức vẫn chỉ là một dòng
  for (const level of ['cao', 'thap']) {
    const report = (error) => errors.set(error, (errors.get(error) ?? new Set()).add(level));
    for (const { id, layer } of buildPainting(painting, meta, { level }).built) {
      const own = names.get(id) ?? new Set();
      names.set(id, own);
      const born = new Map(); // vật → lúc nó xuất hiện lần đầu
      const look = (when) => {
        const byName = new Map();
        (layer.objects ?? []).forEach((o, i) => {
          if (!born.has(o)) born.set(o, when);
          if (!validName(o.name)) {
            const what = o.name ? `có name "${o.name}", phải là kebab-case không dấu` : 'chưa có name';
            report(`lớp "${id}"${born.get(o)}: vật thứ ${i} (${kindOf(o)}) ${what}`);
            return;
          }
          own.add(o.name);
          byName.set(o.name, [...(byName.get(o.name) ?? []), o]);
        });
        for (const [name, list] of byName) {
          if (list.length < 2) continue;
          const at = list.map((o) => born.get(o)).find(Boolean) ?? '';
          report(`lớp "${id}"${at}: ${list.length} vật cùng tên "${name}" (tên không được trùng trong lớp)`);
        }
      };
      look('');
      for (const exp of layer.experiments ?? []) {
        await exp.toggle(true);
        look(` (lúc bật thí nghiệm "${exp.id}")`);
        await exp.toggle(false);
      }
    }
  }
  return { names, errors: [...errors].map(([error, levels]) => `${error} (mức ${[...levels].join(', ')})`) };
}

/**
 * Lỗi nhãn trong chữ của một ngôn ngữ: tên vật nào cũng có nhãn (chuỗi không rỗng) ở content.layers[id].objects[tên],
 * và khóa nào trong đó cũng là tên của một vật có thật (không nhãn thừa).
 * @param {Map<string, Set<string>>} names  id lớp → mọi tên đã gặp (collectNames)
 */
function labelErrors(names, content, lang) {
  const errors = [];
  for (const [id, own] of names) {
    for (const name of own) {
      const label = content.layers?.[id]?.objects?.[name];
      if (typeof label !== 'string' || !label.trim()) errors.push(`${lang}: thiếu nhãn content.layers["${id}"].objects["${name}"]`);
    }
  }
  for (const [id, text] of Object.entries(content.layers ?? {})) {
    for (const name of Object.keys(text.objects ?? {})) {
      if (names.get(id)?.has(name)) continue;
      errors.push(`${lang}: nhãn thừa content.layers["${id}"].objects["${name}"]: không vật nào của lớp "${id}" mang tên này `
        + '(ở mức cao, mức thấp, lúc bật từng thí nghiệm)');
    }
  }
  return errors;
}

describe.each(ALL.map((p) => [p.meta.slug, p]))('Bức "%s"', (slug, { meta, entry, langs }) => {
  it('tên vật (GĐ 5): ở mức cao, thấp và lúc bật từng thí nghiệm, mọi vật trong layer.objects có name kebab-case, không trùng '
    + 'trong lớp, có nhãn ở content.layers[id].objects; không nhãn thừa', async () => {
    const { names, errors } = await collectNames(await entry.load(), meta);
    for (const lang of langs) {
      const { default: content } = await entry.content[lang]();
      errors.push(...labelErrors(names, content, lang));
    }
    expect(errors, `tên vật và nhãn của bức "${slug}":\n${errors.join('\n')}`).toEqual([]);
  });
});
