/**
 * Remark plugin that preserves the line structure of commonplace entries.
 *
 * These entries are often lineated verse, where a newline is part of the text
 * rather than an artefact of how the file happens to be wrapped. CommonMark
 * would fold those newlines into a running paragraph, so two corrections are
 * needed: a raw `<br>` that ends a line must not also collect the newline
 * beneath it, and every remaining newline inside a paragraph has to render as a
 * hard break.
 *
 * Scoped to the commonplace collection so that prose elsewhere keeps the
 * standard soft-wrap behaviour.
 */
import { SKIP, visit } from 'unist-util-visit';
import type { PhrasingContent, Root } from 'mdast';

const RAW_BREAK = /<br\s*\/?>[ \t]*$/i;
const LEADING_NEWLINE_AFTER_BREAK = /^[ \t]*\n[ \t]*/;

interface SourceFile {
  path?: string;
  history: string[];
}

const isCommonplace = (file: SourceFile): boolean =>
  /content[/\\]commonplace[/\\]/.test(file.path ?? file.history[0] ?? '');

/** Returns the text with every newline it contains turned into a break node. */
function withHardBreaks(value: string): PhrasingContent[] {
  const parts = value.split('\n');

  // Nothing to split, so the original spacing is left exactly as authored.
  if (parts.length === 1) return value ? [{ type: 'text', value }] : [];

  const nodes: PhrasingContent[] = [];
  parts.forEach((part, index) => {
    if (index > 0) nodes.push({ type: 'break' });
    const text = part.trim();
    if (text) nodes.push({ type: 'text', value: text });
  });
  return nodes;
}

export function remarkCommonplaceBreaks() {
  return (tree: Root, file: SourceFile) => {
    if (!isCommonplace(file)) return;

    visit(tree, 'paragraph', (node) => {
      const children: PhrasingContent[] = [];
      let afterRawBreak = false;

      for (const child of node.children) {
        if (afterRawBreak) {
          afterRawBreak = false;
          if (child.type === 'text') {
            const value = child.value.replace(LEADING_NEWLINE_AFTER_BREAK, '');
            if (!value) continue;
            children.push(...withHardBreaks(value));
            continue;
          }
        }

        if (child.type === 'html') {
          afterRawBreak = RAW_BREAK.test(child.value);
          children.push(child);
          continue;
        }

        children.push(...(child.type === 'text' ? withHardBreaks(child.value) : [child]));
      }

      node.children = children;

      // The paragraph has been rewritten, so there is nothing left to find
      // inside it. Note that `SKIP` is required here: in this version of the
      // visitor a bare `false` means "stop the whole traversal".
      return SKIP;
    });
  };
}
