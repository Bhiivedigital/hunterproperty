import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { ImageOptimizationService, ImagePurpose } from './image-optimization.service';

// Strapi's rich-text editor writes markdown for anything inserted from the
// media library — `![alt](https://…)` — while everything typed or pasted in
// stays HTML. The same field therefore arrives as a mix of the two, and an
// [innerHTML] binding renders the markdown half as literal text: an editor
// drops an image into a pillar page and sees `![](…jpg)` on the live site.
// Promote that syntax to a real <img> before anything else runs.
const MARKDOWN_IMAGE_RE = /!\[([^\]]*)\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+"[^"]*")?\s*\)/g;

const IMG_TAG_RE = /<img\b[^>]*>/gi;
const SRC_ATTR_RE = /\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;
const TABLE_TAG_RE = /<\/?table\b[^>]*>/gi;

@Injectable({ providedIn: 'root' })
export class RichTextService {

  constructor(
    private sanitizer: DomSanitizer,
    private imageOpt: ImageOptimizationService
  ) {}

  /** CMS rich text, normalized and marked safe for an [innerHTML] binding. */
  toSafeHtml(raw: string | undefined | null, purpose: ImagePurpose = 'content'): SafeHtml | undefined {
    if (!raw) return undefined;
    return this.sanitizer.bypassSecurityTrustHtml(this.normalize(raw, purpose));
  }

  /**
   * Rich text flattened to a single line of prose — for meta descriptions and
   * other places where markup would be shown verbatim rather than rendered.
   */
  toPlainText(raw: string | undefined | null): string | undefined {
    if (!raw) return undefined;
    const text = raw
      .replace(MARKDOWN_IMAGE_RE, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/\s+/g, ' ')
      .trim();
    return text || undefined;
  }

  /**
   * Makes editor-authored HTML behave like the rest of the image pipeline:
   * media-library URLs resolve against the CMS rather than the site, they get
   * a Cloudinary width transform instead of shipping the full-size original,
   * and they load lazily so body images never compete with the LCP element.
   */
  normalize(raw: string, purpose: ImagePurpose = 'content'): string {
    const html = raw.replace(MARKDOWN_IMAGE_RE, (_match, alt: string, url: string) => {
      // `<…>` is markdown's escape for a URL containing spaces.
      const src = url.startsWith('<') && url.endsWith('>') ? url.slice(1, -1) : url;
      return `<img src="${this.escapeAttr(src)}" alt="${this.escapeAttr(alt)}">`;
    });

    return this.wrapTables(html.replace(IMG_TAG_RE, tag => this.rewriteImgTag(tag, purpose)));
  }

  /**
   * Wraps each top-level `<table>` in a horizontally scrollable div.
   *
   * A comparison table an editor writes in the CMS is routinely wider than the
   * article column on a phone. The usual fix — `table { display: block;
   * overflow-x: auto }` — costs the table its table layout: every column
   * collapses to its own content and the borders stop lining up down the page.
   * Moving the scroll onto a wrapper keeps `display: table` intact, so the
   * table still renders as a table and the *wrapper* is what scrolls.
   *
   * Depth-tracked rather than a blind open/close replace, so a table nested
   * inside a cell doesn't get a wrapper of its own — and doesn't close the
   * outer wrapper early.
   */
  private wrapTables(html: string): string {
    let depth = 0;
    return html.replace(TABLE_TAG_RE, tag => {
      if (tag[1] === '/') {
        // A stray `</table>` with nothing open would otherwise emit a closing
        // `</div>` that belongs to no wrapper.
        if (depth === 0) return tag;
        depth -= 1;
        return depth === 0 ? `${tag}</div>` : tag;
      }
      depth += 1;
      return depth === 1 ? `<div class="cms-table-scroll">${tag}` : tag;
    });
  }

  private rewriteImgTag(tag: string, purpose: ImagePurpose): string {
    const match = tag.match(SRC_ATTR_RE);
    const src = match ? (match[1] ?? match[2] ?? match[3] ?? '') : '';
    let result = tag;

    if (src) {
      const resolved = this.imageOpt.getUrlForPurpose(this.toAbsolute(src), purpose);
      result = result.replace(SRC_ATTR_RE, ` src="${this.escapeAttr(resolved)}"`);
    }

    // A width transform on the src makes any srcset the editor pasted point at
    // untransformed originals that are wider than the one now being served,
    // which is exactly the candidate the browser would pick. Drop it.
    result = result.replace(/\ssrcset\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

    if (!/\sloading\s*=/i.test(result)) result = this.addAttr(result, 'loading="lazy"');
    if (!/\sdecoding\s*=/i.test(result)) result = this.addAttr(result, 'decoding="async"');
    if (!/\sclass\s*=/i.test(result)) result = this.addAttr(result, 'class="cms-rich-img"');
    else result = result.replace(/(\sclass\s*=\s*)(?:"([^"]*)"|'([^']*)')/i,
      (_m, prefix: string, dq: string, sq: string) => `${prefix}"${this.escapeAttr((dq ?? sq) + ' cms-rich-img')}"`);

    return result;
  }

  /**
   * Media-library paths are site-root-relative (`/uploads/…`) whenever the CMS
   * serves uploads itself rather than through Cloudinary, and would otherwise
   * 404 against the Angular app's own origin. Everything else — absolute URLs,
   * data URIs, and the app's own `/assets/…` — is left alone.
   */
  private toAbsolute(url: string): string {
    return url.startsWith('/uploads/') ? `${environment.strapiUrl}${url}` : url;
  }

  private addAttr(tag: string, attr: string): string {
    return tag.replace(/\s*(\/?)>$/, (_m, selfClosing: string) => ` ${attr}${selfClosing}>`);
  }

  // Values here are round-tripped out of existing markup as often as they are
  // built fresh, so an already-encoded `&amp;` in a src must not become
  // `&amp;amp;`. Escape only ampersands that don't already open an entity.
  private escapeAttr(value: string): string {
    return value
      .replace(/&(?!#?\w+;)/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
