import { describe, expect, it } from 'vitest';
import { buildRssItems, MAX_RSS_COMMONPLACE_ITEMS, MAX_RSS_ITEMS } from '@/lib/rss';

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
      [],
      { url: 'https://example.com', name: 'Steel Wagstaff' }
    );

    expect(items.map((item) => [item.title, item.link])).toEqual([
      ['New playlist', 'https://example.com/music/new-playlist'],
      ['Blog post', 'https://example.com/blog/blog-post/'],
    ]);
  });

  it('turns a commonplace quote into a plain-text description with attribution', () => {
    const [item] = buildRssItems(
      [],
      [],
      [
        {
          id: '49175892722',
          data: {
            title: 'From "A Woman of No Importance", Oscar Wilde',
            type: 'text',
            source: 'The Commonplace',
            publishedAt: new Date('2026-03-01'),
            tags: ['respect'],
            draft: false,
            locale: 'en',
          },
          body: 'I have **nothing** to hide.\n\n*And nothing to fear.*',
        },
      ] as never[],
      { url: 'https://example.com', name: 'Steel Wagstaff' }
    );

    expect(item.description).toBe(
      'I have nothing to hide.\n\nAnd nothing to fear.\n\nvia The Commonplace'
    );
    expect(item.link).toBe('https://example.com/commonplace/49175892722/');
    expect(item.category).toBe('Commonplace');
  });

  it('appends the image url for photo entries', () => {
    const [item] = buildRssItems(
      [],
      [],
      [
        {
          id: 'photo-1',
          data: {
            title: 'A photo',
            type: 'photo',
            image: 'commonplace-media/photo.png',
            publishedAt: new Date('2026-03-01'),
            tags: [],
            draft: false,
            locale: 'en',
          },
          body: '',
        },
      ] as never[],
      { url: 'https://example.com', name: 'Steel Wagstaff' }
    );

    expect(item.description).toBe('https://example.com/commonplace-media/photo.png');
  });

  it('strips html out of the source attribution', () => {
    const [item] = buildRssItems(
      [],
      [],
      [
        {
          id: 'quoted-1',
          data: {
            title: 'A quotation',
            type: 'text',
            source: '<cite>Albert Camus, <em>The Myth of Sisyphus</em></cite>',
            publishedAt: new Date('2026-03-01'),
            tags: [],
            draft: false,
            locale: 'en',
          },
          body: 'A quote.',
        },
      ] as never[],
      { url: 'https://example.com', name: 'Steel Wagstaff' }
    );

    expect(item.description).toBe('A quote.\n\nvia Albert Camus, The Myth of Sisyphus');
  });

  it('keeps only the newest items once the cap is reached', () => {
    const posts = Array.from({ length: MAX_RSS_ITEMS + 100 }, (_, index) => ({
      id: `en/post-${index}`,
      data: {
        title: `Post ${index}`,
        description: '',
        publishedAt: new Date(2026, 0, 1 + index),
        author: 'Writer',
        tags: [],
        locale: 'en',
        draft: false,
      },
    })) as never[];

    const items = buildRssItems(posts, [], [], {
      url: 'https://example.com',
      name: 'Steel Wagstaff',
    });

    expect(items).toHaveLength(MAX_RSS_ITEMS);
    expect(items[0].title).toBe(`Post ${MAX_RSS_ITEMS + 99}`);
    expect(items[MAX_RSS_ITEMS - 1].title).toBe('Post 100');
  });

  it('caps commonplace entries separately from the overall total', () => {
    const commonplace = Array.from({ length: 400 }, (_, index) => ({
      id: `quote-${index}`,
      data: {
        title: `Quote ${index}`,
        type: 'text',
        publishedAt: new Date(2026, 0, 1 + index),
        tags: [],
        draft: false,
        locale: 'en',
      },
      body: 'Words.',
    })) as never[];

    const posts = Array.from({ length: 200 }, (_, index) => ({
      id: `en/post-${index}`,
      data: {
        title: `Post ${index}`,
        description: '',
        publishedAt: new Date(2026, 0, 1 + index),
        author: 'Writer',
        tags: [],
        locale: 'en',
        draft: false,
      },
    })) as never[];

    const items = buildRssItems(posts, [], commonplace, {
      url: 'https://example.com',
      name: 'Steel Wagstaff',
    });
    const count = (category: string) =>
      items.filter((item) => item.category === category).length;

    expect(items).toHaveLength(MAX_RSS_ITEMS);
    expect(count('Commonplace')).toBe(MAX_RSS_COMMONPLACE_ITEMS);
    expect(count('Blog')).toBe(MAX_RSS_ITEMS - MAX_RSS_COMMONPLACE_ITEMS);
  });

  it('adds an enclosure for audio entries only', () => {
    const items = buildRssItems(
      [],
      [],
      [
        {
          id: 'audio-1',
          data: {
            title: 'A song',
            type: 'audio',
            audioUrl: 'https://cdn.example.com/song.mp3',
            publishedAt: new Date('2026-03-01'),
            tags: [],
            draft: false,
            locale: 'en',
          },
          body: '',
        },
        {
          id: 'text-1',
          data: {
            title: 'A quote',
            type: 'text',
            publishedAt: new Date('2026-02-01'),
            tags: [],
            draft: false,
            locale: 'en',
          },
          body: 'Words.',
        },
      ] as never[],
      { url: 'https://example.com', name: 'Steel Wagstaff' }
    );

    expect(items[0].enclosure).toEqual({
      url: 'https://cdn.example.com/song.mp3',
      type: 'audio/mpeg',
    });
    expect(items[1].enclosure).toBeUndefined();
  });
});