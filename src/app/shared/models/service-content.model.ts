import { CmsImage } from './cms-image.model';

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
