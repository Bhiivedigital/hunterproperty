import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ImageOptimizationService, ImagePurpose } from './image-optimization.service';
import { CmsImage } from '../models/cms-image.model';

interface StrapiMedia {
  url?: string;
  width?: number;
  height?: number;
}

export interface StrapiCollectionResponse<T> {
  data: T[];
  meta: unknown;
}

export interface StrapiSingleResponse<T> {
  data: T;
  meta: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class StrapiService {
  private readonly baseUrl = environment.strapiUrl;

  constructor(private http: HttpClient, private imageOpt: ImageOptimizationService) {}

  private toAbsolute(url: string): string {
    return url.startsWith('http') ? url : `${this.baseUrl}${url}`;
  }

  getCollection<T>(endpoint: string, params?: Record<string, string>): Observable<StrapiCollectionResponse<T>> {
    return this.http.get<StrapiCollectionResponse<T>>(`${this.baseUrl}/api/${endpoint}`, { params });
  }

  getSingle<T>(endpoint: string, params?: Record<string, string>): Observable<StrapiSingleResponse<T>> {
    return this.http.get<StrapiSingleResponse<T>>(`${this.baseUrl}/api/${endpoint}`, { params });
  }

  post<T>(endpoint: string, data: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/api/${endpoint}`, { data });
  }

  /** Plain optimized URL — for icons/logos and other non-`<img>` uses (e.g. og:image) that don't need width/height. */
  mediaUrl(url: string | undefined | null, purpose: ImagePurpose): string {
    if (!url) return '';
    return this.imageOpt.getUrlForPurpose(this.toAbsolute(url), purpose);
  }

  mediaUrls(media: Array<{ url?: string } | null | undefined> | undefined | null, purpose: ImagePurpose): string[] {
    return (media ?? []).map(m => this.mediaUrl(m?.url, purpose)).filter(Boolean);
  }

  /** Optimized URL plus the upload's real width/height, for `<img>` elements that need CLS-safe dimensions. */
  mediaObj(media: StrapiMedia | null | undefined, purpose: ImagePurpose): CmsImage {
    if (!media?.url) return { url: '', width: 0, height: 0 };
    return {
      url: this.imageOpt.getUrlForPurpose(this.toAbsolute(media.url), purpose),
      width: media.width ?? 0,
      height: media.height ?? 0
    };
  }

  mediaObjs(media: Array<StrapiMedia | null | undefined> | undefined | null, purpose: ImagePurpose): CmsImage[] {
    return (media ?? []).map(m => this.mediaObj(m, purpose)).filter(m => !!m.url);
  }
}
