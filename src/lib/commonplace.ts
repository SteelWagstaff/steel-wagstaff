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

const ANCHOR = /(<a\s[^>]*>)([\s\S]*?)<\/a>/i;
/** A well formed tag. A letter or slash must follow the `<` so a bare one survives. */
const TAG = /<\/?[a-zA-Z][^>]*>/g;
/**
 * A tag the source cut short, such as a title that stops part way through one.
 * The opening quote is often a curly one, and the run can never cross it.
 */
const TRUNCATED_TAG = /<\/?[a-zA-Z][^>"'\u2019\u201d]*(?:["'\u2019\u201d]|$)/g;
const MARKDOWN_ESCAPE = /\\([_*`[\]()#+\-.!>~|])/g;
const HTML_ENTITY = /&(#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]*);/g;
const SAFE_PROTOCOL = /^https?:\/\//i;

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ndash: '\u2013', mdash: '\u2014', hellip: '\u2026',
  lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201c', rdquo: '\u201d',
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function decodeEntities(value: string): string {
  return value.replace(HTML_ENTITY, (match, body: string) => {
    if (body[0] !== '#') return NAMED_ENTITIES[body.toLowerCase()] ?? match;

    const code = body[1]?.toLowerCase() === 'x'
      ? Number.parseInt(body.slice(2), 16)
      : Number.parseInt(body.slice(1), 10);

    if (!Number.isInteger(code) || code < 0 || code > 0x10ffff) return match;
    try {
      return String.fromCodePoint(code);
    } catch {
      return match;
    }
  });
}

/**
 * Reduces a field to the plain text it was meant to say.
 *
 * These fields were written as prose and a later import left tags, markdown
 * escapes and entities behind in them. Stripped here rather than trusted, so
 * nothing that survives can be read as markup.
 */
function plainText(value: string): string {
  return decodeEntities(
    value.replace(TAG, '').replace(TRUNCATED_TAG, '').replace(MARKDOWN_ESCAPE, '$1'),
  ).replace(/\s+/g, ' ');
}

/** A `title`, reduced to plain text for use in a heading, meta tag or feed. */
export function commonplaceTitle(title: string | undefined): string {
  return plainText(title ?? '').trim();
}

const anchorHref = (openTag: string): string => {
  const href = openTag.match(/href\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  return href?.[1] ?? href?.[2] ?? '';
};

/**
 * Renders a `source` field for display.
 *
 * Formatting tags are dropped, while links are kept: rather than trusting the
 * markup, each anchor is rebuilt from its href and label so nothing but those
 * two is ever emitted.
 */
export function renderCommonplaceSource(source: string): string {
  let out = '';
  let rest = source;

  for (let match = ANCHOR.exec(rest); match; match = ANCHOR.exec(rest)) {
    out += escapeHtml(plainText(rest.slice(0, match.index)).trimEnd());

    const href = anchorHref(match[1]);
    const label = plainText(match[2]).trim();

    if (SAFE_PROTOCOL.test(href) && label) {
      const attrs = /target\s*=\s*["']?_blank/i.test(match[1]) ? ' target="_blank"' : '';
      out += `<a href="${escapeHtml(href)}"${attrs} rel="noopener noreferrer">${escapeHtml(label)}</a>`;
    } else {
      out += escapeHtml(label);
    }

    rest = rest.slice(match.index + match[0].length);
  }

  return (out + escapeHtml(plainText(rest))).trim();
}
