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
