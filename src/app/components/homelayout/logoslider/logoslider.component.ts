import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { HomeContentService } from '../../../shared/services/home-content.service';

@Component({
  selector: 'app-logoslider',
  standalone: true,
  imports: [CommonModule, CarouselModule],
  templateUrl: './logoslider.component.html',
  styleUrl: './logoslider.component.scss',
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class LogosliderComponent implements OnInit {
  logos: string[] = [];

  constructor(private homeContentService: HomeContentService) {}

  ngOnInit(): void {
    this.homeContentService.getLogoSlider().subscribe(data => this.logos = data.logos ?? []);
  }

logoSlide: OwlOptions = {
    loop: true,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: false,
    dots: false,
    autoplay:true,
    //navSpeed: 600,
    navText: ['<i class="far fa-long-arrow-left"></i>', '<i class="far fa-long-arrow-right"></i>'],
    responsive: {
      0: {
        items: 2,
      },
      400: {
        items: 2,
      },
      760: {
        items: 4,
      },
      1000: {
        items: 6,
      },
    },
    nav: false,
  };
}
