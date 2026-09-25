import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const blogRoot = path.join(root, 'src', 'content', 'blog', 'en');
const publicBlogRoot = path.join(root, 'public', 'blog-media');
const optimizedBlogRoot = path.join(root, 'public', '_optimized-images', 'blog-media');

const entries = await fs.readdir(blogRoot, { withFileTypes: true });
let changedFiles = 0;
let rewrittenReferences = 0;
let addedSrcsets = 0;

function optimizedSrcset(fileName) {
  const parsed = path.parse(fileName);
  const originalPath = path.join(publicBlogRoot, fileName);
  const derivativePaths = [640, 1280].map((width) => (
    path.join(optimizedBlogRoot, `${parsed.name}-${width}.webp`)
  ));

  if (!derivativePaths.every((filePath) => exists(filePath)) || !exists(originalPath)) return null;
  return `/_optimized-images/blog-media/${parsed.name}-640.webp 640w, /_optimized-images/blog-media/${parsed.name}-1280.webp 1280w`;
}

function exists(filePath) {
  return Boolean(filePath && existsSync(filePath));
}

for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

  const filePath = path.join(blogRoot, entry.name);
  const original = await fs.readFile(filePath, 'utf8');
  let content = original.replaceAll(/\.\/images\/([^\s"')>]+)/g, (_match, fileName) => {
    rewrittenReferences += 1;
    return `/blog-media/${fileName}`;
  });

  content = content.replace(/\/blog\/([^\s"')>]+\.(?:avif|gif|jpe?g|pdf|png|webp))/gi, '/blog-media/$1');

  content = content.replace(/<img\b([^>]*?)\bsrc="\/blog(?:-media)?\/([^"?#]+)"([^>]*)>/gi, (tag, before, fileName, after) => {
    if (/\bsrcset=/i.test(tag)) return tag;

    const srcset = optimizedSrcset(fileName);
    if (!srcset) return tag;

    addedSrcsets += 1;
    return `<img${before}src="/blog-media/${fileName}" srcset="${srcset}" sizes="100vw"${after}>`;
  });

  if (content !== original) {
    await fs.writeFile(filePath, content);
    changedFiles += 1;
  }
}

console.log(`Blog image references rewritten: ${rewrittenReferences} references in ${changedFiles} files; ${addedSrcsets} srcsets added.`);
