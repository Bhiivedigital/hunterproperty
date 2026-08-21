import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { StrapiService } from './strapi.service';
import {
  AboutPage,
  HomeAbout,
  HomeBanner,
  HomeFaq,
  HomeFeatures,
  HomeLogoSlider,
  HomePortfolio,
  HomeServices,
  HomeSkills,
  HomeStats,
  HomeTeam,
  HomeTestimonials,
  HomeWhyChooseUs,
  HomeWorkingProcess,
  PortfolioPage,
  ServicesPage
} from '../models/home-content.model';

@Injectable({
  providedIn: 'root'
})
export class HomeContentService {

  constructor(private strapi: StrapiService) {}

  // These singletons rarely change during a session, and the homepage alone
  // fires 13 of them in parallel on every load/navigation — cache each
  // endpoint+params combination for the app's lifetime so repeat visits to
  // the same page (or navigating back to it) don't re-fetch from Strapi.
  private requestCache = new Map<string, Observable<any>>();

  private fetch<T>(endpoint: string, params: Record<string, string> = { populate: '*' }): Observable<T> {
    const key = endpoint + JSON.stringify(params);
    if (!this.requestCache.has(key)) {
      this.requestCache.set(key, this.strapi.getSingle<T>(endpoint, params).pipe(map(res => res.data), shareReplay(1)));
    }
    return this.requestCache.get(key)!;
  }

  private icon<T extends { icon?: any }>(item: T): T {
    return { ...item, icon: this.strapi.mediaUrl(item.icon?.url, 'icon') };
  }

  getBanner(): Observable<HomeBanner> {
    return this.fetch<any>('home-banner', { 'populate[slides][populate]': 'backgroundImage' }).pipe(map(data => ({
      ...data,
      // Slides whose media relation is missing/unpublished in Strapi resolve
      // to an empty URL — drop them instead of rendering a blank/broken
      // carousel slide with no image.
      slides: (data.slides ?? [])
        .map((s: any) => ({ backgroundImage: this.strapi.mediaObj(s.backgroundImage, 'hero') }))
        .filter((s: { backgroundImage: { url: string } }) => !!s.backgroundImage.url)
    })));
  }

  getAbout(): Observable<HomeAbout> {
    return this.fetch<any>('home-about').pipe(map(data => ({
      ...data,
      image1: this.strapi.mediaObj(data.image1, 'content'),
      image2: this.strapi.mediaObj(data.image2, 'content')
    })));
  }

  getFeatures(): Observable<HomeFeatures> {
    return this.fetch<any>('home-features', { 'populate[items][populate]': 'icon' }).pipe(map(data => ({
      ...data,
      items: (data.items ?? []).map((i: any) => this.icon(i))
    })));
  }

  getServices(): Observable<HomeServices> {
    return this.fetch<any>('home-services', {
      'populate[items][populate][0]': 'image',
      'populate[items][populate][1]': 'icon'
    }).pipe(map(data => ({
      ...data,
      items: (data.items ?? []).map((i: any) => ({
        ...i,
        image: this.strapi.mediaObj(i.image, 'card'),
        icon: this.strapi.mediaUrl(i.icon?.url, 'icon')
      }))
    })));
  }

  getSkills(): Observable<HomeSkills> {
    return this.fetch<any>('home-skills').pipe(map(data => ({
      ...data,
      image: this.strapi.mediaObj(data.image, 'content')
    })));
  }

  getStats(): Observable<HomeStats> {
    return this.fetch<any>('home-stats', { 'populate[stats][populate]': 'icon' }).pipe(map(data => ({
      ...data,
      stats: (data.stats ?? []).map((s: any) => this.icon(s))
    })));
  }

  getTeam(): Observable<HomeTeam> {
    return this.fetch<any>('home-team', { 'populate[members][populate]': 'photo' }).pipe(map(data => ({
      ...data,
      members: (data.members ?? []).map((m: any) => ({ ...m, photo: this.strapi.mediaObj(m.photo, 'thumbnail') }))
    })));
  }

  getWhyChooseUs(): Observable<HomeWhyChooseUs> {
    return this.fetch<any>('home-why-choose-us', {
      'populate[image1]': 'true',
      'populate[image2]': 'true',
      'populate[videoBgImage]': 'true',
      'populate[galleryImages]': 'true',
      'populate[items][populate]': 'icon'
    }).pipe(map(data => ({
      ...data,
      image1: this.strapi.mediaObj(data.image1, 'content'),
      image2: this.strapi.mediaObj(data.image2, 'content'),
      videoBgImage: this.strapi.mediaObj(data.videoBgImage, 'hero'),
      galleryImages: this.strapi.mediaObjs(data.galleryImages, 'thumbnail'),
      items: (data.items ?? []).map((i: any) => this.icon(i))
    })));
  }

  getWorkingProcess(): Observable<HomeWorkingProcess> {
    return this.fetch<any>('home-working-process', { 'populate[steps][populate]': 'icon' }).pipe(map(data => ({
      ...data,
      steps: (data.steps ?? []).map((s: any) => this.icon(s))
    })));
  }

  getHomePortfolio(): Observable<HomePortfolio> {
    return this.fetch<any>('home-portfolio').pipe(map(data => ({
      ...data,
      images: this.strapi.mediaObjs(data.images, 'card')
    })));
  }

  getLogoSlider(): Observable<HomeLogoSlider> {
    return this.fetch<any>('home-logo-slider').pipe(map(data => ({
      ...data,
      logos: this.strapi.mediaUrls(data.logos, 'thumbnail')
    })));
  }

  getFaq(): Observable<HomeFaq> {
    return this.fetch<HomeFaq>('home-faq');
  }

  getTestimonials(): Observable<HomeTestimonials> {
    return this.fetch<any>('home-testimonials', { 'populate[items][populate]': 'authorImage' }).pipe(map(data => ({
      ...data,
      items: (data.items ?? []).map((i: any) => ({ ...i, authorImage: this.strapi.mediaObj(i.authorImage, 'thumbnail') }))
    })));
  }

  getAboutPage(): Observable<AboutPage> {
    return this.fetch<AboutPage>('about-page');
  }

  getServicesPage(): Observable<ServicesPage> {
    return this.fetch<any>('services-page').pipe(map(data => ({
      ...data,
      items: (data.items ?? []).map((i: any) => ({
        ...i,
        image: this.strapi.mediaObj(i.image, 'card'),
        icon: this.strapi.mediaUrl(i.icon?.url, 'icon')
      }))
    })));
  }

  getPortfolioPage(): Observable<PortfolioPage> {
    return this.fetch<any>('portfolio-page').pipe(map(data => ({
      ...data,
      images: this.strapi.mediaObjs(data.images, 'card')
    })));
  }
}
