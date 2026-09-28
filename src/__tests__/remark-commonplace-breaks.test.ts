import { describe, expect, it } from 'vitest';
import { remarkCommonplaceBreaks } from '@/lib/remark-commonplace-breaks';
import type { Paragraph, PhrasingContent, Root } from 'mdast';

const COMMONPLACE = {
  path: '/repo/src/content/commonplace/tu-fu-thatch-house.md',
  history: [],
};

/** Runs the plugin over a single paragraph and returns its rewritten children. */
const run = (children: PhrasingContent[], file = COMMONPLACE): PhrasingContent[] => {
  const paragraph: Paragraph = { type: 'paragraph', children };
  const tree: Root = { type: 'root', children: [paragraph] };
  remarkCommonplaceBreaks()(tree, file);
  return paragraph.children;
};

/** Runs the plugin over several paragraphs, as a real entry would be parsed. */
const runAll = (paragraphs: PhrasingContent[][]): PhrasingContent[][] => {
  const nodes = paragraphs.map((children): Paragraph => ({ type: 'paragraph', children }));
  const tree: Root = { type: 'root', children: nodes };
  remarkCommonplaceBreaks()(tree, COMMONPLACE);
  return nodes.map((node) => node.children);
};

const text = (value: string): PhrasingContent => ({ type: 'text', value });
const br = (): PhrasingContent => ({ type: 'break' });
const html = (value: string): PhrasingContent => ({ type: 'html', value });

describe('remark commonplace breaks', () => {
  it('turns a soft newline into a hard break', () => {
    expect(run([text('one\ntwo')])).toEqual([text('one'), br(), text('two')]);
  });

  it('keeps every line of a stanza', () => {
    expect(run([text('one\ntwo\nthree')])).toEqual([
      text('one'),
      br(),
      text('two'),
      br(),
      text('three'),
    ]);
  });

  it('does not double a raw break that already ends its line', () => {
    expect(run([text('one'), html('<br>'), text('\ntwo')])).toEqual([text('one'), html('<br>'), text('two')]);
  });

  it('keeps a deliberate blank line after a raw break', () => {
    expect(run([text('one'), html('<br>'), text('\n\ntwo')])).toEqual([
      text('one'),
      html('<br>'),
      br(),
      text('two'),
    ]);
  });

  it('leaves text that has no newline untouched', () => {
    expect(run([text('  spaced  ')])).toEqual([text('  spaced  ')]);
  });

  it('leaves other collections with soft wrapping', () => {
    const blog = { path: '/repo/src/content/blog/en/a-post.md', history: [] };
    expect(run([text('one\ntwo')], blog)).toEqual([text('one\ntwo')]);
  });

  it('rewrites every paragraph, not just the first', () => {
    expect(runAll([[text('a1\na2')], [text('b1\nb2')], [text('c1\nc2')]])).toEqual([
      [text('a1'), br(), text('a2')],
      [text('b1'), br(), text('b2')],
      [text('c1'), br(), text('c2')],
    ]);
  });
});
