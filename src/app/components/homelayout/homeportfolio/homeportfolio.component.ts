import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { HomeContentService } from '../../../shared/services/home-content.service';

@Component({
  selector: 'app-homeportfolio',
  standalone: true,
  imports: [CommonModule, CarouselModule],
  templateUrl: './homeportfolio.component.html',
  styleUrl: './homeportfolio.component.scss',
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class HomeportfolioComponent implements OnInit {
  images: string[] = [];

  constructor(private homeContentService: HomeContentService) {}

  ngOnInit(): void {
    this.homeContentService.getHomePortfolio().subscribe(data => this.images = data.images ?? []);
  }

portfolioSlide: OwlOptions = {
    loop: true,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: false,
    dots: false,
    autoplay:true,
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
