#!/usr/bin/env node
/**
 * Recover WordPress caption images from the XML export and replace resolved
 * caption shortcodes in migrated blog posts.
 *
 * Usage:
 *   node scripts/repair-wordpress-caption-images.mjs --dry-run
 *   node scripts/repair-wordpress-caption-images.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { DOMParser } from '@xmldom/xmldom';
import { replaceRecoveredCaptionShortcodes, stripSizeSuffix } from './lib/wp-transforms.mjs';

const projectRoot = process.cwd();
const xmlPath = path.join(projectRoot, 'steelwagstaff.WordPress.2026-04-24.xml');
const blogDir = path.join(projectRoot, 'src', 'content', 'blog', 'en');
const mediaExportDir = path.join(projectRoot, 'media-exports');
const reportPath = path.join(projectRoot, 'scripts', 'caption-recovery-report.json');
const dryRun = process.argv.includes('--dry-run');

function textContent(parent, namespace, name) {
  const nodes = parent.getElementsByTagNameNS(namespace, name);
  return nodes.length > 0 ? (nodes[0].textContent ?? '').trim() : '';
}

function basenameFromUrl(url) {
  return decodeURIComponent(url.split('?')[0].split('/').pop() ?? '');
}

function normalizedFilename(filename) {
  return stripSizeSuffix(filename).toLowerCase();
}

function walkFiles(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
  });
}

function buildAttachmentMap(xml) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const attachments = new Map();
  const items = doc.getElementsByTagName('item');

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (textContent(item, 'http://wordpress.org/export/1.2/', 'post_type') !== 'attachment') continue;

    const id = textContent(item, 'http://wordpress.org/export/1.2/', 'post_id');
    const url = textContent(item, 'http://wordpress.org/export/1.2/', 'attachment_url');
    if (!id || !url) continue;

    attachments.set(id, {
      filename: basenameFromUrl(url),
      url,
      title: item.getElementsByTagName('title')[0]?.textContent?.trim() ?? '',
    });
  }

  // Some WordPress exports omit attachment items but retain the image source
  // inside the post body. Use those wp-image IDs as a fallback.
  const imageReferences = /wp-image-(\d+)[^>]*\bsrc="([^"]+)"/gi;
  for (const match of xml.matchAll(imageReferences)) {
    const [, id, url] = match;
    if (!attachments.has(id)) {
      attachments.set(id, {
        filename: basenameFromUrl(url),
        url,
        title: '',
      });
    }
  }

  return attachments;
}

function buildLocalMediaMap() {
  const files = [
    ...walkFiles(mediaExportDir),
    ...walkFiles(path.join(projectRoot, 'src', 'assets', 'blog')),
    ...walkFiles(path.join(projectRoot, 'src', 'content', 'blog', 'en', 'images')),
  ];
  const media = new Map();

  for (const file of files) {
    const filename = path.basename(file);
    const key = normalizedFilename(filename);
    if (!media.has(key)) media.set(key, file);
  }

  return media;
}

function getBlogFiles() {
  return fs.readdirSync(blogDir)
    .filter((filename) => filename.endsWith('.md') || filename.endsWith('.mdx'))
    .map((filename) => path.join(blogDir, filename));
}

function splitFrontmatter(content) {
  const match = content.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
  return match ? { frontmatter: match[1], body: match[2] } : { frontmatter: '', body: content };
}

function main() {
  if (!fs.existsSync(xmlPath)) throw new Error(`WordPress XML not found: ${xmlPath}`);

  const attachments = buildAttachmentMap(fs.readFileSync(xmlPath, 'utf8'));
  const localMedia = buildLocalMediaMap();
  const report = {
    dryRun,
    xmlPath,
    processedPosts: 0,
    changedPosts: 0,
    resolved: [],
    missing: [],
  };

  for (const postPath of getBlogFiles()) {
    const original = fs.readFileSync(postPath, 'utf8');
    const { frontmatter, body } = splitFrontmatter(original);
    if (!body.includes('[caption')) continue;

    const attachmentIds = [...body.matchAll(/\[caption[^\]]*\bid="attachment_(\d+)"/gi)]
      .map((match) => match[1]);
    if (attachmentIds.length === 0) continue;
    report.processedPosts += 1;

    const imageMap = new Map();
    for (const attachmentId of new Set(attachmentIds)) {
      const attachment = attachments.get(attachmentId);
      if (!attachment) {
        report.missing.push({ post: path.basename(postPath), attachmentId, filename: null, url: null });
        continue;
      }

      const source = localMedia.get(normalizedFilename(attachment.filename));
      if (!source) {
        report.missing.push({
          post: path.basename(postPath),
          attachmentId,
          filename: attachment.filename,
          url: attachment.url,
        });
        continue;
      }

      const imageDirectory = path.join(path.dirname(postPath), 'images');
      const destination = path.join(imageDirectory, path.basename(source));
      if (!dryRun) {
        fs.mkdirSync(imageDirectory, { recursive: true });
        if (!fs.existsSync(destination)) fs.copyFileSync(source, destination);
      }

      imageMap.set(attachmentId, {
        src: `./images/${path.basename(source)}`,
        alt: attachment.title,
      });
      report.resolved.push({
        post: path.basename(postPath),
        attachmentId,
        filename: path.basename(source),
        source,
      });
    }

    const transformed = replaceRecoveredCaptionShortcodes(body, imageMap);
    if (transformed.html !== body) {
      report.changedPosts += 1;
      if (!dryRun) fs.writeFileSync(postPath, `${frontmatter}${transformed.html}`);
    }
  }

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`${dryRun ? 'Would repair' : 'Repaired'} ${report.changedPosts} posts.`);
  console.log(`Resolved ${report.resolved.length} images; ${report.missing.length} remain missing.`);
  console.log(`Report written to ${path.relative(projectRoot, reportPath)}`);
}

main();
