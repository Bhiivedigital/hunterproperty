// Turns the single-file SPA build into one real HTML file per URL.
//
// The app is client-rendered: Apache hands every deep link the same
// dist/.../index.html, whose <head> hard-codes the homepage canonical. Anything
// that reads the raw response instead of executing Angular — view-source,
// social scrapers, and Googlebot's first (pre-render) pass — therefore saw
// <link rel="canonical" href="https://www.hunterproperty.in/"> on /interior-design/,
// /about/, and every other page, which is what Search Console reported as
// duplicate/alternate-canonical.
//
// So after `ng build`, copy the built index.html to dist/.../<route>/index.html
// with that page's own <title>, description, canonical and OG/Twitter tags
// stamped in. mod_dir then serves those directly (see public/.htaccess) and the
// SPA fallback only handles URLs that aren't real pages. <base href="/"> in
// index.html keeps every asset URL resolving from the site root, so the copies
// boot the same app from any depth.
//
// Metadata comes from scripts/lib/cms-routes.mjs — the same source the sitemap
// uses — so the stamped tags match what SeoService sets once Angular hydrates.

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  OUTPUT_DIR,
  DEFAULT_OG_IMAGE,
  STRAPI_URL,
  isStrapiConfigured,
  collectCmsRoutes,
  readStaticRouteSeo,
  absoluteUrl,
  normalizePath
} from './lib/cms-routes.mjs';

function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeText(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Replaces the first tag matching `pattern`, or inserts `tag` before </head>
// when the template doesn't already carry one.
function upsert(html, pattern, tag) {
  if (pattern.test(html)) return html.replace(pattern, () => tag);
  return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function metaByName(name) {
  return new RegExp(String.raw`<meta[^>]*\bname=["']` + name + String.raw`["'][^>]*>`, 'i');
}

function metaByProperty(property) {
  return new RegExp(String.raw`<meta[^>]*\bproperty=["']` + property + String.raw`["'][^>]*>`, 'i');
}

function stamp(template, route) {
  const canonical = route.canonical || absoluteUrl(route.path);
  const title = escapeText(route.title);
  const titleAttr = escapeAttr(route.title);
  const description = escapeAttr(route.description);
  const image = escapeAttr(route.image || DEFAULT_OG_IMAGE);
  const url = escapeAttr(canonical);

  let html = template;
  html = upsert(html, /<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  html = upsert(html, metaByName('description'), `<meta name="description" content="${description}">`);
  html = upsert(html, /<link[^>]*\brel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${url}">`);
  html = upsert(html, metaByProperty('og:url'), `<meta property="og:url" content="${url}">`);
  html = upsert(html, metaByProperty('og:title'), `<meta property="og:title" content="${titleAttr}">`);
  html = upsert(html, metaByProperty('og:description'), `<meta property="og:description" content="${description}">`);
  html = upsert(html, metaByProperty('og:type'), `<meta property="og:type" content="${route.ogType || 'website'}">`);
  html = upsert(html, metaByProperty('og:image'), `<meta property="og:image" content="${image}">`);
  html = upsert(html, metaByName('twitter:card'), `<meta name="twitter:card" content="summary_large_image">`);
  html = upsert(html, metaByName('twitter:title'), `<meta name="twitter:title" content="${titleAttr}">`);
  html = upsert(html, metaByName('twitter:description'), `<meta name="twitter:description" content="${description}">`);
  html = upsert(html, metaByName('twitter:image'), `<meta name="twitter:image" content="${image}">`);
  html = upsert(
    html,
    metaByName('robots'),
    `<meta name="robots" content="${route.noIndex ? 'noindex, follow' : 'index, follow'}">`
  );
  return html;
}

function staticRoutes() {
  const table = readStaticRouteSeo();
  return Object.entries(table).map(([path, entry]) => ({
    path,
    title: entry.title,
    description: entry.description,
    canonical: entry.canonical ? absoluteUrl(entry.canonical) : null,
    noIndex: !!entry.noIndex
  }));
}

function targetFor(path) {
  const segments = normalizePath(path).split('/').filter(Boolean);
  return join(OUTPUT_DIR, ...segments, 'index.html');
}

async function main() {
  const templatePath = join(OUTPUT_DIR, 'index.html');
  if (!existsSync(templatePath)) {
    console.error(`[static-seo] Build output not found at ${templatePath}. Run "ng build" first.`);
    process.exitCode = 1;
    return;
  }

  const template = readFileSync(templatePath, 'utf-8');

  let routes = staticRoutes();
  if (!isStrapiConfigured()) {
    console.warn('[static-seo] STRAPI_URL not configured — stamping static routes only.');
  } else {
    try {
      routes = routes.concat(await collectCmsRoutes());
    } catch (err) {
      // A CMS outage must not fail the build; the SPA fallback still serves
      // those URLs, just without pre-stamped tags.
      console.warn(`[static-seo] Could not reach Strapi at ${STRAPI_URL} (${err.message}) — stamping static routes only.`);
    }
  }

  const written = new Set();
  for (const route of routes) {
    const target = targetFor(route.path);
    if (written.has(target)) {
      console.warn(`[static-seo] Duplicate route ${route.path} — keeping the first one.`);
      continue;
    }
    mkdirSync(join(target, '..'), { recursive: true });
    writeFileSync(target, stamp(template, route));
    written.add(target);
  }

  console.log(`[static-seo] Stamped ${written.size} pages with self-referencing canonicals.`);
}

main();
