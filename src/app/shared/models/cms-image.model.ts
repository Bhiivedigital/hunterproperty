/** A CMS media reference resolved to an optimized delivery URL, plus the
 * original upload's intrinsic pixel dimensions (as reported by Strapi) so
 * templates can set real width/height attributes and avoid layout shift. */
export interface CmsImage {
  url: string;
  width: number;
  height: number;
}
