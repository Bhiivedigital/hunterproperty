import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HomeContentService } from '../../shared/services/home-content.service';
import { ServiceCard } from '../../shared/models/home-content.model';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss'
})
export class ServicesComponent implements OnInit {
  heroTitleHtml?: SafeHtml;
  tagline?: string;
  titleHtml?: SafeHtml;
  items: ServiceCard[] = [];

  constructor(private homeContentService: HomeContentService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.homeContentService.getServicesPage().subscribe(page => {
      this.heroTitleHtml = this.sanitizer.bypassSecurityTrustHtml(page.heroTitleHtml);
      this.tagline = page.tagline;
      this.titleHtml = this.sanitizer.bypassSecurityTrustHtml(page.titleHtml);
      this.items = page.items ?? [];
    });
  }
}
