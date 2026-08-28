import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ServiceContentService } from '../../shared/services/service-content.service';
import { LinkItem, ServiceContentCategory, ServiceContentPageSummary } from '../../shared/models/service-content.model';
import { SeoService } from '../../shared/services/seo.service';
import { StructuredDataService } from '../../shared/services/structured-data.service';
import { QuickLinksComponent } from '../../shared/quick-links/quick-links.component';

// The category page is a pillar page: its job is to expose every child guide as
// a crawlable internal link, not to sell each one with a card. Links are cheap
// to render, so pull them in large batches rather than 9 at a time.
const PAGE_SIZE = 100;

@Component({
  selector: 'app-category-page',
  standalone: true,
  imports: [CommonModule, RouterLink, QuickLinksComponent],
  templateUrl: './category-page.component.html',
  styleUrl: './category-page.component.scss'
})
export class CategoryPageComponent implements OnInit {

  category?: ServiceContentCategory;
  categoryDescription?: SafeHtml;
  pages: ServiceContentPageSummary[] = [];
  page = 1;
  pageCount = 1;
  total = 0;
  loadingMore = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contentService: ServiceContentService,
    private sanitizer: DomSanitizer,
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

  /** Child guides as plain links, for the shared quick-links grid. */
  get pageLinks(): LinkItem[] {
    if (!this.category) return [];
    const slug = this.category.slug;
    return this.pages.map(item => ({ label: item.title, url: `/${slug}/${item.slug}` }));
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
      // `description` is Strapi rich text (HTML), not a plain string.
      this.categoryDescription = category.description
        ? this.sanitizer.bypassSecurityTrustHtml(category.description)
        : undefined;

      this.seo.setSeo({
        path: `/${category.slug}`,
        title: `${category.name} Guides | Hunter Property`,
        description: category.description || `${category.name} guides and resources from Hunter Property.`,
        image: category.image?.url,
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
