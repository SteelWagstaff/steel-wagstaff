#!/usr/bin/env node
/**
 * Convert leftover WordPress [caption] shortcodes into clean <figure> markup.
 * Operates on post bodies only — frontmatter (tags, description, etc.) is never touched.
 *
 * Handles shortcodes already containing an image reference (markdown ![]() ,
 * a linked markdown image [![]()](url), or raw <img>), in both plain
 * ([caption]...[/caption]) and backslash-escaped (\[caption]...\[/caption\])
 * forms produced by earlier HTML→Markdown conversions.
 *
 * Shortcodes with no image reference at all (attachment IDs whose source
 * image was never recovered) are left untouched and reported so they can be
 * addressed separately.
 *
 * Usage:
 *   node scripts/fix-caption-shortcodes.mjs --dry-run
 *   node scripts/fix-caption-shortcodes.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const dryRun = process.argv.includes('--dry-run');
const reportPath = path.join(projectRoot, 'scripts', 'caption-shortcode-fix-report.json');

const TARGET_DIRS = [
  path.join(projectRoot, 'src', 'content', 'blog', 'en'),
  path.join(projectRoot, 'src', 'content', 'podcasts', 'en'),
];

function getMdFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')))
    .map((entry) => path.join(directory, entry.name));
}

function splitFrontmatter(content) {
  const match = content.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
  return match ? { frontmatter: match[1], body: match[2] } : { frontmatter: '', body: content };
}

// Matches both `[caption ...]...[/caption]` and `\[caption ...\]...\[/caption\]`
const SHORTCODE_PATTERN = /\\?\[caption([^\]]*)\\?\]([\s\S]*?)\\?\[\/caption\\?\]/g;

function unescapeAttrs(raw) {
  return raw.replace(/\\_/g, '_');
}

function fixMalformedUrl(url) {
  return url.replace(/^https:\/\/:/, 'https://').replace(/^https:\/\/\//, 'https://');
}

function extractImage(inner) {
  const trimmed = inner.trim();

  // Linked markdown image: [![alt](src)](href) trailing-caption
  let m = trimmed.match(/^\[!\[([^\]]*)\]\(([^)]+)\)\]\([^)]*\)\s*([\s\S]*)$/);
  if (m) return { alt: m[1], src: fixMalformedUrl(m[2]), trailingText: m[3].trim() };

  // Plain markdown image: ![alt](src) trailing-caption
  m = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*([\s\S]*)$/);
  if (m) return { alt: m[1], src: fixMalformedUrl(m[2]), trailingText: m[3].trim() };

  // Raw HTML <img ...>
  m = trimmed.match(/^(<img\b[^>]*>)\s*([\s\S]*)$/i);
  if (m) {
    const srcMatch = m[1].match(/\bsrc="([^"]+)"/i);
    const altMatch = m[1].match(/\balt="([^"]*)"/i);
    if (srcMatch) {
      return { alt: altMatch ? altMatch[1] : '', src: fixMalformedUrl(srcMatch[1]), trailingText: m[2].trim() };
    }
  }

  return null;
}

function buildFigure({ align, width, alt, src, caption }) {
  const alignClass = align || 'none';
  const widthAttr = width ? ` width="${width}"` : '';
  const figcaption = caption ? `<figcaption>${caption}</figcaption>` : '';
  return `<figure class="align-${alignClass}"><img src="${src}" alt="${alt}"${widthAttr} />${figcaption}</figure>`;
}

function fixFile(filePath, report) {
  const original = fs.readFileSync(filePath, 'utf8');
  const { frontmatter, body } = splitFrontmatter(original);
  const filename = path.basename(filePath);
  let changed = false;

  const updatedBody = body.replace(SHORTCODE_PATTERN, (match, rawAttrs, rawInner) => {
    const attrs = unescapeAttrs(rawAttrs);
    const image = extractImage(rawInner);

    if (!image) {
      report.skippedNoImage.push({ file: filename, shortcode: match.slice(0, 120) });
      return match;
    }

    const align = attrs.match(/\balign="align(\w+)"/i)?.[1] ?? 'none';
    const width = attrs.match(/\bwidth="(\d+)"/i)?.[1] ?? '';
    const captionAttr = attrs.match(/\bcaption="([\s\S]*?)"\s*$/i)?.[1];
    const caption = (captionAttr ?? image.trailingText ?? '').trim();

    changed = true;
    report.converted.push({ file: filename, src: image.src });
    return buildFigure({ align, width, alt: image.alt, src: image.src, caption });
  });

  if (changed) {
    report.changedFiles += 1;
    if (!dryRun) fs.writeFileSync(filePath, `${frontmatter}${updatedBody}`, 'utf8');
  }
}

function main() {
  const report = { dryRun, changedFiles: 0, converted: [], skippedNoImage: [] };

  for (const dir of TARGET_DIRS) {
    for (const filePath of getMdFiles(dir)) {
      fixFile(filePath, report);
    }
  }

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`${dryRun ? 'Would convert' : 'Converted'} shortcodes in ${report.changedFiles} files.`);
  console.log(`Converted ${report.converted.length} shortcodes to <figure>; ${report.skippedNoImage.length} left untouched (no image reference).`);
  console.log(`Report written to ${path.relative(projectRoot, reportPath)}`);
}

main();
