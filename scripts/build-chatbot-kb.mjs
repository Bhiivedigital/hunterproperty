// Writes public/chatbot/kb.json: what the homepage chatbot answers from.
//
//  - packages: every line of the four construction packages, read from the
//    homepage pricing section (src/app/components/homelayout/pricing), so the
//    bot quotes exactly what the site shows and follows any edit to it.
//  - faqs: the homepage FAQ plus every FAQ block on a guide or area page.
//  - pages: every category and guide, for "read more" suggestions.
//
// Runs before `ng build` (see package.json). The bot itself is in
// src/app/shared/chatbot; contact details, packages and areas it takes
// straight from src/app/shared/seo.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, STRAPI_URL } from './lib/cms-routes.mjs';

const OUT_DIR = join(ROOT, 'public', 'chatbot');
const PAGE_SIZE = 100;

const plain = html => String(html ?? '')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#64;/g, '@').replace(/&#8377;/g, '₹')
  .replace(/\s+/g, ' ')
  .trim();

async function get(path, params = {}) {
  const url = new URL(`/api/${path}`, STRAPI_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function getAll(path, params) {
  const out = [];
  for (let page = 1; ; page++) {
    const res = await get(path, { ...params, 'pagination[page]': String(page), 'pagination[pageSize]': String(PAGE_SIZE) });
    out.push(...res.data);
    if (page >= (res.meta?.pagination?.pageCount ?? 1)) return out;
  }
}

function readPackages() {
  const html = readFileSync(join(ROOT, 'src', 'app', 'components', 'homelayout', 'pricing', 'pricing.component.html'), 'utf-8');
  return html.split(/<div class="pricing-header">/).slice(1).map(block => {
    const name = plain(block.match(/<h5>([\s\S]*?)<\/h5>/)?.[1]);
    const price = Number(plain(block.match(/<strong>([\s\S]*?)<\/strong>/)?.[1]).replace(/[^\d]/g, ''));
    const sections = block.split(/<button class="accordion-button/).slice(1).map(section => ({
      title: plain(section.match(/>([\s\S]*?)<\/button>/)?.[1]),
      items: [...section.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => plain(m[1])).filter(Boolean)
    })).filter(s => s.title && s.items.length);
    return { name, price, sections };
  }).filter(p => p.name && p.price);
}

async function main() {
  const packages = readPackages();
  if (packages.length !== 4) throw new Error(`expected 4 packages in the pricing section, found ${packages.length}`);

  const faqs = [];
  const homeFaq = (await get('home-faq', { populate: '*' })).data;
  for (const item of homeFaq?.items ?? []) {
    faqs.push({ q: plain(item.question), a: plain(item.answer), url: '/' });
  }

  const categories = await getAll('service-content-categories', { 'fields[0]': 'name', 'fields[1]': 'slug', 'fields[2]': 'description' });
  const pages = categories.map(c => ({ title: `${c.name} services`, url: `/${c.slug}/`, text: plain(c.description).slice(0, 300) }));

  const guides = await getAll('service-content-pages', {
    'fields[0]': 'title', 'fields[1]': 'slug', 'fields[2]': 'excerpt',
    'populate[category][fields][0]': 'slug',
    'populate[seo][fields][0]': 'metaDescription',
    'populate[contentBlocks][on][blocks.faqs][populate]': 'items'
  });
  for (const g of guides) {
    if (!g.category?.slug) continue;
    const url = `/${g.category.slug}/${g.slug}/`;
    pages.push({ title: g.title, url, text: plain(g.seo?.metaDescription || g.excerpt).slice(0, 300) });
    for (const block of g.contentBlocks ?? []) {
      for (const item of block.items ?? []) faqs.push({ q: plain(item.question), a: plain(item.answer), url });
    }
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const kb = { generated: new Date().toISOString(), packages, faqs: faqs.filter(f => f.q && f.a), pages };
  writeFileSync(join(OUT_DIR, 'kb.json'), JSON.stringify(kb));
  console.log(`[chatbot] kb.json: ${packages.length} packages, ${kb.faqs.length} FAQs, ${pages.length} pages`);
}

main().catch(err => {
  console.error(`[chatbot] ${err.message}`);
  process.exitCode = 1;
});
