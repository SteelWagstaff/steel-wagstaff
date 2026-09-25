import { describe, expect, it, vi } from 'vitest';
import type { NormalizedBlogEntry } from '@/sanity/lib/types';
import { mergeBlogEntries } from '@/lib/blog-content';

const entry = (overrides: Partial<NormalizedBlogEntry>): NormalizedBlogEntry => ({
  source: 'local',
  id: 'en/example',
  slug: 'example',
  title: 'Example',
  description: '',
  publishedAt: new Date('2026-01-01T00:00:00.000Z'),
  author: 'Team',
  tags: [],
  ...overrides,
});

describe('mergeBlogEntries', () => {
  it('keeps local content authoritative when slugs collide', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = mergeBlogEntries(
      [entry({ source: 'local', id: 'en/example' })],
      [entry({ source: 'sanity', id: 'post-1', title: 'Sanity Example' })],
    );

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Example');
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('returns both sources in descending publication order', () => {
    const result = mergeBlogEntries(
      [entry({ id: 'en/older', slug: 'older', publishedAt: new Date('2025-01-01') })],
      [entry({ source: 'sanity', id: 'newer', slug: 'newer', publishedAt: new Date('2026-01-01') })],
    );

    expect(result.map((post) => post.slug)).toEqual(['newer', 'older']);
  });
});
