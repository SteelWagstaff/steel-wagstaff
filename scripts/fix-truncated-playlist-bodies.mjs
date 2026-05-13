/**
 * Fix truncated monthly playlist files.
 *
 * Problem: ~67 music .md files have their full post text stuffed into the
 * `description` frontmatter field (truncated) and the same truncated text
 * as the body. The full original text lives in Steel's Magnolias XML export.
 *
 * Fix:
 *  1. Build a map of post_name → full content:encoded from the XML.
 *  2. For each .md file tagged "monthly playlist" with a long description,
 *     replace the body with the full XML content and shorten the description.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;
const XML_PATH = join(ROOT, 'steel039smagnolias.WordPress.2026-04-28.xml');
const MUSIC_DIR = join(ROOT, 'src/content/music/en');

// ---------------------------------------------------------------------------
// 1. Parse XML: extract post_name → content:encoded map
// ---------------------------------------------------------------------------

const xml = readFileSync(XML_PATH, 'utf8');

// Extract all <item> blocks
const itemRegex = /<item>([\s\S]*?)<\/item>/g;
const postMap = new Map(); // slug → full content string

let itemMatch;
while ((itemMatch = itemRegex.exec(xml)) !== null) {
  const item = itemMatch[1];

  const nameMatch = item.match(/<wp:post_name><!\[CDATA\[(.*?)\]\]><\/wp:post_name>/);
  const contentMatch = item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);
  const statusMatch = item.match(/<wp:status><!\[CDATA\[(.*?)\]\]><\/wp:status>/);

  if (nameMatch && contentMatch && statusMatch?.[1] === 'publish') {
    const slug = nameMatch[1].trim();
    const content = contentMatch[1].trim();
    if (slug && content) {
      postMap.set(slug, content);
    }
  }
}

console.log(`Loaded ${postMap.size} published posts from XML.`);

// ---------------------------------------------------------------------------
// 2. Process .md files
// ---------------------------------------------------------------------------

/**
 * Shorten a string to a concise description (≤160 chars), breaking at a
 * sentence or clause boundary where possible.
 */
function makeDescription(text) {
  const clean = text
    .replace(/https?:\/\/\S+/g, '') // remove URLs
    .replace(/\s+/g, ' ')
    .trim();

  if (clean.length <= 160) return clean;

  // Try to break at a sentence boundary within 160 chars
  const truncated = clean.slice(0, 160);
  const sentenceEnd = truncated.search(/[.!?][^.!?]*$/);
  if (sentenceEnd > 60) {
    return truncated.slice(0, sentenceEnd + 1).trim();
  }

  // Fall back to last space before 160
  const lastSpace = truncated.lastIndexOf(' ');
  return truncated.slice(0, lastSpace > 0 ? lastSpace : 160).trim();
}

/**
 * Parse frontmatter from an .md file. Returns { frontmatter, body }.
 * frontmatter is the raw string between the --- delimiters.
 */
function parseMd(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;
  return { frontmatter: match[1], body: match[2].trim() };
}

const files = readdirSync(MUSIC_DIR).filter(f => f.endsWith('.md'));
let fixed = 0;
let skipped = 0;
let notFound = 0;

for (const filename of files) {
  const filePath = join(MUSIC_DIR, filename);
  const raw = readFileSync(filePath, 'utf8');
  const parsed = parseMd(raw);
  if (!parsed) continue;

  // Only process files tagged "monthly playlist"
  if (!parsed.frontmatter.includes('monthly playlist')) continue;

  // Only process files with a long description (the problem indicator)
  const descMatch = parsed.frontmatter.match(/^description:\s*"([\s\S]*?)"\s*$/m);
  if (!descMatch) continue;
  const currentDesc = descMatch[1];
  if (currentDesc.length <= 120) continue; // already fine

  // Derive slug from filename
  const slug = basename(filename, '.md');

  const fullContent = postMap.get(slug);
  if (!fullContent) {
    console.warn(`  NOT FOUND in XML: ${filename} (slug: ${slug})`);
    notFound++;
    continue;
  }

  // Build new description (short) and body (full)
  const newDesc = makeDescription(fullContent);

  // Escape double-quotes in description for YAML
  const escapedDesc = newDesc.replace(/"/g, '\\"');

  // Replace description in frontmatter
  const newFrontmatter = parsed.frontmatter.replace(
    /^description:.*$/m,
    `description: "${escapedDesc}"`
  );

  const newContent = `---\n${newFrontmatter}\n---\n\n${fullContent}\n`;
  writeFileSync(filePath, newContent, 'utf8');
  console.log(`  Fixed: ${filename}`);
  fixed++;
}

console.log(`\nDone. Fixed: ${fixed}, Skipped (already OK): ${skipped}, Not found in XML: ${notFound}`);
