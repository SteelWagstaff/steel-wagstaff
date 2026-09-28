import { describe, expect, it } from 'vitest';
import {
  COMMONPLACE_PAGE_SIZE,
  commonplaceTagSlug,
  filterCommonplaceEntriesByTag,
  getCommonplaceCounts,
  getCommonplaceEntryHref,
  getCommonplacePageCount,
  getCommonplacePageEntries,
  getCommonplaceSharedTags,
  getCommonplaceTagCounts,
  commonplaceTitle,
  getCommonplaceTagHref,
  getCommonplaceTagLabels,
  renderCommonplaceSource,
  type CommonplaceEntry,
} from '@/lib/commonplace';

const entry = (id: string, tags: string[]) =>
  ({ id, data: { tags } }) as unknown as CommonplaceEntry;

describe('Commonplace pagination', () => {
  it('uses fifty entries per page', () => {
    const entries = Array.from({ length: COMMONPLACE_PAGE_SIZE + 1 }, (_, index) => ({
      id: String(index),
    })) as never[];

    expect(getCommonplacePageEntries(entries, 1)).toHaveLength(COMMONPLACE_PAGE_SIZE);
    expect(getCommonplacePageEntries(entries, 2)).toHaveLength(1);
  });

  it('calculates at least one page for an empty archive', () => {
    expect(getCommonplacePageCount(0)).toBe(1);
    expect(getCommonplacePageCount(51)).toBe(3);
  });
});

describe('Commonplace tag slugs', () => {
  it('lowercases and hyphenates', () => {
    expect(commonplaceTagSlug('George Oppen')).toBe('george-oppen');
    expect(commonplaceTagSlug('non-native species')).toBe('non-native-species');
    expect(commonplaceTagSlug('Dr. Hook')).toBe('dr-hook');
  });

  it('folds accents and drops apostrophes so variants agree', () => {
    expect(commonplaceTagSlug('Café')).toBe('cafe');
    expect(commonplaceTagSlug("d'Été")).toBe('dete');
  });

  it('merges case and punctuation variants of the same tag', () => {
    const entries = [entry('a', ['cats', 'CATS!']), entry('b', ['Cats'])];

    expect(getCommonplaceTagCounts(entries).get('cats')).toBe(3);
    expect(filterCommonplaceEntriesByTag(entries, 'cats')).toHaveLength(2);
  });

  it('ignores tags that slugify to nothing', () => {
    expect(commonplaceTagSlug('!!!')).toBe('');
    expect(getCommonplaceTagCounts([entry('a', ['!!!', 'real'])]).size).toBe(1);
  });
});

describe('Commonplace shared tags', () => {
  it('only links tags used by more than one post', () => {
    const entries = [entry('a', ['poetry', 'lonely']), entry('b', ['poetry'])];

    expect([...getCommonplaceSharedTags(entries)]).toEqual(['poetry']);
  });

  it('picks the most used spelling as the display label', () => {
    const entries = [
      entry('a', ['great musics', 'Great Musics']),
      entry('b', ['great musics']),
      entry('c', ['Great Musics']),
    ];

    expect(getCommonplaceTagLabels(entries).get('great-musics')).toBe('great musics');
  });
});

describe('Commonplace hrefs', () => {
  it('builds post and tag urls', () => {
    expect(getCommonplaceEntryHref(entry('12529375758', []))).toBe('/commonplace/12529375758');
    expect(getCommonplaceTagHref('poetry')).toBe('/commonplace/tag/poetry/1');
    expect(getCommonplaceTagHref('poetry', 3)).toBe('/commonplace/tag/poetry/3');
  });
});

describe('Commonplace counts', () => {
  it('tallies every post type', () => {
    const entries = [
      { data: { type: 'text' } },
      { data: { type: 'text' } },
      { data: { type: 'photo' } },
    ] as unknown as CommonplaceEntry[];

    expect(getCommonplaceCounts(entries)).toEqual({ text: 2, photo: 1, video: 0, audio: 0 });
  });
});

describe('Commonplace source rendering', () => {
  it('drops formatting tags that would otherwise show as text', () => {
    expect(
      renderCommonplaceSource('Robert Bringhurst, <em>The Elements of Typographic Style</em>')
    ).toBe('Robert Bringhurst, The Elements of Typographic Style');
    expect(renderCommonplaceSource('A title, p. 120.<br/>')).toBe('A title, p. 120.');
    expect(renderCommonplaceSource('One <i>and</i> <b>two</b>')).toBe('One and two');
  });

  it('undoes markdown escapes left in the field, without inventing spaces', () => {
    // The field has no space after the comma, so neither does the output.
    expect(
      renderCommonplaceSource('Bringhurst,\\_<em>The Elements</em>\\_(4th ed.)')
    ).toBe('Bringhurst,_The Elements_(4th ed.)');
  });

  it('keeps a link clickable and rebuilds it from href and label', () => {
    expect(
      renderCommonplaceSource('<a href="https://example.com/a">This</a> beautiful vignette.')
    ).toBe(
      '<a href="https://example.com/a" rel="noopener noreferrer">This</a> beautiful vignette.'
    );
  });

  it('keeps a target only when the field asked for one', () => {
    expect(
      renderCommonplaceSource('<a href="https://example.com" target="_blank">Chapter 11</a>')
    ).toContain('target="_blank"');
    expect(renderCommonplaceSource('<a href="https://example.com">Chapter 11</a>')).not.toContain(
      'target'
    );
  });

  it('refuses a link that is not http or https', () => {
    expect(renderCommonplaceSource('<a href="javascript:alert(1)">click</a>')).toBe('click');
    expect(renderCommonplaceSource('<a href="/relative">click</a>')).toBe('click');
  });

  it('never passes through a script tag', () => {
    expect(renderCommonplaceSource('Safe <script>alert(1)</script> text')).toBe(
      'Safe alert(1) text'
    );
  });

  it('escapes text so it cannot become markup', () => {
    expect(renderCommonplaceSource('A & B <not a tag>')).toBe('A &amp; B');
  });

  it('leaves a plain field alone', () => {
    expect(renderCommonplaceSource('William Carlos Williams, Autobiography')).toBe(
      'William Carlos Williams, Autobiography'
    );
  });
});

describe('Commonplace title rendering', () => {
  it('drops formatting tags, keeping the words', () => {
    expect(commonplaceTitle('Holden Caulfield, <em>The Catcher in the Rye</em>')).toBe(
      'Holden Caulfield, The Catcher in the Rye'
    );
    expect(commonplaceTitle('Li Zhi, from <i>Xu fenshu </i>[<i>Sequel</i>]')).toBe(
      'Li Zhi, from Xu fenshu [Sequel]'
    );
  });

  it('unwraps a link down to its label', () => {
    expect(commonplaceTitle('“<a href="https://example.com">Mario Giacomelli</a>”')).toBe(
      '“Mario Giacomelli”'
    );
  });

  it('discards a tag the source cut short', () => {
    expect(commonplaceTitle('“<a href=”, Brigit Pegeen Kelly [1951-2016]')).toBe(
      '“, Brigit Pegeen Kelly [1951-2016]'
    );
    expect(commonplaceTitle('“https://example.com”, <a…')).toBe('“https://example.com”,');
  });

  it('decodes entities so they are not shown twice', () => {
    expect(commonplaceTitle('Salm &amp; Tur')).toBe('Salm & Tur');
    expect(commonplaceTitle('caf&#233;')).toBe('café');
    expect(commonplaceTitle('a &lt;em&gt; b')).toBe('a <em> b');
  });

  it('undoes markdown escapes', () => {
    expect(commonplaceTitle(String.raw`Sleeping\_/\_on the street`)).toBe('Sleeping_/_on the street');
  });

  it('leaves a bare angle bracket that is not a tag', () => {
    expect(commonplaceTitle('3 < 5 and 4 > 2')).toBe('3 < 5 and 4 > 2');
  });

  it('collapses whitespace from a wrapped field', () => {
    expect(commonplaceTitle('one\n  two   three')).toBe('one two three');
  });

  it('handles a missing title', () => {
    expect(commonplaceTitle(undefined)).toBe('');
    expect(commonplaceTitle('')).toBe('');
  });
});
