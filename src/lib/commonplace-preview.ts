export type CommonplacePreviewBlock =
  | { type: 'text'; html: string }
  | { type: 'hr' };

/** A thematic break: up to 3 leading spaces then 3+ of the same `*`, `-` or `_`. */
const THEMATIC_BREAK = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;

/**
 * A break tag absorbs the newline that follows it. The source line it sits on
 * already ends, so keeping that newline too would open a blank line between
 * what the author wrote as consecutive lines.
 */
const HTML_LINE_BREAK = /<br\s*\/?>[ \t]*\n?/gi;
const HTML_BLOCK_END = /<\/(?:p|div|blockquote|li|h[1-6])\s*>[ \t]*\n?/gi;
const HTML_TAG = /<[^>]*>/g;
const MARKDOWN_IMAGE = /!\[[^\]]*\]\([^)]*\)/g;
/** Heading, blockquote and code-span markers carry no meaning in a flat preview. */
const STRIPPED_MARKS = /[#>`]/g;

/**
 * A run of exactly two or three hyphens, the way the smartypants pass on the
 * post page turns them into an em dash. The lookarounds keep longer runs, and
 * anything but hyphens either side, out of the match.
 */
const EM_DASH_RUN = /(?<!-)-{2,3}(?!-)/g;

const WHITESPACE = /\s/;
const PUNCTUATION = /[\p{P}\p{S}]/u;

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

type Tag = 'em' | 'strong';

/** A single open or close event to emit while serialising a delimiter run. */
type EmitOp =
  | { kind: 'open'; tag: Tag; index: number }
  | { kind: 'close'; tag: Tag; opener: DelimiterSegment; index: number };

interface DelimiterSegment {
  kind: 'delimiter';
  char: string;
  length: number;
  used: number;
  canOpen: boolean;
  canClose: boolean;
  ops: EmitOp[];
}

type Segment = { kind: 'text'; value: string } | DelimiterSegment;

function isWhitespace(char: string | undefined): boolean {
  return char === undefined || WHITESPACE.test(char);
}

function isPunctuation(char: string | undefined): boolean {
  return char !== undefined && PUNCTUATION.test(char);
}

/** Splits a line into plain text and emphasis delimiter runs. */
function tokenize(line: string): Segment[] {
  const segments: Segment[] = [];
  let text = '';

  for (let index = 0; index < line.length; ) {
    const char = line[index];

    if (char !== '*' && char !== '_') {
      text += char;
      index += 1;
      continue;
    }

    let end = index;
    while (end < line.length && line[end] === char) end += 1;

    const before = line[index - 1];
    const after = line[end];
    const beforeIsSpace = isWhitespace(before);
    const afterIsSpace = isWhitespace(after);
    const beforeIsPunct = isPunctuation(before);
    const afterIsPunct = isPunctuation(after);

    const leftFlanking = !afterIsSpace && (!afterIsPunct || beforeIsSpace || beforeIsPunct);
    const rightFlanking = !beforeIsSpace && (!beforeIsPunct || afterIsSpace || afterIsPunct);

    if (text) segments.push({ kind: 'text', value: text });
    text = '';

    segments.push({
      kind: 'delimiter',
      char,
      length: end - index,
      used: 0,
      canOpen: char === '_' ? leftFlanking && (!rightFlanking || beforeIsPunct) : leftFlanking,
      canClose: char === '_' ? rightFlanking && (!leftFlanking || afterIsPunct) : rightFlanking,
      ops: [],
    });

    index = end;
  }

  if (text) segments.push({ kind: 'text', value: text });
  return segments;
}

/**
 * Pairs every closing run with the nearest compatible opening run. Each pair
 * records which tag it emits and which of the opening run's tags it consumes, so
 * the runs can later be serialised as well-formed markup.
 */
function matchDelimiters(segments: Segment[]): void {
  const openers: DelimiterSegment[] = [];

  for (const segment of segments) {
    if (segment.kind !== 'delimiter') continue;

    while (segment.canClose && segment.used < segment.length) {
      let opener: DelimiterSegment | undefined;

      for (let i = openers.length - 1; i >= 0; i -= 1) {
        const candidate = openers[i];
        if (
          candidate.char !== segment.char ||
          !candidate.canOpen ||
          candidate.used >= candidate.length
        ) {
          continue;
        }
        // CommonMark: when a run can both open and close, a sum of run lengths
        // divisible by three is rejected unless both lengths are themselves.
        const straddles =
          (candidate.canOpen && candidate.canClose) || (segment.canOpen && segment.canClose);
        const sum = candidate.length + segment.length;
        if (straddles && sum % 3 === 0 && !(candidate.length % 3 === 0 && segment.length % 3 === 0)) {
          continue;
        }
        opener = candidate;
        break;
      }
      if (!opener) break;

      const use = opener.length - opener.used >= 2 && segment.length - segment.used >= 2 ? 2 : 1;
      const index = opener.ops.length;
      const tag: Tag = use === 2 ? 'strong' : 'em';

      opener.ops.push({ kind: 'open', tag, index });
      segment.ops.push({ kind: 'close', tag, opener, index });
      opener.used += use;
      segment.used += use;

      if (opener.used >= opener.length) openers.splice(openers.indexOf(opener), 1);
    }

    if (segment.canOpen && segment.used < segment.length) openers.push(segment);
  }
}

function renderSegments(segments: Segment[]): string {
  const out: string[] = [];
  const open: Tag[] = [];
  const bases = new Map<DelimiterSegment, number>();

  const closeTo = (depth: number) => {
    while (open.length > depth) out.push(`</${open.pop()!}>`);
  };

  for (const segment of segments) {
    if (segment.kind === 'text') {
      if (segment.value) out.push(escapeHtml(segment.value));
      continue;
    }

    if (segment.ops.length === 0) {
      out.push(escapeHtml(segment.char.repeat(segment.length)));
      continue;
    }

    const openOps = segment.ops.filter((op) => op.kind === 'open');
    const closeOps = segment.ops.filter((op) => op.kind === 'close');
    const literal = segment.length - segment.used;

    // Closers unwind the matching opens, so they run in the order the pairs were
    // made. Opening runs nest outermost-first, so a run that emitted several
    // tags unwinds its last one first.
    for (const op of closeOps) {
      if (op.kind !== 'close') continue;
      const opened = op.opener.ops.filter((other) => other.kind === 'open').length;
      const slot = (bases.get(op.opener) ?? open.length) + (opened - 1 - op.index);
      closeTo(slot + 1);
      out.push(`</${op.tag}>`);
      open.pop();
    }

    // Whatever the run did not consume keeps its original place: ahead of the
    // tag when the run opens, behind it when the run only closes.
    if (literal > 0) out.push(escapeHtml(segment.char.repeat(literal)));

    if (openOps.length > 0) bases.set(segment, open.length);
    for (const [slot, op] of [...openOps].reverse().entries()) {
      if (op.kind !== 'open') continue;
      closeTo((bases.get(segment) ?? 0) + slot);
      out.push(`<${op.tag}>`);
      open.push(op.tag);
    }
  }

  closeTo(0);
  return out.join('');
}

function renderEmphasis(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      const segments = tokenize(line);
      matchDelimiters(segments);
      return renderSegments(segments);
    })
    .join('\n');
}

export function buildCommonplacePreview(source: string): CommonplacePreviewBlock[] {
  const lines = source
    .replace(/\r\n?/g, '\n')
    .replace(HTML_LINE_BREAK, '\n')
    .replace(HTML_BLOCK_END, '\n')
    .replace(HTML_TAG, '')
    .replace(MARKDOWN_IMAGE, '')
    .replace(STRIPPED_MARKS, '')
    .split('\n');

  const blocks: CommonplacePreviewBlock[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length === 0) return;
    const html = renderEmphasis(paragraph.join('\n').replace(/\n{3,}/g, '\n\n').trim());
    paragraph = [];
    if (html) blocks.push({ type: 'text', html });
  };

  for (const line of lines) {
    if (THEMATIC_BREAK.test(line)) {
      flush();
      if (blocks[blocks.length - 1]?.type !== 'hr') blocks.push({ type: 'hr' });
      continue;
    }
    // A thematic break is settled above, so the dashes left here are punctuation.
    paragraph.push(line.replace(/[ \t]+/g, ' ').replace(EM_DASH_RUN, '—'));
  }
  flush();

  while (blocks[0]?.type === 'hr') blocks.shift();
  while (blocks[blocks.length - 1]?.type === 'hr') blocks.pop();

  return blocks;
}

/** Emphasis markup emitted by {@link buildCommonplacePreview}, and nothing else. */
const EMPHASIS_MARKUP = /<\/?(?:strong|em)>/g;

/**
 * Flattens an entry to plain text for syndication: no markup, thematic breaks
 * become an em dash, and the first `maxBlocks` blocks only.
 */
export function buildCommonplaceText(source: string, maxBlocks = 2): string {
  return buildCommonplacePreview(source)
    .slice(0, maxBlocks)
    .map((block) =>
      block.type === 'hr'
        ? '—'
        : block.html
            .replace(EMPHASIS_MARKUP, '')
            .replace(/&gt;/g, '>')
            .replace(/&lt;/g, '<')
            .replace(/&amp;/g, '&')
            .trim()
    )
    .filter(Boolean)
    .join('\n\n');
}
