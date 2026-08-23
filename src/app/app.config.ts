import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, UrlSerializer } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { TrailingSlashUrlSerializer } from './shared/trailing-slash-url-serializer';
import { loadingInterceptor } from './shared/interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withFetch(), withInterceptors([loadingInterceptor])),
    { provide: UrlSerializer, useClass: TrailingSlashUrlSerializer }
  ]
};
