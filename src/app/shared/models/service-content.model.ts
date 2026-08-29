import { CmsImage } from './cms-image.model';
import { ContentBlock, ContentBlocksPosition } from './pillar-page.model';

export interface Seo {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export interface LinkItem {
  label: string;
  url: string;
}

/** `blocks.quick-links` — a titled grid of plain text links (SEO interlinking block). */
export interface QuickLinks {
  mainTitle?: string;
  items: LinkItem[];
}

export interface ServiceContentCategory {
  id: number;
  slug: string;
  name: string;
  description?: string;
  image?: CmsImage;
  icon?: string;
  menuOrder: number;
  quickLinks?: QuickLinks;
  seo?: Seo;
}

/**
 * Where the cover image sits on a content page. `hidden` keeps the image on
 * the record — it still feeds the social/OG tags and the card in listings —
 * while leaving it out of the article body.
 */
export type CoverImagePosition = 'top' | 'below-title' | 'below-content' | 'hidden';

export interface ServiceContentPageSummary {
  id: number;
  slug: string;
  title: string;
  excerpt?: string;
  coverImage?: CmsImage;
}

export interface ServiceContentPage extends ServiceContentPageSummary {
  content: string;
  category: ServiceContentCategory;
  tags: string[];
  featured: boolean;
  /** Narrow-viewport swap for the cover image, when the editor uploaded one. */
  mobileImage?: CmsImage;
  /** A gallery an editor can run above the article, ahead of the copy. */
  topLevelImages: CmsImage[];
  coverImagePosition: CoverImagePosition;
  /** The same dynamic zone pillar pages use, so images, banners, accordions
   *  and FAQs can be placed anywhere below the body copy. */
  contentBlocks: ContentBlock[];
  contentBlocksPosition: ContentBlocksPosition;
  quickLinks?: QuickLinks;
  updatedAt?: string;
  publishedAt?: string;
  seo?: Seo;
}

export interface MenuCategory extends ServiceContentCategory {
  menuItems: ServiceContentPageSummary[];
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
}
