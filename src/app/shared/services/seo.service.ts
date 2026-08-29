import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Seo } from '../models/service-content.model';
import staticRouteSeo from '../seo/static-route-seo.json';

export interface PageSeoInput {
  path: string;
  title: string;
  description: string;
  image?: string;
  ogType?: 'website' | 'article';
  noIndex?: boolean;
  seo?: Seo;
}

interface StaticRouteSeo {
  title: string;
  description: string;
  /** Set only for pages that deliberately point elsewhere (e.g. /home duplicates /). */
  canonical?: string;
  noIndex?: boolean;
}

const SITE_URL = 'https://www.hunterproperty.in';
const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/img/logo/logo.png`;

// Same table `scripts/generate-static-seo.mjs` stamps into the pre-rendered
// HTML, so the tags a crawler sees in view-source and the tags Angular sets
// after hydration can't drift apart.
const STATIC_ROUTE_SEO = staticRouteSeo as unknown as Record<string, StaticRouteSeo | undefined>;

@Injectable({
  providedIn: 'root'
})
export class SeoService {

  constructor(
    private titleService: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  /**
   * Baseline SEO for whichever URL the router just recognised, applied before
   * the routed component is even constructed. Without this, every page that
   * doesn't call setSeo() itself (home, about, services, portfolio, contact,
   * the legal pages) kept index.html's hard-coded homepage canonical, which is
   * what made Search Console treat them as duplicates of "/". Components with
   * CMS-backed metadata still call setSeo() afterwards and override the title
   * and description — the canonical is derived from the URL either way, so it
   * is correct from the first paint.
   */
  applyRouteDefaults(url: string): void {
    const path = url.split('#')[0].split('?')[0] || '/';
    const key = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
    const entry = STATIC_ROUTE_SEO[key];
    const fallback = STATIC_ROUTE_SEO['/']!;

    this.setSeo({
      path,
      title: entry?.title ?? fallback.title,
      description: entry?.description ?? fallback.description,
      noIndex: entry?.noIndex,
      seo: entry?.canonical ? { canonicalUrl: this.absoluteUrl(entry.canonical) } : undefined
    });
  }

  setSeo(input: PageSeoInput): void {
    const title = input.seo?.metaTitle || input.title;
    const description = input.seo?.metaDescription || input.description;
    const ogTitle = input.seo?.ogTitle || title;
    const ogDescription = input.seo?.ogDescription || description;
    const ogImage = input.seo?.ogImage || input.image || DEFAULT_OG_IMAGE;
    const canonical = input.seo?.canonicalUrl || this.absoluteUrl(input.path);
    const noIndex = input.seo?.noIndex ?? input.noIndex ?? false;

    this.titleService.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: ogTitle });
    this.meta.updateTag({ property: 'og:description', content: ogDescription });
    this.meta.updateTag({ property: 'og:image', content: ogImage });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    this.meta.updateTag({ property: 'og:type', content: input.ogType ?? 'website' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: ogTitle });
    this.meta.updateTag({ name: 'twitter:description', content: ogDescription });
    this.meta.updateTag({ name: 'twitter:image', content: ogImage });
    this.meta.updateTag({ name: 'robots', content: noIndex ? 'noindex, follow' : 'index, follow' });

    this.setCanonicalLink(canonical);
  }

  private absoluteUrl(path: string): string {
    const normalized = path.endsWith('/') ? path : `${path}/`;
    return `${SITE_URL}${normalized}`;
  }

  private setCanonicalLink(url: string): void {
    let link: HTMLLinkElement | null = this.doc.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
