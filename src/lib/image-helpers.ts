/**
 * Resolves an image path from content frontmatter to a URL
 * Handles relative paths like "../../assets/music/filename.jpg" or "../../assets/podcasts/filename.jpg"
 */
export function resolveImageUrl(imagePath: string | undefined): string | undefined {
  if (!imagePath) return undefined;
  
  // Extract filename from relative path
  const filename = imagePath.split('/').pop();
  if (!filename) return undefined;
  
  // For podcast images, return the public path (stored in public/music/podcasts/)
  if (imagePath.includes('assets/podcasts/')) {
    return `/music/podcasts/${filename}`;
  }
  
  // For music images, return the public path
  if (imagePath.includes('assets/music/')) {
    return `/music/${filename}`;
  }
  
  return imagePath;
}
