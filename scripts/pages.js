// scripts/pages.js — trình sinh trang (spec §19.7): viết trang HTML của mọi bức và Phòng tranh từ MỘT khuôn, đọc registry, meta và chữ giao diện. Chạy: npm run pages (rồi commit các file đổi).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, posix } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SITE, paintings } from '../src/paintings/registry.js';
import t from '../src/ui/strings.vi.js';

/** Trang Phòng tranh (GĐ 7, Task 10). */
export const GALLERY_PAGE = 'tranh/index.html';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
/** Thoát ký tự đặc biệt của HTML trong chữ và giá trị thuộc tính. */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const dirOf = (page) => page.replace(/index\.html$/, '');

/** Đường dẫn tương đối từ thư mục của trang `from` tới thư mục của trang `to` (như tests/paintings/html.test.js). */
export function relative(from, to) {
  const rel = posix.relative(dirOf(from) || '.', dirOf(to) || '.');
  return rel === '' ? './' : `${rel}/`;
}

/** Dải link dưới <h1>: bức trước, Phòng tranh, bức sau. Viết liền, không khoảng trắng: .series là flex có gap (shell.css). */
function seriesLinks(entry, list, strings) {
  const i = list.indexOf(entry);
  const [prev, next] = [list[i - 1], list[i + 1]];
  const links = [];
  if (prev) links.push(`<a rel="prev" href="${relative(entry.page, prev.page)}">${esc(strings.series.prev(prev.meta.no, prev.meta.title))}</a>`);
  links.push(`<a href="${relative(entry.page, GALLERY_PAGE)}">${esc(strings.series.gallery)}</a>`);
  if (next) links.push(`<a rel="next" href="${relative(entry.page, next.page)}">${esc(strings.series.next(next.meta.no, next.meta.title))}</a>`);
  return links.join('');
}

/**
 * Trang của một bức. Khuôn chép từ trang Bức 2; trang trên đĩa là MẪU: lệch byte nào thì sửa khuôn, không sửa trang.
 * @param {{ meta: object, page: string, lang: string }} entry  một dòng registry
 * @param {object[]} [list]   cả registry (để biết bức trước, bức sau)
 * @param {object} [strings]  chữ giao diện (strings.<lang>.js)
 */
export function renderPainting(entry, list = paintings, strings = t) {
  const { meta, page, lang } = entry;
  if (meta.poem.author) throw new Error(`scripts/pages.js: khuôn chưa in tác giả của thơ (${meta.slug}); thêm vào khuôn trước`);
  const title = esc(`${meta.title} · ${strings.site.name}`);
  const tagline = esc(meta.tagline);
  const poem = meta.poem.lines.map((line) => `            <p>${esc(line)}</p>`).join('\n');
  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${tagline}" />
    <meta name="theme-color" content="#0E0A08" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${tagline}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${SITE}${dirOf(page)}" />
    <meta property="og:image" content="${SITE}${meta.og}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="/src/styles/shell.css" />
  </head>
  <body data-painting="${meta.slug}" data-state="poster">
    <img
      class="poster"
      data-poster
      src="${meta.poster.src}"
      width="${meta.poster.width}"
      height="${meta.poster.height}"
      alt="${esc(meta.poster.alt)}"
      fetchpriority="high"
    />
    <div class="stage" data-stage></div>
    <main class="frame">
      <div class="top">
        <header>
          <small>${esc(strings.site.name)} · ${esc(strings.site.no(meta.no))}</small>
          <h1>${esc(meta.title)}</h1>
          <nav class="series" aria-label="${esc(strings.series.label)}">${seriesLinks(entry, list, strings)}</nav>
        </header>
        <div class="badge-box">
          <button data-badge hidden type="button" aria-expanded="false" aria-controls="badge-note"></button>
          <p id="badge-note" data-badge-note aria-live="polite"></p>
        </div>
      </div>
      <section data-static aria-live="polite"></section>
      <p class="hint" data-hint aria-live="polite"></p>
      <footer class="foot">
        <figure class="poem">
          <blockquote data-poem>
${poem}
          </blockquote>
          <figcaption><cite>${esc(meta.poem.source)}</cite></figcaption>
        </figure>
        <div class="marks">
          <svg data-moon viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true"></svg>
          <span class="dau" data-seal></span>
        </div>
      </footer>
    </main>
    <script type="module">
      import { boot } from '/src/engine/boot.js';
      import entry from '/src/paintings/${meta.slug}/index.js';
      import t from '/src/ui/strings.${lang}.js';
      boot(entry, { lang: '${lang}', t });
    </script>
  </body>
</html>
`;
}

/**
 * Phòng tranh: trang tĩnh, không script (chạy cả ở trình duyệt cũ của tầng tĩnh); mỗi bức một mục (poster, số, tên, câu giới thiệu),
 * theo thứ tự registry (meta.no). Poster có alt rỗng: tên bức đã là chữ của link.
 */
export function renderGallery(list = paintings, strings = t) {
  const items = list.map(({ meta, page }) => `        <li>
          <a href="${relative(GALLERY_PAGE, page)}">
            <img src="${meta.poster.src}" width="${meta.poster.width}" height="${meta.poster.height}" alt="" loading="lazy" />
            <span class="no">${esc(strings.site.no(meta.no))}</span>
            <span class="name">${esc(meta.title)}</span>
            <span class="line">${esc(meta.tagline)}</span>
          </a>
        </li>`).join('\n');
  const title = esc(`${strings.gallery.title} · ${strings.site.name}`);
  const intro = esc(strings.gallery.intro);
  return `<!doctype html>
<html lang="${list[0].lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${intro}" />
    <meta name="theme-color" content="#0E0A08" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${intro}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${SITE}${dirOf(GALLERY_PAGE)}" />
    <meta property="og:image" content="${SITE}${list[0].meta.og}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="/src/styles/gallery.css" />
  </head>
  <body class="gallery">
    <main>
      <header>
        <small>${esc(strings.site.name)}</small>
        <h1>${esc(strings.gallery.title)}</h1>
        <p>${intro}</p>
      </header>
      <ol class="works">
${items}
      </ol>
    </main>
  </body>
</html>
`;
}

/** Mọi trang sinh ra: [đường dẫn từ gốc repo, nội dung]; trang của các bức rồi Phòng tranh. */
export function allPages(list = paintings, strings = t) {
  return [...list.map((entry) => [entry.page, renderPainting(entry, list, strings)]), [GALLERY_PAGE, renderGallery(list, strings)]];
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  for (const [page, html] of allPages()) {
    mkdirSync(dirname(ROOT + page), { recursive: true });
    writeFileSync(ROOT + page, html);
    console.log(`đã viết ${page}`);
  }
}
