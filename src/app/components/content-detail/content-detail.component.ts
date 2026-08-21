import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ServiceContentService } from '../../shared/services/service-content.service';
import { ServiceContentPage, ServiceContentPageSummary } from '../../shared/models/service-content.model';
import { SeoService } from '../../shared/services/seo.service';
import { StructuredDataService } from '../../shared/services/structured-data.service';
import { HeroLeadFormComponent } from '../homelayout/hero-lead-form/hero-lead-form.component';
import { CldSrcsetPipe, CldSizesPipe } from '../../shared/pipes/cloudinary.pipe';

@Component({
  selector: 'app-content-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, HeroLeadFormComponent, CldSrcsetPipe, CldSizesPipe],
  templateUrl: './content-detail.component.html',
  styleUrl: './content-detail.component.scss'
})
export class ContentDetailComponent implements OnInit {

  page?: ServiceContentPage;
  pageContent?: SafeHtml;
  related: ServiceContentPageSummary[] = [];

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
      const categorySlug = params.get('categorySlug');
      const contentSlug = params.get('contentSlug');
      if (!categorySlug || !contentSlug) {
        this.goToNotFound();
        return;
      }
      this.loadPage(categorySlug, contentSlug);
    });
  }

  private loadPage(categorySlug: string, contentSlug: string): void {
    this.contentService.getContentPageByCategoryAndSlug(categorySlug, contentSlug).subscribe(page => {
      if (!page) {
        this.goToNotFound();
        return;
      }
      this.page = page;
      this.pageContent = this.sanitizer.bypassSecurityTrustHtml(this.lazyLoadImages(page.content));

      const path = `/${categorySlug}/${contentSlug}`;
      this.seo.setSeo({
        path,
        title: `${page.title} | Hunter Property`,
        description: page.excerpt || page.title,
        image: page.coverImage?.url,
        seo: page.seo
      });
      this.structuredData.setBreadcrumb([
        { name: 'Home', url: '/' },
        { name: page.category.name, url: `/${categorySlug}` },
        { name: page.title, url: path }
      ]);
      this.structuredData.setArticle({
        headline: page.title,
        description: page.excerpt || page.title,
        image: page.coverImage?.url,
        datePublished: page.publishedAt,
        dateModified: page.updatedAt,
        url: path
      });

      this.contentService.getRelatedContentPages(categorySlug, contentSlug, 3).subscribe(related => this.related = related);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Rich-text `content` comes straight from Strapi's WYSIWYG editor — any
  // <img> an editor pastes in bypasses every optimization the rest of the
  // pipeline applies. Tag them lazy/async here, before sanitizing, so they
  // at least don't block rendering or fight the LCP image for bandwidth.
  private lazyLoadImages(html: string): string {
    return html.replace(/<img\b(?![^>]*\bloading=)([^>]*)>/gi, '<img loading="lazy" decoding="async"$1>');
  }

  private goToNotFound(): void {
    this.router.navigateByUrl('/not-found', { skipLocationChange: true });
  }
}
