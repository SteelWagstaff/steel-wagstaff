#!/usr/bin/env node
/**
 * migrate-tumblr-v2.mjs
 * Re-imports 1,494 Tumblr HTML export posts into src/content/commonplace/
 *
 * Fixes all 8 bugs from the original script:
 *  1. Wrong dates ("4:25pm" → "4:25 pm" for Date parsing)
 *  2. Missing audio from <embed> elements
 *  3. Missing video URL from <iframe>
 *  4. HTML entities not decoded (&rsquo; etc.)
 *  5. Broken YAML URLs — using js-yaml dump() instead of hand-crafted strings
 *  6. Source field stored raw HTML — now clean markdown
 *  7. Messy reblog titles — cleaned attribution logic
 *  8. Multi-image gallery — copies all img elements
 */

import { JSDOM } from 'jsdom';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SOURCE_POSTS = path.resolve(__dirname, '../../tumblr/posts/html');
const SOURCE_MEDIA = path.resolve(__dirname, '../../tumblr/media');
const DEST_CONTENT = path.resolve(__dirname, '../src/content/commonplace');
const DEST_MEDIA   = path.resolve(__dirname, '../public/commonplace-media');

// ─── Shared JSDOM entity decoder ─────────────────────────────────────────────

const { document: _decoderDoc } = new JSDOM('<!DOCTYPE html>').window;
const _decoderEl = _decoderDoc.createElement('div');

/**
 * Decode HTML entities. Handles double-encoded content (e.g. &amp;rsquo; → ').
 */
function decodeEntities(html) {
  if (!html) return '';
  _decoderEl.innerHTML = String(html);
  const once = _decoderEl.textContent;
  // Second pass for double-encoded entities (e.g. &amp;rsquo; in body text)
  if (/&[a-z#]\w*;/i.test(once)) {
    _decoderEl.innerHTML = once;
    return _decoderEl.textContent;
  }
  return once;
}

// ─── Timestamp ───────────────────────────────────────────────────────────────

/**
 * Parse Tumblr's "October 14th, 2014 4:25pm" into ISO string.
 * Bug fix: removes ordinal suffixes and adds space before am/pm.
 */
function extractTimestamp(doc) {
  const el = doc.querySelector('#timestamp');
  if (!el) return new Date().toISOString();
  const raw = el.textContent.trim();
  const noOrdinal = raw.replace(/(\d+)(st|nd|rd|th)/gi, '$1');
  const fixed = noOrdinal.replace(/(\d+:\d+)(am|pm)/gi, '$1 $2');
  const date = new Date(fixed);
  if (isNaN(date.getTime())) {
    console.warn(`  Warning: Could not parse date "${raw}"`);
    return new Date().toISOString();
  }
  return date.toISOString();
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

function extractTags(doc) {
  return Array.from(doc.querySelectorAll('span.tag'))
    .map(el => decodeEntities(el.innerHTML).trim())
    .filter(Boolean);
}

// ─── Post type detection ──────────────────────────────────────────────────────

function detectPostType(doc) {
  const b = doc.body;
  if (
    b.querySelector('embed[type*="audio"]') ||
    b.querySelector('embed[src*=".mp3"]') ||
    b.querySelector('embed[src*=".m4a"]') ||
    b.querySelector('audio')
  ) return 'audio';
  if (
    b.querySelector('iframe[src*="youtube"], iframe[src*="vimeo"]') ||
    b.querySelector('embed[type*="video"]') ||
    b.querySelector('embed[src*=".mp4"]') ||
    b.querySelector('embed[src*="mov"]')
  ) return 'video';
  if (b.querySelector('img')) return 'photo';
  return 'text'; // refined to 'quote' later if attribution found
}

// ─── Media URL extraction ─────────────────────────────────────────────────────

function extractAudioUrl(doc) {
  const embed = doc.querySelector(
    'embed[type*="audio"], embed[src*=".mp3"], embed[src*=".m4a"]'
  );
  if (embed) return (embed.getAttribute('src') || '').replace(/['";\s]+$/, '');
  const audio = doc.querySelector('audio[src]');
  if (audio) return audio.getAttribute('src') || '';
  const src = doc.querySelector('audio source');
  if (src) return src.getAttribute('src') || '';
  return '';
}

function extractVideoUrl(doc) {
  const iframe = doc.querySelector('iframe[src*="youtube"], iframe[src*="vimeo"]');
  if (iframe) return (iframe.getAttribute('src') || '').split('?')[0];
  const embed = doc.querySelector('embed[type*="video"], embed[src*=".mp4"], embed[src*="mov"]');
  if (embed) return (embed.getAttribute('src') || '').replace(/['";\s]+$/, '');
  return '';
}

/** Returns iframe title attribute (e.g. YouTube video title) if available. */
function extractVideoTitle(doc) {
  const iframe = doc.querySelector('iframe[title]');
  return iframe ? decodeEntities(iframe.getAttribute('title') || '') : '';
}

/** Returns array of media basenames from all <img> elements (local only). */
function extractAllImageFilenames(doc) {
  return Array.from(doc.querySelectorAll('img'))
    .map(img => {
      const src = img.getAttribute('src') || '';
      if (src.startsWith('http')) return null; // skip external
      return path.basename(src);
    })
    .filter(Boolean);
}

// ─── Media copying ────────────────────────────────────────────────────────────

/** Copy a media file from SOURCE_MEDIA to DEST_MEDIA. Returns public path or null. */
function copyMediaFile(basename) {
  if (!basename) return null;
  const src = path.join(SOURCE_MEDIA, basename);
  const dest = path.join(DEST_MEDIA, basename);
  if (fs.existsSync(src)) {
    if (!fs.existsSync(dest)) fs.copyFileSync(src, dest);
    return `commonplace-media/${basename}`;
  }
  return null;
}

// ─── HTML → Markdown ─────────────────────────────────────────────────────────

/**
 * Convert HTML to markdown:
 * - <br/> → two trailing spaces + newline (hard line break)
 * - <p> blocks → paragraph breaks
 * - <em>/<i> → *...*
 * - <strong>/<b> → **...**
 * - <blockquote> → > prefix per line
 * - <a> → text only (drop href)
 * - Strips all other tags, decodes entities
 */
function htmlToMarkdown(html) {
  if (!html) return '';
  let h = html;
  // Hard line breaks
  h = h.replace(/<br\s*\/?>/gi, '  \n');
  // Paragraphs
  h = h.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n');
  h = h.replace(/<p[^>]*>/gi, '');
  h = h.replace(/<\/p>/gi, '\n\n');
  // Headings — skip empty ones
  h = h.replace(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gis, (_, c) => {
    const text = c.replace(/<[^>]+>/g, '').trim();
    return text ? `## ${text}\n\n` : '';
  });
  // Emphasis
  h = h.replace(/<(?:em|i)>(.*?)<\/(?:em|i)>/gis, '*$1*');
  h = h.replace(/<(?:strong|b)>(.*?)<\/(?:strong|b)>/gis, '**$1**');
  // Blockquotes
  h = h.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, content) => {
    const lines = htmlToMarkdown(content).split('\n');
    return lines.map(l => `> ${l}`).join('\n') + '\n';
  });
  // Links — keep text
  h = h.replace(/<a[^>]*>(.*?)<\/a>/gis, '$1');
  // Strip remaining tags
  h = h.replace(/<[^>]+>/g, '');
  // Decode entities
  h = decodeEntities(h);
  // Normalise whitespace
  h = h.replace(/^[ \t]+/gm, '');  // strip leading whitespace from HTML indentation
  h = h.replace(/\n{3,}/g, '\n\n');
  return h.trim();
}

// ─── Attribution helpers ──────────────────────────────────────────────────────

/**
 * Find the raw HTML of an attribution line (starts with — or –).
 * Searches caption first, then last <p> in body.
 */
function findAttributionHtml(doc) {
  // Caption
  const caption = doc.querySelector('.caption');
  if (caption) {
    const capText = caption.textContent || '';
    if (/^\s*[—–]/.test(capText.trim())) return caption.innerHTML;
    for (const p of caption.querySelectorAll('p')) {
      if (/^\s*[—–]/.test(p.textContent || '')) return p.innerHTML;
    }
  }
  // Last body paragraphs (poetry attribution at end of verse)
  const bodyPs = Array.from(doc.querySelectorAll('body > p'));
  for (let i = bodyPs.length - 1; i >= 0; i--) {
    if (/^\s*[—–]/.test(bodyPs[i].textContent || '')) return bodyPs[i].innerHTML;
  }
  return null;
}

/**
 * Parse attribution HTML into { workTitle, author }.
 * workTitle is from <em>/<i> or quoted text; author is text before first comma.
 */
function parseAttributionParts(attrHtml) {
  if (!attrHtml) return { workTitle: null, author: '' };
  const emMatch  = attrHtml.match(/<(?:em|i)>(.*?)<\/(?:em|i)>/i);
  const quoteMatch = attrHtml.match(/[\u201c"](.*?)[\u201d"]/);
  const clean = decodeEntities(attrHtml.replace(/<[^>]+>/g, '')).replace(/^[—–\s]+/, '');
  const author = clean.split(',')[0].trim();
  let workTitle = null;
  if (quoteMatch) workTitle = decodeEntities(quoteMatch[1]).trim();
  else if (emMatch) workTitle = decodeEntities(emMatch[1]).trim();
  return { workTitle, author };
}

/**
 * Build a clean source/attribution string for frontmatter (markdown).
 * e.g. "Robert Bringhurst, *The Elements of Typographic Style*"
 */
function buildSource(doc) {
  const attrHtml = findAttributionHtml(doc);
  if (!attrHtml) return '';
  let h = attrHtml.replace(/^[\s—–]+/, '').trim();
  h = h.replace(/<(?:em|i)>(.*?)<\/(?:em|i)>/gis, '*$1*');
  h = h.replace(/<a[^>]*>(.*?)<\/a>/gis, '$1');
  h = h.replace(/<[^>]+>/g, '');
  let source = decodeEntities(h).trim();
  source = source.replace(/\s*\(via\s+[^)]+\)/gi, '').trim();
  source = source.replace(/[,;]+$/, '').trim();
  return source;
}

// ─── Title building ───────────────────────────────────────────────────────────

/** Strip reblog prefix (tumblr_blog attribution + blockquote chain) from caption HTML. */
function stripReblogNoise(captionHtml) {
  return captionHtml
    .replace(/<p[^>]*>\s*<a[^>]*class="tumblr_blog"[^>]*>.*?<\/a>:?.*?<\/p>/gis, '')
    .replace(/<blockquote[\s\S]*?<\/blockquote>/gi, '')
    .trim();
}

/**
 * Build the post title using priority order:
 * 1. Non-empty <h1> (+ author from attribution if found) → "Title", Author
 * 2. Attribution with work title → "Work Title", Author
 * 3. Full attribution text (if short)
 * 4. Video iframe title attribute
 * 5. Relevant text snippet (first ~80 chars)
 */
function buildTitle(doc, type, relevantText) {
  // 1. h1 element
  for (const h1 of doc.querySelectorAll('h1')) {
    const text = decodeEntities(h1.innerHTML).trim();
    if (!text) continue;
    const attrHtml = findAttributionHtml(doc);
    if (attrHtml) {
      const { author } = parseAttributionParts(attrHtml);
      if (author) return `${text}, ${author}`;
    }
    return text;
  }

  // 2 & 3. Attribution
  const attrHtml = findAttributionHtml(doc);
  if (attrHtml) {
    const { workTitle, author } = parseAttributionParts(attrHtml);
    if (workTitle && author) return `\u201c${workTitle}\u201d, ${author}`;
    const full = decodeEntities(attrHtml.replace(/<[^>]+>/g, '')).replace(/^[—–\s]+/, '').trim();
    if (full && full.length < 120) return full;
    if (author) return author;
  }

  // 4. YouTube/Vimeo iframe title
  if (type === 'video') {
    const vTitle = extractVideoTitle(doc);
    if (vTitle) return vTitle;
  }

  // 5. Relevant text fallback — strip markdown markers so they don't appear in titles
  if (relevantText) {
    const flat = relevantText.replace(/[*_#>`]/g, '').replace(/\s+/g, ' ').trim();
    const words = flat.split(' ');
    let title = '';
    for (const w of words) {
      if (title.length + w.length + 1 > 80) break;
      title += (title ? ' ' : '') + w;
    }
    return title || flat.substring(0, 80);
  }

  return 'Untitled';
}

// ─── Content extraction ───────────────────────────────────────────────────────

/**
 * Extract the textual content appropriate for each post type.
 * Returns { bodyHtml, relevantText } where relevantText is for title fallback.
 */
function extractContent(doc, type) {
  if (type === 'audio' || type === 'video') {
    const caption = doc.querySelector('.caption');
    const captionHtml = caption ? caption.innerHTML : '';
    return { bodyHtml: captionHtml, relevantText: htmlToMarkdown(captionHtml) };
  }

  if (type === 'photo') {
    const caption = doc.querySelector('.caption');
    if (!caption) return { bodyHtml: '', relevantText: '' };
    const cleanHtml = stripReblogNoise(caption.innerHTML);
    const md = htmlToMarkdown(cleanHtml);
    return { bodyHtml: cleanHtml, relevantText: md };
  }

  // text / quote: full body minus footer, media, and h1 (h1 becomes the title field)
  const bodyClone = doc.body.cloneNode(true);
  for (const sel of ['#footer', 'link', 'style', 'img', 'embed', 'iframe', 'h1']) {
    bodyClone.querySelectorAll(sel).forEach(el => el.remove());
  }
  const bodyHtml = bodyClone.innerHTML;
  const md = htmlToMarkdown(bodyHtml);
  return { bodyHtml, relevantText: md };
}

// ─── Main migration ───────────────────────────────────────────────────────────

async function migrate() {
  fs.mkdirSync(DEST_CONTENT, { recursive: true });
  fs.mkdirSync(DEST_MEDIA,   { recursive: true });

  // Clean slate
  const existing = fs.readdirSync(DEST_CONTENT).filter(f => f.endsWith('.md'));
  console.log(`Deleting ${existing.length} existing entries…`);
  for (const f of existing) fs.unlinkSync(path.join(DEST_CONTENT, f));

  const htmlFiles = fs.readdirSync(SOURCE_POSTS).filter(f => f.endsWith('.html'));
  console.log(`Found ${htmlFiles.length} posts to migrate.\n`);

  let processed = 0, errors = 0;

  for (const filename of htmlFiles) {
    try {
      const postId = filename.replace('.html', '');
      const rawHtml = fs.readFileSync(path.join(SOURCE_POSTS, filename), 'utf-8');
      const { document: doc } = new JSDOM(rawHtml).window;

      const publishedAt = extractTimestamp(doc);
      const tags        = extractTags(doc);
      let   type        = detectPostType(doc);

      // ── Media ──────────────────────────────────────────────────────────
      let imageUrl = null;
      const galleryImages = [];

      if (type === 'audio') {
        const rawUrl = extractAudioUrl(doc);
        if (rawUrl && !rawUrl.startsWith('http')) {
          imageUrl = copyMediaFile(path.basename(rawUrl));
        } else {
          imageUrl = rawUrl || null;
        }
      } else if (type === 'video') {
        const rawUrl = extractVideoUrl(doc);
        if (rawUrl && !rawUrl.startsWith('http')) {
          imageUrl = copyMediaFile(path.basename(rawUrl));
        } else {
          imageUrl = rawUrl || null;
        }
      } else if (type === 'photo') {
        for (const fn of extractAllImageFilenames(doc)) {
          const copied = copyMediaFile(fn);
          if (copied) galleryImages.push(copied);
        }
        imageUrl = galleryImages[0] || null;
      }

      // ── Content ────────────────────────────────────────────────────────
      const { bodyHtml, relevantText } = extractContent(doc, type);
      const bodyMarkdown = htmlToMarkdown(bodyHtml);

      // Refine text → quote if attribution present
      if (type === 'text' && findAttributionHtml(doc)) type = 'quote';

      // ── Source / Attribution ───────────────────────────────────────────
      const source = buildSource(doc);

      // ── Title ──────────────────────────────────────────────────────────
      const title = buildTitle(doc, type, relevantText);

      // ── Markdown body ──────────────────────────────────────────────────
      let mdBody = bodyMarkdown;
      if (type === 'photo' && galleryImages.length > 1) {
        const gallery = galleryImages.map(img => `![](/${img})`).join('\n\n');
        mdBody = bodyMarkdown.trim() ? `${gallery}\n\n${bodyMarkdown}` : gallery;
      }

      // ── Frontmatter ────────────────────────────────────────────────────
      // Truncate title to schema max (300 chars) at a word boundary
      const rawTitle = (title || 'Untitled').trim();
      const safeTitle = rawTitle.length <= 280
        ? rawTitle
        : rawTitle.substring(0, 280).replace(/\s+\S*$/, '') + '…';
      const frontmatter = {
        title: safeTitle,
        type,
        publishedAt,
        tags,
        draft: false,
        locale: 'en',
      };
      if (source)   frontmatter.source    = source;
      if (type === 'photo'  && imageUrl) frontmatter.image    = imageUrl;
      if (type === 'audio'  && imageUrl) frontmatter.audioUrl = imageUrl;
      if (type === 'video'  && imageUrl) frontmatter.videoUrl = imageUrl;

      // js-yaml handles URLs and special characters safely (Bug 5 fix)
      const yamlStr = yaml.dump(frontmatter, {
        lineWidth: -1,
        quotingType: '"',
        forceQuotes: false,
        noRefs: true,
      });

      const fileContent = `---\n${yamlStr}---\n\n${mdBody.trim()}\n`;
      fs.writeFileSync(
        path.join(DEST_CONTENT, `${postId}.md`),
        fileContent,
        'utf-8'
      );
      processed++;
      if (processed % 100 === 0) console.log(`  ${processed}/${htmlFiles.length}…`);
    } catch (err) {
      console.error(`  ERROR ${filename}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nDone! Processed: ${processed}, Errors: ${errors}`);
}

migrate().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
