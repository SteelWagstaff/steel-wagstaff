#!/usr/bin/env node
/**
 * Repair dead WordPress image URLs left in already-migrated blog posts
 * (both raw <img src="..."> and markdown ![]() forms), by re-matching
 * against local media (media-exports/, src/assets/blog/, and the
 * co-located src/content/blog/en/images/) using the same fuzzy filename
 * matching as the main migration script. Does not touch post text.
 *
 * Usage:
 *   node scripts/repair-dead-image-urls.mjs --dry-run
 *   node scripts/repair-dead-image-urls.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { stripSizeSuffix } from './lib/wp-transforms.mjs';

const projectRoot = process.cwd();
const blogDir = path.join(projectRoot, 'src', 'content', 'blog', 'en');
const imagesDir = path.join(blogDir, 'images');
const reportPath = path.join(projectRoot, 'scripts', 'dead-image-repair-report.json');
const dryRun = process.argv.includes('--dry-run');

const DEAD_HOST_PATTERN = /(files\.wordpress\.com|steelwagstaff\.wordpress\.com|steelwagstaff\.info\/wordpress)/i;

function normalizedFilename(filename) {
  return stripSizeSuffix(filename).toLowerCase();
}

function basenameFromUrl(url) {
  return decodeURIComponent(url.split('?')[0].split('/').pop() ?? '');
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
  });
}

function buildLocalMediaMap() {
  const files = [
    ...walkFiles(path.join(projectRoot, 'media-exports')),
    ...walkFiles(path.join(projectRoot, 'src', 'assets', 'blog')),
    ...walkFiles(imagesDir),
  ];
  const media = new Map();
  for (const file of files) {
    const key = normalizedFilename(path.basename(file));
    if (!media.has(key)) media.set(key, file);
  }
  return media;
}

function getBlogFiles() {
  return fs
    .readdirSync(blogDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')))
    .map((entry) => path.join(blogDir, entry.name));
}

// Matches both `src="<dead-url>"` inside <img> tags and markdown `](<dead-url>)`
const URL_PATTERN = /(src="|\]\()([^")]+)(["\)])/g;

function repairPost(postPath, localMedia, report) {
  const original = fs.readFileSync(postPath, 'utf8');
  const filename = path.basename(postPath);
  let changed = false;

  const updated = original.replace(URL_PATTERN, (match, prefix, url, suffix) => {
    if (!DEAD_HOST_PATTERN.test(url)) return match;

    const basename = basenameFromUrl(url);
    const key = normalizedFilename(basename);
    const source = localMedia.get(key);

    if (!source) {
      report.missing.push({ post: filename, originalUrl: url });
      return match;
    }

    const destFilename = path.basename(source);
    const destPath = path.join(imagesDir, destFilename);
    if (!dryRun) {
      fs.mkdirSync(imagesDir, { recursive: true });
      if (!fs.existsSync(destPath)) fs.copyFileSync(source, destPath);
    }

    changed = true;
    report.resolved.push({ post: filename, originalUrl: url, filename: destFilename });
    return `${prefix}./images/${destFilename}${suffix}`;
  });

  if (changed) {
    report.changedPosts += 1;
    if (!dryRun) fs.writeFileSync(postPath, updated, 'utf8');
  }
}

function main() {
  const localMedia = buildLocalMediaMap();
  const report = { dryRun, changedPosts: 0, resolved: [], missing: [] };

  for (const postPath of getBlogFiles()) {
    repairPost(postPath, localMedia, report);
  }

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`${dryRun ? 'Would repair' : 'Repaired'} ${report.changedPosts} posts.`);
  console.log(`Resolved ${report.resolved.length} image URLs; ${report.missing.length} remain unresolved.`);
  console.log(`Report written to ${path.relative(projectRoot, reportPath)}`);
}

main();
