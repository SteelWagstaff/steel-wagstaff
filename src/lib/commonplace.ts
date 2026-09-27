import type { CollectionEntry } from 'astro:content';

export const COMMONPLACE_PAGE_SIZE = 25;

export type CommonplaceEntry = CollectionEntry<'commonplace'>;
export type CommonplaceType = CommonplaceEntry['data']['type'];

export interface CommonplaceCounts {
  photo: number;
  text: number;
  video: number;
  audio: number;
}

export function sortCommonplaceEntries(entries: CommonplaceEntry[]): CommonplaceEntry[] {
  return [...entries].sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime()
  );
}

export function getCommonplacePageCount(totalItems: number): number {
  return Math.max(1, Math.ceil(totalItems / COMMONPLACE_PAGE_SIZE));
}

export function getCommonplacePageEntries(
  entries: CommonplaceEntry[],
  page: number
): CommonplaceEntry[] {
  const start = (page - 1) * COMMONPLACE_PAGE_SIZE;
  return entries.slice(start, start + COMMONPLACE_PAGE_SIZE);
}

export function getCommonplaceCounts(entries: CommonplaceEntry[]): CommonplaceCounts {
  return entries.reduce<CommonplaceCounts>(
    (counts, entry) => {
      counts[entry.data.type] += 1;
      return counts;
    },
    { photo: 0, text: 0, video: 0, audio: 0 }
  );
}

export function filterCommonplaceEntries(
  entries: CommonplaceEntry[],
  type: CommonplaceType
): CommonplaceEntry[] {
  return entries.filter((entry) => entry.data.type === type);
}

/**
 * Lowercases and hyphenates a tag so it can be used as a route segment. Accents
 * are folded and apostrophes dropped, so "Café d'Été" and "cafe d'ete" agree.
 */
export function commonplaceTagSlug(tag: string): string {
  return tag
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/['\u2019]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Counts posts per tag slug, merging the case and punctuation variants Tumblr produced. */
export function getCommonplaceTagCounts(entries: CommonplaceEntry[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.data.tags) {
      const slug = commonplaceTagSlug(tag);
      if (slug) counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Picks the spelling to show for each slug. A tag like "great musics" exists as
 * five capitalisations, so the most used one wins and ties break on lowercase.
 */
export function getCommonplaceTagLabels(entries: CommonplaceEntry[]): Map<string, string> {
  const seen = new Map<string, Map<string, number>>();
  for (const entry of entries) {
    for (const tag of entry.data.tags) {
      const slug = commonplaceTagSlug(tag);
      if (!slug) continue;
      const variants = seen.get(slug) ?? new Map<string, number>();
      variants.set(tag, (variants.get(tag) ?? 0) + 1);
      seen.set(slug, variants);
    }
  }

  return new Map(
    [...seen].map(([slug, variants]) => [
      slug,
      [...variants].sort((a, b) => b[1] - a[1] || a[0].toLowerCase().localeCompare(b[0].toLowerCase()))[0][0],
    ])
  );
}

/**
 * Tags used by two or more posts. Single-use tags have no page of their own, so
 * the archive renders them as plain text rather than linking to a one-post list.
 */
export function getCommonplaceSharedTags(entries: CommonplaceEntry[]): Set<string> {
  return new Set(
    [...getCommonplaceTagCounts(entries)].filter(([, count]) => count > 1).map(([slug]) => slug)
  );
}

export function filterCommonplaceEntriesByTag(
  entries: CommonplaceEntry[],
  tagSlug: string
): CommonplaceEntry[] {
  return entries.filter((entry) =>
    entry.data.tags.some((tag) => commonplaceTagSlug(tag) === tagSlug)
  );
}

export function getCommonplaceEntryHref(entry: CommonplaceEntry): string {
  return `/commonplace/${entry.id}`;
}

export function getCommonplaceTagHref(tagSlug: string, page = 1): string {
  return `/commonplace/tag/${tagSlug}/${page}`;
}
