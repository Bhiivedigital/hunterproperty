import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

const SITE_URL = 'https://www.hunterproperty.in';

@Injectable({
  providedIn: 'root'
})
export class StructuredDataService {

  constructor(@Inject(DOCUMENT) private doc: Document) {}

  setBreadcrumb(items: BreadcrumbItem[]): void {
    this.setJsonLd('breadcrumb', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: `${SITE_URL}${item.url}`
      }))
    });
  }

  setArticle(input: { headline: string; description: string; image?: string; datePublished?: string; dateModified?: string; url: string }): void {
    this.setJsonLd('article', {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: input.headline,
      description: input.description,
      image: input.image ? [input.image] : undefined,
      datePublished: input.datePublished,
      dateModified: input.dateModified || input.datePublished,
      mainEntityOfPage: `${SITE_URL}${input.url}`,
      publisher: { '@type': 'Organization', name: 'Hunter Property', url: SITE_URL }
    });
  }

  setService(input: { name: string; description: string; url: string; areaServed?: string }): void {
    this.setJsonLd('service', {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: input.name,
      description: input.description,
      url: `${SITE_URL}${input.url}`,
      areaServed: input.areaServed || 'Chennai, Tamil Nadu',
      provider: { '@type': 'Organization', name: 'Hunter Property', url: SITE_URL }
    });
  }

  /** Removes an entity's script (e.g. when a page has no article/service to describe). */
  clear(kind: 'breadcrumb' | 'article' | 'service'): void {
    this.doc.getElementById(this.scriptId(kind))?.remove();
  }

  clearAll(): void {
    (['breadcrumb', 'article', 'service'] as const).forEach(kind => this.clear(kind));
  }

  private setJsonLd(kind: 'breadcrumb' | 'article' | 'service', data: unknown): void {
    this.clear(kind);
    const script = this.doc.createElement('script');
    script.type = 'application/ld+json';
    script.id = this.scriptId(kind);
    script.text = JSON.stringify(data);
    this.doc.head.appendChild(script);
  }

  private scriptId(kind: string): string {
    return `structured-data-${kind}`;
  }
}
