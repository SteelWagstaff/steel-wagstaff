import { defineCollection, z } from 'astro:content';

const commonplaceCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    type: z.enum(['photo', 'audio', 'video', 'quote']),
    content: z.string().optional(),
    publishedAt: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    locale: z.string().default('en'),
    source: z.string().optional(),
  }),
});

const blogCollection = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string().optional(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    locale: z.string().default('en'),
    spotifyPlaylist: z.string().url().optional(),
    image: image().optional(),
    imageAlt: z.string().optional(),
  }),
});

export const collections = {
  commonplace: commonplaceCollection,
  blog: blogCollection,
};
