import { Pipe, PipeTransform } from '@angular/core';
import { ImageOptimizationService, ImagePurpose } from '../services/image-optimization.service';

/** `{{ image.url | cldSrcset:'card' }}` — responsive Cloudinary srcset for a purpose. */
@Pipe({ name: 'cldSrcset', standalone: true, pure: true })
export class CldSrcsetPipe implements PipeTransform {
  constructor(private imageOpt: ImageOptimizationService) {}

  transform(url: string | undefined | null, purpose: ImagePurpose): string {
    return this.imageOpt.getResponsiveSrcSet(url, purpose);
  }
}

/** `{{ 'card' | cldSizes }}` — the `sizes` attribute matching a purpose's layout. */
@Pipe({ name: 'cldSizes', standalone: true, pure: true })
export class CldSizesPipe implements PipeTransform {
  constructor(private imageOpt: ImageOptimizationService) {}

  transform(purpose: ImagePurpose): string {
    return this.imageOpt.getSizes(purpose);
  }
}
