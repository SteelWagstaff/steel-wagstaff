import { describe, expect, it } from 'vitest';
import {
  getRadioTaxonomies,
  matchesRadioTaxonomy,
  slugifyTaxonomyLabel,
} from '@/lib/taxonomy';

type Entry = {
  id: string;
  data: {
    tags: string[];
    podcast?: string;
  };
};

const music = (id: string, tags: string[]): Entry => ({ id, data: { tags } });
const podcast = (id: string, podcastName: string, tags: string[] = []): Entry => ({
  id,
  data: { podcast: podcastName, tags },
});

describe('slugifyTaxonomyLabel', () => {
  it('normalizes spaces and punctuation', () => {
    expect(slugifyTaxonomyLabel("What's New?")).toBe('whats-new');
    expect(slugifyTaxonomyLabel("Steel's Magnolias")).toBe('steels-magnolias');
  });
});

describe('radio taxonomies', () => {
  const entries = {
    music: [
      music('en/playlist', ['Jazz']),
      music('en/mixtape', ['mixtape']),
      music('en/show-1', []),
    ],
    podcasts: [
      podcast('en/otc-1', 'Off the Chain', ['Comedy']),
      podcast('en/theme-1', 'Theme Songs'),
    ],
  };

  it('deduplicates explicit tags by normalized slug', () => {
    const taxonomies = getRadioTaxonomies(
      [music('en/one', ['Jazz']), music('en/two', ['jazz'])],
      [],
    );

    expect(taxonomies.filter((taxonomy) => taxonomy.slug === 'jazz')).toHaveLength(1);
  });

  it('matches tags case-insensitively through normalized slugs', () => {
    const [taxonomy] = getRadioTaxonomies([music('en/one', ['Jazz'])], []);

    expect(matchesRadioTaxonomy(music('en/two', ['jazz']), taxonomy)).toBe(true);
  });

  it('matches named music groupings using the listing rules', () => {
    const taxonomies = getRadioTaxonomies(entries.music, entries.podcasts);
    const playlists = taxonomies.find((taxonomy) => taxonomy.slug === 'playlists');
    const mixtapes = taxonomies.find((taxonomy) => taxonomy.slug === 'mixtapes');
    const shows = taxonomies.find((taxonomy) => taxonomy.slug === 'steels-magnolias');

    expect(playlists && matchesRadioTaxonomy(entries.music[0], playlists)).toBe(true);
    expect(playlists && matchesRadioTaxonomy(entries.music[1], playlists)).toBe(false);
    expect(mixtapes && matchesRadioTaxonomy(entries.music[1], mixtapes)).toBe(true);
    expect(shows && matchesRadioTaxonomy(entries.music[2], shows)).toBe(true);
  });

  it('matches podcast series groupings only by series name', () => {
    const taxonomies = getRadioTaxonomies([], entries.podcasts);
    const offTheChain = taxonomies.find((taxonomy) => taxonomy.slug === 'off-the-chain');
    const themeSongs = taxonomies.find((taxonomy) => taxonomy.slug === 'theme-songs');

    expect(offTheChain && matchesRadioTaxonomy(entries.podcasts[0], offTheChain)).toBe(true);
    expect(offTheChain && matchesRadioTaxonomy(entries.podcasts[1], offTheChain)).toBe(false);
    expect(themeSongs && matchesRadioTaxonomy(entries.podcasts[1], themeSongs)).toBe(true);
  });
});
