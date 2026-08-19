import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  constructor(private http: HttpClient) {}

  getCollection<T>(endpoint: string, params?: Record<string, string>): Observable<StrapiCollectionResponse<T>> {
    return this.http.get<StrapiCollectionResponse<T>>(`${this.baseUrl}/api/${endpoint}`, { params });
  }

  getSingle<T>(endpoint: string, params?: Record<string, string>): Observable<StrapiSingleResponse<T>> {
    return this.http.get<StrapiSingleResponse<T>>(`${this.baseUrl}/api/${endpoint}`, { params });
  }

  post<T>(endpoint: string, data: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/api/${endpoint}`, { data });
  }

  mediaUrl(url: string | undefined | null): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `${this.baseUrl}${url}`;
  }

  mediaUrls(media: Array<{ url?: string } | null | undefined> | undefined | null): string[] {
    return (media ?? []).map(m => this.mediaUrl(m?.url)).filter(Boolean);
  }
}
