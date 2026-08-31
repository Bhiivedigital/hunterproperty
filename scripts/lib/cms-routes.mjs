// Single source of truth for "which URLs does this site have, and what are
// their SEO tags" at build time. Consumed by generate-sitemap.mjs (to list
// them) and generate-static-seo.mjs (to stamp per-page <head> tags into the
// pre-rendered HTML), so a page can never appear in one and be missing from
// the other.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const ROOT = join(__dirname, '..', '..');
export const OUTPUT_DIR = join(ROOT, 'dist', 'hunterproperty', 'browser');
export const SITE_URL = 'https://www.hunterproperty.in';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/img/logo/logo.png`;

const PAGE_SIZE = 100;

export const STRAPI_URL = process.env['STRAPI_URL'] || readProdStrapiUrl();

function readProdStrapiUrl() {
  try {
    const contents = readFileSync(join(ROOT, 'src', 'environments', 'environment.prod.ts'), 'utf-8');
    const match = contents.match(/strapiUrl:\s*'([^']+)'/);
    return match ? match[1] : '';
  } catch {
    return '';
  }
}

export function isStrapiConfigured() {
  return !!STRAPI_URL && !STRAPI_URL.includes('REPLACE_WITH_PROD_STRAPI_URL');
}

/** The same table the Angular SeoService uses, so runtime and build-time tags match. */
export function readStaticRouteSeo() {
  return JSON.parse(readFileSync(join(ROOT, 'src', 'app', 'shared', 'seo', 'static-route-seo.json'), 'utf-8'));
}

/** Rich text flattened to prose, mirroring the Angular RichTextService. */
function toPlainText(raw) {
  if (!raw) return '';
  return raw
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizePath(path) {
  return path.endsWith('/') ? path : `${path}/`;
}

export function absoluteUrl(path) {
  return `${SITE_URL}${normalizePath(path)}`;
}

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

/**
 * Every CMS-backed route, with the title/description/canonical each page ends
 * up rendering. Titles mirror the components exactly (category-page,
 * content-detail) so the stamped HTML and the hydrated DOM agree.
 */
export async function collectCmsRoutes() {
  const routes = [];

  // Pillar pages carry their own SEO component and override the category's for
  // /:categorySlug. A CMS that predates the collection answers 403/404, which
  // is the same outcome as "no pillar pages yet": fall back to the category.
  let pillarBySlug = new Map();
  try {
    const pillars = await fetchAllPages('pillar-pages', { 'populate[seo]': 'true', 'populate[category]': 'true' });
    pillarBySlug = new Map(pillars.filter(p => p.category?.slug).map(p => [p.category.slug, p]));
  } catch {
    pillarBySlug = new Map();
  }

  const categories = await fetchAllPages('service-content-categories', {
    'populate[seo]': 'true',
    'fields[0]': 'slug',
    'fields[1]': 'name',
    'fields[2]': 'description',
    'fields[3]': 'updatedAt'
  });

  for (const category of categories) {
    const pillar = pillarBySlug.get(category.slug);
    const seo = pillar?.seo ?? category.seo;
    if (seo?.noIndex) continue;
    routes.push({
      path: `/${category.slug}`,
      lastmod: pillar?.updatedAt || category.updatedAt,
      changefreq: 'weekly',
      priority: '0.7',
      title: seo?.metaTitle || `${category.name} Guides | Hunter Property`,
      description: seo?.metaDescription
        || toPlainText(pillar?.intro)
        || toPlainText(category.description)
        || `${category.name} guides and resources from Hunter Property.`,
      canonical: seo?.canonicalUrl || null
    });
  }

  // /services/:slug is no longer a page — it redirects to the category's
  // pillar page at /:slug, which is already emitted above. Listing a redirect
  // in the sitemap tells search engines to index a URL that answers 301, so
  // these routes are deliberately absent.

  const pages = await fetchAllPages('service-content-pages', {
    'populate[seo]': 'true',
    'populate[category]': 'true',
    'fields[0]': 'slug',
    'fields[1]': 'title',
    'fields[2]': 'excerpt',
    'fields[3]': 'updatedAt'
  });

  for (const page of pages) {
    if (page.seo?.noIndex) continue;
    if (!page.category?.slug) continue;
    routes.push({
      path: `/${page.category.slug}/${page.slug}`,
      lastmod: page.updatedAt,
      changefreq: 'monthly',
      priority: '0.6',
      title: page.seo?.metaTitle || `${page.title} | Hunter Property`,
      description: page.seo?.metaDescription || page.excerpt || page.title,
      canonical: page.seo?.canonicalUrl || null,
      ogType: 'article'
    });
  }

  return routes;
}
