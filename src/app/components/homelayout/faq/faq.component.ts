import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CarouselModule],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class FaqComponent {
testmonialsSlide: OwlOptions = {
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
        items: 2,
      },
      760: {
        items: 3,
      },
      1000: {
        items: 3,
      },
    },
    nav: true,
  };
}
