import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Seo } from '../models/service-content.model';

export interface PageSeoInput {
  path: string;
  title: string;
  description: string;
  image?: string;
  noIndex?: boolean;
  seo?: Seo;
}

const SITE_URL = 'https://www.hunterproperty.in';
const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/img/logo/logo.png`;

@Injectable({
  providedIn: 'root'
})
export class SeoService {

  constructor(
    private titleService: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  setSeo(input: PageSeoInput): void {
    const title = input.seo?.metaTitle || input.title;
    const description = input.seo?.metaDescription || input.description;
    const ogTitle = input.seo?.ogTitle || title;
    const ogDescription = input.seo?.ogDescription || description;
    const ogImage = input.seo?.ogImage || input.image || DEFAULT_OG_IMAGE;
    const canonical = input.seo?.canonicalUrl || `${SITE_URL}${input.path}`;
    const noIndex = input.seo?.noIndex ?? input.noIndex ?? false;

    this.titleService.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: ogTitle });
    this.meta.updateTag({ property: 'og:description', content: ogDescription });
    this.meta.updateTag({ property: 'og:image', content: ogImage });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    this.meta.updateTag({ property: 'og:type', content: 'article' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: ogTitle });
    this.meta.updateTag({ name: 'twitter:description', content: ogDescription });
    this.meta.updateTag({ name: 'twitter:image', content: ogImage });
    this.meta.updateTag({ name: 'robots', content: noIndex ? 'noindex, follow' : 'index, follow' });

    this.setCanonicalLink(canonical);
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
