import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LinkItem } from '../models/service-content.model';

/**
 * Titled grid of plain text links — the SEO interlinking block editors fill in
 * via the CMS `blocks.quick-links` component. Deliberately image-free and
 * button-free: it exists to expose a lot of internal links at once, so every
 * item is a single tappable text tile.
 */
@Component({
  selector: 'app-quick-links',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './quick-links.component.html',
  styleUrl: './quick-links.component.scss'
})
export class QuickLinksComponent {

  @Input() title?: string;
  @Input() items: LinkItem[] | null = [];

  /** Muted panel background (the default) vs. flush on the page background. */
  @Input() variant: 'panel' | 'plain' = 'panel';

  get visibleItems(): LinkItem[] {
    return (this.items ?? []).filter(item => !!item?.label && !!item?.url);
  }

  /**
   * Site-relative URLs are routed client-side; anything with a scheme (or a
   * protocol-relative //host) is an outbound link and gets a plain href so the
   * router never tries to resolve it as an internal route.
   */
  isInternal(url: string): boolean {
    return url.startsWith('/') && !url.startsWith('//');
  }
}
