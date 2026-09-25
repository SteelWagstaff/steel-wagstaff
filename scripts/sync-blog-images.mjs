import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourceRoot = path.join(root, 'src', 'content', 'blog', 'en', 'images');
const publicRoot = path.join(root, 'public', 'blog-media');
const mediaExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.pdf', '.png', '.webp']);

const entries = await fs.readdir(sourceRoot, { withFileTypes: true });
let copied = 0;
let skipped = 0;

await fs.mkdir(publicRoot, { recursive: true });

for (const entry of entries) {
  if (!entry.isFile() || !mediaExtensions.has(path.extname(entry.name).toLowerCase())) continue;

  const sourcePath = path.join(sourceRoot, entry.name);
  const publicPath = path.join(publicRoot, entry.name);

  try {
    await fs.access(publicPath);
    skipped += 1;
  } catch {
    await fs.copyFile(sourcePath, publicPath);
    copied += 1;
  }
}

console.log(`Blog image sync complete: ${copied} copied, ${skipped} already present.`);
