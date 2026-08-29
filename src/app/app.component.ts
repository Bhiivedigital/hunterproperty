import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Event, NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet, RoutesRecognized } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { LeadPopupComponent } from './shared/lead-popup/lead-popup.component';
import { CommonModule, Location } from '@angular/common';
import { LoadingService } from './shared/services/loading.service';
import { SeoService } from './shared/services/seo.service';

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
  // Visible from boot — hidden once every <img> on the page has actually
  // loaded (or errored). window's native 'load' event does NOT work for
  // this: all homepage images come from Strapi via an async HTTP call that
  // resolves well after 'load' already fired, since their [src] doesn't
  // exist until Angular's data binding sets it. So instead: watch the DOM
  // directly for <img> elements (present now or added later as CMS data
  // arrives) and wait for each one to settle. Route changes after that use
  // the old fixed-delay behavior below.
  isLoading = true;
  private initialLoadDone = false;

  constructor(private router: Router, private location: Location, private loadingService: LoadingService, private seo: SeoService) {
    // Dismissing the preloader needs both signals: the CMS HTTP calls that
    // populate each section (13 in parallel on the homepage — see
    // HomeContentService) have all resolved, AND the images those sections
    // render have settled. Either one alone races: HTTP-only would dismiss
    // while late images are still popping in; image-quiet-only (the old
    // behaviour) fires as soon as the DOM goes quiet for 400ms, which is
    // trivially true while requests are still in flight and nothing has
    // rendered yet — that's what let the preloader vanish mid-fetch.
    let sawRequest = false;
    let httpSettled = false;
    let imagesSettled = false;
    let settled = false;

    const maybeSettle = () => {
      if (settled || !httpSettled || !imagesSettled) return;
      settled = true;
      this.initialLoadDone = true;
      this.isLoading = false;
    };

    this.loadingService.pending$.subscribe(count => {
      if (count > 0) sawRequest = true;
      if (sawRequest && count === 0) {
        httpSettled = true;
        maybeSettle();
      }
    });

    this.watchImagesUntilSettled(() => {
      imagesSettled = true;
      maybeSettle();
    });

    // Safety cap — a broken/hung image request, or CMS data that never
    // arrives, shouldn't block the whole site indefinitely.
    setTimeout(() => {
      settled = true;
      this.initialLoadDone = true;
      this.isLoading = false;
    }, 8000);

    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart && this.initialLoadDone) {
        this.isLoading = true;
      }

      // RoutesRecognized fires after redirects resolve but before the routed
      // component is constructed, so a page that sets its own SEO in ngOnInit
      // still wins — this only guarantees no page is ever left on index.html's
      // homepage canonical.
      if (event instanceof RoutesRecognized) {
        this.seo.applyRouteDefaults(event.urlAfterRedirects);
      }

      if (event instanceof NavigationEnd) {
        this.addTrailingSlash(event.urlAfterRedirects);
      }

      if (
        this.initialLoadDone &&
        (event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError)
      ) {
        // Add a short delay for better user experience
        setTimeout(() => {
          this.isLoading = false;
        }, 1000);
      }
    });
  }

  // Waits until every <img> currently in the DOM — plus any added afterward
  // (CMS sections render as their HTTP calls resolve, one after another) —
  // has either loaded or errored, then a short quiet period with no new
  // images appearing before calling back. Disconnects itself once settled.
  private watchImagesUntilSettled(onSettled: () => void): void {
    const QUIET_MS = 400;
    const pending = new Set<HTMLImageElement>();
    let quietTimer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;

    const scheduleCheck = () => {
      clearTimeout(quietTimer);
      quietTimer = setTimeout(() => {
        if (settled || pending.size > 0) return;
        settled = true;
        observer.disconnect();
        onSettled();
      }, QUIET_MS);
    };

    const track = (img: HTMLImageElement) => {
      // loading="lazy" images below the fold are deliberately not fetched by
      // the browser until they near the viewport — waiting on them here
      // meant "settled" was never reached naturally on any page with
      // off-screen images, so every load silently rode the 8s safety-cap
      // timeout below instead of dismissing as soon as the visible content
      // was actually ready.
      if (img.loading === 'lazy' || img.complete) return;
      pending.add(img);
      const settle = () => {
        pending.delete(img);
        scheduleCheck();
      };
      img.addEventListener('load', settle, { once: true });
      img.addEventListener('error', settle, { once: true });
    };

    const scanForImages = (root: ParentNode) => {
      if (root instanceof HTMLImageElement) track(root);
      root.querySelectorAll?.('img').forEach(img => track(img as HTMLImageElement));
    };

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLElement) scanForImages(node);
        });
      }
      scheduleCheck();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    scanForImages(document.body);
    scheduleCheck();
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
