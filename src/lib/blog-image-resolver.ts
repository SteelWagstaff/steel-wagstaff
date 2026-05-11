import type { ImageMetadata } from 'astro';

// Import all blog images as a glob
const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/blog/*.{jpg,jpeg,png,gif,webp}',
  { eager: true }
);

// Create a map of filename -> ImageMetadata
const imageMap: Record<string, ImageMetadata> = {};

for (const [path, module] of Object.entries(images)) {
  // Extract filename from path (e.g., "/src/assets/blog/image.jpg" -> "image.jpg")
  const filename = path.split('/').pop();
  if (filename && module.default) {
    imageMap[filename] = module.default;
  }
}

/**
 * Resolve a blog image filename to its imported ImageMetadata
 * @param filename - The filename (e.g., "my-image.jpg")
 * @returns The ImageMetadata or undefined if not found
 */
export function resolveBlogImage(filename?: string): ImageMetadata | undefined {
  if (!filename) return undefined;
  return imageMap[filename];
}

export { imageMap };
