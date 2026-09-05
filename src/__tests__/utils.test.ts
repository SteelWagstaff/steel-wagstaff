import { describe, expect, it } from 'vitest';
import { getReadingTime, resolveSocialLinks } from '@/lib/utils';

describe('getReadingTime', () => {
  it('calculates minutes from the content word count', () => {
    const content = Array.from({ length: 201 }, (_, index) => `word${index}`).join(' ');

    expect(getReadingTime(content)).toBe(2);
  });

  it('ignores surrounding whitespace when counting words', () => {
    expect(getReadingTime('  one\n two\tthree  ')).toBe(1);
  });

  it('returns at least one minute for empty content', () => {
    expect(getReadingTime('')).toBe(1);
  });
});

describe('resolveSocialLinks', () => {
  it('resolves Mastodon profiles and preserves configured order', () => {
    const links = resolveSocialLinks([
      'https://www.linkedin.com/in/steel-wagstaff/',
      'https://social.coop/@steelwagstaff',
      'https://github.com/steelwagstaff',
    ]);

    expect(links.map(({ label, icon }) => ({ label, icon }))).toEqual([
      { label: 'LinkedIn', icon: 'linkedin' },
      { label: 'Mastodon', icon: 'mastodon' },
      { label: 'GitHub', icon: 'github' },
    ]);
  });
});
