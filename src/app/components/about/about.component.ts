import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { AboutsectionComponent } from '../homelayout/aboutsection/aboutsection.component';
import { WorkingprocessComponent } from "../homelayout/workingprocess/workingprocess.component";
import { ProjectskillsComponent } from '../homelayout/projectskills/projectskills.component';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { TeamComponent } from "../homelayout/team/team.component";
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HomeContentService } from '../../shared/services/home-content.service';
import { TestimonialItem } from '../../shared/models/home-content.model';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, AboutsectionComponent, WorkingprocessComponent, ProjectskillsComponent, CarouselModule, TeamComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class AboutComponent implements OnInit {
  heroTitleHtml?: SafeHtml;
  testimonialItems: TestimonialItem[] = [];

  constructor(private homeContentService: HomeContentService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.homeContentService.getAboutPage().subscribe(page => {
      this.heroTitleHtml = this.sanitizer.bypassSecurityTrustHtml(page.heroTitleHtml);
    });
    this.homeContentService.getTestimonials().subscribe(t => this.testimonialItems = t.items ?? []);
  }

aboutTestimonial: OwlOptions = {
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
        items: 2,
      },
      760: {
        items: 2,
      },
      1200: {
        items: 3,
      },
    },
    nav: false,
  };
}
