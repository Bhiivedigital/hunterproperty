/**
 * IndexNow: tells Bing, Yandex, Seznam and Naver the moment a guide, pillar
 * page or category is published, unpublished or deleted, instead of waiting
 * for their next crawl. (Google does not take IndexNow; it picks changes up
 * from the live sitemap's lastmod.)
 *
 * The key must match public/<key>.txt on www.hunterproperty.in — that file is
 * how IndexNow verifies we own the host. The key is not a secret.
 */
import type { Core } from '@strapi/strapi';
import { SITE_URL, absoluteUrl } from './api/sitemap/services/sitemap';

const INDEXNOW_KEY = '85e0be6e46c92c8ccb03f29536afe04e';
const HOST = new URL(SITE_URL).host;

const CATEGORY_UID = 'api::service-content-category.service-content-category';
const PAGE_UID = 'api::service-content-page.service-content-page';
const PILLAR_UID = 'api::pillar-page.pillar-page';

// Pages/pillars use Draft & Publish, so only publish-state changes are public.
// Categories have no drafts, so every save is live.
const WATCHED: Record<string, string[]> = {
  [PAGE_UID]: ['publish', 'unpublish', 'delete'],
  [PILLAR_UID]: ['publish', 'unpublish', 'delete'],
  [CATEGORY_UID]: ['create', 'update', 'delete'],
};

function isEnabled() {
  return process.env.NODE_ENV === 'production' && process.env.INDEXNOW_ENABLED !== 'false';
}

/** Public URLs affected by a change to this document (read before deletes). */
async function affectedUrls(strapi: Core.Strapi, uid: string, documentId: string): Promise<string[]> {
  if (uid === PAGE_UID) {
    const page: any = await strapi.documents(PAGE_UID).findOne({
      documentId,
      fields: ['slug'],
      populate: { category: { fields: ['slug'] } },
    });
    const categorySlug = page?.category?.slug;
    if (!page?.slug || !categorySlug) return [];
    // The category page lists its guides, so it changes too.
    return [absoluteUrl(`/${categorySlug}/${page.slug}`), absoluteUrl(`/${categorySlug}`)];
  }
  if (uid === PILLAR_UID) {
    const pillar: any = await strapi.documents(PILLAR_UID).findOne({
      documentId,
      populate: { category: { fields: ['slug'] } },
    });
    return pillar?.category?.slug ? [absoluteUrl(`/${pillar.category.slug}`)] : [];
  }
  const category: any = await strapi.documents(CATEGORY_UID).findOne({ documentId, fields: ['slug'] });
  return category?.slug ? [absoluteUrl(`/${category.slug}`)] : [];
}

async function submit(strapi: Core.Strapi, urlList: string[]) {
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`, urlList }),
    });
    // 200 = accepted, 202 = accepted pending key verification.
    if (res.ok) strapi.log.info(`[indexnow] Submitted ${urlList.join(', ')} (${res.status})`);
    else strapi.log.warn(`[indexnow] Submission rejected (${res.status}): ${await res.text()}`);
  } catch (err: any) {
    strapi.log.warn(`[indexnow] Submission failed: ${err.message}`);
  }
}

export function registerIndexNow(strapi: Core.Strapi) {
  strapi.documents.use(async (context: any, next) => {
    const actions = WATCHED[context.uid];
    if (!actions?.includes(context.action) || !isEnabled()) return next();

    // Deletes lose the slug, so resolve URLs first; otherwise after the write
    // so a slug changed in this save is the one submitted.
    const before = context.action === 'delete' && context.params?.documentId
      ? await affectedUrls(strapi, context.uid, context.params.documentId).catch(() => [])
      : [];

    const result: any = await next();

    const documentId = context.params?.documentId ?? result?.documentId;
    const after = context.action !== 'delete' && documentId
      ? await affectedUrls(strapi, context.uid, documentId).catch(() => [])
      : [];

    const urls = [...new Set([...before, ...after])];
    // Fire and forget: never slow down or fail the editor's save.
    if (urls.length) void submit(strapi, urls);
    return result;
  });
}
