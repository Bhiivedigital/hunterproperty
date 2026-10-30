import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { StrapiService } from './strapi.service';
import { Area, AREAS, AREA_CATEGORY_SLUG } from '../seo/areas';

const PAGE_ENDPOINT = 'service-content-pages';

/**
 * The areas from shared/seo/areas.ts that have a published guide in the CMS.
 * Everything that links to an area page goes through here, so an area whose
 * page is not live yet is left out instead of becoming a broken link.
 */
@Injectable({ providedIn: 'root' })
export class AreaDirectoryService {

  private published$?: Observable<Area[]>;

  constructor(private strapi: StrapiService) {}

  getPublishedAreas(): Observable<Area[]> {
    if (!this.published$) {
      this.published$ = this.strapi.getCollection<{ slug: string }>(PAGE_ENDPOINT, {
        'filters[category][slug][$eq]': AREA_CATEGORY_SLUG,
        'fields[0]': 'slug',
        'pagination[pageSize]': '200'
      }).pipe(
        map(res => {
          const live = new Set(res.data.map(page => page.slug));
          return AREAS.filter(area => live.has(area.slug));
        }),
        shareReplay(1)
      );
    }
    return this.published$;
  }

  areaUrl(area: Area): string {
    return `/${AREA_CATEGORY_SLUG}/${area.slug}`;
  }
}
