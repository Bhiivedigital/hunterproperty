// Writes prerender-routes.txt: every URL `ng build` should render to static
// HTML (angular.json -> prerender.routesFile).
//
// Same URL rules as the live CMS sitemap (scripts/lib/cms-routes.mjs mirrors
// cms/src/api/sitemap), so every URL the sitemap lists gets a fully rendered
// page — real headings and body text in the HTML Googlebot downloads, not an
// empty app shell waiting on JavaScript.
//
// Skipped on purpose:
//  - /home duplicates / and is 301'd there by .htaccess;
//  - /not-found is only ever reached through the SPA fallback (spa.html).

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, STRAPI_URL, isStrapiConfigured, collectCmsRoutes, readStaticRouteSeo } from './lib/cms-routes.mjs';

const SKIP = new Set(['/home', '/not-found']);

async function main() {
  const routes = Object.keys(readStaticRouteSeo()).filter(path => !SKIP.has(path));

  if (!isStrapiConfigured()) {
    throw new Error('STRAPI_URL is not configured; refusing to prerender without CMS pages.');
  }

  // Unlike the old head-only stamper, a CMS outage fails the build: shipping
  // a deploy that silently lost every guide page would be worse than no deploy.
  const cmsRoutes = await collectCmsRoutes();
  for (const route of cmsRoutes) routes.push(route.path);

  const unique = [...new Set(routes)];
  writeFileSync(join(ROOT, 'prerender-routes.txt'), unique.join('\n') + '\n');
  console.log(`[prerender] ${unique.length} routes from ${STRAPI_URL} written to prerender-routes.txt`);
}

main().catch(err => {
  console.error(`[prerender] ${err.message}`);
  process.exitCode = 1;
});
