import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HomeContentService } from '../../shared/services/home-content.service';
import { ServiceCard } from '../../shared/models/home-content.model';
import { SeoService } from '../../shared/services/seo.service';
import { StructuredDataService } from '../../shared/services/structured-data.service';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './service-detail.component.html',
  styleUrl: './service-detail.component.scss'
})
export class ServiceDetailComponent implements OnInit {

  service?: ServiceCard;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private homeContentService: HomeContentService,
    private seo: SeoService,
    private structuredData: StructuredDataService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (!slug) {
        this.goToNotFound();
        return;
      }
      this.homeContentService.getServicesPage().subscribe(page => {
        const service = (page.items ?? []).find(item => item.slug === slug);
        if (!service) {
          this.goToNotFound();
          return;
        }
        this.service = service;

        this.seo.setSeo({
          path: `/services/${slug}`,
          title: `${service.title} in Chennai | Hunter Property`,
          description: service.text
        });
        this.structuredData.setBreadcrumb([
          { name: 'Home', url: '/' },
          { name: 'Services', url: '/services' },
          { name: service.title, url: `/services/${slug}` }
        ]);
        this.structuredData.setService({
          name: service.title,
          description: service.text,
          url: `/services/${slug}`
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  private goToNotFound(): void {
    this.router.navigateByUrl('/not-found', { skipLocationChange: true });
  }
}
