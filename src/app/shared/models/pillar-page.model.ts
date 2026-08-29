import { CmsImage } from './cms-image.model';
import { LinkItem, QuickLinks, Seo } from './service-content.model';

/**
 * A pillar page is the editorial body of a category landing page at
 * /:categorySlug. It lives in its own CMS collection so it can be written and
 * republished without touching Service Content Category, which stays a plain
 * taxonomy record (name, slug, icon, short description) used by the mega-menu,
 * breadcrumbs and cards.
 */

export interface FaqItem {
  question: string;
  answer: string;
}

interface BlockBase {
  id: number;
  __component: string;
}

export interface ContentSectionBlock extends BlockBase {
  __component: 'blocks.content-section';
  title?: string;
  body?: string;
  image?: CmsImage;
  imagePosition: 'right' | 'left' | 'above' | 'below';
}

export interface ImageBlock extends BlockBase {
  __component: 'blocks.image-block';
  image?: CmsImage;
  altText?: string;
  caption?: string;
  width: 'content' | 'full';
}

export interface BannerBlock extends BlockBase {
  __component: 'blocks.banner';
  title?: string;
  subtitle?: string;
  image?: CmsImage;
  ctaText?: string;
  ctaUrl?: string;
}

export interface QuickLinksBlock extends BlockBase {
  __component: 'blocks.quick-links';
  mainTitle?: string;
  items: LinkItem[];
}

export interface AccordionBlock extends BlockBase {
  __component: 'blocks.accordion';
  title?: string;
  items: FaqItem[];
}

export interface FaqsBlock extends BlockBase {
  __component: 'blocks.faqs';
  title?: string;
  items: FaqItem[];
}

export interface VideoBlock extends BlockBase {
  __component: 'blocks.video-section';
  title?: string;
  videoUrl?: string;
  thumbnail?: CmsImage;
}

export type ContentBlock =
  | ContentSectionBlock
  | ImageBlock
  | BannerBlock
  | QuickLinksBlock
  | AccordionBlock
  | FaqsBlock
  | VideoBlock;

export interface PillarPage {
  id: number;
  title: string;
  categorySlug?: string;
  tagline?: string;
  /** H1 override. Falls back to the category name in the template. */
  heading?: string;
  intro?: string;
  heroImage?: CmsImage;
  contentBlocks: ContentBlock[];
  quickLinks?: QuickLinks;
  /** Whether to append the auto-generated grid of child guide links. */
  showChildGuides: boolean;
  childGuidesTitle?: string;
  ctaHeading?: string;
  ctaText?: string;
  updatedAt?: string;
  seo?: Seo;
}
