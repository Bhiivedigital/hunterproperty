import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LeadPopupService } from '../lead-popup/lead-popup.service';
import { ServiceContentService } from '../services/service-content.service';
import { MenuCategory } from '../models/service-content.model';
declare const bootstrap: any;

const DESKTOP_BREAKPOINT = 992;

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {

  @ViewChild('headerTop') headerTopRef?: ElementRef<HTMLElement>;

  isScrolled = false;
  menuCategories: MenuCategory[] = [];
  megaMenuOpen = false;
  private headerTopResizeObserver?: ResizeObserver;

  constructor(private leadPopupService: LeadPopupService, private contentService: ServiceContentService) {}

  ngOnInit(): void {
    this.contentService.getMenuCategories().subscribe(categories => this.menuCategories = categories);
  }

  private get isDesktop(): boolean {
    return window.innerWidth >= DESKTOP_BREAKPOINT;
  }

  openMegaMenuDesktop(): void {
    if (this.isDesktop) this.megaMenuOpen = true;
  }

  closeMegaMenuDesktop(): void {
    if (this.isDesktop) this.megaMenuOpen = false;
  }

  toggleMegaMenuMobile(event: MouseEvent): void {
    if (this.isDesktop) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.megaMenuOpen = !this.megaMenuOpen;
  }

  closeMegaMenuMobile(): void {
    this.megaMenuOpen = false;
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 50;
  }

  openQuotePopup(): void {
    this.leadPopupService.open();
  }

  goToWhatsApp(): void {
  const phoneNumber = '7550110784'; // Use international format, no + or spaces
  const url = `https://wa.me/${phoneNumber}`;
  window.open(url, '_blank');
}
callNow(): void {
  const phoneNumber = '7550110784'; // Include country code if needed
  window.location.href = `tel:${phoneNumber}`;
}
 ngAfterViewInit(): void {
    const navLinks = document.querySelectorAll('.nav-link');
    const offcanvasNavbar = document.getElementById('offcanvasNavbar');
    const offcanvasAnother = document.getElementById('offcanvasAnother');

    const offcanvas1 = offcanvasNavbar ? new bootstrap.Offcanvas(offcanvasNavbar) : null;
    const offcanvas2 = offcanvasAnother ? new bootstrap.Offcanvas(offcanvasAnother) : null;

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (offcanvas1) offcanvas1.hide();
        setTimeout(() => {
          if (offcanvas2) offcanvas2.show();
        }, 300); // slight delay to avoid backdrop conflict
      });
    });

    this.observeHeaderTopHeight();
  }

  ngOnDestroy(): void {
    this.headerTopResizeObserver?.disconnect();
  }

  // .header-top is fixed (see header.component.scss) and its rendered height
  // changes across breakpoints (icon sizes, line wrapping) and is hidden
  // entirely below 576px — track it live so .main-navigation and <main> can
  // reserve exactly that much space via --header-top-height instead of a
  // guessed pixel value.
  private observeHeaderTopHeight(): void {
    const el = this.headerTopRef?.nativeElement;
    if (!el) return;

    const setHeight = () => {
      document.documentElement.style.setProperty('--header-top-height', `${el.offsetHeight}px`);
    };

    setHeight();
    this.headerTopResizeObserver = new ResizeObserver(setHeight);
    this.headerTopResizeObserver.observe(el);
  }
}
