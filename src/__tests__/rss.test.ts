import { describe, expect, it } from 'vitest';
import { buildRssItems } from '@/lib/rss';

describe('RSS items', () => {
  it('includes published English playlists alongside blog posts in date order', () => {
    const items = buildRssItems(
      [
        {
          id: 'en/blog-post',
          data: {
            title: 'Blog post',
            description: 'A blog post',
            publishedAt: new Date('2026-01-01'),
            author: 'Writer',
            tags: ['writing'],
            locale: 'en',
            draft: false,
          },
        },
      ] as never[],
      [
        {
          id: 'en/new-playlist',
          data: {
            title: 'New playlist',
            description: 'A playlist',
            publishedAt: new Date('2026-02-01'),
            author: 'DJ',
            tags: ['music'],
            locale: 'en',
            draft: false,
          },
        },
      ] as never[],
      'https://example.com'
    );

    expect(items.map((item) => [item.title, item.link])).toEqual([
      ['New playlist', 'https://example.com/music/new-playlist'],
      ['Blog post', 'https://example.com/blog/blog-post/'],
    ]);
  });
});