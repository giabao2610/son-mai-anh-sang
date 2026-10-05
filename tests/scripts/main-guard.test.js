// tests/scripts/main-guard.test.js — script chạy trực tiếp (npm run pages, node scripts/e2e-groups.js, node scripts/poster.js) nhận ra mình là module chính bằng import.meta.main: so import.meta.url với process.argv[1] thì lệch khi gọi thiếu đuôi .js hay qua symlink, và script lặng lẽ không làm gì mà vẫn thoát 0.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const scripts = readdirSync(`${ROOT}scripts`).filter((f) => f.endsWith('.js'));

describe('scripts/*.js nhận ra mình được chạy trực tiếp', () => {
  it.each(scripts)('%s không so import.meta.url với process.argv[1] (dùng import.meta.main)', (file) => {
    const src = readFileSync(`${ROOT}scripts/${file}`, 'utf8');
    expect(src).not.toMatch(/pathToFileURL\(process\.argv/);
    if (/console\.log|writeFileSync/.test(src)) expect(src).toMatch(/if \(import\.meta\.main\)/);
  });

  it('gọi thiếu đuôi .js (node scripts/e2e-groups) vẫn in ma trận nhóm, không lặng lẽ thoát', () => {
    const out = execFileSync(process.execPath, ['scripts/e2e-groups'], { cwd: ROOT, encoding: 'utf8' });
    expect(out).toMatch(/^groups=\[/);
  });
});
