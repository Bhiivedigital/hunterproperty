// Generates dist/hunterproperty/browser/sitemap.xml from the CMS's published,
// indexable content — service categories, content pages, and the commercial
// service slugs — so the sitemap scales to hundreds of pages without anyone
// having to hand-maintain a URL list. Runs after `ng build` (see package.json).
//
// Network/Strapi failures don't fail the build: if the CMS can't be reached
// (e.g. CI without CMS access, or STRAPI_URL not configured yet) the sitemap
// simply falls back to the static routes and a warning is printed.

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(ROOT, 'dist', 'hunterproperty', 'browser');
const SITE_URL = 'https://www.hunterproperty.in';
const PAGE_SIZE = 100;

const STRAPI_URL = process.env['STRAPI_URL'] || readProdStrapiUrl();

function readProdStrapiUrl() {
  try {
    const contents = readFileSync(join(ROOT, 'src', 'environments', 'environment.prod.ts'), 'utf-8');
    const match = contents.match(/strapiUrl:\s*'([^']+)'/);
    return match ? match[1] : '';
  } catch {
    return '';
  }
}

const STATIC_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/services', changefreq: 'monthly', priority: '0.8' },
  { path: '/portfolio', changefreq: 'monthly', priority: '0.6' },
  { path: '/contactus', changefreq: 'monthly', priority: '0.5' },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.2' },
  { path: '/terms-and-conditions', changefreq: 'yearly', priority: '0.2' }
];

async function fetchJson(path, params = {}) {
  const url = new URL(`/api/${path}`, STRAPI_URL);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Strapi request failed: ${url} -> ${res.status}`);
  return res.json();
}

async function fetchAllPages(endpoint, params) {
  const items = [];
  let page = 1;
  while (true) {
    const res = await fetchJson(endpoint, { ...params, 'pagination[page]': String(page), 'pagination[pageSize]': String(PAGE_SIZE) });
    items.push(...res.data);
    const pageCount = res.meta?.pagination?.pageCount ?? 1;
    if (page >= pageCount) break;
    page++;
  }
  return items;
}

async function collectCmsUrls() {
  const urls = [];

  const categories = await fetchAllPages('service-content-categories', {
    'populate[seo]': 'true',
    'fields[0]': 'slug',
    'fields[1]': 'updatedAt'
  });
  for (const category of categories) {
    if (category.seo?.noIndex) continue;
    urls.push({ path: `/${category.slug}`, lastmod: category.updatedAt, changefreq: 'weekly', priority: '0.7' });
    urls.push({ path: `/services/${category.slug}`, changefreq: 'monthly', priority: '0.7' });
  }

  const pages = await fetchAllPages('service-content-pages', {
    'populate[seo]': 'true',
    'populate[category]': 'true',
    'fields[0]': 'slug',
    'fields[1]': 'updatedAt'
  });
  for (const page of pages) {
    if (page.seo?.noIndex) continue;
    if (!page.category?.slug) continue;
    urls.push({ path: `/${page.category.slug}/${page.slug}`, lastmod: page.updatedAt, changefreq: 'monthly', priority: '0.6' });
  }

  return urls;
}

function toXml(urls) {
  const entries = urls.map(u => {
    const lastmod = u.lastmod ? `\n    <lastmod>${u.lastmod.substring(0, 10)}</lastmod>` : '';
    return `  <url>
    <loc>${SITE_URL}${u.path}</loc>${lastmod}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

async function main() {
  let urls = [...STATIC_ROUTES];

  if (!STRAPI_URL || STRAPI_URL.includes('REPLACE_WITH_PROD_STRAPI_URL')) {
    console.warn('[sitemap] STRAPI_URL not configured — writing sitemap with static routes only.');
  } else {
    try {
      urls = urls.concat(await collectCmsUrls());
    } catch (err) {
      console.warn(`[sitemap] Could not reach Strapi at ${STRAPI_URL} (${err.message}) — writing sitemap with static routes only.`);
    }
  }

  if (!existsSync(OUTPUT_DIR)) {
    console.warn(`[sitemap] Build output not found at ${OUTPUT_DIR} — skipping. Run "ng build" first.`);
    return;
  }

  writeFileSync(join(OUTPUT_DIR, 'sitemap.xml'), toXml(urls));
  console.log(`[sitemap] Wrote sitemap.xml with ${urls.length} URLs.`);
}

main();
