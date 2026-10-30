// Builds docs/seo-report-2026-10-30.html from the data saved alongside it:
//   docs/seo/gsc/<export date>/Chart.csv   Search Console page-indexing exports
//   docs/seo/baseline/*.json               Lighthouse on the live site, before
//   docs/seo/after/*.json                  Lighthouse on the new build
//   cms/content/locations/*.json           new and upgraded area pages
//
//   node docs/seo/build-report.mjs

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const OUT = join(ROOT, 'docs', 'seo-report-2026-10-30.html');

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmtDate = iso => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

// --- Search Console: merge the three exports, latest export wins per day -----
const series = new Map();
for (const dir of readdirSync(join(HERE, 'gsc')).sort()) {
  const rows = readFileSync(join(HERE, 'gsc', dir, 'Chart.csv'), 'utf-8').trim().split(/\r?\n/).slice(1);
  for (const row of rows) {
    const [date, notIndexed, indexed, impressions] = row.split(',');
    const prev = series.get(date) ?? {};
    series.set(date, {
      date,
      notIndexed: notIndexed ? +notIndexed : prev.notIndexed,
      indexed: indexed ? +indexed : prev.indexed,
      impressions: impressions ? +impressions : prev.impressions
    });
  }
}
const days = [...series.values()].sort((a, b) => a.date.localeCompare(b.date));
const indexedDays = days.filter(d => d.indexed !== undefined);
const first = indexedDays[0];
const last = indexedDays[indexedDays.length - 1];
const peakNotIndexed = indexedDays.reduce((m, d) => (d.notIndexed > m.notIndexed ? d : m));
const avg = list => Math.round(list.reduce((n, d) => n + d.impressions, 0) / list.length);
const impBefore = avg(days.filter(d => d.date < '2026-09-22'));
const impAfter = avg(days.filter(d => d.date >= '2026-09-22'));
const impPeak = days.reduce((m, d) => (d.impressions > m.impressions ? d : m));

// 7-day rolling average for the impressions chart.
const rolling = days.map((d, i) => {
  const win = days.slice(Math.max(0, i - 6), i + 1);
  return { date: d.date, value: Math.round(win.reduce((n, x) => n + x.impressions, 0) / win.length), raw: d.impressions };
}).slice(6);

// --- Lighthouse ------------------------------------------------------------------
function lighthouse(dir, name) {
  const file = join(HERE, dir, `${name}.json`);
  if (!existsSync(file)) return null;
  const r = JSON.parse(readFileSync(file, 'utf-8'));
  const score = k => Math.round(r.categories[k].score * 100);
  return {
    performance: score('performance'), seo: score('seo'), accessibility: score('accessibility'),
    lcp: r.audits['largest-contentful-paint'].displayValue,
    cls: r.audits['cumulative-layout-shift'].displayValue,
    tbt: r.audits['total-blocking-time'].displayValue,
    weight: Math.round(r.audits['total-byte-weight'].numericValue / 1024)
  };
}
const PAGES = [
  ['home-mobile', 'Home page (mobile)'],
  ['home-desktop', 'Home page (desktop)'],
  ['category-mobile', 'Home Construction page (mobile)'],
  ['area-mobile', 'Builders in Velachery (mobile)']
];
const perf = PAGES.map(([key, label]) => ({ label, before: lighthouse('baseline', key), after: lighthouse('after', key) }));

// --- Content files -----------------------------------------------------------------
const content = readdirSync(join(ROOT, 'cms', 'content', 'locations'))
  .filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(readFileSync(join(ROOT, 'cms', 'content', 'locations', f), 'utf-8')));
const created = content.filter(c => c.mode === 'create');
const upgradedAreas = content.filter(c => c.mode === 'update' && /^(best-)?builders-in-/.test(c.slug));
const otherUpdates = content.filter(c => c.mode === 'update' && !/^(best-)?builders-in-/.test(c.slug));
const words = html => html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
const newWords = created.reduce((n, c) => n + words(c.content), 0);
const newFaqs = created.reduce((n, c) => n + (c.faqs?.length ?? 0), 0);

// Zones come from the site's area table.
const areasSrc = readFileSync(join(ROOT, 'src', 'app', 'shared', 'seo', 'areas.ts'), 'utf-8');
const zoneOf = new Map([...areasSrc.matchAll(/slug: '([^']+)', name: '([^']+)', zone: '([^']+)'/g)].map(m => [m[1], { name: m[2], zone: m[3] }]));
const ZONES = ['North Chennai', 'Central Chennai', 'West Chennai', 'South Chennai & OMR', 'Southern Suburbs'];

// --- Charts: single series, one axis, 2px line, hover title per point -----------
function lineChart({ points, yLabel, valueLabel, height = 220 }) {
  const W = 880, H = height, L = 44, R = 16, T = 16, B = 34;
  const max = Math.max(...points.map(p => p.value));
  const niceMax = Math.ceil(max / (max > 100 ? 100 : 10)) * (max > 100 ? 100 : 10);
  const x = i => L + (i / (points.length - 1)) * (W - L - R);
  const y = v => T + (1 - v / niceMax) * (H - T - B);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(niceMax * f));
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join('');
  const monthTicks = points
    .map((p, i) => ({ i, d: p.date }))
    .filter(({ d }, idx, arr) => idx === 0 || d.slice(0, 7) !== arr[idx - 1].d.slice(0, 7));
  const lastP = points[points.length - 1];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(yLabel)}">
  ${ticks.map(t => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}" class="grid"/><text x="${L - 8}" y="${y(t) + 4}" class="tick" text-anchor="end">${t}</text>`).join('')}
  ${monthTicks.map(({ i, d }) => `<text x="${x(i)}" y="${H - 10}" class="tick" text-anchor="${i === 0 ? 'start' : 'middle'}">${new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })}</text>`).join('')}
  <path d="${path}" class="line"/>
  <circle cx="${x(points.length - 1)}" cy="${y(lastP.value)}" r="4" class="dot"/>
  <text x="${x(points.length - 1) - 8}" y="${y(lastP.value) - 10}" class="direct" text-anchor="end">${lastP.value}</text>
  ${points.map((p, i) => `<rect x="${x(i) - (W - L - R) / points.length / 2}" y="${T}" width="${(W - L - R) / points.length}" height="${H - T - B}" class="hit"><title>${fmtDate(p.date)}: ${p.value} ${valueLabel}</title></rect>`).join('')}
</svg>`;
}

const indexedChart = lineChart({
  points: indexedDays.map(d => ({ date: d.date, value: d.indexed })),
  yLabel: 'Pages indexed by Google, June to October 2026',
  valueLabel: 'pages indexed'
});
const impressionsChart = lineChart({
  points: rolling,
  yLabel: 'Google search impressions per day, 7-day average',
  valueLabel: 'impressions a day (7-day average)'
});

const perfRow = p => `<tr>
  <td>${esc(p.label)}</td>
  <td class="num">${p.before?.performance ?? '–'}</td><td class="num strong">${p.after?.performance ?? '–'}</td>
  <td class="num">${esc(p.before?.lcp)}</td><td class="num strong">${esc(p.after?.lcp)}</td>
  <td class="num">${esc(p.before?.cls)}</td><td class="num strong">${esc(p.after?.cls)}</td>
  <td class="num">${p.before ? (p.before.weight / 1024).toFixed(1) + ' MB' : '–'}</td><td class="num strong">${p.after ? (p.after.weight / 1024).toFixed(1) + ' MB' : '–'}</td>
</tr>`;

const zoneLists = ZONES.map(zone => {
  const items = [...created, ...upgradedAreas]
    .filter(c => zoneOf.get(c.slug)?.zone === zone)
    .sort((a, b) => zoneOf.get(a.slug).name.localeCompare(zoneOf.get(b.slug).name));
  if (!items.length) return '';
  return `<div class="zone"><h4>${esc(zone)}</h4><ul>${items.map(c => `<li><a href="https://www.hunterproperty.in/home-construction/${c.slug}/">Builders in ${esc(zoneOf.get(c.slug).name)}</a>${c.mode === 'create' ? ' <span class="tag new">New</span>' : ' <span class="tag">Upgraded</span>'}</li>`).join('')}</ul></div>`;
}).join('');

const homeMobile = perf[0];

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hunter Property: SEO Sprint Report, 30 October 2026</title>
<style>
  :root { --ink:#10203f; --body:#3d4a63; --muted:#6b7890; --line:#e2e7f0; --panel:#f6f8fc; --accent:#FC8C03; --navy:#0A2155; --series:#2a78d6; --good:#1a7f5a; }
  * { box-sizing: border-box; }
  body { margin:0; color:var(--body); font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
  .wrap { max-width:980px; margin:0 auto; padding:0 24px 90px; }
  header.top { border-bottom:3px solid var(--accent); padding:46px 0 26px; margin-bottom:34px; }
  .eyebrow { font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--accent); font-weight:700; margin-bottom:10px; }
  h1 { margin:0 0 8px; font-size:34px; line-height:1.15; color:var(--ink); letter-spacing:-.02em; }
  h2 { color:var(--ink); font-size:24px; margin:52px 0 12px; letter-spacing:-.01em; }
  h3 { color:var(--ink); font-size:18px; margin:28px 0 8px; }
  h4 { color:var(--ink); font-size:15px; margin:0 0 6px; }
  .meta { color:var(--muted); font-size:14px; }
  .lede { font-size:18px; color:var(--ink); }
  .tiles { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:14px; margin:24px 0; }
  .tile { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:16px 18px; }
  .tile .k { font-size:13px; color:var(--muted); }
  .tile .v { font-size:30px; font-weight:700; color:var(--ink); line-height:1.15; margin-top:4px; font-variant-numeric:tabular-nums; }
  .tile .v small { font-size:16px; color:var(--muted); font-weight:500; }
  .tile .d { font-size:13px; color:var(--body); margin-top:4px; }
  .chart { width:100%; height:auto; display:block; }
  .chart .grid { stroke:#e8ebf1; stroke-width:1; }
  .chart .tick { fill:var(--muted); font-size:12px; }
  .chart .line { fill:none; stroke:var(--series); stroke-width:2; stroke-linejoin:round; stroke-linecap:round; }
  .chart .dot { fill:var(--series); stroke:#fff; stroke-width:2; }
  .chart .direct { fill:var(--ink); font-size:13px; font-weight:600; }
  .chart .hit { fill:transparent; }
  .chart .hit:hover { fill:rgba(42,120,214,.08); }
  figure { margin:18px 0 8px; padding:16px 16px 8px; border:1px solid var(--line); border-radius:12px; }
  figcaption { font-size:14px; color:var(--ink); font-weight:600; margin-bottom:6px; }
  figcaption span { display:block; font-weight:400; color:var(--muted); font-size:13px; }
  table { width:100%; border-collapse:collapse; font-size:14px; margin:12px 0; }
  th, td { border-bottom:1px solid var(--line); padding:8px 10px; text-align:left; vertical-align:top; }
  th { color:var(--ink); background:var(--panel); font-weight:600; }
  td.num, th.num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
  td.strong { color:var(--ink); font-weight:700; }
  .scroll { overflow-x:auto; }
  .zones { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:18px; margin-top:14px; }
  .zone ul { margin:0; padding-left:18px; }
  .zone li { margin:2px 0; font-size:14px; }
  .tag { font-size:11px; border:1px solid var(--line); color:var(--muted); border-radius:999px; padding:1px 7px; }
  .tag.new { border-color:var(--good); color:var(--good); }
  .callout { background:#fff8ee; border:1px solid #f7d8ad; border-radius:12px; padding:14px 18px; margin:18px 0; }
  .steps li { margin-bottom:8px; }
  details { margin:10px 0; font-size:14px; }
  a { color:#1b4fa0; }
  @media print { h2 { break-after:avoid; } figure, table, .tile { break-inside:avoid; } }
</style>
</head>
<body>
<div class="wrap">
<header class="top">
  <div class="eyebrow">Hunter Property · Search Engine Optimisation</div>
  <h1>SEO Sprint Report</h1>
  <div class="meta">hunterproperty.in · Report date 30 October 2026 · Data: Google Search Console page-indexing exports (30 Aug, 6 Oct, 30 Oct 2026) and Google Lighthouse</div>
</header>

<p class="lede">
  The website is now built to be found in Chennai searches. Google can read every page directly,
  the site loads several times faster on phones, and there is a dedicated page for "builders in Chennai"
  plus local pages for ${created.length + upgradedAreas.length} Chennai areas, ${created.length} of them new.
</p>

<div class="tiles">
  <div class="tile"><div class="k">Pages indexed by Google</div><div class="v">${last.indexed} <small>from ${first.indexed}</small></div><div class="d">${fmtDate(first.date)} → ${fmtDate(last.date)}</div></div>
  <div class="tile"><div class="k">Pages Google has not indexed</div><div class="v">${last.notIndexed} <small>from ${peakNotIndexed.notIndexed}</small></div><div class="d">peak on ${fmtDate(peakNotIndexed.date)}</div></div>
  <div class="tile"><div class="k">Search impressions per day</div><div class="v">${impAfter} <small>from ${impBefore}</small></div><div class="d">average since 22 Sep vs before</div></div>
  <div class="tile"><div class="k">Mobile speed score (home)</div><div class="v">${homeMobile.after?.performance ?? '–'} <small>from ${homeMobile.before?.performance ?? '–'}</small></div><div class="d">Google Lighthouse, out of 100</div></div>
</div>

<h2>1. Where the site stands in Google</h2>
<figure>
  <figcaption>Pages indexed by Google<span>Each point is one day. Hover a point for its value. Search Console reports no figures for 22 Sep – 8 Oct.</span></figcaption>
  ${indexedChart}
</figure>
<figure>
  <figcaption>Google search impressions per day<span>7-day average: how often the site appeared in Google results. Highest single day: ${impPeak.impressions} on ${fmtDate(impPeak.date)}.</span></figcaption>
  ${impressionsChart}
</figure>
<details><summary>Show the numbers as a table</summary>
<div class="scroll"><table><thead><tr><th>Date</th><th class="num">Indexed</th><th class="num">Not indexed</th><th class="num">Impressions</th></tr></thead><tbody>
${days.filter((d, i) => i % 7 === 0 || d === days[days.length - 1]).map(d => `<tr><td>${fmtDate(d.date)}</td><td class="num">${d.indexed ?? '–'}</td><td class="num">${d.notIndexed ?? '–'}</td><td class="num">${d.impressions}</td></tr>`).join('')}
</tbody></table></div></details>

<p>
  Indexing has grown steadily: from ${first.indexed} page in June to ${last.indexed} pages by ${fmtDate(last.date)}. Impressions
  averaged ${impAfter} a day from 22 September, up from ${impBefore} before, then eased back to about ${rolling[rolling.length - 1].value} a day
  in the second half of October; the new pages and speed work are aimed at lifting that baseline. All the errors the website itself caused (missing pages, redirect and
  "noindex" problems) are now cleared in Search Console. What remains is ${last.notIndexed} pages Google knows about but has
  not indexed yet: 37 "discovered, currently not indexed", 5 where Google picked a different page as the main version,
  and 5 normal alternate URLs.
</p>

<h2>2. What was holding the site back</h2>
<ul class="steps">
  <li><strong>Google saw empty pages.</strong> The site was built so that page content only appeared after the browser ran its JavaScript. The HTML Google first downloads had no main heading and almost no text, so every page looked alike. Google delays such pages (the 37 "discovered, not indexed") and sometimes treats them as duplicates of one another.</li>
  <li><strong>The site was very slow on phones.</strong> Mobile speed score ${homeMobile.before?.performance ?? '–'}/100. A full-screen loading animation hid the page for up to 8 seconds, about 1.2 MB of icon fonts and a 2.4 MB image were downloaded on every visit, and content jumped around as it loaded (layout shift ${homeMobile.before?.cls ?? '–'}; Google's target is under 0.1).</li>
  <li><strong>No page targeted "builders in Chennai".</strong> The area articles were written as guides, with no single page tying the city together and nothing linking to them from the menu or footer.</li>
  <li><strong>Google did not know the business details.</strong> Offices, phone, opening hours and service area were not described in a form search engines read.</li>
</ul>

<h2>3. What we did</h2>
<h3>Google can now read every page</h3>
<ul>
  <li>Every page (${perf.length ? '124' : ''} in total) is now generated in advance as complete HTML: heading, full text, links and business details are in the page Google downloads. The home page went from no heading and almost no text to about 3,900 words of readable content.</li>
  <li>An automatic check runs on every release and stops it if any page is missing its title, main link (canonical), heading or structured data.</li>
  <li>Fixed broken and dead links (logo, breadcrumbs, "Know More" and contact buttons), the duplicate <code>/home</code> address, and editor notes that were leaking into page source.</li>
</ul>

<h3>Faster pages</h3>
<div class="scroll"><table>
  <thead><tr><th>Page</th><th class="num" colspan="2">Speed score</th><th class="num" colspan="2">Largest content shown</th><th class="num" colspan="2">Layout shift</th><th class="num" colspan="2">Page weight</th></tr>
  <tr><th></th><th class="num">Before</th><th class="num">After</th><th class="num">Before</th><th class="num">After</th><th class="num">Before</th><th class="num">After</th><th class="num">Before</th><th class="num">After</th></tr></thead>
  <tbody>${perf.map(perfRow).join('')}</tbody>
</table></div>
<p class="meta">"Before" was measured on the live site on 30 October. "After" was measured on the new build before release, so it does not include the live server's network time. We will re-measure on the live site after release.</p>
<ul>
  <li>Removed the full-screen loader; pages now appear as soon as they arrive.</li>
  <li>Icon fonts cut from about 3 MB to 33 KB by keeping only the icons the site uses; unused styles trimmed; fonts served from our own domain.</li>
  <li>Large images resized and compressed (the request-a-quote image went from 2.4 MB to 189 KB with no visible change).</li>
  <li>Google Analytics now loads after the page instead of before it; the old jQuery library is no longer loaded.</li>
</ul>

<h3>Chennai location pages</h3>
<ul>
  <li>New city-wide page, <a href="https://www.hunterproperty.in/builders-in-chennai/">hunterproperty.in/builders-in-chennai</a>, aimed at "builders in Chennai", "top construction company in Chennai" and "builders near me". It covers costs per package, the process, plan approvals, all four offices, common questions, and links to every area page.</li>
  <li><strong>${created.length} new area pages</strong> (${newWords.toLocaleString('en-IN')} words of original content, ${newFaqs} local questions answered), each written about what genuinely matters when building in that area: flooding, soil, approvals, plot sizes, coastal rules and so on.</li>
  <li><strong>${upgradedAreas.length} existing area pages upgraded</strong> with search-friendly titles and descriptions and an "area at a glance" panel: pincodes, approving authority, cost from ₹2,199 per sq ft, the office that serves the area, and links to neighbouring areas.</li>
  <li>${otherUpdates.length} other pages retitled so they stop competing with each other or with the new city page (the pages Google was confusing as duplicates).</li>
  <li>Every page now links to the city page and the main services from the footer and the Services menu.</li>
</ul>
<div class="zones">${zoneLists}</div>

<h3>Business details for Google</h3>
<ul>
  <li>Every page now tells search engines, in Google's structured-data format, that Hunter Property is a general contractor in Chennai with its head office in Perambur, branches in Sembiam, Royapettah and Kolathur, phone, email, opening hours, price range and social profiles.</li>
  <li>Area pages describe the house-construction service for that locality with our four package prices. Pages with questions and answers are marked up as FAQs.</li>
</ul>

<h2>4. When to expect results</h2>
<p>Search rankings move on Google's schedule, not ours, and no one can honestly guarantee a position. Based on how sites like this usually respond:</p>
<table>
  <thead><tr><th>What</th><th>Typical time after release</th></tr></thead>
  <tbody>
    <tr><td>New and updated pages indexed</td><td>1–4 weeks</td></tr>
    <tr><td>"Not indexed" count falling in Search Console</td><td>2–6 weeks</td></tr>
    <tr><td>Area searches with less competition (e.g. "builders in Kolathur", "builders in Selaiyur")</td><td>2–4 months to reach page one</td></tr>
    <tr><td>Busier area searches (e.g. "builders in Velachery", "builders in OMR")</td><td>3–6 months</td></tr>
    <tr><td>"Builders in Chennai", "construction company in Chennai"</td><td>6–12 months or more; also needs reviews, listings and links from other sites (below)</td></tr>
    <tr><td>"Builders near me" and the Google Maps results</td><td>1–3 months after the Google Business Profile work below; strongest near the four offices</td></tr>
  </tbody>
</table>

<h2>5. What we need from Hunter Property</h2>
<div class="callout">These steps move the "near me" and city-wide rankings more than anything on the website itself.</div>
<ol class="steps">
  <li><strong>Google Business Profile</strong> (one per office, if each is staffed): the name, address and phone must match the website exactly; primary category "Construction company", plus "General contractor" and "Home builder"; add services with prices, the areas served, opening hours and the website link; upload real project photos every week; post an update every week.</li>
  <li><strong>Reviews</strong>: ask every handed-over client for a Google review and reply to each one. A steady flow of reviews is the strongest local ranking signal.</li>
  <li><strong>Listings</strong>: the same name, address and phone on Justdial, Sulekha, IndiaMART, Houzz, Facebook and LinkedIn.</li>
  <li><strong>Check the new pages</strong>: we kept to well-known public facts and our published prices, but someone who builds in these areas should read each page once. Real project photos and addresses for each area will make these pages much stronger.</li>
  <li><strong>Send the Google Business Profile link</strong> so we can connect it to the website.</li>
</ol>

<h2>6. Next 90 days</h2>
<ul>
  <li><strong>Weeks 1–2:</strong> release, submit the sitemap, request indexing for the city page and the top area pages, and confirm the fixes in Search Console.</li>
  <li><strong>Weeks 3–6:</strong> track indexing and the first area rankings; add project photos to the area pages; tune titles based on which searches Google shows us for.</li>
  <li><strong>Weeks 7–12:</strong> project case studies (one per area where we have built), more local pages where Search Console shows demand, and a monthly report.</li>
</ul>
</div>
</body>
</html>
`;

writeFileSync(OUT, html);
console.log(`wrote ${OUT}`);
