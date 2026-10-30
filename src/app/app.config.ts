import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, UrlSerializer, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { TrailingSlashUrlSerializer } from './shared/trailing-slash-url-serializer';
import { loadingInterceptor } from './shared/interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Every page is prerendered at build time, so the browser receives the
    // finished HTML and hydrates it instead of rendering from an empty shell.
    // The HTTP transfer cache (on by default) inlines the CMS responses used
    // during prerender, so hydration does not re-request them from Strapi.
    provideClientHydration(withEventReplay()),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideAnimations(),
    provideHttpClient(withFetch(), withInterceptors([loadingInterceptor])),
    { provide: UrlSerializer, useClass: TrailingSlashUrlSerializer }
  ]
};
