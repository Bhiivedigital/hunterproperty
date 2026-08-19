import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

  private fetch<T>(endpoint: string, params: Record<string, string> = { populate: '*' }): Observable<T> {
    return this.strapi.getSingle<T>(endpoint, params).pipe(map(res => res.data));
  }

  private icon<T extends { icon?: any }>(item: T): T {
    return { ...item, icon: this.strapi.mediaUrl(item.icon?.url) };
  }

  getBanner(): Observable<HomeBanner> {
    return this.fetch<any>('home-banner', { 'populate[slides][populate]': 'backgroundImage' }).pipe(map(data => ({
      ...data,
      slides: (data.slides ?? []).map((s: any) => ({ backgroundImage: this.strapi.mediaUrl(s.backgroundImage?.url) }))
    })));
  }

  getAbout(): Observable<HomeAbout> {
    return this.fetch<any>('home-about').pipe(map(data => ({
      ...data,
      image1: this.strapi.mediaUrl(data.image1?.url),
      image2: this.strapi.mediaUrl(data.image2?.url)
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
        image: this.strapi.mediaUrl(i.image?.url),
        icon: this.strapi.mediaUrl(i.icon?.url)
      }))
    })));
  }

  getSkills(): Observable<HomeSkills> {
    return this.fetch<any>('home-skills').pipe(map(data => ({
      ...data,
      image: this.strapi.mediaUrl(data.image?.url)
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
      members: (data.members ?? []).map((m: any) => ({ ...m, photo: this.strapi.mediaUrl(m.photo?.url) }))
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
      image1: this.strapi.mediaUrl(data.image1?.url),
      image2: this.strapi.mediaUrl(data.image2?.url),
      videoBgImage: this.strapi.mediaUrl(data.videoBgImage?.url),
      galleryImages: this.strapi.mediaUrls(data.galleryImages),
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
      images: this.strapi.mediaUrls(data.images)
    })));
  }

  getLogoSlider(): Observable<HomeLogoSlider> {
    return this.fetch<any>('home-logo-slider').pipe(map(data => ({
      ...data,
      logos: this.strapi.mediaUrls(data.logos)
    })));
  }

  getFaq(): Observable<HomeFaq> {
    return this.fetch<HomeFaq>('home-faq');
  }

  getTestimonials(): Observable<HomeTestimonials> {
    return this.fetch<any>('home-testimonials', { 'populate[items][populate]': 'authorImage' }).pipe(map(data => ({
      ...data,
      items: (data.items ?? []).map((i: any) => ({ ...i, authorImage: this.strapi.mediaUrl(i.authorImage?.url) }))
    })));
  }

  getAboutPage(): Observable<AboutPage> {
    return this.fetch<AboutPage>('about-page');
  }

  getServicesPage(): Observable<ServicesPage> {
    return this.fetch<ServicesPage>('services-page');
  }

  getPortfolioPage(): Observable<PortfolioPage> {
    return this.fetch<any>('portfolio-page').pipe(map(data => ({
      ...data,
      images: this.strapi.mediaUrls(data.images)
    })));
  }
}
