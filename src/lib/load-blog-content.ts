import { getCollection, type CollectionEntry } from 'astro:content';
import { loadQuery } from '@/sanity/lib/load-query';
import { normalizeSanityPost } from '@/sanity/lib/normalize';
import { publishedPostsQuery } from '@/sanity/lib/queries';
import type { NormalizedBlogEntry, SanityPost } from '@/sanity/lib/types';
import { getReadingTime } from './utils';
import { mergeBlogEntries } from './blog-content';

function normalizeLocalPost(post: CollectionEntry<'blog'>): NormalizedBlogEntry {
  return {
    source: 'local',
    id: post.id,
    slug: post.id.replace(/^en\//, ''),
    title: post.data.title,
    description: post.data.description,
    publishedAt: post.data.publishedAt,
    updatedAt: post.data.updatedAt,
    author: post.data.author,
    tags: post.data.tags,
    image: post.data.image,
    imageAlt: post.data.imageAlt,
    featured: post.data.featured,
    svgSlug: post.data.svgSlug,
    localEntry: post,
  };
}

async function getSanityPosts(): Promise<NormalizedBlogEntry[]> {
  if (!import.meta.env.PUBLIC_SANITY_PROJECT_ID) return [];

  const { data } = await loadQuery<SanityPost[]>({ query: publishedPostsQuery });
  return data.map(normalizeSanityPost);
}

export async function getMergedBlogEntries(): Promise<NormalizedBlogEntry[]> {
  const localPosts = await getCollection('blog', ({ data }) => {
    return data.locale === 'en' && data.draft !== true;
  });

  return mergeBlogEntries(localPosts.map(normalizeLocalPost), await getSanityPosts());
}

export function getBlogReadingTime(post: NormalizedBlogEntry): number {
  if (post.source === 'local' && post.localEntry && typeof post.localEntry === 'object' && 'body' in post.localEntry) {
    return getReadingTime(typeof post.localEntry.body === 'string' ? post.localEntry.body : '');
  }

  return getReadingTime(JSON.stringify(post.body ?? ''));
}