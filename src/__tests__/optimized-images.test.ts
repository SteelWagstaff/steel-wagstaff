import { describe, expect, it } from 'vitest';
import { getOptimizedImageSources } from '@/lib/optimized-images';

describe('optimized image sources', () => {
  it('builds responsive AVIF and WebP sources from a local image URL', () => {
    expect(getOptimizedImageSources('/commonplace-media/example.jpg')).toEqual({
      avif: [
        '/_optimized-images/commonplace-media/example-640.avif',
        '/_optimized-images/commonplace-media/example-1280.avif',
      ],
      webp: [
        '/_optimized-images/commonplace-media/example-640.webp',
        '/_optimized-images/commonplace-media/example-1280.webp',
      ],
    });
  });
});