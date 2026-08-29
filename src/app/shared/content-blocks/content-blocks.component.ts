import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ContentBlock, VideoBlock } from '../models/pillar-page.model';
import { QuickLinksComponent } from '../quick-links/quick-links.component';
import { RichTextPipe } from '../pipes/rich-text.pipe';
import { CldSrcsetPipe, CldSizesPipe } from '../pipes/cloudinary.pipe';

/**
 * Renders a CMS dynamic zone — the ordered list of blocks an editor assembles
 * on a Pillar Page. Every block type the zone accepts has a case here; an
 * unknown `__component` is dropped upstream in PillarPageService, so anything
 * reaching this template is renderable.
 */
@Component({
  selector: 'app-content-blocks',
  standalone: true,
  imports: [CommonModule, RouterLink, QuickLinksComponent, RichTextPipe, CldSrcsetPipe, CldSizesPipe],
  templateUrl: './content-blocks.component.html',
  styleUrl: './content-blocks.component.scss'
})
export class ContentBlocksComponent {

  @Input() blocks: ContentBlock[] | null = [];

  /** Open accordion panels, keyed `<blockKey>:<itemIndex>`. */
  private openPanels = new Set<string>();

  /** Accordion blocks the visitor has interacted with, so the "first item open
   * by default" rule stops applying to that block only — not to every other
   * accordion on the page. */
  private touchedBlocks = new Set<string>();

  /** Video blocks the visitor has clicked; only then is the embed created. */
  private playing = new Set<string>();
  private embedUrls = new Map<string, SafeResourceUrl>();

  constructor(private sanitizer: DomSanitizer) {}

  get visibleBlocks(): ContentBlock[] {
    return this.blocks ?? [];
  }

  /**
   * Component ids are only unique within one component type — an accordion and
   * an FAQ block on the same page can both be id 2 — so anything keyed per
   * block has to carry the component name too, or the two share state.
   */
  blockKey(block: ContentBlock): string {
    return `${block.__component}:${block.id}`;
  }

  /**
   * An arrow property, not a method: Angular invokes a trackBy function
   * unbound, so a method body referencing `this` throws on every change
   * detection pass and silently leaves the whole *ngFor empty.
   */
  trackBlock = (_index: number, block: ContentBlock): string => `${block.__component}:${block.id}`;

  // --- accordions ---------------------------------------------------------

  /**
   * Panels are toggled here rather than through Bootstrap's data-bs-* API:
   * these items are rendered by *ngFor after Bootstrap has already scanned the
   * document, and two accordion blocks on one page would otherwise need
   * globally unique DOM ids to avoid driving each other.
   */
  togglePanel(block: ContentBlock, index: number): void {
    const blockKey = this.blockKey(block);
    const panelKey = `${blockKey}:${index}`;
    const wasOpen = this.isPanelOpen(block, index);
    this.touchedBlocks.add(blockKey);
    if (wasOpen) this.openPanels.delete(panelKey);
    else this.openPanels.add(panelKey);
  }

  isPanelOpen(block: ContentBlock, index: number): boolean {
    // First item of each accordion starts open, as on the homepage FAQ, until
    // the visitor touches that accordion.
    const blockKey = this.blockKey(block);
    if (!this.touchedBlocks.has(blockKey)) return index === 0;
    return this.openPanels.has(`${blockKey}:${index}`);
  }

  // --- video --------------------------------------------------------------

  isPlaying(block: ContentBlock): boolean {
    return this.playing.has(this.blockKey(block));
  }

  /**
   * Click-to-play: the third-party player is only embedded once someone asks
   * for it, so a pillar page carrying a video still loads as a static page.
   */
  play(block: VideoBlock): void {
    if (!block.videoUrl) return;
    const key = this.blockKey(block);
    if (!this.embedUrls.has(key)) {
      this.embedUrls.set(key, this.sanitizer.bypassSecurityTrustResourceUrl(this.toEmbedUrl(block.videoUrl)));
    }
    this.playing.add(key);
  }

  embedUrl(block: ContentBlock): SafeResourceUrl | undefined {
    return this.embedUrls.get(this.blockKey(block));
  }

  /** Accepts the URL an editor copies from the browser bar, not just an embed link. */
  private toEmbedUrl(url: string): string {
    const youtube = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/i);
    if (youtube) return `https://www.youtube-nocookie.com/embed/${youtube[1]}?autoplay=1`;

    const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;

    return url;
  }

  isInternal(url: string | undefined): boolean {
    return !!url && url.startsWith('/') && !url.startsWith('//');
  }
}
