import type { SanityCommonplaceEntry, SanityPost, NormalizedBlogEntry, NormalizedCommonplaceEntry } from './types';

export function normalizeSanityPost(post: SanityPost): NormalizedBlogEntry {
  return {
    source: 'sanity',
    id: post._id,
    slug: post.slug.current,
    title: post.title,
    description: post.description ?? '',
    publishedAt: new Date(post.publishedAt),
    author: post.author ?? 'Team',
    tags: post.tags ?? [],
    image: post.image,
    imageAlt: post.imageAlt ?? post.image?.alt,
    body: post.body ?? [],
  };
}

export function normalizeSanityCommonplace(entry: SanityCommonplaceEntry): NormalizedCommonplaceEntry {
  return {
    source: 'sanity',
    id: entry._id,
    title: entry.title,
    type: entry.type,
    publishedAt: new Date(entry.publishedAt),
    tags: entry.tags ?? [],
    content: entry.content ?? [],
    image: entry.image,
    imageAlt: entry.imageAlt ?? entry.image?.alt,
    videoUrl: entry.videoUrl,
    audioUrl: entry.audioUrl,
    sourceUrl: entry.source,
  };
}
