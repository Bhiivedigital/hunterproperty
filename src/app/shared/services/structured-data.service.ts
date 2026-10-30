import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { BUSINESS, PACKAGES, SITE_URL } from '../seo/business';
import { Area } from '../seo/areas';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FaqEntry {
  question: string;
  /** Plain text; markup is stripped before it reaches here. */
  answer: string;
}

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/** Per-page entities. `site` is written once and survives navigation. */
type PageKind = 'breadcrumb' | 'article' | 'service' | 'faq' | 'itemlist';
type Kind = PageKind | 'site';
const PAGE_KINDS: PageKind[] = ['breadcrumb', 'article', 'service', 'faq', 'itemlist'];

@Injectable({
  providedIn: 'root'
})
export class StructuredDataService {

  constructor(@Inject(DOCUMENT) private doc: Document) {}

  private absoluteUrl(path: string): string {
    const normalized = path.endsWith('/') ? path : `${path}/`;
    return `${SITE_URL}${normalized}`;
  }

  /**
   * WebSite plus the business itself, on every page. The business is a
   * GeneralContractor (a schema.org LocalBusiness type) with the head office
   * as its address and the branches as departments, so Google can tie the
   * website to the Business Profile and to the Chennai localities it serves.
   * No ratings: self-published review stars are ignored for local businesses
   * and can count against the site.
   */
  setSiteGraph(): void {
    const [head, ...branches] = BUSINESS.offices;
    const hours = {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: BUSINESS.openingHours.days,
      opens: BUSINESS.openingHours.opens,
      closes: BUSINESS.openingHours.closes
    };
    const address = (office: typeof head) => ({
      '@type': 'PostalAddress',
      streetAddress: office.streetAddress,
      addressLocality: office.locality,
      addressRegion: 'Tamil Nadu',
      postalCode: office.postalCode,
      addressCountry: 'IN'
    });

    this.setJsonLd('site', {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': WEBSITE_ID,
          name: BUSINESS.name,
          alternateName: ['HunterProperty', 'Hunter Property Chennai'],
          url: `${SITE_URL}/`,
          inLanguage: 'en-IN',
          publisher: { '@id': ORGANIZATION_ID }
        },
        {
          '@type': 'GeneralContractor',
          '@id': ORGANIZATION_ID,
          name: BUSINESS.name,
          legalName: BUSINESS.legalName,
          url: `${SITE_URL}/`,
          logo: BUSINESS.logo,
          image: BUSINESS.logo,
          telephone: BUSINESS.telephone,
          email: BUSINESS.email,
          priceRange: BUSINESS.priceRange,
          address: address(head),
          openingHoursSpecification: hours,
          areaServed: { '@type': 'City', name: 'Chennai', containedInPlace: { '@type': 'State', name: 'Tamil Nadu' } },
          knowsAbout: ['House construction', 'Building construction', 'Interior design', 'Home renovation', 'Joint development', 'Property legal services'],
          sameAs: BUSINESS.sameAs,
          department: branches.map(office => ({
            '@type': 'GeneralContractor',
            '@id': `${SITE_URL}/#office-${office.id}`,
            name: `${BUSINESS.name} – ${office.label}, ${office.area}`,
            telephone: BUSINESS.telephone,
            address: address(office),
            openingHoursSpecification: hours,
            parentOrganization: { '@id': ORGANIZATION_ID }
          }))
        }
      ]
    });
  }

  setBreadcrumb(items: BreadcrumbItem[]): void {
    this.setJsonLd('breadcrumb', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: this.absoluteUrl(item.url)
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
      mainEntityOfPage: this.absoluteUrl(input.url),
      author: { '@id': ORGANIZATION_ID },
      publisher: { '@id': ORGANIZATION_ID }
    });
  }

  setService(input: { name: string; description: string; url: string; serviceType?: string }): void {
    this.setJsonLd('service', {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: input.name,
      serviceType: input.serviceType || input.name,
      description: input.description,
      url: this.absoluteUrl(input.url),
      areaServed: { '@type': 'City', name: 'Chennai' },
      provider: { '@id': ORGANIZATION_ID }
    });
  }

  /** House construction offered in one Chennai locality, priced from the published packages. */
  setAreaService(area: Area, url: string): void {
    this.setJsonLd('service', {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: `House construction in ${area.name}, Chennai`,
      serviceType: 'House construction',
      url: this.absoluteUrl(url),
      provider: { '@id': ORGANIZATION_ID },
      areaServed: {
        '@type': 'Place',
        name: `${area.name}, Chennai`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: area.name,
          addressRegion: 'Tamil Nadu',
          postalCode: area.pincodes[0],
          addressCountry: 'IN'
        }
      },
      offers: PACKAGES.map(pkg => ({
        '@type': 'Offer',
        name: `${pkg.name} construction package`,
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: pkg.pricePerSqft,
          priceCurrency: 'INR',
          unitText: 'per sq ft'
        }
      }))
    });
  }

  setFaq(items: FaqEntry[]): void {
    if (!items.length) {
      this.clear('faq');
      return;
    }
    this.setJsonLd('faq', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer }
      }))
    });
  }

  setItemList(name: string, items: BreadcrumbItem[]): void {
    this.setJsonLd('itemlist', {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: this.absoluteUrl(item.url)
      }))
    });
  }

  /** Removes an entity's script (e.g. when a page has no article/service to describe). */
  clear(kind: Kind): void {
    this.doc.getElementById(this.scriptId(kind))?.remove();
  }

  /** Drops every per-page entity, so nothing carries over to the next route. */
  clearAll(): void {
    PAGE_KINDS.forEach(kind => this.clear(kind));
  }

  private setJsonLd(kind: Kind, data: unknown): void {
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
