import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SafeHtml } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';
import { ServiceContentService } from '../../shared/services/service-content.service';
import { PillarPageService } from '../../shared/services/pillar-page.service';
import { RichTextService } from '../../shared/services/rich-text.service';
import { LinkItem, ServiceContentCategory, ServiceContentPageSummary } from '../../shared/models/service-content.model';
import { PillarPage } from '../../shared/models/pillar-page.model';
import { SeoService } from '../../shared/services/seo.service';
import { StructuredDataService } from '../../shared/services/structured-data.service';
import { QuickLinksComponent } from '../../shared/quick-links/quick-links.component';
import { ContentBlocksComponent } from '../../shared/content-blocks/content-blocks.component';

// The category page is a pillar page: its job is to expose every child guide as
// a crawlable internal link, not to sell each one with a card. Links are cheap
// to render, so pull them in large batches rather than 9 at a time.
const PAGE_SIZE = 100;

/**
 * /:categorySlug. Two content sources meet here:
 *
 *  - Service Content Category — the taxonomy record. Name, slug, icon and a
 *    short description, shared with the mega-menu, breadcrumbs and cards.
 *  - Pillar Page — the standalone editorial record for this URL, written and
 *    republished on its own without touching the taxonomy.
 *
 * When a pillar page exists it owns the page body outright: intro, blocks,
 * curated links and CTA all come from it. When one doesn't, the page falls
 * back to the category description plus the generated child-guide grid, which
 * is what every category rendered before pillar pages existed — so a category
 * nobody has written a pillar page for yet is still a complete page.
 */
@Component({
  selector: 'app-category-page',
  standalone: true,
  imports: [CommonModule, RouterLink, QuickLinksComponent, ContentBlocksComponent],
  templateUrl: './category-page.component.html',
  styleUrl: './category-page.component.scss'
})
export class CategoryPageComponent implements OnInit {

  category?: ServiceContentCategory;
  pillar?: PillarPage;
  introHtml?: SafeHtml;
  pages: ServiceContentPageSummary[] = [];
  page = 1;
  pageCount = 1;
  total = 0;
  loadingMore = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contentService: ServiceContentService,
    private pillarService: PillarPageService,
    private richText: RichTextService,
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

  get tagline(): string {
    return this.pillar?.tagline || 'Guides';
  }

  /** The editor-curated link block: the pillar page's, or the legacy one still living on the category. */
  get curatedLinks() {
    return this.pillar ? this.pillar.quickLinks : this.category?.quickLinks;
  }

  get showChildGuides(): boolean {
    return this.pillar ? this.pillar.showChildGuides : true;
  }

  get childGuidesTitle(): string {
    return this.pillar?.childGuidesTitle || `Related ${this.category?.name} Pages`;
  }

  get ctaHeading(): string {
    return this.pillar?.ctaHeading || `Ready to talk to our ${this.category?.name} team?`;
  }

  get ctaText(): string {
    return this.pillar?.ctaText
      || `Get a personalised quote, or see how we deliver ${this.category?.name?.toLowerCase()} projects end-to-end.`;
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
    // The two records are independent, and the <head> tags depend on both
    // (a pillar page's SEO component wins over the category's), so wait for
    // the pair rather than writing meta tags twice.
    forkJoin({
      category: this.contentService.getCategoryBySlug(slug),
      pillar: this.pillarService.getByCategorySlug(slug)
    }).subscribe(({ category, pillar }) => {
      if (!category) {
        this.goToNotFound();
        return;
      }
      this.category = category;
      this.pillar = pillar;

      // Both `intro` and `description` are Strapi rich text, not plain strings.
      this.introHtml = this.richText.toSafeHtml(pillar?.intro || category.description);

      this.applySeo(category, pillar);

      this.contentService.getContentPagesByCategory(category.slug, 1, PAGE_SIZE).subscribe(result => {
        this.pages = result.items;
        this.page = result.page;
        this.pageCount = result.pageCount;
        this.total = result.total;
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  private applySeo(category: ServiceContentCategory, pillar?: PillarPage): void {
    this.seo.setSeo({
      path: `/${category.slug}`,
      title: `${category.name} Guides | Hunter Property`,
      // Both fields are rich text; a meta description has to be plain prose.
      description: this.richText.toPlainText(pillar?.intro)
        || this.richText.toPlainText(category.description)
        || `${category.name} guides and resources from Hunter Property.`,
      image: pillar?.heroImage?.url || category.image?.url,
      seo: pillar?.seo ?? category.seo
    });
    this.structuredData.setBreadcrumb([
      { name: 'Home', url: '/' },
      { name: category.name, url: `/${category.slug}` }
    ]);
    this.structuredData.clear('article');
  }

  private goToNotFound(): void {
    this.router.navigateByUrl('/not-found', { skipLocationChange: true });
  }
}
