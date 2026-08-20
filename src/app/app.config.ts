import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, UrlSerializer } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { TrailingSlashUrlSerializer } from './shared/trailing-slash-url-serializer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withFetch()),
    { provide: UrlSerializer, useClass: TrailingSlashUrlSerializer }
  ]
};
