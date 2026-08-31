import { Injectable } from '@angular/core';

/**
 * Usage context for a delivered image. Each purpose maps to a display width
 * (used for the primary transformed URL), a set of candidate widths (for
 * `srcset`), and a `sizes` value matching where that purpose is actually
 * laid out in the templates (see each preset's comment).
 */
export type ImagePurpose = 'hero' | 'content' | 'card' | 'thumbnail' | 'icon';

interface ImagePreset {
  width: number;
  srcsetWidths: number[];
  sizes: string;
}

const PRESETS: Record<ImagePurpose, ImagePreset> = {
  // Full-bleed hero/banner slides and section video backgrounds.
  hero: { width: 1920, srcsetWidths: [768, 1280, 1920], sizes: '100vw' },
  // Large single content images inside a half-width (col-lg-6) column:
  // about, why-choose-us, skills, pillar and content pages.
  content: { width: 1200, srcsetWidths: [600, 900, 1200], sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px' },
  // Grid cards: 3/4-column portfolio, service, category and guide cards.
  card: { width: 800, srcsetWidths: [400, 600, 800], sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' },
  // Small thumbnails: team photos, avatars, related-post covers.
  thumbnail: { width: 400, srcsetWidths: [200, 300, 400], sizes: '(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 300px' },
  // Icons/logos — never need more than a couple hundred px.
  icon: { width: 200, srcsetWidths: [], sizes: '' },
};

const UPLOAD_MARKER = '/image/upload/';
const VERSION_SEGMENT_RE = /^v\d+$/;
// A transformation segment always opens with one of Cloudinary's reserved
// parameter keys (f_, q_, w_, ...). Checking for a known prefix — rather
// than a generic "word_word" shape — avoids misidentifying an ordinary
// public_id or folder name (e.g. "hero_banner.jpg") as an existing
// transform and clobbering it.
const TRANSFORM_PREFIX_RE = /^(f_|q_|w_|h_|c_|dpr_|fl_|g_|ar_|e_|l_|b_|bo_|co_|r_|so_|eo_|du_|vc_|ac_|x_|y_|z_|o_)/i;

@Injectable({ providedIn: 'root' })
export class ImageOptimizationService {

  /** True for Cloudinary delivery URLs this service knows how to transform. */
  isCloudinaryUpload(url: string | undefined | null): boolean {
    return !!url && url.includes(UPLOAD_MARKER);
  }

  private isSvg(url: string): boolean {
    return /\.svg(\?.*)?$/i.test(url);
  }

  /**
   * Inserts (or replaces) an `f_auto,q_auto,w_<width>,c_limit` transform
   * right after `/image/upload/`. Safe to call on a URL that already has a
   * transform segment — it replaces it rather than stacking a second one.
   * Non-Cloudinary URLs (local assets, other CDNs, data URIs) and SVGs pass
   * through unchanged.
   */
  getOptimizedUrl(url: string | undefined | null, width: number, opts?: { quality?: string; crop?: string }): string {
    if (!url) return '';
    if (this.isSvg(url) || !this.isCloudinaryUpload(url)) return url;

    const markerIndex = url.indexOf(UPLOAD_MARKER);
    const prefix = url.slice(0, markerIndex + UPLOAD_MARKER.length);
    const rest = url.slice(markerIndex + UPLOAD_MARKER.length);
    const segments = rest.split('/');
    const [firstSegment, ...remaining] = segments;

    const quality = opts?.quality ?? 'q_auto';
    const crop = opts?.crop ?? 'c_limit';
    const transform = `f_auto,${quality},w_${width},${crop}`;

    const alreadyTransformed = !VERSION_SEGMENT_RE.test(firstSegment) && TRANSFORM_PREFIX_RE.test(firstSegment.split(',')[0]);
    const tail = alreadyTransformed ? remaining.join('/') : segments.join('/');

    return `${prefix}${transform}/${tail}`;
  }

  getUrlForPurpose(url: string | undefined | null, purpose: ImagePurpose): string {
    return this.getOptimizedUrl(url, PRESETS[purpose].width);
  }

  getHeroUrl(url: string | undefined | null): string {
    return this.getUrlForPurpose(url, 'hero');
  }

  getContentUrl(url: string | undefined | null): string {
    return this.getUrlForPurpose(url, 'content');
  }

  getCardUrl(url: string | undefined | null): string {
    return this.getUrlForPurpose(url, 'card');
  }

  getThumbnailUrl(url: string | undefined | null): string {
    return this.getUrlForPurpose(url, 'thumbnail');
  }

  getIconUrl(url: string | undefined | null): string {
    return this.getUrlForPurpose(url, 'icon');
  }

  getSizes(purpose: ImagePurpose): string {
    return PRESETS[purpose].sizes;
  }

  /**
   * Builds a `srcset` string for the given purpose, e.g.
   * ".../w_768,.../foo.jpg 768w, .../w_1280,.../foo.jpg 1280w, ...".
   * Returns '' for non-Cloudinary URLs/SVGs — templates should omit the
   * `srcset` attribute in that case and rely on `src` alone.
   */
  getResponsiveSrcSet(url: string | undefined | null, purpose: ImagePurpose): string {
    if (!url || this.isSvg(url) || !this.isCloudinaryUpload(url)) return '';
    const widths = PRESETS[purpose].srcsetWidths;
    if (!widths.length) return '';
    return widths.map(w => `${this.getOptimizedUrl(url, w)} ${w}w`).join(', ');
  }
}
