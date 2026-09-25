import type { PortableTextBlock } from '@portabletext/types';

export interface SanityImage {
  asset: { _ref: string; _type?: string };
  alt?: string;
}

export interface SanityPost {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
  publishedAt: string;
  author?: string;
  tags?: string[];
  image?: SanityImage;
  imageAlt?: string;
  body?: PortableTextBlock[];
  locale?: string;
  draft?: boolean;
}

export interface SanityCommonplaceEntry {
  _id: string;
  title?: string;
  type: 'text' | 'photo' | 'video' | 'audio';
  publishedAt: string;
  tags?: string[];
  content?: PortableTextBlock[] | string;
  image?: SanityImage;
  imageAlt?: string;
  videoUrl?: string;
  audioUrl?: string;
  source?: string;
  locale?: string;
  draft?: boolean;
}

export interface NormalizedBlogEntry {
  source: 'local' | 'sanity';
  id: string;
  slug: string;
  title: string;
  description: string;
  publishedAt: Date;
  updatedAt?: Date;
  author: string;
  tags: string[];
  featured?: boolean;
  svgSlug?: string;
  image?: SanityImage | string;
  imageAlt?: string;
  body?: PortableTextBlock[];
  localEntry?: unknown;
}

export interface NormalizedCommonplaceEntry {
  source: 'local' | 'sanity';
  id: string;
  title?: string;
  type: 'text' | 'photo' | 'video' | 'audio';
  publishedAt: Date;
  tags: string[];
  content?: PortableTextBlock[] | string;
  image?: SanityImage | string;
  imageAlt?: string;
  videoUrl?: string;
  audioUrl?: string;
  sourceUrl?: string;
  localEntry?: unknown;
}
