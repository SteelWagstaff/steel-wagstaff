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
  getCommonplaceTagHref,
  getCommonplaceTagLabels,
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
