import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { HeroLeadFormComponent } from '../hero-lead-form/hero-lead-form.component';
import { HomeContentService } from '../../../shared/services/home-content.service';
import { HomeBanner } from '../../../shared/models/home-content.model';


@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [CommonModule, CarouselModule, RouterLink, RouterLinkActive, HeroLeadFormComponent],
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.scss',
  schemas:[CUSTOM_ELEMENTS_SCHEMA]

})
export class BannerComponent implements OnInit {
  banner?: HomeBanner;

  constructor(private homeContentService: HomeContentService) {}

  ngOnInit(): void {
    this.homeContentService.getBanner().subscribe(banner => this.banner = banner);
  }

customOptions: OwlOptions = {
    loop: true,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: false,
    dots: true,
    autoplay:true,
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
        items: 1,
      },
      1000: {
        items: 1,
      },
    },
    nav: false,
  };
}
