import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import {
  CoverImagePosition,
  MenuCategory,
  PagedResult,
  Seo,
  ServiceContentCategory,
  QuickLinks,
  ServiceContentPage,
  ServiceContentPageSummary
} from '../models/service-content.model';
import { ContentBlocksPosition } from '../models/pillar-page.model';
import { ContentBlockMapperService } from './content-block-mapper.service';
import { StrapiCollectionResponse, StrapiService } from './strapi.service';

/**
 * Every media field a content page's dynamic zone can hang an image off. A
 * dynamic zone returns bare component data unless each component is named, so
 * an Image Block an editor placed mid-article comes back with no `image` at
 * all when this is missing — which is why those blocks rendered as nothing.
 */
const CONTENT_BLOCK_POPULATE: Record<string, string> = {
  'populate[contentBlocks][on][blocks.content-section][populate][image]': 'true',
  'populate[contentBlocks][on][blocks.image-block][populate][image]': 'true',
  'populate[contentBlocks][on][blocks.banner][populate][image]': 'true',
  'populate[contentBlocks][on][blocks.video-section][populate][thumbnail]': 'true',
  'populate[contentBlocks][on][blocks.quick-links][populate][items]': 'true',
  'populate[contentBlocks][on][blocks.accordion][populate][items]': 'true',
  'populate[contentBlocks][on][blocks.faqs][populate][items]': 'true'
};

const CATEGORY_ENDPOINT = 'service-content-categories';
const PAGE_ENDPOINT = 'service-content-pages';

const COVER_IMAGE_POSITIONS: CoverImagePosition[] = ['top', 'below-title', 'below-content', 'hidden'];
const CONTENT_BLOCKS_POSITIONS: ContentBlocksPosition[] = ['below-content', 'above-content'];

@Injectable({
  providedIn: 'root'
})
export class ServiceContentService {

  constructor(
    private strapi: StrapiService,
    private blocks: ContentBlockMapperService
  ) {}

  // Same rationale as HomeContentService.fetch — categories/menu/featured
  // guides are requested repeatedly (header mega-menu, every category page,
  // the homepage) and rarely change; cache per endpoint+params combination.
  private collectionCache = new Map<string, Observable<StrapiCollectionResponse<any>>>();

  private fetchCollection<T>(endpoint: string, params: Record<string, string>): Observable<StrapiCollectionResponse<T>> {
    const key = endpoint + JSON.stringify(params);
    if (!this.collectionCache.has(key)) {
      this.collectionCache.set(key, this.strapi.getCollection<T>(endpoint, params).pipe(shareReplay(1)));
    }
    return this.collectionCache.get(key)!;
  }

  /** Categories + a curated set of their menu-flagged content pages, in a single request, for the header mega-menu. */
  getMenuCategories(): Observable<MenuCategory[]> {
    const params: Record<string, string> = {
      sort: 'menuOrder:asc',
      'filters[showInMenu][$eq]': 'true',
      'fields[0]': 'name',
      'fields[1]': 'slug',
      'fields[2]': 'icon',
      'fields[3]': 'menuOrder',
      'populate[contentPages][filters][showInMenu][$eq]': 'true',
      'populate[contentPages][sort]': 'menuOrder:asc',
      'populate[contentPages][fields][0]': 'title',
      'populate[contentPages][fields][1]': 'slug'
    };
    return this.fetchCollection<any>(CATEGORY_ENDPOINT, params)
      .pipe(map(res => res.data.map(c => ({
        ...this.toCategory(c),
        menuItems: (c.contentPages ?? []).map((p: any) => this.toPageSummary(p))
      }))));
  }

  getCategories(): Observable<ServiceContentCategory[]> {
    const params: Record<string, string> = {
      sort: 'menuOrder:asc',
      'populate[image]': 'true'
    };
    return this.fetchCollection<any>(CATEGORY_ENDPOINT, params)
      .pipe(map(res => res.data.map(c => this.toCategory(c))));
  }

  getCategoryBySlug(slug: string): Observable<ServiceContentCategory | undefined> {
    const baseParams: Record<string, string> = {
      'filters[slug][$eq]': slug,
      'populate[image]': 'true',
      'populate[seo][populate][0]': 'ogImage'
    };
    const params: Record<string, string> = {
      ...baseParams,
      'populate[quickLinks][populate][0]': 'items'
    };
    // Strapi rejects the whole query with a 400 ("Invalid key quickLinks") when
    // the running CMS predates the category quickLinks field, so a front-end
    // deploy that lands before the CMS one would blank every category page.
    // Fall back to the same request without that populate.
    return this.fetchCollection<any>(CATEGORY_ENDPOINT, params)
      .pipe(
        catchError(() => this.fetchCollection<any>(CATEGORY_ENDPOINT, baseParams)),
        map(res => res.data[0] ? this.toCategory(res.data[0]) : undefined)
      );
  }

  getContentPagesByCategory(categorySlug: string, page = 1, pageSize = 9): Observable<PagedResult<ServiceContentPageSummary>> {
    const params: Record<string, string> = {
      'filters[category][slug][$eq]': categorySlug,
      sort: 'publishedAt:desc',
      'pagination[page]': String(page),
      'pagination[pageSize]': String(pageSize),
      'fields[0]': 'title',
      'fields[1]': 'slug',
      'fields[2]': 'excerpt',
      'populate[coverImage]': 'true'
    };
    return this.fetchCollection<any>(PAGE_ENDPOINT, params).pipe(map(res => {
      const pagination = (res.meta as any)?.pagination ?? { page, pageCount: 1, total: res.data.length };
      return {
        items: res.data.map(p => this.toPageSummary(p)),
        page: pagination.page,
        pageCount: pagination.pageCount,
        total: pagination.total
      };
    }));
  }

  getContentPageByCategoryAndSlug(categorySlug: string, contentSlug: string): Observable<ServiceContentPage | undefined> {
    const baseParams: Record<string, string> = {
      'filters[category][slug][$eq]': categorySlug,
      'filters[slug][$eq]': contentSlug,
      'populate[category]': 'true',
      'populate[coverImage]': 'true',
      'populate[quickLinks][populate][0]': 'items',
      'populate[seo][populate][0]': 'ogImage'
    };
    const params: Record<string, string> = {
      ...baseParams,
      'populate[image]': 'true',
      'populate[mobileImage]': 'true',
      'populate[topLevelImages]': 'true',
      ...CONTENT_BLOCK_POPULATE
    };
    // Same guard as getCategoryBySlug: Strapi answers 400 for the whole query
    // if the running CMS predates any key named here, which would blank the
    // article rather than just its blocks. Retry with the fields that have
    // always existed so a front-end deploy can land ahead of the CMS one.
    return this.fetchCollection<any>(PAGE_ENDPOINT, params)
      .pipe(
        catchError(() => this.fetchCollection<any>(PAGE_ENDPOINT, baseParams)),
        map(res => res.data[0] ? this.toPage(res.data[0]) : undefined)
      );
  }

  getRelatedContentPages(categorySlug: string, excludeSlug: string, limit = 3): Observable<ServiceContentPageSummary[]> {
    const params: Record<string, string> = {
      'filters[category][slug][$eq]': categorySlug,
      'filters[slug][$ne]': excludeSlug,
      sort: 'publishedAt:desc',
      'pagination[limit]': String(limit),
      'fields[0]': 'title',
      'fields[1]': 'slug',
      'fields[2]': 'excerpt',
      'populate[coverImage]': 'true'
    };
    return this.fetchCollection<any>(PAGE_ENDPOINT, params)
      .pipe(map(res => res.data.map(p => this.toPageSummary(p))));
  }

  getFeaturedContentPages(limit = 3): Observable<ServiceContentPage[]> {
    const params: Record<string, string> = {
      'filters[featured][$eq]': 'true',
      sort: 'publishedAt:desc',
      'pagination[limit]': String(limit),
      'populate[category]': 'true',
      'populate[coverImage]': 'true'
    };
    return this.fetchCollection<any>(PAGE_ENDPOINT, params)
      .pipe(map(res => res.data.map(p => this.toPage(p))));
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

  private toQuickLinks(q: any): QuickLinks | undefined {
    const items = (q?.items ?? [])
      .filter((i: any) => i?.label && i?.url)
      .map((i: any) => ({ label: i.label, url: i.url }));
    if (!items.length) return undefined;
    return { mainTitle: q.mainTitle, items };
  }

  private toCategory(c: any): ServiceContentCategory {
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      image: this.strapi.mediaObj(c.image, 'card'),
      icon: c.icon,
      menuOrder: c.menuOrder ?? 0,
      quickLinks: this.toQuickLinks(c.quickLinks),
      seo: this.toSeo(c.seo)
    };
  }

  private toPageSummary(p: any): ServiceContentPageSummary {
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      coverImage: this.strapi.mediaObj(p.coverImage, 'card')
    };
  }

  private toPage(p: any): ServiceContentPage {
    const summary = this.toPageSummary(p);
    return {
      ...summary,
      // `image` is the second single-image field on the content type. Editors
      // have been filling either one, so treat it as an alternative cover
      // rather than leaving whichever they picked unrendered.
      coverImage: summary.coverImage?.url ? summary.coverImage : this.strapi.mediaObj(p.image, 'card'),
      mobileImage: this.strapi.mediaObj(p.mobileImage, 'card'),
      topLevelImages: this.strapi.mediaObjs(p.topLevelImages, 'card'),
      coverImagePosition: COVER_IMAGE_POSITIONS.includes(p.coverImagePosition) ? p.coverImagePosition : 'top',
      contentBlocks: this.blocks.toBlocks(p.contentBlocks),
      // Same default as the pillar page: with no position stored, the zone
      // opens the article rather than trailing it.
      contentBlocksPosition: CONTENT_BLOCKS_POSITIONS.includes(p.contentBlocksPosition)
        ? p.contentBlocksPosition
        : 'above-content',
      content: p.content,
      category: this.toCategory(p.category),
      tags: p.tags ?? [],
      featured: !!p.featured,
      quickLinks: this.toQuickLinks(p.quickLinks),
      updatedAt: p.updatedAt,
      publishedAt: p.publishedAt,
      seo: this.toSeo(p.seo)
    };
  }
}
