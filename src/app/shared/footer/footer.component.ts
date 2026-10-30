import { NgFor } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AREAS_BY_SLUG } from '../seo/areas';

// A short, fixed set: a footer that lists every locality on every page reads
// as keyword stuffing. These all have published guides; the hub links the rest.
const FOOTER_AREA_SLUGS = [
  'best-builders-in-perambur', 'builders-in-kolathur', 'builders-in-anna-nagar', 'builders-in-velachery',
  'builders-in-tambaram', 'builders-in-porur', 'builders-in-mogappair', 'builders-in-villivakkam'
];

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [NgFor, RouterLink, RouterLinkActive],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {

  isScrollTopActive = false;
  readonly footerAreas = FOOTER_AREA_SLUGS.map(slug => AREAS_BY_SLUG.get(slug)!);

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.isScrollTopActive = scrollPosition > 100;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
