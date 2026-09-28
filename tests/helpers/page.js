// tests/helpers/page.js — dựng khung trang tối thiểu (đủ các ô mà xưởng điền vào) trong document của jsdom

// Cùng các ô mà tests/paintings/html.test.js bắt mọi trang phải có.
export const PAGE_BODY = `
  <img class="poster" data-poster src="/poster.svg" width="16" height="10" alt="">
  <div data-stage></div>
  <button data-badge hidden type="button" aria-expanded="false" aria-controls="badge-note"></button>
  <p id="badge-note" data-badge-note hidden aria-live="polite"></p>
  <span data-seal></span>
  <section data-static hidden aria-live="polite"></section>
  <svg data-moon viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true"></svg>
`;

/** Ghi đè body bằng khung trang mới; trả các phần tử để test đọc. */
export function mountPage(doc = document) {
  doc.body.innerHTML = PAGE_BODY;
  doc.body.dataset.state = 'poster';
  const $ = (sel) => doc.querySelector(sel);
  return {
    poster: $('[data-poster]'),
    stage: $('[data-stage]'),
    badge: $('[data-badge]'),
    badgeNote: $('[data-badge-note]'),
    seal: $('[data-seal]'),
    note: $('[data-static]'),
    moon: $('[data-moon]'),
  };
}
