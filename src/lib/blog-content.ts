import type { NormalizedBlogEntry } from '@/sanity/lib/types';

export function mergeBlogEntries(
  localEntries: NormalizedBlogEntry[],
  sanityEntries: NormalizedBlogEntry[],
): NormalizedBlogEntry[] {
  const localSlugs = new Set(localEntries.map((entry) => entry.slug));
  const uniqueSanityEntries = sanityEntries.filter((entry) => {
    if (!localSlugs.has(entry.slug)) return true;

    console.warn(`Skipping Sanity post "${entry.slug}" because a local blog entry owns that slug.`);
    return false;
  });

  return [...localEntries, ...uniqueSanityEntries].sort(
    (a, b) => b.publishedAt.valueOf() - a.publishedAt.valueOf(),
  );
}