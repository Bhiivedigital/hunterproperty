import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HomeContentService } from '../../../shared/services/home-content.service';
import { HomeWhyChooseUs } from '../../../shared/models/home-content.model';
import { CldSrcsetPipe, CldSizesPipe } from '../../../shared/pipes/cloudinary.pipe';

@Component({
  selector: 'app-whychooseus',
  standalone: true,
  imports: [CommonModule, RouterLink, CldSrcsetPipe, CldSizesPipe],
  templateUrl: './whychooseus.component.html',
  styleUrl: './whychooseus.component.scss',
})
export class WhychooseusComponent implements OnInit {
  data?: HomeWhyChooseUs;
  titleHtml?: SafeHtml;

  constructor(private homeContentService: HomeContentService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.homeContentService.getWhyChooseUs().subscribe(data => {
      this.data = data;
      this.titleHtml = this.sanitizer.bypassSecurityTrustHtml(data.titleHtml);
    });
  }
}
