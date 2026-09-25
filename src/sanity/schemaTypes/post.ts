import { defineField, defineType } from 'sanity';

export const postType = defineType({
  name: 'post',
  title: 'Blog post',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'description', type: 'text' }),
    defineField({ name: 'publishedAt', type: 'datetime', validation: (rule) => rule.required() }),
    defineField({ name: 'author', type: 'string' }),
    defineField({ name: 'tags', type: 'array', of: [{ type: 'string' }] }),
    defineField({
      name: 'image',
      type: 'image',
      options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: 'Alternative text' }],
    }),
    defineField({ name: 'body', type: 'blockContent' }),
    defineField({ name: 'draft', type: 'boolean', initialValue: false }),
    defineField({ name: 'locale', type: 'string', initialValue: 'en' }),
  ],
  preview: { select: { title: 'title', subtitle: 'author', media: 'image' } },
});
