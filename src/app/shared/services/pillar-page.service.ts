import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import {
  AccordionBlock,
  BannerBlock,
  ContentBlock,
  ContentSectionBlock,
  FaqItem,
  FaqsBlock,
  ImageBlock,
  PillarPage,
  QuickLinksBlock,
  VideoBlock
} from '../models/pillar-page.model';
import { QuickLinks, Seo } from '../models/service-content.model';
import { StrapiCollectionResponse, StrapiService } from './strapi.service';

const PILLAR_ENDPOINT = 'pillar-pages';

/**
 * Reads the Pillar Page collection — the standalone CMS record that holds a
 * category landing page's body copy, blocks and images, kept apart from
 * Service Content Category so editors never have to touch the taxonomy to
 * republish a page.
 *
 * The endpoint deep-populates server-side (see the CMS pillar-page
 * controller), so requests carry a filter and nothing else and media can't go
 * missing because a populate key drifted out of sync with the schema.
 */
@Injectable({ providedIn: 'root' })
export class PillarPageService {

  constructor(private strapi: StrapiService) {}

  private cache = new Map<string, Observable<StrapiCollectionResponse<any>>>();

  /**
   * The pillar page for a category, or undefined when the category has none —
   * callers fall back to rendering the category's own short description.
   * A CMS that predates this collection answers 403/404; that is the same
   * "no pillar page" outcome, not a broken page, so it resolves to undefined
   * rather than propagating.
   */
  getByCategorySlug(categorySlug: string): Observable<PillarPage | undefined> {
    const params = { 'filters[category][slug][$eq]': categorySlug };
    const key = JSON.stringify(params);
    if (!this.cache.has(key)) {
      this.cache.set(key, this.strapi.getCollection<any>(PILLAR_ENDPOINT, params).pipe(
        catchError(() => of({ data: [], meta: null } as StrapiCollectionResponse<any>)),
        shareReplay(1)
      ));
    }
    return this.cache.get(key)!.pipe(map(res => res.data?.[0] ? this.toPillarPage(res.data[0]) : undefined));
  }

  private toPillarPage(p: any): PillarPage {
    return {
      id: p.id,
      title: p.title,
      categorySlug: p.category?.slug,
      tagline: p.tagline,
      heading: p.heading,
      intro: p.intro,
      heroImage: this.strapi.mediaObj(p.heroImage, 'hero'),
      contentBlocks: (p.contentBlocks ?? []).map((b: any) => this.toBlock(b)).filter((b: ContentBlock | undefined): b is ContentBlock => !!b),
      quickLinks: this.toQuickLinks(p.quickLinks),
      showChildGuides: p.showChildGuides !== false,
      childGuidesTitle: p.childGuidesTitle,
      ctaHeading: p.ctaHeading,
      ctaText: p.ctaText,
      updatedAt: p.updatedAt,
      seo: this.toSeo(p.seo)
    };
  }

  /**
   * Dynamic-zone entries are keyed by `__component`. An unrecognised key means
   * the CMS gained a block this build doesn't render yet — skip it rather than
   * emitting an empty slot.
   */
  private toBlock(b: any): ContentBlock | undefined {
    switch (b?.__component) {
      case 'blocks.content-section':
        return {
          __component: 'blocks.content-section',
          id: b.id,
          title: b.title,
          body: b.body,
          image: this.strapi.mediaObj(b.image, 'content'),
          imagePosition: b.imagePosition ?? 'right'
        } as ContentSectionBlock;

      case 'blocks.image-block':
        return {
          __component: 'blocks.image-block',
          id: b.id,
          image: this.strapi.mediaObj(b.image, b.width === 'full' ? 'hero' : 'content'),
          altText: b.altText,
          caption: b.caption,
          width: b.width === 'full' ? 'full' : 'content'
        } as ImageBlock;

      case 'blocks.banner':
        return {
          __component: 'blocks.banner',
          id: b.id,
          title: b.title,
          subtitle: b.subtitle,
          image: this.strapi.mediaObj(b.image, 'hero'),
          ctaText: b.ctaText,
          ctaUrl: b.ctaUrl
        } as BannerBlock;

      case 'blocks.quick-links':
        return {
          __component: 'blocks.quick-links',
          id: b.id,
          mainTitle: b.mainTitle,
          items: (b.items ?? []).filter((i: any) => i?.label && i?.url).map((i: any) => ({ label: i.label, url: i.url }))
        } as QuickLinksBlock;

      case 'blocks.accordion':
        return { __component: 'blocks.accordion', id: b.id, title: b.title, items: this.toFaqItems(b.items) } as AccordionBlock;

      case 'blocks.faqs':
        return { __component: 'blocks.faqs', id: b.id, title: b.title, items: this.toFaqItems(b.items) } as FaqsBlock;

      case 'blocks.video-section':
        return {
          __component: 'blocks.video-section',
          id: b.id,
          title: b.title,
          videoUrl: b.videoUrl,
          thumbnail: this.strapi.mediaObj(b.thumbnail, 'content')
        } as VideoBlock;

      default:
        return undefined;
    }
  }

  private toFaqItems(items: any): FaqItem[] {
    return (items ?? [])
      .filter((i: any) => i?.question)
      .map((i: any) => ({ question: i.question, answer: i.answer ?? '' }));
  }

  private toQuickLinks(q: any): QuickLinks | undefined {
    const items = (q?.items ?? []).filter((i: any) => i?.label && i?.url).map((i: any) => ({ label: i.label, url: i.url }));
    if (!items.length) return undefined;
    return { mainTitle: q.mainTitle, items };
  }

  private toSeo(s: any): Seo | undefined {
    if (!s) return undefined;
    return {
      metaTitle: s.metaTitle,
      metaDescription: s.metaDescription,
      canonicalUrl: s.canonicalUrl,
      ogTitle: s.ogTitle,
      ogDescription: s.ogDescription,
      ogImage: this.strapi.mediaUrl(s.ogImage?.url, 'content'),
      noIndex: !!s.noIndex
    };
  }
}
