import { ContentBlock } from '../models/pillar-page.model';
import { FaqEntry } from '../services/structured-data.service';
import { RichTextService } from '../services/rich-text.service';

/**
 * Question/answer pairs from a page's FAQ blocks, as plain text for FAQPage
 * structured data. Only `blocks.faqs`: an accordion block is general content
 * that happens to collapse, not a set of questions.
 */
export function faqEntries(blocks: ContentBlock[] | undefined, richText: RichTextService): FaqEntry[] {
  return (blocks ?? [])
    .filter(block => block.__component === 'blocks.faqs')
    .flatMap(block => (block as Extract<ContentBlock, { __component: 'blocks.faqs' }>).items ?? [])
    .map(item => ({ question: richText.toPlainText(item.question) ?? '', answer: richText.toPlainText(item.answer) ?? '' }))
    .filter(item => item.question && item.answer);
}
