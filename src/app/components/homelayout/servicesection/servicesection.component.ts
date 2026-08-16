import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HomeContentService } from '../../../shared/services/home-content.service';
import { ServiceCard } from '../../../shared/models/home-content.model';

@Component({
  selector: 'app-servicesection',
  standalone: true,
  imports: [CommonModule, CarouselModule, RouterLink],
  templateUrl: './servicesection.component.html',
  styleUrl: './servicesection.component.scss',
  schemas:[CUSTOM_ELEMENTS_SCHEMA]

})
export class ServicesectionComponent implements OnInit {
  tagline?: string;
  titleHtml?: SafeHtml;
  items: ServiceCard[] = [];

  constructor(private homeContentService: HomeContentService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.homeContentService.getServices().subscribe(services => {
      this.tagline = services.tagline;
      this.titleHtml = this.sanitizer.bypassSecurityTrustHtml(services.titleHtml);
      this.items = services.items ?? [];
    });
  }

serviceSlide: OwlOptions = {
    loop: true,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: false,
    dots: false,
    autoplay:false,
    margin:15,
    //navSpeed: 600,
    navText: ['<i class="far fa-long-arrow-left"></i>', '<i class="far fa-long-arrow-right"></i>'],
    responsive: {
      0: {
        items: 1,
      },
      400: {
        items: 1,
      },
      760: {
        items: 2,
      },
      1000: {
        items: 3,
      },
    },
    nav: true,
  };
}
