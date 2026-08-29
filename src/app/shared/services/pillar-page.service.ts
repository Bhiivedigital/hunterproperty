import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { ContentBlocksPosition, FeaturedImagePosition, PillarPage } from '../models/pillar-page.model';
import { QuickLinks, Seo } from '../models/service-content.model';
import { ContentBlockMapperService } from './content-block-mapper.service';
import { StrapiCollectionResponse, StrapiService } from './strapi.service';

const PILLAR_ENDPOINT = 'pillar-pages';

const FEATURED_IMAGE_POSITIONS: FeaturedImagePosition[] = ['top', 'below-intro', 'below-content'];
const CONTENT_BLOCKS_POSITIONS: ContentBlocksPosition[] = ['below-content', 'above-content'];

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

  constructor(
    private strapi: StrapiService,
    private blocks: ContentBlockMapperService
  ) {}

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
      content: p.content,
      heroImage: this.strapi.mediaObj(p.heroImage, 'hero'),
      featuredImage: this.strapi.mediaObj(p.featuredImage, 'content'),
      // A CMS that predates the field sends nothing back; the image belongs at
      // the top of the article, which is where it was asked for, so that — not
      // "wherever it used to land" — is the default.
      featuredImagePosition: FEATURED_IMAGE_POSITIONS.includes(p.featuredImagePosition)
        ? p.featuredImagePosition
        : 'top',
      contentBlocks: this.blocks.toBlocks(p.contentBlocks),
      // Unset on a CMS that predates the field — which is every CMS this has
      // shipped against so far, so this fallback is what editors actually see.
      // An image block dropped at the end of a long page reads as an orphan
      // banner under the copy, so lead with the zone instead: it opens the
      // article, which is where an editor who added one image expects it.
      contentBlocksPosition: CONTENT_BLOCKS_POSITIONS.includes(p.contentBlocksPosition)
        ? p.contentBlocksPosition
        : 'above-content',
      quickLinks: this.toQuickLinks(p.quickLinks),
      showChildGuides: p.showChildGuides !== false,
      childGuidesTitle: p.childGuidesTitle,
      ctaHeading: p.ctaHeading,
      ctaText: p.ctaText,
      updatedAt: p.updatedAt,
      seo: this.toSeo(p.seo)
    };
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
