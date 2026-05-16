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
const BLOG_ASSETS_DIR = join(PROJECT_ROOT, 'src/content/blog/en/images');
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

  return `./images/${destFilename}`;
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
    './images'
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
  const srcPattern = /src="(\.\/images\/[^"]+)"/g;
  // After rewriteImageSrcs, the src is already a local relative path.
  // We need to find which files were used and copy them.
  // This is handled by matching the resolved filenames from the map.

  // Actually, we'll do this inline: after rewriteImageSrcs rewrites paths,
  // we scan the output html for local asset paths and copy the source files.
  let match;
  while ((match = srcPattern.exec(html)) !== null) {
    const localRef = match[1]; // e.g. "./images/photo.jpg"
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
