// Writes the area pages in cms/content/locations/*.json to the CMS.
//
//   node scripts/import-locations.mjs            dry run: prints what would change
//   STRAPI_TOKEN=... node scripts/import-locations.mjs --apply
//
// Goes through the public REST API with an API token, against whichever CMS
// STRAPI_URL points at (default: production). It never starts a local Strapi
// against the production database.
//
// "create" files become new, published pages in their category. "update" files
// change only the fields they carry on the page with that slug. Both publish,
// which fires the IndexNow ping in src/indexnow.ts for each URL. The FAQs go in
// as a `blocks.faqs` block below the article, replacing any previous FAQ block;
// the editor's HTML comment notes at the top of an existing body are removed.
//
// Note the front end is prerendered: a page published here is served by the
// SPA fallback until the next `npm run build` and upload.

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, '..', 'content', 'locations');
const STRAPI_URL = (process.env.STRAPI_URL || 'https://cms.hunterproperty.in').replace(/\/$/, '');
const TOKEN = process.env.STRAPI_TOKEN;
const APPLY = process.argv.includes('--apply');
const ONLY = process.argv.find(arg => arg.startsWith('--only='))?.slice('--only='.length).split(',');
const DEFAULT_CATEGORY = 'home-construction';
const PAGES = 'service-content-pages';
const HTML_COMMENT_RE = /<!--[\s\S]*?-->\s*/g;

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${STRAPI_URL}/api/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${json?.error?.message ?? ''}`);
  return json;
}

const categoryIds = new Map();
async function categoryDocumentId(slug) {
  if (!categoryIds.has(slug)) {
    const res = await api(`service-content-categories?filters[slug][$eq]=${encodeURIComponent(slug)}&fields[0]=slug`);
    if (!res.data[0]) throw new Error(`category "${slug}" not found`);
    categoryIds.set(slug, res.data[0].documentId);
  }
  return categoryIds.get(slug);
}

async function findPage(slug) {
  const res = await api(`${PAGES}?filters[slug][$eq]=${encodeURIComponent(slug)}`
    + '&populate[seo][populate]=*&populate[contentBlocks][populate]=*&populate[category][fields][0]=slug');
  return res.data[0];
}

function faqBlock(file) {
  return {
    __component: 'blocks.faqs',
    title: file.faqTitle || 'Frequently asked questions',
    items: file.faqs.map(({ question, answer }) => ({ question, answer }))
  };
}

// The REST response carries ids and populated relations the write API won't take back.
function seoForWrite(existing, changes) {
  const { id, ogImage, ...fields } = existing ?? {};
  return { ...fields, ...(ogImage?.id ? { ogImage: ogImage.id } : {}), ...changes };
}

function validate(file, name) {
  const problems = [];
  if (!file.slug) problems.push('missing slug');
  if (!['create', 'update'].includes(file.mode)) problems.push('mode must be create or update');
  if (file.mode === 'create' && (!file.title || !file.content)) problems.push('create needs title and content');
  if (file.seo?.metaTitle && file.seo.metaTitle.length > 70) problems.push(`metaTitle is ${file.seo.metaTitle.length} chars`);
  if (file.seo?.metaDescription && file.seo.metaDescription.length > 170) problems.push(`metaDescription is ${file.seo.metaDescription.length} chars`);
  if (file.content && /<h1\b/i.test(file.content)) problems.push('content has an <h1>; the title is the page H1');
  if (problems.length) throw new Error(`${name}: ${problems.join('; ')}`);
}

async function plan(file) {
  const existing = await findPage(file.slug);
  const category = file.category || DEFAULT_CATEGORY;

  if (file.mode === 'create') {
    if (existing) return { action: 'skip', reason: 'already exists', file };
    const data = {
      title: file.title,
      slug: file.slug,
      excerpt: file.excerpt,
      content: file.content,
      category: await categoryDocumentId(category),
      seo: { metaTitle: file.seo?.metaTitle, metaDescription: file.seo?.metaDescription, noIndex: false },
      contentBlocks: file.faqs?.length ? [faqBlock(file)] : [],
      contentBlocksPosition: 'below-content'
    };
    return { action: 'create', file, data };
  }

  if (!existing) return { action: 'error', reason: 'page not found', file };
  if (existing.category?.slug && existing.category.slug !== category) {
    return { action: 'error', reason: `page is in "${existing.category.slug}", file says "${category}"`, file };
  }

  const step = { action: 'update', file, existing, data: {}, notes: [] };
  const data = step.data;
  if (file.title) data.title = file.title;
  if (file.excerpt) data.excerpt = file.excerpt;
  if (file.seo) data.seo = seoForWrite(existing.seo, file.seo);
  const body = file.content ?? existing.content ?? '';
  const cleaned = body.replace(HTML_COMMENT_RE, '');
  if (file.content || cleaned !== existing.content) data.content = cleaned;
  // Older articles carry their own FAQ section (and FAQPage JSON-LD) in the
  // body; a second FAQ block would repeat it and give the page two FAQPage
  // entities, which Google flags.
  const bodyHasFaqs = /FAQPage|<h2[^>]*>s*(FAQs?|Frequently Asked)/i.test(cleaned);
  if (file.faqs?.length && bodyHasFaqs) step.notes.push('body already has FAQs; new FAQ block skipped');
  if (file.faqs?.length && !bodyHasFaqs) {
    const others = (existing.contentBlocks ?? []).filter(block => block.__component !== 'blocks.faqs');
    if (others.length) {
      // Re-sending other blocks would need their media ids; leave those pages to an editor.
      return { action: 'error', reason: `has ${others.length} other content block(s); add the FAQs in the CMS`, file };
    }
    data.contentBlocks = [faqBlock(file)];
    data.contentBlocksPosition = 'below-content';
  }
  return step;
}

function describe(step) {
  const { action, file, existing, data, reason } = step;

  const lines = [`${action.toUpperCase().padEnd(6)} /${file.category || DEFAULT_CATEGORY}/${file.slug}/${reason ? `  (${reason})` : ''}`];
  if (data?.title && data.title !== existing?.title) lines.push(`         title: ${existing?.title ? `"${existing.title}" -> ` : ''}"${data.title}"`);
  if (data?.seo?.metaTitle && data.seo.metaTitle !== existing?.seo?.metaTitle) {
    lines.push(`         <title>: ${existing?.seo?.metaTitle ? `"${existing.seo.metaTitle}" -> ` : ''}"${data.seo.metaTitle}"`);
  }
  if (data?.content !== undefined) {
    const words = data.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    lines.push(`         body: ${action === 'update' && !file.content ? 'existing article, editor notes removed' : `${words} words`}`);
  }
  if (data?.contentBlocks?.length) lines.push(`         faqs: ${data.contentBlocks[0].items.length}`);
  (step.notes ?? []).forEach(note => lines.push(`         note: ${note}`));
  return lines.join('\n');
}

async function main() {
  if (APPLY && !TOKEN) throw new Error('--apply needs STRAPI_TOKEN (a Strapi API token with write access)');

  const files = readdirSync(CONTENT_DIR)
    .filter(name => name.endsWith('.json'))
    .map(name => ({ name, file: JSON.parse(readFileSync(join(CONTENT_DIR, name), 'utf-8')) }))
    .filter(({ file }) => !ONLY || ONLY.includes(file.slug));
  files.forEach(({ name, file }) => validate(file, name));

  console.log(`${APPLY ? 'Applying' : 'Dry run'}: ${files.length} file(s) against ${STRAPI_URL}\n`);
  const steps = [];
  for (const { file } of files) steps.push(await plan(file));
  // Updates first: they only touch live pages. Creates last.
  steps.sort((a, b) => ['error', 'skip', 'update', 'create'].indexOf(a.action) - ['error', 'skip', 'update', 'create'].indexOf(b.action));
  steps.forEach(step => console.log(describe(step)));

  const counts = steps.reduce((acc, s) => ({ ...acc, [s.action]: (acc[s.action] ?? 0) + 1 }), {});
  console.log(`\n${JSON.stringify(counts)}`);
  if (!APPLY) {
    console.log('\nNothing written. Re-run with --apply and STRAPI_TOKEN to publish.');
    return;
  }

  let failed = 0;
  for (const step of steps) {
    try {
      if (step.action === 'create') {
        await api(`${PAGES}?status=published`, { method: 'POST', body: { data: step.data } });
      } else if (step.action === 'update') {
        await api(`${PAGES}/${step.existing.documentId}?status=published`, { method: 'PUT', body: { data: step.data } });
      } else {
        continue;
      }
      console.log(`done   ${step.file.slug}`);
    } catch (err) {
      failed++;
      console.error(`FAILED ${step.file.slug}: ${err.message}`);
    }
  }
  if (failed) process.exitCode = 1;
}

main().catch(err => {
  console.error(err.message);
  process.exitCode = 1;
});
