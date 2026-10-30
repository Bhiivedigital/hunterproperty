// Runs after `ng build` has prerendered every route (see write-prerender-routes.mjs).
//
//  1. Font Awesome subset. The theme ships the whole Font Awesome Pro kit:
//     ~1.2 MB of icon fonts and ~500 KB of CSS rules on every page, for the
//     ~90 icons the site actually shows. The prerendered HTML (which includes
//     the CMS data inlined for hydration) plus the JS bundles (icons in
//     templates that only render after interaction) are the complete list of
//     icons in use, so the built stylesheet keeps only those glyph rules and
//     each font file is cut down to those glyphs. Subset files get new hashed
//     names: a browser holding a cached copy of an older subset under the same
//     name would otherwise be missing any icon added since.
//
//  2. Unused CSS. The global stylesheet bundles all of Bootstrap and the
//     theme (~690 KB, render-blocking) for a site that uses a fraction of it.
//     Selectors that appear nowhere in the prerendered pages or the JS bundles
//     (Angular templates, Bootstrap's and WOW's scripts, which add classes at
//     runtime) are dropped. The safelist covers classes built at runtime from
//     parts that never appear whole in any file.
//
//  3. spa.html — the shell .htaccess serves for any URL that has no
//     prerendered file (e.g. a guide published after the last build). It is
//     the app with an empty <app-root> and no hydration state, so Angular
//     renders that URL client-side exactly as the site did before prerendering.
//
//  4. SEO checks over every prerendered route: a missing title or canonical,
//     or JSON-LD that does not parse, fails the build; a page with no <h1> or
//     very little text is reported.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import subsetFont from 'subset-font';
import { PurgeCSS } from 'purgecss';
import { ROOT, OUTPUT_DIR } from './lib/cms-routes.mjs';

const MIN_WORDS = 250;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

// --- 1. Font Awesome subset -------------------------------------------------

// Walks a minified stylesheet's top-level rules. Glyph rules are the only ones
// touched; everything else (@media, @font-face, utilities) is copied as-is.
function* topLevelRules(css) {
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open === -1) { yield { raw: css.slice(i) }; return; }
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      const ch = css[j];
      if (ch === '"' || ch === "'") {
        const end = css.indexOf(ch, j + 1);
        j = end === -1 ? css.length : end + 1;
        continue;
      }
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      j++;
    }
    yield { selector: css.slice(i, open), body: css.slice(open + 1, j - 1), raw: css.slice(i, j) };
    i = j;
  }
}

const GLYPH_SELECTOR = /^\.(?:fa[a-z]*\.)?fa-([a-z0-9-]+)::?(?:before|after)$/;
const GLYPH_BODY = /^content:"((?:\\[0-9a-f]+)+)"$/i;

function codepoints(content) {
  return content.split('\\').filter(Boolean).map(hex => parseInt(hex, 16));
}

async function subsetFontAwesome(usedNames) {
  const cssFile = readdirSync(OUTPUT_DIR).find(f => /^styles-.*\.css$/.test(f));
  if (!cssFile) throw new Error('built stylesheet not found');
  const cssPath = join(OUTPUT_DIR, cssFile);
  const css = readFileSync(cssPath, 'utf-8');

  const keptCodepoints = new Set();
  let removedRules = 0;
  let out = '';
  for (const rule of topLevelRules(css)) {
    if (rule.selector === undefined) { out += rule.raw; continue; }
    const selectors = rule.selector.split(',').map(s => s.trim());
    const body = rule.body.trim();
    const isGlyphRule = GLYPH_BODY.test(body) && selectors.every(s => GLYPH_SELECTOR.test(s));
    if (!isGlyphRule) { out += rule.raw; continue; }

    const kept = selectors.filter(s => usedNames.has(s.match(GLYPH_SELECTOR)[1]));
    if (!kept.length) { removedRules++; continue; }
    codepoints(body.match(GLYPH_BODY)[1]).forEach(cp => keptCodepoints.add(cp));
    out += `${kept.join(',')}{${body}}`;
  }

  // Subset each woff2 the stylesheet references; drop the .ttf fallbacks
  // (every browser the site supports takes woff2).
  const text = String.fromCodePoint(...keptCodepoints);
  const renamed = new Map();
  for (const [, file] of out.matchAll(/url\("?\.\/media\/(fa-[^")]+\.woff2)"?\)/g)) {
    if (renamed.has(file)) continue;
    const source = readFileSync(join(OUTPUT_DIR, 'media', file));
    const subset = await subsetFont(source, text, { targetFormat: 'woff2' });
    const hash = createHash('sha256').update(subset).digest('hex').slice(0, 8).toUpperCase();
    const name = file.replace(/-[A-Z0-9]+\.woff2$/, `-subset-${hash}.woff2`);
    writeFileSync(join(OUTPUT_DIR, 'media', name), subset);
    renamed.set(file, { name, before: source.length, after: subset.length });
  }
  for (const [from, { name }] of renamed) out = out.split(`./media/${from}`).join(`./media/${name}`);
  out = out.replace(/,url\("?\.\/media\/fa-[^")]+\.ttf"?\) format\("truetype"\)/g, '');

  // Angular also inlines each page's critical CSS, @font-face rules included,
  // into its HTML; those still name the full fonts.
  for (const file of walk(OUTPUT_DIR).filter(f => f.endsWith('.html'))) {
    const html = readFileSync(file, 'utf-8');
    let updated = html;
    for (const [from, { name }] of renamed) updated = updated.split(from).join(name);
    updated = updated.replace(/,\s*url\("?[^")]*fa-[^")]+\.ttf"?\) format\("truetype"\)/g, '');
    if (updated !== html) writeFileSync(file, updated);
  }

  writeFileSync(cssPath, out);
  const fontBefore = [...renamed.values()].reduce((n, f) => n + f.before, 0);
  const fontAfter = [...renamed.values()].reduce((n, f) => n + f.after, 0);
  console.log(`[postbuild] Font Awesome: kept ${keptCodepoints.size} glyphs for ${usedNames.size} icon names, removed ${removedRules} unused glyph rules`);
  console.log(`[postbuild] stylesheet ${(css.length / 1024).toFixed(0)} KB -> ${(out.length / 1024).toFixed(0)} KB; icon fonts ${(fontBefore / 1024).toFixed(0)} KB -> ${(fontAfter / 1024).toFixed(0)} KB`);
}

function collectIconNames(files) {
  const names = new Set();
  for (const file of files) {
    if (!/\.(html|js)$/.test(file)) continue;
    for (const [, name] of readFileSync(file, 'utf-8').matchAll(/\bfa-([a-z0-9]+(?:-[a-z0-9]+)*)/g)) names.add(name);
  }
  return names;
}

// --- 2. Unused CSS -------------------------------------------------------------

const CSS_SAFELIST = {
  standard: [/^show/, /^showing/, /^hiding/, /^fade/, /^collaps/, /^offcanvas/, /^modal/, /^dropdown/, /^owl-/, /^animate/, /^animated/, /^wow/, /^active/, /^disabled/, /^fixed-top/, /^nav-scrolled/, /^menu-open/, /^cms-/, /^skel/, /^is-/, /^was-validated/, /^invalid/, /^valid/],
  deep: [/^owl-/, /^mega-/, /^cms-rich-text/],
  greedy: [/^fa-/]
};

async function purgeUnusedCss(files) {
  const cssFile = readdirSync(OUTPUT_DIR).find(f => /^styles-.*.css$/.test(f));
  const cssPath = join(OUTPUT_DIR, cssFile);
  const before = readFileSync(cssPath, 'utf-8');
  const content = files.filter(f => /.(html|js|mjs)$/.test(f));
  const [result] = await new PurgeCSS().purge({
    content,
    css: [{ raw: before }],
    safelist: CSS_SAFELIST,
    fontFace: false,
    keyframes: false,
    variables: false
  });
  writeFileSync(cssPath, result.css);
  console.log(`[postbuild] unused CSS removed: ${(before.length / 1024).toFixed(0)} KB -> ${(result.css.length / 1024).toFixed(0)} KB`);
}

// --- 3. SPA fallback shell ----------------------------------------------------

function writeSpaShell() {
  const home = readFileSync(join(OUTPUT_DIR, 'index.html'), 'utf-8');
  const shell = home
    // No hydration state: Angular renders the URL from scratch.
    .replace(/<script id="ng-state"[^>]*>[\s\S]*?<\/script>/, '')
    .replace(/(<app-root\b[^>]*>)[\s\S]*<\/app-root>/, '<app-root></app-root>')
    .replace(/\s(ng-server-context|ngh)="[^"]*"/g, '')
    // The homepage's own tags would be wrong for whatever URL this serves;
    // SeoService writes the right ones once the route renders.
    .replace(/<link rel="canonical"[^>]*>/, '')
    .replace(/<script type="application\/ld\+json" id="structured-data-[^"]*">[\s\S]*?<\/script>/g, '');
  writeFileSync(join(OUTPUT_DIR, 'spa.html'), shell);
}

// --- 4. SEO checks --------------------------------------------------------------

function checkRoutes() {
  const routes = readFileSync(join(ROOT, 'prerender-routes.txt'), 'utf-8').split('\n').filter(Boolean);
  const errors = [];
  const warnings = [];
  for (const route of routes) {
    const file = join(OUTPUT_DIR, ...route.split('/').filter(Boolean), 'index.html');
    if (!existsSync(file)) { errors.push(`${route}: not prerendered`); continue; }
    const html = readFileSync(file, 'utf-8');
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim();
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    if (!title) errors.push(`${route}: no <title>`);
    if (!canonical) errors.push(`${route}: no canonical`);
    for (const [, json] of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      try { JSON.parse(json); } catch { errors.push(`${route}: invalid JSON-LD`); }
    }
    const body = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, '');
    const h1s = body.match(/<h1\b/g)?.length ?? 0;
    if (h1s !== 1) warnings.push(`${route}: ${h1s} <h1> elements`);
    const words = body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(w => /[a-z]/i.test(w)).length;
    if (words < MIN_WORDS) warnings.push(`${route}: only ${words} words of text`);
  }
  warnings.forEach(w => console.warn(`[postbuild] warning ${w}`));
  if (errors.length) {
    errors.forEach(e => console.error(`[postbuild] error ${e}`));
    throw new Error(`${errors.length} SEO check(s) failed`);
  }
  console.log(`[postbuild] SEO checks passed for ${routes.length} routes (${warnings.length} warnings)`);
}

async function main() {
  const files = walk(OUTPUT_DIR);
  await subsetFontAwesome(collectIconNames(files));
  if (process.env.SKIP_PURGE !== '1') await purgeUnusedCss(walk(OUTPUT_DIR).concat(join(ROOT, 'src', 'assets', 'js', 'wow.min.js')));
  writeSpaShell();
  checkRoutes();
  console.log(`[postbuild] done: ${relative(ROOT, OUTPUT_DIR)}`);
}

main().catch(err => {
  console.error(`[postbuild] ${err.message}`);
  process.exitCode = 1;
});
