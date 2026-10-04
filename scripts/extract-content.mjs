/**
 * One-off content extraction script (Phase 2 tooling — not part of the production build).
 *
 * Reads the saved HTML snapshots in `inventory/html/` and emits a structured,
 * DOM-ordered outline per page into `scripts/extracted/`:
 *   - headings, text blocks, paragraphs, list items, links, images, iframes
 *   - page meta (title, description, canonical, lang)
 *
 * The output is a working aid for authoring `src/content/pages/**` entries.
 * Copy stays verbatim in the authored entries; this script never rewrites text.
 *
 * Usage: npm run extract
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const HTML_DIR = join(ROOT, 'inventory', 'html');
const OUT_DIR = join(__dirname, 'extracted');

/** Read a text file and strip a UTF-8 BOM (the crawl output has one). */
const readText = (path) => readFileSync(path, 'utf8').replace(/^\uFEFF/, '');

const pages = JSON.parse(readText(join(ROOT, 'inventory', 'pages.json')));

/** Reproduce the crawler's URL -> filename transform. */
function urlToFilename(url) {
  const u = new URL(url);
  let path = u.pathname;
  if (path === '/') return 'www_tampabayfamilyclinics_com_.html';
  const slug = path.replace(/^\//, '').replace(/\/$/, '');
  return `www_tampabayfamilyclinics_com_${slug.replace(/\//g, '_').replace(/-/g, '_')}_.html`;
}

const normalize = (s) =>
  (s || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200b\u200c\u200d\ufeff]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

function collect($) {
  const nodes = [];

  const emit = (node) => nodes.push(node);

  const walk = (el) => {
    const $el = $(el);
    const tag = el.tagName?.toLowerCase?.() || el.name?.toLowerCase?.();

    if (!tag) return;
    if (['script', 'style', 'noscript', 'template', 'svg', 'iframe'].includes(tag)) {
      if (tag === 'iframe') {
        const src = $el.attr('src');
        if (src && !src.includes('challenges.cloudflare.com')) emit({ kind: 'iframe', src });
      }
      return;
    }

    if (tag === 'header' || tag === 'footer') return;

    // Skip known form implementations (handled separately by the Form component).
    const cls = $el.attr('class') || '';
    if (
      cls.includes('fluentform') ||
      cls.includes('wpcf7') ||
      cls.includes('ff-el') ||
      cls.includes('oxy-sticky-header')
    ) {
      return;
    }

    // Headings
    if (/^h[1-6]$/.test(tag)) {
      const text = normalize($el.text());
      if (text) emit({ kind: 'heading', level: Number(tag[1]), text });
      return;
    }

    // Oxygen text blocks / paragraphs
    if (tag === 'div' && cls.includes('ct-text-block')) {
      const text = normalize($el.text());
      if (text) emit({ kind: 'text', text });
      return;
    }
    if (tag === 'p' && !cls.includes('ct-text-block')) {
      const text = normalize($el.text());
      if (text) emit({ kind: 'paragraph', text });
      return;
    }

    // Oxygen links (emit their label + href, then collect any nested media —
    // card links wrap their image inside the anchor, e.g. provider photos).
    if (tag === 'a' && cls.includes('ct-link')) {
      const href = $el.attr('href');
      const text = normalize($el.text());
      if (href || text) emit({ kind: 'link', href: href || '', text });
      $el.find('img').each((_, img) => {
        const src = $(img).attr('src') || '';
        if (src && !src.startsWith('data:')) {
          emit({
            kind: 'image',
            src,
            alt: $(img).attr('alt') || '',
            width: $(img).attr('width') || '',
            height: $(img).attr('height') || '',
          });
        }
      });
      return;
    }

    // List items (only when not already inside a collected text block)
    if (tag === 'li') {
      const text = normalize($el.text());
      if (text) emit({ kind: 'listItem', text });
      return;
    }

    if (tag === 'blockquote') {
      const text = normalize($el.text());
      if (text) emit({ kind: 'quote', text });
      return;
    }

    if (tag === 'img') {
      const src = $el.attr('src') || '';
      if (src && !src.startsWith('data:')) {
        emit({
          kind: 'image',
          src,
          alt: $el.attr('alt') || '',
          width: $el.attr('width') || '',
          height: $el.attr('height') || '',
        });
      }
      return;
    }

    // Containers: recurse
    $el.children().each((_, child) => walk(child));
  };

  $('body').children().each((_, child) => walk(child));
  return nodes;
}

mkdirSync(OUT_DIR, { recursive: true });

const index = [];
let failures = 0;

for (const page of pages) {
  const file = urlToFilename(page.url);
  let html;
  try {
    html = readText(join(HTML_DIR, file));
  } catch {
    console.error(`MISSING snapshot for ${page.url} (expected ${file})`);
    failures++;
    continue;
  }

  const $ = load(html);
  const lang = $('html').attr('lang') || (new URL(page.url).pathname.startsWith('/es/') ? 'es' : 'en');
  const title = normalize($('head title').first().text());
  const description = normalize($('head meta[name="description"]').attr('content') || '');
  const canonical = $('head link[rel="canonical"]').attr('href') || '';

  const outline = collect($);

  const slug = new URL(page.url).pathname.replace(/^\//, '').replace(/\/$/, '');
  const base = slug === '' ? 'home' : slug.replace(/^es\//, '').replace(/\//g, '__');
  const outFile = `${lang}__${base}.json`;
  writeFileSync(
    join(OUT_DIR, outFile),
    JSON.stringify({ url: page.url, lang, title, description, canonical, outline }, null, 2),
    'utf8'
  );

  index.push({
    url: page.url,
    lang,
    title,
    description,
    file: outFile,
    nodes: outline.length,
    headings: outline.filter((n) => n.kind === 'heading').length,
    images: outline.filter((n) => n.kind === 'image').length,
  });
}

writeFileSync(join(OUT_DIR, '_index.json'), JSON.stringify(index, null, 2), 'utf8');

console.log(`Extracted ${index.length} pages into scripts/extracted/`);
if (failures) console.error(`${failures} snapshot(s) missing.`);
