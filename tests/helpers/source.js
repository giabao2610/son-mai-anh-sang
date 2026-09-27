// tests/helpers/source.js — đọc mã nguồn bằng parseSync của Vite: liệt kê file, bỏ chú thích, đọc import, bao đóng import tĩnh.
//
// Vì sao không dùng regex: chuỗi '../paintings/**/layers/*.js' chứa "/**/" và "/*", một regex bỏ chú thích sẽ nuốt
// mất code phía sau và luật lặng lẽ bỏ sót. parseSync (oxc, có sẵn trong vite) trả về AST chuẩn ESTree và vị trí
// chính xác của từng chú thích, tính theo chỉ số chuỗi JS (UTF-16), kể cả khi trước đó có chữ tiếng Việt.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSync } from 'vite';

/** Thư mục gốc của repo (tuyệt đối). */
export const ROOT = fileURLToPath(new URL('../../', import.meta.url));

/** Đọc một file theo đường dẫn tính từ gốc repo, ví dụ 'src/engine/boot.js'. */
export function read(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

/** Bộ nạp mặc định cho staticClosure: nội dung file, hoặc null nếu file không có. */
function loadFile(rel) {
  return existsSync(join(ROOT, rel)) ? read(rel) : null;
}

/**
 * Mọi file src/**\/*.js và plugins/*.js, đường dẫn tính từ gốc repo, sắp xếp theo chữ cái.
 * @param {RegExp} [re]  chỉ giữ file khớp, ví dụ /^src\/engine\//
 * @returns {string[]}
 */
export function listSrc(re) {
  const list = (dir, recursive) => {
    const abs = join(ROOT, dir);
    if (!existsSync(abs)) return [];
    return readdirSync(abs, { recursive })
      .map((p) => posix.join(dir, String(p).split('\\').join('/')))
      .filter((p) => p.endsWith('.js') && statSync(join(ROOT, p)).isFile());
  };
  const files = [...list('src', true), ...list('plugins', false)].sort();
  return re ? files.filter((f) => re.test(f)) : files;
}

/** Phân tích một file; lỗi cú pháp thì ném lỗi có tên file để test báo rõ. */
function parse(file, code) {
  const result = parseSync(file, code);
  if (result.errors.length > 0) throw new Error(`Không đọc được ${file}: ${result.errors[0].message}`);
  return result;
}

/** Đi qua mọi node của AST (ESTree). visit(node) được gọi cho từng node có `type`. */
function walk(node, visit) {
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit);
    return;
  }
  if (!node || typeof node !== 'object' || typeof node.type !== 'string') return;
  visit(node);
  for (const key of Object.keys(node)) {
    const value = node[key];
    if (value && typeof value === 'object') walk(value, visit);
  }
}

/** Số dòng (từ 1) của vị trí `index` trong `code`. */
function lineAt(code, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) if (code.charCodeAt(i) === 10) line += 1;
  return line;
}

/** Giá trị của một chuỗi hằng: 'x', "x" hoặc `x` không có ${}. Còn lại trả null. */
function literalString(node) {
  if (node?.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].value.cooked;
  return null;
}

/**
 * Thay mọi chú thích bằng khoảng trắng, GIỮ dấu xuống dòng: số dòng và vị trí của code còn lại không đổi.
 * Chuỗi như 'https://x' hay '../paintings/**\/layers/*.js' không phải chú thích nên được giữ nguyên.
 * @param {string} code
 * @param {string} [file]  tên file, chỉ để báo lỗi
 */
export function stripComments(code, file = 'input.js') {
  const comments = [...parse(file, code).comments].sort((a, b) => a.start - b.start);
  let out = '';
  let last = 0;
  for (const { start, end } of comments) {
    out += code.slice(last, start) + code.slice(start, end).replace(/[^\r\n]/g, ' ');
    last = end;
  }
  return out + code.slice(last);
}

/** Specifier trần = gói npm ('three/tsl', 'tweakpane'), không phải đường dẫn './x.js' hay '/src/x.js'. */
export function isBare(spec) {
  return !spec.startsWith('.') && !spec.startsWith('/');
}

/** 'three', 'three/webgpu', 'three/tsl', 'three/addons/…' */
export function isThree(target) {
  return target === 'three' || target.startsWith('three/');
}

/**
 * Mọi import của một file, đủ 5 dạng: `import … from`, `import '…'`, `export … from`, `export * from` và `import()`.
 * - Hậu tố `?…` được bỏ trước khi phân giải. Import có `?code`, `?raw`, `?url` không tính (plugin trả chuỗi, không chạy module).
 * - `target`: đường dẫn tính từ gốc repo ('src/engine/flags.js') nếu là import tương đối, còn lại là tên gói.
 * - `import()` có tham số không phải chuỗi hằng → một mục { spec: null, target: null }: luật coi đó là lỗi.
 * @param {string} rel   đường dẫn file tính từ gốc repo (để phân giải import tương đối)
 * @param {string} [code]  nội dung; mặc định đọc từ đĩa
 * @returns {{ spec: string | null, target: string | null, dynamic: boolean, line: number }[]}
 */
export function importsOf(rel, code = read(rel)) {
  const { program } = parse(rel, code);
  const found = [];
  const add = (spec, dynamic, start) => {
    const line = lineAt(code, start);
    if (spec === null) {
      found.push({ spec: null, target: null, dynamic, line });
      return;
    }
    const [path, query = ''] = spec.split('?');
    if (/^(code|raw|url)(&|$)/.test(query)) return;
    let target = path;
    if (path.startsWith('.')) target = posix.normalize(posix.join(posix.dirname(rel), path));
    else if (path.startsWith('/')) target = path.slice(1);
    found.push({ spec, target, dynamic, line });
  };
  walk(program, (node) => {
    if (node.type === 'ImportDeclaration' || node.type === 'ExportAllDeclaration'
      || (node.type === 'ExportNamedDeclaration' && node.source)) {
      add(node.source.value, false, node.start);
    } else if (node.type === 'ImportExpression') {
      add(literalString(node.source), true, node.start);
    }
  });
  return found.sort((a, b) => a.line - b.line);
}

/**
 * Tên được import tĩnh từ một gói/đường dẫn: `import { time as t }` → { name: 'time', local: 't' };
 * `import * as TSL` → { name: '*', local: 'TSL' }; `export { deltaTime } from` → { name: 'deltaTime', local: null }.
 * @returns {{ name: string, local: string | null, line: number }[]}
 */
export function importedNames(code, source, file = 'input.js') {
  const { program } = parse(file, code);
  const names = [];
  const id = (n) => n?.name ?? n?.value ?? null;
  for (const node of program.body) {
    if (node.source?.value !== source) continue;
    const line = lineAt(code, node.start);
    for (const s of node.specifiers ?? []) {
      if (s.type === 'ImportSpecifier') names.push({ name: id(s.imported), local: id(s.local), line });
      else if (s.type === 'ImportNamespaceSpecifier') names.push({ name: '*', local: id(s.local), line });
      else if (s.type === 'ImportDefaultSpecifier') names.push({ name: 'default', local: id(s.local), line });
      else if (s.type === 'ExportSpecifier') names.push({ name: id(s.local), local: null, line });
    }
  }
  return names;
}

/**
 * Các lần gọi import.meta.glob trong một file: [{ patterns, query, line }].
 * query = giá trị của tùy chọn { query: '?code' } (null nếu không có).
 */
export function globsOf(code, file = 'input.js') {
  const { program } = parse(file, code);
  const globs = [];
  walk(program, (node) => {
    const callee = node.type === 'CallExpression' ? node.callee : null;
    if (callee?.type !== 'MemberExpression' || callee.object.type !== 'MetaProperty' || callee.property.name !== 'glob') return;
    const [first, options] = node.arguments;
    const patterns = first?.type === 'ArrayExpression' ? first.elements.map(literalString) : [literalString(first)];
    const queryProp = options?.type === 'ObjectExpression'
      ? options.properties.find((p) => (p.key?.name ?? p.key?.value) === 'query')
      : undefined;
    globs.push({ patterns, query: queryProp ? literalString(queryProp.value) : null, line: lineAt(code, node.start) });
  });
  return globs;
}

/**
 * Bao đóng import TĨNH: mọi thứ tới được từ `rel` qua import tĩnh (không tính import() động, không tính chính `rel`).
 * Chỉ đi tiếp vào file .js nằm trong repo. Tên gói và file .css là lá: có trong kết quả nhưng không đi vào,
 * nên không bao giờ đi vào node_modules.
 * @param {string} rel
 * @param {(rel: string) => string | null} [load]  bộ nạp nội dung (test truyền bộ nạp giả)
 * @returns {string[]}  sắp xếp theo chữ cái
 */
export function staticClosure(rel, load = loadFile) {
  const seen = new Set();
  const stack = [rel];
  while (stack.length > 0) {
    const file = stack.pop();
    const code = load(file);
    if (code === null) continue;
    for (const { spec, target, dynamic } of importsOf(file, code)) {
      if (dynamic || target === null || seen.has(target)) continue;
      seen.add(target);
      const inRepo = !isBare(spec) && !target.startsWith('..') && !target.split('/').includes('node_modules');
      if (inRepo && target.endsWith('.js')) stack.push(target);
    }
  }
  return [...seen].sort();
}
