export type TaxonomySection = 'radio';
export type TaxonomyKind = 'tag' | 'grouping';

export interface TaxonomyDescriptor {
  slug: string;
  label: string;
  description: string;
  section: TaxonomySection;
  kind: TaxonomyKind;
}

export interface TaxonomyEntry {
  id: string;
  data: {
    tags: string[];
    podcast?: string;
  };
}

interface RadioTaxonomyDescriptor extends TaxonomyDescriptor {
  kind: TaxonomyKind;
}

const RADIO_GROUPINGS = [
  {
    slug: 'playlists',
    label: 'Playlists',
    description: 'Curated playlists of favorite tracks.',
    matches: (entry: TaxonomyEntry) =>
      !entry.id.includes('show-') && !entry.data.tags.some((tag) => slugifyTaxonomyLabel(tag) === 'mixtape'),
  },
  {
    slug: 'mixtapes',
    label: 'Mixtapes',
    description: 'Mixtapes made as gifts for family and friends.',
    matches: (entry: TaxonomyEntry) =>
      !entry.id.includes('show-') && entry.data.tags.some((tag) => slugifyTaxonomyLabel(tag) === 'mixtape'),
  },
  {
    slug: 'steels-magnolias',
    label: "Steel's Magnolias",
    description: 'Episodes from Steel Wagstaff\'s former WSUM radio show.',
    matches: (entry: TaxonomyEntry) => entry.id.includes('show-'),
  },
  {
    slug: 'off-the-chain',
    label: 'Off the Chain',
    description: 'Episodes from the Off the Chain podcast.',
    matches: (entry: TaxonomyEntry) => entry.data.podcast === 'Off the Chain',
  },
  {
    slug: 'theme-songs',
    label: 'Theme Songs',
    description: 'Episodes from the Theme Songs podcast.',
    matches: (entry: TaxonomyEntry) => entry.data.podcast === 'Theme Songs',
  },
] as const;

export function slugifyTaxonomyLabel(label: string): string {
  return label
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[']/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getRadioTaxonomies(
  music: TaxonomyEntry[],
  podcasts: TaxonomyEntry[],
): RadioTaxonomyDescriptor[] {
  const descriptors = new Map<string, RadioTaxonomyDescriptor>();

  for (const entry of [...music, ...podcasts]) {
    for (const tag of entry.data.tags) {
      const slug = slugifyTaxonomyLabel(tag);
      if (slug && !descriptors.has(slug)) {
        descriptors.set(slug, {
          slug,
          label: tag,
          description: `Radio and podcast entries tagged ${tag}.`,
          section: 'radio',
          kind: 'tag',
        });
      }
    }
  }

  for (const grouping of RADIO_GROUPINGS) {
    if ([...music, ...podcasts].some(grouping.matches)) {
      descriptors.set(grouping.slug, {
        slug: grouping.slug,
        label: grouping.label,
        description: grouping.description,
        section: 'radio',
        kind: 'grouping',
      });
    }
  }

  return [...descriptors.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function matchesRadioTaxonomy(
  entry: TaxonomyEntry,
  taxonomy: TaxonomyDescriptor,
): boolean {
  if (taxonomy.kind === 'tag') {
    return entry.data.tags.some((tag) => slugifyTaxonomyLabel(tag) === taxonomy.slug);
  }

  const grouping = RADIO_GROUPINGS.find((candidate) => candidate.slug === taxonomy.slug);
  return grouping ? grouping.matches(entry) : false;
}
