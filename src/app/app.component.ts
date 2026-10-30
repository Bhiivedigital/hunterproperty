import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Event, NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet, RoutesRecognized } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { LeadPopupComponent } from './shared/lead-popup/lead-popup.component';
import { CommonModule, Location } from '@angular/common';
import { SeoService } from './shared/services/seo.service';
import { StructuredDataService } from './shared/services/structured-data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, LeadPopupComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent {
  title = 'hunterproperty';

  // Pages are prerendered, so the first view arrives as finished HTML and must
  // be visible immediately — a full-screen loader over it was what held
  // Largest Contentful Paint back to 15s+ on mobile. The loader only covers
  // client-side route changes, where the next page's CMS data is in flight.
  isLoading = false;
  private firstNavigationDone = false;

  constructor(private router: Router, private location: Location, private seo: SeoService, private structuredData: StructuredDataService) {
    this.structuredData.setSiteGraph();

    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart && this.firstNavigationDone) {
        this.isLoading = true;
      }

      // RoutesRecognized fires after redirects resolve but before the routed
      // component is constructed, so a page that sets its own SEO in ngOnInit
      // still wins — this only guarantees no page is ever left on index.html's
      // homepage canonical.
      if (event instanceof RoutesRecognized) {
        this.seo.applyRouteDefaults(event.urlAfterRedirects);
        this.structuredData.clearAll();
      }

      if (event instanceof NavigationEnd) {
        this.addTrailingSlash(event.urlAfterRedirects);
      }

      if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.firstNavigationDone = true;
        this.isLoading = false;
      }
    });
  }

  private addTrailingSlash(url: string): void {
    const match = url.match(/^([^?#]*)([?#].*)?$/);
    if (!match) {
      return;
    }
    const [, path, rest] = match;
    if (path === '/' || path.endsWith('/')) {
      return;
    }
    this.location.replaceState(`${path}/${rest ?? ''}`);
  }
}
