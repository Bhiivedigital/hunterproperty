import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HomeContentService } from '../../../shared/services/home-content.service';
import { HomeFaq, HomeTestimonials } from '../../../shared/models/home-content.model';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, CarouselModule],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class FaqComponent implements OnInit {
  faq?: HomeFaq;
  faqTitleHtml?: SafeHtml;
  testimonials?: HomeTestimonials;
  testimonialsTitleHtml?: SafeHtml;

  constructor(private homeContentService: HomeContentService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.homeContentService.getFaq().subscribe(faq => {
      this.faq = faq;
      this.faqTitleHtml = this.sanitizer.bypassSecurityTrustHtml(faq.titleHtml);
    });
    this.homeContentService.getTestimonials().subscribe(testimonials => {
      this.testimonials = testimonials;
      this.testimonialsTitleHtml = this.sanitizer.bypassSecurityTrustHtml(testimonials.titleHtml);
    });
  }

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
