import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HomeContentService } from '../../../shared/services/home-content.service';
import { HomeAbout } from '../../../shared/models/home-content.model';

@Component({
  selector: 'app-aboutsection',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './aboutsection.component.html',
  styleUrl: './aboutsection.component.scss'
})
export class AboutsectionComponent implements OnInit {
  about?: HomeAbout;
  titleHtml?: SafeHtml;

  constructor(private homeContentService: HomeContentService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.homeContentService.getAbout().subscribe(about => {
      this.about = about;
      this.titleHtml = this.sanitizer.bypassSecurityTrustHtml(about.titleHtml);
    });
  }
}
