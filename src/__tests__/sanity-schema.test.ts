import { describe, expect, it } from 'vitest';
import { schema } from '@/sanity/schemaTypes';

describe('Sanity schema', () => {
  it('exports the blog, commonplace, and shared block content types', () => {
    expect(schema.types.map((type) => type.name)).toEqual([
      'blockContent',
      'post',
      'commonplaceEntry',
    ]);
  });

  it('supports all commonplace media types', () => {
    const commonplace = schema.types.find((type) => type.name === 'commonplaceEntry');
    const typeField = (commonplace as { fields?: Array<{ name?: string; options?: { list?: unknown[] } }> } | undefined)
      ?.fields?.find((field) => field.name === 'type');

    expect(typeField?.options?.list).toEqual([
      { title: 'Text', value: 'text' },
      { title: 'Photo', value: 'photo' },
      { title: 'Video', value: 'video' },
      { title: 'Audio', value: 'audio' },
    ]);
  });

  it('supports numbered lists, links, and inline images in Portable Text', () => {
    const blockContent = schema.types.find((type) => type.name === 'blockContent');
    const blockDefinition = blockContent as {
      of?: Array<{
        type?: string;
        lists?: unknown[];
        marks?: { annotations?: Array<{ name?: string }> };
      }>;
    } | undefined;
    const block = blockDefinition?.of?.find((member) => member.type === 'block');

    expect(block?.lists).toEqual([
      { title: 'Bullet', value: 'bullet' },
      { title: 'Numbered', value: 'number' },
    ]);
    expect(block?.marks?.annotations?.map((annotation) => annotation.name)).toContain('link');
    expect(blockDefinition?.of?.map((member) => member.type)).toContain('image');
  });
});
