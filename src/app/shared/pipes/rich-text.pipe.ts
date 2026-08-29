import { Pipe, PipeTransform } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { RichTextService } from '../services/rich-text.service';
import { ImagePurpose } from '../services/image-optimization.service';

/**
 * `{{ block.body | richText }}` — CMS rich text normalized (media-library
 * images resolved, transformed and lazy-loaded) and marked safe for an
 * [innerHTML] binding. Pure, so the rewrite runs once per distinct string
 * rather than on every change-detection pass.
 */
@Pipe({ name: 'richText', standalone: true, pure: true })
export class RichTextPipe implements PipeTransform {
  constructor(private richText: RichTextService) {}

  transform(value: string | undefined | null, purpose: ImagePurpose = 'content'): SafeHtml | undefined {
    return this.richText.toSafeHtml(value, purpose);
  }
}
