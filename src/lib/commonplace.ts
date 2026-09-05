import type { CollectionEntry } from 'astro:content';

export const COMMONPLACE_PAGE_SIZE = 50;

export type CommonplaceEntry = CollectionEntry<'commonplace'>;
export type CommonplaceType = CommonplaceEntry['data']['type'];

export interface CommonplaceCounts {
  photo: number;
  text: number;
  quote: number;
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
    { photo: 0, text: 0, quote: 0, video: 0, audio: 0 }
  );
}

export function filterCommonplaceEntries(
  entries: CommonplaceEntry[],
  type: CommonplaceType
): CommonplaceEntry[] {
  return entries.filter((entry) => entry.data.type === type);
}
