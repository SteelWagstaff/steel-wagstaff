import type { CollectionEntry } from 'astro:content';
import { buildCommonplaceText } from '@/lib/commonplace-preview';
import { commonplaceTitle } from '@/lib/commonplace';

export interface RssEnclosure {
  url: string;
  type: string;
}

export interface RssItem {
  title: string;
  link: string;
  description: string;
  publishedAt: Date;
  author: string;
  tags: string[];
  category: 'Blog' | 'Playlist' | 'Commonplace';
  enclosure?: RssEnclosure;
}

/** Longest excerpt we will put in a feed description. */
const MAX_EXCERPT_LENGTH = 400;

/** Longest attribution we will put in a feed description. */
const MAX_ATTRIBUTION_LENGTH = 200;

/**
 * Newest items kept in the feed. The archive holds far more entries than a feed
 * should carry, and anything past this point is years old.
 */
export const MAX_RSS_ITEMS = 500;

/**
 * Newest commonplace entries kept, so a burst of quotes cannot crowd out
 * everything else. Applied before the overall cap, which is what keeps the
 * total at {@link MAX_RSS_ITEMS} rather than leaving a gap.
 */
export const MAX_RSS_COMMONPLACE_ITEMS = 350;

const AUDIO_MIME_TYPES: Record<string, string> = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  opus: 'audio/ogg',
  wav: 'audio/wav',
  flac: 'audio/flac',
};

const getSlug = (id: string) => id.replace(/^en\//, '');

const absoluteUrl = (url: string, siteUrl: string) =>
  /^https?:\/\//i.test(url) ? url : `${siteUrl}/${url.replace(/^\/+/, '')}`;

const truncate = (value: string, limit: number) =>
  value.length <= limit ? value : `${value.slice(0, limit).replace(/\s+\S*$/, '')}…`;

/**
 * A few entries pasted a whole HTML block into `source`; feeds want plain text.
 */
const plainSource = (value: string) =>
  value
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Enclosure for an audio entry. The audio lives on third-party hosts, so the
 * type can only be guessed from the extension; redirect URLs like Bandcamp's
 * have none and are skipped.
 */
function audioEnclosure(url: string | undefined): RssEnclosure | undefined {
  if (!url) return undefined;

  const path = url.split('?')[0].split('#')[0];
  const type = AUDIO_MIME_TYPES[path.slice(path.lastIndexOf('.') + 1).toLowerCase()];

  return type ? { url, type } : undefined;
}

function commonplaceDescription(
  entry: CollectionEntry<'commonplace'>,
  siteUrl: string
): string {
  const { content, source, type, image } = entry.data;
  const parts: string[] = [];

  const excerpt = buildCommonplaceText(content || entry.body || '');
  if (excerpt) parts.push(truncate(excerpt, MAX_EXCERPT_LENGTH));

  const attribution = source ? plainSource(source) : '';
  if (attribution) parts.push(`via ${truncate(attribution, MAX_ATTRIBUTION_LENGTH)}`);

  if (type === 'photo' && image) parts.push(absoluteUrl(image, siteUrl));

  return parts.join('\n\n');
}

export function buildRssItems(
  posts: CollectionEntry<'blog'>[],
  playlists: CollectionEntry<'music'>[],
  commonplace: CollectionEntry<'commonplace'>[],
  site: { url: string; name: string }
): RssItem[] {
  const siteUrl = site.url;

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

  const commonplaceItems: RssItem[] = commonplace
    .filter(({ data }) => data.locale === 'en' && !data.draft)
    .map((entry) => ({
      title: commonplaceTitle(entry.data.title) || 'Commonplace',
      link: `${siteUrl}/commonplace/${entry.id}/`,
      description: commonplaceDescription(entry, siteUrl),
      publishedAt: entry.data.publishedAt,
      author: site.name,
      tags: entry.data.tags,
      category: 'Commonplace',
      enclosure: audioEnclosure(entry.data.audioUrl),
    }));

  const sorted = [...blogItems, ...playlistItems, ...commonplaceItems].sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
  );

  let commonplaceCount = 0;
  const kept: RssItem[] = [];

  for (const item of sorted) {
    if (item.category === 'Commonplace') {
      commonplaceCount += 1;
      if (commonplaceCount > MAX_RSS_COMMONPLACE_ITEMS) continue;
    }

    kept.push(item);
    if (kept.length >= MAX_RSS_ITEMS) break;
  }

  return kept;
}