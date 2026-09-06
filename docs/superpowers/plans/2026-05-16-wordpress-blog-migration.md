# WordPress Blog Re-Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-migrate all 280 WordPress blog posts from the XML export into `src/content/blog/en/`, fixing lost links, broken `[caption]` shortcodes, empty tags, ALL CAPS headings, missing featured images, and bare embed URLs.

**Architecture:** A Node.js script (`scripts/migrate-wordpress-blog.mjs`) parses `steelwagstaff.WordPress.2026-04-24.xml`, transforms each post through a pipeline of pure helper functions in `scripts/lib/wp-transforms.mjs`, and writes clean Markdown files to `src/content/blog/en/`. Two new Astro embed components are created first so the migration output can reference them. A second script (`scripts/generate-blog-descriptions.mjs`) populates blank `description` fields via LLM after migration.

**Tech Stack:** Node.js ESM (`.mjs`), `turndown` (HTML→Markdown), `@xmldom/xmldom` (XML parsing), Vitest (tests), Astro (embed components)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/components/ui/content/YouTubeEmbed/YouTubeEmbed.astro` | Renders YouTube iframe from full URL |
| Create | `src/components/ui/content/SoundCloudEmbed/SoundCloudEmbed.astro` | Renders SoundCloud iframe from full URL |
| Create | `scripts/lib/wp-transforms.mjs` | Pure transformation functions (testable) |
| Create | `src/__tests__/wp-transforms.test.ts` | Unit tests for all transform functions |
| Create | `scripts/migrate-wordpress-blog.mjs` | Main migration script (orchestrates all phases) |
| Create | `scripts/generate-blog-descriptions.mjs` | LLM description generation (post-migration) |
| Modify | `src/content/config.ts` | Add `spotifyPlaylist` field to blog collection schema |
| Create | `scripts/missing-media-report.json` | Written at runtime — images not found in media-exports |

---

## Task 1: Install turndown

**Files:**
- Modify: `package.json` (via pnpm)

- [ ] **Step 1: Install turndown**

```bash
cd /home/steelwagstaff/steelwagstaff
pnpm add -D turndown @types/turndown
```

Expected output ends with: `devDependencies` listing `turndown`.

- [ ] **Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add turndown for HTML→Markdown conversion"
```

---

## Task 2: Create YouTubeEmbed component

**Files:**
- Create: `src/components/ui/content/YouTubeEmbed/YouTubeEmbed.astro`

The component accepts a full YouTube URL (`https://youtu.be/ID` or `https://www.youtube.com/watch?v=ID`) and renders a privacy-enhanced iframe.

- [ ] **Step 1: Create the component**

Create `src/components/ui/content/YouTubeEmbed/YouTubeEmbed.astro`:

```astro
---
/**
 * YouTubeEmbed — Embedded YouTube player (privacy-enhanced)
 * Accepts a full YouTube URL and extracts the video ID.
 */
interface Props {
  url: string;
  title?: string;
}

const { url, title = 'YouTube video' } = Astro.props;

// Extract video ID from youtu.be/ID or ?v=ID formats
function extractYouTubeId(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1);
    return u.searchParams.get('v');
  } catch {
    return null;
  }
}

const videoId = extractYouTubeId(url);
const embedUrl = videoId
  ? `https://www.youtube-nocookie.com/embed/${videoId}`
  : null;
---

{embedUrl && (
  <div class="youtube-embed-container relative w-full overflow-hidden rounded-lg" style="aspect-ratio: 16/9;">
    <iframe
      src={embedUrl}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
      loading="lazy"
      class="absolute inset-0 h-full w-full border-0"
    />
  </div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/content/YouTubeEmbed/YouTubeEmbed.astro
git commit -m "feat: add YouTubeEmbed component (privacy-enhanced)"
```

---

## Task 3: Create SoundCloudEmbed component

**Files:**
- Create: `src/components/ui/content/SoundCloudEmbed/SoundCloudEmbed.astro`

The component accepts a full SoundCloud track/set URL and renders the SoundCloud iframe player.

- [ ] **Step 1: Create the component**

Create `src/components/ui/content/SoundCloudEmbed/SoundCloudEmbed.astro`:

```astro
---
/**
 * SoundCloudEmbed — Embedded SoundCloud player
 * Accepts a full SoundCloud URL (track or playlist).
 */
interface Props {
  url: string;
  height?: number;
}

const { url, height = 166 } = Astro.props;

const encodedUrl = encodeURIComponent(url);
const embedSrc = `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
---

<div class="soundcloud-embed-container w-full overflow-hidden rounded-lg">
  <iframe
    width="100%"
    height={height}
    scrolling="no"
    allow="autoplay"
    loading="lazy"
    src={embedSrc}
    title="SoundCloud player"
    class="w-full border-0"
  />
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/content/SoundCloudEmbed/SoundCloudEmbed.astro
git commit -m "feat: add SoundCloudEmbed component"
```

---

## Task 4: Add spotifyPlaylist field to blog schema

**Files:**
- Modify: `src/content/config.ts`

The migration script will write `spotifyPlaylist` to blog post frontmatter when a bare Spotify URL is found. The content schema must allow this optional field.

- [ ] **Step 1: Read current blog schema**

```bash
grep -n "spotifyPlaylist\|spotify\|blog" /home/steelwagstaff/steelwagstaff/src/content/config.ts | head -30
```

- [ ] **Step 2: Add spotifyPlaylist to the blog collection schema**

Find the `blog` collection schema definition in `src/content/config.ts`. It will have a Zod object with `title`, `description`, `publishedAt`, etc. Add `spotifyPlaylist` as an optional string after the existing fields:

```typescript
spotifyPlaylist: z.string().url().optional(),
```

The surrounding context will look something like:

```typescript
// Before
  draft: z.boolean().default(false),
  locale: z.string().default('en'),
// After
  draft: z.boolean().default(false),
  locale: z.string().default('en'),
  spotifyPlaylist: z.string().url().optional(),
```

- [ ] **Step 3: Run type check to verify no errors**

```bash
cd /home/steelwagstaff/steelwagstaff
pnpm check 2>&1 | tail -20
```

Expected: no errors about `spotifyPlaylist`.

- [ ] **Step 4: Commit**

```bash
git add src/content/config.ts
git commit -m "feat: add optional spotifyPlaylist field to blog collection schema"
```

---

## Task 5: Write wp-transforms.mjs (pure helper functions)

**Files:**
- Create: `scripts/lib/wp-transforms.mjs`

These pure functions handle every content transformation step. No file I/O.

- [ ] **Step 1: Create the file**

Create `scripts/lib/wp-transforms.mjs`:

```javascript
/**
 * wp-transforms.mjs
 * Pure transformation functions for WordPress XML → Markdown migration.
 * No file I/O. All functions are independently testable.
 */

import TurndownService from 'turndown';

// ---------------------------------------------------------------------------
// Tag slugification
// ---------------------------------------------------------------------------

/**
 * Convert a WordPress category/tag name to a URL-safe slug.
 * "Wedding Planning" → "wedding-planning"
 * "What I'm Reading" → "what-im-reading"
 */
export function slugifyTag(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, '')        // remove apostrophes
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumeric → dash
    .replace(/^-+|-+$/g, '');    // trim leading/trailing dashes
}

// Categories excluded from tags entirely (not just from collection routing)
const EXCLUDED_TAGS = new Set([
  'Blog', 'Mix Tapes', 'Radio Shows', 'Spotify Playlists',
  'from tumblr', "What I'm Listening To",
]);

/**
 * Build the tags array from WordPress category and post_tag entries.
 * Excludes generic/collection-routing categories.
 * Normalises "What I'm Reading" → "reading".
 */
export function buildTags(categories, postTags) {
  const TAG_OVERRIDES = { "What I'm Reading": 'reading' };
  const tags = [];
  for (const name of [...categories, ...postTags]) {
    if (EXCLUDED_TAGS.has(name)) continue;
    tags.push(TAG_OVERRIDES[name] ?? slugifyTag(name));
  }
  // Deduplicate while preserving order
  return [...new Set(tags)];
}

// ---------------------------------------------------------------------------
// [caption] shortcode transformation
// ---------------------------------------------------------------------------

/**
 * Convert WordPress [caption] shortcodes to <figure> HTML.
 *
 * Handles two variants:
 *   [caption id="..." align="alignright" width="300" caption="text"]<img .../>[/caption]
 *   [caption id="..." align="alignleft" width="300"]<img .../>caption text[/caption]
 *
 * Produces:
 *   <figure class="align-right"><img .../><figcaption>text</figcaption></figure>
 */
export function transformCaptions(html) {
  // Variant 1: caption in attribute
  let result = html.replace(
    /\[caption[^\]]*\balign="align(\w+)"[^\]]*\bcaption="([^"]*)"[^\]]*\]([\s\S]*?)\[\/caption\]/gi,
    (_, align, captionText, inner) =>
      `<figure class="align-${align}">${inner.trim()}<figcaption>${captionText}</figcaption></figure>`
  );

  // Variant 2: caption in body (text after the img tag)
  result = result.replace(
    /\[caption[^\]]*\balign="align(\w+)"[^\]]*\]([\s\S]*?)\[\/caption\]/gi,
    (_, align, inner) => {
      // Split on the first > after <img to separate img from caption text
      const imgMatch = inner.match(/(<img[^>]*\/?>)([\s\S]*)/i);
      if (!imgMatch) return `<figure class="align-${align}">${inner.trim()}</figure>`;
      const [, imgTag, captionText] = imgMatch;
      const caption = captionText.trim();
      return caption
        ? `<figure class="align-${align}">${imgTag}<figcaption>${caption}</figcaption></figure>`
        : `<figure class="align-${align}">${imgTag}</figure>`;
    }
  );

  return result;
}

// ---------------------------------------------------------------------------
// [gallery] shortcode transformation
// ---------------------------------------------------------------------------

/**
 * Replace [gallery ids="820,816"] with an HTML comment preserving the IDs.
 * Galleries are not migrated — handled manually post-migration.
 */
export function transformGalleries(html) {
  return html.replace(
    /\[gallery([^\]]*)\]/gi,
    (_, attrs) => `<!-- gallery:${attrs.trim()} (not migrated) -->`
  );
}

// ---------------------------------------------------------------------------
// Bare Spotify URL extraction
// ---------------------------------------------------------------------------

/**
 * Find a bare Spotify URL on its own line, remove it from the HTML,
 * and return both the cleaned HTML and the extracted URL (or null).
 *
 * "Bare" means a line containing only the URL (optionally wrapped in a <p>).
 */
export function extractSpotifyUrl(html) {
  const spotifyPattern = /https:\/\/open\.spotify\.com\/[^\s"<]+/;

  // Match a bare line: optional <p> wrapping, just the URL
  const linePattern = new RegExp(
    `(?:<p>\\s*)?(${spotifyPattern.source})(?:\\s*</p>)?`,
    'i'
  );

  const match = html.match(linePattern);
  if (!match) return { spotifyUrl: null, html };

  // Verify it's on its own line (no other content in the same <p>)
  const spotifyUrl = match[1];
  const cleaned = html.replace(match[0], '').trim();
  return { spotifyUrl, html: cleaned };
}

// ---------------------------------------------------------------------------
// Inline WordPress image URL rewriting (pure — no file I/O)
// ---------------------------------------------------------------------------

/**
 * Strip size suffixes from a WordPress image filename.
 * "photo-300x200.jpg"  → "photo.jpg"
 * "photo-e1499456265181.jpg" → "photo.jpg"
 * "photo.jpg"          → "photo.jpg"
 */
export function stripSizeSuffix(filename) {
  return filename
    .replace(/-\d+x\d+(\.[a-z]+)$/i, '$1')           // -300x200
    .replace(/-e\d{10,}(\.[a-z]+)$/i, '$1')           // -e1499456265181
    .replace(/-scaled(\.[a-z]+)$/i, '$1')              // -scaled
    .replace(/-rotated(\.[a-z]+)$/i, '$1');            // -rotated
}

/**
 * Extract just the filename (basename) from a full URL.
 * Strips query strings: "photo.jpg?w=300" → "photo.jpg"
 */
export function urlToBasename(url) {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split('/').pop()?.split('?')[0] ?? '';
  } catch {
    return url.split('/').pop()?.split('?')[0] ?? '';
  }
}

/**
 * Rewrite WordPress image src attributes to local paths.
 *
 * @param {string} html - Raw HTML from WordPress
 * @param {Map<string, string>} attachmentByBasename - Map of normalised basename → local abs path
 * @param {string} localAssetPrefix - Relative prefix to write into src (e.g. "../../../assets/blog")
 * @returns {{ html: string, resolved: string[], missing: string[] }}
 */
export function rewriteImageSrcs(html, attachmentByBasename, localAssetPrefix) {
  const resolved = [];
  const missing = [];

  const result = html.replace(
    /(<img[^>]+\bsrc=")([^"]+)(")/gi,
    (match, pre, srcUrl, post) => {
      const isWordPress =
        srcUrl.includes('steelwagstaff.files.wordpress.com') ||
        srcUrl.includes('steelwagstaff.info/wordpress');
      if (!isWordPress) return match;

      const basename = urlToBasename(srcUrl);
      const normalised = stripSizeSuffix(basename).toLowerCase();

      const localPath = attachmentByBasename.get(normalised);
      if (localPath) {
        const filename = localPath.split('/').pop();
        resolved.push({ srcUrl, filename });
        return `${pre}${localAssetPrefix}/${filename}${post}`;
      } else {
        missing.push(srcUrl);
        return match; // leave original URL
      }
    }
  );

  return { html: result, resolved, missing };
}

// ---------------------------------------------------------------------------
// Post-Markdown transformations
// ---------------------------------------------------------------------------

/**
 * Convert ALL CAPS lines to ## headings (title-cased).
 * Matches lines of 4+ uppercase letters/spaces standing alone on a line.
 * "OER STRATEGIC FRAMEWORK" → "## Oer Strategic Framework"
 */
export function convertAllCapsHeadings(markdown) {
  return markdown.replace(
    /^([A-Z][A-Z\s]{3,})$/gm,
    (line) => {
      // Title-case: capitalise first letter of each word, lowercase the rest
      const titled = line
        .trim()
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      return `## ${titled}`;
    }
  );
}

/**
 * Replace bare YouTube URLs (line containing only the URL) with embed components.
 * Handles youtu.be/ID and youtube.com/watch?v=ID formats.
 */
export function convertYouTubeEmbeds(markdown) {
  return markdown.replace(
    /^(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w\-?=&]+)\s*$/gm,
    (_, url) => `<YouTubeEmbed url="${url}" />`
  );
}

/**
 * Replace bare SoundCloud URLs with embed components.
 */
export function convertSoundCloudEmbeds(markdown) {
  return markdown.replace(
    /^(https?:\/\/soundcloud\.com\/[^\s]+)\s*$/gm,
    (_, url) => `<SoundCloudEmbed url="${url}" />`
  );
}

// ---------------------------------------------------------------------------
// Turndown instance (configured for this project)
// ---------------------------------------------------------------------------

/**
 * Build a configured TurndownService.
 * Call once and reuse across all posts.
 */
export function buildTurndownService() {
  const td = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
  });

  // Pass <figure> elements through as raw HTML (not converted to Markdown)
  td.addRule('figure', {
    filter: 'figure',
    replacement: (_content, node) => `\n\n${node.outerHTML}\n\n`,
  });

  // Pass through HTML comments (gallery placeholders)
  td.addRule('htmlComment', {
    filter: (node) => node.nodeType === 8, // Node.COMMENT_NODE
    replacement: (_content, node) => `\n\n<!--${node.nodeValue}-->\n\n`,
  });

  return td;
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/lib/wp-transforms.mjs
git commit -m "feat: add wp-transforms.mjs with pure content transformation helpers"
```

---

## Task 6: Write unit tests for wp-transforms.mjs

**Files:**
- Create: `src/__tests__/wp-transforms.test.ts`

- [ ] **Step 1: Create the test file**

Create `src/__tests__/wp-transforms.test.ts`:

```typescript
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
    expect(result).toBe('<!-- gallery: ids="820,816,819" (not migrated) -->');
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
```

- [ ] **Step 2: Run tests — expect them to fail (wp-transforms.mjs not yet written)**

```bash
cd /home/steelwagstaff/steelwagstaff
pnpm test src/__tests__/wp-transforms.test.ts 2>&1 | tail -20
```

Expected: FAIL — module not found or import errors.

- [ ] **Step 3: Run tests again after Task 5 is done**

```bash
pnpm test src/__tests__/wp-transforms.test.ts
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/wp-transforms.test.ts
git commit -m "test: add unit tests for wp-transforms helper functions"
```

---

## Task 7: Write migrate-wordpress-blog.mjs

**Files:**
- Create: `scripts/migrate-wordpress-blog.mjs`

This is the main orchestration script. It reads the XML, builds attachment maps, runs each post through the transformation pipeline, and writes output files.

- [ ] **Step 1: Create the script**

Create `scripts/migrate-wordpress-blog.mjs`:

```javascript
#!/usr/bin/env node
/**
 * migrate-wordpress-blog.mjs
 * Re-migrates WordPress blog posts from XML export to src/content/blog/en/
 *
 * Usage:
 *   node scripts/migrate-wordpress-blog.mjs
 *
 * Prerequisites:
 *   - pnpm add -D turndown (see Task 1)
 *   - WordPress XML at: /home/steelwagstaff/Downloads/steelwagstaff.WordPress.2026-04-24.xml
 *   - Media exports at: /home/steelwagstaff/steelwagstaff/media-exports/
 */

import { readFileSync, writeFileSync, copyFileSync, mkdirSync, readdirSync } from 'fs';
import { join, basename, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DOMParser } from '@xmldom/xmldom';
import {
  slugifyTag,
  buildTags,
  transformCaptions,
  transformGalleries,
  extractSpotifyUrl,
  rewriteImageSrcs,
  stripSizeSuffix,
  convertAllCapsHeadings,
  convertYouTubeEmbeds,
  convertSoundCloudEmbeds,
  buildTurndownService,
} from './lib/wp-transforms.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const XML_PATH = '/home/steelwagstaff/Downloads/steelwagstaff.WordPress.2026-04-24.xml';
const MEDIA_EXPORTS_DIR = join(PROJECT_ROOT, 'media-exports');
const BLOG_OUTPUT_DIR = join(PROJECT_ROOT, 'src/content/blog/en');
const BLOG_ASSETS_DIR = join(PROJECT_ROOT, 'src/assets/blog');
const MISSING_MEDIA_REPORT = join(PROJECT_ROOT, 'scripts/missing-media-report.json');

const EXCLUDED_CATEGORIES = new Set([
  'Mix Tapes', 'Radio Shows', 'Spotify Playlists', 'from tumblr', "What I'm Listening To",
]);

const WP_NS = 'http://wordpress.org/export/1.2/';
const CONTENT_NS = 'http://purl.org/rss/1.0/modules/content/';

// ---------------------------------------------------------------------------
// XML helpers
// ---------------------------------------------------------------------------

function getWpText(el, localName) {
  const nodes = el.getElementsByTagNameNS(WP_NS, localName);
  return nodes.length > 0 ? (nodes[0].textContent ?? '').trim() : '';
}

function getContentEncoded(item) {
  const nodes = item.getElementsByTagNameNS(CONTENT_NS, 'encoded');
  return nodes.length > 0 ? (nodes[0].textContent ?? '') : '';
}

function getCategories(item, domain) {
  const results = [];
  const cats = item.getElementsByTagName('category');
  for (let i = 0; i < cats.length; i++) {
    if (cats[i].getAttribute('domain') === domain) {
      results.push(cats[i].textContent ?? '');
    }
  }
  return results;
}

function getPostMeta(item, metaKey) {
  const metas = item.getElementsByTagNameNS(WP_NS, 'postmeta');
  for (let i = 0; i < metas.length; i++) {
    const keyNodes = metas[i].getElementsByTagNameNS(WP_NS, 'meta_key');
    if (keyNodes.length > 0 && keyNodes[0].textContent === metaKey) {
      const valNodes = metas[i].getElementsByTagNameNS(WP_NS, 'meta_value');
      return valNodes.length > 0 ? (valNodes[0].textContent ?? '').trim() : null;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Build attachment maps from XML
// ---------------------------------------------------------------------------

function buildAttachmentMaps(doc) {
  const attachmentById = new Map(); // id → { url, filename }
  const attachmentByBasename = new Map(); // normalised-basename → abs path in media-exports

  // Map media-exports files by normalised basename for fuzzy lookup
  let mediaFiles = [];
  try {
    mediaFiles = readdirSync(MEDIA_EXPORTS_DIR);
  } catch {
    console.warn(`⚠ media-exports dir not found at ${MEDIA_EXPORTS_DIR}`);
  }
  for (const f of mediaFiles) {
    const key = stripSizeSuffix(f).toLowerCase();
    attachmentByBasename.set(key, join(MEDIA_EXPORTS_DIR, f));
  }

  // Parse attachment items from XML
  const items = doc.getElementsByTagName('item');
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (getWpText(item, 'post_type') !== 'attachment') continue;
    const id = getWpText(item, 'post_id');
    const url = getWpText(item, 'attachment_url');
    if (id && url) {
      const fn = url.split('/').pop() ?? '';
      attachmentById.set(id, { url, filename: fn });
    }
  }

  return { attachmentById, attachmentByBasename };
}

// ---------------------------------------------------------------------------
// Resolve featured image
// ---------------------------------------------------------------------------

function resolveFeaturedImage(thumbnailId, attachmentById, attachmentByBasename, slug) {
  if (!thumbnailId) return null;

  const att = attachmentById.get(thumbnailId);
  if (!att) return null;

  const rawBasename = att.filename;
  const normalised = stripSizeSuffix(rawBasename).toLowerCase();
  const localPath = attachmentByBasename.get(normalised);

  if (!localPath) return null;

  const destFilename = normalised; // use the clean, normalised filename
  const destPath = join(BLOG_ASSETS_DIR, destFilename);
  try {
    copyFileSync(localPath, destPath);
  } catch (err) {
    console.warn(`  ⚠ Could not copy image for ${slug}: ${err.message}`);
    return null;
  }

  return `../../../assets/blog/${destFilename}`;
}

// ---------------------------------------------------------------------------
// Build frontmatter YAML string
// ---------------------------------------------------------------------------

function escapeYaml(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function buildFrontmatter({ title, publishedAt, tags, imagePath, imageAlt, spotifyUrl }) {
  const lines = [
    `title: "${escapeYaml(title)}"`,
    `description: ""`,
    `publishedAt: ${publishedAt}`,
    `author: steel`,
    `tags: [${tags.map((t) => `"${t}"`).join(', ')}]`,
    `draft: false`,
    `locale: en`,
  ];
  if (imagePath) {
    lines.push(`image: "${imagePath}"`);
    lines.push(`imageAlt: "${escapeYaml(imageAlt)}"`);
  }
  if (spotifyUrl) {
    lines.push(`spotifyPlaylist: "${spotifyUrl}"`);
  }
  return `---\n${lines.join('\n')}\n---`;
}

// ---------------------------------------------------------------------------
// Transform a single post
// ---------------------------------------------------------------------------

function transformPost(item, attachmentById, attachmentByBasename, td) {
  const title = item.getElementsByTagName('title')[0]?.textContent?.trim() ?? '';
  const slug = getWpText(item, 'post_name');
  const rawDate = getWpText(item, 'post_date');
  const publishedAt = rawDate.slice(0, 10); // YYYY-MM-DD

  const categories = getCategories(item, 'category');
  const postTags = getCategories(item, 'post_tag');
  const tags = buildTags(categories, postTags);

  const thumbnailId = getPostMeta(item, '_thumbnail_id');

  let html = getContentEncoded(item);

  // Pre-processing pipeline (operates on HTML)
  html = transformCaptions(html);
  html = transformGalleries(html);

  const { spotifyUrl, html: htmlAfterSpotify } = extractSpotifyUrl(html);
  html = htmlAfterSpotify;

  const { html: htmlAfterImages, missing: missingImages } = rewriteImageSrcs(
    html,
    attachmentByBasename,
    '../../../assets/blog'
  );
  html = htmlAfterImages;

  // Copy resolved inline images to assets dir
  // (rewriteImageSrcs already computed relative paths; now copy files)
  // Note: copying is handled inline in rewriteImageSrcs via the attachmentByBasename map.
  // We need a separate pass to actually copy files for inline images.
  // See copyResolvedImages below.

  // HTML → Markdown
  let markdown = td.turndown(html);

  // Post-processing pipeline (operates on Markdown)
  markdown = convertAllCapsHeadings(markdown);
  markdown = convertYouTubeEmbeds(markdown);
  markdown = convertSoundCloudEmbeds(markdown);
  markdown = markdown.trim();

  // Resolve featured image
  const imagePath = resolveFeaturedImage(thumbnailId, attachmentById, attachmentByBasename, slug);
  const imageAlt = title;

  const frontmatter = buildFrontmatter({ title, publishedAt, tags, imagePath, imageAlt, spotifyUrl });

  return {
    slug,
    output: `${frontmatter}\n\n${markdown}\n`,
    missingImages: missingImages.map((url) => ({ slug, title, type: 'inline-image', originalUrl: url })),
    missingFeaturedImage: thumbnailId && !imagePath
      ? { slug, title, type: 'featured-image', thumbnailId, originalUrl: attachmentById.get(thumbnailId)?.url ?? 'unknown' }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Copy inline images to assets dir
// ---------------------------------------------------------------------------

function copyInlineImages(html, attachmentByBasename) {
  const copies = [];
  const srcPattern = /src="(\.\.\/\.\.\/\.\.\/assets\/blog\/[^"]+)"/g;
  // After rewriteImageSrcs, the src is already a local relative path.
  // We need to find which files were used and copy them.
  // This is handled by matching the resolved filenames from the map.

  // Actually, we'll do this inline: after rewriteImageSrcs rewrites paths,
  // we scan the output html for local asset paths and copy the source files.
  let match;
  while ((match = srcPattern.exec(html)) !== null) {
    const localRef = match[1]; // e.g. "../../../assets/blog/photo.jpg"
    const filename = localRef.split('/').pop();
    const normalised = stripSizeSuffix(filename).toLowerCase();
    const srcPath = attachmentByBasename.get(normalised);
    if (srcPath) {
      const destPath = join(BLOG_ASSETS_DIR, filename);
      try {
        copyFileSync(srcPath, destPath);
        copies.push(filename);
      } catch {
        // already copied or error — ignore
      }
    }
  }
  return copies;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('📖 Reading WordPress XML...');
  const xmlContent = readFileSync(XML_PATH, 'utf-8');
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');

  console.log('🗺  Building attachment maps...');
  const { attachmentById, attachmentByBasename } = buildAttachmentMaps(doc);
  console.log(`   Found ${attachmentById.size} attachments, ${attachmentByBasename.size} local media files`);

  console.log('⚙️  Building Turndown converter...');
  const td = buildTurndownService();

  // Ensure output directories exist
  mkdirSync(BLOG_OUTPUT_DIR, { recursive: true });
  mkdirSync(BLOG_ASSETS_DIR, { recursive: true });

  const items = doc.getElementsByTagName('item');
  let processed = 0;
  let skipped = 0;
  const missingMediaItems = [];

  console.log('🔄 Processing posts...');

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (getWpText(item, 'post_type') !== 'post') continue;
    if (getWpText(item, 'status') !== 'publish') continue;

    const categories = getCategories(item, 'category');
    const shouldExclude = categories.some((c) => EXCLUDED_CATEGORIES.has(c));
    if (shouldExclude) {
      skipped++;
      continue;
    }

    const { slug, output, missingImages, missingFeaturedImage } = transformPost(
      item, attachmentById, attachmentByBasename, td
    );

    if (!slug) {
      console.warn(`  ⚠ Skipping post with no slug`);
      continue;
    }

    // Copy inline images (those rewritten to local paths)
    copyInlineImages(output, attachmentByBasename);

    const outputPath = join(BLOG_OUTPUT_DIR, `${slug}.md`);
    writeFileSync(outputPath, output, 'utf-8');

    missingMediaItems.push(...missingImages);
    if (missingFeaturedImage) missingMediaItems.push(missingFeaturedImage);

    processed++;
    if (processed % 20 === 0) console.log(`   ...${processed} posts written`);
  }

  // Write missing media report
  writeFileSync(MISSING_MEDIA_REPORT, JSON.stringify(missingMediaItems, null, 2), 'utf-8');

  console.log('\n✅ Migration complete:');
  console.log(`   Posts written:  ${processed}`);
  console.log(`   Posts skipped:  ${skipped} (excluded categories)`);
  console.log(`   Missing media:  ${missingMediaItems.length} (see scripts/missing-media-report.json)`);
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Install @xmldom/xmldom (needed for XML parsing in Node.js)**

```bash
cd /home/steelwagstaff/steelwagstaff
pnpm add -D @xmldom/xmldom
```

- [ ] **Step 3: Run the tests from Task 6**

```bash
pnpm test src/__tests__/wp-transforms.test.ts
```

Expected: all tests PASS. Fix any failures before continuing.

- [ ] **Step 4: Commit**

```bash
git add scripts/migrate-wordpress-blog.mjs package.json pnpm-lock.yaml
git commit -m "feat: add migrate-wordpress-blog.mjs migration script"
```

---

## Task 8: Run the migration

- [ ] **Step 1: Dry-run check — count posts that would be processed**

```bash
cd /home/steelwagstaff/steelwagstaff
node -e "
import('/home/steelwagstaff/steelwagstaff/scripts/lib/wp-transforms.mjs').then(() => {
  console.log('wp-transforms imports OK');
});
"
```

Expected: `wp-transforms imports OK`

- [ ] **Step 2: Run the migration**

```bash
cd /home/steelwagstaff/steelwagstaff
node scripts/migrate-wordpress-blog.mjs
```

Expected output ends with:
```
✅ Migration complete:
   Posts written:  ~110
   Posts skipped:  ~170 (excluded categories)
   Missing media:  N (see scripts/missing-media-report.json)
```

- [ ] **Step 3: Spot-check 3 posts**

```bash
# Check a post with known [caption] shortcodes
head -30 src/content/blog/en/2016-the-year-in-oer-at-uw-madison.md

# Check a post with ALL CAPS headings
grep "^## " src/content/blog/en/2016-the-year-in-oer-at-uw-madison.md | head -5

# Check that tags are populated
grep "^tags:" src/content/blog/en/2016-the-year-in-oer-at-uw-madison.md

# Verify no raw [caption shortcodes remain
grep -r "\[caption" src/content/blog/en/ | wc -l
```

Expected: 0 raw `[caption` shortcodes remaining.

- [ ] **Step 4: Check missing media report**

```bash
cat scripts/missing-media-report.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'{len(d)} missing items'); [print(f\"  {x['type']}: {x['slug']}\") for x in d[:10]]"
```

Review the list — expected some featured images will be missing (normal).

- [ ] **Step 5: Run pnpm build to verify no schema/content errors**

```bash
pnpm build 2>&1 | grep -E "error|Error|warn" | head -20
```

Expected: build succeeds with 0 content collection errors.

- [ ] **Step 6: Commit migration output**

```bash
git add src/content/blog/en/ src/assets/blog/ scripts/missing-media-report.json
git commit -m "feat: re-migrate all WordPress blog posts from XML (clean HTML→MD conversion)"
```

---

## Task 9: Write generate-blog-descriptions.mjs

**Files:**
- Create: `scripts/generate-blog-descriptions.mjs`

Reads each blog post with a blank `description`, calls an LLM to generate a one-sentence summary, and writes it back to the frontmatter. Requires `ANTHROPIC_API_KEY` in `.env`.

- [ ] **Step 1: Install @anthropic-ai/sdk**

```bash
cd /home/steelwagstaff/steelwagstaff
pnpm add -D @anthropic-ai/sdk
```

- [ ] **Step 2: Confirm ANTHROPIC_API_KEY is set**

```bash
grep "ANTHROPIC_API_KEY" .env 2>/dev/null || echo "Not set — add ANTHROPIC_API_KEY=sk-... to .env"
```

If not set, add it to `.env` before running this script.

- [ ] **Step 3: Create the script**

Create `scripts/generate-blog-descriptions.mjs`:

```javascript
#!/usr/bin/env node
/**
 * generate-blog-descriptions.mjs
 * Populates blank 'description' fields in blog post frontmatter using Claude.
 *
 * Usage:
 *   node scripts/generate-blog-descriptions.mjs
 *
 * Requires:
 *   ANTHROPIC_API_KEY in .env (or environment)
 *
 * Skips posts that already have a non-empty description.
 * Processes posts with a 200ms delay between API calls to avoid rate limits.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = join(__dirname, '../src/content/blog/en');

// Load .env manually (no dotenv dependency needed)
function loadEnv() {
  try {
    const env = readFileSync(join(__dirname, '../.env'), 'utf-8');
    for (const line of env.split('\n')) {
      const [key, ...rest] = line.split('=');
      if (key && rest.length) {
        process.env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    // .env not found — rely on environment variables
  }
}

loadEnv();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function extractFrontmatterAndBody(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  return { frontmatter: match[1], body: match[2] };
}

function hasBlankDescription(frontmatter) {
  return /^description:\s*""?\s*$/m.test(frontmatter);
}

async function generateDescription(title, body) {
  // Truncate body to ~2000 chars to stay within token limits
  const excerpt = body.trim().slice(0, 2000);
  const message = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content: `Write a single sentence (under 160 characters) summarising this blog post. Return only the sentence, no quotes, no explanation.\n\nTitle: ${title}\n\n${excerpt}`,
      },
    ],
  });
  const text = message.content[0]?.type === 'text' ? message.content[0].text.trim() : '';
  // Ensure it fits in 160 chars
  return text.slice(0, 158);
}

function extractTitle(frontmatter) {
  const match = frontmatter.match(/^title:\s*"(.*)"\s*$/m);
  return match ? match[1].replace(/\\"/g, '"') : '';
}

function updateDescription(frontmatter, description) {
  const escaped = description.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return frontmatter.replace(/^description:\s*""?\s*$/m, `description: "${escaped}"`);
}

async function main() {
  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));
  const toProcess = [];

  for (const file of files) {
    const content = readFileSync(join(BLOG_DIR, file), 'utf-8');
    const parsed = extractFrontmatterAndBody(content);
    if (!parsed) continue;
    if (hasBlankDescription(parsed.frontmatter)) {
      toProcess.push({ file, content, ...parsed });
    }
  }

  console.log(`Found ${toProcess.length} posts with blank descriptions`);

  let done = 0;
  let failed = 0;

  for (const { file, content, frontmatter, body } of toProcess) {
    const title = extractTitle(frontmatter);
    try {
      const description = await generateDescription(title, body);
      const newFrontmatter = updateDescription(frontmatter, description);
      const newContent = content.replace(frontmatter, newFrontmatter);
      writeFileSync(join(BLOG_DIR, file), newContent, 'utf-8');
      done++;
      console.log(`  ✓ ${file.slice(0, 50)}: "${description.slice(0, 60)}..."`);
    } catch (err) {
      failed++;
      console.warn(`  ✗ ${file}: ${err.message}`);
    }

    // Polite delay between API calls
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\nDone: ${done} descriptions written, ${failed} failed`);
}

main().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
```

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-blog-descriptions.mjs package.json pnpm-lock.yaml
git commit -m "feat: add generate-blog-descriptions.mjs for LLM-generated post summaries"
```

- [ ] **Step 5: Run the script (only after migration is complete and API key is set)**

```bash
node scripts/generate-blog-descriptions.mjs
```

Expected: `Done: ~110 descriptions written, 0 failed`

- [ ] **Step 6: Verify build still passes**

```bash
pnpm build 2>&1 | grep -c "error" && echo "errors found" || echo "build OK"
```

Expected: `build OK`

- [ ] **Step 7: Commit descriptions**

```bash
git add src/content/blog/en/
git commit -m "content: add LLM-generated descriptions to all blog posts"
```

---

## Post-Migration Checklist

After all tasks are complete, work through any items in `scripts/missing-media-report.json`:

```bash
# Count remaining missing items
cat scripts/missing-media-report.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d), 'items missing')"

# List featured images specifically
cat scripts/missing-media-report.json | python3 -c "import json,sys; d=json.load(sys.stdin); [print(x['slug'], '-', x['originalUrl']) for x in d if x['type']=='featured-image']"
```

For each missing featured image: search `media-exports/` manually, or find a replacement. Then add the image to `src/assets/blog/` and update the frontmatter in the post file.
