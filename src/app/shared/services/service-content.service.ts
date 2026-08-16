import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  MenuCategory,
  PagedResult,
  Seo,
  ServiceContentCategory,
  ServiceContentPage,
  ServiceContentPageSummary
} from '../models/service-content.model';
import { StrapiService } from './strapi.service';

const CATEGORY_ENDPOINT = 'service-content-categories';
const PAGE_ENDPOINT = 'service-content-pages';

@Injectable({
  providedIn: 'root'
})
export class ServiceContentService {

  constructor(private strapi: StrapiService) {}

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
    return this.strapi.getCollection<any>(CATEGORY_ENDPOINT, params)
      .pipe(map(res => res.data.map(c => ({
        ...this.toCategory(c),
        menuItems: (c.contentPages ?? []).map((p: any) => this.toPageSummary(p))
      }))));
  }

  getCategories(): Observable<ServiceContentCategory[]> {
    return this.strapi.getCollection<any>(CATEGORY_ENDPOINT, { sort: 'menuOrder:asc' })
      .pipe(map(res => res.data.map(c => this.toCategory(c))));
  }

  getCategoryBySlug(slug: string): Observable<ServiceContentCategory | undefined> {
    const params: Record<string, string> = {
      'filters[slug][$eq]': slug,
      'populate[seo][populate][0]': 'ogImage'
    };
    return this.strapi.getCollection<any>(CATEGORY_ENDPOINT, params)
      .pipe(map(res => res.data[0] ? this.toCategory(res.data[0]) : undefined));
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
      'fields[3]': 'coverImage'
    };
    return this.strapi.getCollection<any>(PAGE_ENDPOINT, params).pipe(map(res => {
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
    const params: Record<string, string> = {
      'filters[category][slug][$eq]': categorySlug,
      'filters[slug][$eq]': contentSlug,
      'populate[category]': 'true',
      'populate[seo][populate][0]': 'ogImage'
    };
    return this.strapi.getCollection<any>(PAGE_ENDPOINT, params)
      .pipe(map(res => res.data[0] ? this.toPage(res.data[0]) : undefined));
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
      'fields[3]': 'coverImage'
    };
    return this.strapi.getCollection<any>(PAGE_ENDPOINT, params)
      .pipe(map(res => res.data.map(p => this.toPageSummary(p))));
  }

  getFeaturedContentPages(limit = 3): Observable<ServiceContentPage[]> {
    const params: Record<string, string> = {
      'filters[featured][$eq]': 'true',
      sort: 'publishedAt:desc',
      'pagination[limit]': String(limit),
      'populate[category]': 'true'
    };
    return this.strapi.getCollection<any>(PAGE_ENDPOINT, params)
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
      ogImage: this.strapi.mediaUrl(s.ogImage?.url),
      noIndex: !!s.noIndex
    };
  }

  private toCategory(c: any): ServiceContentCategory {
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      image: c.image,
      icon: c.icon,
      menuOrder: c.menuOrder ?? 0,
      seo: this.toSeo(c.seo)
    };
  }

  private toPageSummary(p: any): ServiceContentPageSummary {
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      coverImage: p.coverImage
    };
  }

  private toPage(p: any): ServiceContentPage {
    return {
      ...this.toPageSummary(p),
      content: p.content,
      category: this.toCategory(p.category),
      tags: p.tags ?? [],
      featured: !!p.featured,
      updatedAt: p.updatedAt,
      publishedAt: p.publishedAt,
      seo: this.toSeo(p.seo)
    };
  }
}
