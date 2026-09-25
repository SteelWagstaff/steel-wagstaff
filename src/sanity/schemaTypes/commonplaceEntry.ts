import { defineField, defineType } from 'sanity';

export const commonplaceEntryType = defineType({
  name: 'commonplaceEntry',
  title: 'Commonplace entry',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string' }),
    defineField({
      name: 'type',
      type: 'string',
      options: {
        list: [
          { title: 'Text', value: 'text' },
          { title: 'Photo', value: 'photo' },
          { title: 'Video', value: 'video' },
          { title: 'Audio', value: 'audio' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'publishedAt', type: 'datetime', validation: (rule) => rule.required() }),
    defineField({ name: 'tags', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'content', type: 'blockContent' }),
    defineField({
      name: 'image',
      type: 'image',
      options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: 'Alternative text' }],
    }),
    defineField({ name: 'videoUrl', type: 'url' }),
    defineField({ name: 'audioUrl', type: 'url' }),
    defineField({ name: 'source', type: 'string' }),
    defineField({ name: 'draft', type: 'boolean', initialValue: false }),
    defineField({ name: 'locale', type: 'string', initialValue: 'en' }),
  ],
  preview: { select: { title: 'title', subtitle: 'type', media: 'image' } },
});
