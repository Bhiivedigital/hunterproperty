// Generates dist/hunterproperty/browser/sitemap.xml from the CMS's published,
// indexable content — service categories, content pages, and the commercial
// service slugs — so the sitemap scales to hundreds of pages without anyone
// having to hand-maintain a URL list. Runs after `ng build` (see package.json).
//
// The URL set comes from scripts/lib/cms-routes.mjs, shared with
// generate-static-seo.mjs, so every URL listed here is also a URL that gets a
// real HTML file with its own self-referencing canonical. Static routes come
// from src/app/shared/seo/static-route-seo.json; only entries carrying a
// `sitemap` block are listed, which is how /home (canonical to /) and
// /not-found (noindex) stay out.
//
// Network/Strapi failures don't fail the build: if the CMS can't be reached
// (e.g. CI without CMS access, or STRAPI_URL not configured yet) the sitemap
// simply falls back to the static routes and a warning is printed.

import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  OUTPUT_DIR,
  SITE_URL,
  STRAPI_URL,
  isStrapiConfigured,
  collectCmsRoutes,
  readStaticRouteSeo,
  normalizePath
} from './lib/cms-routes.mjs';

function staticRoutes() {
  return Object.entries(readStaticRouteSeo())
    .filter(([, entry]) => entry.sitemap)
    .map(([path, entry]) => ({ path, ...entry.sitemap }));
}

function toXml(urls) {
  const entries = urls.map(u => {
    const lastmod = u.lastmod ? `\n    <lastmod>${u.lastmod.substring(0, 10)}</lastmod>` : '';
    return `  <url>
    <loc>${SITE_URL}${normalizePath(u.path)}</loc>${lastmod}
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
  let urls = staticRoutes();

  if (!isStrapiConfigured()) {
    console.warn('[sitemap] STRAPI_URL not configured — writing sitemap with static routes only.');
  } else {
    try {
      // Pages the CMS marks noIndex are already filtered out by collectCmsRoutes.
      urls = urls.concat(await collectCmsRoutes());
    } catch (err) {
      console.warn(`[sitemap] Could not reach Strapi at ${STRAPI_URL} (${err.message}) — writing sitemap with static routes only.`);
    }
  }

  if (!existsSync(OUTPUT_DIR)) {
    console.error(`[sitemap] Build output not found at ${OUTPUT_DIR}. Run "ng build" first.`);
    process.exitCode = 1;
    return;
  }

  writeFileSync(join(OUTPUT_DIR, 'sitemap.xml'), toXml(urls));
  console.log(`[sitemap] Wrote sitemap.xml with ${urls.length} URLs.`);
}

main();
