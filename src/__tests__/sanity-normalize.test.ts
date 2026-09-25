import { describe, expect, it } from 'vitest';
import { normalizeSanityCommonplace, normalizeSanityPost } from '@/sanity/lib/normalize';

const image = {
  asset: { _ref: 'image-example-1200x800-jpg' },
  alt: 'Example image',
};

describe('Sanity normalization', () => {
  it('normalizes a complete blog post', () => {
    const post = normalizeSanityPost({
      _id: 'post-1',
      title: 'A Sanity post',
      slug: { current: 'a-sanity-post' },
      description: 'Description',
      publishedAt: '2026-09-24T12:00:00.000Z',
      author: 'Steel',
      tags: ['notes'],
      image,
      imageAlt: 'Example image',
      body: [{ _type: 'block', children: [] }],
      locale: 'en',
      draft: false,
    });

    expect(post).toMatchObject({
      source: 'sanity',
      id: 'post-1',
      slug: 'a-sanity-post',
      title: 'A Sanity post',
      description: 'Description',
      author: 'Steel',
      tags: ['notes'],
      image,
      imageAlt: 'Example image',
    });
    expect(post.publishedAt).toEqual(new Date('2026-09-24T12:00:00.000Z'));
  });

  it('defaults optional blog fields without losing the body', () => {
    const post = normalizeSanityPost({
      _id: 'post-2',
      title: 'Minimal post',
      slug: { current: 'minimal-post' },
      publishedAt: '2026-09-24T12:00:00.000Z',
      body: [],
    });

    expect(post.description).toBe('');
    expect(post.author).toBe('Team');
    expect(post.tags).toEqual([]);
    expect(post.body).toEqual([]);
  });

  it('normalizes each commonplace media field without dropping optional values', () => {
    const entry = normalizeSanityCommonplace({
      _id: 'commonplace-1',
      title: 'A video note',
      type: 'video',
      publishedAt: '2026-09-24T12:00:00.000Z',
      tags: ['video'],
      content: [{ _type: 'block', children: [] }],
      videoUrl: 'https://www.youtube.com/watch?v=example',
      source: 'Example source',
      locale: 'en',
    });

    expect(entry).toMatchObject({
      source: 'sanity',
      id: 'commonplace-1',
      type: 'video',
      videoUrl: 'https://www.youtube.com/watch?v=example',
      sourceUrl: 'Example source',
      tags: ['video'],
    });
    expect(entry.publishedAt).toEqual(new Date('2026-09-24T12:00:00.000Z'));
  });
});
