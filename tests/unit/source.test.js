import { describe, expect, it } from 'vitest';
import {
  globsOf, importedNames, importsOf, isBare, isThree, listSrc, staticClosure, stripComments,
} from '../helpers/source.js';

// File mẫu đặt ở src/engine/mau.js (không có trên đĩa: chỉ dùng để phân giải đường dẫn).
const SAMPLE = [
  '// src/engine/mau.js — file mẫu, chú thích có chữ tiếng Việt',
  "import a from './a.js';",
  "import './side.css';",
  "export { b } from '../lib/b.js';",
  "export * from './c.js';",
  '/* chú thích khối',
  '   kéo dài hai dòng */',
  "const url = 'https://x'; // chú thích cuối dòng",
  "const g = import.meta.glob('../paintings/**/layers/*.js', { query: '?code' });",
  "const lazy = () => import('./gpu/run.js');",
  "import code from './l1.js?code';",
  "import raw from './d.svg?raw';",
  "import link from './img.png?url';",
  'const bad = (n) => import(`./${n}.js`);',
  "import * as THREE from 'three/webgpu';",
].join('\n');

describe('stripComments', () => {
  const out = stripComments(SAMPLE);

  it('thay chú thích bằng khoảng trắng và giữ nguyên dấu xuống dòng', () => {
    expect(out).toHaveLength(SAMPLE.length);
    expect(out.split('\n').map((l) => l.length)).toEqual(SAMPLE.split('\n').map((l) => l.length));
    expect(out.split('\n')[0].trim()).toBe('');
    expect(out).not.toContain('chú thích');
  });

  it("giữ 'https://x' trong chuỗi và chuỗi glob có /**/", () => {
    expect(out).toContain("const url = 'https://x';");
    expect(out).toContain("import.meta.glob('../paintings/**/layers/*.js', { query: '?code' })");
  });

  it('code sau chuỗi glob vẫn còn (regex bỏ chú thích sẽ nuốt mất đoạn này)', () => {
    expect(out).toContain("import('./gpu/run.js')");
    expect(out).toContain("import * as THREE from 'three/webgpu';");
  });

  it('lỗi cú pháp thì ném lỗi có tên file', () => {
    expect(() => stripComments('import {', 'src/x.js')).toThrow('src/x.js');
  });
});

describe('importsOf', () => {
  const found = importsOf('src/engine/mau.js', SAMPLE);

  it('bắt đủ 5 dạng import, import() được đánh dấu dynamic, đường dẫn tương đối phân giải từ gốc repo', () => {
    expect(found).toEqual([
      { spec: './a.js', target: 'src/engine/a.js', dynamic: false, line: 2 },
      { spec: './side.css', target: 'src/engine/side.css', dynamic: false, line: 3 },
      { spec: '../lib/b.js', target: 'src/lib/b.js', dynamic: false, line: 4 },
      { spec: './c.js', target: 'src/engine/c.js', dynamic: false, line: 5 },
      { spec: './gpu/run.js', target: 'src/engine/gpu/run.js', dynamic: true, line: 10 },
      { spec: null, target: null, dynamic: true, line: 14 },
      { spec: 'three/webgpu', target: 'three/webgpu', dynamic: false, line: 15 },
    ]);
  });

  it('bỏ qua import có ?code, ?raw, ?url; import() không phải chuỗi hằng thành mục spec null', () => {
    expect(found.some((i) => /l1\.js|d\.svg|img\.png/.test(i.target ?? ''))).toBe(false);
    expect(found.filter((i) => i.spec === null)).toHaveLength(1);
  });

  it('template literal không có ${} tính là chuỗi hằng; hậu tố ?… khác bị bỏ khi phân giải', () => {
    const more = importsOf('src/ui/x.js', "const m = import(`./y.js`);\nimport w from './worker.js?worker';");
    expect(more).toEqual([
      { spec: './y.js', target: 'src/ui/y.js', dynamic: true, line: 1 },
      { spec: './worker.js?worker', target: 'src/ui/worker.js', dynamic: false, line: 2 },
    ]);
  });

  it('isBare và isThree', () => {
    expect(isBare('three/tsl')).toBe(true);
    expect(isBare('./a.js')).toBe(false);
    expect(isBare('/src/a.js')).toBe(false);
    expect(isThree('three')).toBe(true);
    expect(isThree('three/addons/tsl/display/BloomNode.js')).toBe(true);
    expect(isThree('threejs-extra')).toBe(false);
  });
});

describe('importedNames và globsOf', () => {
  it('đọc tên được import từ một gói, kể cả import * và export … from', () => {
    const code = "import { time as t, uniform } from 'three/tsl';\nimport * as TSL from 'three/tsl';\nexport { deltaTime } from 'three/tsl';\nimport { Color } from 'three/webgpu';";
    expect(importedNames(code, 'three/tsl')).toEqual([
      { name: 'time', local: 't', line: 1 },
      { name: 'uniform', local: 'uniform', line: 1 },
      { name: '*', local: 'TSL', line: 2 },
      { name: 'deltaTime', local: null, line: 3 },
    ]);
  });

  it('tìm lời gọi import.meta.glob cùng pattern và query', () => {
    expect(globsOf("const g = import.meta.glob('../paintings/**/layers/*.js', { query: '?code' });")).toEqual([
      { patterns: ['../paintings/**/layers/*.js'], query: '?code', line: 1 },
    ]);
    expect(globsOf("const g = import.meta.glob(['./a/*.js', './b/*.js']);")[0]).toMatchObject({ patterns: ['./a/*.js', './b/*.js'], query: null });
  });
});

describe('staticClosure', () => {
  const FILES = {
    'src/engine/boot.js': "import './flags.js';\nimport { mountShell } from '../ui/shell.js';\nconst run = () => import('./gpu/run.js');",
    'src/engine/flags.js': 'export const flags = 1;',
    'src/ui/shell.js': "import '../lib/astro/lunar.js';\nimport './shell.css';\nimport 'three/webgpu';\nexport * from './badge.js';\nimport '../../node_modules/three/build/three.webgpu.js';",
    'src/ui/badge.js': "export { flags } from '../engine/flags.js';",
    'src/lib/astro/lunar.js': 'export const lunar = 1;',
    'src/engine/gpu/run.js': "import 'three/webgpu';",
  };
  const asked = [];
  const load = (f) => {
    asked.push(f);
    return FILES[f] ?? null;
  };
  const closure = staticClosure('src/engine/boot.js', load);

  it('đi theo import tĩnh tương đối tới file .js; tên gói và .css là lá', () => {
    expect(closure).toEqual([
      'node_modules/three/build/three.webgpu.js',
      'src/engine/flags.js',
      'src/lib/astro/lunar.js',
      'src/ui/badge.js',
      'src/ui/shell.css',
      'src/ui/shell.js',
      'three/webgpu',
    ]);
  });

  it('không đi theo import() động và không bao giờ đọc file trong node_modules', () => {
    expect(closure).not.toContain('src/engine/gpu/run.js');
    expect(asked).not.toContain('src/engine/gpu/run.js');
    expect(asked.some((f) => f.includes('node_modules'))).toBe(false);
    expect(asked.filter((f) => f === 'src/engine/flags.js')).toHaveLength(1);
  });
});

describe('listSrc', () => {
  it('trả file .js trong src/ (và plugins/), đường dẫn tính từ gốc repo, có sắp xếp', () => {
    const files = listSrc();
    expect(files.length).toBeGreaterThan(0);
    expect(files.every((f) => /^(src\/.+|plugins\/[^/]+)\.js$/.test(f))).toBe(true);
    expect([...files].sort()).toEqual(files);
    expect(listSrc(/^src\/engine\//)).toContain('src/engine/flags.js');
  });
});
