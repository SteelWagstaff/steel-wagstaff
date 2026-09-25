import type { NormalizedCommonplaceEntry } from '@/sanity/lib/types';

export function mergeCommonplaceEntries(
  localEntries: NormalizedCommonplaceEntry[],
  sanityEntries: NormalizedCommonplaceEntry[],
): NormalizedCommonplaceEntry[] {
  return [...localEntries, ...sanityEntries].sort(
    (a, b) => b.publishedAt.valueOf() - a.publishedAt.valueOf(),
  );
}

export function getCommonplacePageEntries(
  entries: NormalizedCommonplaceEntry[],
  page: number,
  pageSize: number,
): NormalizedCommonplaceEntry[] {
  const start = (page - 1) * pageSize;
  return entries.slice(start, start + pageSize);
}
