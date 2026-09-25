import type { PortableTextBlock } from '@portabletext/types';

export function portableTextToPlainText(value: PortableTextBlock[] | undefined): string {
  if (!value) return '';

  return value
    .flatMap((block) => 'children' in block && Array.isArray(block.children) ? block.children : [])
    .map((child) => 'text' in child && typeof child.text === 'string' ? child.text : '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
