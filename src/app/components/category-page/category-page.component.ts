import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ServiceContentService } from '../../shared/services/service-content.service';
import { ServiceContentCategory, ServiceContentPageSummary } from '../../shared/models/service-content.model';
import { SeoService } from '../../shared/services/seo.service';
import { StructuredDataService } from '../../shared/services/structured-data.service';

const PAGE_SIZE = 9;

@Component({
  selector: 'app-category-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './category-page.component.html',
  styleUrl: './category-page.component.scss'
})
export class CategoryPageComponent implements OnInit {

  category?: ServiceContentCategory;
  pages: ServiceContentPageSummary[] = [];
  page = 1;
  pageCount = 1;
  total = 0;
  loadingMore = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contentService: ServiceContentService,
    private seo: SeoService,
    private structuredData: StructuredDataService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('categorySlug');
      if (!slug) {
        this.goToNotFound();
        return;
      }
      this.loadCategory(slug);
    });
  }

  get hasMore(): boolean {
    return this.page < this.pageCount;
  }

  loadMore(): void {
    if (!this.category || this.loadingMore || !this.hasMore) return;
    this.loadingMore = true;
    const nextPage = this.page + 1;
    this.contentService.getContentPagesByCategory(this.category.slug, nextPage, PAGE_SIZE).subscribe(result => {
      this.pages = [...this.pages, ...result.items];
      this.page = result.page;
      this.pageCount = result.pageCount;
      this.total = result.total;
      this.loadingMore = false;
    });
  }

  private loadCategory(slug: string): void {
    this.contentService.getCategoryBySlug(slug).subscribe(category => {
      if (!category) {
        this.goToNotFound();
        return;
      }
      this.category = category;

      this.seo.setSeo({
        path: `/${category.slug}`,
        title: `${category.name} Guides | Hunter Property`,
        description: category.description || `${category.name} guides and resources from Hunter Property.`,
        image: category.image,
        seo: category.seo
      });
      this.structuredData.setBreadcrumb([
        { name: 'Home', url: '/' },
        { name: category.name, url: `/${category.slug}` }
      ]);
      this.structuredData.clear('article');

      this.contentService.getContentPagesByCategory(category.slug, 1, PAGE_SIZE).subscribe(result => {
        this.pages = result.items;
        this.page = result.page;
        this.pageCount = result.pageCount;
        this.total = result.total;
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  private goToNotFound(): void {
    this.router.navigateByUrl('/not-found', { skipLocationChange: true });
  }
}
