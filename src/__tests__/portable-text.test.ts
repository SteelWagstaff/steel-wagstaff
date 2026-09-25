import { describe, expect, it } from 'vitest';
import { portableTextToPlainText } from '@/lib/portable-text';

describe('Portable Text helpers', () => {
  it('extracts readable preview text from block children', () => {
    expect(portableTextToPlainText([
      {
        _type: 'block',
        children: [
          { _type: 'span', text: 'A first paragraph.' },
          { _type: 'span', text: 'With more text.' },
        ],
      },
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'A second paragraph.' }],
      },
    ])).toBe('A first paragraph. With more text. A second paragraph.');
  });

  it('returns an empty preview for missing content', () => {
    expect(portableTextToPlainText(undefined)).toBe('');
  });
});
