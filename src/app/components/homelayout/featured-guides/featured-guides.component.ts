import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ServiceContentService } from '../../../shared/services/service-content.service';
import { ServiceContentPage } from '../../../shared/models/service-content.model';

@Component({
  selector: 'app-featured-guides',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './featured-guides.component.html',
  styleUrl: './featured-guides.component.scss',
})
export class FeaturedGuidesComponent implements OnInit {

  guides: ServiceContentPage[] = [];

  constructor(private contentService: ServiceContentService) {}

  ngOnInit(): void {
    this.contentService.getFeaturedContentPages(3).subscribe(guides => this.guides = guides);
  }
}
