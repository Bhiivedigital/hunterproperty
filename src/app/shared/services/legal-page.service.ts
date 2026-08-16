import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LegalPage } from '../models/legal-page.model';
import { StrapiService } from './strapi.service';

@Injectable({
  providedIn: 'root'
})
export class LegalPageService {

  constructor(private strapi: StrapiService) {}

  getPageBySlug(slug: string): Observable<LegalPage | undefined> {
    return this.strapi.getCollection<any>('legal-pages', { 'filters[slug][$eq]': slug })
      .pipe(map(res => {
        const p = res.data[0];
        return p ? { id: p.id, title: p.title, slug: p.slug, updatedDate: p.updatedAt, content: p.content } : undefined;
      }));
  }
}
