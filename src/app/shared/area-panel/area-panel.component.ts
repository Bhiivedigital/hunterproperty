import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Area } from '../seo/areas';
import { BUSINESS, PACKAGES } from '../seo/business';
import { LeadPopupService } from '../lead-popup/lead-popup.service';

/**
 * "Area at a glance" on an area guide: the locality facts a visitor checking
 * a builder looks for first (pincodes, who approves the plan, what it costs),
 * the office that serves it, and links to the neighbouring area pages and the
 * all-areas hub. The links matter as much as the facts: they are what lets
 * search engines crawl from one area page to the next.
 */
@Component({
  selector: 'app-area-panel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './area-panel.component.html',
  styleUrl: './area-panel.component.scss'
})
export class AreaPanelComponent {
  @Input({ required: true }) area!: Area;
  /** Neighbouring areas that have a published page. */
  @Input() nearby: Area[] = [];
  @Input() categorySlug = 'home-construction';

  readonly packages = PACKAGES;
  readonly telephone = BUSINESS.telephone;

  constructor(private leadPopup: LeadPopupService) {}

  get office() {
    return BUSINESS.offices.find(o => o.id === this.area.servedFrom)!;
  }

  get fromPrice(): number {
    return Math.min(...PACKAGES.map(p => p.pricePerSqft));
  }

  // A real href keeps the link crawlable and working without JavaScript;
  // with it, the quote popup opens in place.
  openQuote(event: Event): void {
    event.preventDefault();
    this.leadPopup.open();
  }
}
