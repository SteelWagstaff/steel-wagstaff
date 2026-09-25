import { getCollection, type CollectionEntry } from 'astro:content';
import { loadQuery } from '@/sanity/lib/load-query';
import { normalizeSanityCommonplace } from '@/sanity/lib/normalize';
import { publishedCommonplaceQuery } from '@/sanity/lib/queries';
import type { NormalizedCommonplaceEntry, SanityCommonplaceEntry } from '@/sanity/lib/types';
import { mergeCommonplaceEntries } from './commonplace-data';

function normalizeLocalEntry(entry: CollectionEntry<'commonplace'>): NormalizedCommonplaceEntry {
  return {
    source: 'local',
    id: entry.id,
    title: entry.data.title,
    type: entry.data.type,
    publishedAt: entry.data.publishedAt,
    tags: entry.data.tags,
    content: entry.data.content,
    image: entry.data.image,
    imageAlt: entry.data.imageAlt,
    videoUrl: entry.data.videoUrl,
    audioUrl: entry.data.audioUrl,
    sourceUrl: entry.data.source,
    localEntry: entry,
  };
}

async function getSanityEntries(): Promise<NormalizedCommonplaceEntry[]> {
  if (!import.meta.env.PUBLIC_SANITY_PROJECT_ID) return [];

  const { data } = await loadQuery<SanityCommonplaceEntry[]>({ query: publishedCommonplaceQuery });
  return data.map(normalizeSanityCommonplace);
}

export async function getMergedCommonplaceEntries(): Promise<NormalizedCommonplaceEntry[]> {
  const localEntries = await getCollection('commonplace', ({ data }) => {
    return !data.draft && data.locale === 'en';
  });

  return mergeCommonplaceEntries(localEntries.map(normalizeLocalEntry), await getSanityEntries());
}