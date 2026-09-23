/**
 * Builds www.hunterproperty.in's sitemap live from published CMS content, so a
 * new or edited guide shows up the moment it is published — no front-end
 * rebuild needed. /sitemap.xml on the main site redirects here (public/.htaccess).
 *
 * URL rules mirror scripts/lib/cms-routes.mjs in the Angular app (noIndex pages
 * skipped, guides without a category skipped, /services/:slug redirects left
 * out) so the sitemap only lists URLs that render a real indexable page.
 */

export const SITE_URL = 'https://www.hunterproperty.in';

type SitemapUrl = {
  path: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: string;
  lastmod?: string;
  images?: string[];
};

// Mirrors the indexable routes in src/app/shared/seo/static-route-seo.json.
// `hub` pages list the latest guides, so they are as fresh as the newest one;
// the rest get no lastmod rather than one claiming an edit that never happened.
const STATIC_ROUTES: (Omit<SitemapUrl, 'lastmod'> & { hub?: boolean })[] = [
  { path: '/', changefreq: 'daily', priority: '1.0', hub: true },
  { path: '/services', changefreq: 'daily', priority: '0.9', hub: true },
  { path: '/contactus', changefreq: 'daily', priority: '0.8' },
  { path: '/about', changefreq: 'daily', priority: '0.7' },
  { path: '/portfolio', changefreq: 'daily', priority: '0.7' },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms-and-conditions', changefreq: 'yearly', priority: '0.3' },
];

const CATEGORY_UID = 'api::service-content-category.service-content-category';
const PAGE_UID = 'api::service-content-page.service-content-page';
const PILLAR_UID = 'api::pillar-page.pillar-page';

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.endsWith('/') ? path : `${path}/`}`;
}

function newer(a?: string | Date | null, b?: string | null): boolean {
  return !!a && (!b || new Date(a) > new Date(b));
}

function iso(value?: string | Date | null) {
  return value ? new Date(value).toISOString() : undefined;
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);
}

function imageUrl(media: any): string | undefined {
  const url: string | undefined = media?.url;
  if (!url) return undefined;
  return url.startsWith('http') ? url : undefined;
}

async function collectCmsUrls(strapi: any): Promise<SitemapUrl[]> {
  const [categories, pillars, pages] = await Promise.all([
    strapi.documents(CATEGORY_UID).findMany({
      fields: ['slug', 'updatedAt'],
      populate: { seo: { fields: ['noIndex'] }, image: { fields: ['url'] } },
      limit: -1,
    }),
    strapi.documents(PILLAR_UID).findMany({
      status: 'published',
      fields: ['updatedAt'],
      populate: {
        seo: { fields: ['noIndex'] },
        category: { fields: ['slug'] },
        heroImage: { fields: ['url'] },
        featuredImage: { fields: ['url'] },
      },
      limit: -1,
    }),
    strapi.documents(PAGE_UID).findMany({
      status: 'published',
      fields: ['slug', 'updatedAt'],
      populate: {
        seo: { fields: ['noIndex'] },
        category: { fields: ['slug'] },
        coverImage: { fields: ['url'] },
      },
      limit: -1,
    }),
  ]);

  const pillarBySlug = new Map<string, any>(
    pillars.filter((p: any) => p.category?.slug).map((p: any) => [p.category.slug, p]),
  );

  const categoryUrls = new Map<string, SitemapUrl>();
  for (const category of categories) {
    const pillar = pillarBySlug.get(category.slug);
    const seo = pillar?.seo ?? category.seo;
    if (seo?.noIndex) continue;
    const lastmod = newer(pillar?.updatedAt, category.updatedAt) ? pillar.updatedAt : category.updatedAt;
    categoryUrls.set(category.slug, {
      path: `/${category.slug}`,
      changefreq: 'daily',
      priority: '0.9',
      lastmod: iso(lastmod),
      images: [imageUrl(pillar?.heroImage), imageUrl(pillar?.featuredImage), imageUrl(category.image)].filter(Boolean) as string[],
    });
  }

  const pageUrls: SitemapUrl[] = [];
  for (const page of pages) {
    if (page.seo?.noIndex) continue;
    const categorySlug = page.category?.slug;
    if (!categorySlug) continue;

    // The category page lists its guides, so a guide edit changes it too.
    const categoryUrl = categoryUrls.get(categorySlug);
    if (categoryUrl && newer(page.updatedAt, categoryUrl.lastmod)) categoryUrl.lastmod = iso(page.updatedAt);

    pageUrls.push({
      path: `/${categorySlug}/${page.slug}`,
      changefreq: 'daily',
      priority: '0.8',
      lastmod: iso(page.updatedAt),
      images: [imageUrl(page.coverImage)].filter(Boolean) as string[],
    });
  }

  return [...categoryUrls.values(), ...pageUrls];
}

// Highest priority first, then shallower paths, then alphabetical: home, hubs
// and pillar pages, guides, then supporting and legal pages.
function byPriority(a: SitemapUrl, b: SitemapUrl) {
  const depth = (p: string) => p.split('/').filter(Boolean).length;
  return Number(b.priority) - Number(a.priority) || depth(a.path) - depth(b.path) || a.path.localeCompare(b.path);
}

function toXml(urls: SitemapUrl[]) {
  const entries = urls.map(u => {
    const lines = [`    <loc>${escapeXml(absoluteUrl(u.path))}</loc>`];
    if (u.lastmod) lines.push(`    <lastmod>${u.lastmod.substring(0, 10)}</lastmod>`);
    lines.push(`    <changefreq>${u.changefreq}</changefreq>`, `    <priority>${u.priority}</priority>`);
    for (const image of new Set(u.images ?? [])) {
      lines.push(`    <image:image><image:loc>${escapeXml(image)}</image:loc></image:image>`);
    }
    return `  <url>\n${lines.join('\n')}\n  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>
`;
}

export default ({ strapi }: { strapi: any }) => ({
  async build(): Promise<string> {
    const cmsUrls = await collectCmsUrls(strapi);
    const latest = cmsUrls.reduce<string | undefined>((acc, u) => (newer(u.lastmod, acc) ? u.lastmod : acc), undefined);
    const staticUrls: SitemapUrl[] = STATIC_ROUTES.map(({ hub, ...u }) => (hub && latest ? { ...u, lastmod: latest } : u));
    return toXml([...staticUrls, ...cmsUrls].sort(byPriority));
  },
});
