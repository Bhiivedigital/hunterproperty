import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Event, NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { LeadPopupComponent } from './shared/lead-popup/lead-popup.component';
import { CommonModule, Location } from '@angular/common';

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
  // Visible from boot — hidden once the browser's 'load' event fires (all
  // images/CSS/fonts on the initial page actually finished), not a guessed
  // timeout. Route changes after that use the old fixed-delay behavior below.
  isLoading = true;
  private initialLoadDone = false;

  constructor(private router: Router, private location: Location) {
    // document may already be 'complete' by the time this runs (page load
    // event fires once, and a heavy JS bundle can take longer to bootstrap
    // than images take to load on a fast connection) — a 'load' listener
    // attached after the fact would never fire and leave isLoading stuck.
    if (document.readyState === 'complete') {
      this.initialLoadDone = true;
      this.isLoading = false;
    } else {
      window.addEventListener('load', () => {
        this.initialLoadDone = true;
        this.isLoading = false;
      }, { once: true });
      // Safety cap — a hung third-party script could delay 'load'
      // indefinitely; don't block the whole site behind it.
      setTimeout(() => {
        this.initialLoadDone = true;
        this.isLoading = false;
      }, 8000);
    }

    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart && this.initialLoadDone) {
        this.isLoading = true;
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
