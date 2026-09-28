import { describe, expect, it } from 'vitest';
import { buildCommonplacePreview } from '@/lib/commonplace-preview';

const text = (source: string) => {
  const blocks = buildCommonplacePreview(source);
  return blocks
    .filter((block) => block.type === 'text')
    .map((block) => (block.type === 'text' ? block.html : ''))
    .join('\n');
};

const shape = (source: string) => buildCommonplacePreview(source).map((block) => block.type);

describe('commonplace preview thematic breaks', () => {
  it('turns a standalone asterisk run into a rule', () => {
    expect(shape('first\n\n***\n\nsecond')).toEqual(['text', 'hr', 'text']);
  });

  it('accepts five or more markers and surrounding whitespace', () => {
    expect(shape('a\n\n*****\n\nb')).toEqual(['text', 'hr', 'text']);
    expect(shape('a\n\n*** \n\nb')).toEqual(['text', 'hr', 'text']);
    expect(shape('a\n\n  ***\n\nb')).toEqual(['text', 'hr', 'text']);
  });

  it('accepts dashes and underscores, spaced or not', () => {
    expect(shape('a\n\n---\n\nb')).toEqual(['text', 'hr', 'text']);
    expect(shape('a\n\n___\n\nb')).toEqual(['text', 'hr', 'text']);
    expect(shape('a\n\n- - -\n\nb')).toEqual(['text', 'hr', 'text']);
  });

  it('leaves two markers alone', () => {
    expect(shape('a\n\n--\n\nb')).toEqual(['text']);
  });

  it('ignores runs that are not standalone', () => {
    expect(shape('a\n\n-*-*\n\nb')).toEqual(['text']);
    expect(shape('the frontispiece *** 1852')).toEqual(['text']);
    expect(shape('**Attn:** Mrs. Doyle')).toEqual(['text']);
  });

  it('collapses consecutive rules and drops rules at the edges', () => {
    expect(shape('***\n\na\n\n***\n\n***\n\nb\n\n***')).toEqual(['text', 'hr', 'text']);
  });

  it('treats a quoted run of markers as a rule, matching CommonMark', () => {
    expect(shape('before\n\n> *****\n\nafter')).toEqual(['text', 'hr', 'text']);
  });
});

describe('commonplace preview inline emphasis', () => {
  it('renders strong and emphasis', () => {
    expect(text('a **bold** word')).toBe('a <strong>bold</strong> word');
    expect(text('a *italic* word')).toBe('a <em>italic</em> word');
    expect(text('a _italic_ word')).toBe('a <em>italic</em> word');
  });

  it('nests emphasis inside strong', () => {
    expect(text('**a *b* c**')).toBe('<strong>a <em>b</em> c</strong>');
  });

  it('renders a triple run as nested tags', () => {
    expect(text('***The solar system.***')).toBe('<em><strong>The solar system.</strong></em>');
  });

  it('does not emphasise intraword underscores', () => {
    expect(text('snake_case_name')).toBe('snake_case_name');
  });

  it('leaves unmatched delimiters as literal text', () => {
    expect(text('a * lonely')).toBe('a * lonely');
    expect(text('the sky is the limit**')).toBe('the sky is the limit**');
  });

  it('honours the rule of three for straddling delimiter runs', () => {
    expect(text('*a**a')).toBe('*a**a');
    expect(text('**a**')).toBe('<strong>a</strong>');
  });

  it('keeps the leftover characters of a partly consumed run', () => {
    expect(text('*a***a')).toBe('<em>a</em>**a');
  });

  it('only ever emits strong and em', () => {
    for (const block of buildCommonplacePreview('**a** *b* ***c*** [x](y) <b>z</b>')) {
      if (block.type === 'text') {
        expect(block.html.match(/<\/?([a-z]+)/g)?.join(' ')).not.toMatch(/<\/?(?!strong\b|em\b|\/em\b|\/strong\b)[a-z]/);
      }
    }
  });

  it('escapes html in content', () => {
    expect(text('5 * 6 & 7 < 8')).toBe('5 * 6 &amp; 7 &lt; 8');
  });
});

describe('commonplace preview legacy unwrapping', () => {
  it('converts block level tags into line breaks and drops other tags', () => {
    expect(text('<p>one</p><p>two</p>')).toBe('one\ntwo');
    expect(text('one<br>two')).toBe('one\ntwo');
    expect(text('<div class="x">body</div>')).toBe('body');
  });

  it('drops markdown images and heading marks', () => {
    expect(text('![alt](/img.jpg)caption')).toBe('caption');
    expect(text('## Heading')).toBe('Heading');
  });

  it('preserves paragraph spacing inside a block', () => {
    expect(buildCommonplacePreview('one\n\n\n\ntwo')).toEqual([
      { type: 'text', html: 'one\n\ntwo' },
    ]);
  });
});

describe('commonplace preview line breaks', () => {
  it('does not open a blank line for a break tag that ends its line', () => {
    expect(text('one<br>\ntwo')).toBe('one\ntwo');
    expect(text('one<br />\ntwo')).toBe('one\ntwo');
    expect(text('<p>one</p>\ntwo')).toBe('one\ntwo');
  });

  it('keeps a blank line the author wrote after a break tag', () => {
    expect(text('one<br>\n\ntwo')).toBe('one\n\ntwo');
  });

  it('keeps the lines of a poem together', () => {
    expect(text('stanza one\nstill stanza one\n\nstanza two')).toBe(
      'stanza one\nstill stanza one\n\nstanza two',
    );
  });

  it('collapses hard-wrapped prose the way the post page does', () => {
    expect(text('one<br>two<br>three')).toBe('one\ntwo\nthree');
  });
});

describe('commonplace preview dashes', () => {
  it('turns a double hyphen into an em dash', () => {
    expect(text('-- Tu Fu (712-770)')).toBe('— Tu Fu (712-770)');
  });

  it('turns a triple hyphen into an em dash', () => {
    expect(text('word---word')).toBe('word—word');
  });

  it('handles several runs on one line', () => {
    expect(text('a--b--c')).toBe('a—b—c');
  });

  it('leaves a single hyphen alone', () => {
    expect(text('wind-tossed boats')).toBe('wind-tossed boats');
  });

  it('still reads a standalone run of hyphens as a rule', () => {
    expect(shape('one\n\n---\n\ntwo')).toEqual(['text', 'hr', 'text']);
    expect(shape('one\n\n- - -\n\ntwo')).toEqual(['text', 'hr', 'text']);
    expect(shape('one\n\n-----\n\ntwo')).toEqual(['text', 'hr', 'text']);
  });

  it('reads a lone double hyphen as a dash, not a rule', () => {
    expect(shape('--')).toEqual(['text']);
    expect(text('--')).toBe('—');
  });
});
