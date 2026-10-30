import { Component, ElementRef, HostListener, inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SafeHtml } from '@angular/platform-browser';
import { ServiceContentService } from '../../shared/services/service-content.service';
import { RichTextService } from '../../shared/services/rich-text.service';
import { CoverImagePosition, ServiceContentPage, ServiceContentPageSummary } from '../../shared/models/service-content.model';
import { SeoService } from '../../shared/services/seo.service';
import { StructuredDataService } from '../../shared/services/structured-data.service';
import { HeroLeadFormComponent } from '../homelayout/hero-lead-form/hero-lead-form.component';
import { CldSrcsetPipe, CldSizesPipe } from '../../shared/pipes/cloudinary.pipe';
import { QuickLinksComponent } from '../../shared/quick-links/quick-links.component';
import { RichTextPipe } from '../../shared/pipes/rich-text.pipe';
import { ContentBlocksComponent } from '../../shared/content-blocks/content-blocks.component';
import { AreaPanelComponent } from '../../shared/area-panel/area-panel.component';
import { AreaDirectoryService } from '../../shared/services/area-directory.service';
import { Area, AREAS_BY_SLUG, AREA_CATEGORY_SLUG } from '../../shared/seo/areas';
import { faqEntries } from '../../shared/seo/faq';

// Clears the fixed header (top bar + floating navbar), matching the pillar
// page's aside, with a little air left under a panel pinned by its bottom.
const STICKY_TOP = 100;
const STICKY_BOTTOM_GAP = 20;

@Component({
  selector: 'app-content-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HeroLeadFormComponent,
    ContentBlocksComponent,
    CldSrcsetPipe,
    CldSizesPipe,
    QuickLinksComponent,
    RichTextPipe,
    AreaPanelComponent
  ],
  templateUrl: './content-detail.component.html',
  styleUrl: './content-detail.component.scss'
})
export class ContentDetailComponent implements OnInit, OnDestroy {

  page?: ServiceContentPage;
  pageContent?: SafeHtml;
  related: ServiceContentPageSummary[] = [];
  /** Set when this guide is one of the Chennai area pages. */
  area?: Area;
  nearbyAreas: Area[] = [];

  private sideEl?: HTMLElement;
  private sideResizeObserver?: ResizeObserver;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * The sticky sidebar. It is only re-measured when it actually changes size
   * (the related-guides widget arrives a request later than the rest of the
   * page) or when the window does, so there is no scroll handler in the way
   * of the browser's own sticky positioning.
   */
  @ViewChild('sidePanel')
  set sidePanel(ref: ElementRef<HTMLElement> | undefined) {
    this.sideResizeObserver?.disconnect();
    this.sideEl = ref?.nativeElement;
    if (!this.sideEl || !this.isBrowser) return;
    this.sideResizeObserver = new ResizeObserver(() => this.updateSideOffset());
    this.sideResizeObserver.observe(this.sideEl);
    this.updateSideOffset();
  }

  /** Editor's choice of whether the block zone opens the article or follows it. */
  get blocksAboveContent(): boolean {
    return this.page?.contentBlocksPosition === 'above-content';
  }

  /**
   * Whether the cover image belongs in this slot. Editors choose the slot in
   * the CMS, so the same image can lead the article, sit under the title or
   * close the page without a template change.
   */
  isCoverAt(slot: CoverImagePosition): boolean {
    return !!this.page?.coverImage?.url && this.page.coverImagePosition === slot;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contentService: ServiceContentService,
    private richText: RichTextService,
    private seo: SeoService,
    private structuredData: StructuredDataService,
    private areaDirectory: AreaDirectoryService
  ) {}

  /**
   * `position: sticky` can only pin an element at one offset, so a sidebar
   * taller than the viewport would hold its top under the header and keep its
   * bottom off screen forever. Give that case an offset that pins the panel's
   * bottom to the bottom of the viewport instead — it then scrolls up with
   * the article exactly far enough to reveal its last widget and stops there.
   */
  @HostListener('window:resize')
  updateSideOffset(): void {
    const el = this.sideEl;
    if (!el || !this.isBrowser) return;
    const height = el.offsetHeight;
    const fits = height + STICKY_TOP + STICKY_BOTTOM_GAP <= window.innerHeight;
    const top = fits ? STICKY_TOP : window.innerHeight - height - STICKY_BOTTOM_GAP;
    el.style.setProperty('--content-side-top', `${Math.round(top)}px`);
  }

  ngOnDestroy(): void {
    this.sideResizeObserver?.disconnect();
  }

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
      this.pageContent = this.richText.toSafeHtml(page.content);

      const path = `/${categorySlug}/${contentSlug}`;
      this.seo.setSeo({
        path,
        title: `${page.title} | Hunter Property`,
        description: page.excerpt || page.title,
        image: page.coverImage?.url,
        ogType: 'article',
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

      this.structuredData.setFaq(faqEntries(page.contentBlocks, this.richText));

      this.area = categorySlug === AREA_CATEGORY_SLUG ? AREAS_BY_SLUG.get(contentSlug) : undefined;
      this.nearbyAreas = [];
      if (this.area) {
        const area = this.area;
        this.structuredData.setAreaService(area, path);
        this.areaDirectory.getPublishedAreas().subscribe(live => {
          const liveSlugs = new Set(live.map(a => a.slug));
          this.nearbyAreas = area.nearby.filter(slug => liveSlugs.has(slug)).map(slug => AREAS_BY_SLUG.get(slug)!);
        });
      }

      this.contentService.getRelatedContentPages(categorySlug, contentSlug, 3).subscribe(related => this.related = related);
    });
  }

  private goToNotFound(): void {
    this.router.navigateByUrl('/not-found', { skipLocationChange: true });
  }
}
