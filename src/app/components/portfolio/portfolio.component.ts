import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HomeContentService } from '../../shared/services/home-content.service';
import { CmsImage } from '../../shared/models/cms-image.model';
import { CldSrcsetPipe, CldSizesPipe } from '../../shared/pipes/cloudinary.pipe';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, CldSrcsetPipe, CldSizesPipe],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss'
})
export class PortfolioComponent implements OnInit {
  tagline?: string;
  titleHtml?: SafeHtml;
  images: CmsImage[] = [];

  constructor(private homeContentService: HomeContentService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.homeContentService.getPortfolioPage().subscribe(page => {
      this.tagline = page.tagline;
      this.titleHtml = this.sanitizer.bypassSecurityTrustHtml(page.titleHtml);
      this.images = page.images ?? [];
    });
  }
}
