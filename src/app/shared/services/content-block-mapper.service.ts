import { Injectable } from '@angular/core';
import {
  AccordionBlock,
  BannerBlock,
  ContentBlock,
  ContentSectionBlock,
  FaqItem,
  FaqsBlock,
  ImageBlock,
  QuickLinksBlock,
  VideoBlock
} from '../models/pillar-page.model';
import { StrapiService } from './strapi.service';

/**
 * Turns a Strapi dynamic zone into the `ContentBlock[]` that
 * `<app-content-blocks>` renders.
 *
 * Pillar pages and service content pages both expose the same zone, so the
 * mapping lives here rather than inside either feed's service — an editor who
 * drops an Image Block into a content page gets the same rendering they get on
 * a pillar page, and a new block type only has to be taught to one file.
 */
@Injectable({ providedIn: 'root' })
export class ContentBlockMapperService {

  constructor(private strapi: StrapiService) {}

  toBlocks(raw: any): ContentBlock[] {
    return (raw ?? [])
      .map((b: any) => this.toBlock(b))
      .filter((b: ContentBlock | undefined): b is ContentBlock => !!b);
  }

  /**
   * Dynamic-zone entries are keyed by `__component`. An unrecognised key means
   * the CMS gained a block this build doesn't render yet — skip it rather than
   * emitting an empty slot.
   */
  toBlock(b: any): ContentBlock | undefined {
    switch (b?.__component) {
      case 'blocks.content-section':
        return {
          __component: 'blocks.content-section',
          id: b.id,
          title: b.title,
          body: b.body,
          image: this.strapi.mediaObj(b.image, 'content'),
          imagePosition: b.imagePosition ?? 'right'
        } as ContentSectionBlock;

      case 'blocks.image-block':
        return {
          __component: 'blocks.image-block',
          id: b.id,
          image: this.strapi.mediaObj(b.image, b.width === 'full' ? 'hero' : 'content'),
          altText: b.altText,
          caption: b.caption,
          width: b.width === 'full' ? 'full' : 'content'
        } as ImageBlock;

      case 'blocks.banner':
        return {
          __component: 'blocks.banner',
          id: b.id,
          title: b.title,
          subtitle: b.subtitle,
          image: this.strapi.mediaObj(b.image, 'hero'),
          ctaText: b.ctaText,
          ctaUrl: b.ctaUrl
        } as BannerBlock;

      case 'blocks.quick-links':
        return {
          __component: 'blocks.quick-links',
          id: b.id,
          mainTitle: b.mainTitle,
          items: (b.items ?? []).filter((i: any) => i?.label && i?.url).map((i: any) => ({ label: i.label, url: i.url }))
        } as QuickLinksBlock;

      case 'blocks.accordion':
        return { __component: 'blocks.accordion', id: b.id, title: b.title, items: this.toFaqItems(b.items) } as AccordionBlock;

      case 'blocks.faqs':
        return { __component: 'blocks.faqs', id: b.id, title: b.title, items: this.toFaqItems(b.items) } as FaqsBlock;

      case 'blocks.video-section':
        return {
          __component: 'blocks.video-section',
          id: b.id,
          title: b.title,
          videoUrl: b.videoUrl,
          thumbnail: this.strapi.mediaObj(b.thumbnail, 'content')
        } as VideoBlock;

      default:
        return undefined;
    }
  }

  private toFaqItems(items: any): FaqItem[] {
    return (items ?? [])
      .filter((i: any) => i?.question)
      .map((i: any) => ({ question: i.question, answer: i.answer ?? '' }));
  }
}
