# Image Handling & Strapi Connectivity Performance Audit

**Project:** Hunter Property website (Angular 18 frontend + Strapi 5 CMS)
**Scope:** Image loading/rendering pipeline, Strapi media pipeline, frontend↔CMS connectivity, everything contributing to slow image load times.
**Date:** 2026-08-21
**Method:** Full static audit of `src/` (Angular app) and `cms/` (Strapi instance), including config files, services, templates, local asset sizes, and Strapi's runtime media-library settings.

---

## Executive summary

The single biggest, highest-confidence finding is a **complete disconnect between what the CMS produces and what the frontend requests**: Strapi is configured to auto-generate `thumbnail / small / medium / large` responsive image variants (`responsiveDimensions: true`, `sizeOptimization: true`), but **every image call site in the Angular app discards that and requests the original, full-resolution upload instead**. Every CMS-driven image on the site — hero slides, team photos, portfolio grids, testimonials, service cards, blog/guide covers — downloads at whatever resolution the content editor originally uploaded (often several MB), then gets scaled down in the browser to a few hundred pixels of actual display size.

Compounding this: the site is a pure client-side-rendered Angular app (no SSR/hydration) that fires **13+ independent, uncached HTTP requests to a Render-hosted Strapi instance** on every homepage load. Nothing can start downloading an image until: HTML shell loads → JS bundle downloads/parses/executes → Angular bootstraps → Strapi round-trips resolve → DOM renders → `<img src>` binds → *then* the browser starts fetching image bytes.

The CMS side is actually in good shape (Cloudinary-backed, responsive formats enabled) — the fixes are concentrated in a small number of frontend files.

---

## 1. Architecture at a glance

| Layer | Technology | Detail |
|---|---|---|
| Frontend | Angular 18, CSR only (no SSR/Universal) | `src/main.ts` uses plain `bootstrapApplication` |
| CMS | Strapi 5.52.0 | `cms/` |
| Media storage | **Cloudinary** (not local disk) | `cms/config/plugins.ts:34-52` |
| Strapi hosting | Render.com (`cms.hunterproperty.in`) | `src/environments/environment.prod.ts`, `src/index.html:26` |
| Frontend hosting | Hostinger shared hosting (Apache) | inferred from `hunterproperty-hostinger-deploy-*.zip`, `public/.htaccess` |
| Carousel library | `ngx-owl-carousel-o` | renders all slides into DOM upfront, not virtualized |

**Critical path for the hero (LCP) image on a cold visit:**
HTML shell → download/parse/execute JS bundle → Angular bootstrap → `HomeContentService.getBanner()` HTTP GET to Render → Strapi JSON response → `mediaUrl()` builds a **non-transformed, full-resolution** Cloudinary URL → Angular renders `<img [src]>` → only now does the browser start fetching the actual image bytes.

This is structurally slower than SSR (where the image URL would already be in the initial HTML and picked up instantly by the browser's preload scanner). Out of scope for a pure image-handling fix, but it's the root reason even a perfectly-sized image would still start downloading late.

---

## 2. Root cause: images always served at original size (Critical)

**File:** `src/app/shared/services/strapi.service.ts:36-43`

```ts
mediaUrl(url: string | undefined | null): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${this.baseUrl}${url}`;
}

mediaUrls(media: Array<{ url?: string } | null | undefined> | undefined | null): string[] {
  return (media ?? []).map(m => this.mediaUrl(m?.url)).filter(Boolean);
}
```

Both helpers take the bare `.url` field from a Strapi media object — that is **always the original upload**, never a resized variant. Every consumer of these helpers calls them the same way, confirmed across:

- `src/app/shared/services/home-content.service.ts:36, 46, 54-55, 74-75, 83, 97, 110-113, 128, 135, 146, 161`
- `src/app/shared/services/service-content.service.ts:133, 144, 157`

None of these reference `formats.thumbnail.url`, `formats.small.url`, `formats.medium.url`, or `formats.large.url`. Strapi's `populate` params already return the full `formats` object in the API response — it's fetched over the wire and then simply thrown away client-side.

**Why this matters:** Strapi (confirmed below, §4.2) already generates `thumbnail (~245px) / small (~500px) / medium (~750px) / large (~1000px)` variants for every upload, compressed via `sizeOptimization`. None of that generated work is ever used. A portfolio thumbnail displayed at 300px wide downloads the same multi-megabyte original as a full-bleed hero image would.

**Fix (two options, can be combined):**

1. **Fast, single-file fix — Cloudinary on-the-fly transforms.** Cloudinary lets you resize/reformat via URL segments, no Strapi changes needed. Rewrite `mediaUrl()` to inject a transform segment into the Cloudinary path, e.g. turn `.../upload/v123/foo.jpg` into `.../upload/w_800,q_auto,f_auto/v123/foo.jpg`. One change in `strapi.service.ts` fixes every image site-wide immediately.
2. **Correct, longer-term fix — use Strapi's `formats`.** Update `mediaUrl`/`mediaUrls` to accept the `formats` object and pick a size per usage context (`small` for thumbnails/carousel slides, `medium` for feature images, `large`/original reserved for hero/lightbox). Build real `srcset`/`sizes` from the full `formats` set so the browser — not a hardcoded guess — picks the right size per viewport. Requires updating every call site listed above.

---

## 3. Frontend image markup issues

### 3.1 No responsive image attributes anywhere (High)
- 44 `<img>` tags total across `src/app`. **Zero** use `srcset`, `sizes`, or Angular's `NgOptimizedImage` directive (not imported anywhere in the project — and wouldn't fully help here since there's no SSR/hydration to pair it with).

### 3.2 No explicit width/height on any `<img>` (High — CLS risk)
- Zero `<img>` tags anywhere set `width`/`height`. Combined with CMS images having unpredictable aspect ratios (banner slides, team photos, portfolio images), the browser can't reserve layout space before the image loads, causing layout shift as CMS content resolves.
- **Fix:** add explicit `width`/`height` or CSS `aspect-ratio` to every image container.

### 3.3 `loading="lazy"` — inconsistent but mostly reasonable
- 24 of 44 `<img>` tags use `loading="lazy"`. The 20 eager ones are almost all small local SVG icons/logos (`header.component.html`, `footer.component.html`, `faq.component.html`, `pricing.component.html`, `about.component.html`) — fine to leave eager.
- Hero banner (`banner.component.html:6-8`) correctly does:
  ```html
  [attr.loading]="i === 0 ? 'eager' : 'lazy'"
  [attr.fetchpriority]="i === 0 ? 'high' : 'auto'"
  ```
  Good LCP intent — but see §3.4, the carousel library undermines it in practice.

### 3.4 Carousels defeat lazy-loading (Medium)
`ngx-owl-carousel-o` is used in 5 places: `about.component.html` (testimonials), `banner.component.html` (hero), `faq.component.html`, `homeportfolio.component.html`, `logoslider.component.html`.

It renders **all slides into the DOM upfront** (`*ngFor` over the full slide list, positioned via CSS transform — not virtualized, not `display:none`). This means:
- Up to 8 full-bleed hero images can sit close enough to the viewport for the browser's native lazy-load heuristic to fetch them anyway, even though only slide 0 is marked eager.
- Same issue for the portfolio and logo carousels — `loading="lazy"` is set but partially defeated by the layout technique.
- `banner.component.ts:28-52` doesn't configure Owl's lazy-render options at all.

**Fix:** for image-heavy carousels, only mount the active slide (+1 adjacent) into the DOM via `*ngIf`, or use the library's lazy-render option if available.

### 3.5 Preloader (full trace) — `src/app/app.component.ts:16-118` (Medium)

This is the logic behind the recent commits *"Skip lazy-loaded images in preloader tracking"* and *"Tie preloader to real page load instead of a fixed timeout."*

- Boots with `isLoading = true`, driving a full-screen blocking spinner (`app.component.html:3-8`).
- `watchImagesUntilSettled()` (line 68) attaches a `MutationObserver` on `document.body` (line 106-114), catching `<img>` elements added later as CMS sections render.
- `track()` (line 84-99) **skips any image with `img.loading === 'lazy'`** (line 91) — this is the recent fix. Before it, lazy (often below-the-fold) images could hang the preloader indefinitely, forcing every load onto the timeout cap.
- Remaining (eager) images are watched for `load`/`error`.
- 400ms `QUIET_MS` debounce (lines 69, 74-82): once the pending set is empty, waits 400ms with no new images added before disconnecting and calling `onSettled()`.
- Hard 8000ms safety-cap timeout (lines 34-39) always fires regardless.
- On route navigation (`NavigationStart`, lines 41-44), the spinner re-shows after initial load, then hides on a **flat 1000ms `setTimeout`** after `NavigationEnd`/`NavigationCancel`/`NavigationError` (lines 56-59) — **not tied to actual image readiness**, just a fixed delay added to every internal navigation.

**Findings:**
- The spinner blocks the *entire page* on eager images loading — which in practice is mostly just the first hero slide, since most other CMS images are marked lazy. Reasonably tight in the common case, but it's still a global content-blocking pattern rather than progressive rendering (there's an existing `.skel-img` shimmer class, see §3.6, that could replace it per-section).
- No `IntersectionObserver` is used anywhere — only `MutationObserver` (DOM-change detection) plus native `loading=lazy` (viewport-based fetch).
- The flat 1000ms post-navigation delay is a pure UX tax unrelated to real readiness — one extra second on every internal navigation.

**Fix:** replace the full-page blocking spinner with per-section skeletons; drop or shrink the fixed 1000ms post-navigation delay.

### 3.6 Skeleton placeholders — inconsistent (Low)
`src/styles.scss:16-20` defines `.skel-img`, a shimmer placeholder class. Applied to `banner.component.html:6`, `homeportfolio.component.html:19`, `team.component.html:17`, `servicesection.component.html:19`. **Not applied** to `aboutsection.component.html:8-9`, `whychooseus.component.html:17,29,30`, testimonial images, or content-detail cover images. Cosmetic-only inconsistency — apply uniformly.

### 3.7 Unmanaged images in rich-text content (Medium-High)
Blog/guide detail pages render Strapi's WYSIWYG rich-text field via `[innerHTML]` (`content-detail.component.html:30`). Any `<img>` tags embedded in that rich text bypass all of the above entirely — no `loading="lazy"`, no size control, whatever the content editor pasted in. **Fix:** post-process the rich-text HTML (before sanitizing) to inject `loading="lazy"` / `decoding="async"` on embedded `<img>` tags.

### 3.8 `index.html` connection hints
- Preconnects to `fonts.googleapis.com` / `fonts.gstatic.com` (good) and to `https://cms.hunterproperty.in` (the Strapi API itself — good).
- **Missing:** no preconnect to `res.cloudinary.com`, which is where actual image bytes are served from (confirmed via the CSP `img-src`/`media-src` allowlist in `cms/config/middlewares.ts:13-14`). **Fix:** add `<link rel="preconnect" href="https://res.cloudinary.com" crossorigin>` — saves a DNS+TLS round trip on every CMS image fetch.
- No `preload` hint for the LCP hero image is possible in principle, since its URL is only known after the Strapi API call resolves — a direct consequence of the CSR-only architecture (§1).

---

## 4. Strapi CMS side (`cms/`)

### 4.1 Upload provider: Cloudinary, not local disk (good)
`cms/config/plugins.ts:34-52`:
```ts
upload: {
  config: {
    provider: 'cloudinary',
    providerOptions: {
      cloud_name: env('CLOUDINARY_NAME'),
      api_key: env('CLOUDINARY_KEY'),
      api_secret: env('CLOUDINARY_SECRET'),
    },
  },
},
```
`@strapi/provider-upload-cloudinary` (`cms/package.json:21`, `^5.52.1`) is installed and actively configured with real (non-placeholder) credentials. This is the right setup — media bytes are served from Cloudinary's CDN, not from Strapi's own Render instance disk, so Strapi itself isn't a media-serving bottleneck.

No custom `breakpoints` override is set, so Strapi uses its default format sizes: `thumbnail 245px / small 500px / medium 750px / large 1000px` (longest side). Note: for genuinely full-bleed hero backgrounds wider than 1000px, none of the auto-generated formats will be large enough — that specific case may legitimately need the original (properly compressed) or a custom larger breakpoint.

### 4.2 Responsive/optimization settings — confirmed enabled
Queried locally via the Strapi core-store (`cms/.tmp/data.db`, table `strapi_core_store_settings`, key `plugin_upload_settings`):
```json
{"sizeOptimization":true,"responsiveDimensions":true,"autoOrientation":false,"aiMetadata":true}
```
This is a runtime/database setting (Admin → Settings → Media Library), not version-controlled — it should be **spot-checked directly in production** to confirm it matches (it's Strapi v5's out-of-the-box default, so it's likely on, but not proven from the repo alone since production uses Postgres and the local dev DB has zero uploaded files to cross-check `formats` JSON against).

**This is what makes §2's finding so pointed**: the CMS is doing the correct work (generating optimized responsive variants) and the frontend discards all of it.

### 4.3 Versions
`cms/package.json:18-28`: `@strapi/strapi 5.52.0`, `@strapi/database 5.52.0`, `@strapi/provider-upload-cloudinary ^5.52.1` — current-generation Strapi v5, `formats` structure matches v5 semantics. `sharp` isn't listed explicitly but is a transitive dependency used internally to generate format variants before upload.

### 4.4 Middleware / CORS
`cms/config/middlewares.ts:3-38` — standard Strapi v5 default stack (`logger`, `errors`, `security` with CSP override, `cors` restricted to `localhost:4200` / `hunterproperty.in`, `poweredBy`, `query`, `body`, `session`, `favicon`, `public`). No compression middleware configured (not unusual — would need to come from Render's edge or a reverse proxy if desired). No rate-limiting plugin installed. Neither is an image-specific issue, but both affect general API responsiveness, which the frontend's 13-call waterfall (§5.2) is fully exposed to.

### 4.5 Render hosting — verify tier (Critical if free tier)
Strapi runs on `cms.hunterproperty.in` (confirmed via `environment.prod.ts` and `index.html:26`). Render's free/hobby tier spins down after ~15 minutes idle and takes 30-60+ seconds to cold-start the next request — if this instance is on that tier, the **first content+image load after any idle period would appear to hang**, independent of any frontend optimization. Can't be confirmed from the repo — **verify the Render plan directly**, and if it's free tier, either upgrade or add a keep-alive ping.

---

## 5. Connectivity & request pattern

### 5.1 No client-side caching (Medium)
No `HttpInterceptor`, no `shareReplay`, no `localStorage`/`sessionStorage` caching anywhere in `src/app`. `app.config.ts:9-17` only registers `provideHttpClient(withFetch())` — no caching layer. Every content service issues a fresh `HttpClient.get` on every subscribe; navigating home → about → home re-fetches everything, including re-triggering image requests unless HTTP cache headers cover it.

**Fix:** wrap rarely-changing content endpoints (banner, about, services, team, etc.) with `shareReplay(1)` or an HTTP cache interceptor.

### 5.2 Homepage fires 13+ independent, unbatched requests (Medium-High)
`src/app/components/homelayout/homelayout.component.html:2-15` composes 13 child components (`app-banner`, `app-featurearea`, `app-aboutsection`, `app-servicesection`, `app-workingprocess`, `app-homeportfolio`, `app-pricing`, `app-projectskills`, `app-whychooseus`, `app-team`, `app-requestquote`, `app-faq`, `app-featured-guides`), each independently calling its own service method in its own `ngOnInit`. No batching, no GraphQL, no deduplication — all fire in parallel immediately after bootstrap.

### 5.3 Cloudinary transform capability unused (High, cheap fix)
Cloudinary supports on-the-fly URL transforms (`w_400,q_auto,f_auto/...`) that would let the frontend request the exact size/format needed without any Strapi-side change. This capability exists (Cloudinary is already the provider) and is completely unused — see fix option 1 in §2.

---

## 6. Local static assets (`src/assets/img`, ~13MB)

| Finding | Detail | Severity |
|---|---|---|
| Oversized decorative backgrounds | `shape/04.png` = 1.19MB, `shape/02.png` = 1.16MB, applied via CSS `background-image` (`src/assets/css/style.css:2511, 3344, 3806`) — CSS backgrounds have **no lazy-loading**, they download unconditionally whenever the element exists in the DOM | High |
| Dead hero assets | `hero/slider-1.jpg` … `slider-8.jpg` + `.webp` twins (3.3MB) — **zero references** anywhere in `src/`; hero now sources from Strapi | Low (bundle bloat only) |
| Dead team/video/service assets | `team/`, `video/`, `service/` folders (292KB + 260KB + 624KB) — unreferenced, content now comes from Strapi | Low |
| Orphaned `.jpg` twins of `.webp`-only images | e.g. `portfolio/01.jpg`–`09.jpg` (172-323KB each) where only the `.webp` is actually used | Low |
| No build-time image optimization | `angular.json:29-39` assets config is a plain glob-copy, no processing step; bundle budgets (`angular.json:51-61`, 2000kb warn / 5600kb error) cover JS only, not `assets/` | — |

**Fix:** replace the two oversized shape PNGs with optimized SVG/WebP (<50KB); delete `hero/`, `team/`, `video/`, `service/` and orphaned `.jpg` twins (~5MB+ dead weight in the deployed `dist/` bundle, currently 40MB).

---

## 7. Deployment/hosting notes

- `azure-pipelines.yml:1-21`: minimal CI (`npm install && npm run build` on `ubuntu-latest`, triggered on `main`) — no image-related build steps, no CDN wiring.
- Frontend is deployed via zip to what looks like **Hostinger shared hosting** (`hunterproperty-hostinger-deploy-*.zip`, Apache `.htaccess` present, not nginx).
- `public/.htaccess:16-24` sets 1-year `Expires` headers for `image/jpeg`, `image/png`, `image/svg+xml`, `image/webp`, fonts, CSS, JS — good, but this only covers the Angular app's *own* static assets on Apache; it has no effect on CMS/Cloudinary-hosted images (cross-origin, governed by Cloudinary's own caching, which is generally good by default).
- `public/robots.txt` (the one uncommitted change in git status) — unrelated to image performance, but noting it: the new content (seoptimer.com-generated) points to `www.hunterproperty.in/sitemap.xml` **without an `https://` scheme**, which is malformed; the old version correctly used the full absolute URL. Worth fixing for correctness, separately from this audit.

---

## 8. Prioritized fix list

| # | Finding | Severity | Fix | Effort |
|---|---|---|---|---|
| 1 | Every Strapi image uses raw original `.url`, never `formats.*` | **Critical** | Update `strapi.service.ts` `mediaUrl()`/`mediaUrls()` + all call sites to consume `formats.small/medium/large` and emit `srcset` | Medium |
| 2 | Cloudinary transform params never used | **High** | Rewrite `mediaUrl()` to inject `w_/q_auto/f_auto` into the Cloudinary URL — one file, fixes every image site-wide | **Low (do this first)** |
| 3 | Verify Strapi's Render hosting tier | Critical if free tier | Check Render dashboard plan; upgrade or add keep-alive ping if it spins down on idle | Low |
| 4 | No `width`/`height` on any `<img>` | High | Add explicit dimensions or `aspect-ratio` CSS everywhere | Medium |
| 5 | `shape/02.png` / `shape/04.png` (1.1-1.2MB CSS backgrounds) | High | Replace with optimized SVG/WebP under 50KB | Low |
| 6 | No client-side caching of Strapi responses | Medium | Add `shareReplay(1)` or a caching HTTP interceptor for stable content endpoints | Medium |
| 7 | 13 independent uncached homepage requests | Medium | Batch/dedupe requests, or at minimum cache per §6 | Medium |
| 8 | Carousels render all slides into DOM upfront | Medium | Mount only active(+adjacent) slide, or use lazy-render carousel option | Medium |
| 9 | No preconnect to `res.cloudinary.com` | Medium | Add `<link rel="preconnect">` in `index.html` | Trivial |
| 10 | Unmanaged `<img>` inside rich-text `[innerHTML]` content | Medium-High | Post-process rich text to inject `loading="lazy"`/`decoding="async"` before sanitizing | Low |
| 11 | Full-page blocking preloader + flat 1s post-navigation delay | Medium | Move to per-section skeletons; drop/shrink the fixed delay | Medium |
| 12 | ~5MB+ dead local image assets in `src/assets/img` | Low | Delete unreferenced `hero/`, `team/`, `video/`, `service/`, orphaned `.jpg` twins | Trivial |
| 13 | Inconsistent `.skel-img` shimmer usage | Low | Apply uniformly to all CMS-driven images | Trivial |
| — | `public/robots.txt` sitemap URL missing `https://` scheme | Low (not perf) | Restore absolute URL | Trivial |

**Recommended order of attack:** #2 (Cloudinary transform rewrite) first — single file, largest immediate impact on every image on the site — then #3 (verify Render tier, since a cold-start problem masks all other gains), then #1 (proper `formats`/`srcset` for a fully correct long-term fix), then #4/#5/#9/#12 (cheap, high-value cleanup), then #6/#7/#8/#10/#11 as a second pass.

---

## Key files referenced

- `src/app/shared/services/strapi.service.ts` — `mediaUrl()`/`mediaUrls()`, root cause of oversized images
- `src/app/shared/services/home-content.service.ts`
- `src/app/shared/services/service-content.service.ts`
- `src/app/app.component.ts` — preloader logic
- `src/app/components/homelayout/banner/banner.component.html` / `.ts`
- `src/app/components/content-detail/content-detail.component.html` / `.ts`
- `src/app/components/homelayout/homelayout.component.html`
- `src/index.html`
- `src/environments/environment.ts` / `environment.prod.ts`
- `src/styles.scss`, `src/assets/css/style.css`
- `angular.json`
- `cms/config/plugins.ts` / `middlewares.ts` / `server.ts` / `database.ts`
- `cms/package.json`
- `public/.htaccess`, `public/robots.txt`, `azure-pipelines.yml`
