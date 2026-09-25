import { describe, expect, it } from 'vitest';
import type { NormalizedCommonplaceEntry } from '@/sanity/lib/types';
import { getCommonplacePageEntries, mergeCommonplaceEntries } from '@/lib/commonplace-data';

const entry = (overrides: Partial<NormalizedCommonplaceEntry>): NormalizedCommonplaceEntry => ({
  source: 'local',
  id: 'local-1',
  title: 'Example',
  type: 'text',
  publishedAt: new Date('2026-01-01T00:00:00.000Z'),
  tags: [],
  ...overrides,
});

describe('mergeCommonplaceEntries', () => {
  it('merges all commonplace media types in descending date order', () => {
    const result = mergeCommonplaceEntries(
      [entry({ id: 'local-old', publishedAt: new Date('2025-01-01') })],
      [
        entry({ source: 'sanity', id: 'sanity-video', type: 'video', publishedAt: new Date('2026-01-01') }),
        entry({ source: 'sanity', id: 'sanity-photo', type: 'photo', publishedAt: new Date('2025-06-01') }),
      ],
    );

    expect(result.map((item) => item.id)).toEqual(['sanity-video', 'sanity-photo', 'local-old']);
    expect(result.map((item) => item.type)).toEqual(['video', 'photo', 'text']);
  });

  it('paginates merged entries without dropping the source metadata', () => {
    const entries = [
      entry({ id: 'one' }),
      entry({ id: 'two' }),
      entry({ id: 'three' }),
    ];

    expect(getCommonplacePageEntries(entries, 2, 2).map((item) => item.id)).toEqual(['three']);
  });
});
