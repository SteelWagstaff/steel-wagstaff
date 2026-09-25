import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distRoot = path.join(root, 'dist');
const publicBlogRoot = path.join(root, 'public', 'blog-media');
const optimizedBlogRoot = path.join(root, 'public', '_optimized-images', 'blog-media');

async function getHtmlFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return getHtmlFiles(entryPath);
    return entry.name.endsWith('.html') ? [entryPath] : [];
  }));

  return files.flat(1);
}

function encodePathSegment(value) {
  return encodeURIComponent(value).replace(/%2F/g, '/');
}

async function imageExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function getImageUrls(fileName) {
  const parsed = path.parse(fileName);
  const originalPath = path.join(publicBlogRoot, fileName);
  const optimizedPath = path.join(optimizedBlogRoot, fileName);
  const hasOriginal = await imageExists(originalPath);
  const hasOptimized = await Promise.all([640, 1280].map(async (width) => {
    const basePath = path.join(optimizedBlogRoot, `${parsed.name}-${width}`);
    return {
      width,
      avif: await imageExists(`${basePath}.avif`),
      webp: await imageExists(`${basePath}.webp`),
    };
  }));

  if (!hasOriginal || !hasOptimized.some(({ avif, webp }) => avif || webp)) return null;

  const encodedFileName = encodePathSegment(fileName);
  const originalUrl = `/blog-media/${encodedFileName}`;
  const sources = ['avif', 'webp'].flatMap((format) => {
    const entries = hasOptimized
      .filter((output) => output[format])
      .map(({ width }) => `/_optimized-images/blog-media/${encodePathSegment(`${parsed.name}-${width}.${format}`)} ${width}w`)
      .join(', ');

    return entries ? [`<source type="image/${format}" srcset="${entries}" sizes="100vw">`] : [];
  });

  return { originalUrl, sources };
}

async function rewriteFile(filePath) {
  let html = await fs.readFile(filePath, 'utf8');
  let imageCount = 0;
  let linkCount = 0;

  const imageTags = [...html.matchAll(/<img\b[^>]*>/gi)];
  for (const match of imageTags.reverse()) {
    const tag = match[0];
    const sourceMatch = tag.match(/\bsrc=(['"])\.\/images\/([^'"?#]+)(?:[?#][^'" ]*)?\1/i);
    if (!sourceMatch) continue;

    const [, quote, fileName] = sourceMatch;
    const imageUrls = await getImageUrls(fileName);
    if (!imageUrls) continue;

    const rewrittenTag = tag.replace(
      sourceMatch[0],
      `src=${quote}${imageUrls.originalUrl}${quote}`,
    );
    const picture = `<picture>${imageUrls.sources.join('')}\n${rewrittenTag}\n</picture>`;
    html = `${html.slice(0, match.index)}${picture}${html.slice(match.index + tag.length)}`;
    imageCount += 1;
  }

  html = html.replace(/\bhref=(['"])\.\/images\/([^'"?#]+)(?:[?#][^'" ]*)?\1/gi, (match, quote, fileName) => {
    const originalPath = path.join(publicBlogRoot, fileName);
    if (!existsSync(originalPath)) return match;
    linkCount += 1;
    return `href=${quote}/blog-media/${encodePathSegment(fileName)}${quote}`;
  });

  if (imageCount || linkCount) await fs.writeFile(filePath, html);
  return { imageCount, linkCount };
}

const htmlFiles = await getHtmlFiles(distRoot);
let rewrittenImages = 0;
let rewrittenLinks = 0;

for (const filePath of htmlFiles) {
  const result = await rewriteFile(filePath);
  rewrittenImages += result.imageCount;
  rewrittenLinks += result.linkCount;
}

console.log(`Built image references updated: ${rewrittenImages} images, ${rewrittenLinks} links.`);
