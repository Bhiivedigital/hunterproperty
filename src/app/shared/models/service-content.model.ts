export interface Seo {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export interface ServiceContentCategory {
  id: number;
  slug: string;
  name: string;
  description?: string;
  image?: string;
  icon?: string;
  menuOrder: number;
  seo?: Seo;
}

export interface ServiceContentPageSummary {
  id: number;
  slug: string;
  title: string;
  excerpt?: string;
  coverImage?: string;
}

export interface ServiceContentPage extends ServiceContentPageSummary {
  content: string;
  category: ServiceContentCategory;
  tags: string[];
  featured: boolean;
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
