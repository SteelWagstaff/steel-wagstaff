import { describe, it, expect } from 'vitest';
import {
  slugifyTag,
  buildTags,
  transformCaptions,
  transformGalleries,
  extractSpotifyUrl,
  stripSizeSuffix,
  urlToBasename,
  rewriteImageSrcs,
  convertAllCapsHeadings,
  convertYouTubeEmbeds,
  convertSoundCloudEmbeds,
} from '../../scripts/lib/wp-transforms.mjs';

// ---------------------------------------------------------------------------
describe('slugifyTag', () => {
  it('lowercases and replaces spaces with dashes', () => {
    expect(slugifyTag('Wedding Planning')).toBe('wedding-planning');
  });
  it("strips apostrophes", () => {
    expect(slugifyTag("What I'm Reading")).toBe('what-im-reading');
  });
  it('handles already-lowercase single word', () => {
    expect(slugifyTag('anarchism')).toBe('anarchism');
  });
  it('collapses multiple spaces', () => {
    expect(slugifyTag('The  Objectivists')).toBe('the-objectivists');
  });
});

// ---------------------------------------------------------------------------
describe('buildTags', () => {
  it('excludes Blog category from tags', () => {
    expect(buildTags(['Blog', 'Wedding Planning'], [])).toEqual(['wedding-planning']);
  });
  it('excludes all excluded categories', () => {
    const excluded = ['Mix Tapes', 'Radio Shows', 'Spotify Playlists', 'from tumblr', "What I'm Listening To"];
    expect(buildTags(excluded, [])).toEqual([]);
  });
  it("maps What I'm Reading to reading", () => {
    expect(buildTags(["What I'm Reading"], [])).toEqual(['reading']);
  });
  it('deduplicates tags that appear in both categories and post_tags', () => {
    expect(buildTags(['Education Technology'], ['education-technology'])).toEqual(['education-technology']);
  });
  it('includes post_tag entries', () => {
    expect(buildTags([], ['anarchism', 'poetry'])).toEqual(['anarchism', 'poetry']);
  });
});

// ---------------------------------------------------------------------------
describe('transformCaptions', () => {
  it('converts caption-attribute variant to <figure>', () => {
    const input = `[caption id="a1" align="alignright" width="300" caption="Gaylord Nelson"]<img src="img.jpg" />[/caption]`;
    const result = transformCaptions(input);
    expect(result).toContain('<figure class="align-right">');
    expect(result).toContain('<figcaption>Gaylord Nelson</figcaption>');
    expect(result).toContain('<img src="img.jpg" />');
    expect(result).not.toContain('[caption');
  });

  it('converts body-text caption variant to <figure>', () => {
    const input = `[caption id="a2" align="alignleft" width="300"]<img src="img.jpg" />Caption text here[/caption]`;
    const result = transformCaptions(input);
    expect(result).toContain('<figure class="align-left">');
    expect(result).toContain('<figcaption>Caption text here</figcaption>');
    expect(result).not.toContain('[caption');
  });

  it('handles caption with no text gracefully', () => {
    const input = `[caption align="aligncenter" width="500"]<img src="img.jpg" />[/caption]`;
    const result = transformCaptions(input);
    expect(result).toContain('<figure class="align-center">');
    expect(result).not.toContain('[caption');
  });

  it('leaves non-caption HTML untouched', () => {
    const input = '<p>Hello world</p>';
    expect(transformCaptions(input)).toBe(input);
  });
});

// ---------------------------------------------------------------------------
describe('transformGalleries', () => {
  it('converts [gallery ids="1,2,3"] to HTML comment', () => {
    const result = transformGalleries('[gallery ids="820,816,819"]');
    expect(result).toBe('<!-- gallery:ids="820,816,819" (not migrated) -->');
  });

  it('handles gallery with no attributes', () => {
    const result = transformGalleries('[gallery]');
    expect(result).toContain('<!-- gallery:');
    expect(result).toContain('(not migrated)');
  });
});

// ---------------------------------------------------------------------------
describe('extractSpotifyUrl', () => {
  it('extracts a bare Spotify URL wrapped in <p>', () => {
    const html = '<p>Some text</p>\n<p>https://open.spotify.com/playlist/abc123</p>\n<p>More text</p>';
    const { spotifyUrl, html: cleaned } = extractSpotifyUrl(html);
    expect(spotifyUrl).toBe('https://open.spotify.com/playlist/abc123');
    expect(cleaned).not.toContain('open.spotify.com');
    expect(cleaned).toContain('Some text');
    expect(cleaned).toContain('More text');
  });

  it('returns null when no Spotify URL present', () => {
    const { spotifyUrl } = extractSpotifyUrl('<p>No spotify here</p>');
    expect(spotifyUrl).toBeNull();
  });
});

// ---------------------------------------------------------------------------
describe('stripSizeSuffix', () => {
  it('strips -300x200 size suffix', () => {
    expect(stripSizeSuffix('photo-300x200.jpg')).toBe('photo.jpg');
  });
  it('strips -e1499456265181 timestamp suffix', () => {
    expect(stripSizeSuffix('photo-e1499456265181.jpg')).toBe('photo.jpg');
  });
  it('strips -scaled suffix', () => {
    expect(stripSizeSuffix('photo-scaled.jpg')).toBe('photo.jpg');
  });
  it('leaves clean filenames untouched', () => {
    expect(stripSizeSuffix('photo.jpg')).toBe('photo.jpg');
  });
});

// ---------------------------------------------------------------------------
describe('urlToBasename', () => {
  it('extracts filename from full WordPress URL', () => {
    expect(urlToBasename('https://steelwagstaff.files.wordpress.com/2011/04/photo.jpg?w=300')).toBe('photo.jpg');
  });
  it('handles youtu.be-style short URLs', () => {
    expect(urlToBasename('https://youtu.be/abc123')).toBe('abc123');
  });
});

// ---------------------------------------------------------------------------
describe('rewriteImageSrcs', () => {
  it('rewrites WordPress image src to local path', () => {
    const html = '<img src="https://steelwagstaff.files.wordpress.com/2011/04/photo-300x200.jpg" />';
    const map = new Map([['photo.jpg', '/media-exports/photo.jpg']]);
    const { html: result, resolved, missing } = rewriteImageSrcs(html, map, '../../../assets/blog');
    expect(result).toContain('../../../assets/blog/photo.jpg');
    expect(resolved).toHaveLength(1);
    expect(missing).toHaveLength(0);
  });

  it('leaves unresolved URLs intact and reports them as missing', () => {
    const html = '<img src="https://steelwagstaff.files.wordpress.com/2011/04/notfound.jpg" />';
    const map = new Map();
    const { html: result, missing } = rewriteImageSrcs(html, map, '../../../assets/blog');
    expect(result).toContain('steelwagstaff.files.wordpress.com');
    expect(missing).toHaveLength(1);
  });

  it('does not rewrite non-WordPress image URLs', () => {
    const html = '<img src="https://flickr.com/photo.jpg" />';
    const map = new Map();
    const { html: result } = rewriteImageSrcs(html, map, '../../../assets/blog');
    expect(result).toBe(html);
  });
});

// ---------------------------------------------------------------------------
describe('convertAllCapsHeadings', () => {
  it('converts a 4+ char ALL CAPS line to ## heading', () => {
    const result = convertAllCapsHeadings('OER STRATEGIC FRAMEWORK');
    expect(result).toBe('## Oer Strategic Framework');
  });

  it('does not convert mixed-case lines', () => {
    const line = 'This is Normal Text';
    expect(convertAllCapsHeadings(line)).toBe(line);
  });

  it('does not convert short uppercase words (acronyms in sentences)', () => {
    // Only matches lines where the ENTIRE LINE is uppercase
    const inline = 'She worked at OER last year';
    expect(convertAllCapsHeadings(inline)).toBe(inline);
  });

  it('converts multiple ALL CAPS headings in one string', () => {
    const input = 'SECTION ONE\n\nsome content\n\nSECTION TWO';
    const result = convertAllCapsHeadings(input);
    expect(result).toContain('## Section One');
    expect(result).toContain('## Section Two');
    expect(result).toContain('some content');
  });
});

// ---------------------------------------------------------------------------
describe('convertYouTubeEmbeds', () => {
  it('converts bare youtu.be URL to YouTubeEmbed component', () => {
    const input = 'Check this out:\n\nhttps://youtu.be/dQw4w9WgXcQ\n\nGreat video.';
    const result = convertYouTubeEmbeds(input);
    expect(result).toContain('<YouTubeEmbed url="https://youtu.be/dQw4w9WgXcQ" />');
    expect(result).not.toMatch(/^https:\/\/youtu\.be/m);
  });

  it('converts bare youtube.com/watch URL', () => {
    const input = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const result = convertYouTubeEmbeds(input);
    expect(result).toContain('<YouTubeEmbed url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />');
  });

  it('does not convert YouTube URLs that are part of a sentence', () => {
    const input = 'See https://youtu.be/abc for details.';
    expect(convertYouTubeEmbeds(input)).toBe(input);
  });
});

// ---------------------------------------------------------------------------
describe('convertSoundCloudEmbeds', () => {
  it('converts bare SoundCloud URL to SoundCloudEmbed component', () => {
    const input = 'https://soundcloud.com/artist/track';
    const result = convertSoundCloudEmbeds(input);
    expect(result).toContain('<SoundCloudEmbed url="https://soundcloud.com/artist/track" />');
  });

  it('does not convert SoundCloud URLs in mid-sentence', () => {
    const input = 'Listen at https://soundcloud.com/artist/track for more.';
    expect(convertSoundCloudEmbeds(input)).toBe(input);
  });
});
