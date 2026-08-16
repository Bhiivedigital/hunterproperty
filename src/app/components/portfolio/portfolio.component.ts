import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HomeContentService } from '../../shared/services/home-content.service';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss'
})
export class PortfolioComponent implements OnInit {
  tagline?: string;
  titleHtml?: SafeHtml;
  images: string[] = [];

  constructor(private homeContentService: HomeContentService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.homeContentService.getPortfolioPage().subscribe(page => {
      this.tagline = page.tagline;
      this.titleHtml = this.sanitizer.bypassSecurityTrustHtml(page.titleHtml);
      this.images = page.images ?? [];
    });
  }
}
