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

  private fetch<T>(endpoint: string): Observable<T> {
    return this.strapi.getSingle<T>(endpoint, { populate: '*' }).pipe(map(res => res.data));
  }

  getBanner(): Observable<HomeBanner> {
    return this.fetch<HomeBanner>('home-banner');
  }

  getAbout(): Observable<HomeAbout> {
    return this.fetch<HomeAbout>('home-about');
  }

  getFeatures(): Observable<HomeFeatures> {
    return this.fetch<HomeFeatures>('home-features');
  }

  getServices(): Observable<HomeServices> {
    return this.fetch<HomeServices>('home-services');
  }

  getSkills(): Observable<HomeSkills> {
    return this.fetch<HomeSkills>('home-skills');
  }

  getStats(): Observable<HomeStats> {
    return this.fetch<HomeStats>('home-stats');
  }

  getTeam(): Observable<HomeTeam> {
    return this.fetch<HomeTeam>('home-team');
  }

  getWhyChooseUs(): Observable<HomeWhyChooseUs> {
    return this.fetch<HomeWhyChooseUs>('home-why-choose-us');
  }

  getWorkingProcess(): Observable<HomeWorkingProcess> {
    return this.fetch<HomeWorkingProcess>('home-working-process');
  }

  getHomePortfolio(): Observable<HomePortfolio> {
    return this.fetch<HomePortfolio>('home-portfolio');
  }

  getLogoSlider(): Observable<HomeLogoSlider> {
    return this.fetch<HomeLogoSlider>('home-logo-slider');
  }

  getFaq(): Observable<HomeFaq> {
    return this.fetch<HomeFaq>('home-faq');
  }

  getTestimonials(): Observable<HomeTestimonials> {
    return this.fetch<HomeTestimonials>('home-testimonials');
  }

  getAboutPage(): Observable<AboutPage> {
    return this.fetch<AboutPage>('about-page');
  }

  getServicesPage(): Observable<ServicesPage> {
    return this.fetch<ServicesPage>('services-page');
  }

  getPortfolioPage(): Observable<PortfolioPage> {
    return this.fetch<PortfolioPage>('portfolio-page');
  }
}
