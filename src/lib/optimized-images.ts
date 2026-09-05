const OPTIMIZED_IMAGE_ROOT = '/_optimized-images';
export const OPTIMIZED_IMAGE_WIDTHS = [640, 1280] as const;

interface OptimizedImageSources {
  avif: string[];
  webp: string[];
}

export function getOptimizedImageSources(source: string): OptimizedImageSources {
  const cleanSource = source.split(/[?#]/, 1)[0].replace(/^\/+/, '');
  const extensionIndex = cleanSource.lastIndexOf('.');
  const sourceWithoutExtension = extensionIndex === -1 ? cleanSource : cleanSource.slice(0, extensionIndex);

  const getSources = (extension: string) =>
    OPTIMIZED_IMAGE_WIDTHS.map(
      (width) => `${OPTIMIZED_IMAGE_ROOT}/${sourceWithoutExtension}-${width}.${extension}`
    );

  return {
    avif: getSources('avif'),
    webp: getSources('webp'),
  };
}