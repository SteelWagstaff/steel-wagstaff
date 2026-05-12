import type { ImageMetadata } from 'astro';

// Import all music images as a glob
const musicImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/music/*.{jpg,jpeg,png,gif,webp}',
  { eager: true }
);

// Import all podcast images as a glob
const podcastImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/podcasts/*.{jpg,jpeg,png,gif,webp}',
  { eager: true }
);

// Create maps of filename -> ImageMetadata
const musicImageMap: Record<string, ImageMetadata> = {};
const podcastImageMap: Record<string, ImageMetadata> = {};

for (const [path, module] of Object.entries(musicImages)) {
  const filename = path.split('/').pop();
  if (filename && module.default) {
    musicImageMap[filename] = module.default;
  }
}

for (const [path, module] of Object.entries(podcastImages)) {
  const filename = path.split('/').pop();
  if (filename && module.default) {
    podcastImageMap[filename] = module.default;
  }
}

/**
 * Resolve a music or podcast image path to its imported ImageMetadata
 * Handles relative paths like "../../../assets/music/filename.jpg"
 * @param imagePath - The image path from frontmatter
 * @returns The ImageMetadata or undefined if not found
 */
export function resolveMusicImage(imagePath?: string): ImageMetadata | string | undefined {
  if (!imagePath) return undefined;
  
  // If it's already an absolute path, return as-is
  if (imagePath.startsWith('/')) {
    return imagePath;
  }
  
  // Extract the filename from relative paths like "../../../assets/music/show-21-holiday-music.jpg"
  const filename = imagePath.split('/').pop();
  if (!filename) return undefined;
  
  // Try to determine the asset type from the path and look it up
  if (imagePath.includes('/assets/music/')) {
    return musicImageMap[filename] || undefined;
  } else if (imagePath.includes('/assets/podcasts/')) {
    return podcastImageMap[filename] || undefined;
  }
  
  // Default to checking music assets first, then podcasts
  return musicImageMap[filename] || podcastImageMap[filename];
}

export { musicImageMap, podcastImageMap };
