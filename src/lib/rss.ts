import type { CollectionEntry } from 'astro:content';

export interface RssItem {
  title: string;
  link: string;
  description: string;
  publishedAt: Date;
  author: string;
  tags: string[];
  category: 'Blog' | 'Playlist';
}

const getSlug = (id: string) => id.replace(/^en\//, '');

export function buildRssItems(
  posts: CollectionEntry<'blog'>[],
  playlists: CollectionEntry<'music'>[],
  siteUrl: string
): RssItem[] {
  const blogItems: RssItem[] = posts
    .filter(({ data }) => data.locale === 'en' && !data.draft)
    .map((post) => ({
      title: post.data.title,
      link: `${siteUrl}/blog/${getSlug(post.id)}/`,
      description: post.data.description,
      publishedAt: post.data.publishedAt,
      author: post.data.author,
      tags: post.data.tags,
      category: 'Blog',
    }));

  const playlistItems: RssItem[] = playlists
    .filter(({ data }) => data.locale === 'en' && !data.draft)
    .map((playlist) => ({
      title: playlist.data.title,
      link: `${siteUrl}/music/${getSlug(playlist.id)}`,
      description: playlist.data.description ?? '',
      publishedAt: playlist.data.publishedAt,
      author: playlist.data.author,
      tags: playlist.data.tags,
      category: 'Playlist',
    }));

  return [...blogItems, ...playlistItems].sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
  );
}